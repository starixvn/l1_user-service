import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partner, PartnerDocument } from './schemas/partner.schema';

@Injectable()
export class PartnerService {
    constructor(@InjectModel(Partner.name) private readonly partnerModel: Model<PartnerDocument>) {}

    async getPartner(partnerId: string) {
        return this.partnerModel.findOne({ partnerId: partnerId }).lean().exec();
    }

    async isDisplayPlayerCurrency(partnerId: string): Promise<Object> {
        const partner = await this.getPartner(partnerId);
        return partner?.isDisplayPlayerCurrency;
    }
}
