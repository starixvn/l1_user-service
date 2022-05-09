import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { VerifySessionRequest, VerifySessionResult } from '../models';
import { CreateUserSessionParam } from '../params/create-user-session.param';
import { UserSession, UserSessionDocument } from '../schemas/user-session.schema';
import { UserInfosService } from './user-infos.service';

@Injectable()
export class UserSessionsService {
    private readonly sessionTimeoutInMinutes = 19.8;
    @InjectModel(UserSession.name) private readonly userSessionModel: Model<UserSessionDocument>;
    @Inject(UserInfosService) private readonly userInfosService: UserInfosService;

    async getUserSession(sessionId: string): Promise<UserSession> {
        return this.userSessionModel.findOne({ sessionId: sessionId }).lean().exec();
    }

    async getUserSessionByToken(token: string): Promise<UserSession> {
        return this.userSessionModel.findOne({ ssoToken: token }).lean().exec();
    }

    async createUserSession(param: CreateUserSessionParam): Promise<UserSession> {
        const userSessionCreated = new this.userSessionModel(param);

        return userSessionCreated.save();
    }

    async updateReCheckInTime(sessionId: string): Promise<UserSessionDocument> {
        return this.userSessionModel.updateOne({ sessionId: sessionId }, { $set: { recheckInTime: new Date() } }).exec();
    }

    async verifySession(request: VerifySessionRequest) {
        const userSession = await this.getUserSession(request.session);
        const isValid =
            userSession && userSession.username === request.username && userSession.browserUserAgent === request.browserUserAgent;
        const isSessionExpired = this.isSessionExpired(userSession);

        return new VerifySessionResult(isValid && !isSessionExpired, userSession);
    }

    private isSessionExpired(userSession: UserSession) {
        if (!userSession) {
            return true;
        }

        const differenceInMinutes = Math.abs(Date.now() - userSession.recheckInTime.getTime()) / (1000 * 60);

        return differenceInMinutes > this.sessionTimeoutInMinutes;
    }

    async updateCurrencyGroup(sessionId: string, currencyGroupId: string): Promise<UserSessionDocument> {
        return this.userSessionModel.updateOne({ sessionId: sessionId }, { $set: { currencyGroupId } }).exec();
    }

    async getOnlineUsers() {
        const dt = new Date();
        const expiredTime = new Date(dt.getTime() - 60000);

        const sessions = await this.userSessionModel
            .find({ recheckInTime: { $gte: expiredTime } })
            .lean()
            .exec();

        const onlineUsers = [];

        await Promise.all(
            sessions.map(async (session) => {
                const userInfo = await this.userInfosService.getUserInfo(session.userId);

                const user = {
                    name: session.memberName,
                    id: session.memberId,
                    currency: session.currencyName,
                    character: userInfo?.name,
                    partnerId: session.partnerId,
                    isTest: session.isTestCurrency,
                };

                if (onlineUsers.find((onlineUser) => onlineUser.character === user.character) === undefined) {
                    onlineUsers.push(user);
                }
            }),
        );

        const realUsers = onlineUsers.filter((user) => !user.isTest);
        const testUsers = onlineUsers.filter((user) => user.isTest);

        return {
            totalRealPlayer: realUsers.length,
            realUsers: realUsers,
            totalTestPlayer: testUsers.length,
            testUsers: testUsers,
        };
    }
}
