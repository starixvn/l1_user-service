import { Injectable } from "@nestjs/common";
import { generate } from "randomstring";
import { SentryLogger, UtilsService } from "src/common/providers";
import { GetBalanceRequest, VerifyTokenRequest, VerifyTokenResponse } from "src/ow-api/models";
import { OWApiClient } from "src/ow-api/ow-api.client";
import { CreateUserSessionParam } from "src/user-sessions/params/create-user-session.param";
import { UserSession } from "src/user-sessions/schemas/user-session.schema";
import { UserSessionsService } from "src/user-sessions/user-sessions.service";
import { CreateUserParam } from "src/users/params/createUser.param";
import { UserDocument } from "src/users/schemas/user.schema";
import { UsersService } from "src/users/users.service";
import validator from "validator";

import { ValidateSignNameResult } from "./models/validate-signname-result";

@Injectable()
export class AuthService {
    private CreateCharacterNameErrors = {
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
        private readonly utilsService: UtilsService,
    ) {}

    async authenticate(ip: string, token: string, userAgent: string) {
        const param = new VerifyTokenRequest(this.utilsService.normalizeIP(ip), token, userAgent);
        const data = await this.apiClient.verifyToken(param);

        if (data && data.isSuccessful) {
            let user = await this.createUserIfNotExist(data);
            const userSession = await this.addSessionIfNotExist(user, param, data);

            return { isAuthenticated: true, username: userSession.username, language: userSession.language, ss: userSession.sessionId };
        } else {
            this.logger.log(
                [
                    `Authentication Failed`,
                    `Request: ${JSON.stringify(param)}`,
                    `Result: ${JSON.stringify(data)}`,
                    `IP Info: ${param.ip}`,
                ].join('\n'),
            );

            return { isAuthenticated: false };
        }
    }

    async reCheckIn(sessionId: string, username: string, userAgent: string) {
        const userSession = await this.userSessionsService.getUserSession(sessionId);
        const isValidSession = await this.userSessionsService.validateSession(userSession, username, userAgent);
        if (isValidSession) {
            await this.userSessionsService.updateReCheckInTime(sessionId);

            return { isSuccessful: true };
        }

        return { isSuccessful: false };
    }

    async authorize(sessionId: string, username: string, userAgent: string) {
        const userSession = await this.userSessionsService.getUserSession(sessionId);
        const isValidSession = await this.userSessionsService.validateSession(userSession, username, userAgent);

        if (!isValidSession) {
            return { isSessionExpired: true };
        }

        const user = await this.usersService.findUser(username);
        if (!user) {
            this.logger.log(`Account not found at ${new Date()} Info: ${JSON.stringify({ sessionId, username, userAgent })}`);
            return { isAuthenticated: false };
        }

        const userInfo = await this.usersService.getUserInfo(user.id);
        if (!userInfo) {
            return { authorized: false };
        }

        if (!!userInfo.currency) {
            // Notify login
            const request = new GetBalanceRequest(userSession.owSeq, userSession.siteId, userSession.memberId, userSession.language);
            const response = await this.apiClient.getBalance(request, this.composeBeforeCallMessage(userSession, userInfo.name, request));
            userInfo.red = response.balance;
        }

        return { authorized: true, user: userInfo };
    }

    async createCharacterName(sessionId: string, username: string, userAgent: string, signName: string) {
        const userSession = await this.userSessionsService.getUserSession(sessionId);
        const isValidSession = await this.userSessionsService.validateSession(userSession, username, userAgent);

        if (!isValidSession) {
            return { isSessionExpired: true };
        }

        const validateSignNameResult = this.validateSignName(signName);
        if (validateSignNameResult.isValid) {
        }
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
            return new ValidateSignNameResult(false, failedCriterion.notice);
        }

        return new ValidateSignNameResult();
    }

    private formatCurrency(currency: string) {
        return currency && currency.toUpperCase() === 'UUS' ? 'UUS' : currency;
    }

    private async createUserIfNotExist(verifyTokenResult) {
        const { memberKey, memberId, memberName, clientId, currency } = verifyTokenResult;

        return (
            (await this.usersService.findUser(verifyTokenResult.memberKey)) ??
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
