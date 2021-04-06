import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { GlobalConfigService } from "./global-config.service";
import { GlobalConfig, GlobalConfigSchema } from "./schemas/global-config.schema";

@Module({
    imports: [MongooseModule.forFeature([{ name: GlobalConfig.name, schema: GlobalConfigSchema }])],
    providers: [GlobalConfigService],
    exports: [GlobalConfigService],
})
export class GlobalConfigModule {}
