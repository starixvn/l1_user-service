import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generate } from "randomstring";
import { SentryLogger, UtilsService } from "src/common/providers";
import {
    BaseResult,
    GetBalanceRequest,
    NotifyLoginRequest,
    VerifyTokenRequest,
    VerifyTokenResponse,
} from "src/ow-api/models";
import { OWApiClient } from "src/ow-api/ow-api.client";
import { VerifySessionRequest } from "src/users/models";
import { CreateUserInfoParam, CreateUserParam, CreateUserSessionParam } from "src/users/params";
import { UserInfosService, UserSessionsService, UsersService } from "src/users/providers";
import { UserDocument, UserSession } from "src/users/schemas";
import validator from "validator";

import { CreateNicknameRequest } from ".";
import {
    AuthenticateResult,
    AuthorizeResult,
    CreateCharacterNameResult,
    FailedResult,
    ReCheckInResult,
    SuccessResult,
} from "./models/result";

@Injectable()
export class AuthService {
    private readonly UUSCurrency = 'UUS';
    private readonly CreateNicknameErrors = {
        invalidLength: 'Độ dài từ 3 đến 14 ký tự !!',
        invalidChars: 'Tên không chứa ký tự đặc biệt !!',
        sameWithUserName: 'Tên nhân vật không được trùng với tên đăng nhập...',
        existCharacterName: 'Tên nhân vật đã tồn tại...',
    };
    private readonly DisabledAccountMessage =
        'Tài khoản đã bị đóng. Phiên đăng nhập sẽ hết hạn sau 10 giây. Vui lòng liên hệ với cấp trên để biết thêm chi tiết.';

    constructor(
        private readonly logger: SentryLogger,
        private readonly apiClient: OWApiClient,
        private readonly usersService: UsersService,
        private readonly userSessionsService: UserSessionsService,
        private readonly userInfosService: UserInfosService,
        private readonly utilsService: UtilsService,
        private readonly configService: ConfigService,
    ) {}

    async signIn(ip: string, token: string, userAgent: string) {
        const request = new VerifyTokenRequest(this.utilsService.normalizeIP(ip), token, userAgent);
        const data = await this.apiClient.verifyToken(request);

        if (data && data.isSuccessful) {
            let user = await this.createUserIfNotExist(data);
            const userSession = await this.addSessionIfNotExist(user, request, data);

            return new AuthenticateResult(true, userSession.username, userSession.language, userSession.sessionId);
        } else {
            this.logger.log(
                [
                    `Authentication Failed`,
                    `Request: ${JSON.stringify(request)}`,
                    `Result: ${JSON.stringify(data)}`,
                    `IP Info: ${request.ip}`,
                ].join('\n'),
            );

            return new AuthenticateResult(false);
        }
    }

    async reCheckIn(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        if (!isAuthenticated) {
            return new ReCheckInResult(false);
        }

        await this.userSessionsService.updateReCheckInTime(request.session);

        const userInfo = await this.userInfosService.getUserInfo(session.userId);
        if (!userInfo) {
            return new ReCheckInResult(true);
        }

        const getBalanceResult = await this.GetBalanceBySession(session, userInfo.name, false);
        if (this.apiClient.isErrorResult(getBalanceResult as BaseResult)) {
            const isDisabledAccount = this.apiClient.isDisabledAccountResult(getBalanceResult as BaseResult);

            return new ReCheckInResult(
                false,
                0,
                isDisabledAccount,
                isDisabledAccount ? this.DisabledAccountMessage : getBalanceResult.errorMessage,
            );
        }

        await this.userSessionsService.updateReCheckInTime(request.session);

        return new ReCheckInResult(true, getBalanceResult.balance);
    }

    async authorize(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        if (!isAuthenticated) {
            return new AuthorizeResult(false);
        }

        const user = await this.usersService.getByUsername(request.username);
        if (!user) {
            this.logger.log(`Account not found at ${new Date()} Info: ${JSON.stringify(request)}`);
            return new AuthorizeResult(false);
        }

        const userInfo = await this.userInfosService.getUserInfo(user.id);
        if (!userInfo) {
            return new AuthorizeResult(false);
        }

        await this.notifyLogin(session, userInfo.name);

        const getBalanceResult = await this.GetBalanceBySession(session, userInfo.name, true);
        userInfo.red = getBalanceResult.balance;

        return new AuthorizeResult(true, userInfo);
    }

    async createCharacterName(request: CreateNicknameRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        if (!isAuthenticated) {
            return new CreateCharacterNameResult(false);
        }

        const validateSignNameResult = this.validateNickname(request.nickname);
        if (!validateSignNameResult.isSuccessful) {
            return new CreateCharacterNameResult(false, validateSignNameResult.message);
        }

        const user = await this.usersService.getById(session.userId);
        if (user.local.username.toUpperCase() === request.nickname.toUpperCase()) {
            return new CreateCharacterNameResult(false, this.CreateNicknameErrors.sameWithUserName);
        }

        const userInfo = await this.userInfosService.getUserInfo(session.userId);
        if (userInfo) {
            return new CreateCharacterNameResult(true, '', userInfo);
        }

        const characterName = this.generateCharacterName(request.nickname, session.currency);
        if (await this.userInfosService.isExistingCharacterName(characterName)) {
            return new CreateCharacterNameResult(false, this.CreateNicknameErrors.existCharacterName);
        }

        const latestUID = await this.userInfosService.getLatestUserInfoUID();
        const insertedUserInfo = await this.userInfosService.upSertUserInfo(
            new CreateUserInfoParam(session.userId, characterName, session.currency, latestUID),
        );

        if (insertedUserInfo) {
            await this.notifyLogin(session, characterName, true);
            const getBalanceResult = await this.GetBalanceBySession(session, userInfo.name, true);
            insertedUserInfo.red = getBalanceResult.balance;

            return new CreateCharacterNameResult(true, '', insertedUserInfo);
        }

        return new CreateCharacterNameResult(false, this.CreateNicknameErrors.existCharacterName);
    }

    private async GetBalanceBySession(userSession: UserSession, nickname: string, captureBalance: boolean) {
        const getBalanceRequest = new GetBalanceRequest(userSession.owSeq, userSession.siteId, userSession.memberId, userSession.language);
        const response = await this.apiClient.getBalance(
            getBalanceRequest,
            this.composeBeforeCallMessage(userSession, nickname, getBalanceRequest),
        );

        if (captureBalance) {
            this.userInfosService.updateBalance(userSession.userId, response.balance);
        }

        return response;
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
                failure: !name,
                notice: this.CreateNicknameErrors.invalidLength,
            },
            {
                failure: !validator.isLength(name, { min: 3, max: 14 }),
                notice: this.CreateNicknameErrors.invalidLength,
            },
            {
                failure: !az09.test(name),
                notice: this.CreateNicknameErrors.invalidChars,
            },
        ];

        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            return new FailedResult(failedCriterion.notice);
        }

        return new SuccessResult();
    }

    private formatCurrency(currency: string) {
        return currency && currency.toUpperCase() === 'UUS' ? 'UUS' : currency;
    }

    private async createUserIfNotExist(verifyTokenResult: VerifyTokenResponse) {
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

    private async notifyLogin(session: UserSession, characterName: string, isFirstLogin: boolean = false) {
        const request = new NotifyLoginRequest(
            session.owSeq,
            session.siteId,
            session.memberId,
            session.language,
            characterName,
            isFirstLogin,
        );

        return await this.apiClient.notifyLogin(request, this.composeBeforeCallMessage(session, characterName, request));
    }

    private composeBeforeCallMessage(session: UserSession, characterName: string, params: any) {
        return `Before Action at ${new Date()}: \n\tSession: ${JSON.stringify(session)} ${
            characterName ? `\n\tCharacter: ${characterName} ` : ''
        }\n\tParams:${JSON.stringify(params)}`;
    }
}
