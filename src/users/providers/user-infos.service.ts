import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserInfoParam } from '../params';
import { UserInfo, UserInfoDocument } from '../schemas';

Injectable();
export class UserInfosService {
    constructor(@InjectModel(UserInfo.name) private readonly userInfoModel: Model<UserInfoDocument>) {}

    async getUserInfo(UID: string): Promise<UserInfo> {
        return this.userInfoModel.findOne({ id: UID }, '-_id name red UID avatarId currency settings isSignedInSM scoins').lean();
    }

    async isExistingCharacterName(characterName: string): Promise<boolean> {
        const exist = await this.userInfoModel
            .findOne({ name: characterName })
            .select({ _id: 1 })
            .collation({ locale: 'en', strength: 2 })
            .lean()
            .exec();

        return exist != null;
    }

    async getLatestUserInfoUID() {
        const userInfoList = await this.userInfoModel
            .find({}, ['UID'], { skip: 0, limit: 1, sort: { UID: -1 } })
            .lean()
            .exec();

        if (userInfoList != null && userInfoList.length > 0 && userInfoList[0].UID > 0) {
            return userInfoList[0].UID + 1;
        }

        return 1;
    }

    async upSertUserInfo(param: CreateUserInfoParam): Promise<any> {
        return this.userInfoModel
            .updateOne({ name: param.name }, { $setOnInsert: param }, { upsert: true, setDefaultsOnInsert: true })
            .exec();
    }

    async updateBalance(userId: string, balance: number) {
        return this.userInfoModel.updateOne({ id: userId }, { $set: { red: balance } }).exec();
    }

    async updateMemberStakeLevel(userId: string, minBet: number, maxBet: number) {
        return this.userInfoModel.updateOne({ id: userId }, { minBet: minBet, maxBet: maxBet, betLimitModifiedDate: new Date() }).exec();
    }

    async updateSettings(userId: string, key: string, value: any) {
        return this.userInfoModel.updateOne({ id: userId }, { $set: { [`settings.${key}`]: value } }).exec();
    }

    async updateUserSignInSMStatus(userId: string) {
        return this.userInfoModel.updateOne({ id: userId }, { $set: { isSignedInSM: true } }).exec();
    }

    async getMemberStakeLevel(userId: string) {
        return this.userInfoModel.findOne({ id: userId }, { _id: false, minBet: true, maxBet: true }).lean().exec();
    }

    async updateAvatar(userId: string, avatarId: number) {
        return this.userInfoModel.updateOne({ id: userId }, { $set: { avatarId: avatarId } }).exec();
    }
}
