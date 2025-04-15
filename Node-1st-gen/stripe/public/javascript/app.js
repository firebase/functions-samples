/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const STRIPE_PUBLISHABLE_KEY = "<YOUR STRIPE PUBLISHABLE KEY>";
let currentUser = {};
let customerData = {};

/**
 * Firebase auth configuration
 */
const firebaseUI = new firebaseui.auth.AuthUI(firebase.auth());
const firebaseUiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return true;
    },
    uiShown: () => {
      document.getElementById("loader").style.display = "none";
    },
  },
  signInFlow: "popup",
  signInSuccessUrl: "/",
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  // Your terms of service url.
  tosUrl: "https://example.com/terms",
  // Your privacy policy url.
  privacyPolicyUrl: "https://example.com/privacy",
};
firebase.auth().onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    currentUser = firebaseUser;
    firebase
      .firestore()
      .collection("stripe_customers")
      .doc(currentUser.uid)
      .onSnapshot((snapshot) => {
        if (snapshot.data()) {
          customerData = snapshot.data();
          startDataListeners();
          document.getElementById("loader").style.display = "none";
          document.getElementById("content").style.display = "block";
        } else {
          console.warn(
            `No Stripe customer found in Firestore for user: ${currentUser.uid}`,
          );
        }
      });
  } else {
    document.getElementById("content").style.display = "none";
    firebaseUI.start("#firebaseui-auth-container", firebaseUiConfig);
  }
});

/**
 * Set up Stripe Elements
 */
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
const elements = stripe.elements();
const cardElement = elements.create("card");
cardElement.mount("#card-element");
cardElement.on("change", ({ error }) => {
  const displayError = document.getElementById("error-message");
  if (error) {
    displayError.textContent = error.message;
  } else {
    displayError.textContent = "";
  }
});

/**
 * Set up Firestore data listeners
 */
function startDataListeners() {
  /**
   * Get all payment methods for the logged in customer
   */
  firebase
    .firestore()
    .collection("stripe_customers")
    .doc(currentUser.uid)
    .collection("payment_methods")
    .onSnapshot((snapshot) => {
      if (snapshot.empty) {
        document.querySelector("#add-new-card").open = true;
      }
      snapshot.forEach(function (doc) {
        const paymentMethod = doc.data();
        if (!paymentMethod.card) {
          return;
        }

        const optionId = `card-${doc.id}`;
        let optionElement = document.getElementById(optionId);

        // Add a new option if one doesn't exist yet.
        if (!optionElement) {
          optionElement = document.createElement("option");
          optionElement.id = optionId;
          document
            .querySelector("select[name=payment-method]")
            .appendChild(optionElement);
        }

        optionElement.value = paymentMethod.id;
        optionElement.text = `${paymentMethod.card.brand} •••• ${paymentMethod.card.last4} | Expires ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`;
      });
    });

  /**
   * Get all payments for the logged in customer
   */
  firebase
    .firestore()
    .collection("stripe_customers")
    .doc(currentUser.uid)
    .collection("payments")
    .onSnapshot((snapshot) => {
      snapshot.forEach((doc) => {
        const payment = doc.data();

        let liElement = document.getElementById(`payment-${doc.id}`);
        if (!liElement) {
          liElement = document.createElement("li");
          liElement.id = `payment-${doc.id}`;
        }

        let content = "";
        if (
          payment.status === "new" ||
          payment.status === "requires_confirmation"
        ) {
          content = `Creating Payment for ${formatAmount(
            payment.amount,
            payment.currency,
          )}`;
        } else if (payment.status === "succeeded") {
          const card = payment.charges.data[0].payment_method_details.card;
          content = `✅ Payment for ${formatAmount(
            payment.amount,
            payment.currency,
          )} on ${card.brand} card •••• ${card.last4}.`;
        } else if (payment.status === "requires_action") {
          content = `🚨 Payment for ${formatAmount(
            payment.amount,
            payment.currency,
          )} ${payment.status}`;
          handleCardAction(payment, doc.id);
        } else {
          content = `⚠️ Payment for ${formatAmount(
            payment.amount,
            payment.currency,
          )} ${payment.status}`;
        }
        liElement.innerText = content;
        document.querySelector("#payments-list").appendChild(liElement);
      });
    });
}

/**
 * Event listeners
 */

// Signout button
document
  .getElementById("signout")
  .addEventListener("click", () => firebase.auth().signOut());

// Add new card form
document
  .querySelector("#payment-method-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!event.target.reportValidity()) {
      return;
    }
    document
      .querySelectorAll("button")
      .forEach((button) => (button.disabled = true));

    const form = new FormData(event.target);
    const cardholderName = form.get("name");

    const { setupIntent, error } = await stripe.confirmCardSetup(
      customerData.setup_secret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        },
      },
    );

    if (error) {
      document.querySelector("#error-message").textContent = error.message;
      document
        .querySelectorAll("button")
        .forEach((button) => (button.disabled = false));
      return;
    }

    await firebase
      .firestore()
      .collection("stripe_customers")
      .doc(currentUser.uid)
      .collection("payment_methods")
      .add({ id: setupIntent.payment_method });

    document.querySelector("#add-new-card").open = false;
    document
      .querySelectorAll("button")
      .forEach((button) => (button.disabled = false));
  });

// Create payment form
document
  .querySelector("#payment-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    document
      .querySelectorAll("button")
      .forEach((button) => (button.disabled = true));

    const form = new FormData(event.target);
    const amount = Number(form.get("amount"));
    const currency = form.get("currency");
    const data = {
      payment_method: form.get("payment-method"),
      currency,
      amount: formatAmountForStripe(amount, currency),
      status: "new",
    };

    await firebase
      .firestore()
      .collection("stripe_customers")
      .doc(currentUser.uid)
      .collection("payments")
      .add(data);

    document
      .querySelectorAll("button")
      .forEach((button) => (button.disabled = false));
  });

/**
 * Helper functions
 */

// Format amount for diplay in the UI
function formatAmount(amount, currency) {
  amount = zeroDecimalCurrency(amount, currency)
    ? amount
    : (amount / 100).toFixed(2);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

// Format amount for Stripe
function formatAmountForStripe(amount, currency) {
  return zeroDecimalCurrency(amount, currency)
    ? amount
    : Math.round(amount * 100);
}

// Check if we have a zero decimal currency
// https://stripe.com/docs/currencies#zero-decimal
function zeroDecimalCurrency(amount, currency) {
  let numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  for (let part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency;
}

// Handle card actions like 3D Secure
async function handleCardAction(payment, docId) {
  const { error, paymentIntent } = await stripe.handleCardAction(
    payment.client_secret,
  );
  if (error) {
    alert(error.message);
    payment = error.payment_intent;
  } else if (paymentIntent) {
    payment = paymentIntent;
  }

  await firebase
    .firestore()
    .collection("stripe_customers")
    .doc(currentUser.uid)
    .collection("payments")
    .doc(docId)
    .set(payment, { merge: true });
}
