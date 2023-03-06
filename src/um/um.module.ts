import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UMInfo, UMInfoSchema } from './schemas';
import { UMController } from './um.controller';
import { UMService } from './um.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: UMInfo.name, schema: UMInfoSchema, collection: 'um_info' }])],
    providers: [UMService],
    controllers: [UMController],
    exports: [UMService],
})
export class UMModule {}
