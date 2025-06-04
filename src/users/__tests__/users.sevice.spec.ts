import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';

import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { CreateUserParam } from '../params';
import { UsersService } from '../providers';
import { User, UserDocument, UserSchema } from '../schemas';

describe('UserService test', () => {
    let service: UsersService;
    let userModel: Model<UserDocument>;
    let testCounter = 0;

    const createTestUser = () => {
        const uniqueId = Date.now() + '_' + (testCounter++);
        const user = new User();
        user.local = {
            username: `userName_${uniqueId}`,
            partnerId: `id_${uniqueId}`,
            currency: 'USS',
            memberId: `123_${uniqueId}`,
            memberName: `memberName_${uniqueId}`,
            password: 'pass',
            clientId: null,
            regDate: new Date(),
            operatorId: `id_${uniqueId}`,
            playerId: `123_${uniqueId}`,
            playerName: `playerName_${uniqueId}`,
        };
        return user;
    };

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService],
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
                MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    });

    beforeEach(async () => {
        await userModel.deleteMany({});
    });

    afterAll(async () => {
        await userModel.deleteMany({});
        jest.clearAllMocks();
        await closeInMongodConnection();
    });

    describe('getByUsername test', () => {
        it('should return user info that matched query user name', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);

            const actualResult = await service.getByUsername(testUser.local.username);

            expect(actualResult.local.username).toEqual(testUser.local.username);
        });
    });

    describe('getByMemberName test', () => {
        it('should return user info that matched query user name', async () => {
            const testUser = createTestUser();
            await userModel.create(testUser);

            const actualResult = await service.getByMemberName(testUser.local.memberName);

            expect(actualResult.local.memberName).toEqual(testUser.local.memberName);
        });
    });

    describe('getById test', () => {
        it('should return user info that matched query user id', async () => {
            const testUser = createTestUser();
            const savedUser = await userModel.create(testUser);

            jest.spyOn(userModel, 'findById');
            await service.getById(savedUser._id);

            expect(userModel.findById).toHaveBeenCalledWith(savedUser._id);
        });
    });

    describe('createUser test', () => {
        it('should call create user', async () => {
            const uniqueId = Date.now() + '_' + (testCounter++);
            const createUserRequest = new CreateUserParam(
                `user1_${uniqueId}`,
                'pass',
                new Date(),
                `clientId_${uniqueId}`,
                `111_${uniqueId}`,
                `memberName_${uniqueId}`,
                'uus'
            );

            jest.spyOn(userModel.prototype, 'save');
            await service.createUser(createUserRequest, `111_${uniqueId}`, `clientId_${uniqueId}`, `111_${uniqueId}`);

            expect(userModel.prototype.save).toHaveBeenCalled();
        });
    });
});