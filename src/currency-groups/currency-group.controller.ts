import { Controller, Get, Render, Query, Redirect, Headers } from '@nestjs/common';
import { CurrencyGroupService } from './currency-group.service';

@Controller('currency-group')
export class CurrencyGroupController {
    constructor(private readonly currencyGroupService: CurrencyGroupService) {}

    @Get()
    @Render('currency-group.hbs')
    async index(@Query('token') token: string) {
        const groups = await this.currencyGroupService.getAllCurrencyGroups();

        return { groups, token };
    }

    @Get('group')
    @Redirect()
    async chooseCurrencyGroup(
        @Headers('user-agent') userAgent: string,
        @Headers('X-Forwarded-For') ip: string,
        @Query('group') groupId: string,
        @Query('token') token: string,
        @Query('appType') appType: string,
    ) {
        try {
            if (token) {
                const url = await this.currencyGroupService.signInAndUpdateUserSession(
                    userAgent,
                    ip ?? '',
                    groupId,
                    token,
                    parseInt(appType) ?? 1,
                );

                return { url };
            } else {
                return { url: '/currency-group/error' };
            }
        } catch (error) {
            console.error(error);
            return { url: '/currency-group/error' };
        }
    }

    @Get('error')
    @Render('token-error.hbs')
    invalidSession() {}
}
