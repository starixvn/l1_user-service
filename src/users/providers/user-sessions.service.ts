import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { VerifySessionRequest, VerifySessionResult } from "../models";
import { CreateUserSessionParam } from "../params/create-user-session.param";
import { UserSession, UserSessionDocument } from "../schemas/user-session.schema";

@Injectable()
export class UserSessionsService {
    private readonly sessionTimeoutInMinutes = 19.8;

    constructor(@InjectModel(UserSession.name) private readonly userSessionModel: Model<UserSessionDocument>) {}

    async getUserSession(sessionId: string): Promise<UserSession> {
        return this.userSessionModel.findOne({ sessionId: sessionId });
    }

    async getUserSessionByToken(token: string): Promise<UserSession> {
        return this.userSessionModel.findOne({ ssoToken: token });
    }

    async createUserSession(param: CreateUserSessionParam): Promise<UserSession> {
        const userSessionCreated = new this.userSessionModel(param);

        return userSessionCreated.save();
    }

    async updateReCheckInTime(sessionId) {
        this.userSessionModel.findOneAndUpdate({ sessionId: sessionId }, { $set: { recheckInTime: new Date() } }).exec();
    }

    async verifySession(request: VerifySessionRequest) {
        const userSession = await this.getUserSession(request.session);
        const isValid =
            userSession && userSession.username === request.username && userSession.browserUserAgent === request.browserUserAgent;

        return new VerifySessionResult(isValid && !this.isSessionExpired(userSession), userSession);
    }

    private isSessionExpired(userSession: UserSession) {
        if (!userSession) {
            return true;
        }

        const differenceInMinutes = Math.abs(Date.now() - userSession.recheckInTime.getTime()) / (1000 * 60);

        return differenceInMinutes > this.sessionTimeoutInMinutes;
    }
}
