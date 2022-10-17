# Instrumenting Cloud Functions for Firebase with Open Telemetry
This sample demonstrates instrumenting your Cloud Functions for Firebase using [OpenTelemetry](https://opentelemetry.io).

See Firebase Summit 2022 Talk "Observability in Cloud Functions for Firebase" for motivations and context.

Open Telemetry SDK provides both automatic and manual instrumentation, both of which are demonstrated here. See [OpenTelemetry JS documentations](https://opentelemetry.io/docs/instrumentation/js/) for more information about how to use and configure OpenTelemetry for your javascript project.

## Notable Files
* `./tracing.js`: Initializes OpenTelemetry SDK to automatically instrument HTTP/GRPC/Express modules and export the generated traces to Google Cloud Trace.

* `./.env`: Configures `NODE_OPTIONS` to preload the `tracing.js` module. This is important because OpenTelemtry SDK works by monkey-patching instrumented modules and must run first before other module is loaded.

* `./index.js`: Includes sample code for generating custom spans using the OpenTelemetry API. e.g.:
```js
const opentelemetry = require('@opentelemetry/api');

const tracer = opentelemetry.trace.getTracer();
await tracer.startActiveSpan("calculatePrice", async (span) => {
    totalUsd = await calculatePrice(productIds);
    span.end();
});
```

## Deploy and test
1. Deploy your function using firebase deploy --only functions
2. Seed Firestore with mock data.
3. Send callable request to the deployed function, e.g.:
```
$ curl -X POST -H "content-type: application/json" https:// -d '{ "data": ... }'
```
