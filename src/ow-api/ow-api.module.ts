import { Module } from "@nestjs/common";
import { CommonModule } from "src/common";

import { OWApiClient } from "./ow-api.client";

@Module({
    imports: [CommonModule],
    providers: [OWApiClient],
    exports: [OWApiClient],
})
export class OWApiModule {}
