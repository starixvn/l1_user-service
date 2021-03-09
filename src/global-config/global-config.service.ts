import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { GlobalConfig, GlobalConfigDocument } from "./schemas/global-config.schema";

@Injectable()
export class GlobalConfigService {
    constructor(@InjectModel(GlobalConfig.name) private readonly globalConfigModel: Model<GlobalConfigDocument>) {}

    async getOfferedGames(siteName: string) {
        if (!siteName) {
            return [];
        }

        const siteExclusionsConfig = await this.getConfig('game_site_exclusions');
        const settings = siteExclusionsConfig?.configs;

        return settings
            ? Object.keys(settings)
                  .filter((gameId) => settings[gameId]?.indexOf(siteName) === -1)
                  .map((gameId) => parseInt(gameId))
            : [];
    }

    async getConfig(typeName: string): Promise<GlobalConfig> {
        return this.globalConfigModel.findOne({ type: typeName }).lean();
    }
}
