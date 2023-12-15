import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { CreateUserSessionParam } from '../params';
import { UserSessionsService, UserInfosService } from '../providers';
import { UserSession, UserSessionDocument, UserSessionSchema, UserInfo, UserInfoSchema } from '../schemas';

const user = new UserSession();
user.partnerId = '1';
user.sessionId = 'sessionId';
user.recheckInTime = new Date();
user.ssoToken = 'token';
user.username = 'username';
user.browserUserAgent = 'browserUserAgent';

function createUserSession(session) {
    const defaultInfo = new UserSession();

    return {
        defaultInfo,
        ...session,
    };
}

describe('UserSessionService test', () => {
    const sessionTimeoutInMinutes = 19.8;
    let service: UserSessionsService;
    let userInfosService: UserInfosService;
    let userSessionModel: Model<UserSessionDocument>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserSessionsService, UserInfosService],
            imports: [
                rootMongooseTestModule(),
                MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }]),
                MongooseModule.forFeature([{ name: UserInfo.name, schema: UserInfoSchema }]),
            ],
        }).compile();

        service = module.get<UserSessionsService>(UserSessionsService);
        userSessionModel = module.get<Model<UserSessionDocument>>(`${UserSession.name}Model`);
        userInfosService = module.get<UserInfosService>(UserInfosService);
    });

    afterAll(async () => {
        jest.clearAllMocks();
        await closeInMongodConnection();
    });

    describe('getUserSession test', () => {
        beforeAll(async () => {
            await userSessionModel.insertMany(user);
        });

        afterAll(async () => {
            await userSessionModel.deleteMany();
        });

        it('should return user session matched query session id', async () => {
            const actualResult = await service.getUserSession(user.sessionId);

            expect(actualResult.sessionId).toEqual(user.sessionId);
        });
    });

    describe('getUserSessionByToken test', () => {
        beforeAll(async () => {
            await userSessionModel.insertMany(user);
        });

        afterAll(async () => {
            await userSessionModel.deleteMany();
        });

        it('should return user session matched query token', async () => {
            const actualResult = await service.getUserSessionByToken(user.ssoToken);

            expect(actualResult.ssoToken).toEqual(user.ssoToken);
        });
    });

    describe('createUserSession test', () => {
        const createSessionRequest = new CreateUserSessionParam({
            ssoToken: 'ssoToken',
            sessionId: 'sessionId',
            owSeq: 'seq',
            username: 'userName',
            memberId: '123',
            ssoTime: new Date(),
            recheckInTime: new Date(),
            ip: '1.1.1.1',
            browserUserAgent: 'agent',
            siteId: 'siteId',
            userId: 'userId',
            language: 'language',
            currencyCode: 'VND',
            currencyName: 'VND',
            currencyGroupId: '',
            isTestCurrency: false,
            multiplier: 1000,
            partnerId: '',
            memberName: '',
            siteName: '',
            system: 1,
            operatorId: '',
            playerId: '123',
            playerName: '',
        });

        afterAll(async () => {
            await userSessionModel.deleteMany();
        });

        it('should call create user session', async () => {
            jest.spyOn(userSessionModel.prototype, 'save');

            await service.createUserSession(createSessionRequest);

            expect(userSessionModel.prototype.save).toHaveBeenCalled();
        });
    });

    describe('getOnlineUsers', () => {
        it('should return data separated test users and real users', async () => {
            // Arrange
            const dt = new Date();
            const expiredTime = new Date(dt.getTime() - 60 * 1000 - 1);
            const users = [
                {
                    memberName: 'memberName2',
                    memberId: '2',
                    currencyName: 'currency2',
                    partnerId: 'partnerId2',
                    isTestCurrency: false,
                    recheckInTime: new Date(),
                    sessionId: '2',
                },
                {
                    memberName: 'memberName3',
                    memberId: '3',
                    currencyName: 'currency3',
                    partnerId: 'partnerId3',
                    isTestCurrency: false,
                    recheckInTime: new Date(),
                    sessionId: '3',
                },
                {
                    memberName: 'memberName4',
                    memberId: '4',
                    currencyName: 'currency4',
                    partnerId: 'partnerId4',
                    isTestCurrency: true,
                    recheckInTime: new Date(),
                    sessionId: '4',
                },
                {
                    memberName: 'memberName5',
                    memberId: '5',
                    currencyName: 'currency5',
                    partnerId: 'partnerId5',
                    isTestCurrency: true,
                    recheckInTime: expiredTime,
                    sessionId: '5',
                },
            ];

            await userSessionModel.insertMany(users.map((u) => createUserSession(u)));

            const userInfo1 = new UserInfo();
            userInfo1.name = 'nickname1';

            const userInfo2 = new UserInfo();
            userInfo2.name = 'nickname2';

            const userInfo3 = new UserInfo();
            userInfo3.name = 'nickname3';

            const userInfo4 = new UserInfo();
            userInfo4.name = 'nickname4';

            jest.spyOn(userInfosService, 'getUserInfo')
                .mockResolvedValueOnce(userInfo1)
                .mockResolvedValueOnce(userInfo2)
                .mockResolvedValueOnce(userInfo3)
                .mockResolvedValueOnce(userInfo4);

            const expectedValue = {
                totalRealPlayer: 2,
                realUsers: [
                    {
                        name: 'memberName2',
                        id: '2',
                        currency: 'currency2',
                        character: 'nickname1',
                        partnerId: 'partnerId2',
                        isTest: false,
                    },
                    {
                        name: 'memberName3',
                        id: '3',
                        currency: 'currency3',
                        character: 'nickname2',
                        partnerId: 'partnerId3',
                        isTest: false,
                    },
                ],
                totalTestPlayer: 1,
                testUsers: [
                    {
                        name: 'memberName4',
                        id: '4',
                        currency: 'currency4',
                        character: 'nickname3',
                        partnerId: 'partnerId4',
                        isTest: true,
                    },
                ],
            };

            // Act
            const actualValue = await service.getOnlineUsers();

            // Assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });
});
