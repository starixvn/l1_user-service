import { Module } from "@nestjs/common";

import { OWApiClient } from "./ow-api.client";

@Module({
    providers: [OWApiClient],
    exports: [OWApiClient],
})
export class OWApiModule {}
