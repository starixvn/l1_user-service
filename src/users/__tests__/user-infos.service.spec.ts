import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { CreateUserInfoParam } from '../params';
import { UserInfosService } from '../providers';
import { UserInfo, UserInfoDocument, UserInfoSchema } from '../schemas';

const user = new UserInfo();
user.id = '123';
user.UID = 123;
user.avatarId = 1;
user.name = 'name';

describe('UserInfosService test', () => {
    let service: UserInfosService;
    let userModel: Model<UserInfoDocument>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserInfosService],
            imports: [rootMongooseTestModule(), MongooseModule.forFeature([{ name: UserInfo.name, schema: UserInfoSchema }])],
        }).compile();

        service = module.get<UserInfosService>(UserInfosService);
        userModel = module.get<Model<UserInfoDocument>>(`${UserInfo.name}Model`);

        await userModel.insertMany(user);
    });

    afterAll(async () => {
        jest.clearAllMocks();
        await closeInMongodConnection();
    });

    describe('getUserInfo test', () => {
        it('should return user info', async () => {
            const actualResult = await service.getUserInfo(user.id);

            expect(actualResult.UID).toEqual(user.UID);
        });
    });

    describe('isExistingCharacterName test', () => {
        it('should return true when exist character name', async () => {
            const actualResult = await service.isExistingCharacterName(user.name);

            expect(actualResult).toBe(true);
        });

        it('should return false when not exist character name', async () => {
            const actualResult = await service.isExistingCharacterName('user1');

            expect(actualResult).toBe(false);
        });
    });

    describe('getLatestUserInfoUID test', () => {
        it('should return latest UID', async () => {
            const actualResult = await service.getLatestUserInfoUID();

            expect(actualResult).toBe(user.UID + 1);
        });
    });

    describe('upSertUserInfo test', () => {
        const createUserRequest = new CreateUserInfoParam('124', '124', 'UUS', 124, 1);

        it('should call insert data', async () => {
            jest.spyOn(userModel, 'updateOne');
            await service.upSertUserInfo(createUserRequest);

            expect(userModel.updateOne).toHaveBeenCalled();
        });
    });

    describe('updateBalance test', () => {
        it('should call update balance of user', async () => {
            const balance = 1000;
            jest.spyOn(userModel, 'updateOne');
            await service.updateBalance(user.id, balance);

            expect(userModel.updateOne).toHaveBeenCalledWith({ id: user.id }, { $set: { red: balance } });
        });
    });

    describe('updateMemberStakeLevel test', () => {
        it('should call update member stake level of user', async () => {
            const mockDate = new Date(2024, 3, 27);
            jest.spyOn(global, 'Date').mockImplementation(() => (mockDate as unknown) as Date);
            jest.spyOn(userModel, 'updateOne');
            await service.updateMemberStakeLevel(user.id, 1, 1000);

            expect(userModel.updateOne).toHaveBeenCalledWith({ id: '123' }, { betLimitModifiedDate: mockDate, maxBet: 1000, minBet: 1 });
        });
    });

    describe('updateSettings test', () => {
        it('should call update settings of user', async () => {
            const setting = {
                key: 'theme',
                value: 'light',
            };
            jest.spyOn(userModel, 'updateOne');
            await service.updateSettings(user.id, setting.key, setting.value);

            expect(userModel.updateOne).toHaveBeenCalledWith({ id: user.id }, { $set: { [`settings.${setting.key}`]: setting.value } });
        });
    });

    describe('updateUserSignInSMStatus test', () => {
        it('should call update sign in SM status of user', async () => {
            jest.spyOn(userModel, 'updateOne');
            await service.updateUserSignInSMStatus(user.id);

            expect(userModel.updateOne).toHaveBeenCalledWith({ id: user.id }, { $set: { isSignedInSM: true } });
        });
    });

    describe('updateAvatar test', () => {
        it('should call update avatar of user', async () => {
            const avatarId = 2;
            jest.spyOn(userModel, 'updateOne');
            await service.updateAvatar(user.id, avatarId);

            expect(userModel.updateOne).toHaveBeenCalledWith({ id: user.id }, { $set: { avatarId: avatarId } });
        });
    });
});
