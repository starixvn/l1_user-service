import { CompositePropagator } from '@opentelemetry/core';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import * as process from 'process';

const otelSDK = new NodeSDK({
    spanProcessor: new BatchSpanProcessor(
        new JaegerExporter({
            endpoint: 'http://10.10.50.69:14268/api/traces',
        }),
    ),
    contextManager: new AsyncLocalStorageContextManager(),
    textMapPropagator: new CompositePropagator({
        propagators: [new JaegerPropagator()],
    }),
    instrumentations: [new HttpInstrumentation()],
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
