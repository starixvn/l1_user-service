import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cache } from 'cache-manager';
import { CurrencyGroupGame, CurrencyGroupGameDocument } from './schemas';

@Injectable()
export class CurrencyGroupGameService {
    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        @InjectModel(CurrencyGroupGame.name) private readonly gameOfCurrencyGroupModel: Model<CurrencyGroupGameDocument>,
    ) {}
    private readonly chipsCacheKey = 'Chips';

    async getOfferedGames(groupId: string) {
        return this.gameOfCurrencyGroupModel
            .find(
                { groupId: Types.ObjectId(groupId), enabled: true },
                { _id: false, gameId: true, minBet: true, maxBet: true, maxBetPerChoices: true },
            )
            .lean()
            .exec();
    }

    async getGamesSettings(groupId: string, gameIds: number[]) {
        const cachedKey = `${this.chipsCacheKey}-${groupId}-${gameIds.join('')}`;
        const cachedChips = await this.cacheManager.get(cachedKey);
        if (cachedChips) {
            return cachedChips;
        }

        const configGames = await this.gameOfCurrencyGroupModel
            .find(
                { groupId: Types.ObjectId(groupId), enabled: true, gameId: { $in: gameIds } },
                { _id: false, minBet: true, maxBet: true, chips: true },
            )
            .lean()
            .exec();

        if (configGames.length > 0) {
            const minBet = Math.min(configGames[0].minBet, ...configGames.map((config) => config.minBet));
            const maxBet = Math.max(configGames[0].maxBet, ...configGames.map((config) => config.maxBet));
            const chips = configGames
                .reduce((result, config) => [...new Set([...result, ...config.chips])], [] as string[])
                .sort((a, b) => +a - +b);
            await this.cacheManager.set(cachedKey, { minBet, maxBet, chips }, { ttl: 60 });
            return { minBet, maxBet, chips };
        }
        return { minBet: 0, maxBet: 0, chips: [] };
    }
}
