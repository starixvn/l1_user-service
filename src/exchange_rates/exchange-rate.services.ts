import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExchangeRate, ExchangeRateDocument } from './schemas/exchange-rate.schema';

@Injectable()
export class ExchangeRateService {
    constructor(@InjectModel(ExchangeRate.name) private readonly exchangeRateModel: Model<ExchangeRateDocument>) {}

    async getExchangeRates() {
        return this.exchangeRateModel
            .findOne({}, 'exId code', { sort: { exId: -1 } })
            .lean()
            .exec();
    }

    async getRateByUser(currencyCode: string, multiplier: number) {
        const exchangeRates = await this.getExchangeRates();
        return exchangeRates?.code[currencyCode] * multiplier;
    }
}
