import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Model } from 'mongoose';

import { Chip, ChipDocument } from './schemas/chip.schema';

@Injectable()
export class SettingsService {
    private readonly chipsCacheKey = 'Chips';

    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        @InjectModel(Chip.name) private readonly chipModel: Model<ChipDocument>,
    ) {}

    async getChips() {
        const cachedChips = await this.cacheManager.get(this.chipsCacheKey);
        if (cachedChips) {
            return cachedChips;
        }

        const chips = await this.chipModel.find({}, { _id: 0, __v: 0 }).lean().exec();
        await this.cacheManager.set(this.chipsCacheKey, chips, { ttl: 60 });
        return chips;
    }
}
