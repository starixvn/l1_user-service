import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SentryLogger } from '../common/providers';
import { GetTokenRequest } from './models/get-token-request';
import { jwtRequestSchema } from './shemas/jwt-request-schema';

@Injectable()
export class AdminService {
    @Inject(ConfigService) private readonly config: ConfigService;
    @Inject(SentryLogger) private readonly logger: SentryLogger;
    @Inject(JwtService) private readonly jwtService: JwtService;
    private readonly internalServerErrorCode = 500;

    async getToken(requestData: GetTokenRequest) {
        try {
            const cleanedRequest = jwtRequestSchema.clean(requestData);
            jwtRequestSchema.validate(cleanedRequest);

            const adminSecretKey = this.config.get('adminSecretKey');
            const options = { expiresIn: 60, secret: adminSecretKey };
            const token = await this.jwtService.signAsync(cleanedRequest, options);

            return { token };
        } catch (e) {
            this.logger.error(e);
            return { errorCode: this.internalServerErrorCode, errorMessage: e };
        }
    }
}
