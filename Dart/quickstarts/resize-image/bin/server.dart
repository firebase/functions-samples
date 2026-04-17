import 'dart:typed_data';

import 'package:google_cloud_storage/google_cloud_storage.dart'
    show ObjectMetadata, NotFoundException;
import 'package:firebase_functions/firebase_functions.dart';
import 'package:image/image.dart';

final defaultWidth = defineInt(
  'DEFAULT_WIDTH',
  ParamOptions<int>(defaultValue: 300),
);

void main(List<String> args) async {
  await fireUp(args, (firebase) {
    /// An https function that resizes images in Cloud Storage.
    /// It creates a separate Storage folder to cache stored images
    /// so that it does not need to resize an image twice.
    ///
    /// It returns an HTTP redirect to the public Storage download URL.
    ///
    /// The query params it accepts are:
    /// - image: the image file path in Cloud Storage
    /// - width (optional): the width in pixels to resize to
    ///
    /// Example call: https://<function-url>?image=myFile.png&width=400
    firebase.https.onRequest(name: 'imageOptimizer', (request) async {
      // Parse arguments from query params in the URL
      final queryParams = request.url.queryParameters;
      final imageFileName = queryParams['image'];
      if (imageFileName == null) {
        throw InvalidArgumentError(
          'No image provided. Include the image file name as a query param.',
        );
      }
      var width = int.tryParse(queryParams['width'] ?? "");
      if (width == null) {
        logger.info(
          'Cloud not parse width from query params. Using default width.',
        );
        width = defaultWidth.value();
      }

      // Get the storage bucket from the built-in parameter
      // https://firebase.google.com/docs/functions/config-env#built-in-parameters
      final bucketName = storageBucket.value();
      final bucket = firebase.adminApp.storage().bucket(bucketName);

      // Return early if the image has been resized before
      final cachedFileName = 'image-optimizer-cache/${width}w-${imageFileName}';
      try {
        await bucket.storage.objectMetadata(bucketName, cachedFileName);
        final downloadUrl = await firebase.adminApp.storage().getDownloadURL(
          bucket,
          cachedFileName,
        );
        logger.log('Cache hit. Using existing resized image.');
        return Response.movedPermanently(downloadUrl);
      } on NotFoundException {
        logger.log('Cache miss. Resizing image to width ${width}');
      }

      // Download original image
      List<int> originalBytes;
      try {
        originalBytes = await bucket.storage.downloadObject(
          bucket.name,
          imageFileName,
        );
      } on NotFoundException {
        throw InvalidArgumentError(
          'Image ${imageFileName} does not exist in bucket ${bucketName}.',
        );
      }

      // Decode image
      final originalImage = decodeImage(Uint8List.fromList(originalBytes));
      if (originalImage == null) {
        throw InvalidArgumentError(
          'Failed to decode image. Are you sure it was an image file?',
        );
      }

      // Resize if needed
      var encodedBytes;
      if (originalImage.width >= width) {
        final resizedImage = copyResize(
          originalImage,
          width: width,
          maintainAspect: true,
        );
        encodedBytes = encodeNamedImage(imageFileName, resizedImage);
        if (encodedBytes == null) {
          throw InternalError('Failed to encode resized image.');
        }
      } else {
        logger.info(
          'Image is already smaller than the requested width. No need to resize.',
        );
        encodedBytes = originalBytes;
      }

      // Upload resized image to cache directory
      await bucket.storage.uploadObject(
        bucket.name,
        cachedFileName,
        encodedBytes,
        // Tell clients to cache the resized image to reduce repeat requests
        metadata: ObjectMetadata(cacheControl: 'public, max-age=86400'),
      );

      // Return download URL
      final downloadUrl = await firebase.adminApp.storage().getDownloadURL(
        bucket,
        cachedFileName,
      );
      return Response.movedPermanently(downloadUrl);
    });
  });
}
