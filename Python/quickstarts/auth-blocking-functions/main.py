# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from firebase_admin import auth, firestore, initialize_app
from firebase_functions import identity_fn, https_fn

import google.cloud.firestore

initialize_app()


# [START created_noop]
@identity_fn.before_user_created()
def created_noop(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
    return
# [END created_noop]


# [START signedin_noop]
@identity_fn.before_user_signed_in()
def signedin_noop(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeSignInResponse | None:
    return
# [END signedin_noop]


# [START v2ValidateNewUser]
# [START v2beforeCreateFunctionTrigger]
# Block account creation with any non-acme email address.
@identity_fn.before_user_created()
def validatenewuser(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
# [END v2beforeCreateFunctionTrigger]
    # [START v2readUserData]
    # User data passed in from the CloudEvent.
    user = event.data
    # [END v2readUserData]

    # [START v2domainHttpsError]
    # Only users of a specific domain can sign up.
    if user.email is None or "@acme.com" not in user.email:
        # Return None so that Firebase Auth rejects the account creation.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="Unauthorized email",
        )
    # [END v2domainHttpsError]
# [END v2ValidateNewUser]


# [START setdefaultname]
@identity_fn.before_user_created()
def setdefaultname(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
    return identity_fn.BeforeCreateResponse(
        # If no display name is provided, set it to "Guest".
        display_name=event.data.display_name
        if event.data.display_name is not None
        else "Guest"
    )
# [END setdefaultname]


# [START requireverified]
@identity_fn.before_user_created()
def requireverified(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
    if event.data.email is not None and not event.data.email_verified:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="You must register using a trusted provider.",
        )
# [END requireverified]


def send_verification_email_using_your_smtp_server(email, link):
    return


# TODO: Should really be non-blocking or client-side call.
# [START sendverification]
@identity_fn.before_user_created()
def sendverification(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
    if event.data.email is not None and not event.data.email_verified:
        link = auth.generate_email_verification_link()
        send_verification_email_using_your_smtp_server(event.data.email, link)
# [END sendverification]


# [START requireverifiedsignin]
@identity_fn.before_user_signed_in()
def requireverifiedsignin(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeSignInResponse | None:
    if event.data.email is not None and not event.data.email_verified:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="You must verify your email address before signing in.",
        )
# [END requireverifiedsignin]


# [START trustfacebook]
@identity_fn.before_user_created()
def markverified(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
    if event.data.email is not None and "@facebook.com" in event.data.email:
        return identity_fn.BeforeSignInResponse(email_verified=True)
# [END trustfacebook]


def is_suspicious(ip_address):
    return True


# [START ipban]
@identity_fn.before_user_signed_in()
def ipban(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeSignInResponse | None:
    if is_suspicious(event.ip_address):
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
            message="IP banned.",
        )
# [END ipban]


# [START customclaims]
@identity_fn.before_user_created()
def setemployeeid(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
    if (event.credential is not None and
            event.credential.provider_id == "saml.my-provider-id"):
        return identity_fn.BeforeCreateResponse(
            custom_claims={"eid": event.credential.claims["employeeid"]})


@identity_fn.before_user_signed_in()
def copyclaimstosession(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeSignInResponse | None:
    if (event.credential is not None and
            event.credential.provider_id == "saml.my-provider-id"):
        return identity_fn.BeforeSignInResponse(
            session_claims={
                "role": event.credential.claims["role"],
                "groups": event.credential.claims["groups"],
            }
        )
# [END customclaims]


# [START logip]
@identity_fn.before_user_signed_in()
def logip(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeSignInResponse | None:
    return identity_fn.BeforeSignInResponse(
        session_claims={"signInIpAddress": event.ip_address}
    )
# [END logip]


def analyze_photo_with_ml(url):
    return 0.42


THRESHOLD = 0.7
PLACEHOLDER_URL = ""


# [START sanitizeprofilephoto]
@identity_fn.before_user_created()
def sanitizeprofilephoto(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
    if event.data.photo_url is not None:
        score = analyze_photo_with_ml(event.data.photo_url)
        if score > THRESHOLD:
            return identity_fn.BeforeCreateResponse(photo_url=PLACEHOLDER_URL)
# [END sanitizeprofilephoto]


# [START v2CheckForBan]
# [START v2beforeSignInFunctionTrigger]
# Block account sign in with any banned account.
@identity_fn.before_user_signed_in()
def checkforban(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeSignInResponse | None:
    # [END v2beforeSignInFunctionTrigger]
    # [START v2readEmailData]
    # Email passed from the CloudEvent.
    email = event.data.email if event.data.email is not None else ""
    # [END v2readEmailData]

    # [START v2documentGet]
    # Obtain a document in Firestore of the banned email address.
    firestore_client: google.cloud.firestore.Client = firestore.client()
    doc = firestore_client.collection("banned").document(email).get()
    # [END v2documentGet]

    # [START v2bannedHttpsError]
    # Checking that the document exists for the email address.
    if doc.exists:
        # Throw an HttpsError so that Firebase Auth rejects the account sign in.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="Unauthorized email",
        )
    # [END v2bannedHttpsError]
# [END v2CheckForBan]
