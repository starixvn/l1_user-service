import { Controller, Get, Query } from '@nestjs/common';

import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get()
    getSettings(@Query('playerName') playerName: string) {
        return this.settingsService.getSettings(playerName);
    }
}
