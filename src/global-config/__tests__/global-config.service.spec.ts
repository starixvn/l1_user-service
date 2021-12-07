import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";

import { GlobalConfigService } from "../global-config.service";
import { GameConfig } from "../schemas/game-config.schema";
import { GlobalConfig } from "../schemas/global-config.schema";

class GlobalConfigModel {
    save: jest.Mock;
    exists: jest.Mock;
    findOne: jest.Mock;
}

class GameConfigModel {
    find: jest.Mock;
}

describe('', () => {
    let service: GlobalConfigService;

    const globalConfigModel = new GlobalConfigModel();
    const gameConfigModel = new GameConfigModel();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GlobalConfigService,
                {
                    provide: getModelToken(GlobalConfig.name),
                    useValue: globalConfigModel,
                },
                {
                    provide: getModelToken(GameConfig.name),
                    useValue: gameConfigModel,
                },
            ],
        }).compile();

        service = module.get<GlobalConfigService>(GlobalConfigService);
    });

    describe('isSuperPlayers', () => {
        it('when playerName is not provided should return false', async () => {
            // arrange
            const playerName = undefined;

            // act
            const actualValue = await service.isSuperPlayers(playerName);

            // assert
            expect(actualValue).toBeFalsy();
        });

        it('when is not super players should return false', async () => {
            // arrange
            const playerName = 'playerName';
            globalConfigModel.exists = jest.fn().mockReturnValue(false);

            // act
            const actualValue = await service.isSuperPlayers(playerName);

            // assert
            expect(actualValue).toBeFalsy();
        });

        it('when is super players should return true', async () => {
            // arrange
            const playerName = 'playerName';
            globalConfigModel.exists = jest.fn().mockReturnValue(true);

            // act
            const actualValue = await service.isSuperPlayers(playerName);

            // assert
            expect(actualValue).toBeTruthy();
        });
    });

    describe('getBetaGames', () => {
        it('always returns gameConfigModels with name', async () => {
            gameConfigModel.find = jest.fn().mockReturnValue({
                lean: () => {
                    return { exec: jest.fn() };
                },
            });

            await service.getBetaGames();

            expect(gameConfigModel.find).toHaveBeenCalledWith({ isBeta: true }, 'gameId');
        });
    });
});
