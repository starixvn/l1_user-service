import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeanDocument } from 'mongoose';
import { generate } from 'randomstring';
import validator from 'validator';

import { InjectModel } from '@nestjs/mongoose';
import * as Chance from 'chance';
import { CreateNicknameRequest } from '.';
import { SentryLogger, UtilsService } from '../common/providers';
import { CurrencyGroupGameService } from '../currency-group-games/currency-group-games.service';
import { CurrencyGroupService } from '../currency-groups/currency-group.service';
import { CurrencyGroup } from '../currency-groups/schemas';
import { ExchangeRateService } from '../exchange_rates/exchange-rate.services';
import { GameConfigService } from '../game-config/game-config.service';
import { StringFormatExtensions } from '../helpers';
import { GetBalanceRequest, NotifyLoginRequest, VerifyTokenRequest, VerifyTokenResponse } from '../ow-api/models';
import { OWApiClient } from '../ow-api/ow-api.client';
import { PartnerConfigService } from '../partner-config/partner-config.service';
import { PartnerService } from '../partner/partner.service';
import { PromotionService } from '../promotion/promotion.service';
import { Result } from '../shared/models/result';
import { UMResult } from '../shared/models/um-result';
import { UMService } from '../um/um.service';
import { invalidSession } from '../users/constants/errors';
import { VerifySessionRequest } from '../users/models';
import { CreateUserInfoParam, CreateUserParam, CreateUserSessionParam } from '../users/params';
import { UserInfosService, UserSessionsService, UsersService } from '../users/providers';
import { UserDocument, UserSession } from '../users/schemas';
import { AppTypes } from './constants/app-types';
import { duplicateNickname, invalidNicknameChars, invalidNicknameLength, sameWithUsername } from './constants/errors';
import { AuthenticateResult, AuthorizeResult, GetBalanceResult, GetSettingGamesResult, ReCheckInResponse } from './models/result';

@Injectable()
export class AuthService {
    private readonly UUSCurrency = 'UUS';

    private readonly maximumAvatarId = 171;

    @Inject(SentryLogger) private readonly logger: SentryLogger;
    @Inject(OWApiClient) private readonly apiClient: OWApiClient;
    @Inject(UsersService) private readonly usersService: UsersService;
    @Inject(UserSessionsService) private readonly userSessionsService: UserSessionsService;
    @Inject(UserInfosService) private readonly userInfosService: UserInfosService;
    @Inject(UtilsService) private readonly utilsService: UtilsService;
    @Inject(ConfigService) private readonly configService: ConfigService;
    @Inject(PartnerConfigService) private readonly partnerConfigService: PartnerConfigService;
    @Inject(GameConfigService) private readonly gameConfigService: GameConfigService;
    @Inject(UMService) private readonly umService: UMService;
    @Inject(CurrencyGroupGameService) private readonly currencyGroupGameService: CurrencyGroupGameService;
    @Inject(CurrencyGroupService) private readonly currencyGroupService: CurrencyGroupService;
    @Inject(PartnerService) private readonly partnerService: PartnerService;
    @Inject(ExchangeRateService) private readonly exchangeRateService: ExchangeRateService;
    @Inject(StringFormatExtensions) private readonly stringFormatExtensions: StringFormatExtensions;
    @Inject(PromotionService) private readonly promotionService: PromotionService;
    private readonly chance = new Chance();

    async signIn(ip: string, token: string, userAgent: string, system: number) {
        const request = new VerifyTokenRequest(this.utilsService.normalizeIP(ip), token, userAgent);
        const data = await this.apiClient.verifyToken(request);
        const umSettings = await this.umService.getUMResult(data?.operatorId);
        const isValidToken = data && data.isSuccessful && this.checkValidAppType(data.appType, system);
        if (!isValidToken) {
            this.logger.log(
                [
                    `Authentication Failed`,
                    `Request: ${JSON.stringify(request)}`,
                    `Result: ${JSON.stringify(data)}`,
                    `IP Info: ${request.ip}`,
                    `System: ${system}`,
                ].join('\n'),
            );

            return new AuthenticateResult(
                false,
                umSettings.umInfo ? new UMResult(umSettings.umInfo.start, umSettings.umInfo.end, umSettings.umInfo.partnerId) : null,
            );
        }

        const username = this.stringFormatExtensions.formatUserName(data.operatorId, data.playerId);
        const user = umSettings.isUM ? await this.usersService.getByUsername(username) : await this.createUserIfNotExist(data);
        const isSuperPlayer = user
            ? await this.partnerConfigService.isSuperPlayers(user.local.memberName, user.local.partnerId ?? user.local.clientId)
            : false;

        if (umSettings.isUM && !isSuperPlayer) {
            return new AuthenticateResult(false, new UMResult(umSettings.umInfo.start, umSettings.umInfo.end, umSettings.umInfo.partnerId));
        }

        const userSession = await this.addSessionIfNotExist(user, request, data, system);
        const rate = await this.exchangeRateService.getRateByUser(userSession.currencyCode, userSession.multiplier);
        const currencyGroup = await this.currencyGroupService.getCurrencyGroup(userSession.currencyGroupId);
        const offerGames = await this.getOfferGames(userSession, currencyGroup);
        const fractionalOddsFormat = currencyGroup.fractionalOddsFormat;

        return new AuthenticateResult(
            true,
            !isSuperPlayer && umSettings.umInfo
                ? new UMResult(umSettings.umInfo.start, umSettings.umInfo.end, umSettings.umInfo.partnerId)
                : null,
            userSession.username,
            userSession.language,
            userSession.sessionId,
            userSession.system,
            userSession.playerName,
            rate,
            offerGames,
            fractionalOddsFormat,
        );
    }

    checkValidAppType(appType, system) {
        return (appType === AppTypes.SabaClub && system === AppTypes.SabaApp) || appType === system;
    }

    async reCheckIn(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        if (!isAuthenticated) {
            return invalidSession;
        }

        await this.userSessionsService.updateReCheckInTime(request.session);

        const userInfo = await this.userInfosService.getUserInfo(session.userId);
        if (!userInfo) {
            return new Result();
        }

        const getBalanceResponse = await this.getBalanceBySession(session, userInfo.name, false);

        return new ReCheckInResponse(
            getBalanceResponse.balance,
            getBalanceResponse.isSuccessful ? null : new Result(getBalanceResponse.errorCode, getBalanceResponse.message),
        );
    }

    async verifySession(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        const umSettings = await this.umService.getUMResult(session?.operatorId);
        const umInfo = umSettings.umInfo ? new UMResult(umSettings.umInfo.start, umSettings.umInfo.end, umSettings.umInfo.partnerId) : null;
        if (umSettings.isUM) {
            const username = this.stringFormatExtensions.formatUserName(session.operatorId, session.playerId);
            const user = await this.usersService.getByUsername(username);
            const isSuperPlayer = await this.partnerConfigService.isSuperPlayers(
                user?.local.memberName,
                user?.local.partnerId ?? user?.local.clientId,
            );
            return isSuperPlayer && isAuthenticated ? new Result() : new Result(invalidSession.errorCode, invalidSession.message, umInfo);
        }

        return isAuthenticated ? new Result('0', '', umInfo) : invalidSession;
    }

    async authorize(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        const currencyGroup = await this.currencyGroupService.getCurrencyGroup(session.currencyGroupId);
        const offerGames = await this.getOfferGames(session, currencyGroup);
        const fractionalOddsFormat = currencyGroup.fractionalOddsFormat;
        const umSettings = await this.umService.getUMResult(session?.operatorId);
        const umInfo = umSettings.umInfo ? new UMResult(umSettings.umInfo.start, umSettings.umInfo.end, umSettings.umInfo.partnerId) : null;
        if (umSettings.isUM) {
            const username = this.stringFormatExtensions.formatUserName(session.operatorId, session.playerId);
            const user = await this.usersService.getByUsername(username);
            const isSuperPlayer = await this.partnerConfigService.isSuperPlayers(
                user?.local.memberName,
                user?.local.partnerId ?? user?.local.clientId,
            );
            if (!isSuperPlayer) {
                return new AuthorizeResult(false, { offerGames, fractionalOddsFormat });
            }
        }

        if (!isAuthenticated) {
            return new Result(invalidSession.errorCode, invalidSession.message, umInfo);
        }

        const user = await this.usersService.getByUsername(request.username);

        if (!user) {
            this.logger.log(`Account not found at ${new Date()} Info: ${JSON.stringify(request)}`);

            return invalidSession;
        }

        const userInfo = await this.userInfosService.getUserInfo(user.id);

        if (!userInfo) {
            return new AuthorizeResult(false, { offerGames, fractionalOddsFormat });
        }

        await this.notifyLogin(session, userInfo.name);

        const enabledGameIds = await this.gameConfigService.getEnabledGameIds();
        const getBalanceResult = await this.getBalanceBySession(session, userInfo.name, true);
        userInfo.red = getBalanceResult.balance;

        const isDisplayPlayerCurrency = await this.partnerService.isDisplayPlayerCurrency(session.partnerId);
        const rate = await this.exchangeRateService.getRateByUser(session.currencyCode, session.multiplier);

        // Claim promotion before returning
        const offeredGamesNames = await this.currencyGroupGameService.getOfferedGamesNames(session.currencyGroupId);
        const promotionResult = await this.promotionService.claimPromotion(
            session.operatorId,
            session.siteName,
            session.playerId,
            session.currencyGroupId,
        );
        const promotion = await this.promotionService.getPromotion(promotionResult?.promotion?.promotionId);

        const gameOfferPromotion = offeredGamesNames.filter((gameName) =>
            promotion?.gameIds?.some((gameId) => gameName.gameId === gameId) && 
            offerGames.some((offerGame) => offerGame.gameId === gameName.gameId)
        ).map(game => {
            return {
                gameId: game.gameId,
                name: game.gameName,
            };
        });

        return new AuthorizeResult(
            true,
            {
                ...userInfo,
                offerGames,
                enabledGameIds,
                fractionalOddsFormat,
                isDisplayPlayerCurrency,
                disableJackpotGames: session.disableJackpotGames,
                rate,
                multiplier: session.multiplier,
                currencyCode: session.currencyCode,
                currencyGroup: currencyGroup.name,
                disableMiniPanel: this.checkDisableMiniPanel(session),
            },
            umInfo,
            {
                ...promotionResult,
                gameOfferPromotion
            }
        );
    }

    async createCharacterName(request: CreateNicknameRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        if (!isAuthenticated) {
            return invalidSession;
        }

        const validateSignNameResult = this.validateNickname(request.nickname);
        if (!validateSignNameResult.isSuccessful) {
            return validateSignNameResult;
        }

        const user = await this.usersService.getById(session.userId);
        if (user.local.username.toUpperCase() === request.nickname.toUpperCase()) {
            return sameWithUsername;
        }

        const disableMiniPanel = this.checkDisableMiniPanel(session);
        const userInfo = await this.userInfosService.getUserInfo(session.userId);
        const rate = await this.exchangeRateService.getRateByUser(session.currencyCode, session.multiplier);
        if (userInfo) {
            // Claim promotion before returning
            const promotionResult = await this.promotionService.claimPromotion(
                session.operatorId,
                session.siteName,
                session.playerId,
                session.currencyGroupId,
            );

            return new AuthorizeResult(true, { ...userInfo, rate, disableMiniPanel }, null, promotionResult);
        }

        const characterName = this.generateCharacterName(request.nickname, session.currencyName);
        const isCharacterNameExisted = await this.userInfosService.isExistingCharacterName(characterName);

        if (isCharacterNameExisted) {
            return duplicateNickname;
        }

        const latestUID = await this.userInfosService.getLatestUserInfoUID();
        const param = new CreateUserInfoParam(
            session.userId,
            characterName,
            session.currencyName,
            latestUID,
            request.avatar || this.chance.integer({ min: 1, max: this.maximumAvatarId }),
        );
        const upsetResult = await this.userInfosService.upSertUserInfo(param);

        if (!upsetResult || upsetResult?.upserted?.length === 0) {
            return duplicateNickname;
        }

        await this.notifyLogin(session, characterName, true);

        const getBalanceResult = await this.getBalanceBySession(session, param.name, true);
        const currencyGroup = await this.currencyGroupService.getCurrencyGroup(session.currencyGroupId);

        const enabledGameIds = await this.gameConfigService.getEnabledGameIds();
        const offerGames = await this.getOfferGames(session, currencyGroup);
        const fractionalOddsFormat = currencyGroup.fractionalOddsFormat;
        const isDisplayPlayerCurrency = await this.partnerService.isDisplayPlayerCurrency(session.partnerId);

        // Claim promotion before returning
        const promotionResult = await this.promotionService.claimPromotion(
            session.operatorId,
            session.siteName,
            session.playerId,
            session.currencyGroupId,
        );

        return new AuthorizeResult(
            true,
            {
                ...param,
                red: getBalanceResult.balance,
                offerGames,
                enabledGameIds,
                fractionalOddsFormat,
                isDisplayPlayerCurrency,
                rate,
                disableJackpotGames: session.disableJackpotGames,
                multiplier: session.multiplier,
                currencyCode: session.currencyCode,
                currencyGroup: currencyGroup.name,
                disableMiniPanel,
            },
            null,
            promotionResult,
        );
    }

    async getBalance(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        if (!isAuthenticated) {
            return invalidSession;
        }

        const userInfo = await this.userInfosService.getUserInfo(session.userId);
        if (!userInfo) {
            return invalidSession;
        }

        return this.getBalanceBySession(session, userInfo.name, true);
    }

    private async getBalanceBySession(userSession: UserSession, nickname: string, captureBalance: boolean) {
        const getBalanceRequest = new GetBalanceRequest(
            userSession.owSeq,
            userSession.siteId,
            userSession.playerId,
            userSession.language,
            userSession.operatorId,
            userSession.operatorToken,
        );
        const response = await this.apiClient.getBalance(
            getBalanceRequest,
            this.composeBeforeCallMessage(userSession, nickname, getBalanceRequest),
        );

        if (captureBalance) {
            this.userInfosService.updateBalance(userSession.userId, response.balance);
        }

        return new GetBalanceResult(response.errorCode.toString(), response.errorMessage, response.balance);
    }

    private generateCharacterName(signName: string, currency: string) {
        if (process.env.ENV.toUpperCase() === 'UAT' && currency.toUpperCase() === this.UUSCurrency) {
            return `${this.configService.get('prefixCharacterName') ?? ''}${signName}`;
        }

        return signName;
    }

    private validateNickname(name: string) {
        const az09 = new RegExp('^[a-zA-Z0-9]+$');
        const criteria = [
            {
                failure: !name || !validator.isLength(name, { min: 3, max: 14 }),
                error: invalidNicknameLength,
            },
            {
                failure: !az09.test(name),
                error: invalidNicknameChars,
            },
        ];

        const failedCriterion = criteria.find((criterion) => criterion.failure);

        return failedCriterion ? failedCriterion.error : new Result();
    }

    private formatCurrency(currency: string) {
        return currency && currency.toUpperCase() === 'UUS' ? 'UUS' : currency;
    }

    private async createUserIfNotExist(verifyTokenResult: VerifyTokenResponse) {
        const { memberKey, playerId, playerName, operatorId, currencyName, operatorPlayerId } = verifyTokenResult;

        return (
            (await this.usersService.getByUsername(verifyTokenResult.memberKey)) ??
            this.usersService.createUser(
                new CreateUserParam(
                    memberKey,
                    `${memberKey}@#QWE`,
                    new Date(),
                    operatorId,
                    playerId,
                    playerName,
                    this.formatCurrency(currencyName),
                ),
                playerId,
                operatorId,
                operatorPlayerId,
            )
        );
    }

    private async addSessionIfNotExist(
        user: LeanDocument<UserDocument>,
        verifyTokenParam: VerifyTokenRequest,
        verifyTokenResult: VerifyTokenResponse,
        system: number,
    ) {
        const { token, browserUserAgent, ip } = verifyTokenParam;
        const {
            memberKey,
            seq,
            playerId,
            siteId,
            language,
            currencyCode,
            currencyName,
            currencyGroupId,
            isTestCurrency,
            multiplier,
            operatorId,
            playerName,
            siteName,
            disableJackpotGames,
            operatorToken,
            disableAward,
        } = verifyTokenResult;

        const session = await this.userSessionsService.getUserSessionByToken(token);
        if (session) {
            return session;
        } else {
            return this.userSessionsService.createUserSession(
                new CreateUserSessionParam({
                    ssoToken: token,
                    sessionId: `${generate()}_${memberKey}`,
                    owSeq: seq,
                    username: memberKey,
                    memberId: playerId,
                    ssoTime: new Date(),
                    recheckInTime: new Date(),
                    ip,
                    browserUserAgent,
                    siteId: siteId,
                    userId: user.id,
                    language,
                    currencyCode: currencyCode,
                    currencyName: this.formatCurrency(currencyName),
                    currencyGroupId,
                    isTestCurrency,
                    multiplier,
                    partnerId: operatorId,
                    memberName: playerName,
                    siteName,
                    system,
                    operatorId,
                    playerId,
                    playerName,
                    disableJackpotGames,
                    operatorToken,
                    disableAward,
                }),
            );
        }
    }

    private async notifyLogin(session: UserSession, characterName: string, isFirstLogin = false) {
        const request = new NotifyLoginRequest(
            session.owSeq,
            session.siteId,
            session.playerId,
            session.language,
            characterName,
            isFirstLogin,
            session.operatorId,
            session.operatorToken,
        );

        return this.apiClient.notifyLogin(request, this.composeBeforeCallMessage(session, characterName, request));
    }

    private composeBeforeCallMessage(session: UserSession, characterName: string, params: any) {
        const nameDisplay = characterName ? `\n\tCharacter: ${characterName} ` : '';

        return `Before Action at ${new Date()}: \n\tSession: ${JSON.stringify(session)} ${nameDisplay}\n\tParams:${JSON.stringify(params)}`;
    }

    private async getOfferGames(session: UserSession, currencyGroup: CurrencyGroup) {
        const currency = await this.currencyGroupService.getCurrency(session.currencyName, session?.operatorId);

        if (!currency?.enabled || !currencyGroup?.enabled) {
            return [];
        }

        const groupOfferGames = await this.currencyGroupGameService.getOfferedGames(session.currencyGroupId);
        const gameSiteExclusions = await this.partnerConfigService.getExclusionSites(session?.operatorId);

        const siteExclusionGames = Object.keys(gameSiteExclusions ?? {}).reduce((result, gameId) => {
            const exclusionSites = gameSiteExclusions[gameId]?.map((site) => site?.toLocaleLowerCase());

            if (exclusionSites.includes(session.siteName.toLocaleLowerCase())) {
                result.push(+gameId);
            }

            return result;
        }, []);
        return groupOfferGames?.filter((game) => !siteExclusionGames.includes(game.gameId)) ?? [];
    }

    async getSettingGames(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        if (!isAuthenticated) {
            return invalidSession;
        }

        const settingGames = await this.currencyGroupGameService.getOfferedGames(session.currencyGroupId);
        return new GetSettingGamesResult(true, settingGames);
    }

    private checkDisableMiniPanel(session: UserSession): boolean {
        return !!(
            process.env.MINI_PANEL_EXCLUDED_SITES &&
            process.env.MINI_PANEL_EXCLUDED_SITES.split(',').some((x) => x.toUpperCase() === session.siteName.toUpperCase())
        );
    }
}
