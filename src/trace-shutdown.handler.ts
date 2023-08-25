import { NodeSDK } from 'sc-instrument';
import { BeforeApplicationShutdown } from '@nestjs/common';

export class TraceShutdownHandler implements BeforeApplicationShutdown {
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
