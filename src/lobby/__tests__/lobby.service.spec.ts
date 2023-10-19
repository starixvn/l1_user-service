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

jest.mock('../../common/providers');
jest.mock('../../users/providers');

class MockCacheManager {
    set: jest.Mock;
    get: jest.Mock;
}

describe('Lobby Service', () => {
    let service: LobbyService;

    let lobbyModel: Model<LobbyDocument>;
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
            ],
        }).compile();

        service = module.get<LobbyService>(LobbyService);
        logger = module.get<SentryLogger>(SentryLogger);
        lobbyModel = module.get<Model<LobbyDocument>>(getModelToken(Lobby.name));
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
});
