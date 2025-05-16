import { Injectable, HttpService, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SentryLogger } from '../common/providers';

@Injectable()
export class PromotionService {
    private readonly promoApiBaseUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(SentryLogger) private readonly logger: SentryLogger,
    ) {
        this.promoApiBaseUrl = this.configService.get('promotionUri');
    }

    async claimPromotion(operatorId: string, siteName: string, playerId: string, currencyGroup: string) {
        try {
            const response = await this.httpService
                .post(`${this.promoApiBaseUrl}/claim-promotion`, {
                    operatorId,
                    siteName,
                    playerId,
                    currencyGroup,
                })
                .toPromise();

            return response.data;
        } catch (error) {
            // Log error with Sentry but don't interrupt the main flow
            this.logger.error(
                [
                    `Failed to claim promotion: ${error.message}`,
                    `OperatorId: ${operatorId}`,
                    `SiteName: ${siteName}`,
                    `PlayerId: ${playerId}`,
                    `CurrencyGroup: ${currencyGroup}`,
                ].join('\n'),
            );
            return null;
        }
    }
}
