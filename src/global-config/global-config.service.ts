import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GlobalConfig, GlobalConfigDocument } from './schemas/global-config.schema';
import { GameConfig, GameConfigDocument } from './schemas/game-config.schema';

@Injectable()
export class GlobalConfigService {
    constructor(
        @InjectModel(GlobalConfig.name) private readonly globalConfigModel: Model<GlobalConfigDocument>,
        @InjectModel(GameConfig.name) private readonly gameConfigModel: Model<GameConfigDocument>,
    ) {}

    async getOfferedGames(siteName: string, username: string = '') {
        if (!siteName) {
            return [];
        }

        const siteExclusionsConfig = await this.getConfig('game_site_exclusions');
        const settings = siteExclusionsConfig?.configs;

        const isSuperPlayers = await this.isSuperPlayers(username);
        const betaGames = await this.getBetaGames();

        return settings
            ? Object.keys(settings)
                  .filter(
                      (gameId) =>
                          (isSuperPlayers && betaGames.some((g) => g.gameId?.toString() === gameId)) ||
                          !settings[gameId].some((x) => x.toLowerCase() === siteName.toLowerCase()),
                  )
                  .map((gameId) => parseInt(gameId))
            : [];
    }

    async getConfig(typeName: string): Promise<GlobalConfig> {
        return this.globalConfigModel.findOne({ type: typeName });
    }

    async isSuperPlayers(playerName: string): Promise<boolean> {
        if (!playerName) {
            return false;
        }

        return this.globalConfigModel.exists({ type: 'super_players', 'configs.names': playerName });
    }

    async getBetaGames(): Promise<GameConfig[]> {
        return this.gameConfigModel.find({ isBeta: true }, 'gameId').lean().exec();
    }
}
