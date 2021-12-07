import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { GameConfig, GameConfigDocument } from "./schemas/game-config.schema";
import { GlobalConfig, GlobalConfigDocument } from "./schemas/global-config.schema";

@Injectable()
export class GlobalConfigService {
    constructor(
        @InjectModel(GlobalConfig.name) private readonly globalConfigModel: Model<GlobalConfigDocument>,
        @InjectModel(GameConfig.name) private readonly gameConfigModel: Model<GameConfigDocument>,
    ) {}

    async isSuperPlayers(playerName: string): Promise<boolean> {
        if (!playerName) {
            return false;
        }

        return this.globalConfigModel.exists({ type: 'super_players', 'configs.names': playerName.toLocaleLowerCase() });
    }

    async getBetaGames(): Promise<GameConfig[]> {
        return this.gameConfigModel.find({ isBeta: true }, 'gameId').lean().exec();
    }
}
