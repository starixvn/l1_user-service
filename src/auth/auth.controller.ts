import { Body, Controller, Get, Headers, Ip, Post, Query } from "@nestjs/common";
import { VerifySessionRequest } from "src/users/models";

import { AuthService, CreateNicknameRequest } from ".";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('sso')
    sso(@Headers('user-agent') userAgent: string, @Ip() ip: string, @Query('token') token: string) {
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
