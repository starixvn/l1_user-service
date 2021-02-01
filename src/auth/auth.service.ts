import { Injectable } from "@nestjs/common";
import { generate } from "randomstring";
import { SentryLogger } from "src/logger/logger.service";
import { VerifyTokenRequest, VerifyTokenResponse } from "src/ow-api/models";
import { OWApiClient } from "src/ow-api/ow-api.client";
import { CreateUserSessionParam } from "src/user-sessions/params/create-user-session.param";
import { UserSession } from "src/user-sessions/schemas/user-session.schema";
import { UserSessionsService } from "src/user-sessions/user-sessions.service";
import { CreateUserParam } from "src/users/params/createUser.param";
import { UserDocument } from "src/users/schemas/user.schema";
import { UsersService } from "src/users/users.service";
import { normalizeIP } from "src/utils";

@Injectable()
export class AuthService {
    private readonly sessionTimeoutInMinutes = 19.8;

    constructor(
        private readonly logger: SentryLogger,
        private readonly apiClient: OWApiClient,
        private readonly usersService: UsersService,
        private readonly userSessionsService: UserSessionsService,
    ) {}

    async signIn(ip: string, token: string, userAgent: string) {
        const param = new VerifyTokenRequest(normalizeIP(ip), token, userAgent);
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

    async reCheckIn(sessionId: string, userName: string, userAgent: string) {
        const isValidSession = await this.validateSession(sessionId, userName, userAgent);
        if (isValidSession) {
            this.userSessionsService.updateReCheckInTime(sessionId);

            return { isSuccessful: true };
        }

        return { isSuccessful: false };
    }

    private isSessionExpired(userSession: UserSession) {
        if (!userSession) {
            return true;
        }

        const differenceInMinutes = Math.abs(Date.now() - userSession.recheckInTime.getTime()) / (1000 * 60);

        return differenceInMinutes > this.sessionTimeoutInMinutes;
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

    async validateSession(sessionId: string, userName: string, userAgent: string) {
        const userSession = await this.userSessionsService.getUserSession(sessionId);
        const isValid = userSession && userSession.username === userName && userSession.browserUserAgent === userAgent;

        return isValid && !this.isSessionExpired(userSession);
    }

    async authorize(sessionId: string, userName: string, userAgent: string) {
        const isValidSession = await this.validateSession(sessionId, userName, userAgent);

        if (!isValidSession) {
            return { isSessionExpired: true };
        }

        const user = await this.usersService.findUser(userName);
        if (!user) {
            return { isAuthenticated: false };
        }

        const userInfo = await this.usersService.getUserInfo(user.id);
        if (!userInfo) {
            return { authorized: false };
        }
    }
}
