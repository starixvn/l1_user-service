import { Body, Controller, Get, Headers, Ip, Post, Query } from '@nestjs/common';

import { AuthService, CreateNicknameRequest } from '.';
import { VerifySessionRequest } from '../users/models';
import { AuthPipe } from '../pipes/auth.pipe';
import { RealIP } from 'nestjs-real-ip';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('sso')
    sso(
        @Headers('user-agent') userAgent: string,
        @RealIP() ip: string,
        @Query('token') token: string,
        @Query('system') system,
    ) {
        console.log("sso", ip, userAgent);
        return this.authService.signIn(ip, token, userAgent, parseInt(system) || 1);
    }

    @Post('reCheckIn')
    reCheckIn(@Body(new AuthPipe()) body: VerifySessionRequest) {
        return this.authService.reCheckIn(body);
    }

    @Post('authorize')
    authorize(@Body(new AuthPipe()) body: VerifySessionRequest) {
        return this.authService.authorize(body);
    }

    @Post('signName')
    signName(@Body(new AuthPipe()) body: CreateNicknameRequest) {
        return this.authService.createCharacterName(body);
    }

    @Post('session/verify')
    verifySession(@Body(new AuthPipe()) body: VerifySessionRequest) {
        return this.authService.verifySession(body);
    }

    @Post('balance')
    getBalance(@Body(new AuthPipe()) body: VerifySessionRequest) {
        return this.authService.getBalance(body);
    }

    @Post('getSettingGames')
    getSettingGames(@Body(new AuthPipe()) body: VerifySessionRequest) {
        return this.authService.getSettingGames(body);
    }
}
