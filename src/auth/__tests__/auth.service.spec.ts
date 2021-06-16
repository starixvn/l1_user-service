import { Test } from '@nestjs/testing';
import { OWApiClient } from '../../ow-api/ow-api.client';
import { VerifyTokenResponse } from '../../ow-api/models';
import { AuthService } from '../auth.service';
import { SentryLogger } from '../../common/providers/logger.service';
import { UserInfosService, UserSessionsService, UsersService } from '../../users/providers';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../../common/providers';
import { GlobalConfigService } from '../../global-config/global-config.service';

jest.mock('../../ow-api/ow-api.client');

describe('AuthService test', () => {
    let authService: AuthService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [AuthService],
            imports: [
                SentryLogger,
                OWApiClient,
                UsersService,
                UserSessionsService,
                UserInfosService,
                UtilsService,
                ConfigService,
                GlobalConfigService,
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
    });

    describe('signIn test', () => {
        it('should return authentication successful when request token is valid', async () => {
            const verifyTokenResponse: VerifyTokenResponse = {
                memberId: 1,
                memberName: 'user1',
                siteId: '77',
                clientId: 'id',
                domain: 'localhost',
                language: 'en',
                currency: 'UUS',
                seq: '123',
                memberKey: 'memberKey',
                code: 3,
                message: '',
                isSuccessful: true,
            };
            jest.spyOn(OWApiClient.prototype, 'verifyToken').mockResolvedValue(verifyTokenResponse);
            jest.spyOn<any, any>(AuthService.prototype, 'createUserIfNotExist');

            const actualResult = await authService.signIn('0.0.0.1', 'token', 'userAgent', 1);

            expect(OWApiClient.prototype.verifyToken).toHaveBeenCalled();
            expect(AuthService['createUserIfNotExist']).toBeCalled();
            expect(actualResult.isAuthenticated).toBe(true);
        });
    });
});
