import { Body, Controller, Post } from '@nestjs/common';

import { Result } from '../shared/models/result';
import { invalidSession } from './constants/errors';
import { VerifySessionRequest } from './models';
import { UpdateSettingsRequest } from './models/update-settings-request';
import { UserInfosService, UserSessionsService } from './providers';

@Controller('users')
export class UsersController {
    constructor(private readonly userInfosService: UserInfosService, private readonly userSessionsService: UserSessionsService) {}

    @Post('settings/update')
    async updateSettings(@Body() request: UpdateSettingsRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        if (!isAuthenticated) {
            return invalidSession;
        }

        await this.userInfosService.updateSettings(session.userId, request.key, request.value);

        return new Result();
    }

    @Post('firstSignInSM')
    async updateUserSignInSMStatus(@Body() request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        if (!isAuthenticated) {
            return invalidSession;
        }

        await this.userInfosService.updateUserSignInSMStatus(session.userId);

        return new Result();
    }
}
