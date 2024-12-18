import { Inject, Injectable } from '@nestjs/common';
import { Device, PlayerTrackingDocument } from './schema/player-tracking';
import { TrackingRequest } from './models/tracking-request';
import { TrackingResponse, TrackingStatus } from './models/tracking-response';
import { UserSession } from '../users/schemas';
import { UserSessionsService } from '../users/providers';
import { UAParser } from 'ua-parser-js';
import * as Sentry from '@sentry/node';
import { IPlayerTrackingRepository } from './repositories/player-tracking.repository';

@Injectable()
export class TrackingService {
    constructor(
        @Inject(UserSessionsService) private readonly userSessionsService: UserSessionsService,
        @Inject('IPlayerTrackingRepository') private readonly trackingRepository: IPlayerTrackingRepository,
    ) {}

    private isValidSession(session: UserSession): boolean {
        if (!session) return false;

        const requiredFields = ['playerId', 'operatorId', 'playerName'];
        return requiredFields.every((field) => {
            const value = session[field];
            return value !== undefined && value !== null && value !== '';
        });
    }

    async findAndUpdateDevice(trackingRequest: TrackingRequest): Promise<TrackingResponse> {
        try {
            if (!trackingRequest?.visitorId) {
                return { status: TrackingStatus.FAILED, error: 'Invalid visitor ID' };
            }

            const { isAuthenticated, session } = await this.userSessionsService.verifySession(trackingRequest);

            if (!isAuthenticated || !session) {
                return { status: TrackingStatus.ERROR, error: 'Invalid session' };
            }

            if (!this.isValidSession(session)) {
                return { status: TrackingStatus.FAILED, error: 'Missing required session data' };
            }

            if (!trackingRequest.browserUserAgent) {
                return { status: TrackingStatus.FAILED, error: 'Invalid device info' };
            }

            const deviceInfo = UAParser(trackingRequest.browserUserAgent);
            const playerTracking = await this.trackingRepository.findByVisitorId(trackingRequest.visitorId);

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
            Sentry.captureException(error, {
                extra: {
                    visitorId: trackingRequest?.visitorId,
                    browserUserAgent: trackingRequest?.browserUserAgent,
                    username: trackingRequest?.username,
                    context: 'findAndUpdateDevice',
                },
            });
            return { status: TrackingStatus.FAILED, error: error.message };
        }
    }

    public async createPlayerTracking(session: UserSession, deviceRequest: Device, visitorId: string): Promise<TrackingResponse> {
        try {
            if (!this.isValidSession(session)) {
                return { status: TrackingStatus.FAILED, error: 'Invalid session data' };
            }

            if (!deviceRequest || !this.isValidDevice(deviceRequest)) {
                return { status: TrackingStatus.FAILED, error: 'Invalid device request' };
            }

            const existingTracking = await this.trackingRepository.findByPlayerAndOperator(session.playerId, session.operatorId);

            await this.trackingRepository.create({
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

            if (existingTracking?.visitorId) {
                await this.trackingRepository.updateLinkedVisitorIds(existingTracking.visitorId, visitorId);
            }

            return { status: TrackingStatus.CREATED };
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    visitorId,
                    playerId: session?.playerId,
                    operatorId: session?.operatorId,
                    context: 'createPlayerTracking',
                },
            });
            return { status: TrackingStatus.FAILED, error: error.message };
        }
    }

    private isValidDevice(device: Device): boolean {
        return !!(device.browser && device.os && device.model && device.lastUsedTime);
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

        await this.trackingRepository.updateOne(playerTracking.visitorId, playerTracking);
        return { status: TrackingStatus.UPDATED };
    }
}
