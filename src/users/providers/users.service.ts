import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from "mongoose";

import { CreateUserParam } from '../params';
import { User, UserDocument } from '../schemas';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

    async getByUsername(username: string) {
        return this.userModel.findOne({ 'local.username': username });
    }

    async getByMemberName(memberName: string) {
        return this.userModel.findOne({ 'local.memberName': memberName }).lean().exec();
    }

    async getById(id: string) {
        return this.userModel.findById(id).lean().exec();
    }

    async createUser(createUserParam: CreateUserParam): Promise<UserDocument> {
        const createdUser = new this.userModel({ local: createUserParam });

        return createdUser.save();
    }
}
