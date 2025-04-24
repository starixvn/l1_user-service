import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../common/common.module';
import { CurrencyGroupController } from '../currency-groups/currency-group.controller';
import { CurrencyGroupService } from './currency-group.service';
import { SGApiModule } from '../sg-api/sg-api.module';

import { CurrencyGroup, CurrencyGroupSchema, Currency, CurrencySchema } from './schemas';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CurrencyGroup.name, schema: CurrencyGroupSchema, collection: 'currency_groups' }]),
        MongooseModule.forFeature([{ name: Currency.name, schema: CurrencySchema, collection: 'currencies' }]),
        SGApiModule,
        CommonModule,
    ],
    providers: [CurrencyGroupService],
    exports: [CurrencyGroupService],
    controllers: [CurrencyGroupController],
})
export class CurrencyGroupModule {}
