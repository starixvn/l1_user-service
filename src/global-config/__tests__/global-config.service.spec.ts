import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { GlobalConfigService } from '../global-config.service';
import { GameConfig } from '../schemas/game-config.schema';
import { GlobalConfig } from '../schemas/global-config.schema';

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

    it('getConfig', async () => {
        globalConfigModel.findOne = jest.fn().mockReturnValue({
            lean: () => {
                return { configs: { mbc: [1, 2, 3, 4] } };
            },
        });

        await service.getConfig('game_site_exclusions');

        expect(globalConfigModel.findOne).toHaveBeenCalled();
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

    describe('getOfferedGames', () => {
        it('when not provide site name should returns []', async () => {
            //act
            const actualValue = await service.getOfferedGames(null);

            // assert
            expect(actualValue).toStrictEqual([]);
        });

        it('when not have settings should returns []', async () => {
            // arrange
            const siteName = 'siteName';
            globalConfigModel.findOne.mockReturnValueOnce({ lean: () => null });
            gameConfigModel.find.mockReturnValueOnce({
                lean: () => {
                    return {
                        exec: () => [],
                    };
                },
            });

            //act
            const actualValue = await service.getOfferedGames(siteName);

            // assert
            expect(actualValue).toStrictEqual([]);
        });

        it('when have settings and is not super players should returns allow game for site', async () => {
            // arrange
            const siteName = 'siteName';
            globalConfigModel.findOne.mockReturnValueOnce({
                lean: () => {
                    return { configs: { 1: ['siteName'], 2: [], 3: [] } };
                },
            });

            globalConfigModel.exists.mockReturnValueOnce(true);
            gameConfigModel.find.mockReturnValueOnce({
                lean: () => {
                    return {
                        exec: () => [],
                    };
                },
            });

            //act
            const actualValue = await service.getOfferedGames(siteName);

            // assert
            expect(actualValue).toStrictEqual([2, 3]);
        });

        it('when have settings and is super players should returns allow game for site include beta games', async () => {
            // arrange
            const siteName = 'siteName';
            const username = 'username';
            globalConfigModel.findOne.mockReturnValueOnce({
                lean: () => {
                    return { configs: { 1: ['siteName'], 2: ['siteName'], 3: [] } };
                },
            });

            globalConfigModel.exists.mockReturnValueOnce(true);
            gameConfigModel.find.mockReturnValueOnce({
                lean: () => {
                    return {
                        exec: () => [{ gameId: '1' }, { isBeta: true }],
                    };
                },
            });

            //act
            const actualValue = await service.getOfferedGames(siteName, username);

            // assert
            expect(actualValue).toStrictEqual([1, 3]);
        });
    });
});
