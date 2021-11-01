import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { SingleSignOnResponse } from '../../ow-api/models';
import { SentryLogger } from '../../common/providers';
import { OWApiClient } from '../../ow-api/ow-api.client';
import { CurrencyGroupService } from '../currency-group.service';
import { CurrencyGroup, CurrencyGroupDocument } from '../schemas';

describe('CurrencyGroupService', () => {
    let service: CurrencyGroupService;
    let model: Model<CurrencyGroupDocument>;
    const owClient = { updateMemberAuth: jest.fn() };
    const logger = {
        error: jest.fn(),
    };

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [
                CurrencyGroupService,
                { provide: OWApiClient, useValue: owClient },
                { provide: getModelToken(CurrencyGroup.name), useValue: Model },
                { provide: SentryLogger, useValue: logger },
            ],
        }).compile();

        service = module.get<CurrencyGroupService>(CurrencyGroupService);
        model = module.get<Model<CurrencyGroupDocument>>(getModelToken(CurrencyGroup.name));
    });

    describe('constructor', () => {
        it('service instance should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('getAllCurrencyGroups', () => {
        it('when exception occur should return an empty list', async () => {
            const spy = jest.spyOn(model, 'find').mockReturnValue({
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
            const spy = jest.spyOn(model, 'find').mockReturnValue({
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
});
