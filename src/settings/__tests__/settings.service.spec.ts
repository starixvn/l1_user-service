import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { Model } from "mongoose";

import { GlobalConfigService } from "../../global-config/global-config.service";
import { closeInMongodConnection, rootMongooseTestModule } from "../../shared/test-utils/mongoose-test-module";
import { UMInfo, UMInfoDocument, UMInfoSchema } from "../schemas";
import { SettingsService } from "../settings.service";

class StubGlobalConfigService {
    getConfig = jest.fn();
    isSuperPlayers = jest.fn();
}

const stubGlobalConfigService = new StubGlobalConfigService();

describe('UserInfosService test', () => {
    let service: SettingsService;
    let model: Model<UMInfoDocument>;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SettingsService,
                {
                    provide: GlobalConfigService,
                    useValue: stubGlobalConfigService,
                },
            ],
            imports: [rootMongooseTestModule(), MongooseModule.forFeature([{ name: UMInfo.name, schema: UMInfoSchema }])],
        }).compile();

        service = module.get<SettingsService>(SettingsService);
        model = module.get<Model<UMInfoDocument>>(`${UMInfo.name}Model`);
    });

    afterAll(async (done) => {
        jest.clearAllMocks();
        await closeInMongodConnection();
        done();
    });

    describe('getSettings test', () => {
        it('should get umInfo', async () => {
            jest.spyOn(model, 'findOne');

            await service.getSettings();

            expect(model.findOne).toHaveBeenCalled();
        });

    });
});
