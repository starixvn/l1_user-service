import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { CreateUserInfoParam } from '../params';
import { UserInfosService } from '../providers';
import { UserInfo, UserInfoDocument, UserInfoSchema } from '../schemas';

describe('UserInfosService test', () => {
    let service: UserInfosService;
    let userModel: Model<UserInfoDocument>;
    let testCounter = 0;

    const createTestUser = () => {
        const uniqueId = `test_${testCounter++}`;
        const user = new UserInfo();
        user.id = `id_${uniqueId}`;
        user.UID = testCounter;
        user.avatarId = 1;
        user.name = `name_${uniqueId}`;
        return user;
    };

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserInfosService],
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [() => ({
                        database: {
                            uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/minigame',
                            options: {
                                dbName: 'minigame',
                                useNewUrlParser: true,
                                useUnifiedTopology: true,
                                auto_reconnect: true,
                                authSource: 'admin',
                                user: process.env.DATABASE_USER,
                                pass: process.env.DATABASE_PASSWORD
                            }
                        }
                    })]
                }),
                rootMongooseTestModule(),
                MongooseModule.forFeature([{ name: UserInfo.name, schema: UserInfoSchema }])
            ],
        }).compile();

        service = module.get<UserInfosService>(UserInfosService);
        userModel = module.get<Model<UserInfoDocument>>(`${UserInfo.name}Model`);
    });

    beforeEach(async () => {
        await userModel.deleteMany({});
    });

    afterAll(async () => {
        await userModel.deleteMany({});
        jest.clearAllMocks();
        await closeInMongodConnection();
    });

    describe('getUserInfo test', () => {
        it('should return user info', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);

            const actualResult = await service.getUserInfo(testUser.id);

            expect(actualResult.UID).toEqual(testUser.UID);
        });
    });

    describe('isExistingCharacterName test', () => {
        it('should return true when exist character name', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);

            const actualResult = await service.isExistingCharacterName(testUser.name);

            expect(actualResult).toBe(true);
        });

        it('should return false when not exist character name', async () => {
            const actualResult = await service.isExistingCharacterName('user1');

            expect(actualResult).toBe(false);
        });
    });

    describe('getLatestUserInfoUID test', () => {
        it('should return latest UID', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);

            const actualResult = await service.getLatestUserInfoUID();

            expect(actualResult).toBe(testUser.UID + 1);
        });
    });

    describe('upSertUserInfo test', () => {
        it('should call insert data', async () => {
            const uniqueId = Date.now() + '_' + (testCounter++);
            const createUserRequest = new CreateUserInfoParam(
                `id_${uniqueId}`,
                `id_${uniqueId}`,
                'UUS',
                parseInt(uniqueId),
                1
            );

            jest.spyOn(userModel, 'updateOne');
            await service.upSertUserInfo(createUserRequest);

            expect(userModel.updateOne).toHaveBeenCalled();
        });
    });

    describe('updateBalance test', () => {
        it('should call update balance of user', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);
            const balance = 1000;

            jest.spyOn(userModel, 'updateOne');
            await service.updateBalance(testUser.id, balance);

            expect(userModel.updateOne).toHaveBeenCalledWith({ id: testUser.id }, { $set: { red: balance } });
        });
    });

    describe('updateMemberStakeLevel test', () => {
        it('should call update member stake level of user', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);
            const mockDate = new Date(2024, 3, 27);
            const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

            try {
                jest.spyOn(userModel, 'updateOne');
                await service.updateMemberStakeLevel(testUser.id, 1, 1000);

                expect(userModel.updateOne).toHaveBeenCalledWith(
                    { id: testUser.id },
                    { betLimitModifiedDate: mockDate, maxBet: 1000, minBet: 1 }
                );
            } finally {
                dateSpy.mockRestore();
            }
        });
    });

    describe('updateSettings test', () => {
        it('should call update settings of user', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);
            const setting = {
                key: 'theme',
                value: 'light',
            };

            jest.spyOn(userModel, 'updateOne');
            await service.updateSettings(testUser.id, setting.key, setting.value);

            expect(userModel.updateOne).toHaveBeenCalledWith(
                { id: testUser.id },
                { $set: { [`settings.${setting.key}`]: setting.value } }
            );
        });
    });

    describe('updateUserSignInSMStatus test', () => {
        it('should call update sign in SM status of user', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);

            jest.spyOn(userModel, 'updateOne');
            await service.updateUserSignInSMStatus(testUser.id);

            expect(userModel.updateOne).toHaveBeenCalledWith(
                { id: testUser.id },
                { $set: { isSignedInSM: true } }
            );
        });
    });

    describe('updateAvatar test', () => {
        it('should call update avatar of user', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);
            const avatarId = 2;

            jest.spyOn(userModel, 'updateOne');
            await service.updateAvatar(testUser.id, avatarId);

            expect(userModel.updateOne).toHaveBeenCalledWith(
                { id: testUser.id },
                { $set: { avatarId: avatarId } }
            );
        });
    });
});
