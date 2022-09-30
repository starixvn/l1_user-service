import { Test } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UserInfosService, UserSessionsService } from '../providers';
import { VerifySessionRequest, VerifySessionResult } from '../models';
import { UpdateSettingsRequest } from '../models/update-settings-request';
import { invalidSession } from '../constants/errors';
import { UserSession } from '../schemas';

jest.mock('../providers');

describe('UserController test', () => {
    let userController: UsersController;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [UserInfosService, UserSessionsService],
        }).compile();

        userController = module.get<UsersController>(UsersController);
    });

    describe('updateSettings test', () => {
        const request = new UpdateSettingsRequest();
        it('should return invalid session when session is invalid', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce(new VerifySessionResult(false, null));

            const actualResult = await userController.updateSettings(request);

            expect(actualResult).toEqual(invalidSession);
        });

        it('should call user info service update settings', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce(
                new VerifySessionResult(true, new UserSession()),
            );
            jest.spyOn(UserInfosService.prototype, 'updateSettings');

            await userController.updateSettings(request);

            expect(UserInfosService.prototype.updateSettings).toHaveBeenCalled();
        });
    });

    describe('firstSignInSM test', () => {
        const request = new VerifySessionRequest();
        it('should return invalid session when session is invalid', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce(new VerifySessionResult(false, null));

            const actualResult = await userController.updateUserSignInSMStatus(request);

            expect(actualResult).toEqual(invalidSession);
        });

        it('should call user info service update sign in SM status', async () => {
            jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce(
                new VerifySessionResult(true, new UserSession()),
            );
            jest.spyOn(UserInfosService.prototype, 'updateUserSignInSMStatus');

            await userController.updateUserSignInSMStatus(request);

            expect(UserInfosService.prototype.updateUserSignInSMStatus).toHaveBeenCalled();
        });
    });
});

afterEach(() => {
    jest.clearAllMocks();
});
