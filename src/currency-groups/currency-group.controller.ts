import { Controller, Get, Render, Query, Redirect } from '@nestjs/common';
import { CurrencyGroupService } from './currency-group.service';

@Controller('CurrencyGroup')
export class CurrencyGroupController {
    constructor(private readonly currencyGroupService: CurrencyGroupService) {}

    @Get()
    @Render('currency-group.hbs')
    async index(
        @Query('token') token: string,
        @Query('lang') language: string,
        @Query('gameId') gameId: string,
        @Query('partnerId') partnerId: string,
        @Query('ref') ref: string,
        @Query('rurl') returnUrl: string,
    ) {
        const groups = await this.currencyGroupService.getCurrencyGroupsByPartner(partnerId);
        return { groups, token, language, gameId, ref, returnUrl };
    }

    @Get('group')
    @Redirect()
    async chooseCurrencyGroup(
        @Query('group') groupId: string,
        @Query('token') token: string,
        @Query('language') language: string,
        @Query('gameId') gameId: string,
        @Query('ref') ref: string,
        @Query('rurl') returnUrl: string,
    ) {
        if (token) {
            let url = await this.currencyGroupService.updateMemberAuth(groupId, token, parseInt(gameId), language);
            if (ref) {
                url = `${url}&ref=${ref}`;
            }
            if (returnUrl) {
                url = `${url}&rurl=${returnUrl}`;
            }

            return { url };
        } else {
            return { url: 'error' };
        }
    }

    @Get('error')
    @Render('token-error.hbs')
    error(@Query('message') message: string) {
        return { message };
    }
}
