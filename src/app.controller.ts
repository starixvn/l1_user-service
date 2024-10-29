import { Controller, Get, Headers } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(@Headers('X-Forwarded-For') ip: string): string {
        return this.appService.getHello(ip);
    }
}
