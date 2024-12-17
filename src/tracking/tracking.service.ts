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
                playerId: session.playerId,
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

        await this.playerTrackingModel.findOneAndUpdate(
            {
                playerId: playerTracking.playerId,
                visitorId: playerTracking.visitorId,
            },
            {
                ...playerTracking,
                operatorId: session.operatorId,
                playerName: session.playerName,
            },
            {
                new: true,
                useFindAndModify: false,
            },
        );

        return { status: TrackingStatus.UPDATED };
    }

    private async createPlayerTracking(session: UserSession, deviceRequest: Device, visitorId: string): Promise<TrackingResponse> {
        const newPlayerTracking = new this.playerTrackingModel({
            playerId: session.playerId,
            operatorId: session.operatorId,
            playerName: session.playerName,
            visitorId: visitorId,
            deviceHistory: [deviceRequest],
        });

        await newPlayerTracking.save();

        return { status: TrackingStatus.CREATED };
    }
}
