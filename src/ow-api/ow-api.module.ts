import { Module } from "@nestjs/common";
import { OpenIdModule } from "src/open-id/open-id.module";

import { OWApiClient } from "./ow-api.client";

@Module({
    imports: [OpenIdModule],
    providers: [OWApiClient],
    exports: [OWApiClient],
})
export class OWApiModule {}
