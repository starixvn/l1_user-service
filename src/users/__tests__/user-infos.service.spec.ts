import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserInfosService } from '../providers';
import { UserInfo, UserInfoDocument } from '../schemas';
import { Model, Query } from 'mongoose';

const user = new UserInfo();
user.UID = 1;

describe('UserInfosService test', () => {
    let service: UserInfosService;
    let userModel: Model<UserInfoDocument>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserInfosService,
                {
                    provide: getModelToken(UserInfo.name),
                    useValue: Model,
                },
            ],
        }).compile();

        service = module.get<UserInfosService>(UserInfosService);
        userModel = module.get<Model<UserInfoDocument>>(getModelToken(UserInfo.name));
    });

    describe('getUserInfo test', () => {
        it('should return user info', async () => {
            jest.spyOn(userModel, 'findOne').mockResolvedValueOnce({} as Query<UserInfoDocument, UserInfoDocument>);
            const actualResult = await service.getUserInfo('uid');

            expect(actualResult.UID).toEqual(1);
        });
    });

    describe('isExistingCharacterName test', () => {
        it('should return true when exist character name', async () => {
            jest.spyOn(userModel, 'find').mockResolvedValueOnce([user as UserInfoDocument]);

            const actualResult = await service.getLatestUserInfoUID();

            expect(actualResult).toBe(true);
        });
    });
});
