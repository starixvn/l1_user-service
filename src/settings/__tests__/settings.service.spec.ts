import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UMInfo, UMInfoDocument, UMInfoSchema } from '../schemas';
import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { Model } from 'mongoose';
import { SettingsService } from '../settings.service';

describe('UserInfosService test', () => {
    let service: SettingsService;
    let model: Model<UMInfoDocument>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SettingsService],
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
        it('should return user info that matched query user name', async () => {
            jest.spyOn(model, 'findOne');

            await service.getSettings();

            expect(model.findOne).toHaveBeenCalled();
        });
    });
});
