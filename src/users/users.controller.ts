import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthPipe } from '../pipes/auth.pipe';
import { Result } from '../shared/models/result';
import { invalidSession } from './constants/errors';
import { VerifySessionRequest } from './models';
import { UpdateSettingsRequest } from './models/update-settings-request';
import { UserInfosService, UserSessionsService } from './providers';

@Controller('users')
export class UsersController {
    constructor(private readonly userInfosService: UserInfosService, private readonly userSessionsService: UserSessionsService) {}

    @Post('settings/update')
    async updateSettings(@Body(new AuthPipe()) request: UpdateSettingsRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        if (!isAuthenticated) {
            return invalidSession;
        }

        await this.userInfosService.updateSettings(session.userId, request.key, request.value);

        return new Result();
    }

    @Post('firstSignInSM')
    async updateUserSignInSMStatus(@Body(new AuthPipe()) request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        if (!isAuthenticated) {
            return invalidSession;
        }

        await this.userInfosService.updateUserSignInSMStatus(session.userId);

        return new Result();
    }

    @Get('settings/stake-level')
    async getStakeLevel(
        @Query('session') sessionId: string,
        @Query('username') username: string,
        @Query('browserUserAgent') browserUserAgent: string,
    ) {
        const params = { session: sessionId, username, browserUserAgent };
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(params);

        if (!isAuthenticated) {
            return invalidSession;
        }

        return { userStakeLevel: await this.userInfosService.getMemberStakeLevel(session.userId) };
    }
}
