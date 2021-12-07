import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CurrencyDocument, Currency, CurrencyGroup, CurrencyGroupDocument } from './schemas';
import { OWApiClient } from '../ow-api/ow-api.client';
import { UpdateMemberAuthRequest } from '../ow-api/models';
import { SentryLogger } from '../common/providers';

@Injectable()
export class CurrencyGroupService {
    constructor(
        @InjectModel(CurrencyGroup.name) private readonly currencyGroupModel: Model<CurrencyGroupDocument>,
        @InjectModel(Currency.name) private readonly currencyModel: Model<CurrencyDocument>,
        private readonly owApi: OWApiClient,
        private readonly logger: SentryLogger,
    ) {}

    async getAllCurrencyGroups() {
        try {
            return await this.currencyGroupModel.find({ enabled: true }).lean().exec();
        } catch (error) {
            this.logger.error(error);

            return [];
        }
    }

    async getCurrencyGroup(groupId: string) {
        return this.currencyGroupModel.findById(new Types.ObjectId(groupId)).lean().exec();
    }

    async getCurrency(currencyName: string, partnerId: string) {
        return this.currencyModel.findOne({ name: currencyName, partnerId: partnerId }).lean().exec();
    }

    async getCurrencyGroupsByPartner(partnerId: string) {
        try {
            const queryObject = partnerId ? { enabled: true, partnerId } : { enabled: true };

            return await this.currencyGroupModel.find(queryObject).lean().exec();
        } catch (error) {
            this.logger.error(error);

            return [];
        }
    }

    async updateMemberAuth(groupId: string, token: string, gameId: number, language: string) {
        const request = new UpdateMemberAuthRequest(token, language, gameId, groupId);
        const result = await this.owApi.updateMemberAuth(request);
        const message = result ? encodeURI(`${result.message} [Code: ${result.code}]`) : '';

        return result && !result.code ? result.redirectUri : `error?message=${message}`;
    }
}
