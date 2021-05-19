import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UMInfo, UMInfoSchema } from "./schemas";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
    imports: [MongooseModule.forFeature([{ name: UMInfo.name, schema: UMInfoSchema, collection: 'um_info' }])],
    providers: [SettingsService],
    controllers: [SettingsController],
})
export class SettingsModule {}
