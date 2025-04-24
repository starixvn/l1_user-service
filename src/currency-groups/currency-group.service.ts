import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';

import { CurrencyDocument, Currency, CurrencyGroup, CurrencyGroupDocument } from './schemas';
import { UpdateMemberAuthRequest } from '../sg-api/models';
import { SentryLogger } from '../common/providers';
import { ConfigService } from '@nestjs/config';
import { SGApiClient } from '../sg-api/sg-api.client';

@Injectable()
export class CurrencyGroupService {
    constructor(
        @InjectModel(CurrencyGroup.name) private readonly currencyGroupModel: Model<CurrencyGroupDocument>,
        @InjectModel(Currency.name) private readonly currencyModel: Model<CurrencyDocument>,
        private readonly sgApi: SGApiClient,
        private readonly logger: SentryLogger,
        private readonly configService: ConfigService,
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
        return this.currencyGroupModel.findById(Types.ObjectId(groupId)).lean().exec();
    }

    async getCurrency(currencyName: string, partnerId: string) {
        return this.currencyModel.findOne({ name: currencyName, partnerId: partnerId }).lean().exec();
    }

    async getCurrencyGroupsByPartner(partnerId: string) {
        try {
            const queryObject = partnerId ? { enabled: true, partnerId } : { enabled: true };
            let groups = await this.currencyGroupModel.find(queryObject).lean().exec();

            return this.sortPrioritizedGroups(groups);
        } catch (error) {
            this.logger.error(error);

            return [];
        }
    }

    sortPrioritizedGroups(groups: LeanDocument<CurrencyGroupDocument>[]) {
        const prioritizedGroupNames = ['Credit_UUS'];
        const prioritizedGroups = prioritizedGroupNames.reduce((accumulator, currentValue) => {
            const group = groups.find((g) => g.name === currentValue);
            if (group) {
                accumulator.push(group);
            }

            return accumulator;
        }, []);
        if (prioritizedGroups.length > 0) {
            groups = prioritizedGroups.concat(groups.filter((g) => !prioritizedGroups.map((g) => g.name).includes(g.name)));
        }

        return groups;
    }

    async updateMemberAuth(groupId: string, token: string, gameId: number, operatorId: string) {
        const request = new UpdateMemberAuthRequest(token, operatorId, gameId, groupId);
        const result = await this.sgApi.updateMemberAuth(request);
        const message = result ? encodeURI(`${result.message} [Code: ${result.code}]`) : '';

        return result && !result.code ? result.redirectUri : `error?message=${message}`;
    }

    async isFractionalOddsFormat(currencyGroupId: string) {
        const currencyGroup = await this.getCurrencyGroup(currencyGroupId);
        return currencyGroup?.fractionalOddsFormat;
    }

    async getCurrencyGroupIdByGroupType(groupType: string, selectedGroupId: string, partnerId: string) {
        const groups = await this.getCurrencyGroupsByPartner(partnerId);
        let groupId = (() => {
            switch (groupType) {
                case 'Specific':
                    return selectedGroupId;
                case 'Default':
                    return groups[0]._id.toString();
                default:
                    return this.getCurrencyGroupFromConfig(groups, groupType);
            }
        })();

        return groupId;
    }

    getCurrencyGroupFromConfig(groups: LeanDocument<CurrencyGroupDocument>[], groupType: string): string {
        let groupId = groups[0]._id.toString(); // default: get first group if not having config
        try {
            if (process.env.DEFAULT_CURRENCY_GROUPS) {
                const defaultCurrencyGroups = JSON.parse(this.configService.get<string>('defaultCurrencyGroups'));
                const currencyGroupName = defaultCurrencyGroups[groupType];
                groupId = groups.find((g) => g.name === currencyGroupName)._id.toString();
            }
        } catch (error) {
            this.logger.error(error);
        }

        return groupId;
    }
}
