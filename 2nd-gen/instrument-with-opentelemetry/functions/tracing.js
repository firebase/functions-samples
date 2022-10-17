const opentelemetry = require("@opentelemetry/sdk-node");
const {TraceExporter} = require("@google-cloud/opentelemetry-cloud-trace-exporter");
const {HttpInstrumentation} = require("@opentelemetry/instrumentation-http");
const {GrpcInstrumentation} = require("@opentelemetry/instrumentation-grpc");
const {ExpressInstrumentation} = require('opentelemetry-instrumentation-express');
const {gcpDetector} = require("@opentelemetry/resource-detector-gcp");
const {
    CloudPropagator,
} = require("@google-cloud/opentelemetry-cloud-trace-propagator");

if (!process.env.FUNCTIONS_EMULATOR) {
    const sdk = new opentelemetry.NodeSDK({
        instrumentations: [
            new HttpInstrumentation(),
            new GrpcInstrumentation(),
            new ExpressInstrumentation(),
        ],
        textMapPropagator: new CloudPropagator(),
        resourceDetectors: [gcpDetector],
        traceExporter: new TraceExporter(),
    });

    sdk.start();

    process.on("SIGTERM", async () => {
        await sdk.shutdown();
    });
}