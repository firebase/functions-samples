/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const opentelemetry = require("@opentelemetry/api");
const { Timer } = require("./timer");

initializeApp();
const db = getFirestore();

/**
 * Divide an array into chunks of `chunkSize`
 * @param {any[]} arr
 * @param {Number} chunkSize
 * @return {Array<Array<any>>}
 */
function sliceIntoChunks(arr, chunkSize) {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
}

/**
 * Get prices for all products in `productIds` array
 * @param {string[]} productIds
 * @return {number}
 */
async function calculatePrice(productIds) {
  const timer = new Timer();
  let totalUsd = 0;
  const products = await db.getAll(
    ...productIds.map((id) => db.doc(`products/${id}`)),
  );
  for (const product of products) {
    totalUsd += product.data()?.usd || 0;
  }
  logger.info("calculatePrice", { calcPriceMs: timer.measureMs() });
  return totalUsd;
}

/**
 * Sum discounts of all `productIds`
 * @param {string[]} productIds
 * @return {number}
 */
async function calculateDiscount(productIds) {
  const timer = new Timer();

  let discountUsd = 0;
  const processConcurrently = sliceIntoChunks(productIds, 10).map(
    async (productIds) => {
      const discounts = await db
        .collection("discounts")
        .where("products", "array-contains-any", productIds)
        .get();
      for (const discount of discounts.docs) {
        discountUsd += discount.data().usd || 0;
      }
    },
  );
  await Promise.all(processConcurrently);
  logger.info("calculateDiscount", { calcDiscountMs: timer.measureMs() });
  return discountUsd;
}

exports.calculatetotal = onCall(async (req) => {
  const { productIds } = req.data;

  let totalUsd = 0;
  const tracer = opentelemetry.trace.getTracer();
  await tracer.startActiveSpan("calculatePrice", async (span) => {
    totalUsd = await calculatePrice(productIds);
    span.end();
  });
  await tracer.startActiveSpan("calculateDiscount", async (span) => {
    totalUsd -= await calculateDiscount(productIds);
    span.end();
  });
  return { totalUsd };
});
