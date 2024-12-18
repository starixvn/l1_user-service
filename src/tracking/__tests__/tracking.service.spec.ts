import { Test, TestingModule } from '@nestjs/testing';
import { TrackingService } from '../tracking.service';
import { PlayerTracking, PlayerTrackingDocument } from '../schema/player-tracking';
import { UserSessionsService } from '../../users/providers';
import { TrackingRequest } from '../models/tracking-request';
import { TrackingStatus } from '../models/tracking-response';
import { UserSession } from '../../users/schemas';
import { IPlayerTrackingRepository } from '../repositories/player-tracking.repository';

describe('TrackingService', () => {
    let service: TrackingService;
    let trackingRepository: IPlayerTrackingRepository;
    let userSessionsService: UserSessionsService;

    const mockPlayerTracking = {
        visitorId: 'visitor123',
        players: [
            {
                playerId: 'player123',
                operatorId: 'operator123',
                playerName: 'Test Player',
                lastUsedTime: new Date(),
            },
        ],
        deviceHistory: [],
        linkedVisitorIds: [],
    };

    const mockSession: Partial<UserSession> = {
        playerId: 'player123',
        operatorId: 'operator123',
        playerName: 'Test Player',
    };

    const mockTrackingRequest: TrackingRequest = {
        visitorId: 'visitor123',
        session: '',
        username: '',
        browserUserAgent: 'Mozilla/5.0 (Test Browser)',
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
                    provide: 'IPlayerTrackingRepository',
                    useValue: {
                        findByVisitorId: jest.fn(),
                        findByPlayerAndOperator: jest.fn(),
                        updateOne: jest.fn(),
                        create: jest.fn(),
                        updateLinkedVisitorIds: jest.fn(),
                    },
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
        trackingRepository = module.get<IPlayerTrackingRepository>('IPlayerTrackingRepository');
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
            jest.spyOn(trackingRepository, 'findByVisitorId').mockResolvedValue(existingTracking);
            jest.spyOn(trackingRepository, 'updateOne').mockResolvedValue(existingTracking);

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.UPDATED);
            expect(trackingRepository.updateOne).toHaveBeenCalledWith(mockTrackingRequest.visitorId, expect.any(Object));
        });

        it('should add new player to existing tracking when player not found', async () => {
            // Arrange
            const existingTracking = {
                visitorId: 'visitor123',
                players: [],
                deviceHistory: [],
            } as PlayerTrackingDocument;

            const newSession = {
                ...mockSession,
                playerId: 'newPlayer123',
            };

            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: newSession as UserSession,
            });
            jest.spyOn(trackingRepository, 'findByVisitorId').mockResolvedValue(existingTracking);
            jest.spyOn(trackingRepository, 'updateOne').mockResolvedValue(existingTracking);

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.UPDATED);
            expect(trackingRepository.updateOne).toHaveBeenCalledWith(mockTrackingRequest.visitorId, expect.any(Object));
        });

        it('should create new tracking when no tracking exists', async () => {
            // Arrange
            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: mockSession as UserSession,
            });
            jest.spyOn(trackingRepository, 'findByVisitorId').mockResolvedValue(null);
            jest.spyOn(trackingRepository, 'create').mockResolvedValue(mockPlayerTracking as PlayerTrackingDocument);

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.CREATED);
            expect(trackingRepository.create).toHaveBeenCalled();
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

        it('should handle database error gracefully', async () => {
            // Arrange
            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: mockSession as UserSession,
            });
            jest.spyOn(trackingRepository, 'findByVisitorId').mockRejectedValue(new Error('Database connection failed'));

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBe('Database connection failed');
        });
    });

    describe('createPlayerTracking', () => {
        const mockDevice = {
            browser: JSON.stringify({ name: 'Chrome', version: '90.0' }),
            os: JSON.stringify({ name: 'Windows', version: '10' }),
            model: JSON.stringify({ model: 'PC', type: 'desktop' }),
            lastUsedTime: new Date(),
        };

        it('should create new tracking when no existing tracking found', async () => {
            // Arrange
            jest.spyOn(trackingRepository, 'findByPlayerAndOperator').mockResolvedValue(null);
            jest.spyOn(trackingRepository, 'create').mockResolvedValue(mockPlayerTracking as PlayerTrackingDocument);

            // Act
            const result = await service.createPlayerTracking(mockSession as UserSession, mockDevice, 'visitor123');

            // Assert
            expect(result.status).toBe(TrackingStatus.CREATED);
            expect(trackingRepository.create).toHaveBeenCalledWith({
                visitorId: 'visitor123',
                linkedVisitorIds: [],
                players: [
                    {
                        playerId: mockSession.playerId,
                        operatorId: mockSession.operatorId,
                        playerName: mockSession.playerName,
                        lastUsedTime: expect.any(Date),
                    },
                ],
                deviceHistory: [mockDevice],
            });
            expect(trackingRepository.updateLinkedVisitorIds).not.toHaveBeenCalled();
        });

        it('should create new tracking and link to existing tracking', async () => {
            // Arrange
            const existingTracking = {
                visitorId: 'existingVisitor123',
                players: [],
                deviceHistory: [],
            } as PlayerTrackingDocument;

            jest.spyOn(trackingRepository, 'findByPlayerAndOperator').mockResolvedValue(existingTracking);
            jest.spyOn(trackingRepository, 'create').mockResolvedValue(mockPlayerTracking as PlayerTrackingDocument);
            jest.spyOn(trackingRepository, 'updateLinkedVisitorIds').mockResolvedValue();

            // Act
            const result = await service.createPlayerTracking(mockSession as UserSession, mockDevice, 'newVisitor123');

            // Assert
            expect(result.status).toBe(TrackingStatus.CREATED);
            expect(trackingRepository.create).toHaveBeenCalledWith({
                visitorId: 'newVisitor123',
                linkedVisitorIds: ['existingVisitor123'],
                players: [expect.any(Object)],
                deviceHistory: [mockDevice],
            });
            expect(trackingRepository.updateLinkedVisitorIds).toHaveBeenCalledWith('existingVisitor123', 'newVisitor123');
        });

        it('should handle database error during creation', async () => {
            // Arrange
            jest.spyOn(trackingRepository, 'findByPlayerAndOperator').mockResolvedValue(null);
            jest.spyOn(trackingRepository, 'create').mockRejectedValue(new Error('Database error'));

            // Act
            const result = await service.createPlayerTracking(mockSession as UserSession, mockDevice, 'visitor123');

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBe('Database error');
        });

        it('should handle error during linking visitors', async () => {
            // Arrange
            const existingTracking = {
                visitorId: 'existingVisitor123',
                players: [],
                deviceHistory: [],
            } as PlayerTrackingDocument;

            jest.spyOn(trackingRepository, 'findByPlayerAndOperator').mockResolvedValue(existingTracking);
            jest.spyOn(trackingRepository, 'create').mockResolvedValue(mockPlayerTracking as PlayerTrackingDocument);
            jest.spyOn(trackingRepository, 'updateLinkedVisitorIds').mockRejectedValue(new Error('Linking failed'));

            // Act
            const result = await service.createPlayerTracking(mockSession as UserSession, mockDevice, 'newVisitor123');

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBe('Linking failed');
        });

        it('should handle invalid session data', async () => {
            // Arrange
            const invalidSession: UserSession = null;

            // Act
            const result = await service.createPlayerTracking(invalidSession, mockDevice, 'visitor123');

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBeDefined();
            expect(trackingRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('updateExistingTracking', () => {
        it('should update existing device when found', async () => {
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

            jest.spyOn(trackingRepository, 'updateOne').mockResolvedValue(existingTracking);

            // Act
            const result = await service['updateExistingTracking'](
                existingTracking,
                existingTracking.deviceHistory[0],
                mockSession as UserSession,
            );

            // Assert
            expect(result.status).toBe(TrackingStatus.UPDATED);
            expect(trackingRepository.updateOne).toHaveBeenCalledWith(existingTracking.visitorId, expect.any(Object));
        });

        it('should add new device when not found', async () => {
            // Arrange
            const existingTracking = {
                ...mockPlayerTracking,
                deviceHistory: [],
            } as PlayerTrackingDocument;

            const newDevice = {
                browser: JSON.stringify(mockDeviceInfo.browser),
                os: JSON.stringify(mockDeviceInfo.os),
                model: JSON.stringify(mockDeviceInfo.device),
                lastUsedTime: new Date(),
            };

            jest.spyOn(trackingRepository, 'updateOne').mockResolvedValue({
                ...existingTracking,
                deviceHistory: [newDevice],
            } as PlayerTrackingDocument);

            // Act
            const result = await service['updateExistingTracking'](existingTracking, newDevice, mockSession as UserSession);

            // Assert
            expect(result.status).toBe(TrackingStatus.UPDATED);
            expect(trackingRepository.updateOne).toHaveBeenCalledWith(
                existingTracking.visitorId,
                expect.objectContaining({
                    deviceHistory: [newDevice],
                }),
            );
        });

        it('should handle database error during update', async () => {
            // Arrange
            const existingTracking = {
                ...mockPlayerTracking,
                deviceHistory: [],
            } as PlayerTrackingDocument;

            jest.spyOn(trackingRepository, 'updateOne').mockRejectedValue(new Error('Update failed'));

            // Act & Assert
            await expect(
                service['updateExistingTracking'](
                    existingTracking,
                    {
                        browser: 'test',
                        os: 'test',
                        model: 'test',
                        lastUsedTime: new Date(),
                    },
                    mockSession as UserSession,
                ),
            ).rejects.toThrow('Update failed');
        });
    });

    describe('findAndUpdateDevice edge cases', () => {
        it('should handle missing session data', async () => {
            // Arrange
            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: {} as UserSession,
            });

            // Act
            const result = await service.findAndUpdateDevice(mockTrackingRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBeDefined();
        });

        it('should handle invalid device info', async () => {
            // Arrange
            const invalidRequest = {
                ...mockTrackingRequest,
                browserUserAgent: null,
            };

            jest.spyOn(userSessionsService, 'verifySession').mockResolvedValue({
                isAuthenticated: true,
                session: mockSession as UserSession,
            });

            // Act
            const result = await service.findAndUpdateDevice(invalidRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBeDefined();
        });

        it('should handle empty visitor ID', async () => {
            // Arrange
            const invalidRequest = {
                ...mockTrackingRequest,
                visitorId: '',
            };

            // Act
            const result = await service.findAndUpdateDevice(invalidRequest);

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBeDefined();
        });
    });

    describe('createPlayerTracking edge cases', () => {
        it('should handle null device request', async () => {
            // Act
            const result = await service.createPlayerTracking(mockSession as UserSession, null, 'visitor123');

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBeDefined();
        });

        it('should handle repository errors during linking', async () => {
            // Arrange
            const existingTracking = {
                visitorId: 'existingVisitor123',
            } as PlayerTrackingDocument;

            jest.spyOn(trackingRepository, 'findByPlayerAndOperator').mockResolvedValue(existingTracking);
            jest.spyOn(trackingRepository, 'create').mockResolvedValue(mockPlayerTracking as PlayerTrackingDocument);
            jest.spyOn(trackingRepository, 'updateLinkedVisitorIds').mockRejectedValue(new Error('Linking failed'));

            // Act
            const result = await service.createPlayerTracking(
                mockSession as UserSession,
                {
                    browser: 'test',
                    os: 'test',
                    model: 'test',
                    lastUsedTime: new Date(),
                },
                'visitor123',
            );

            // Assert
            expect(result.status).toBe(TrackingStatus.FAILED);
            expect(result.error).toBe('Linking failed');
        });
    });
});
