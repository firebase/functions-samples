# Copyright 2023 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START storageImports]
# [START storageAdditionalImports]
import io
import pathlib

from PIL import Image

from firebase_admin import initialize_app
initialize_app()
from firebase_admin import storage
# [END storageAdditionalImports]

# [START storageSDKImport]
from firebase_functions import storage_fn
# [END storageSDKImport]
# [END storageImports]


# [START storageGenerateThumbnail]
# When an image is uploaded in the Storage bucket,
# generate a thumbnail automatically using Pillow.
# [START storageGenerateThumbnailTrigger]
@storage_fn.on_object_finalized()
def generatethumbnail(event: storage_fn.CloudEvent[storage_fn.StorageObjectData]):
# [END storageGenerateThumbnailTrigger]

    # [START storageEventAttributes]
    bucket_name = event.data.bucket
    file_path = pathlib.PurePath(event.data.name)
    content_type = event.data.content_type
    # [END storageEventAttributes]

    # [START storageStopConditions]
    # Exit if this is triggered on a file that is not an image.
    if not content_type or not content_type.startswith("image/"):
        print(f"This is not an image. ({content_type})")
        return

    # Exit if the image is already a thumbnail.
    if file_path.name.startswith("thumb_"):
        print("Already a thumbnail.")
        return
    # [END storageStopConditions]

    # [START storageThumbnailGeneration]
    bucket = storage.bucket(bucket_name)

    image_blob = bucket.blob(str(file_path))
    image_bytes = image_blob.download_as_bytes()
    image = Image.open(io.BytesIO(image_bytes))

    image.thumbnail((200, 200))
    thumbnail_io = io.BytesIO()
    image.save(thumbnail_io, format="png")
    thumbnail_path = file_path.parent / pathlib.PurePath(
        f"thumb_{file_path.stem}.png"
    )
    thumbnail_blob = bucket.blob(str(thumbnail_path))
    thumbnail_blob.upload_from_string(
        thumbnail_io.getvalue(), content_type="image/png"
    )
    # [END storageThumbnailGeneration]
# [END storageGenerateThumbnail]
