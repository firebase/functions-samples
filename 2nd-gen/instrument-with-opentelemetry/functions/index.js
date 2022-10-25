const {onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const opentelemetry = require('@opentelemetry/api');
const {Timer} = require("./timer");

initializeApp();
const db = getFirestore();

function sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}

async function calculatePrice(productIds) {
    const timer = new Timer();
    let totalUsd = 0;
    const products = await db.getAll(...productIds.map(id => db.doc(`products/${id}`)));
    for (const product of products) {
        totalUsd += product.data()?.usd || 0;
    }
    logger.info("calculatePrice", {calcPriceMs: timer.measureMs()});
    return totalUsd;
}

async function calculateDiscount(productIds) {
    const timer = new Timer();

    let discountUsd = 0;
    const processConcurrently = sliceIntoChunks(productIds, 10)
        .map(async (productIds) => {
            const discounts = await db.collection("discounts")
                .where("products", "array-contains-any", productIds)
                .get();
            for (const discount of discounts.docs) {
                discountUsd += discount.data().usd || 0;
            }
        });
    await Promise.all(processConcurrently);
    logger.info("calculateDiscount", {calcDiscountMs: timer.measureMs()});
    return discountUsd;
}

exports.calculatetotal = onCall(async (req) => {
    const {productIds} = req.data;

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
    return {totalUsd};
});
