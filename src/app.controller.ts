import { Body, Controller, Get, Headers, Ip, Post, Query } from "@nestjs/common";

import { AppService } from "./app.service";
import { AuthService } from "./auth";
import { CreateNicknameRequest } from "./auth/models/create-nickname-request";
import { VerifySessionRequest } from "./users/models";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private readonly authService: AuthService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('authenticate')
    authenticate(@Headers('user-agent') userAgent: string, @Ip() ip: string, @Query('token') token: string) {
        return this.authService.signIn(ip, token, userAgent);
    }

    @Post('reCheckIn')
    reCheckIn(@Body() body: VerifySessionRequest) {
        return this.authService.reCheckIn(body);
    }

    @Post('authorize')
    authorize(@Body() body: VerifySessionRequest) {
        return this.authService.authorize(body);
    }

    @Post('signName')
    signName(@Body() body: CreateNicknameRequest) {
        return this.authService.createCharacterName(body);
    }
}
