import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OWApiModule } from 'src/ow-api/ow-api.module';
import { CurrencyGroupController } from '../currency-groups/currency-group.controller';
import { CurrencyGroupService } from './currency-group.service';

import { CurrencyGroup, CurrencyGroupSchema } from './schemas';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CurrencyGroup.name, schema: CurrencyGroupSchema, collection: 'currency_groups' }]),
        OWApiModule,
    ],
    providers: [CurrencyGroupService],
    exports: [CurrencyGroupService],
    controllers: [CurrencyGroupController],
})
export class CurrencyGroupModule {}
