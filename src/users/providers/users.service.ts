import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';

import { CreateUserParam } from '../params';
import { User, UserDocument } from '../schemas';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

    mapIdField(user: LeanDocument<UserDocument>) {
        if (user) {
            user.id = user._id;
        }

        return user;
    }

    async getByUsername(username: string) {
        const result = await this.userModel.findOne({ 'local.username': username }).lean().exec();
        this.mapIdField(result);

        return result;
    }

    async getByMemberName(memberName: string) {
        const result = await this.userModel.findOne({ 'local.memberName': memberName }).lean().exec();
        this.mapIdField(result);

        return result;
    }

    async getById(id: string) {
        return this.userModel.findById(id).lean().exec();
    }

    async createUser(
        createUserParam: CreateUserParam,
        playerId: string,
        operatorId: string,
        operatorPlayerId: string,
    ): Promise<UserDocument> {
        const createdUser = new this.userModel({ local: createUserParam, playerId: playerId, operatorId: operatorId, operatorPlayerId });

        return createdUser.save();
    }
}
