import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CurrencyGroupGame, CurrencyGroupGameDocument } from './schemas';

@Injectable()
export class CurrencyGroupGameService {
    constructor(@InjectModel(CurrencyGroupGame.name) private readonly gameOfCurrencyGroupModel: Model<CurrencyGroupGameDocument>) {}

    async getOfferedGames(groupId: string) {
        return this.gameOfCurrencyGroupModel
            .find({ groupId: Types.ObjectId(groupId), enabled: true }, 'gameId minBet maxBet maxBetPerChoices')
            .lean()
            .exec();
    }
}
