import { Module } from "@nestjs/common";

import { SentryLogger } from "./logger.service";

@Module({
    providers: [SentryLogger],
    exports: [SentryLogger],
})
export class LoggerModule {}
