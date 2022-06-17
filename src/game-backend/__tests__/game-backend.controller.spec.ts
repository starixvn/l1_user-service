import { Test } from '@nestjs/testing';
import { UserSessionsService } from '../../users/providers';
import { GameBackendController } from '../game-backend.controller';
import { SignInGameRequest, SignInGameResult } from '../models';
import { VerifySessionResult } from '../../users/models';
import { UserSession } from '../../users/schemas';
import { HttpStatus, HttpException } from '@nestjs/common';
import { GameBackendModule } from '../game-backend.module';

jest.mock('../../users/providers');

describe('GameBackendController test', () => {
    let controller: GameBackendController;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [GameBackendController],
            providers: [UserSessionsService],
        }).compile();

        controller = module.get<GameBackendController>(GameBackendController);
    });

    describe('signInGame test', () => {
        const request = new SignInGameRequest('', '', '');

        describe('when session is authenticated', () => {
            it('should return sign in game result', async () => {
                // Arrange
                const verifyResult = new VerifySessionResult(true, {} as UserSession);
                jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce(verifyResult);
                const expectedValue = new SignInGameResult(verifyResult.session);

                // Act
                const actualResult = await controller.signInGame(request);

                // Assert
                expect(actualResult).toStrictEqual(expectedValue);
            });
        });

        describe('when session is unauthenticated', () => {
            it('should return forbidden error', async () => {
                // Arrange
                const verifyResult = new VerifySessionResult(false, null);
                jest.spyOn(UserSessionsService.prototype, 'verifySession').mockResolvedValueOnce(verifyResult);
                const expectedValue = new HttpException('', HttpStatus.FORBIDDEN);

                // Act
                const actualResult = await controller.signInGame(request);

                // Assert
                expect(actualResult).toStrictEqual(expectedValue);
            });
        });
    });
});

afterEach(() => {
    jest.clearAllMocks();
});
