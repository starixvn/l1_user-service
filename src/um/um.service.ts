import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { UMResult } from "./models";
import { UMInfo, UMInfoDocument } from "./schemas";

@Injectable()
export class UMService {
    constructor(@InjectModel(UMInfo.name) private readonly umInfoModel: Model<UMInfoDocument>) {}

    async getUMResult() {
        const umInfo = await this.umInfoModel
            .findOne({ finish: false, start: { $lt: new Date() } }, { _id: 0, __v: 0 })
            .lean()
            .exec();

        return new UMResult(umInfo != null, umInfo);
    }
}
