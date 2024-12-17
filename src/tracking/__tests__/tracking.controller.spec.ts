import { Test, TestingModule } from '@nestjs/testing';
import { TrackingController } from '../tracking.controller';
import { TrackingService } from '../tracking.service';
import { TrackingRequest } from '../models/tracking-request';
import { TrackingResponse, TrackingStatus } from '../models/tracking-response';

describe('TrackingController', () => {
    let controller: TrackingController;
    let service: TrackingService;

    const mockTrackingRequest: TrackingRequest = {
        visitorId: 'visitor123',
        browserUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        ip: '127.0.0.1',
        session: '',
        username: '',
    };

    const mockTrackingResponse = {
        status: TrackingStatus.CREATED,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TrackingController],
            providers: [
                {
                    provide: TrackingService,
                    useValue: {
                        findAndUpdateDevice: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<TrackingController>(TrackingController);
        service = module.get<TrackingService>(TrackingService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('track', () => {
        it('should successfully track device', async () => {
            // Arrange
            jest.spyOn(service, 'findAndUpdateDevice').mockResolvedValue(mockTrackingResponse as TrackingResponse);

            // Act
            const result = await controller.track(mockTrackingRequest);

            // Assert
            expect(result).toBe(mockTrackingResponse);
            expect(service.findAndUpdateDevice).toHaveBeenCalledWith(mockTrackingRequest);
        });

        it('should handle tracking errors', async () => {
            // Arrange
            const errorResponse = {
                status: TrackingStatus.ERROR,
                error: 'Tracking failed',
            };
            jest.spyOn(service, 'findAndUpdateDevice').mockResolvedValue(errorResponse);

            // Act
            const result = await controller.track(mockTrackingRequest);

            // Assert
            expect(result).toBe(errorResponse);
            expect(service.findAndUpdateDevice).toHaveBeenCalledWith(mockTrackingRequest);
        });

        it('should handle service exceptions', async () => {
            // Arrange
            jest.spyOn(service, 'findAndUpdateDevice').mockRejectedValue(new Error('Service error'));

            // Act & Assert
            await expect(controller.track(mockTrackingRequest)).rejects.toThrow('Service error');
        });
    });
});
