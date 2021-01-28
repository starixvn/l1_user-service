import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generate } from "randomstring";
import { SentryLogger } from "src/logger/logger.service";
import { CreateUserSessionParam } from "src/user-sessions/params/create-user-session.param";
import { UserSessionsService } from "src/user-sessions/user-sessions.service";
import { CreateUserParam } from "src/users/params/createUser.param";
import { UsersService } from "src/users/users.service";
import { normalizeIP, sendPostRequest } from "src/utils";

@Injectable()
export class AuthService {
    constructor(
        private readonly logger: SentryLogger,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly userSessionsService: UserSessionsService,
    ) {}

    async authenticate(userAgent: string, ip: string, token: string) {
        const param = {
            browserUserAgent: userAgent,
            ip: normalizeIP(ip),
            token,
        };

        const data = await sendPostRequest('/AuthVerification/verify', this.configService.get('api'))(param);

        if (data && data.isSuccessful) {
            const { clientId, memberName, memberId, language, seq, siteId } = data;
            const memberKey = `${clientId}_${memberId}`.toLowerCase();
            const currency = data.currency && data.currency.toUpperCase() === 'UUS' ? 'UUS' : data.currency;

            let user =
                (await this.usersService.findUser(memberKey)) ??
                (await this.usersService.createUser(
                    new CreateUserParam(memberKey, `${memberKey}@#QWE`, new Date(), clientId, memberId, memberName, currency),
                ));

            const userSession =
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
                        userAgent,
                        siteId,
                        user.id,
                        language,
                        currency,
                        clientId,
                        memberName,
                    ),
                ));

            return { isAuthenticated: true, username: user.local.username, language: language, ss: userSession.sessionId };
        } else {
            this.logger.log(
                [`Authentication Failed`, `Request: ${JSON.stringify(param)}`, `Result: ${JSON.stringify(data)}`, `IP Info: ${ip}`].join(
                    '\n',
                ),
            );

            return { isAuthenticated: false };
        }
    }
}
