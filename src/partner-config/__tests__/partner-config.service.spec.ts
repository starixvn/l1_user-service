import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";

import { PartnerConfigService } from "../partner-config.service";
import { PartnerConfig } from "../schemas/partner-config.schema";

class PartnerConfigModel {
    exists: jest.Mock;
    findOne: jest.Mock;
}

describe('', () => {
    let service: PartnerConfigService;

    const partnerConfigModel = new PartnerConfigModel();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PartnerConfigService,
                {
                    provide: getModelToken(PartnerConfig.name),
                    useValue: partnerConfigModel,
                },
            ],
        }).compile();

        service = module.get<PartnerConfigService>(PartnerConfigService);
    });

    describe('isSuperPlayers', () => {
        it('when playerName is not provided should return false', async () => {
            // arrange
            const playerName = undefined;
            const partnerId = 'partnerId';

            // act
            const actualValue = await service.isSuperPlayers(playerName, partnerId);

            // assert
            expect(actualValue).toBeFalsy();
        });

        it('when partnerId is not provided should return false', async () => {
            // arrange
            const playerName = 'name';
            const partnerId = undefined;

            // act
            const actualValue = await service.isSuperPlayers(playerName, partnerId);

            // assert
            expect(actualValue).toBeFalsy();
        });

        it('when is not super players should return false', async () => {
            // arrange
            const playerName = 'playerName';
            const partnerId = 'partnerId';
            partnerConfigModel.exists = jest.fn().mockReturnValue(false);

            // act
            const actualValue = await service.isSuperPlayers(playerName, partnerId);

            // assert
            expect(actualValue).toBeFalsy();
        });

        it('when is super players should return true', async () => {
            // arrange
            const playerName = 'playerName';
            const partnerId = 'partnerId';
            partnerConfigModel.exists = jest.fn().mockReturnValue(true);

            // act
            const actualValue = await service.isSuperPlayers(playerName, partnerId);

            // assert
            expect(actualValue).toBeTruthy();
        });
    });

    describe('getExclusionSiteTest', () => {
        it('should return empty object when partnerId is not provided', async () => {
            const partnerId = undefined;

            var actualResult = await service.getExclusionSites(partnerId);

            expect(actualResult).toBe(null);
        });

        it('should return configs belong to providing partnerId', async () => {
            const partnerId = 'partnerId'
            partnerConfigModel.findOne = jest.fn().mockReturnValue({
                lean: () => {
                    return { exec: jest.fn() };
                },
            });

            await service.getExclusionSites(partnerId);

            expect(partnerConfigModel.findOne).toHaveBeenCalledWith({type: 'game_site_exclusions', partnerId: partnerId }, 'value');
        });
    });
});
