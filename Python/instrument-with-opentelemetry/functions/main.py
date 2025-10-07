# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law-or-agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import asyncio
import time
from firebase_admin import initialize_app, firestore
from firebase_functions import https_fn
from opentelemetry import trace

# This must be imported before any other modules that need to be instrumented.
import tracing

initialize_app()
db = firestore.client()
tracer = trace.get_tracer(__name__)


class Timer:
    def __init__(self):
        self.start_time = time.time()

    def measure_ms(self):
        return (time.time() - self.start_time) * 1000


def slice_into_chunks(arr, chunk_size):
    res = []
    for i in range(0, len(arr), chunk_size):
        chunk = arr[i: i + chunk_size]
        res.append(chunk)
    return res


async def calculate_price(product_ids):
    timer = Timer()
    total_usd = 0
    products = await asyncio.gather(
        *[db.document(f"products/{id}").get() for id in product_ids]
    )
    for product in products:
        total_usd += product.to_dict().get("usd", 0)
    print(f"calculatePrice: {timer.measure_ms()}ms")
    return total_usd


async def calculate_discount(product_ids):
    timer = Timer()

    async def _get_discounts(chunk):
        total = 0
        docs = db.collection("discounts").where("products", "array-contains-any", chunk).stream()
        async for doc in docs:
            total += doc.to_dict().get("usd", 0)
        return total

    tasks = [_get_discounts(chunk) for chunk in slice_into_chunks(product_ids, 10)]
    results = await asyncio.gather(*tasks)
    discount_usd = sum(results)
    print(f"calculateDiscount: {timer.measure_ms()}ms")
    return discount_usd


@https_fn.on_call()
async def calculatetotal(req: https_fn.CallableRequest):
    product_ids = req.data.get("productIds")

    total_usd = 0
    with tracer.start_as_current_span("calculatePrice"):
        total_usd = await calculate_price(product_ids)
    with tracer.start_as_current_span("calculateDiscount"):
        total_usd -= await calculate_discount(product_ids)
    return {"totalUsd": total_usd}
