import { Injectable } from "@nestjs/common";
import { generate } from "randomstring";
import { SentryLogger } from "src/logger/logger.service";
import { OWApiClient } from "src/ow-api/ow-api.client";
import { CreateUserSessionParam } from "src/user-sessions/params/create-user-session.param";
import { UserSessionsService } from "src/user-sessions/user-sessions.service";
import { CreateUserParam } from "src/users/params/createUser.param";
import { UserDocument } from "src/users/schemas/user.schema";
import { UsersService } from "src/users/users.service";

import { VerifyTokenParam } from "./params/verify-token-param";

@Injectable()
export class AuthService {
    constructor(
        private readonly logger: SentryLogger,
        private readonly apiClient: OWApiClient,
        private readonly usersService: UsersService,
        private readonly userSessionsService: UserSessionsService,
    ) {}

    async signIn(param: VerifyTokenParam) {
        const data = await this.apiClient.verifyToken(param);
        console.log(data);

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

    private async addSessionIfNotExist(user: UserDocument, verifyTokenParam: VerifyTokenParam, verifyTokenResult) {
        const { token, browserUserAgent, ip } = verifyTokenParam;
        const { memberKey, seq, memberId, siteId, language, currency, clientId, memberName } = verifyTokenResult;

        return (
            (await this.userSessionsService.findUserSession(token)) ??
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

    reCheckIn(sessionId: string) {
        this.userSessionsService.updateReCheckInTime(sessionId);
    }

    private formatCurrency(currency: string) {
        return currency && currency.toUpperCase() === 'UUS' ? 'UUS' : currency;
    }
}
