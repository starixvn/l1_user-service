import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { GameConfigService } from '../game-config.service';
import { GameConfig } from '../schemas/game-config.schema';

class GameConfigModel {
    find: jest.Mock;
}

describe('', () => {
    let service: GameConfigService;

    const gameConfigModel = new GameConfigModel();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameConfigService,
                {
                    provide: getModelToken(GameConfig.name),
                    useValue: gameConfigModel,
                },
            ],
        }).compile();

        service = module.get<GameConfigService>(GameConfigService);
    });

    //TODO:
    describe('getEnableGames', () => {
        it('when call get should return list of enable games', async () => {
            // arrange
            gameConfigModel.find = jest.fn().mockReturnValue({
                lean: () => {
                    return {
                        exec: jest.fn().mockReturnValue([
                            { gameId: 1, enabled: true },
                            { gameId: 2, enabled: true },
                        ]),
                    };
                },
            });

            // act
            await service.getEnabledGameIds();

            // assert
            expect(gameConfigModel.find).toHaveBeenCalledWith({ enabled: true }, '-_id gameId');
        });
    });
});
