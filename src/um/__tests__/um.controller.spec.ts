import { Test } from '@nestjs/testing';

import { UMResult } from '../models';
import { UMController } from '../um.controller';
import { UMService } from '../um.service';

jest.mock('../um.service');

describe('UMController test', () => {
    let umController: UMController;
    let umService: UMService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [UMController],
            providers: [UMService],
        }).compile();

        umController = module.get<UMController>(UMController);
        umService = module.get<UMService>(UMService);
    });

    describe('getUnfinishedUM test', () => {
        it('should return UM result from UMservice', async () => {
            const expectResult = new UMResult(false, null);

            jest.spyOn(umService, 'getUMResult').mockResolvedValue(expectResult);

            expect(await umController.getUnfinishedUM('ONEworks1')).toBe(expectResult);
        });
    });
});

afterEach(() => {
    jest.clearAllMocks();
});
