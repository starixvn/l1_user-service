import { Test } from '@nestjs/testing';
import { GameResultService } from '../game-result.service';
import { GameResultController } from '../game-result.controller';
import { GetAccessURLRequest } from '../models/get-access-url-request';

jest.mock('../game-result.service');

describe('GameResultController', () => {
    let gameResultService: GameResultService;
    let gameResultController: GameResultController;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [GameResultController],
            providers: [GameResultService],
        }).compile();

        gameResultService = module.get<GameResultService>(GameResultService);
        gameResultController = module.get<GameResultController>(GameResultController);
    });

    describe('getAccessUrl', () => {
        it('should return access url from service', async () => {
            // Arrange
            const expectResult = { gameResult: { redirectUrl: 'redirectUrl', errorMessage: null } };
            const request = {};

            jest.spyOn(gameResultService, 'getAccessUrl').mockResolvedValue(expectResult);

            // Act
            const actualValue = await gameResultController.getAccessUrl(request as GetAccessURLRequest);

            // Assert
            expect(actualValue).toBe(expectResult);
        });
    });
});
