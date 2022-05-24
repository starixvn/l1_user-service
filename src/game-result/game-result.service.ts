import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { UserSessionsService } from '../users/providers/user-sessions.service';
import { SentryLogger } from '../common/providers';
import { GetAccessURLRequest } from './models/get-access-url-request';

@Injectable()
export class GameResultService {
    private readonly defaultLanguage: 'vi-VN';
    @Inject(HttpService) private readonly httpService: HttpService;
    @Inject(UserSessionsService) private readonly userSessionsService: UserSessionsService;
    @Inject(SentryLogger) private readonly logger: SentryLogger;
    @Inject(ConfigService) private readonly configService: ConfigService;

    async getAccessUrl(request: GetAccessURLRequest) {
        try {
            const { session } = await this.userSessionsService.verifySession(request);
            if (!session) {
                return null;
            }

            const form = {
                Auth: {
                    ClientID: this.configService.get('gameResult.clientId'),
                    ClientKey: this.configService.get('gameResult.clientKey'),
                },
                Language: request.language ?? this.defaultLanguage,
                GameId: request.gameId,
                SiteName: session.siteName,
                PartnerId: session.partnerId,
                CurrencyGroupId: session.currencyGroupId,
            };

            const resultData = await (
                await this.httpService.post(`${this.configService.get('gameResult.url')}/GameRoundResult/GetAccessUrl`, form).toPromise()
            ).data;

            return { gameResult: { redirectUrl: resultData.redirectUrl } };
        } catch (e) {
            this.logger.error(e);
        }

        return null;
    }
}
