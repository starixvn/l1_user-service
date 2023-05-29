import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { ExchangeRateService as ExchangeRateService } from '../exchange-rate.services';
import { ExchangeRate, ExchangeRateDocument } from '../schemas/exchange-rate.schema';

describe('ExchangeRatesService', () => {
    let service: ExchangeRateService;
    let exchangeRateModel: Model<ExchangeRateDocument>;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [ExchangeRateService, { provide: getModelToken(ExchangeRate.name), useValue: Model }],
        }).compile();

        service = module.get<ExchangeRateService>(ExchangeRateService);
        exchangeRateModel = module.get<Model<ExchangeRateDocument>>(getModelToken(ExchangeRate.name));
    });

    describe('constructor', () => {
        it('service instance should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('getExchangeRates', () => {
        it('should return data from model', async () => {
            const exchangeRates = new ExchangeRate();
            const spy = jest.spyOn(exchangeRateModel, 'findOne').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return exchangeRates;
                        },
                    };
                },
            } as any);

            const actual = await service.getExchangeRates();

            expect(actual).toStrictEqual(exchangeRates);
            expect(spy).toBeCalled();
        });
    });

    describe('getRateByUser', () => {
        it.each`
            currencyCode | multiplier | expected
            ${'EUR'}     | ${1000}    | ${1000}
            ${'US'}      | ${2000}    | ${4000}
        `('should return rate by user session', async ({ currencyCode, multiplier, expected }) => {
            const exchangeRates = new ExchangeRate();
            exchangeRates.code = { EUR: 1, US: 2, AUD: 3 };
            const spy = jest.spyOn(exchangeRateModel, 'findOne').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return exchangeRates;
                        },
                    };
                },
            } as any);

            const actual = await service.getRateByUser(currencyCode, multiplier);

            expect(actual).toBe(expected);
        });
    });
});
