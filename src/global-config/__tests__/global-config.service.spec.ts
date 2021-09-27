import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { GlobalConfigService } from '../global-config.service';
import { GlobalConfig } from '../schemas/global-config.schema';

describe('', () => {
    let service: GlobalConfigService;
    class GlobalConfigModel {
        save: jest.Mock;
        findOne: jest.Mock;
        exists: jest.Mock;
    }

    const globalConfigModel = new GlobalConfigModel();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GlobalConfigService,
                {
                    provide: getModelToken(GlobalConfig.name),
                    useValue: globalConfigModel,
                },
            ],
        }).compile();

        service = module.get<GlobalConfigService>(GlobalConfigService);
    });

    it('getConfig', async () => {
        globalConfigModel.findOne = jest.fn().mockReturnValue({ configs: { mbc: [1, 2, 3, 4] } });

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
});
