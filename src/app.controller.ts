import { Controller, Get, Headers, Ip, Param, Query } from "@nestjs/common";

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
    sso(@Headers('user-agent') userAgent: string, @Ip() ip: string, @Query('token') token: string) {
        return this.authService.signIn(ip, token, userAgent);
    }

    @Get('reCheckIn/:id')
    reCheckIn(@Param('id') id: string, @Headers('user-agent') userAgent: string) {
        // return this.authService.reCheckIn(id, userAgent);
    }

    // @Post('authorize')
    // authenticate(@Body()) {

    // }
}
