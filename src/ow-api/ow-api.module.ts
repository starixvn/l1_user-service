import { Module } from "@nestjs/common";
import { LoggerModule } from "src/logger/logger.module";
import { OpenIdModule } from "src/open-id/open-id.module";

import { OWApiClient } from "./ow-api.client";

@Module({
    imports: [OpenIdModule, LoggerModule],
    providers: [OWApiClient],
    exports: [OWApiClient],
})
export class OWApiModule {}
