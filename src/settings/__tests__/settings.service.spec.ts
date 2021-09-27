import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UMInfo, UMInfoDocument, UMInfoSchema } from '../schemas';
import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { Model } from 'mongoose';
import { SettingsService } from '../settings.service';
import { GlobalConfigService } from '../../global-config/global-config.service';

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
        it('when not have playerName should get umInfo', async () => {
            jest.spyOn(model, 'findOne');

            await service.getSettings('');

            expect(model.findOne).toHaveBeenCalled();
        });

        it('when is not super players should get umInfo', async () => {
            jest.spyOn(model, 'findOne');
            stubGlobalConfigService.isSuperPlayers.mockReturnValueOnce(false);

            const playerName = 'playerName';

            await service.getSettings(playerName);

            expect(model.findOne).toHaveBeenCalled();
        });

        it('when is super players should not get umInfo', async () => {
            jest.spyOn(model, 'findOne');
            stubGlobalConfigService.isSuperPlayers.mockReturnValueOnce(true);

            const playerName = 'playerName';

            await service.getSettings(playerName);

            expect(model.findOne).not.toHaveBeenCalled();
        });
    });
});
