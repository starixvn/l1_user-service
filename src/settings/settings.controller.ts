import { Body, Controller, Post } from "@nestjs/common";

import { invalidSession } from "../users/constants/errors";
import { VerifySessionRequest } from "../users/models";
import { UserSessionsService } from "../users/providers";
import { SettingsService } from "./settings.service";

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService, private readonly userSessionsService: UserSessionsService) {}

    @Post()
    async getSettings(@Body() body: VerifySessionRequest) {
        const { isAuthenticated } = await this.userSessionsService.verifySession(body);

        if (isAuthenticated) {
            const chips = await this.settingsService.getChips();
            return { chips };
        }

        return invalidSession;
    }
}
