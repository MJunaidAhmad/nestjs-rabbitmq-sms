import {
  CompositePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import * as process from 'process';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

const otelSDK = new NodeSDK({
  metricExporter: new PrometheusExporter({
    port: 8081,
    host: '0.0.0.0',
  }),
  metricInterval: 1000,
  contextManager: new AsyncLocalStorageContextManager(),
  textMapPropagator: new CompositePropagator({
    propagators: [
      new JaegerPropagator(),
      new B3Propagator(),
      new B3Propagator({
        injectEncoding: B3InjectEncoding.MULTI_HEADER,
      }),
      new W3CTraceContextPropagator(),
    ],
  }),
  instrumentations: [getNodeAutoInstrumentations(), new NestInstrumentation()],
});

export default otelSDK;

// You can also use the shutdown method to gracefully shut down the SDK before process shutdown
// or on some operating system signal.
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('Error shutting down SDK', err),
    )
    .finally(() => process.exit(0));
});
