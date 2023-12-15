import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { CreateUserParam } from '../params';
import { UsersService } from '../providers';
import { User, UserDocument, UserSchema } from '../schemas';

const user = new User();
user.local = {
    username: 'userName',
    partnerId: 'id',
    currency: 'USS',
    memberId: '123',
    memberName: 'memberName',
    password: 'pass',
    clientId: null,
    regDate: new Date(),
    operatorId: 'id',
    playerId: '123',
    playerName: 'playerName',
};

describe('UserService test', () => {
    let service: UsersService;
    let userModel: Model<UserDocument>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService],
            imports: [rootMongooseTestModule(), MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
        }).compile();

        service = module.get<UsersService>(UsersService);
        userModel = module.get<Model<UserDocument>>(`${User.name}Model`);

        await userModel.insertMany(user);
    });

    afterAll(async () => {
        jest.clearAllMocks();
        await closeInMongodConnection();
    });

    describe('getByUsername test', () => {
        it('should return user info that matched query user name', async () => {
            const actualResult = await service.getByUsername(user.local.username);

            expect(actualResult.local.username).toEqual(user.local.username);
        });
    });

    describe('getByMemberName test', () => {
        it('should return user info that matched query user name', async () => {
            const actualResult = await service.getByMemberName(user.local.memberName);

            expect(actualResult.local.memberName).toEqual(user.local.memberName);
        });
    });

    describe('getById test', () => {
        it('should return user info that matched query user id', async () => {
            jest.spyOn(userModel, 'findById');
            await service.getById('5e5a329a75285d73cfbfdae4');

            expect(userModel.findById).toHaveBeenCalledWith('5e5a329a75285d73cfbfdae4');
        });
    });

    describe('createUser test', () => {
        const createUserRequest = new CreateUserParam('user1', 'pass', new Date(), 'clientId', '111', 'memberName', 'uus');
        it('should call create user', async () => {
            jest.spyOn(userModel.prototype, 'save');
            await service.createUser(createUserRequest, '111', 'clientId', '111');

            expect(userModel.prototype.save).toHaveBeenCalled();
        });
    });
});
