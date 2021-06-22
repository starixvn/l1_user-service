import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserInfosService } from '../providers';
import { UserInfo, UserInfoDocument, UserInfoSchema } from '../schemas';
import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { Model } from 'mongoose';

const user = new UserInfo();
user.id = '123';
user.UID = 123;
user.name = 'name';

describe('UserInfosService test', () => {
    let service: UserInfosService;
    let userModel: Model<UserInfoDocument>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserInfosService],
            imports: [rootMongooseTestModule(), MongooseModule.forFeature([{ name: UserInfo.name, schema: UserInfoSchema }])],
        }).compile();

        service = module.get<UserInfosService>(UserInfosService);
        userModel = module.get<Model<UserInfoDocument>>(`${UserInfo.name}Model`);
    });

    afterAll(async () => {
        await closeInMongodConnection();
    });

    describe('getUserInfo test', () => {
        it('should return user info', async () => {
            await userModel.insertMany(user);
            const actualResult = await service.getUserInfo(user.id);

            expect(actualResult.UID).toEqual(user.UID);
        });
    });

    describe('isExistingCharacterName test', () => {
        it('should return true when exist character name', async () => {
            await userModel.insertMany(user);

            const actualResult = await service.isExistingCharacterName(user.name);

            expect(actualResult).toBe(true);
        });

        it('should return true when exist character name', async () => {
            const actualResult = await service.isExistingCharacterName(user.name);

            expect(actualResult).toBe(false);
        });
    });
});
