import 'dart:typed_data';

import 'package:firebase_admin_sdk/firebase_admin_sdk.dart';
import 'package:firebase_functions/firebase_functions.dart';
import 'package:google_cloud_storage/google_cloud_storage.dart';
import 'package:googleapis/storage/v1.dart';
import 'package:image/image.dart';

final defaultWidth = defineInt(
  'DEFAULT_WIDTH',
  ParamOptions<int>(defaultValue: 300),
);

// Lazily initialize the default app when needed to avoid duplication.
FirebaseApp? _app;
FirebaseApp get app {
  _app ??= FirebaseApp.initializeApp();
  return _app!;
}

void main(List<String> args) async {
  await fireUp(args, (firebase) {
    firebase.https.onRequest(name: 'imageOptimizer', (request) async {
      final pathSegments = request.url.pathSegments;
      if (pathSegments.isEmpty || pathSegments.last.isEmpty) {
        return Response(
          400,
          body: 'Missing storage object ID in the request path.',
        );
      }
      final storageObjectId = pathSegments.join('/');

      final queryParams = request.url.queryParameters;
      final width = queryParams.containsKey('width')
          ? (int.tryParse(queryParams['width']!) ?? defaultWidth.value())
          : defaultWidth.value();
      final height = queryParams.containsKey('height')
          ? int.tryParse(queryParams['height']!)
          : null;

      if (width <= 0) {
        return Response(400, body: 'Invalid width parameter.');
      }

      final bucket = app.storage().bucket();

      final cachedFileName = height == null
          ? 'image-optimizer-cache/${width}w-$storageObjectId'
          : 'image-optimizer-cache/${width}w-${height}h-$storageObjectId';

      try {
        await bucket.storage.objectMetadata(bucket.name, cachedFileName);
        final downloadUrl = await app.storage().getDownloadURL(
          bucket,
          cachedFileName,
        );
        return Response.movedPermanently(downloadUrl);
      } on DetailedApiRequestError catch (e) {
        if (e.status != 404) {
          rethrow;
        }
      }

      // Download original image
      List<int> originalBytes;
      try {
        originalBytes = await bucket.storage.downloadObject(
          bucket.name,
          storageObjectId,
        );
      } on DetailedApiRequestError catch (e) {
        if (e.status == 404) {
          return Response(404, body: 'Original image not found.');
        }
        rethrow;
      }

      // Decode image
      final originalImage = decodeImage(Uint8List.fromList(originalBytes));
      if (originalImage == null) {
        return Response(400, body: 'Failed to decode original image.');
      }

      // Resize image
      final resizedImage = copyResize(
        originalImage,
        width: width,
        height: height,
        maintainAspect: true,
      );

      // Encode image
      final encodedBytes = encodeNamedImage(storageObjectId, resizedImage);
      if (encodedBytes == null) {
        return Response(500, body: 'Failed to encode resized image.');
      }

      // Upload resized image
      await bucket.storage.uploadObject(
        bucket.name,
        cachedFileName,
        encodedBytes,
        metadata: ObjectMetadata(cacheControl: 'public, max-age=86400'),
      );

      // Return download URL
      final downloadUrl = await app.storage().getDownloadURL(
        bucket,
        cachedFileName,
      );
      return Response.movedPermanently(downloadUrl);
    });
  });
}
