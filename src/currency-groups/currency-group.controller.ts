import { Controller, Get, Query, Redirect, Render } from '@nestjs/common';
import { CurrencyGroupService } from './currency-group.service';

@Controller('CurrencyGroup')
export class CurrencyGroupController {
    constructor(private readonly currencyGroupService: CurrencyGroupService) {}

    @Get()
    @Render('currency-group.hbs')
    async index(@Query() query: any) {
        const { partnerId } = query;
        const groups = await this.currencyGroupService.getCurrencyGroupsByPartner(partnerId);
        const isONEworksVGCash = partnerId === process.env.ONEworksVGCash;

        return { groups, isONEworksVGCash };
    }

    @Get('group')
    @Redirect()
    async chooseCurrencyGroup(@Query() query: any) {
        const { token, gameId, partnerId, groupId, groupType } = query;
        if (token) {
            const groupIdByGroupType = await this.currencyGroupService.getCurrencyGroupIdByGroupType(groupType, groupId, partnerId);
            const url = await this.currencyGroupService.updateMemberAuth(groupIdByGroupType, token, parseInt(gameId), partnerId);
            const currencyGroup = await this.currencyGroupService.getCurrencyGroup(groupIdByGroupType);

            const params = { ...query, cg: currencyGroup.name, partnerId: null, groupId: null, groupType: null };
            const queryString = new URLSearchParams();
            Object.keys(params).forEach((key) => params[key] !== null && queryString.append(key, params[key]));
            return { url: `${url}?${queryString.toString()}` };
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
