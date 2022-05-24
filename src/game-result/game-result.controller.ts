import { Controller, Post, Body } from '@nestjs/common';
import { GameResultService } from './game-result.service';
import { GetAccessURLRequest } from './models/get-access-url-request';

@Controller('game-result')
export class GameResultController {
    constructor(private readonly service: GameResultService) {}

    @Post('access-url')
    async getAccessUrl(@Body() request: GetAccessURLRequest) {
        return this.service.getAccessUrl(request);
    }
}
