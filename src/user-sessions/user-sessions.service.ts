import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateUserSessionParam } from "./params/create-user-session.param";
import { UserSession, UserSessionDocument } from "./schemas/user-session.schema";

@Injectable()
export class UserSessionsService {
    constructor(@InjectModel(UserSession.name) private readonly userSessionModel: Model<UserSessionDocument>) {}

    async findUserSession(token: string): Promise<UserSession> {
        return this.userSessionModel.findOne({ ssoToken: token });
    }

    async createUserSession(param: CreateUserSessionParam): Promise<UserSession> {
        const userSessionCreated = new this.userSessionModel(param);

        return userSessionCreated.save();
    }

    updateReCheckInTime(sessionId) {
        this.userSessionModel.findOneAndUpdate({ sessionId: sessionId }, { $set: { recheckInTime: new Date() } }).exec();
    }
}
