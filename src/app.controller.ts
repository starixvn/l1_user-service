import { Controller, Get, Headers, Ip, Query } from "@nestjs/common";

import { AppService } from "./app.service";
import { AuthService } from "./auth/auth.service";
import { VerifyTokenParam } from "./auth/params/verify-token-param";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private readonly authService: AuthService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('authenticate')
    authenticate(@Headers('user-agent') userAgent: string, @Ip() ip: string, @Query('token') token: string) {
        return this.authService.signIn(new VerifyTokenParam(ip, token, userAgent));
    }
}
