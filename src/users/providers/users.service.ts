import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserParam } from '../params';
import { User, UserDocument } from '../schemas';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

    async getByUsername(username: string): Promise<UserDocument> {
        return this.userModel.findOne({ 'local.username': username });
    }

    async getByMemberName(memberName: string): Promise<UserDocument> {
        return this.userModel.findOne({ 'local.memberName': memberName });
    }

    async getById(id: string): Promise<User> {
        return this.userModel.findById(id);
    }

    async createUser(createUserParam: CreateUserParam): Promise<UserDocument> {
        const createdUser = new this.userModel({ local: createUserParam });

        return createdUser.save();
    }
}
