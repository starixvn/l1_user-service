import { NodeSDK } from 'sc-instrument';
import { BeforeApplicationShutdown } from '@nestjs/common';

export class TraceShutdownHandler implements BeforeApplicationShutdown {
    trace: NodeSDK;

    constructor(trace: NodeSDK) {
        this.trace = trace;
    }

    async beforeApplicationShutdown(signal?: string) {
        console.log(`User Service beforeApplicationShutdown`);
        console.log(signal);
        await this.trace.shutdown();
    }
}
