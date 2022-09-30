import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GameResultService } from '../game-result.service';
import { UserSessionsService } from '../../users/providers';
import { SentryLogger } from '../../common/providers';
import { VerifySessionResult } from '../../users/models';
import { UserSession } from '../../users/schemas';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { GetAccessURLRequest } from '../models/get-access-url-request';

jest.mock('../../common/providers');
jest.mock('../../users/providers');

const axios = { redirectUrl: 'redirectUrl' };

describe('GameResultService', () => {
    let logger: SentryLogger;
    let userSessionsService: UserSessionsService;
    let gameResultService: GameResultService;
    let httpService: HttpService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            providers: [GameResultService, ConfigService, UserSessionsService, SentryLogger],
            imports: [
                HttpModule.register({
                    timeout: 2500,
                }),
            ],
        }).compile();

        logger = module.get<SentryLogger>(SentryLogger);
        userSessionsService = module.get<UserSessionsService>(UserSessionsService);
        gameResultService = await module.resolve(GameResultService);
        httpService = await module.resolve(HttpService);

        jest.spyOn(httpService, 'post').mockImplementationOnce(() =>
            of({
                data: {
                    redirectUrl: axios.redirectUrl,
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
            }),
        );
    });

    describe('getAccessUrl', () => {
        describe('when have error', () => {
            it('should call logger.error', async () => {
                // Arrange
                const request = new GetAccessURLRequest();
                const error = new Error('Error happens!');
                jest.spyOn(userSessionsService, 'verifySession').mockImplementationOnce(() => {
                    throw error;
                });

                // Act
                await gameResultService.getAccessUrl(request);

                // Assert
                expect(logger.error).toHaveBeenCalledWith(error);
            });
        });

        describe('when not have error', () => {
            describe('when not have session', () => {
                it('should return null', async () => {
                    // Arrange
                    const request = new GetAccessURLRequest();
                    jest.spyOn(userSessionsService, 'verifySession').mockResolvedValueOnce(new VerifySessionResult(false, null));

                    // Act
                    const actualValue = await gameResultService.getAccessUrl(request);

                    // Assert
                    expect(actualValue).toBeNull();
                });
            });

            describe('when have session', () => {
                describe('when language is vi-VN', () => {
                    it('should return VN redirect url', async () => {
                        // Arrange
                        const request = new GetAccessURLRequest();
                        const session = new UserSession();

                        jest.spyOn(userSessionsService, 'verifySession').mockResolvedValueOnce(new VerifySessionResult(true, session));
                        axios.redirectUrl = 'vn-url';
                        const expectedValue = { gameResult: { redirectUrl: axios.redirectUrl } };

                        // Act
                        const actualValue = await gameResultService.getAccessUrl(request);

                        // Assert
                        expect(actualValue).toStrictEqual(expectedValue);
                    });
                });

                describe('when language is en-US', () => {
                    it('should return EN redirect url', async () => {
                        // Arrange
                        const request = new GetAccessURLRequest();
                        const session = new UserSession();

                        jest.spyOn(userSessionsService, 'verifySession').mockResolvedValueOnce(new VerifySessionResult(true, session));
                        axios.redirectUrl = 'en-url';
                        const expectedValue = { gameResult: { redirectUrl: axios.redirectUrl } };

                        // Act
                        const actualValue = await gameResultService.getAccessUrl(request);

                        // Assert
                        expect(actualValue).toStrictEqual(expectedValue);
                    });
                });
            });
        });
    });
});
