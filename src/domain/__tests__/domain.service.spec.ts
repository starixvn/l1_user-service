import { Test, TestingModule } from '@nestjs/testing';
import { DomainService } from '../domain.service';
import { CACHE_MANAGER } from '@nestjs/common';
import { SentryLogger } from '../../common/providers';
import { getModelToken } from '@nestjs/mongoose';
import { Domain } from '../schemas/domain.schema';

const mockDomainModel = {
    findOne: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
};

const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
};

const mockLogger = {
    error: jest.fn(),
};

describe('Lobby Service', () => {
    let service: DomainService;
    let domainModel;
    let logger: SentryLogger;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainService,
                { provide: getModelToken(Domain.name), useValue: mockDomainModel },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
                { provide: SentryLogger, useValue: mockLogger },
            ],
        }).compile();

        service = module.get<DomainService>(DomainService);
        domainModel = module.get(getModelToken(Domain.name));
        logger = module.get<SentryLogger>(SentryLogger);
    });
    describe('getDomains', () => {
        it('should return cached domains if available', async () => {
            const cachedDomains = 'example.com';
            jest.spyOn(mockCacheManager, 'get').mockResolvedValueOnce(cachedDomains);

            const result = await service.getDomains();

            expect(result).toEqual(cachedDomains);
        });

        it('should fetch domains from the database if not cached', async () => {
            // Arrange
            const fetchedDomains = 'example.com';
            jest.spyOn(mockCacheManager, 'get').mockImplementation(() => Promise.resolve(null));
            jest.spyOn(domainModel, 'findOne').mockImplementation(() => ({
                lean: () => ({
                    exec: () => Promise.resolve({ value: fetchedDomains }),
                }),
            }));
            jest.spyOn(mockCacheManager, 'set').mockImplementation(() => Promise.resolve(null));

            // Act
            const result = await service.getDomains();

            // Assert
            expect(result).toEqual(fetchedDomains);
        });

        it('should log errors and return an empty string if an error occurs', async () => {
            // Arrange
            const error = new Error('Database error');
            jest.spyOn(mockCacheManager, 'get').mockRejectedValue(error);
            jest.spyOn(mockLogger, 'error');

            // Act
            const result = await service.getDomains();

            // Assert
            expect(result).toEqual('');
            expect(mockCacheManager.get).toHaveBeenCalledTimes(2);
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(error);
        });
    });

    describe('isAllowAccess', () => {
        it('should allow access when DISABLE_CORS is true', async () => {
            // Arrange
            process.env.DISABLE_CORS = 'true';

            // Act
            const result = service.isAllowAccess('http://example.com');

            // Assert
            expect(result).toBe(true);
        });

        it('should allow access when origin is in the configured domains', async () => {
            // Arrange
            process.env.DISABLE_CORS = 'false';
            jest.spyOn(service, 'getDomains').mockResolvedValue(['example.com', 'test.com']);

            // Act
            const result = service.isAllowAccess('http://example.com');

            // Assert
            expect(result).toBe(true);
        });

        it('should allow access when domain is empty', async () => {
            // Arrange
            process.env.DISABLE_CORS = 'false';
            const origin = '';

            // Act
            const result = service.isAllowAccess(origin);

            // Assert
            expect(result).toBe(true);
        });
    });

    describe('getMainDomain', () => {
        it('should return an empty string if domain is falsy', () => {
            expect(service.getMainDomain(null)).toEqual('');
        });

        it('should return an empty string if domain has less than 2 parts', () => {
            expect(service.getMainDomain('localhost')).toEqual('');
            expect(service.getMainDomain('example')).toEqual('');
        });

        it('should return the main domain for a valid domain string', () => {
            expect(service.getMainDomain('https://www.example.com')).toEqual('example.com');
            expect(service.getMainDomain('https://www.subdomain.example.com')).toEqual('example.com');
        });

        it('should remove http or https from the beginning of the domain string', () => {
            expect(service.getMainDomain('http://example.com')).toEqual('example.com');
            expect(service.getMainDomain('https://example.com')).toEqual('example.com');
        });
    });

    describe('handleCron', () => {
        test('should call getDomains and log message when successful', async () => {
            // Arrange
            const configuredDomains = ['example.com', 'test.com'];
            service.getDomains = jest.fn(() => Promise.resolve(configuredDomains));

            // Act
            await service.handleCron();

            // Assert
            expect(service.getDomains).toHaveBeenCalled();
        });

        test('should call getDomains and log error when unsuccessful', async () => {
            // Arrange
            const error = new Error('Failed to get domains');
            service.getDomains = jest.fn(() => Promise.reject(error));

            // Act
            await service.handleCron();

            // Assert
            expect(service.getDomains).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith(`Error in scheduled getDomains: ${error.message}`);
        });
    });
});
