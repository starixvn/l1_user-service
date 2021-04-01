import { Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import { VerifySessionRequest } from "src/users/models";

import { AuthService, CreateNicknameRequest } from ".";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('sso')
    sso(
        @Headers('user-agent') userAgent: string,
        @Headers('X-Forwarded-For') ip: string,
        @Query('token') token: string,
        @Query('system') system: number = 1,
    ) {
        return this.authService.signIn(ip, token, userAgent, system);
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

    @Post('session/verify')
    verifySession(@Body() body: VerifySessionRequest) {
        return this.authService.verifySession(body);
    }
}
