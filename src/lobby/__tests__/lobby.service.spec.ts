import { Test, TestingModule } from '@nestjs/testing';
import { LobbyService } from '../lobby.service';
import { getModelToken } from '@nestjs/mongoose';
import { Lobby } from '../schemas/lobby.schema';
import { DirectLobby } from '../schemas/direct-lobby.schema';
import { UserSessionsService } from '../../users/providers';
import { SentryLogger } from '../../common/providers/logger.service';
import { CACHE_MANAGER } from '@nestjs/common';
import { LobbyConfigsResult, DirectLobbyConfigsResult } from '../models/result';
import { invalidSession } from '../../users/constants/errors';


describe('LobbyService', () => {
    let service: LobbyService;
    let mockLobbyModel: any;
    let mockDirectLobbyModel: any;
    let mockUserSessionsService: any;
    let mockCacheManager: any;
    let mockLogger: any;

    beforeEach(async () => {
        mockLobbyModel = { find: jest.fn() };
        mockDirectLobbyModel = { find: jest.fn() };
        mockUserSessionsService = { verifySession: jest.fn() };
        mockCacheManager = { get: jest.fn(), set: jest.fn() };
        mockLogger = { error: jest.fn() };
        process.env.CACHE_TIMEOUT_LOBBY = '10';

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LobbyService,
                { provide: getModelToken(Lobby.name), useValue: mockLobbyModel },
                { provide: getModelToken(DirectLobby.name), useValue: mockDirectLobbyModel },
                { provide: UserSessionsService, useValue: mockUserSessionsService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
                { provide: SentryLogger, useValue: mockLogger },
            ],
        }).compile();

        service = module.get<LobbyService>(LobbyService);
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getLobbies', () => {
        it('should return cached lobbies if present', async () => {
            // Arrange
            const cached = [{ id: 1 }];
            mockCacheManager.get.mockResolvedValue(cached);

            // Act
            const result = await service.getLobbies();

            // Assert
            expect(result).toBe(cached);
            expect(mockCacheManager.get).toHaveBeenCalledWith('Lobbies');
        });

        it('should fetch from db, cache, and return if not cached', async () => {
            // Arrange
            mockCacheManager.get.mockResolvedValue(undefined);
            const lobbies = [{ id: 2 }];
            mockLobbyModel.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(lobbies) }) });
            mockCacheManager.set.mockResolvedValue(undefined);

            // Act
            const result = await service.getLobbies();

            // Assert
            expect(result).toBe(lobbies);
            expect(mockLobbyModel.find).toHaveBeenCalled();
            expect(mockCacheManager.set).toHaveBeenCalledWith('Lobbies', lobbies, { ttl: 600 });
        });

        it('should return [] and log error on exception', async () => {
            // Arrange
            const error = new Error('fail');
            mockCacheManager.get.mockRejectedValue(error);

            // Act
            const result = await service.getLobbies();

            // Assert
            expect(result).toEqual([]);
            expect(mockLogger.error).toHaveBeenCalledWith(error);
        });
    });

    describe('getLobbyConfigs', () => {
        it('should return invalidSession if not authenticated', async () => {
            // Arrange
            mockUserSessionsService.verifySession.mockResolvedValue({ isAuthenticated: false });
            const req = { session: 's', username: 'u', browserUserAgent: 'a' };

            // Act
            const result = await service.getLobbyConfigs(req);

            // Assert
            expect(result).toBe(invalidSession);
        });

        it('should return LobbyConfigsResult with lobby by currency group', async () => {
            // Arrange
            const session = { currencyGroupId: 'cgid' };
            mockUserSessionsService.verifySession.mockResolvedValue({ isAuthenticated: true, session });
            const lobbies = [
                { currencyGroupIds: ['cgid'], name: 'lobby1' },
                { currencyGroupIds: ['other'], name: 'lobby2' },
            ];
            jest.spyOn(service, 'getLobbies').mockResolvedValue(lobbies);

            // Act
            const result = await service.getLobbyConfigs({ session: 's', username: 'u', browserUserAgent: 'a' });

            // Assert
            expect(result).toEqual(new LobbyConfigsResult(true, lobbies[0]));
        });

        it('should return LobbyConfigsResult with empty object if no match', async () => {
            // Arrange
            const session = { currencyGroupId: 'cgid' };
            mockUserSessionsService.verifySession.mockResolvedValue({ isAuthenticated: true, session });
            const lobbies = [
                { currencyGroupIds: ['other'], name: 'lobby2' },
            ];
            jest.spyOn(service, 'getLobbies').mockResolvedValue(lobbies);

            // Act
            const result = await service.getLobbyConfigs({ session: 's', username: 'u', browserUserAgent: 'a' });

            // Assert
            expect(result).toEqual(new LobbyConfigsResult(true, {}));
        });
    });

    describe('getDirectLobbiesByCurrencyGroup', () => {
        it('should return cached direct lobbies if present', async () => {
            // Arrange
            const cached = [{ id: 1 }];
            mockCacheManager.get.mockResolvedValue(cached);

            // Act
            const result = await service.getDirectLobbiesByCurrencyGroup();

            // Assert
            expect(result).toBe(cached);
            expect(mockCacheManager.get).toHaveBeenCalledWith('DirectLobbies');
        });

        it('should fetch from db, cache, and return if not cached', async () => {
            // Arrange
            mockCacheManager.get.mockResolvedValue(undefined);
            const lobbies = [{ id: 2 }];
            mockDirectLobbyModel.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(lobbies) }) });
            mockCacheManager.set.mockResolvedValue(undefined);

            // Act
            const result = await service.getDirectLobbiesByCurrencyGroup();

            // Assert
            expect(result).toBe(lobbies);
            expect(mockDirectLobbyModel.find).toHaveBeenCalled();
            expect(mockCacheManager.set).toHaveBeenCalledWith('DirectLobbies', lobbies, { ttl: 600 });
        });

        it('should return [] and log error on exception', async () => {
            // Arrange
            const error = new Error('fail');
            mockCacheManager.get.mockRejectedValue(error);

            // Act
            const result = await service.getDirectLobbiesByCurrencyGroup();

            // Assert
            expect(result).toEqual([]);
            expect(mockLogger.error).toHaveBeenCalledWith(error);
        });
    });

    describe('getDirectLobbyConfigs', () => {
        it('should return invalidSession if not authenticated', async () => {
            // Arrange
            mockUserSessionsService.verifySession.mockResolvedValue({ isAuthenticated: false });
            const req = { session: 's', username: 'u', browserUserAgent: 'a' };

            // Act
            const result = await service.getDirectLobbyConfigs(req);

            // Assert
            expect(result).toBe(invalidSession);
        });

        it('should return DirectLobbyConfigsResult with lobby by currency group', async () => {
            // Arrange
            const session = { currencyGroupId: 'cgid' };
            mockUserSessionsService.verifySession.mockResolvedValue({ isAuthenticated: true, session });
            const lobbies = [
                { currencyGroupIds: ['cgid'], name: 'lobby1' },
                { currencyGroupIds: ['other'], name: 'lobby2' },
            ];
            jest.spyOn(service, 'getDirectLobbiesByCurrencyGroup').mockResolvedValue(lobbies);

            // Act
            const result = await service.getDirectLobbyConfigs({ session: 's', username: 'u', browserUserAgent: 'a' });

            // Assert
            expect(result).toEqual(new DirectLobbyConfigsResult(true, lobbies[0]));
        });

        it('should return DirectLobbyConfigsResult with empty object if no match', async () => {
            // Arrange
            const session = { currencyGroupId: 'cgid' };
            mockUserSessionsService.verifySession.mockResolvedValue({ isAuthenticated: true, session });
            const lobbies = [
                { currencyGroupIds: ['other'], name: 'lobby2' },
            ];
            jest.spyOn(service, 'getDirectLobbiesByCurrencyGroup').mockResolvedValue(lobbies);

            // Act
            const result = await service.getDirectLobbyConfigs({ session: 's', username: 'u', browserUserAgent: 'a' });

            // Assert
            expect(result).toEqual(new DirectLobbyConfigsResult(true, {}));
        });
    });
}); 