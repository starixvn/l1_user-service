import { Test } from '@nestjs/testing';
import { CurrencyGroupController } from '../currency-group.controller';
import { CurrencyGroupService } from '../currency-group.service';

describe('CurrencyGroupController', () => {
    let controller: CurrencyGroupController;
    const service = {
        getAllCurrencyGroups: jest.fn(),
        updateMemberAuth: jest.fn(),
        getCurrencyGroupsByPartner: jest.fn(),
        getHrefCurrencyGroup: jest.fn(),
        getCurrencyGroupIdByGroupType: jest.fn(),
        getCurrencyGroup: jest.fn(),
    };

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            controllers: [CurrencyGroupController],
            providers: [{ provide: CurrencyGroupService, useValue: service }],
        }).compile();

        controller = module.get<CurrencyGroupController>(CurrencyGroupController);
    });

    describe('constructor', () => {
        it('controller instance should be defined', () => {
            expect(controller).toBeDefined();
        });
    });

    describe('index', () => {
        it('should execute service', async () => {
            service.getCurrencyGroupsByPartner.mockImplementation((partner) => {
                expect(partner).toBe('partnerId');

                return [];
            });

            const token = 'token';
            const language = 'language';
            const gameId = '1';
            const ref = 'ref';
            const returnUrl = 'returnUrl';
            const appType = '1';
            const expected = {
                token,
                language,
                gameId,
                groups: [],
                ref,
                returnUrl,
                isONEworksVGCash: false,
                partnerId: 'partnerId',
                appType,
                op: 'VG',
            };
            const partnerId = 'partnerId';
            const op = 'VG';

            const actual = await controller.index(token, language, gameId, partnerId, ref, returnUrl, appType, op);

            expect(actual).toStrictEqual(expected);
            expect(service.getCurrencyGroupsByPartner.mock.calls.length).toBe(1);
        });
    });

    describe('chooseCurrencyGroup', () => {
        it('when token is invalid should return error url', async () => {
            const token = null;
            const language = 'language';
            const gameId = '1';
            const groupId = 'groupId';
            const ref = 'ref';
            const returnUrl = 'returnUrl';
            const expected = { url: 'error' };
            const groupType = 'default';
            const partnerId = 'OneWorks1';
            const appType = '1';
            const op = 'SG';
            service.getCurrencyGroup.mockImplementation(() => {
                return { id: groupId, name: 'Credit_USD' };
            });

            const actual = await controller.chooseCurrencyGroup(
                groupType,
                groupId,
                token,
                language,
                gameId,
                ref,
                returnUrl,
                partnerId,
                appType,
                op,
            );

            expect(actual).toStrictEqual(expected);
            expect(service.updateMemberAuth.mock.calls.length).toBe(0);
        });

        it('when token is valid should execute service', async () => {
            service.updateMemberAuth.mockImplementation(() => 'apiUrl');
            service.getCurrencyGroup.mockImplementation(() => {
                return { id: groupId, name: 'Credit_USD' };
            });

            const token = 'token';
            const language = 'language';
            const gameId = '1';
            const groupId = 'groupId';
            const ref = 'ref';
            const returnUrl = 'returnUrl';
            const groupType = 'default';
            const partnerId = 'OneWorks1';
            const expected = { url: 'apiUrl&ref=ref&appType=1&rurl=returnUrl&op=VG&cg=Credit_USD' };
            const appType = '1';
            const op = 'VG';

            const actual = await controller.chooseCurrencyGroup(
                groupType,
                groupId,
                token,
                language,
                gameId,
                ref,
                returnUrl,
                partnerId,
                appType,
                op,
            );

            expect(actual).toStrictEqual(expected);
            expect(service.updateMemberAuth.mock.calls.length).toBe(1);
        });
    });

    describe('error', () => {
        it('should return input data', () => {
            service.getAllCurrencyGroups.mockImplementation(() => []);
            const message = 'message';
            const expected = { message };

            const actual = controller.error(message);

            expect(actual).toStrictEqual(expected);
        });
    });
});
