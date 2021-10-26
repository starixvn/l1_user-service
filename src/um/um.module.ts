import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UMInfo, UMInfoSchema } from "./schemas";
import { UMService } from "./um.service";

@Module({
    imports: [MongooseModule.forFeature([{ name: UMInfo.name, schema: UMInfoSchema, collection: 'um_info' }])],
    providers: [UMService],
    exports: [UMService],
})
export class UMModule {}
