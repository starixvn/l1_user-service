import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CurrencyGroup, CurrencyGroupDocument } from './schemas';
import { OWApiClient } from 'src/ow-api/ow-api.client';
import { UpdateMemberAuthRequest } from 'src/ow-api/models';

@Injectable()
export class CurrencyGroupService {
    constructor(
        @InjectModel(CurrencyGroup.name) private readonly currencyGroupModel: Model<CurrencyGroupDocument>,
        private readonly owApi: OWApiClient,
    ) {}

    async getAllCurrencyGroups() {
        return this.currencyGroupModel.find({ enabled: true }).lean().exec();
    }

    async updateMemberAuth(groupId: string, token: string, gameId: number, language: string) {
        const request = new UpdateMemberAuthRequest(token, language, gameId, groupId);
        const result = await this.owApi.updateMemberAuth(request);

        return result ? result.redirectUri : '/CurrencyGroup/error';
    }
}
