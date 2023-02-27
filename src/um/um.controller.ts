import { Controller, Get, Query } from '@nestjs/common';
import { UMService } from './um.service';

@Controller('um')
export class UMController {
    constructor(private readonly umService: UMService) {}

    @Get('getUnfinishedUM')
    getUnfinishedUM(@Query('operatorId') operatorId: string) {
        return this.umService.getUMResult(operatorId);
    }
}
