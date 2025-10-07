# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.google.cloud.trace import CloudTraceSpanExporter
from opentelemetry.propagators.gcp import GcpCloudPropagator
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.grpc import GrpcInstrumentorClient
from opentelemetry.instrumentation.wsgi import WSGIInstrumentor
from opentelemetry.resourcedetector.gcp import GcpResourceDetector

# Only enable OpenTelemetry if the function is actually deployed.
# Emulators don't reflect real-world latency
if "FUNCTIONS_EMULATOR" not in os.environ:
    # Set up OpenTelemetry
    trace.set_tracer_provider(TracerProvider(resource=GcpResourceDetector().detect()))
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(CloudTraceSpanExporter())
    )
    trace.set_text_map_propagator(GcpCloudPropagator())

    # Instrument libraries
    RequestsInstrumentor().instrument()
    GrpcInstrumentorClient().instrument()
    WSGIInstrumentor().instrument()
