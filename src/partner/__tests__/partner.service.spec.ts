import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { PartnerService } from '../partner.service';
import { Partner } from '../schemas/partner.schema';

class PartnerModel {
    findOne: jest.Mock;
}

describe('Partner Service', () => {
    let service: PartnerService;

    const partnerModel = new PartnerModel();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PartnerService,
                {
                    provide: getModelToken(Partner.name),
                    useValue: partnerModel,
                },
            ],
        }).compile();

        service = module.get<PartnerService>(PartnerService);
    });

    describe('constructor', () => {
        it('service instance should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('getPartner', () => {
        it('should return data from model', async () => {
            const entity = new Partner();
            partnerModel.findOne = jest.fn().mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return entity;
                        },
                    };
                },
            } as any);

            const actual = await service.getPartner('partnerId');

            expect(actual).toStrictEqual(entity);
        });
    });

    describe('isDisplayPlayerCurrency', () => {
        it('should return isDisplayPlayerCurrency from model', async () => {
            const entity = new Partner();
            entity.isDisplayPlayerCurrency = true;
            partnerModel.findOne = jest.fn().mockReturnValue({
                lean: function (): any {
                    return {
                        exec: async function () {
                            return entity;
                        },
                    };
                },
            } as any);

            const actual = await service.isDisplayPlayerCurrency('partnerId');

            expect(actual).toBe(true);
        });
    });
});
