import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { stub } from 'jest-micro-auto-stub';

import { UtilsService } from '../../common/providers';
import { SentryLogger } from '../../common/providers/logger.service';
import { CurrenciesService } from "../../currencies/currencies.service";
import { GlobalConfigService } from '../../global-config/global-config.service';
import { VerifyTokenResponse } from '../../ow-api/models';
import { OWApiClient } from '../../ow-api/ow-api.client';
import { UMInfo } from '../../settings/schemas';
import { SettingsService } from '../../settings/settings.service';
import { Result } from '../../shared/models/result';
import { invalidSession } from '../../users/constants/errors';
import { VerifySessionRequest } from '../../users/models';
import { UserInfosService, UserSessionsService, UsersService } from '../../users/providers';
import { UserInfo, UserSession } from '../../users/schemas';
import { AuthService } from '../auth.service';
import { duplicateNickname } from '../constants/errors';
import { AuthorizeResult, CreateNicknameRequest, GetBalanceResult, ReCheckInResponse } from '../models';

jest.mock('../../ow-api/ow-api.client');
jest.mock('../../users/providers');
jest.mock('../../common/providers/logger.service');
jest.mock('../../global-config/global-config.service');
jest.mock('../../settings/settings.service');
jest.mock('../../currencies/currencies.service');

const getVerifyTokenRequest = (isSuccessful: boolean) => {
    return {
        memberId: 1,
        memberName: 'user1',
        siteId: '77',
        partnerId: 'id',
        domain: 'localhost',
        language: 'en',
        currency: 'UUS',
        seq: '123',
        memberKey: 'memberKey',
        code: 3,
        message: '',
        isSuccessful,
        appType: 1,
        siteName: 'lumi',
    };
};

const stubUsersService = stub(UsersService);
const stubUserInfoService = stub(UserInfosService);

describe('AuthService test', () => {
    let authService: AuthService;

    beforeEach(async () => {
        jest.clearAllMocks();
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
                SettingsService,
                CurrenciesService,
            ],
        }).compile();

        authService = await module.resolve(AuthService);
    });

    describe('signIn test', () => {
        it('should return authentication successful and create user when request token is valid', async () => {
            // arrange
            const verifyTokenResponse: VerifyTokenResponse = getVerifyTokenRequest(true);
            jest.spyOn(OWApiClient.prototype, 'verifyToken').mockResolvedValueOnce(verifyTokenResponse);
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: false, umInfo: null });
            const createUserIfNotExistFunc = jest.spyOn<any, any>(AuthService.prototype, 'createUserIfNotExist');
            const addSessionIfNotExistFunc = jest.spyOn<any, any>(AuthService.prototype, 'addSessionIfNotExist').mockImplementation(() => {
                return {
                    username: 'user',
                    language: 'en',
                    sessionId: 'session',
                    system: 1,
                };
            });

            // act
            const actualResult = await authService.signIn('0.0.0.1', 'token', 'userAgent', 1);

            // assert
            expect(createUserIfNotExistFunc).toHaveBeenCalled();
            expect(addSessionIfNotExistFunc).toHaveBeenCalled();
            expect(actualResult.isAuthenticated).toBe(true);
        });

        it('should return authentication failed result when token invalid', async () => {
            // arrange
            const verifyTokenResponse = getVerifyTokenRequest(false);
            jest.spyOn(OWApiClient.prototype, 'verifyToken').mockResolvedValueOnce(verifyTokenResponse);
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: false, umInfo: null });

            // act
            const actualResult = await authService.signIn('0.0.0.1', 'token', 'userAgent', 1);

            // assert
            expect(actualResult.isAuthenticated).toBe(false);
        });

        it('should return unauthorized when UM and user is NOT super player', async () => {
            // arrange
            const verifyTokenResponse: VerifyTokenResponse = getVerifyTokenRequest(true);
            jest.spyOn(OWApiClient.prototype, 'verifyToken').mockResolvedValueOnce(verifyTokenResponse);
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: true, umInfo: new UMInfo() });
            jest.spyOn(GlobalConfigService.prototype, 'isSuperPlayers').mockResolvedValueOnce(false);
            stubUsersService.getByMemberName.mockResolvedValueOnce({ local: {} });

            // act
            const actualResult = await authService.signIn('0.0.0.1', 'token', 'userAgent', 1);

            // assert
            expect(actualResult.isAuthenticated).toBe(false);
        });

        it('should return unauthorized when UM and user is NOT exist', async () => {
            // arrange
            const verifyTokenResponse: VerifyTokenResponse = getVerifyTokenRequest(true);
            jest.spyOn(OWApiClient.prototype, 'verifyToken').mockResolvedValueOnce(verifyTokenResponse);
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: true, umInfo: new UMInfo() });
            jest.spyOn(GlobalConfigService.prototype, 'isSuperPlayers').mockResolvedValueOnce(true);
            stubUsersService.getByMemberName.mockResolvedValueOnce(null);

            // act
            const actualResult = await authService.signIn('0.0.0.1', 'token', 'userAgent', 1);

            // assert
            expect(actualResult.isAuthenticated).toBe(false);
        });

        it('should return authentication successful when UM and user is super player', async () => {
            // arrange
            const verifyTokenResponse: VerifyTokenResponse = getVerifyTokenRequest(true);
            jest.spyOn(OWApiClient.prototype, 'verifyToken').mockResolvedValueOnce(verifyTokenResponse);
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: true, umInfo: new UMInfo() });
            jest.spyOn(GlobalConfigService.prototype, 'isSuperPlayers').mockResolvedValueOnce(true);
            const addSessionIfNotExistFunc = jest.spyOn<any, any>(AuthService.prototype, 'addSessionIfNotExist').mockImplementation(() => {
                return {
                    username: 'user',
                    language: 'en',
                    sessionId: 'session',
                    system: 1,
                };
            });
            stubUsersService.getByMemberName.mockResolvedValueOnce({ local: {} });

            // act
            const actualResult = await authService.signIn('0.0.0.1', 'token', 'userAgent', 1);

            // assert
            expect(addSessionIfNotExistFunc).toHaveBeenCalled();
            expect(actualResult.isAuthenticated).toBe(true);
        });
    });

    describe('reCheckIn test', () => {
        it('should return invalid session when session is invalid', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: false,
                session: new UserSession(),
            });

            // act
            const actualResult = await authService.reCheckIn({ session: 'session', username: 'user', browserUserAgent: 'userAgent' });

            // assert
            expect(actualResult.isSuccessful).toBe(false);
        });

        it('should update reCheckIn time when session is valid', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(UserSessionsService.prototype, 'updateReCheckInTime').mockImplementation();

            // act
            await authService.reCheckIn({ session: 'session', username: 'user', browserUserAgent: 'userAgent' });

            // assert
            expect(UserSessionsService.prototype.updateReCheckInTime).toHaveBeenCalled();
        });

        it('should return recheckIn successful when session is valid and have none user info', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(UserSessionsService.prototype, 'updateReCheckInTime').mockImplementation();
            stubUserInfoService.getUserInfo.mockResolvedValueOnce(null);

            // act
            const actualResult = await authService.reCheckIn({ session: 'session', username: 'user', browserUserAgent: 'userAgent' });

            // assert
            expect(actualResult.isSuccessful).toBe(true);
        });

        it('should return recheckIn api error when get balance failed', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(UserSessionsService.prototype, 'updateReCheckInTime').mockImplementation();
            stubUserInfoService.getUserInfo.mockResolvedValueOnce(new UserInfo());
            jest.spyOn<any, any>(AuthService.prototype, 'getBalanceBySession').mockResolvedValueOnce({
                isSuccessful: false,
                errorCode: 'SB0001',
            });

            // act
            const actualResult = (await authService.reCheckIn({
                session: 'session',
                username: 'user',
                browserUserAgent: 'userAgent',
            })) as ReCheckInResponse;

            // assert
            expect(actualResult.apiError.errorCode).toEqual('SB0001');
        });
    });

    describe('verifySession test', () => {
        const verifySessionRequest: VerifySessionRequest = { username: 'user1', session: 'session', browserUserAgent: 'userAgent' };

        it('should return unsuccessful result when session is invalid', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: false,
                session: new UserSession(),
            });
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: false, umInfo: null });

            // act
            const actualResult = await authService.verifySession(verifySessionRequest);

            // assert
            expect(actualResult.isSuccessful).toBe(false);
        });

        it('should return successful result when session is valid', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: false, umInfo: null });

            // act
            const actualResult = await authService.verifySession(verifySessionRequest);

            // assert
            expect(actualResult.isSuccessful).toBe(true);
        });

        it('should always return unsuccessful when UM and member is NOT super player', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: false,
                session: new UserSession(),
            });

            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({
                isUM: true,
                umInfo: new UMInfo(),
            });

            jest.spyOn(GlobalConfigService.prototype, 'isSuperPlayers').mockResolvedValueOnce(false);

            // act
            const actualResult = await authService.verifySession(verifySessionRequest);

            // assert
            expect(actualResult.isSuccessful).toBe(false);
        });

        it('should return unsuccessful when UM and member is super player but not authenticated', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: false,
                session: new UserSession(),
            });

            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({
                isUM: true,
                umInfo: new UMInfo(),
            });

            jest.spyOn(GlobalConfigService.prototype, 'isSuperPlayers').mockResolvedValueOnce(true);

            // act
            const actualResult = await authService.verifySession(verifySessionRequest);

            // assert
            expect(actualResult.isSuccessful).toBe(false);
        });

        it('should return successful when UM and member is super player and authenticated', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({
                isUM: true,
                umInfo: new UMInfo(),
            });

            jest.spyOn(GlobalConfigService.prototype, 'isSuperPlayers').mockResolvedValueOnce(true);

            // act
            const actualResult = await authService.verifySession(verifySessionRequest);

            // assert
            expect(actualResult.isSuccessful).toBe(true);
        });
    });

    describe('authorize test', () => {
        const verifySessionRequest: VerifySessionRequest = { username: 'user1', session: 'session', browserUserAgent: 'userAgent' };

        it('should return unsuccessful result when session is invalid', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: false,
                session: new UserSession(),
            });
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: false, umInfo: null });

            const expectedResult = new Result(invalidSession.errorCode, invalidSession.message, null);

            // act
            const actualResult = (await authService.authorize(verifySessionRequest)) as Result;

            // assert
            expect(actualResult).toStrictEqual(expectedResult);
        });

        it('should return invalid session when do not have user document', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: false, umInfo: null });
            stubUsersService.getByUsername.mockResolvedValueOnce(null);

            // act
            const actualResult = (await authService.authorize(verifySessionRequest)) as Result;

            // assert
            expect(actualResult).toBe(invalidSession);
        });

        it('should return invalid session when do not have user info', async () => {
            // arrange
            const expectResult = new AuthorizeResult(false);
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: false, umInfo: null });
            stubUsersService.getByUsername.mockResolvedValueOnce({});
            stubUserInfoService.getUserInfo.mockResolvedValueOnce(null);

            // act
            const actualResult = await authService.authorize(verifySessionRequest);

            // assert
            expect(actualResult).toEqual(expectResult);
        });

        it('should call notify login and return authorized when user info is available', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({ isUM: false, umInfo: null });
            const notifyLoginFunc = jest.spyOn<any, any>(AuthService.prototype, 'notifyLogin').mockImplementation(jest.fn());
            jest.spyOn(CurrenciesService.prototype, 'getPartnerCurrency').mockResolvedValue({
                groupId: '1',
                name: 'currency',
                code: '123',
                rate: 2,
                enabled: true,
                isTest: false,
                partnerId: 'abc',
            });

            // act
            const actualResult = (await authService.authorize(verifySessionRequest)) as AuthorizeResult;

            // assert
            expect(notifyLoginFunc).toHaveBeenCalled();
            expect(actualResult.authorized).toBe(true);
        });

        it('should return unauthorized when UM and user is NOT super player', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });
            jest.spyOn(SettingsService.prototype, 'getSettings').mockResolvedValueOnce({
                isUM: true,
                umInfo: new UMInfo(),
            });
            jest.spyOn(GlobalConfigService.prototype, 'isSuperPlayers').mockResolvedValueOnce(true);
            stubUsersService.getByUsername.mockResolvedValueOnce({});

            // act
            const actualResult = (await authService.authorize(verifySessionRequest)) as AuthorizeResult;

            // assert
            expect(actualResult.authorized).toBe(false);
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
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: false,
                session: new UserSession(),
            });
            const expectedResult = new Result(invalidSession.errorCode, invalidSession.message, null);

            // act
            const actualResult = await authService.createCharacterName(createNicknameRequest);

            // assert
            expect(actualResult).toEqual(expectedResult);
        });

        it('should return invalid sign name when nick name is invalid', async () => {
            // arrange
            jest.spyOn<any, any>(AuthService.prototype, 'validateNickname').mockResolvedValueOnce({ isSuccessful: false });
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            // act
            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as Result;

            // assert
            expect(actualResult.isSuccessful).toEqual(false);
        });

        it('should return invalid sign name when nick name is same as user name', async () => {
            // arrange
            stubUsersService.getById.mockResolvedValueOnce({ local: { username: createNicknameRequest.nickname } });
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            // act
            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as Result;

            // assert
            expect(actualResult.isSuccessful).toBe(false);
        });

        it('should return successful when user info was created', async () => {
            // arrange
            stubUsersService.getById.mockResolvedValueOnce({ local: { username: createNicknameRequest.username } });
            stubUserInfoService.getUserInfo.mockResolvedValueOnce({});
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            // act
            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as AuthorizeResult;

            // assert
            expect(actualResult.authorized).toBe(true);
        });

        it('should return unsuccessful when nick name is existed', async () => {
            // arrange
            stubUserInfoService.isExistingCharacterName.mockResolvedValueOnce(true);
            stubUsersService.getById.mockResolvedValueOnce({ local: { username: createNicknameRequest.username } });
            jest.spyOn<any, any>(AuthService.prototype, 'generateCharacterName').mockResolvedValueOnce('UUSUser');
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            // act
            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as Result;

            // assert
            expect(actualResult).toEqual(duplicateNickname);
        });

        it('should return unsuccessful when nick name is existed', async () => {
            // arrange
            stubUserInfoService.isExistingCharacterName.mockResolvedValueOnce(false);
            stubUsersService.getById.mockResolvedValueOnce({ local: { username: createNicknameRequest.username } });
            stubUserInfoService.getLatestUserInfoUID.mockResolvedValueOnce(1);
            stubUserInfoService.upSertUserInfo.mockResolvedValueOnce(null);
            jest.spyOn<any, any>(AuthService.prototype, 'generateCharacterName').mockResolvedValueOnce('UUSUser');
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            // act
            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as Result;

            // assert
            expect(actualResult).toEqual(duplicateNickname);
        });

        it('should notify login and return successful', async () => {
            // arrange
            stubUserInfoService.isExistingCharacterName.mockResolvedValueOnce(false);
            stubUsersService.getById.mockResolvedValueOnce({ local: { username: createNicknameRequest.username } });
            stubUserInfoService.getLatestUserInfoUID.mockResolvedValueOnce(1);
            stubUserInfoService.upSertUserInfo.mockResolvedValueOnce({ upsetResult: { upserted: [1] } });
            jest.spyOn<any, any>(AuthService.prototype, 'generateCharacterName').mockResolvedValueOnce('UUSUser');
            const notifyLoginFunc = jest.spyOn<any, any>(AuthService.prototype, 'notifyLogin').mockImplementation(() => {});
            jest.spyOn<any, any>(AuthService.prototype, 'getBalanceBySession').mockResolvedValueOnce({ balance: 100 });
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            // act
            const actualResult = (await authService.createCharacterName(createNicknameRequest)) as AuthorizeResult;

            // assert
            expect(notifyLoginFunc).toHaveBeenCalled();
            expect(actualResult.authorized).toEqual(true);
        });
    });

    describe('getBalance test', () => {
        const request: VerifySessionRequest = { username: 'userName', session: 'session', browserUserAgent: 'browserAgent' };

        it('should return invalid session when verify session failed', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: false,
                session: new UserSession(),
            });

            // act
            const actualResult = await authService.getBalance(request);

            // assert
            expect(actualResult).toEqual(invalidSession);
        });

        it('should return invalid session when have no user info', async () => {
            // arrange
            stubUserInfoService.getUserInfo.mockResolvedValueOnce(null);
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            // act
            const actualResult = await authService.getBalance(request);

            // assert
            expect(actualResult).toEqual(invalidSession);
        });

        it('should return balance when session & user info is valid', async () => {
            // arrange
            stubUserInfoService.getUserInfo.mockResolvedValueOnce(null);
            jest.spyOn<any, any>(AuthService.prototype, 'getBalanceBySession').mockResolvedValueOnce(new GetBalanceResult('0', '', 100));
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: new UserSession(),
            });

            // act
            const actualResult = await authService.getBalance(request);

            // assert
            expect(actualResult instanceof GetBalanceResult);
        });
    });
});

afterAll(() => {
    jest.clearAllMocks();
});
