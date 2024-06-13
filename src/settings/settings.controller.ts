import { Body, Controller, Post } from '@nestjs/common';
import { AuthPipe } from '../pipes/auth.pipe';
import { invalidSession } from '../users/constants/errors';
import { VerifySessionRequest } from '../users/models';
import { UserSessionsService } from '../users/providers';
import { SettingsService } from './settings.service';
import { CurrencyGroupGameService } from '../currency-group-games/currency-group-games.service';
import { GetCurrencyGroupGameRequest } from './models/get-currency-group-game-request';

@Controller('settings')
export class SettingsController {
    constructor(
        private readonly settingsService: SettingsService,
        private readonly userSessionsService: UserSessionsService,
        private readonly currencyGroupGameService: CurrencyGroupGameService,
    ) {}

    @Post()
    async getSettings(@Body(new AuthPipe()) body: VerifySessionRequest) {
        const { isAuthenticated } = await this.userSessionsService.verifySession(body);

        if (isAuthenticated) {
            const chips = await this.settingsService.getChips();
            return { chips };
        }

        return invalidSession;
    }

    @Post('currency-group-game')
    async getCurrencyGroupGamesSettings(@Body(new AuthPipe()) body: GetCurrencyGroupGameRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(body);

        if (isAuthenticated) {
            return this.currencyGroupGameService.getGamesSettings(session.currencyGroupId, body.gameIds);
        }

        return invalidSession;
    }
}
