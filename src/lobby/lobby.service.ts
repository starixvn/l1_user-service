import { Inject, Injectable, CACHE_MANAGER } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Lobby, LobbyDocument } from './schemas/lobby.schema';
import { UserSessionsService } from '../users/providers';
import { VerifySessionRequest } from '../users/models';
import { invalidSession } from '../users/constants/errors';
import { Model } from 'mongoose';
import { SentryLogger } from '../common/providers/logger.service';
import { Cache } from 'cache-manager';
import { LobbyConfigsResult } from './models/result';

@Injectable()
export class LobbyService {
    private readonly lobbyCacheKey = 'Lobbies';
    @InjectModel(Lobby.name) private readonly lobbyModel: Model<LobbyDocument>;
    @Inject(UserSessionsService) private readonly userSessionsService: UserSessionsService;
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache;

    @Inject(SentryLogger) private readonly logger: SentryLogger;
    private readonly cacheTimeOut = +process.env.CACHE_TIMEOUT_LOBBY * 60;

    async getLobbies() {
        try {
            const cachedLobbies = await this.cacheManager.get(this.lobbyCacheKey);
            if (cachedLobbies) {
                return cachedLobbies as Array<any>;
            }

            const lobbies = await this.lobbyModel.find({}).lean().exec();
            await this.cacheManager.set(this.lobbyCacheKey, lobbies, { ttl: this.cacheTimeOut });
            return lobbies;
        } catch (error) {
            this.logger.error(error);

            return [];
        }
    }

    async getLobbyConfigs(request: VerifySessionRequest) {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);
        if (!isAuthenticated) {
            return invalidSession;
        }

        const lobbies = await this.getLobbies();

        const lobbyByCurrencyGroup = lobbies?.find((lobby) => lobby?.currencyGroupIds?.includes(session.currencyGroupId));
        return new LobbyConfigsResult(true, lobbyByCurrencyGroup ?? {});
    }
}
