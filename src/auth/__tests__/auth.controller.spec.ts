import { Test } from '@nestjs/testing';

import { Result } from '../../shared/models/result';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { ReCheckInResponse } from '../models';

jest.mock('../auth.service');

describe('AuthController test', () => {
    let authController: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [AuthService],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    describe('sso test', () => {
        it('should return sign result from auth service', async () => {
            const expectResult = {
                isAuthenticated: true,
                username: 'user1',
                language: 'en',
                ss: 'session',
                system: 1,
                isUM: false,
                umInfo: null,
                memberName: '',
                rate: 1
            };

            jest.spyOn(authService, 'signIn').mockResolvedValue(expectResult);

            expect(await authController.sso('userAgent', '0.0.0.1', 'token', 1)).toBe(expectResult);
        });
    });

    describe('reCheckIn test', () => {
        it('should return reCheckIn result from auth service', async () => {
            const expectResult = new ReCheckInResponse();

            jest.spyOn(authService, 'reCheckIn').mockResolvedValue(expectResult);

            expect(await authController.reCheckIn({ session: 'session', username: 'user1', browserUserAgent: 'userAgent' })).toBe(
                expectResult,
            );
        });
    });

    describe('authorize test', () => {
        it('should return authorize result from auth service', async () => {
            const expectResult = new ReCheckInResponse();

            jest.spyOn(authService, 'authorize').mockResolvedValue(expectResult);

            expect(await authController.authorize({ session: 'session', username: 'user1', browserUserAgent: 'userAgent' })).toBe(
                expectResult,
            );
        });
    });

    describe('signName test', () => {
        it('should return createCharacterName result from auth service', async () => {
            const expectResult = new Result();

            jest.spyOn(authService, 'createCharacterName').mockResolvedValue(expectResult);

            expect(
                await authController.signName({
                    session: 'session',
                    username: 'user1',
                    browserUserAgent: 'userAgent',
                    nickname: 'tada',
                    avatar: 1,
                }),
            ).toBe(expectResult);
        });
    });

    describe('verifySession test', () => {
        it('should return verifySession result from auth service', async () => {
            const expectResult = new Result();

            jest.spyOn(authService, 'verifySession').mockResolvedValue(expectResult);

            expect(
                await authController.verifySession({
                    session: 'session',
                    username: 'user1',
                    browserUserAgent: 'userAgent',
                }),
            ).toBe(expectResult);
        });
    });

    describe('getBalance test', () => {
        it('should return getBalance result from auth service', async () => {
            const expectResult = new Result();

            jest.spyOn(authService, 'getBalance').mockResolvedValue(expectResult);

            expect(
                await authController.getBalance({
                    session: 'session',
                    username: 'user1',
                    browserUserAgent: 'userAgent',
                }),
            ).toBe(expectResult);
        });
    });
});

afterEach(() => {
    jest.clearAllMocks();
});
