import { Test } from '@nestjs/testing';
import { OWApiClient } from '../../ow-api/ow-api.client';
import { VerifyTokenResponse } from '../../ow-api/models';
import { AuthService } from '../auth.service';
import { SentryLogger } from '../../common/providers/logger.service';
import { UserInfosService, UserSessionsService, UsersService } from '../../users/providers';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../../common/providers';
import { GlobalConfigService } from '../../global-config/global-config.service';
import { UserInfo, UserSession } from '../../users/schemas';
import { AuthorizeResult, ReCheckInResponse } from '../models';
import { VerifySessionRequest } from '../../users/models';
import { Result } from '../../shared/models/result';
import { invalidSession } from '../../users/constants/errors';

jest.mock('../../ow-api/ow-api.client');
jest.mock('../../users/providers');
jest.mock('../../common/providers/logger.service');
jest.mock('../../global-config/global-config.service');

const getVerifyTokenRequest = (isSuccessful: boolean) => {
    return {
        memberId: 1,
        memberName: 'user1',
        siteId: '77',
        clientId: 'id',
        domain: 'localhost',
        language: 'en',
        currency: 'UUS',
        seq: '123',
        memberKey: 'memberKey',
        code: 3,
        message: '',
        isSuccessful,
    };
};

describe('AuthService test', () => {
    let authService: AuthService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                SentryLogger,
                OWApiClient,
                UsersService,
                UserSessionsService,
                UserInfosService,
                UtilsService,
                ConfigService,
                GlobalConfigService,
            ],
        }).compile();

        authService = await module.resolve(AuthService);
    });

    describe('signIn test', () => {
        it('should return authentication successful and create user when request token is valid', async () => {
            const verifyTokenResponse: VerifyTokenResponse = getVerifyTokenRequest(true);
            jest.spyOn(OWApiClient.prototype, 'verifyToken').mockResolvedValue(verifyTokenResponse);
            const createUserIfNotExistFunc = jest.spyOn<any, any>(AuthService.prototype, 'createUserIfNotExist');
            const addSessionIfNotExistFunc = jest.spyOn<any, any>(AuthService.prototype, 'addSessionIfNotExist').mockImplementation(() => {
                return {
                    username: 'user',
                    language: 'en',
                    sessionId: 'session',
                    system: 1,
                };
            });

            const actualResult = await authService.signIn('0.0.0.1', 'token', 'userAgent', 1);

            expect(createUserIfNotExistFunc).toHaveBeenCalled();
            expect(addSessionIfNotExistFunc).toHaveBeenCalled();
            expect(actualResult.isAuthenticated).toBe(true);
        });

        it('should return authentication failed result when token invalid', async () => {
            const verifyTokenResponse = getVerifyTokenRequest(false);
            jest.spyOn(OWApiClient.prototype, 'verifyToken').mockResolvedValue(verifyTokenResponse);

            const actualResult = await authService.signIn('0.0.0.1', 'token', 'userAgent', 1);

            expect(actualResult.isAuthenticated).toBe(false);
        });
    });

    describe('reCheckIn test', () => {
        it('should return invalid session when session is invalid', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: false,
                session: new UserSession(),
            });

            const actualResult = await authService.reCheckIn({ session: 'session', username: 'user', browserUserAgent: 'userAgent' });

            expect(actualResult.isSuccessful).toBe(false);
        });

        it('should update reCheckIn time when session is valid', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(UserSessionsService.prototype, 'updateReCheckInTime').mockImplementation();

            await authService.reCheckIn({ session: 'session', username: 'user', browserUserAgent: 'userAgent' });

            expect(UserSessionsService.prototype.updateReCheckInTime).toHaveBeenCalled();
        });

        it('should return recheckIn successful when session is valid and have none user info', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(UserSessionsService.prototype, 'updateReCheckInTime').mockImplementation();
            jest.spyOn(UserInfosService.prototype, 'getUserInfo').mockResolvedValue(undefined);

            const actualResult = await authService.reCheckIn({ session: 'session', username: 'user', browserUserAgent: 'userAgent' });

            expect(actualResult.isSuccessful).toBe(true);
        });

        it('should return recheckIn api error when get balance failed', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(UserSessionsService.prototype, 'updateReCheckInTime').mockImplementation();
            jest.spyOn(UserInfosService.prototype, 'getUserInfo').mockResolvedValue(new UserInfo());
            jest.spyOn<any, any>(AuthService.prototype, 'getBalanceBySession').mockResolvedValue({
                isSuccessful: false,
                errorCode: 'SB0001',
            });

            const actualResult = (await authService.reCheckIn({
                session: 'session',
                username: 'user',
                browserUserAgent: 'userAgent',
            })) as ReCheckInResponse;

            expect(actualResult.apiError.errorCode).toEqual('SB0001');
        });
    });

    describe('verifySession test', () => {
        const verifySessionRequest: VerifySessionRequest = { username: 'user1', session: 'session', browserUserAgent: 'userAgent' };

        it('should return unsuccessful result when session is invalid', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: false,
                session: new UserSession(),
            });

            const actualResult = await authService.verifySession(verifySessionRequest);

            expect(actualResult.isSuccessful).toBe(false);
        });

        it('should return successful result when session is valid', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = await authService.verifySession(verifySessionRequest);

            expect(actualResult.isSuccessful).toBe(true);
        });
    });

    // describe('authorize test', () => {
    //     const verifySessionRequest: VerifySessionRequest = { username: 'user1', session: 'session', browserUserAgent: 'userAgent' };

    //     it('should return unsuccessful result when session is invalid', async () => {
    //         jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
    //             isAuthenticated: false,
    //             session: new UserSession(),
    //         });

    //         const actualResult = (await authService.authorize(verifySessionRequest)) as Result;

    //         expect(actualResult).toBe(invalidSession);
    //     });

    //     it('should return invalid session when do not have user document', async () => {
    //         jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
    //             isAuthenticated: true,
    //             session: new UserSession(),
    //         });
    //         jest.spyOn(UsersService.prototype, 'getByUsername').mockRejectedValue(null);

    //         const actualResult = (await authService.authorize(verifySessionRequest)) as Result;

    //         expect(actualResult).toBe(invalidSession);
    //     });

    //     it('should return invalid session when do not have user info', async () => {
    //         const expectResult = new AuthorizeResult(false);
    //         jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
    //             isAuthenticated: true,
    //             session: new UserSession(),
    //         });
    //         jest.spyOn(UsersService.prototype, 'getByUsername').mockRejectedValue({
    //             username: 'user1',
    //             password: '1234aa',
    //             regDate: new Date(),
    //             clientId: 'client1',
    //             memberId: 123,
    //             memberName: 'member1',
    //             currency: 'UUS',
    //         });
    //         jest.spyOn(UserInfosService.prototype, 'getUserInfo').mockRejectedValue(undefined);

    //         const actualResult = await authService.authorize(verifySessionRequest);

    //         expect(actualResult).toEqual(expectResult);
    //     });
    // });
});

afterAll(() => {
    jest.clearAllMocks();
});
