import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";

import { GlobalConfigService } from "../global-config.service";
import { GlobalConfig } from "../schemas/global-config.schema";

describe('', () => {
    let service: GlobalConfigService;
    class GlobalConfigModel {
        save: jest.Mock;
        findOne: jest.Mock;
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
        const result = await service.getConfig('game_site_exclusions');

        console.log(result);

        expect(globalConfigModel.findOne).toHaveBeenCalled();
    });
});
