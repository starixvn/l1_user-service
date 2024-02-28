import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PartnerConfig, PartnerConfigDocument } from './schemas/partner-config.schema';

@Injectable()
export class PartnerConfigService {
    constructor(@InjectModel(PartnerConfig.name) private readonly partnerConfigModel: Model<PartnerConfigDocument>) {}

    async isSuperPlayers(playerName: string, partnerId: string): Promise<boolean> {
        if (!playerName || !partnerId) {
            return false;
        }

        return this.partnerConfigModel.exists({
            type: 'super_players',
            partnerId: partnerId,
            'value.names': playerName.toLocaleLowerCase(),
        });
    }

    async getExclusionSites(partnerId: string): Promise<Object> {
        if (!partnerId) {
            return null;
        }

        const siteExclusionConfig = await this.partnerConfigModel
            .findOne({ type: 'game_site_exclusions', partnerId: partnerId }, 'value')
            .lean()
            .exec();

        return siteExclusionConfig?.value;
    }
}
