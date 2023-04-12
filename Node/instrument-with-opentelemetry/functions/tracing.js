const opentelemetry = require("@opentelemetry/sdk-node");
const {
  TraceExporter,
} = require("@google-cloud/opentelemetry-cloud-trace-exporter");
const {HttpInstrumentation} = require("@opentelemetry/instrumentation-http");
const {GrpcInstrumentation} = require("@opentelemetry/instrumentation-grpc");
const {
  ExpressInstrumentation,
} = require("opentelemetry-instrumentation-express");
const {gcpDetector} = require("@opentelemetry/resource-detector-gcp");
const {
  CloudPropagator,
} = require("@google-cloud/opentelemetry-cloud-trace-propagator");


// Only enable OpenTelemetry if the function is actually deployed.
// Emulators don't reflect real-world latency"
if (!process.env.FUNCTIONS_EMULATOR) {
  const sdk = new opentelemetry.NodeSDK({
    // Setup automatic instrumentation for
    //   http, grpc, and express modules.
    instrumentations: [
      new HttpInstrumentation(),
      new GrpcInstrumentation(),
      new ExpressInstrumentation(),
    ],
    // Make sure opentelemetry know about Cloud Trace http headers
    //   i.e. 'X-Cloud-Trace-Context'
    textMapPropagator: new CloudPropagator(),
    // Automatically detect and include span metadata when running
    //   in GCP, e.g. region of the function.
    resourceDetectors: [gcpDetector],
    // Export generated traces to Cloud Trace.
    traceExporter: new TraceExporter(),
  });

  sdk.start();

  // Ensure that generated traces are exported when the container is
  //   shutdown.
  process.on("SIGTERM", async () => {
    await sdk.shutdown();
  });
}
