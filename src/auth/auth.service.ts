import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeanDocument } from 'mongoose';
import { generate } from 'randomstring';
import validator from 'validator';

import { CreateNicknameRequest } from '.';
import { SentryLogger, UtilsService } from '../common/providers';
import { CurrencyGroupGameService } from '../currency-group-games/currency-group-games.service';
import { PartnerConfigService } from '../partner-config/partner-config.service';
import { GetBalanceRequest, NotifyLoginRequest, VerifyTokenRequest, VerifyTokenResponse } from '../ow-api/models';
import { OWApiClient } from '../ow-api/ow-api.client';
import { Result } from '../shared/models/result';
import { UMResult } from '../shared/models/um-result';
import { UMService } from '../um/um.service';
import { invalidSession } from '../users/constants/errors';
import { VerifySessionRequest } from '../users/models';
import { CreateUserInfoParam, CreateUserParam, CreateUserSessionParam } from '../users/params';
import { UserInfosService, UserSessionsService, UsersService } from '../users/providers';
import { UserDocument, UserSession } from '../users/schemas';
import { duplicateNickname, invalidNicknameChars, invalidNicknameLength, sameWithUsername } from './constants/errors';
import { AuthenticateResult, AuthorizeResult, GetBalanceResult, GetSettingGamesResult, ReCheckInResponse } from './models/result';
import { CurrencyGroupService } from '../currency-groups/currency-group.service';
import * as Chance from 'chance';
import { InjectModel } from '@nestjs/mongoose';
import { MiddleSiteApiClient } from '../middle-site-api/middle-site-api.client';
import { Spin } from './schemas/spins';
import { isSC1System, isVG2System } from '../shared/system-type';

@Injectable()
export class AuthService {
    private readonly UUSCurrency = 'UUS';

    @Inject(SentryLogger) private readonly logger: SentryLogger;
    @Inject(OWApiClient) private readonly apiClient: OWApiClient;
    @Inject(UsersService) private readonly usersService: UsersService;
    @Inject(UserSessionsService) private readonly userSessionsService: UserSessionsService;
    @Inject(UserInfosService) private readonly userInfosService: UserInfosService;
    @Inject(UtilsService) private readonly utilsService: UtilsService;
    @Inject(ConfigService) private readonly configService: ConfigService;
    @Inject(MiddleSiteApiClient) private readonly middleSiteApiClient: MiddleSiteApiClient;
    @InjectModel(Spin.name) private readonly spinModel;
    @Inject(PartnerConfigService) private readonly partnerConfigService: PartnerConfigService;
    @Inject(UMService) private readonly umService: UMService;
    @Inject(CurrencyGroupGameService) private readonly currencyGroupGameService: CurrencyGroupGameService;
    @Inject(CurrencyGroupService) private readonly currencyGroupService: CurrencyGroupService;
    private readonly chance = new Chance();
    private readonly systemType = process.env.SYSTEM_TYPE;

    async signIn(ip: string, token: string, userAgent: string, system: number) {
        const request = new VerifyTokenRequest(this.utilsService.normalizeIP(ip), token, userAgent);
        const data = await this.apiClient.verifyToken(request);
        const umSettings = await this.umService.getUMResult(data?.operatorId);

        const isValidToken = data && data.isSuccessful && data.appType === system;
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

            return new AuthenticateResult(false, umSettings.umInfo ? new UMResult(umSettings.umInfo.start, umSettings.umInfo.end) : null);
        }

        const user = umSettings.isUM ? await this.usersService.getByMemberName(data.playerName) : await this.createUserIfNotExist(data);
        const isSuperPlayer = user
            ? await this.partnerConfigService.isSuperPlayers(user.local.memberName, user.local.partnerId ?? user.local.clientId)
            : false;

        if (umSettings.isUM && !isSuperPlayer) {
            return new AuthenticateResult(false, new UMResult(umSettings.umInfo.start, umSettings.umInfo.end));
        }

        const userSession = await this.addSessionIfNotExist(user, request, data, system);

        return new AuthenticateResult(
            true,
            !isSuperPlayer && umSettings.umInfo ? new UMResult(umSettings.umInfo.start, umSettings.umInfo.end) : null,
            userSession.username,
            userSession.language,
            userSession.sessionId,
            userSession.system,
            userSession.playerName,
        );
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

        return isSC1System(this.systemType)
            ? new ReCheckInResponse(
                  getBalanceResponse.balance,
                  getBalanceResponse.isSuccessful ? null : new Result(getBalanceResponse.errorCode, getBalanceResponse.message),
              )
            : new ReCheckInResponse(
                  getBalanceResponse.balance,
                  getBalanceResponse.isSuccessful ? null : new Result(getBalanceResponse.errorCode, getBalanceResponse.message),
                  await this.getAvailableSpins(session.memberId),
                  userInfo.scoins,
              );
    }

    async verifySession(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        const umSettings = await this.umService.getUMResult(session?.operatorId);
        const umInfo = umSettings.umInfo ? new UMResult(umSettings.umInfo.start, umSettings.umInfo.end) : null;
        if (umSettings.isUM) {
            const isSuperPlayer = await this.partnerConfigService.isSuperPlayers(session?.playerName, session?.operatorId);
            return isSuperPlayer && isAuthenticated ? new Result() : new Result(invalidSession.errorCode, invalidSession.message, umInfo);
        }

        return isAuthenticated ? new Result('0', '', umInfo) : invalidSession;
    }

    async authorize(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        const umSettings = await this.umService.getUMResult(session?.operatorId);
        const umInfo = umSettings.umInfo ? new UMResult(umSettings.umInfo.start, umSettings.umInfo.end) : null;
        if (umSettings.isUM) {
            const isSuperPlayer = await this.partnerConfigService.isSuperPlayers(session?.playerName, session?.operatorId);
            if (!isSuperPlayer) {
                return new AuthorizeResult(false, null, umInfo);
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
            return new AuthorizeResult(false);
        }

        await this.notifyLogin(session, userInfo.name);

        const offerGames = await this.getOfferGames(session);
        const getBalanceResult = await this.getBalanceBySession(session, userInfo.name, true);
        userInfo.red = getBalanceResult.balance;

        if (isVG2System(this.systemType)) {
            const availSpins = await this.getAvailableSpins(session.memberId);
            return new AuthorizeResult(true, { ...userInfo, offerGames, availSpins });
        }

        return new AuthorizeResult(true, { ...userInfo, offerGames });
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

        const userInfo = await this.userInfosService.getUserInfo(session.userId);
        const availSpins = isVG2System(this.systemType) && (await this.getAvailableSpins(session.memberId));
        if (userInfo) {
            return isSC1System(this.systemType)
                ? new AuthorizeResult(true, userInfo)
                : new AuthorizeResult(true, { ...userInfo, availSpins });
        }

        const characterName = this.generateCharacterName(request.nickname, session.currencyName);
        if (await this.checkExistingCharacterName(characterName)) {
            return duplicateNickname;
        }

        const latestUID = await this.userInfosService.getLatestUserInfoUID();
        const param = new CreateUserInfoParam(
            session.userId,
            characterName,
            session.currencyName,
            latestUID,
            request.avatar || this.chance.integer({ min: 1, max: 41 }),
        );
        const upsetResult = await this.userInfosService.upSertUserInfo(param);

        if (!upsetResult || upsetResult?.upserted?.length === 0) {
            return duplicateNickname;
        }

        await this.notifyLogin(session, characterName, true);

        const getBalanceResult = await this.getBalanceBySession(session, param.name, true);
        const offerGames = await this.getOfferGames(session);

        return isSC1System(this.systemType)
            ? new AuthorizeResult(true, { ...param, red: getBalanceResult.balance, offerGames })
            : new AuthorizeResult(true, {
                  ...param,
                  red: getBalanceResult.balance,
                  offerGames,
                  availSpins,
                  scoins: userInfo?.scoins ?? 0,
              });
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

        if (isVG2System(this.systemType)) {
            const userInfo = await this.userInfosService.getUserInfo(userSession.userId);
            const availableSpins = await this.getAvailableSpins(userSession.memberId);
            return new GetBalanceResult(
                response.errorCode.toString(),
                response.errorMessage,
                response.balance,
                userInfo.scoins,
                availableSpins,
            );
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
        const { memberKey, playerId, playerName, operatorId, currencyName } = verifyTokenResult;

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

    private async getOfferGames(session: UserSession) {
        const currencyGroup = await this.currencyGroupService.getCurrencyGroup(session.currencyGroupId);
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

        if (isSC1System(this.systemType)) {
            return groupOfferGames?.filter((game) => !siteExclusionGames.includes(game.gameId)) ?? [];
        }

        if (!groupOfferGames) {
            return [];
        }

        if (!session.disableJackpotGames) {
            return groupOfferGames.filter((game) => !siteExclusionGames.includes(game.gameId));
        }

        const jackpotGames = await this.getDisableJackpotGames();
        return groupOfferGames.filter(
            (game) => !jackpotGames.some((id) => id === game.gameId) && !siteExclusionGames.includes(game.gameId),
        );
    }

    private async checkExistingCharacterName(characterName: string) {
        return isSC1System(this.systemType)
            ? await this.userInfosService.isExistingCharacterName(characterName)
            : await this.isExistingCharacterName(characterName);
    }

    private async isExistingCharacterName(characterName: string) {
        return this.middleSiteApiClient.IsNicknameExisted(characterName);
    }

    private async getAvailableSpins(memberId: number) {
        const spins = await this.spinModel.findOne({ memberId: memberId, enabled: true }).lean().exec();
        return spins?.availSpins ?? 0;
    }

    private async getDisableJackpotGames() {
        const fourguardiansGameId = 29;

        return [fourguardiansGameId];
    }

    async getSettingGames(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        if (!isAuthenticated) {
            return invalidSession;
        }

        const settingGames = await this.currencyGroupGameService.getOfferedGames(session.currencyGroupId);
        return new GetSettingGamesResult(true, settingGames);
    }
}
