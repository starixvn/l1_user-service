import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { when } from 'jest-when';
import { AdminService } from '../admin.service';
import { SentryLogger } from '../../common/providers';
import { generate as generateString } from 'randomstring';
import { JwtModule, JwtService } from '@nestjs/jwt';

jest.mock('../../common/providers');

describe('AdminService', () => {
    let logger: SentryLogger;
    let service: AdminService;
    let config: ConfigService;
    let jwtService: JwtService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            providers: [AdminService, ConfigService, SentryLogger],
            imports: [JwtModule.register({})],
        }).compile();

        logger = module.get<SentryLogger>(SentryLogger);
        service = await module.resolve(AdminService);
        config = module.get<ConfigService>(ConfigService);
        jwtService = module.get<JwtService>(JwtService);
    });

    describe('getToken', () => {
        describe('when have error', () => {
            let error;
            let actualValue;

            beforeEach(async () => {
                // Arrange
                error = new Error('Error');
                jest.spyOn(jwtService, 'signAsync').mockImplementationOnce(async () => {
                    throw error;
                });

                const requestData = { username: 'username', userAgent: 'userAgent' };

                // Act
                actualValue = await service.getToken(requestData);
            });

            it('should call logger.error', () => {
                // Assert
                expect(logger.error).toHaveBeenCalledWith(error);
            });

            it('should return internal server error', () => {
                // Arrange
                const expectedValue = { errorCode: 500, errorMessage: error };

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe('when not have error', () => {
            it('should return token from jwtService.signAsync', async () => {
                // Arrange
                const adminSecretKey = generateString();
                const token = generateString();
                const requestData = { username: 'username', userAgent: 'userAgent' };
                jest.spyOn(config, 'get').mockReturnValueOnce(adminSecretKey);

                jest.spyOn(jwtService, 'signAsync');
                when(jwtService.signAsync)
                    .calledWith(expect.objectContaining(requestData), expect.objectContaining({ expiresIn: 60, secret: adminSecretKey }))
                    .mockReturnValue(token);
                const expectedValue = { token };

                // Act
                const actualValue = await service.getToken(requestData);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });
});
