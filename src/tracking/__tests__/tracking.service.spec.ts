import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { TrackingService } from '../tracking.service';
import { PlayerTracking, PlayerTrackingDocument } from '../schema/player-tracking';
import { UserSessionsService } from '../../users/providers';
import { TrackingRequest } from '../models/tracking-request';
import { TrackingStatus } from '../models/tracking-response';
import { UserSession } from '../../users/schemas';

describe('TrackingService', () => {
    let service: TrackingService;
    let model: Model<PlayerTrackingDocument>;
    let userSessionsService: UserSessionsService;

    const mockPlayerTracking = {
        playerId: 'player123',
        operatorId: 'operator123',
        playerName: 'Test Player',
        visitorId: 'visitor123',
        deviceHistory: [],
    };

    const mockSession: Partial<UserSession> = {
        playerId: 'player123',
        operatorId: 'operator123',
        playerName: 'Test Player',
    };

    const mockTrackingRequest: TrackingRequest = {
        visitorId: 'visitor123',
        browserUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        ip: '127.0.0.1',
        session: '',
        username: '',
    };

    const mockDeviceInfo = {
        browser: { name: 'Safari', version: '14.0' },
        os: { name: 'iOS', version: '14.0' },
        device: { model: 'iPhone', type: 'mobile' },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TrackingService,
                {
                    provide: getModelToken(PlayerTracking.name),
                    useValue: ({
                        findOne: jest.fn(),
                        findOneAndUpdate: jest.fn(),
                        create: jest.fn(),
                        prototype: {
                            save: jest.fn(),
                        },
                    } as unknown) as Model<PlayerTrackingDocument>,
                },
                {
                    provide: UserSessionsService,
                    useValue: {
                        verifySession: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TrackingService>(TrackingService);

        model = module.get<Model<PlayerTrackingDocument>>(getModelToken(PlayerTracking.name));
        userSessionsService = module.get<UserSessionsService>(UserSessionsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAndUpdateDevice', () => {
        it('should update existing tracking when player tracking exists', async () => {
            // Arrange
            const existingTracking = {
                ...mockPlayerTracking,
                deviceHistory: [
                    {
                        browser: JSON.stringify(mockDeviceInfo.browser),
                        os: JSON.stringify(mockDeviceInfo.os),
                        model: JSON.stringify(mockDeviceInfo.device),
                        lastUsedTime: new Date(),
                    },
                ],
            } as PlayerTrackingDocument;

            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: mockSession as UserSession,
            });
            jest.spyOn(model, 'findOne').mockResolvedValue(existingTracking);
            jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(existingTracking);

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.UPDATED);
            expect(model.findOneAndUpdate).toHaveBeenCalled();
        });

        it('should add new device to existing tracking when device not found', async () => {
            // Arrange
            const existingTracking = {
                ...mockPlayerTracking,
                deviceHistory: [
                    {
                        browser: JSON.stringify({ name: 'Chrome', version: '90.0' }),
                        os: JSON.stringify({ name: 'Windows', version: '10' }),
                        model: JSON.stringify({ model: 'PC', type: 'desktop' }),
                        lastUsedTime: new Date(),
                    },
                ],
            } as PlayerTrackingDocument;

            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: mockSession as UserSession,
            });
            jest.spyOn(model, 'findOne').mockResolvedValue(existingTracking);
            jest.spyOn(model, 'findOneAndUpdate').mockImplementation(() => Promise.resolve(existingTracking) as any);

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.UPDATED);
        });

        it('should return error when session is invalid', async () => {
            // Arrange
            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: false,
                session: null,
            });

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.ERROR);
            expect(result.error).toBe('Invalid session');
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            jest.spyOn(userSessionsService, 'verifySession').mockRejectedValue(new Error('Test error'));

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBe('Test error');
        });

        it('should update existing device when found in tracking history', async () => {
            // Arrange
            const oldDate = new Date('2024-01-01');
            const existingTracking = {
                ...mockPlayerTracking,
                deviceHistory: [
                    {
                        browser: JSON.stringify(mockDeviceInfo.browser),
                        os: JSON.stringify(mockDeviceInfo.os),
                        model: JSON.stringify(mockDeviceInfo.device),
                        lastUsedTime: oldDate,
                    },
                ],
            } as PlayerTrackingDocument;

            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: mockSession as UserSession,
            });
            jest.spyOn(model, 'findOne').mockResolvedValue(existingTracking);
            jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue({
                ...existingTracking,
                deviceHistory: [
                    {
                        browser: JSON.stringify(mockDeviceInfo.browser),
                        os: JSON.stringify(mockDeviceInfo.os),
                        model: JSON.stringify(mockDeviceInfo.device),
                        lastUsedTime: new Date(),
                    },
                ],
            } as PlayerTrackingDocument);

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.UPDATED);
            expect(model.findOneAndUpdate).toHaveBeenCalled();
        });

        it('should handle database error gracefully', async () => {
            // Arrange
            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: mockSession as UserSession,
            });
            jest.spyOn(model, 'findOne').mockRejectedValue(new Error('Database connection failed'));

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBe('Database connection failed');
        });

        it('should validate required session fields', async () => {
            // Arrange
            const invalidSession = { ...mockSession, playerId: undefined };
            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: invalidSession as UserSession,
            });

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBeDefined();
        });
    });
});
