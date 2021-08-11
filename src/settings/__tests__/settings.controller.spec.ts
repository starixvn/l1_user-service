import { Test } from '@nestjs/testing';
import { SettingsResult } from '../models';
import { SettingsController } from '../settings.controller';
import { SettingsService } from '../settings.service';

jest.mock('../settings.service');

describe('SettingsController test', () => {
    let settingsController: SettingsController;
    let settingsService: SettingsService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [SettingsController],
            providers: [SettingsService],
        }).compile();

        settingsController = module.get<SettingsController>(SettingsController);
        settingsService = module.get<SettingsService>(SettingsService);
    });

    describe('getSettings test', () => {
        it('should return sign result from auth service', async () => {
            const expectResult: SettingsResult = {
                isUM: false,
                umInfo: {
                    end: new Date(),
                    finish: true,
                    start: new Date(),
                    time: new Date(),
                },
            };

            jest.spyOn(settingsService, 'getSettings').mockResolvedValue(expectResult);

            expect(await settingsController.getSettings()).toBe(expectResult);
        });
    });
});

afterEach(() => {
    jest.clearAllMocks();
});
