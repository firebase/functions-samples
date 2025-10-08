# Instrumenting Cloud Functions for Firebase with Open Telemetry
This sample demonstrates instrumenting your Cloud Functions for Firebase using [OpenTelemetry](https://opentelemetry.io).

See Firebase Summit 2022 Talk "Observability in Cloud Functions for Firebase" for motivations and context.

Open Telemetry SDK provides both automatic and manual instrumentation, both of which are demonstrated here. See [OpenTelemetry Python documentations](https://opentelemetry.io/docs/instrumentation/python/) for more information about how to use and configure OpenTelemetry for your Python project.

## Notable Files
* `./tracing.py`: Initializes OpenTelemetry SDK to automatically instrument HTTP/GRPC/Express modules and export the generated traces to Google Cloud Trace.

* `./main.py`: Includes sample code for generating custom spans using the OpenTelemetry API. e.g.:
```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("calculate_price") as span:
    total_usd = await calculate_price(product_ids)
```

## Deploy and test
1. Deploy your function using firebase deploy --only functions
2. Seed Firestore with mock data.
3. Send callable request to the deployed function, e.g.:
```
$ curl -X POST -H "content-type: application/json" https:// -d '{ "data": ... }'
```
