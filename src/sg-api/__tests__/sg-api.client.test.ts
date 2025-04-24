import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SentryLogger } from '../../common/providers';
import { SGApiClient } from '../sg-api.client';
import { PartnerService } from '../../partner/partner.service';
import axios from 'axios';
import { UpdateMemberAuthRequest } from '../models';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SGApiClient', () => {
    let service: SGApiClient;
    let logger: SentryLogger;
    let partnerService: PartnerService;

    const mockConfig = {
        baseURL: 'http://test-api.com',
        requestTimeout: 5000,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SGApiClient,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(mockConfig),
                    },
                },
                {
                    provide: SentryLogger,
                    useValue: {
                        error: jest.fn(),
                    },
                },
                {
                    provide: PartnerService,
                    useValue: {
                        getPartner: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<SGApiClient>(SGApiClient);
        logger = module.get<SentryLogger>(SentryLogger);
        partnerService = module.get<PartnerService>(PartnerService);

        // Reset axios mock
        mockedAxios.create.mockReturnValue({
            post: jest.fn(),
        } as any);
    });

    describe('updateMemberAuth', () => {
        const mockRequest: UpdateMemberAuthRequest = {
            OperatorId: 'test-operator',
            Token: 'test-token',
            GameTypeId: 1,
            CurrencyGroupId: 'test-currency-group',
        };

        const mockPartner: any = {
            secretKey: 'test-secret-key',
        };

        const mockResponse = {
            code: 0,
            redirectUri: 'https://redirect.com',
        };

        it('should successfully update member auth', async () => {
            // Arrange
            jest.spyOn(partnerService, 'getPartner').mockResolvedValue(mockPartner);
            const axiosInstance = mockedAxios.create();
            (axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse });

            // Act
            const result = await service.updateMemberAuth(mockRequest);

            // Assert
            expect(partnerService.getPartner).toHaveBeenCalledWith(mockRequest.OperatorId);
            expect(axiosInstance.post).toHaveBeenCalledWith(
                '/MemberAuth/Update',
                mockRequest,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Access-Key': expect.any(String),
                    }),
                }),
            );
            expect(result).toEqual(mockResponse);
        });

        it('should return null and log error when partner service throws', async () => {
            // Arrange
            const error = new Error('Partner not found');
            jest.spyOn(partnerService, 'getPartner').mockRejectedValue(error);

            // Act
            const result = await service.updateMemberAuth(mockRequest);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(error);
            expect(result).toBeNull();
        });

        it('should return null and log error when API request fails', async () => {
            // Arrange
            jest.spyOn(partnerService, 'getPartner').mockResolvedValue(mockPartner);
            const axiosInstance = mockedAxios.create();
            const error = new Error('API error');
            (axiosInstance.post as jest.Mock).mockRejectedValue(error);

            // Act
            const result = await service.updateMemberAuth(mockRequest);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(error);
            expect(result).toBeNull();
        });
    });
});
