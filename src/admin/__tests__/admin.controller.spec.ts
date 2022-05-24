import { Test } from '@nestjs/testing';
import { when } from 'jest-when';
import { AdminService } from '../admin.service';
import { AdminController } from '../admin.controller';
import { UserSessionsService } from '../../users/providers';
import { SentryLogger } from '../../common/providers';

jest.mock('../admin.service');
jest.mock('../../common/providers');
jest.mock('../../users/providers');

describe('AdminController', () => {
    let service: AdminService;
    let controller: AdminController;
    let userSessionsService: UserSessionsService;
    let logger: SentryLogger;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [],
            controllers: [AdminController],
            providers: [AdminService, SentryLogger, UserSessionsService],
        }).compile();

        service = module.get<AdminService>(AdminService);
        controller = module.get<AdminController>(AdminController);
        userSessionsService = module.get<UserSessionsService>(UserSessionsService);
        logger = module.get<SentryLogger>(SentryLogger);
    });

    describe('jwt', () => {
        it('should return token get from service', async () => {
            // Arrange
            const token = { token: 'token-string' };
            const userAgent = 'userAgent';
            const body = { Username: 'Username', UserAgent: userAgent };
            when(service.getToken).calledWith({ userAgent, username: 'Username' }).mockReturnValue(token);

            // Act
            const actualValue = await controller.jwt(body);

            // Assert
            expect(actualValue).toBe(token);
        });
    });

    describe('getOnlineUsers', () => {
        describe('when have error', () => {
            let error;
            let actualValue;
            beforeEach(async () => {
                // Arrange
                error = new Error('Error');
                jest.spyOn(userSessionsService, 'getOnlineUsers').mockImplementationOnce(() => {
                    throw error;
                });

                // Act
                actualValue = await controller.getOnlineUsers();
            });

            it('should call logger.error', () => {
                // Assert
                expect(logger.error).toHaveBeenCalledWith(error);
            });

            it('should return error=true', () => {
                // Assert
                expect(actualValue).toStrictEqual({ error: true });
            });
        });

        describe('when not have error', () => {
            it('should return online users', async () => {
                // Arrange
                const expectedValue = {
                    totalRealPlayer: 1,
                    realUsers: [{ id: 1 }],
                    totalTestPlayer: 0,
                    testUsers: [],
                };
                jest.spyOn(userSessionsService, 'getOnlineUsers').mockResolvedValueOnce(expectedValue);

                // Act
                const actualValue = await controller.getOnlineUsers();

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });
});
