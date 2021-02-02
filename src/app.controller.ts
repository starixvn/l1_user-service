import { Body, Controller, Get, Headers, Ip, Post, Query } from "@nestjs/common";

import { AppService } from "./app.service";
import { AuthService } from "./auth/auth.service";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private readonly authService: AuthService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('authenticate')
    authenticate(@Headers('user-agent') userAgent: string, @Ip() ip: string, @Query('token') token: string) {
        return this.authService.authenticate(ip, token, userAgent);
    }

    @Post('reCheckIn')
    reCheckIn(@Headers('user-agent') userAgent: string, @Body() body) {
        return this.authService.reCheckIn(body.session, body.username, userAgent);
    }

    @Post('authorize')
    authorize(@Headers('user-agent') userAgent: string, @Body() body) {
        return this.authService.authorize(body.session, body.username, userAgent);
    }
}
