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
        const isONEworksVGCash = partnerId === process.env.ONEworksVGCash;

        return { groups, token, language, gameId, ref, returnUrl, partnerId, isONEworksVGCash };
    }

    @Get('group')
    @Redirect()
    async chooseCurrencyGroup(
        @Query('groupType') groupType: string,
        @Query('group') groupId: string,
        @Query('token') token: string,
        @Query('language') language: string,
        @Query('gameId') gameId: string,
        @Query('ref') ref: string,
        @Query('rurl') returnUrl: string,
        @Query('partnerId') partnerId: string,
    ) {
        if (token) {
            const groupIdByGroupType = await this.currencyGroupService.getCurrencyGroupIdByGroupType(groupType, groupId, partnerId);
            let url = await this.currencyGroupService.updateMemberAuth(groupIdByGroupType, token, parseInt(gameId), language);
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
