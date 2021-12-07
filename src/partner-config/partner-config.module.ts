import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PartnerConfigService } from './partner-config.service';
import {PartnerConfig, PartnerConfigSchema } from './schemas/partner-config.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PartnerConfig.name, schema: PartnerConfigSchema, collection: 'partner_configs' },
        ]),
    ],
    providers: [PartnerConfigService],
    exports: [PartnerConfigService],
})
export class PartnerConfigModule {}
