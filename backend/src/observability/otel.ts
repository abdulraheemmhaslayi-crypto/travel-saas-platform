import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Set diagnostic logger for trace troubleshooting
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

if (
  !process.env.OTEL_EXPORTER_OTLP_ENDPOINT &&
  !process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT &&
  !process.env.OTEL_CONFIG_FILE
) {
  process.env.OTEL_METRICS_EXPORTER ??= 'none';
}

if (
  !process.env.OTEL_EXPORTER_OTLP_ENDPOINT &&
  !process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT &&
  !process.env.OTEL_CONFIG_FILE
) {
  process.env.OTEL_TRACES_EXPORTER ??= 'none';
}

export const otelSDK = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({
      // We can disable heavy console or file logging instrumentations if needed
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

// Shut down tracing on exit
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(() => console.log('OTel tracing successfully terminated'))
    .catch((error) => console.error('Error terminating OTel tracing', error))
    .finally(() => process.exit(0));
});
