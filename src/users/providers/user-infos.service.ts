import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateUserInfoParam, UserInfo, UserInfoDocument } from "..";

Injectable();
export class UserInfosService {
    constructor(@InjectModel(UserInfo.name) private readonly userInfoModel: Model<UserInfoDocument>) {}

    async getUserInfo(UID: string): Promise<UserInfo> {
        return this.userInfoModel.findOne({ id: UID }, '-_id name red UID avatarId currency');
    }

    async isExistingCharacterName(characterName: string): Promise<boolean> {
        return this.userInfoModel.exists({ name: characterName });
    }

    async getLatestUserInfoUID() {
        let userInfoList = await this.userInfoModel
            .find({}, ['UID'], { skip: 0, limit: 1, sort: { UID: -1 } })
            .lean()
            .exec();

        if (userInfoList != null && userInfoList.length > 0 && userInfoList[0].UID > 0) {
            return userInfoList[0].UID + 1;
        }

        return 1;
    }

    async upSertUserInfo(param: CreateUserInfoParam): Promise<UserInfo> {
        return this.userInfoModel
            .updateOne({ name: param.name }, { $setOnInsert: param }, { upsert: true, setDefaultsOnInsert: true })
            .exec();
    }

    async updateBalance(userId: string, balance: number) {
        return this.userInfoModel.updateOne({ id: userId }, { $set: { red: balance } }).exec();
    }
}
