import { Controller, Post, Get, Body, Inject } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SentryLogger } from '../common/providers';
import { UserSessionsService } from '../users/providers';

@Controller('admin')
export class AdminController {
    @Inject(AdminService) private readonly service: AdminService;
    @Inject(SentryLogger) private readonly logger: SentryLogger;
    @Inject(UserSessionsService) private readonly userSessionsService: UserSessionsService;

    @Post('jwt')
    async jwt(@Body() body) {
        const requestData = { userAgent: body.UserAgent, username: body.Username };
        return this.service.getToken(requestData);
    }

    @Get('online-users')
    async getOnlineUsers() {
        try {
            return await this.userSessionsService.getOnlineUsers();
        } catch (ex) {
            this.logger.error(ex);
            return { error: true };
        }
    }
}
