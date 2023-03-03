import { CompositePropagator, W3CTraceContextPropagator, W3CBaggagePropagator } from '@opentelemetry/core';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { IncomingMessage } from 'http';
import { BeforeApplicationShutdown } from '@nestjs/common';

const trace = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'User Service',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'LOCAL_1',
    }),
    spanProcessor: new BatchSpanProcessor(
        new JaegerExporter({
            tags: [],
            endpoint: 'http://10.10.50.69:14268/api/traces',
        }),
    ),
    contextManager: new AsyncLocalStorageContextManager(),
    textMapPropagator: new CompositePropagator({
        propagators: [
            new JaegerPropagator(),
            new W3CTraceContextPropagator(),
            new W3CBaggagePropagator(),
            new B3Propagator({
                injectEncoding: B3InjectEncoding.MULTI_HEADER,
            }),
        ],
    }),
    instrumentations: [
        new HttpInstrumentation({
            ignoreIncomingRequestHook: (req: IncomingMessage) => {
                return req.method === 'GET';
            },
        }),
        new FastifyInstrumentation(),
        new MongoDBInstrumentation(),
    ],
});

export default trace;

export class Tracer implements BeforeApplicationShutdown {
    trace: NodeSDK;

    constructor(trace: NodeSDK) {
        this.trace = trace;
    }

    beforeApplicationShutdown(signal?: string) {
        console.log(`User Service beforeApplicationShutdown`);
        console.log(signal);
        this.trace.shutdown();
    }
}
