import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { SingleSignOnResponse } from '../../ow-api/models';
import { SentryLogger } from '../../common/providers';
import { OWApiClient } from '../../ow-api/ow-api.client';
import { CurrencyGroupService } from '../currency-group.service';
import { CurrencyGroup, Currency, CurrencyGroupDocument, CurrencyDocument } from '../schemas';
import { ConfigService } from '@nestjs/config';

describe('CurrencyGroupService', () => {
    let service: CurrencyGroupService;
    let currencyGroupModel: Model<CurrencyGroupDocument>;
    let currencyModel: Model<CurrencyDocument>;
    const owClient = { updateMemberAuth: jest.fn() };
    const logger = {
        error: jest.fn(),
    };
    const configService = {
        get: jest.fn()
    }

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [
                CurrencyGroupService,
                { provide: OWApiClient, useValue: owClient },
                { provide: getModelToken(CurrencyGroup.name), useValue: Model },
                { provide: SentryLogger, useValue: logger },
                { provide: getModelToken(Currency.name), useValue: Model },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<CurrencyGroupService>(CurrencyGroupService);
        currencyGroupModel = module.get<Model<CurrencyGroupDocument>>(getModelToken(CurrencyGroup.name));
        currencyModel = module.get<Model<CurrencyDocument>>(getModelToken(Currency.name));
    });

    describe('constructor', () => {
        it('service instance should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('getAllCurrencyGroups', () => {
        it('when exception occur should return an empty list', async () => {
            const spy = jest.spyOn(currencyGroupModel, 'find').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            throw new Error();
                        },
                    };
                },
            } as any);
            const actual = await service.getAllCurrencyGroups();

            expect(actual).toStrictEqual([]);
            expect(logger.error).toBeCalled();
            expect(spy).toBeCalled();
        });

        it('should return data from model', async () => {
            const entity = new CurrencyGroup();
            const spy = jest.spyOn(currencyGroupModel, 'find').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return [entity];
                        },
                    };
                },
            } as any);

            const actual = await service.getAllCurrencyGroups();

            expect(actual).toStrictEqual([entity]);
            expect(spy).toBeCalled();
        });
    });

    describe('getCurrency', () => {
        it('should return data from model', async () => {
            const entity = new Currency();
            const spy = jest.spyOn(currencyModel, 'findOne').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return entity;
                        },
                    };
                },
            } as any);

            const actual = await service.getCurrency('UUS', 'partnerId');

            expect(actual).toStrictEqual(entity);
            expect(spy).toBeCalled();
        });
    });

    describe('getCurrencyGroup', () => {
        it('should return data from model', async () => {
            const entity = new CurrencyGroup();
            const spy = jest.spyOn(currencyGroupModel, 'findById').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return entity;
                        },
                    };
                },
            } as any);

            const actual = await service.getCurrencyGroup('617660d8d2b6510001f18bdc');

            expect(actual).toStrictEqual(entity);
            expect(spy).toBeCalled();
        });
    });

    describe('getCurrencyGroupsByPartner', () => {
        it('when exception occur should return an empty list', async () => {
            const spy = jest.spyOn(currencyGroupModel, 'find').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            throw new Error();
                        },
                    };
                },
            } as any);
            const partnerId = 'id';
            const actual = await service.getCurrencyGroupsByPartner(partnerId);

            expect(actual).toStrictEqual([]);
            expect(logger.error).toBeCalled();
            expect(spy).toBeCalled();
        });

        it('should return data from model', async () => {
            const entity = new CurrencyGroup();
            const spy = jest.spyOn(currencyGroupModel, 'find').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return [entity];
                        },
                    };
                },
            } as any);

            const partnerId = 'id';
            const actual = await service.getCurrencyGroupsByPartner(partnerId);

            expect(actual).toStrictEqual([entity]);
            expect(spy).toBeCalled();
        });
    });

    describe('updateMemberAuth', () => {
        test.each([
            [null, 'error?message='],
            [{ code: 0, redirectUri: 'url' }, 'url'],
            [{ code: 1, message: 'error' }, `error?message=${encodeURI('error [Code: 1]')}`],
        ])('should call ow api', async (result: SingleSignOnResponse, expected: string) => {
            owClient.updateMemberAuth.mockResolvedValueOnce(result);

            const token = 'token';
            const language = 'language';
            const gameId = 1;
            const groupId = 'groupId';

            const actual = await service.updateMemberAuth(groupId, token, gameId, language);

            expect(actual).toBe(expected);
            expect(owClient.updateMemberAuth).toBeCalled();
        });
    });

    describe('isFractionalOddsFormat', () => {
        it('should return fractionalOddsFormat from model', async () => {
            const entity = new CurrencyGroup();
            entity.fractionalOddsFormat = true;
            jest.spyOn(currencyGroupModel, 'findById').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return entity;
                        },
                    };
                },
            } as any);

            const actual = await service.isFractionalOddsFormat('617660d8d2b6510001f18bdc');

            expect(actual).toBe(true);
        });
    });
});
