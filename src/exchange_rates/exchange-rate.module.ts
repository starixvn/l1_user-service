import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ExchangeRate, ExchangeRateSchema } from "./schemas/exchange-rate.schema";
import { ExchangeRateService as ExchangeRateService } from "./exchange-rate.services";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ExchangeRate.name, schema: ExchangeRateSchema, collection: 'exchange_rates' }]),
    ],
    providers: [ExchangeRateService],
    exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
