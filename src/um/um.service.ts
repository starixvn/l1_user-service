import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { UMResult } from './models';
import { UMInfo, UMInfoDocument } from './schemas';

@Injectable()
export class UMService {
    private readonly umCacheKey = 'UM_';

    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        @InjectModel(UMInfo.name) private readonly umInfoModel: Model<UMInfoDocument>,
    ) {}

    async getSCUM() {
        const umInfo = await this.umInfoModel
            .findOne({ isPartnerUm: false, finish: false, start: { $lt: new Date() } }, { _id: 0, __v: 0 })
            .lean()
            .exec();

        return new UMResult(umInfo != null, umInfo);
    }

    async getPartnerUM(partnerId) {
        const umInfo = await this.umInfoModel
            .findOne({ isPartnerUm: true, finish: false, start: { $lt: new Date() }, partnerId }, { _id: 0, __v: 0 })
            .lean()
            .exec();

        return new UMResult(umInfo != null, umInfo);
    }

    async getUMResult(partnerId) {
        const cachedUM = await this.cacheManager.get<UMResult>(`${this.umCacheKey}${partnerId}`);
        if (cachedUM) {
            return cachedUM;
        }
        const scUMResult = await this.getSCUM();

        const umResult = scUMResult.isUM || !partnerId ? scUMResult : await this.getPartnerUM(partnerId);
        await this.cacheManager.set<UMResult>(`${this.umCacheKey}${partnerId}`, umResult, { ttl: 30 });
        return umResult;
    }
}
