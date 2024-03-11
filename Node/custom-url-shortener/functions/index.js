const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.listAllRedirects = onRequest(async (request, response) => {
  result = await getFirestore().collection("links").get();

  response.type("json");
  response.send(
    JSON.stringify(
      result.docs.map((docSnap) => docSnap.data()),
      null,
      2
    )
  );
});

exports.redirectToFullURL = onRequest(async (request, response) => {
  const shortLink = request.path.split("/")[1];

  if (!shortLink) {
    response.status(404).send(`Invalid shortlink "${request.path}"`);
    logger.info(`Invalid shortlink "${request.path}"`);
    return;
  }

  const result = await getFirestore()
    .collection("links")
    .where("shortUrl", "==", request.path.split("/")[1])
    .get();

  if (result.docs.length === 0) {
    response.status(404).send(`No entry found for shortlink "${shortLink}"`);
    logger.info(`No entry found for shortlink "${shortLink}"`);
    return;
  } else if (result.docs.length > 1) {
    response.status(500).send(
      `Found too many URLs. Something is wrong`,
      result.docs.map((docSnap) => docSnap.ref.id)
    );
    return;
  }
  const redirectUrl = result.docs[0].data().longUrl;

  logger.info("redirect");
  response.redirect(301, redirectUrl);
});

exports.shortenUrl = onDocumentCreated(
  "links/{linkid}",
  async (event, params) => {
    const hash = (Math.random() + 1).toString(36).substring(7);

    // check if the URL is valid
    try {
      new URL(event.data.data().longUrl);
    } catch {
      logger.error(
        `invalid URL "${event.data.data().longUrl}"`,
        event.data.data()
      );
      return;
    }

    await event.data.ref.update({ shortUrl: hash });
    logger.info(`created shortlink`, {
      documentId: params.linkid,
      longUrl: event.data.data().longUrl,
      shortLink: hash,
    });
  }
);
