import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GameConfig, GameConfigDocument } from './schemas/game-config.schema';

@Injectable()
export class GameConfigService {
    constructor(@InjectModel(GameConfig.name) private readonly gameConfigModel: Model<GameConfigDocument>) {}

    async getEnabledGameIds() {
        const gameConfigs = await this.gameConfigModel.find({ enabled: true }, '-_id gameId').lean().exec();

        return gameConfigs.map((value) => {
            return value.gameId;
        });
    }
}
