import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { CacheModule, CACHE_MANAGER } from '@nestjs/common';

import { closeInMongodConnection, rootMongooseTestModule } from '../../shared/test-utils/mongoose-test-module';
import { UMInfo, UMInfoDocument, UMInfoSchema } from '../schemas';
import { UMService } from '../um.service';
import { UMResult } from './../models';

class MockCacheManager {
    set: jest.Mock;
    get: jest.Mock;
}

describe('UserInfosService test', () => {
    let service: UMService;
    let model: Model<UMInfoDocument>;
    let cacheManager = new MockCacheManager();

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [UMService, { provide: CACHE_MANAGER, useValue: cacheManager }],
            imports: [rootMongooseTestModule(), MongooseModule.forFeature([{ name: UMInfo.name, schema: UMInfoSchema }])],
        }).compile();
        cacheManager.set = jest.fn();

        service = module.get<UMService>(UMService);
        model = module.get<Model<UMInfoDocument>>(`${UMInfo.name}Model`);
    });

    afterAll(async (done) => {
        jest.clearAllMocks();
        await closeInMongodConnection();
        done();
    });

    describe('getSettings test', () => {
        it('should get umInfo', async () => {
            cacheManager.get = jest.fn().mockReturnValue(undefined);
            jest.spyOn(model, 'findOne');

            await service.getUMResult(null);

            expect(model.findOne).toHaveBeenCalled();
        });
    });

    describe('getSCUM', () => {
        it('should filter with correct params', async () => {
            // arrange
            jest.spyOn(model, 'findOne');

            // act
            await service.getSCUM();

            // assert
            expect(model.findOne).toHaveBeenCalledWith(expect.objectContaining({ isPartnerUm: false, finish: false }), expect.any(Object));
        });
    });

    describe('getPartnerUM', () => {
        it('should filter with correct params', async () => {
            // arrange
            jest.spyOn(model, 'findOne');

            // act
            await service.getPartnerUM(null);

            // assert
            expect(model.findOne).toHaveBeenCalledWith(expect.objectContaining({ isPartnerUm: true, finish: false }), expect.any(Object));
        });
    });

    describe('getUMResult', () => {
        it('when scum should return scum', async () => {
            // arrange
            cacheManager.get = jest.fn().mockReturnValue(undefined);
            const expectedValue = new UMResult(true, null);
            jest.spyOn(service, 'getSCUM').mockResolvedValueOnce(expectedValue);

            // act
            const actualValue = await service.getUMResult(null);

            // assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when not provide partnerId should return scum', async () => {
            // arrange
            cacheManager.get = jest.fn().mockReturnValue(undefined);
            const expectedValue = new UMResult(false, null);
            jest.spyOn(service, 'getSCUM').mockResolvedValueOnce(expectedValue);

            // act
            const actualValue = await service.getUMResult(null);

            // assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when not scum and have provided partnerId should return partner um info', async () => {
            // arrange
            cacheManager.get = jest.fn().mockReturnValue(undefined);
            jest.spyOn(service, 'getSCUM').mockResolvedValueOnce(new UMResult(false, null));
            const expectedValue = new UMResult(true, null);
            jest.spyOn(service, 'getPartnerUM').mockResolvedValueOnce(expectedValue);
            const partnerId = 'partnerName';

            // act
            const actualValue = await service.getUMResult(partnerId);

            // assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('should return data from cache manager', async () => {
            // arrange
            const entityCached = new UMResult(true, null);
            cacheManager.get = jest.fn().mockReturnValue(entityCached);
            const partnerId = 'partnerName';

            // act
            const actualValue = await service.getUMResult(partnerId);

            // assert
            expect(actualValue).toStrictEqual(entityCached);
        });
    });
});
