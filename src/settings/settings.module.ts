import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { GlobalConfigModule } from "../global-config/global-config.module";
import { UMInfo, UMInfoSchema } from "./schemas";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
    imports: [MongooseModule.forFeature([{ name: UMInfo.name, schema: UMInfoSchema, collection: 'um_info' }]), GlobalConfigModule],
    providers: [SettingsService],
    controllers: [SettingsController],
    exports: [SettingsService],
})
export class SettingsModule {}
