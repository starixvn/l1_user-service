import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateUserParam } from "./params/createUser.param";
import { UserInfo, UserInfoDocument } from "./schemas/user-info.schema";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(UserInfo.name) private readonly userInfoModel: Model<UserInfoDocument>,
    ) {}

    async findUser(memberKey: string): Promise<UserDocument> {
        return this.userModel.findOne({ 'local.username': memberKey });
    }

    async createUser(createUserParam: CreateUserParam): Promise<UserDocument> {
        const createdUser = new this.userModel({ local: createUserParam });

        return createdUser.save();
    }

    async getUserInfo(UID: string): Promise<UserInfo> {
        return this.userInfoModel.findOne({ id: UID }, '-_id name red UID avatarId currency');
    }
}
