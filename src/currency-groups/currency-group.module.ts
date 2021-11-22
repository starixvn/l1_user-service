import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../common/common.module';
import { OWApiModule } from '../ow-api/ow-api.module';
import { CurrencyGroupController } from '../currency-groups/currency-group.controller';
import { CurrencyGroupService } from './currency-group.service';

import { CurrencyGroup, CurrencyGroupSchema, Currency, CurrencySchema } from './schemas';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CurrencyGroup.name, schema: CurrencyGroupSchema, collection: 'currency_groups' }]),
        MongooseModule.forFeature([{ name: Currency.name, schema: CurrencySchema, collection: 'currencies' }]),
        OWApiModule,
        CommonModule,
    ],
    providers: [CurrencyGroupService],
    exports: [CurrencyGroupService],
    controllers: [CurrencyGroupController],
})
export class CurrencyGroupModule {}
