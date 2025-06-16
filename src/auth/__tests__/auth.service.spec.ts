import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { SentryLogger, UtilsService } from '../../common/providers';
import { CurrencyGroupGameService } from '../../currency-group-games/currency-group-games.service';
import { CurrencyGroupService } from '../../currency-groups/currency-group.service';
import { ExchangeRateService } from '../../exchange_rates/exchange-rate.services';
import { GameConfigService } from '../../game-config/game-config.service';
import { StringFormatExtensions } from '../../helpers';
import { OWApiClient } from '../../ow-api/ow-api.client';
import { PartnerConfigService } from '../../partner-config/partner-config.service';
import { PartnerService } from '../../partner/partner.service';
import { UMService } from '../../um/um.service';
import { UserInfosService, UserSessionsService, UsersService } from '../../users/providers';
import { Spin } from '../schemas/spins';
import { getModelToken } from '@nestjs/mongoose';
import { UMResult } from '../../shared/models/um-result';

describe('AuthService - signIn', () => {
    let service: AuthService;
    let mockLogger: any;
    let mockApiClient: any;
    let mockUsersService: any;
    let mockUserSessionsService: any;
    let mockUserInfosService: any;
    let mockUtilsService: any;
    let mockConfigService: any;
    let mockSpinModel: any;
    let mockPartnerConfigService: any;
    let mockGameConfigService: any;
    let mockUMService: any;
    let mockCurrencyGroupGameService: any;
    let mockCurrencyGroupService: any;
    let mockPartnerService: any;
    let mockExchangeRateService: any;
    let mockStringFormatExtensions: any;

    beforeEach(async () => {
        mockLogger = { log: jest.fn(), error: jest.fn() };
        mockApiClient = { verifyToken: jest.fn(), getBalance: jest.fn(), notifyLogin: jest.fn() };
        mockUsersService = { getByUsername: jest.fn(), createUser: jest.fn() };
        mockUserSessionsService = { getUserSessionByToken: jest.fn(), createUserSession: jest.fn(), verifySession: jest.fn(), updateReCheckInTime: jest.fn() };
        mockUserInfosService = { getUserInfo: jest.fn(), updateBalance: jest.fn(), isExistingCharacterName: jest.fn(), getLatestUserInfoUID: jest.fn(), upSertUserInfo: jest.fn() };
        mockUtilsService = { normalizeIP: jest.fn() };
        mockConfigService = { get: jest.fn() };
        mockSpinModel = { findOne: jest.fn() };
        mockPartnerConfigService = { isSuperPlayers: jest.fn(), getExclusionSites: jest.fn() };
        mockGameConfigService = { getEnabledGameIds: jest.fn() };
        mockUMService = { getUMResult: jest.fn() };
        mockCurrencyGroupGameService = { getOfferedGames: jest.fn() };
        mockCurrencyGroupService = { getCurrencyGroup: jest.fn(), getCurrency: jest.fn() };
        mockPartnerService = { isDisplayPlayerCurrency: jest.fn() };
        mockExchangeRateService = { getRateByUser: jest.fn() };
        mockStringFormatExtensions = { formatUserName: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: SentryLogger, useValue: mockLogger },
                { provide: OWApiClient, useValue: mockApiClient },
                { provide: UsersService, useValue: mockUsersService },
                { provide: UserSessionsService, useValue: mockUserSessionsService },
                { provide: UserInfosService, useValue: mockUserInfosService },
                { provide: UtilsService, useValue: mockUtilsService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: getModelToken(Spin.name), useValue: mockSpinModel },
                { provide: PartnerConfigService, useValue: mockPartnerConfigService },
                { provide: GameConfigService, useValue: mockGameConfigService },
                { provide: UMService, useValue: mockUMService },
                { provide: CurrencyGroupGameService, useValue: mockCurrencyGroupGameService },
                { provide: CurrencyGroupService, useValue: mockCurrencyGroupService },
                { provide: PartnerService, useValue: mockPartnerService },
                { provide: ExchangeRateService, useValue: mockExchangeRateService },
                { provide: StringFormatExtensions, useValue: mockStringFormatExtensions },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jest.clearAllMocks();
        process.env.SYSTEM_TYPE = 'VG2';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('signIn_happyPath_shouldReturnAuthenticateResult', async () => {
        // Arrange
        const ip = '1.2.3.4';
        const token = 'token';
        const userAgent = 'agent';
        const system = 1;
        const verifyTokenData = { isSuccessful: true, appType: 1, operatorId: 'op1', playerId: 'p1', memberKey: 'mk', playerName: 'pn', currencyName: 'USD', operatorPlayerId: 'opid', seq: 'seq', siteId: 'site', language: 'en', currencyCode: 'USD', currencyGroupId: 'cgid', isTestCurrency: false, multiplier: 1, siteName: 'site', disableJackpotGames: false, operatorToken: 'ot', disableAward: false };
        const umSettings = { isUM: false, umInfo: null };
        const user = { id: 'uid', local: { memberName: 'mem', partnerId: 'pid', clientId: 'cid' } };
        const userSession = { username: 'mk', language: 'en', sessionId: 'sid', system: 1, playerName: 'pn', currencyCode: 'USD', multiplier: 1, currencyGroupId: 'cgid' };
        const rate = 1.23;
        const currencyGroup = { fractionalOddsFormat: false, name: 'cg', enabled: true };
        const offerGames = [{ gameId: 1 }];

        mockUtilsService.normalizeIP.mockReturnValue(ip);
        mockApiClient.verifyToken.mockResolvedValue(verifyTokenData);
        mockUMService.getUMResult.mockResolvedValue(umSettings);
        mockStringFormatExtensions.formatUserName.mockReturnValue('mk');
        mockUsersService.getByUsername.mockResolvedValue(user);
        mockPartnerConfigService.isSuperPlayers.mockResolvedValue(false);
        mockUserSessionsService.getUserSessionByToken.mockResolvedValue(null);
        mockUserSessionsService.createUserSession.mockResolvedValue(userSession);
        mockExchangeRateService.getRateByUser.mockResolvedValue(rate);
        mockCurrencyGroupService.getCurrencyGroup.mockResolvedValue(currencyGroup);
        mockCurrencyGroupGameService.getOfferedGames.mockResolvedValue(offerGames);
        mockCurrencyGroupService.getCurrency.mockResolvedValue({ enabled: true });
        mockPartnerConfigService.getExclusionSites.mockResolvedValue({});

        // Act
        const result = await service.signIn(ip, token, userAgent, system);

        // Assert
        expect(result.isAuthenticated).toBe(true);
        expect(result.username).toBe(userSession.username);
        expect(result.language).toBe(userSession.language);
        expect(result.ss).toBe(userSession.sessionId);
        expect(result.system).toBe(userSession.system);
        expect(result.memberName).toBe(userSession.playerName);
        expect(result.rate).toBe(rate);
        expect(result.offerGames).toEqual(offerGames);
        expect(result.fractionalOddsFormat).toBe(currencyGroup.fractionalOddsFormat);
        expect(result.umInfo).toBeNull();
        expect(mockApiClient.verifyToken).toHaveBeenCalled();
        expect(mockUMService.getUMResult).toHaveBeenCalledWith(verifyTokenData.operatorId);
        expect(mockUsersService.getByUsername).toHaveBeenCalled();
        expect(mockUserSessionsService.createUserSession).toHaveBeenCalled();
        expect(mockExchangeRateService.getRateByUser).toHaveBeenCalled();
        expect(mockCurrencyGroupService.getCurrencyGroup).toHaveBeenCalled();
        expect(mockCurrencyGroupGameService.getOfferedGames).toHaveBeenCalled();
    });

    it('signIn_invalidToken_shouldReturnAuthenticateResultWithUMInfo', async () => {
        // Arrange
        const ip = '1.2.3.4';
        const token = 'token';
        const userAgent = 'agent';
        const system = 1;
        const verifyTokenData = { isSuccessful: false, appType: 1, operatorId: 'op1', playerId: 'p1' };
        const umSettings = { isUM: false, umInfo: { start: new Date('2020-01-01'), end: new Date('2020-01-02'), partnerId: 'pid' } };

        mockUtilsService.normalizeIP.mockReturnValue(ip);
        mockApiClient.verifyToken.mockResolvedValue(verifyTokenData);
        mockUMService.getUMResult.mockResolvedValue(umSettings);

        // Act
        const result = await service.signIn(ip, token, userAgent, system);

        // Assert
        expect(result.isAuthenticated).toBe(false);
        expect(result.umInfo).toEqual(new UMResult(new Date('2020-01-01'), new Date('2020-01-02'), 'pid'));
        expect(mockLogger.log).toHaveBeenCalled();
    });

    it('signIn_umUserNotSuperPlayer_shouldReturnAuthenticateResultWithUMInfo', async () => {
        // Arrange
        const ip = '1.2.3.4';
        const token = 'token';
        const userAgent = 'agent';
        const system = 1;
        const verifyTokenData = { isSuccessful: true, appType: 1, operatorId: 'op1', playerId: 'p1' };
        const umSettings = { isUM: true, umInfo: { start: new Date('2020-01-01'), end: new Date('2020-01-02'), partnerId: 'pid' } };
        const user = { local: { memberName: 'mem', partnerId: 'pid', clientId: 'cid' } };

        mockUtilsService.normalizeIP.mockReturnValue(ip);
        mockApiClient.verifyToken.mockResolvedValue(verifyTokenData);
        mockUMService.getUMResult.mockResolvedValue(umSettings);
        mockStringFormatExtensions.formatUserName.mockReturnValue('mk');
        mockUsersService.getByUsername.mockResolvedValue(user);
        mockPartnerConfigService.isSuperPlayers.mockResolvedValue(false);

        // Act
        const result = await service.signIn(ip, token, userAgent, system);

        // Assert
        expect(result.isAuthenticated).toBe(false);
        expect(result.umInfo).toEqual(new UMResult(new Date('2020-01-01'), new Date('2020-01-02'), 'pid'));
    });

    it('signIn_umUserSuperPlayer_shouldReturnAuthenticateResult', async () => {
        // Arrange
        const ip = '1.2.3.4';
        const token = 'token';
        const userAgent = 'agent';
        const system = 1;
        const verifyTokenData = { isSuccessful: true, appType: 1, operatorId: 'op1', playerId: 'p1', memberKey: 'mk', playerName: 'pn', currencyName: 'USD', operatorPlayerId: 'opid', seq: 'seq', siteId: 'site', language: 'en', currencyCode: 'USD', currencyGroupId: 'cgid', isTestCurrency: false, multiplier: 1, siteName: 'site', disableJackpotGames: false, operatorToken: 'ot', disableAward: false };
        const umSettings = { isUM: true, umInfo: { start: 's', end: 'e', partnerId: 'pid' } };
        const user = { id: 'uid', local: { memberName: 'mem', partnerId: 'pid', clientId: 'cid' } };
        const userSession = { username: 'mk', language: 'en', sessionId: 'sid', system: 1, playerName: 'pn', currencyCode: 'USD', multiplier: 1, currencyGroupId: 'cgid' };
        const rate = 1.23;
        const currencyGroup = { fractionalOddsFormat: false, name: 'cg', enabled: true };
        const offerGames = [{ gameId: 1 }];

        mockUtilsService.normalizeIP.mockReturnValue(ip);
        mockApiClient.verifyToken.mockResolvedValue(verifyTokenData);
        mockUMService.getUMResult.mockResolvedValue(umSettings);
        mockStringFormatExtensions.formatUserName.mockReturnValue('mk');
        mockUsersService.getByUsername.mockResolvedValue(user);
        mockPartnerConfigService.isSuperPlayers.mockResolvedValue(true);
        mockUserSessionsService.getUserSessionByToken.mockResolvedValue(null);
        mockUserSessionsService.createUserSession.mockResolvedValue(userSession);
        mockExchangeRateService.getRateByUser.mockResolvedValue(rate);
        mockCurrencyGroupService.getCurrencyGroup.mockResolvedValue(currencyGroup);
        mockCurrencyGroupGameService.getOfferedGames.mockResolvedValue(offerGames);
        mockCurrencyGroupService.getCurrency.mockResolvedValue({ enabled: true });
        mockPartnerConfigService.getExclusionSites.mockResolvedValue({});

        // Act
        const result = await service.signIn(ip, token, userAgent, system);

        // Assert
        expect(result.isAuthenticated).toBe(true);
        expect(result.umInfo).toBeNull();
        expect(result.username).toBe(userSession.username);
    });

    it('signIn_shouldCallCreateUserIfNotExist_whenNotUM', async () => {
        // Arrange
        const ip = '1.2.3.4';
        const token = 'token';
        const userAgent = 'agent';
        const system = 1;
        const verifyTokenData = { isSuccessful: true, appType: 1, operatorId: 'op1', playerId: 'p1', memberKey: 'mk', playerName: 'pn', currencyName: 'USD', operatorPlayerId: 'opid', seq: 'seq', siteId: 'site', language: 'en', currencyCode: 'USD', currencyGroupId: 'cgid', isTestCurrency: false, multiplier: 1, siteName: 'site', disableJackpotGames: false, operatorToken: 'ot', disableAward: false };
        const umSettings = { isUM: false, umInfo: null };
        const user = { id: 'uid', local: { memberName: 'mem', partnerId: 'pid', clientId: 'cid' } };
        const userSession = { username: 'mk', language: 'en', sessionId: 'sid', system: 1, playerName: 'pn', currencyCode: 'USD', multiplier: 1, currencyGroupId: 'cgid' };
        const rate = 1.23;
        const currencyGroup = { fractionalOddsFormat: false, name: 'cg', enabled: true };
        const offerGames = [{ gameId: 1 }];

        mockUtilsService.normalizeIP.mockReturnValue(ip);
        mockApiClient.verifyToken.mockResolvedValue(verifyTokenData);
        mockUMService.getUMResult.mockResolvedValue(umSettings);
        mockUsersService.getByUsername.mockResolvedValue(null);
        mockUsersService.createUser.mockResolvedValue(user);
        mockUserSessionsService.getUserSessionByToken.mockResolvedValue(null);
        mockUserSessionsService.createUserSession.mockResolvedValue(userSession);
        mockExchangeRateService.getRateByUser.mockResolvedValue(rate);
        mockCurrencyGroupService.getCurrencyGroup.mockResolvedValue(currencyGroup);
        mockCurrencyGroupGameService.getOfferedGames.mockResolvedValue(offerGames);
        mockCurrencyGroupService.getCurrency.mockResolvedValue({ enabled: true });
        mockPartnerConfigService.getExclusionSites.mockResolvedValue({});

        // Act
        const result = await service.signIn(ip, token, userAgent, system);

        // Assert
        expect(result.isAuthenticated).toBe(true);
        expect(mockUsersService.createUser).toHaveBeenCalled();
    });

    it('signIn_shouldReturnFalse_whenCheckValidAppTypeFails', async () => {
        // Arrange
        const ip = '1.2.3.4';
        const token = 'token';
        const userAgent = 'agent';
        const system = 2;
        const verifyTokenData = { isSuccessful: true, appType: 1, operatorId: 'op1', playerId: 'p1' };
        const umSettings = { isUM: false, umInfo: null };

        mockUtilsService.normalizeIP.mockReturnValue(ip);
        mockApiClient.verifyToken.mockResolvedValue(verifyTokenData);
        mockUMService.getUMResult.mockResolvedValue(umSettings);

        // Act
        const result = await service.signIn(ip, token, userAgent, system);

        // Assert
        expect(result.isAuthenticated).toBe(false);
        expect(mockLogger.log).toHaveBeenCalled();
    });
});
// ... existing code ... 