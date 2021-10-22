import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { CurrenciesService } from "./currencies.service";
import { CurrencyGroupGame, CurrencyGroupGameSchema } from "./schemas";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CurrencyGroupGame.name, schema: CurrencyGroupGameSchema, collection: 'currency_group_games' }]),
    ],
    providers: [CurrenciesService],
    exports: [CurrenciesService],
})
export class CurrenciesModule {}
