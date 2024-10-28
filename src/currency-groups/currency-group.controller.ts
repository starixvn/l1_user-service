import { Controller, Get, Query, Redirect, Render } from '@nestjs/common';
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
        @Query('appType') appType: string,
        @Query('op') op: string,
    ) {
        const groups = await this.currencyGroupService.getCurrencyGroupsByPartner(partnerId);
        const isONEworksVGCash = partnerId === process.env.ONEworksVGCash;

        return { groups, token, language, gameId, ref, returnUrl, partnerId, isONEworksVGCash, appType, op };
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
        @Query('appType') appType: string,
        @Query('op') op: string,
    ) {
        if (token) {
            const groupIdByGroupType = await this.currencyGroupService.getCurrencyGroupIdByGroupType(groupType, groupId, partnerId);
            let url = await this.currencyGroupService.updateMemberAuth(groupIdByGroupType, token, parseInt(gameId), language);
            let currencyGroup = await this.currencyGroupService.getCurrencyGroup(groupIdByGroupType);

            ref && (url = `${url}&ref=${ref}`);
            appType && (url = `${url}&appType=${appType}`);
            returnUrl && (url = `${url}&rurl=${returnUrl}`);
            op && (url = `${url}&op=${op}`);
            currencyGroup && (url = `${url}&cg=${currencyGroup.name}`);

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
