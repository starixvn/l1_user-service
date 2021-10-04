import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generate } from 'randomstring';
import validator from 'validator';

import { CreateNicknameRequest } from '.';
import { SentryLogger, UtilsService } from '../common/providers';
import { GlobalConfigService } from '../global-config/global-config.service';
import { GetBalanceRequest, NotifyLoginRequest, VerifyTokenRequest, VerifyTokenResponse } from '../ow-api/models';
import { OWApiClient } from '../ow-api/ow-api.client';
import { SettingsService } from '../settings/settings.service';
import { Result } from '../shared/models/result';
import { invalidSession } from '../users/constants/errors';
import { UMResult } from '../shared/models/um-result';
import { VerifySessionRequest } from '../users/models';
import { CreateUserInfoParam, CreateUserParam, CreateUserSessionParam } from '../users/params';
import { UserInfosService, UserSessionsService, UsersService } from '../users/providers';
import { UserDocument, UserSession } from '../users/schemas';
import { duplicateNickname, invalidNicknameChars, invalidNicknameLength, sameWithUsername } from './constants/errors';
import { AuthenticateResult, AuthorizeResult, GetBalanceResult, ReCheckInResponse } from './models/result';

@Injectable()
export class AuthService {
    private readonly UUSCurrency = 'UUS';

    constructor(
        private readonly logger: SentryLogger,
        private readonly apiClient: OWApiClient,
        private readonly usersService: UsersService,
        private readonly userSessionsService: UserSessionsService,
        private readonly userInfosService: UserInfosService,
        private readonly utilsService: UtilsService,
        private readonly configService: ConfigService,
        private readonly globalConfigService: GlobalConfigService,
        private readonly settingService: SettingsService,
    ) {}

    async signIn(ip: string, token: string, userAgent: string, system: number) {
        const settings = await this.settingService.getSettings();
        const request = new VerifyTokenRequest(this.utilsService.normalizeIP(ip), token, userAgent);
        const data = await this.apiClient.verifyToken(request);

        if (data && data.isSuccessful && data.appType === system) {
            const user = settings.isUM ? await this.usersService.getByMemberName(data.memberName) : await this.createUserIfNotExist(data);

            if (settings.isUM) {
                const isSuperPlayer = user ? await this.globalConfigService.isSuperPlayers(user.local.memberName) : false;

                if (isSuperPlayer) {
                    const superPlayerSession = await this.addSessionIfNotExist(user, request, data, system);

                    return new AuthenticateResult(
                        true,
                        null,
                        superPlayerSession.username,
                        superPlayerSession.language,
                        superPlayerSession.sessionId,
                        superPlayerSession.system,
                        superPlayerSession.memberName,
                    );
                }

                return new AuthenticateResult(false, new UMResult(settings.umInfo.start, settings.umInfo.end));
            }

            const userSession = await this.addSessionIfNotExist(user, request, data, system);

            return new AuthenticateResult(
                true,
                settings.umInfo ? new UMResult(settings.umInfo.start, settings.umInfo.end) : null,
                userSession.username,
                userSession.language,
                userSession.sessionId,
                userSession.system,
                userSession.memberName,
            );
        } else {
            this.logger.log(
                [
                    `Authentication Failed`,
                    `Request: ${JSON.stringify(request)}`,
                    `Result: ${JSON.stringify(data)}`,
                    `IP Info: ${request.ip}`,
                    `System: ${system}`,
                ].join('\n'),
            );

            return new AuthenticateResult(false, settings.umInfo ? new UMResult(settings.umInfo.start, settings.umInfo.end) : null);
        }
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
        const settings = await this.settingService.getSettings();
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        const umResult = settings.umInfo ? new UMResult(settings.umInfo.start, settings.umInfo.end) : null;
        if (settings.isUM) {
            const isSuperPlayer = await this.globalConfigService.isSuperPlayers(session.memberName);
            if (isSuperPlayer) {
                return new Result();
            }

            return new Result('0', '', umResult);
        }

        return isAuthenticated ? new Result('0', '', umResult) : invalidSession;
    }

    async authorize(request: VerifySessionRequest) {
        const settings = await this.settingService.getSettings();
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        if (!isAuthenticated) {
            return invalidSession;
        }

        if (settings.isUM) {
            const isSuperPlayer = await this.globalConfigService.isSuperPlayers(session.memberName);
            if (!isSuperPlayer) {
                return new AuthorizeResult(false, null, settings.umInfo);
            }
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

        const getBalanceResult = await this.getBalanceBySession(session, userInfo.name, true);
        userInfo.red = getBalanceResult.balance;

        const offerGames = await this.globalConfigService.getOfferedGames(session.siteName, session.memberName);

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
        if (userInfo) {
            return new AuthorizeResult(true, userInfo);
        }

        const characterName = this.generateCharacterName(request.nickname, session.currency);
        if (await this.userInfosService.isExistingCharacterName(characterName)) {
            return duplicateNickname;
        }

        const latestUID = await this.userInfosService.getLatestUserInfoUID();
        const param = new CreateUserInfoParam(
            session.userId,
            characterName,
            session.currency,
            latestUID,
            request.avatar || (Math.random() * 40 + 1) >> 0,
        );
        const upsetResult = await this.userInfosService.upSertUserInfo(param);

        if (!upsetResult || upsetResult?.upserted?.length === 0) {
            return duplicateNickname;
        }

        await this.notifyLogin(session, characterName, true);

        const getBalanceResult = await this.getBalanceBySession(session, param.name, true);
        const offerGames = await this.globalConfigService.getOfferedGames(session.siteName, session.memberName);

        return new AuthorizeResult(true, { ...param, red: getBalanceResult.balance, offerGames });
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
        const getBalanceRequest = new GetBalanceRequest(userSession.owSeq, userSession.siteId, userSession.memberId, userSession.language);
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
        const { memberKey, memberId, memberName, clientId, currency } = verifyTokenResult;

        return (
            (await this.usersService.getByUsername(verifyTokenResult.memberKey)) ??
            this.usersService.createUser(
                new CreateUserParam(
                    memberKey,
                    `${memberKey}@#QWE`,
                    new Date(),
                    clientId,
                    memberId,
                    memberName,
                    this.formatCurrency(currency),
                ),
            )
        );
    }

    private async addSessionIfNotExist(
        user: UserDocument,
        verifyTokenParam: VerifyTokenRequest,
        verifyTokenResult: VerifyTokenResponse,
        system: number,
    ) {
        const { token, browserUserAgent, ip } = verifyTokenParam;
        const { memberKey, seq, memberId, siteId, language, currency, clientId, memberName, siteName } = verifyTokenResult;

        const session = await this.userSessionsService.getUserSessionByToken(token);
        if (session) {
            return session;
        } else {
            return this.userSessionsService.createUserSession(
                new CreateUserSessionParam(
                    token,
                    `${generate()}_${memberKey}`,
                    seq,
                    memberKey,
                    memberId,
                    new Date(),
                    new Date(),
                    ip,
                    browserUserAgent,
                    siteId,
                    user.id,
                    language,
                    this.formatCurrency(currency),
                    clientId,
                    memberName,
                    siteName,
                    system,
                ),
            );
        }
    }

    private async notifyLogin(session: UserSession, characterName: string, isFirstLogin = false) {
        const request = new NotifyLoginRequest(
            session.owSeq,
            session.siteId,
            session.memberId,
            session.language,
            characterName,
            isFirstLogin,
        );

        return this.apiClient.notifyLogin(request, this.composeBeforeCallMessage(session, characterName, request));
    }

    private composeBeforeCallMessage(session: UserSession, characterName: string, params: any) {
        const nameDisplay = characterName ? `\n\tCharacter: ${characterName} ` : '';

        return `Before Action at ${new Date()}: \n\tSession: ${JSON.stringify(session)} ${nameDisplay}\n\tParams:${JSON.stringify(params)}`;
    }
}
