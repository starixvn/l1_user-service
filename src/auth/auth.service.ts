import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generate } from "randomstring";
import { SentryLogger, UtilsService } from "src/common/providers";
import { BaseResult, GetBalanceRequest, OWApiClient, VerifyTokenRequest, VerifyTokenResponse } from "src/ow-api";
import {
    CreateUserInfoParam,
    CreateUserParam,
    CreateUserSessionParam,
    UserDocument,
    UserInfosService,
    UserSession,
    UserSessionsService,
    UsersService,
} from "src/users";
import validator from "validator";

import { AuthenticateRequest, SignNameRequest } from "./models/request";
import { AuthenticateResult, AuthorizeResult, ExpiredSessionResult, Result, UnAuthorizeResult } from "./models/result";

@Injectable()
export class AuthService {
    private readonly UUSCurrency = 'UUS';
    private readonly CreateCharacterNameErrors = {
        invalidLength: 'Độ dài từ 3 đến 14 ký tự !!',
        invalidChars: 'Tên không chứa ký tự đặc biệt !!',
        sameWithUserName: 'Tên nhân vật không được trùng với tên đăng nhập...',
        existCharacterName: 'Tên nhân vật đã tồn tại...',
    };

    constructor(
        private readonly logger: SentryLogger,
        private readonly apiClient: OWApiClient,
        private readonly usersService: UsersService,
        private readonly userSessionsService: UserSessionsService,
        private readonly userInfosService: UserInfosService,
        private readonly utilsService: UtilsService,
        private readonly configService: ConfigService,
    ) {}

    async authenticate(ip: string, token: string, userAgent: string) {
        const param = new VerifyTokenRequest(this.utilsService.normalizeIP(ip), token, userAgent);
        const data = await this.apiClient.verifyToken(param);

        if (data && data.isSuccessful) {
            let user = await this.createUserIfNotExist(data);
            const userSession = await this.addSessionIfNotExist(user, param, data);

            return new AuthenticateResult(true, userSession.username, userSession.language, userSession.sessionId);
        } else {
            this.logger.log(
                [
                    `Authentication Failed`,
                    `Request: ${JSON.stringify(param)}`,
                    `Result: ${JSON.stringify(data)}`,
                    `IP Info: ${param.ip}`,
                ].join('\n'),
            );

            return new AuthenticateResult(false);
        }
    }

    async reCheckIn(request: AuthenticateRequest, userAgent: string) {
        const userSession = await this.userSessionsService.getUserSession(request.session);
        const isValidSession = await this.userSessionsService.verifySession(userSession, request.username, userAgent);
        if (isValidSession) {
            await this.userSessionsService.updateReCheckInTime(request.session);

            return { isSuccessful: true };
        }

        return { isSuccessful: false };
    }

    async authorize(request: AuthenticateRequest, userAgent: string) {
        const userSession = await this.userSessionsService.getUserSession(request.session);
        const isValidSession = await this.userSessionsService.verifySession(userSession, request.username, userAgent);

        if (!isValidSession) {
            return new ExpiredSessionResult();
        }

        const user = await this.usersService.getByUsername(request.username);
        if (!user) {
            this.logger.log(
                `Account not found at ${new Date()} Info: ${JSON.stringify({
                    sessionId: request.session,
                    username: request.username,
                    userAgent,
                })}`,
            );
            return new Result(false, 'Account not found');
        }

        const userInfo = await this.userInfosService.getUserInfo(user.id);
        if (!userInfo) {
            return new UnAuthorizeResult();
        }

        const getBalanceResult = await this.GetBalanceBySession(userSession, userInfo.name);
        if (this.apiClient.isDisabledAccountResult(getBalanceResult as BaseResult)) {
            return { isDisabledAccount: true };
        }
        userInfo.red = getBalanceResult.balance;

        return new AuthorizeResult(true, userInfo);
    }

    async createCharacterName(request: SignNameRequest, userAgent: string) {
        const { session, username, signName } = request;
        const userSession = await this.userSessionsService.getUserSession(session);
        const isValidSession = await this.userSessionsService.verifySession(userSession, username, userAgent);

        if (!isValidSession) {
            return new ExpiredSessionResult();
        }

        const validateSignNameResult = this.validateSignName(signName);
        if (!validateSignNameResult.isOK) {
            return new Result(false, validateSignNameResult.message);
        }

        const user = await this.usersService.getById(userSession.userId);
        if (user.local.username.toUpperCase() === signName.toUpperCase()) {
            return new Result(false, this.CreateCharacterNameErrors.sameWithUserName);
        }

        const userInfo = await this.userInfosService.getUserInfo(userSession.userId);
        if (userInfo) {
            return new AuthorizeResult(true, userInfo);
        }

        const characterName = this.generateCharacterName(signName, userSession.currency);
        if (await this.userInfosService.isExistingCharacterName(characterName)) {
            return new Result(false, this.CreateCharacterNameErrors.existCharacterName);
        }

        const latestUID = await this.userInfosService.getLatestUserInfoUID();
        const insertedUserInfo = await this.userInfosService.upSertUserInfo(
            new CreateUserInfoParam(userSession.userId, characterName, userSession.currency, latestUID),
        );

        if (insertedUserInfo) {
            const getBalanceResult = await this.GetBalanceBySession(userSession, userInfo.name);
            if (this.apiClient.isDisabledAccountResult(getBalanceResult as BaseResult)) {
                return { isDisabledAccount: true };
            }
            insertedUserInfo.red = getBalanceResult.balance;

            return new AuthorizeResult(true, insertedUserInfo);
        }

        return new Result(false, this.CreateCharacterNameErrors.existCharacterName);
    }

    async getBalance(request: AuthenticateRequest, userAgent: string) {
        const userSession = await this.userSessionsService.getUserSession(request.session);
        const isValidSession = await this.userSessionsService.verifySession(userSession, request.username, userAgent);

        if (!isValidSession) {
            return new ExpiredSessionResult();
        }

        const userInfo = await this.userInfosService.getUserInfo(userSession.userId);
        if (!userInfo) {
            return new UnAuthorizeResult();
        }

        const getBalanceResult = await this.GetBalanceBySession(userSession, userInfo.name);
        if (this.apiClient.isDisabledAccountResult(getBalanceResult as BaseResult)) {
            return { isDisabledAccount: true };
        }

        return getBalanceResult.balance;
    }

    private async GetBalanceBySession(userSession: UserSession, nickName: string) {
        const getBalanceRequest = new GetBalanceRequest(userSession.owSeq, userSession.siteId, userSession.memberId, userSession.language);
        const response = await this.apiClient.getBalance(
            getBalanceRequest,
            this.composeBeforeCallMessage(userSession, nickName, getBalanceRequest),
        );

        return response;
    }

    private generateCharacterName(signName: string, currency: string) {
        if (process.env.ENV === 'UAT' && currency.toUpperCase() === this.UUSCurrency) {
            return `${this.configService.get('prefixCharacterName') ?? ''}${signName}`;
        }

        return signName;
    }

    private validateSignName(name: string) {
        const az09 = new RegExp('^[a-zA-Z0-9]+$');

        const criteria = [
            {
                failure: !name,
                notice: this.CreateCharacterNameErrors.invalidLength,
            },
            {
                failure: !validator.isLength(name, { min: 3, max: 14 }),
                notice: this.CreateCharacterNameErrors.invalidLength,
            },
            {
                failure: !az09.test(name),
                notice: this.CreateCharacterNameErrors.invalidChars,
            },
        ];

        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            return new Result(false, failedCriterion.notice);
        }

        return new Result();
    }

    private formatCurrency(currency: string) {
        return currency && currency.toUpperCase() === 'UUS' ? 'UUS' : currency;
    }

    private async createUserIfNotExist(verifyTokenResult) {
        const { memberKey, memberId, memberName, clientId, currency } = verifyTokenResult;

        return (
            (await this.usersService.getByUsername(verifyTokenResult.memberKey)) ??
            (await this.usersService.createUser(
                new CreateUserParam(
                    memberKey,
                    `${memberKey}@#QWE`,
                    new Date(),
                    clientId,
                    memberId,
                    memberName,
                    this.formatCurrency(currency),
                ),
            ))
        );
    }

    private async addSessionIfNotExist(user: UserDocument, verifyTokenParam: VerifyTokenRequest, verifyTokenResult: VerifyTokenResponse) {
        const { token, browserUserAgent, ip } = verifyTokenParam;
        const { memberKey, seq, memberId, siteId, language, currency, clientId, memberName } = verifyTokenResult;

        return (
            (await this.userSessionsService.getUserSessionByToken(token)) ??
            (await this.userSessionsService.createUserSession(
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
                ),
            ))
        );
    }

    private composeBeforeCallMessage(session: UserSession, nickName: string, params) {
        const characterName = nickName ? `\n\tCharacter: ${nickName} ` : '';
        return `Before Action at ${new Date()}: \n\tSession: ${JSON.stringify(session)} ${characterName}\n\tParams:${JSON.stringify(
            params,
        )}`;
    }
}
