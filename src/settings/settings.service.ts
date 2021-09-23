import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SettingsResult } from './models';
import { UMInfo, UMInfoDocument } from './schemas';
import { GlobalConfigService } from '../global-config/global-config.service';

@Injectable()
export class SettingsService {
    constructor(
        @InjectModel(UMInfo.name) private readonly umInfoModel: Model<UMInfoDocument>,
        private readonly globalConfigService: GlobalConfigService,
    ) {}

    async getSettings(playerName: string) {
        if (await this.isSuperPlayers(playerName)) {
            return new SettingsResult(false, null);
        }

        const umInfo = await this.umInfoModel.findOne({ finish: false }, { _id: 0, __v: 0 }).lean().exec();

        return new SettingsResult(umInfo != null, umInfo);
    }

    async isSuperPlayers(playerName: string) {
        if (!playerName) {
            return false;
        }

        const superPlayers = await this.globalConfigService.getConfig('super_players');
        if (!superPlayers || superPlayers.configs == null || superPlayers.configs['Names'] == null) {
            return false;
        }

        return superPlayers.configs['Names'].indexOf(playerName) !== -1;
    }
}
