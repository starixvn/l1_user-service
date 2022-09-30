import { Module } from "@nestjs/common";

import { MiddleSiteApiClient } from "./middle-site-api.client";

@Module({
    providers: [MiddleSiteApiClient],
    exports: [MiddleSiteApiClient],
})
export class MiddleSiteApiModule {}
