import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { Model } from "mongoose";

import { closeInMongodConnection, rootMongooseTestModule } from "../../shared/test-utils/mongoose-test-module";
import { CreateUserSessionParam } from "../params";
import { UserSessionsService } from "../providers";
import { UserSession, UserSessionDocument, UserSessionSchema } from "../schemas";

const user = new UserSession();
user.partnerId = '1';
user.sessionId = 'sessionId';
user.recheckInTime = new Date();
user.ssoToken = 'token';

describe('UserInfosService test', () => {
    let service: UserSessionsService;
    let userModel: Model<UserSessionDocument>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserSessionsService],
            imports: [rootMongooseTestModule(), MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }])],
        }).compile();

        service = module.get<UserSessionsService>(UserSessionsService);
        userModel = module.get<Model<UserSessionDocument>>(`${UserSession.name}Model`);

        await userModel.insertMany(user);
    });

    afterAll(async () => {
        jest.clearAllMocks();
        await closeInMongodConnection();
    });

    describe('getUserSession test', () => {
        it('should return user session matched query session id', async () => {
            const actualResult = await service.getUserSession(user.sessionId);

            expect(actualResult.sessionId).toEqual(user.sessionId);
        });
    });

    describe('getUserSessionByToken test', () => {
        it('should return user session matched query token', async () => {
            const actualResult = await service.getUserSessionByToken(user.ssoToken);

            expect(actualResult.ssoToken).toEqual(user.ssoToken);
        });
    });

    describe('createUserSession test', () => {
        const createSessionRequest = new CreateUserSessionParam(
            'ssoToken',
            'sessionId',
            'seq',
            'userName',
            123,
            new Date(),
            new Date(),
            '1.1.1.1',
            'agent',
            'siteId',
            'userId',
            'language',
            '',
            '',
            '',
            '',
            1,
        );

        it('should call create user session', async () => {
            spyOn(userModel.prototype, 'save');

            await service.createUserSession(createSessionRequest);

            expect(userModel.prototype.save).toHaveBeenCalled();
        });
    });
});
