import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Currency, CurrencySchema, GameOfCurrencyGroup, GameOfCurrencyGroupSchema } from "./schemas";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Currency.name, schema: CurrencySchema }]),
        MongooseModule.forFeature([{ name: GameOfCurrencyGroup.name, schema: GameOfCurrencyGroupSchema }]),
    ],
})
export class CurrenciesModule {}
