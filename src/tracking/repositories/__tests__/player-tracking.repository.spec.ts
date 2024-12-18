import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerTrackingRepository } from '../player-tracking.repository';
import { PlayerTracking, PlayerTrackingDocument } from '../../schema/player-tracking';

describe('PlayerTrackingRepository', () => {
    let repository: PlayerTrackingRepository;
    let model: Model<PlayerTrackingDocument>;

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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlayerTrackingRepository,
                {
                    provide: getModelToken(PlayerTracking.name),
                    useValue: {
                        findOne: jest.fn(),
                        findOneAndUpdate: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();

        repository = module.get<PlayerTrackingRepository>(PlayerTrackingRepository);
        model = module.get<Model<PlayerTrackingDocument>>(getModelToken(PlayerTracking.name));
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('findByVisitorId', () => {
        it('should find tracking by visitor ID', async () => {
            // Arrange
            jest.spyOn(model, 'findOne').mockResolvedValue(mockPlayerTracking as PlayerTrackingDocument);

            // Act
            const result = await repository.findByVisitorId('visitor123');

            // Assert
            expect(result).toEqual(mockPlayerTracking);
            expect(model.findOne).toHaveBeenCalledWith({ visitorId: 'visitor123' });
        });

        it('should return null when no tracking found', async () => {
            // Arrange
            jest.spyOn(model, 'findOne').mockResolvedValue(null);

            // Act
            const result = await repository.findByVisitorId('nonexistent');

            // Assert
            expect(result).toBeNull();
            expect(model.findOne).toHaveBeenCalledWith({ visitorId: 'nonexistent' });
        });
    });

    describe('findByPlayerAndOperator', () => {
        it('should find tracking by player ID and operator ID', async () => {
            // Arrange
            jest.spyOn(model, 'findOne').mockResolvedValue(mockPlayerTracking as PlayerTrackingDocument);

            // Act
            const result = await repository.findByPlayerAndOperator('player123', 'operator123');

            // Assert
            expect(result).toEqual(mockPlayerTracking);
            expect(model.findOne).toHaveBeenCalledWith({
                'players.playerId': 'player123',
                'players.operatorId': 'operator123',
            });
        });

        it('should return null when no tracking found', async () => {
            // Arrange
            jest.spyOn(model, 'findOne').mockResolvedValue(null);

            // Act
            const result = await repository.findByPlayerAndOperator('nonexistent', 'nonexistent');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('updateOne', () => {
        it('should update tracking document', async () => {
            // Arrange
            const updateData = {
                ...mockPlayerTracking,
                deviceHistory: [
                    {
                        browser: 'test',
                        model: 'test',
                        os: 'test',
                        lastUsedTime: new Date(),
                    },
                ],
            };
            jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(updateData as PlayerTrackingDocument);

            // Act
            const result = await repository.updateOne('visitor123', updateData);

            // Assert
            expect(result).toEqual(updateData);
            expect(model.findOneAndUpdate).toHaveBeenCalledWith({ visitorId: 'visitor123' }, updateData, {
                new: true,
                useFindAndModify: false,
            });
        });

        it('should return null when no document to update', async () => {
            // Arrange
            jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(null);

            // Act
            const result = await repository.updateOne('nonexistent', mockPlayerTracking);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('updateLinkedVisitorIds', () => {
        it('should update linked visitor IDs', async () => {
            // Arrange
            jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(mockPlayerTracking as PlayerTrackingDocument);

            // Act
            await repository.updateLinkedVisitorIds('visitor123', 'newVisitor123');

            // Assert
            expect(model.findOneAndUpdate).toHaveBeenCalledWith(
                { visitorId: 'visitor123' },
                { $addToSet: { linkedVisitorIds: 'newVisitor123' } },
            );
        });

        it('should handle update failure gracefully', async () => {
            // Arrange
            jest.spyOn(model, 'findOneAndUpdate').mockRejectedValue(new Error('Update failed'));

            // Act & Assert
            await expect(repository.updateLinkedVisitorIds('visitor123', 'newVisitor123')).rejects.toThrow('Update failed');
        });
    });
});
