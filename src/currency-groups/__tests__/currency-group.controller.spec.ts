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
            const expected = {
                groups: [],
                isONEworksVGCash: false,
            };
            const partnerId = 'partnerId';

            const actual = await controller.index({ partnerId });

            expect(actual).toStrictEqual(expected);
            expect(service.getCurrencyGroupsByPartner.mock.calls.length).toBe(1);
        });
    });

    describe('chooseCurrencyGroup', () => {
        it('when token is invalid should return error url', async () => {
            const query = {
                token: null,
                language: 'language',
                gameId: '1',
                groupId: 'groupId',
                ref: 'ref',
                returnUrl: 'returnUrl',
                groupType: 'default',
                partnerId: 'OneWorks1',
                appType: '1',
                op: 'SG',
            };
            const expected = { url: 'error' };
            service.getCurrencyGroup.mockImplementation(() => {
                return { id: query.groupId, name: 'Credit_USD' };
            });

            const actual = await controller.chooseCurrencyGroup(query);

            expect(actual).toStrictEqual(expected);
            expect(service.updateMemberAuth.mock.calls.length).toBe(0);
        });

        it('when token is valid should execute service', async () => {
            const query = {
                token: 'token',
                language: 'language',
                gameId: '1',
                groupId: 'groupId',
                ref: 'ref',
                returnUrl: 'returnUrl',
                groupType: 'default',
                partnerId: 'OneWorks1',
                appType: '1',
                op: 'VG',
            };
            service.updateMemberAuth.mockImplementation(() => 'apiUrl');
            service.getCurrencyGroup.mockImplementation(() => {
                return { id: query.groupId, name: 'Credit_USD' };
            });

            const expected = {
                url: 'apiUrl?token=token&language=language&gameId=1&ref=ref&returnUrl=returnUrl&appType=1&op=VG&cg=Credit_USD',
            };

            const actual = await controller.chooseCurrencyGroup(query);

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
