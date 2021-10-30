import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSessionsService } from '../users/providers';
import { AuthService } from '../auth';

import { CurrencyGroup, CurrencyGroupDocument } from './schemas';

@Injectable()
export class CurrencyGroupService {
    constructor(
        @InjectModel(CurrencyGroup.name) private readonly currencyGroupModel: Model<CurrencyGroupDocument>,
        private readonly authService: AuthService,
        private readonly userSessionService: UserSessionsService,
    ) {}

    async getAllCurrencyGroups() {
        return this.currencyGroupModel.find({ enabled: true }).lean().exec();
    }

    async signInAndUpdateUserSession(userAgent: string, ip: string, groupId: string, token: string, system: number) {
        const auth = await this.authService.signIn(ip, token, userAgent, system);

        if (auth.isAuthenticated) {
            await this.userSessionService.updateCurrencyGroup(auth.ss, groupId);

            // TODO send request to api and return the redirect url
            return '/';
        } else {
            return '/currency-group/error';
        }
    }
}
