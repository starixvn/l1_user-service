import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Result } from '../../shared/models/result';
import { invalidSession } from '../../users/constants/errors';

import { UtilsService } from '../../common/providers';
import { SentryLogger } from '../../common/providers/logger.service';
import { GlobalConfigService } from '../../global-config/global-config.service';
import { GetBalanceRequest, VerifyTokenResponse } from '../../ow-api/models';
import { OWApiClient } from '../../ow-api/ow-api.client';
import { VerifySessionRequest } from '../../users/models';
import { UserInfosService, UserSessionsService, UsersService } from '../../users/providers';
import { User, UserInfo, UserSession } from '../../users/schemas';
import { AuthService } from '../auth.service';
import { AuthenticateResult, AuthorizeResult, CreateNicknameRequest, GetBalanceResult, ReCheckInResponse } from '../models';
import { duplicateNickname } from '../constants/errors';

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

class StubUsersService {
    getByUsername = jest.fn();
    getById = jest.fn();
    createUser = jest.fn();
}

class StubUserInfoService {
    getUserInfo = jest.fn();
    isExistingCharacterName = jest.fn();
    getLatestUserInfoUID = jest.fn();
    upSertUserInfo = jest.fn();
    updateBalance = jest.fn();
    updateMemberStakeLevel = jest.fn();
    updateSettings = jest.fn();
    updateUserSignInSMStatus = jest.fn();
}

const stubUsersService = new StubUsersService();
const stubUserInfoService = new StubUserInfoService();

describe('AuthService test', () => {
    let authService: AuthService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                SentryLogger,
                OWApiClient,
                UserSessionsService,
                UtilsService,
                ConfigService,
                GlobalConfigService,
                {
                    provide: UsersService,
                    useValue: stubUsersService,
                },
                {
                    provide: UserInfosService,
                    useValue: stubUserInfoService,
                },
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
            stubUserInfoService.getUserInfo.mockReturnValueOnce(null);

            const actualResult = await authService.reCheckIn({ session: 'session', username: 'user', browserUserAgent: 'userAgent' });

            expect(actualResult.isSuccessful).toBe(true);
        });

        it('should return recheckIn api error when get balance failed', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(UserSessionsService.prototype, 'updateReCheckInTime').mockImplementation();
            stubUserInfoService.getUserInfo.mockReturnValueOnce(new UserInfo());
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

    describe('authorize test', () => {
        const verifySessionRequest: VerifySessionRequest = { username: 'user1', session: 'session', browserUserAgent: 'userAgent' };

        it('should return unsuccessful result when session is invalid', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: false,
                session: new UserSession(),
            });

            const actualResult = (await authService.authorize(verifySessionRequest)) as Result;

            expect(actualResult).toBe(invalidSession);
        });

        it('should return invalid session when do not have user document', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });
            stubUsersService.getByUsername.mockReturnValueOnce(null);

            const actualResult = (await authService.authorize(verifySessionRequest)) as Result;

            expect(actualResult).toBe(invalidSession);
        });

        it('should return invalid session when do not have user info', async () => {
            const expectResult = new AuthorizeResult(false);
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });
            stubUsersService.getByUsername.mockReturnValueOnce({});
            stubUserInfoService.getUserInfo.mockReturnValueOnce(null);

            const actualResult = await authService.authorize(verifySessionRequest);

            expect(actualResult).toEqual(expectResult);
        });

        it('should call notify login and return authorized when user info is available', async () => {
            const notifyLoginFunc = jest.spyOn<any, any>(AuthService.prototype, 'notifyLogin').mockImplementation(jest.fn());

            stubUsersService.getByUsername.mockReturnValueOnce({});
            stubUserInfoService.getUserInfo.mockReturnValueOnce({ name: 'user1' });

            const actualResult = (await authService.authorize(verifySessionRequest)) as AuthorizeResult;

            expect(notifyLoginFunc).toHaveBeenCalled();
            expect(actualResult.authorized).toBe(true);
        });
    });

    describe('createCharacterName test', () => {
        const createNicknameRequest: CreateNicknameRequest = {
            avatar: 1,
            browserUserAgent: 'agent',
            nickname: 'nickName',
            session: 'session',
            username: 'userName',
        };

        it('should return unsuccessful result when session is invalid', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: false,
                session: new UserSession(),
            });

            const actualResult = await authService.createCharacterName(createNicknameRequest);

            expect(actualResult).toEqual(invalidSession);
        });

        it('should return invalid sign name when nick name is invalid', async () => {
            jest.spyOn<any, any>(AuthService.prototype, 'validateNickname').mockReturnValueOnce({ isSuccessful: false });
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as Result;

            expect(actualResult.isSuccessful).toEqual(false);
        });

        it('should return invalid sign name when nick name is same as user name', async () => {
            stubUsersService.getById.mockReturnValueOnce({ local: { username: createNicknameRequest.nickname } });
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as Result;

            expect(actualResult.isSuccessful).toBe(false);
        });

        it('should return successful when user info was created', async () => {
            stubUsersService.getById.mockReturnValue({ local: { username: createNicknameRequest.username } });
            stubUserInfoService.getUserInfo.mockReturnValueOnce({});
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as AuthorizeResult;

            expect(actualResult.authorized).toBe(true);
        });

        it('should return unsuccessful when nick name is existed', async () => {
            stubUserInfoService.isExistingCharacterName.mockResolvedValue(true);
            stubUsersService.getById.mockReturnValue({ local: { username: createNicknameRequest.username } });
            jest.spyOn<any, any>(AuthService.prototype, 'generateCharacterName').mockReturnValue('UUSUser');
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as Result;

            expect(actualResult).toEqual(duplicateNickname);
        });

        it('should return unsuccessful when nick name is existed', async () => {
            stubUserInfoService.isExistingCharacterName.mockResolvedValue(false);
            stubUsersService.getById.mockReturnValue({ local: { username: createNicknameRequest.username } });
            stubUserInfoService.getLatestUserInfoUID.mockResolvedValue(1);
            stubUserInfoService.upSertUserInfo.mockResolvedValue(null);
            jest.spyOn<any, any>(AuthService.prototype, 'generateCharacterName').mockReturnValue('UUSUser');
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as Result;

            expect(actualResult).toEqual(duplicateNickname);
        });

        it('should notify login and return successful', async () => {
            stubUserInfoService.isExistingCharacterName.mockResolvedValue(false);
            stubUsersService.getById.mockReturnValue({ local: { username: createNicknameRequest.username } });
            stubUserInfoService.getLatestUserInfoUID.mockResolvedValue(1);
            stubUserInfoService.upSertUserInfo.mockResolvedValue({ upsetResult: { upserted: [1] } });
            jest.spyOn<any, any>(AuthService.prototype, 'generateCharacterName').mockReturnValue('UUSUser');
            const notifyLoginFunc = jest.spyOn<any, any>(AuthService.prototype, 'notifyLogin').mockImplementation(() => {});
            jest.spyOn<any, any>(AuthService.prototype, 'getBalanceBySession').mockResolvedValue({ balance: 100 });
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as AuthorizeResult;

            expect(notifyLoginFunc).toHaveBeenCalled();
            expect(actualResult.authorized).toEqual(true);
        });
    });

    describe('getBalance test', () => {
        const request: VerifySessionRequest = { username: 'userName', session: 'session', browserUserAgent: 'browserAgent' };

        it('should return invalid session when verify session failed', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: false,
                session: new UserSession(),
            });

            const actualResult = await authService.getBalance(request);

            expect(actualResult).toEqual(invalidSession);
        });

        it('should return invalid session when have no user info', async () => {
            stubUserInfoService.getUserInfo.mockResolvedValue(null);
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = await authService.getBalance(request);

            expect(actualResult).toEqual(invalidSession);
        });

        it('should return balance when session & user info is valid', async () => {
            stubUserInfoService.getUserInfo.mockResolvedValue(null);
            jest.spyOn<any, any>(AuthService.prototype, 'getBalanceBySession').mockReturnValue(new GetBalanceResult('0', '', 100));
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: new UserSession(),
            });

            const actualResult = await authService.getBalance(request);

            expect(actualResult instanceof GetBalanceResult);
        });
    });
});

afterAll(() => {
    jest.clearAllMocks();
});
