import { Module } from "@nestjs/common";

import { OpenIdClient } from "./open-id.client";

@Module({
    providers: [OpenIdClient],
    exports: [OpenIdClient],
})
export class OpenIdModule {}
