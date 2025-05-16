import { HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { SentryLogger } from '../../common/providers';
import { PromotionService } from '../promotion.service';

describe('PromotionService', () => {
    let service: PromotionService;
    let httpService: HttpService;
    let configService: ConfigService;
    let logger: SentryLogger;

    const mockHttpResponse = {
        data: {
            promotions: [
                {
                    id: 'promo1',
                    name: 'Welcome Bonus',
                    value: 100,
                },
            ],
            status: 'success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PromotionService,
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('https://test-promo-api.example.com'),
                    },
                },
                {
                    provide: SentryLogger,
                    useValue: {
                        error: jest.fn(),
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PromotionService>(PromotionService);
        httpService = module.get<HttpService>(HttpService);
        configService = module.get<ConfigService>(ConfigService);
        logger = module.get<SentryLogger>(SentryLogger);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('claimPromotion', () => {
        const operatorId = 'testOperator';
        const siteName = 'testSite';
        const playerId = 'player123';
        const currencyGroup = 'group1';

        it('should successfully claim a promotion', async () => {
            // Arrange
            jest.spyOn(httpService, 'post').mockReturnValueOnce(of(mockHttpResponse));

            // Act
            const result = await service.claimPromotion(operatorId, siteName, playerId, currencyGroup);

            // Assert
            expect(httpService.post).toHaveBeenCalledWith('https://test-promo-api.example.com/claim-promotion', {
                operatorId,
                siteName,
                playerId,
                currencyGroup,
            });
            expect(result).toEqual(mockHttpResponse.data);
        });

        it('should handle API errors gracefully', async () => {
            // Arrange
            const errorResponse = new Error('API not available');
            jest.spyOn(httpService, 'post').mockReturnValueOnce(throwError(errorResponse));

            // Act
            const result = await service.claimPromotion(operatorId, siteName, playerId, currencyGroup);

            // Assert
            expect(httpService.post).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should use promotionUri from config service', async () => {
            // Arrange
            const customApiUrl = 'https://custom-api-url.example.com';
            jest.spyOn(configService, 'get').mockReturnValue(customApiUrl);
            jest.spyOn(httpService, 'post').mockReturnValueOnce(of(mockHttpResponse));

            // Re-create the service to use the new config value
            service = new PromotionService(httpService, configService, logger);

            // Act
            await service.claimPromotion(operatorId, siteName, playerId, currencyGroup);

            // Assert
            expect(httpService.post).toHaveBeenCalledWith(`${customApiUrl}/claim-promotion`, expect.any(Object));
        });
    });
});
