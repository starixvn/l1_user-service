import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, PlayerTracking, PlayerTrackingDocument } from './schema/player-tracking';
import { TrackingRequest } from './models/tracking-request';
import { TrackingResponse, TrackingStatus } from './models/tracking-response';
import { UserSession } from '../users/schemas';
import { UserSessionsService } from '../users/providers';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class TrackingService {
    @Inject(UserSessionsService) private readonly userSessionsService: UserSessionsService;

    constructor(@InjectModel(PlayerTracking.name) private readonly playerTrackingModel: Model<PlayerTrackingDocument>) {}

    async findAndUpdateDevice(trackingRequest: TrackingRequest): Promise<TrackingResponse> {
        try {
            const { isAuthenticated, session } = await this.userSessionsService.verifySession(trackingRequest);

            if (!isAuthenticated) {
                return { status: TrackingStatus.ERROR, error: 'Invalid session' };
            }

            const deviceInfo = UAParser(trackingRequest.browserUserAgent);
            const playerTracking = await this.playerTrackingModel.findOne({
                visitorId: trackingRequest.visitorId,
            });

            const deviceRequest: Device = {
                browser: JSON.stringify(deviceInfo.browser),
                os: JSON.stringify(deviceInfo.os),
                model: JSON.stringify(deviceInfo.device),
                lastUsedTime: new Date(),
            };

            if (!playerTracking) {
                return await this.createPlayerTracking(session, deviceRequest, trackingRequest.visitorId);
            }

            return await this.updateExistingTracking(playerTracking, deviceRequest, session);
        } catch (error) {
            return { status: TrackingStatus.FAILED, error: error.message };
        }
    }

    private async updateExistingTracking(
        playerTracking: PlayerTrackingDocument,
        deviceRequest: Device,
        session: UserSession,
    ): Promise<TrackingResponse> {
        const device = playerTracking.deviceHistory.find(
            (device) => device.browser === deviceRequest.browser && device.model === deviceRequest.model,
        );

        if (!device) {
            deviceRequest.lastUsedTime = new Date();
            playerTracking.deviceHistory.push(deviceRequest);
        } else {
            device.lastUsedTime = new Date();
            device.browser = deviceRequest.browser;
            device.os = deviceRequest.os;
            device.model = deviceRequest.model;
        }

        const player = playerTracking.players.find((p) => p.playerId === session.playerId && p.operatorId === session.operatorId);
        if (!player) {
            playerTracking.players.push({
                playerId: session.playerId,
                operatorId: session.operatorId,
                playerName: session.playerName,
                lastUsedTime: new Date(),
            });
        } else {
            player.lastUsedTime = new Date();
            player.operatorId = session.operatorId;
            player.playerName = session.playerName;
        }

        await this.playerTrackingModel.findOneAndUpdate(
            {
                visitorId: playerTracking.visitorId,
            },
            {
                ...playerTracking,
            },
            {
                new: true,
                useFindAndModify: false,
            },
        );

        return { status: TrackingStatus.UPDATED };
    }

    public async createPlayerTracking(session: UserSession, deviceRequest: Device, visitorId: string): Promise<TrackingResponse> {
        // Find existing tracking by playerId and operatorId
        const existingTracking = await this.playerTrackingModel.findOne({
            'players.playerId': session.playerId,
            'players.operatorId': session.operatorId,
        });

        const newPlayerTracking = new this.playerTrackingModel({
            visitorId: visitorId,
            linkedVisitorIds: existingTracking?.visitorId ? [existingTracking.visitorId] : [],
            players: [
                {
                    playerId: session.playerId,
                    operatorId: session.operatorId,
                    playerName: session.playerName,
                    lastUsedTime: new Date(),
                },
            ],
            deviceHistory: [deviceRequest],
        });

        await newPlayerTracking.save();

        // Update existing tracking's linkedVisitorIds if it exists
        if (existingTracking?.visitorId) {
            await this.playerTrackingModel.findOneAndUpdate(
                { visitorId: existingTracking.visitorId },
                { $addToSet: { linkedVisitorIds: visitorId } },
            );
        }

        return { status: TrackingStatus.CREATED };
    }
}
