import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserInfosService, UserSessionsService } from '../../users/providers';
import { LobbyService } from '../lobby.service';
import { Lobby, LobbyDocument, LobbySchema } from '../schemas/lobby.schema';
import { CacheModule, CACHE_MANAGER } from '@nestjs/common';
import { rootMongooseTestModule, closeInMongodConnection } from '../../shared/test-utils/mongoose-test-module';
import { SentryLogger } from '../../common/providers';
import { ConfigService } from '@nestjs/config';
import { UserInfo, UserInfoSchema, UserSession, UserSessionSchema } from '../../users/schemas';
import { Model } from 'mongoose';
import { Result } from '../../shared/models/result';
import { invalidSession } from '../../users/constants/errors';
import { VerifySessionRequest } from '../../users/models';
import { LobbyConfigsResult } from '../models/result';
import { DirectLobbySchema, DirectLobby, DirectLobbyDocument } from '../schemas/direct-lobby.schema';

jest.mock('../../common/providers');
jest.mock('../../users/providers');

class MockCacheManager {
    set: jest.Mock;
    get: jest.Mock;
}

describe('Lobby Service', () => {
    let service: LobbyService;

    let lobbyModel: Model<LobbyDocument>;
    let directLobbyModel: Model<DirectLobbyDocument>;
    let logger: SentryLogger;
    let cacheManager = new MockCacheManager();

    beforeAll(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LobbyService,
                ConfigService,
                UserSessionsService,
                UserInfosService,
                SentryLogger,
                {
                    provide: CACHE_MANAGER,
                    useValue: cacheManager,
                },
            ],
            imports: [
                rootMongooseTestModule(),
                CacheModule.register(),
                MongooseModule.forFeature([{ name: Lobby.name, schema: LobbySchema }]),
                MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }]),
                MongooseModule.forFeature([{ name: UserInfo.name, schema: UserInfoSchema }]),
                MongooseModule.forFeature([{ name: DirectLobby.name, schema: DirectLobbySchema }]),
            ],
        }).compile();

        service = module.get<LobbyService>(LobbyService);
        logger = module.get<SentryLogger>(SentryLogger);
        lobbyModel = module.get<Model<LobbyDocument>>(getModelToken(Lobby.name));
        directLobbyModel = module.get<Model<DirectLobbyDocument>>(getModelToken(DirectLobby.name));
    });

    afterAll(async () => {
        jest.clearAllMocks();
        await closeInMongodConnection();
    });

    describe('constructor', () => {
        it('service instance should be defined', () => {
            expect(service).toBeDefined();
        });

        it('cache manager should be available', () => {
            expect(cacheManager).toBeDefined();
        });
    });

    describe('getLobbies', () => {
        it('when exception occur should return an empty list', async () => {
            cacheManager.get = jest.fn().mockReturnValue(undefined);
            const error = new Error('Error happens!');
            const spy = jest.spyOn(lobbyModel, 'find').mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            throw error;
                        },
                    };
                },
            } as any);
            const actual = await service.getLobbies();

            expect(actual).toStrictEqual([]);
            expect(logger.error).toHaveBeenCalledWith(error);
            expect(spy).toBeCalled();
        });

        it('should return data from model', async () => {
            const entity = new Lobby();
            cacheManager.get = jest.fn().mockReturnValue(undefined);
            lobbyModel.find = jest.fn().mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return [entity];
                        },
                    };
                },
            } as any);
            cacheManager.set = jest.fn();
            const actual = await service.getLobbies();

            expect(actual).toStrictEqual([entity]);
        });

        it('should return data from cache manager', async () => {
            const entityCached = new Lobby();
            entityCached.name = 'lobby cache';
            const entity = new Lobby();
            cacheManager.get = jest.fn().mockReturnValue([entityCached]);
            lobbyModel.find = jest.fn().mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return [entity];
                        },
                    };
                },
            } as any);

            const actual = await service.getLobbies();

            expect(actual).toStrictEqual([entityCached]);
        });
    });

    describe('getLobbyConfigs', () => {
        const verifySessionRequest: VerifySessionRequest = { username: 'user1', session: 'session', browserUserAgent: 'userAgent' };
        it('should return invalid session when session is invalid', async () => {
            // arrange
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: false,
                session: new UserSession(),
            });
            const expected = new Result(invalidSession.errorCode, invalidSession.message, null);
            // act
            const actualResult = await service.getLobbyConfigs({ session: 'session', username: 'user', browserUserAgent: 'userAgent' });

            // assert
            expect(actualResult).toStrictEqual(expected);
        });
        it('should return lobby layout', async () => {
            // arrange
            const entity = new Lobby();
            entity.name = 'lobby';
            entity.currencyGroupIds = ['group1', 'group2'];
            const session = new UserSession();
            session.currencyGroupId = 'group1';
            cacheManager.get = jest.fn().mockReturnValue(undefined);
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce({
                isAuthenticated: true,
                session: session,
            });

            lobbyModel.find = jest.fn().mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return [entity];
                        },
                    };
                },
            } as any);
            cacheManager.set = jest.fn();
            // act
            const expected = new LobbyConfigsResult(true, entity);
            const actualResult = await service.getLobbyConfigs(verifySessionRequest);

            // assert
            expect(actualResult).toStrictEqual(expected);
        });
    });

    describe('getDirectLobbiesByCurrencyGroup', () => {
        describe('when exception occurs', () => {
            let error: Error;
            let findSpy: jest.SpyInstance;

            beforeEach(() => {
                error = new Error('Error happens!');
                cacheManager.get = jest.fn().mockReturnValue(undefined);
                findSpy = jest.spyOn(directLobbyModel, 'find').mockReturnValue({
                    lean: function (): any {
                        return {
                            exec: async function () {
                                throw error;
                            },
                        };
                    },
                } as any);
            });

            afterEach(() => {
                findSpy.mockRestore();
            });

            it('should return empty array', async () => {
                // Act
                const actual = await service.getDirectLobbiesByCurrencyGroup();
                // Assert
                expect(actual).toStrictEqual([]);
            });

            it('should log error', async () => {
                // Act
                await service.getDirectLobbiesByCurrencyGroup();
                // Assert
                expect(logger.error).toHaveBeenCalledWith(error);
            });

            it('should call find method', async () => {
                // Act
                await service.getDirectLobbiesByCurrencyGroup();
                // Assert
                expect(findSpy).toBeCalled();
            });
        });

        describe('when cache is empty', () => {
            let expectedLobby: DirectLobby;

            beforeEach(() => {
                expectedLobby = new DirectLobby();
                expectedLobby.currencyGroupIds = ['group1'];

                cacheManager.get = jest.fn().mockReturnValue(undefined);
                jest.spyOn(directLobbyModel, 'find').mockReturnValue({
                    lean: function (): any {
                        return {
                            exec: async function () {
                                return [expectedLobby];
                            },
                        };
                    },
                } as any);
                cacheManager.set = jest.fn();
            });

            it('should return data from database', async () => {
                const actual = await service.getDirectLobbiesByCurrencyGroup();
                expect(actual).toStrictEqual([expectedLobby]);
            });

            it('should cache the retrieved data', async () => {
                await service.getDirectLobbiesByCurrencyGroup();
                expect(cacheManager.set).toHaveBeenCalledWith('DirectLobbies', [expectedLobby], expect.any(Object));
            });
        });

        describe('when cache is not empty', () => {
            it('should return data from cache', async () => {
                // Arrange
                const entity = new DirectLobby();
                entity.currencyGroupIds = ['group1', 'group2'];
                cacheManager.get = jest.fn().mockReturnValue([entity]);

                // Act
                const actual = await service.getDirectLobbiesByCurrencyGroup();

                // Assert
                expect(actual).toStrictEqual([entity]);
            });
        });
    });
});
