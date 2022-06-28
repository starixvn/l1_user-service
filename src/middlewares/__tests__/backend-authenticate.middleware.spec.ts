import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SentryLogger } from '../../common/providers';
import { BackendAuthenticateMiddleware } from '../backend-authenticate.middleware';
import { generate as generateString } from 'randomstring';
import { Request, Response } from 'express';
import { when } from 'jest-when';
import { JwtModule, JwtService } from '@nestjs/jwt';

jest.mock('../../common/providers');

const jwksRsa = {
    getSigningKeyAsync: jest.fn(),
};

jest.mock('jwks-rsa', () => {
    return () => {
        return {
            getSigningKeyAsync: async (token) => {
                return jwksRsa.getSigningKeyAsync(token);
            },
        };
    };
});

describe('AuthenticateMiddleware', () => {
    const UnauthorizedCode = 401;
    let logger: SentryLogger;
    let service: BackendAuthenticateMiddleware;
    let config: ConfigService;
    let jwtService: JwtService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            providers: [BackendAuthenticateMiddleware, ConfigService, SentryLogger],
            imports: [JwtModule.register({})],
        }).compile();

        logger = module.get<SentryLogger>(SentryLogger);
        service = await module.resolve(BackendAuthenticateMiddleware);
        config = module.get<ConfigService>(ConfigService);
        jwtService = module.get<JwtService>(JwtService);
    });

    describe('use', () => {
        describe('when error', () => {
            const res = {} as Response;
            const error = new Error();

            beforeEach(async () => {
                // Arrange
                const req = { headers: { authorization: 'Bearer token' } } as Request;
                const next = jest.fn();
                service.sendError = jest.fn();

                jest.spyOn(service, 'getPublicKey').mockImplementationOnce(async () => {
                    throw error;
                });

                // Act
                await service.use(req, res, next);
            });

            it('should call logger.error', () => {
                // Assert
                expect(logger.error).toHaveBeenCalledWith(error);
            });

            it('should call sendError', () => {
                // Assert
                expect(service.sendError).toHaveBeenCalledWith(res, UnauthorizedCode);
            });
        });

        describe('when Bearer Token is null', () => {
            it('should call sendError', async () => {
                // Arrange
                const req = { headers: {} } as Request;
                const res = {} as Response;
                const next = jest.fn();
                service.sendError = jest.fn();

                // Act
                await service.use(req, res, next);

                // Assert
                expect(service.sendError).toHaveBeenCalledWith(res, UnauthorizedCode);
            });
        });

        describe('when Bearer Token is not null', () => {
            describe('when verifyToken failed', () => {
                it('should sendError', async () => {
                    // Arrange
                    const token = generateString();
                    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
                    const res = {} as Response;
                    const next = jest.fn();
                    service.sendError = jest.fn();
                    jest.spyOn(service, 'getPublicKey');
                    jest.spyOn(service, 'verifyToken').mockResolvedValueOnce(false);

                    // Act
                    await service.use(req, res, next);

                    // Assert
                    expect(service.sendError).toHaveBeenCalledWith(res, UnauthorizedCode);
                });
            });
        });
    });

    describe('getBearerToken', () => {
        describe('when not have authorization', () => {
            it('should return null', () => {
                // Arrange
                const req = { headers: {} } as Request;

                // Act
                const actualValue = service.getBearerToken(req);

                // Assert
                expect(actualValue).toBeNull();
            });
        });
        describe('when have authorization', () => {
            describe('when token is not Bearer', () => {
                it('should return null', () => {
                    // Arrange
                    const req = { headers: { authorization: 'type token' } } as Request;

                    // Act
                    const actualValue = service.getBearerToken(req);

                    // Assert
                    expect(actualValue).toBeNull();
                });
            });

            describe('when token is Bearer', () => {
                it('should return token', () => {
                    // Arrange
                    const req = { headers: { authorization: 'Bearer token' } } as Request;
                    const expectedValue = 'token';

                    // Act
                    const actualValue = service.getBearerToken(req);

                    // Assert
                    expect(actualValue).toStrictEqual(expectedValue);
                });
            });
        });
    });

    describe('sendError', () => {
        let res;
        let code;

        beforeEach(() => {
            // Arrange
            res = { writeHead: jest.fn(), end: jest.fn() };
            code = 1;

            // Act
            service.sendError(res, code);
        });

        it('should call res.writeHead', () => {
            // Assert
            expect(res.writeHead).toHaveBeenCalledWith(code, { 'Content-Type': 'application/json' });
        });

        it('should call res.end', () => {
            // Assert
            expect(res.end).toHaveBeenCalledWith('{"errorCode":1}');
        });
    });

    describe('verifyToken', () => {
        describe('when verify result is null', () => {
            it('should return false', async () => {
                // Arrange
                const token = generateString();
                const publicKey = generateString();
                const verifyResult = null;
                jest.spyOn(jwtService, 'verifyAsync').mockResolvedValueOnce(verifyResult);

                // Act
                const actualValue = await service.verifyToken(token, publicKey);

                // Assert
                expect(actualValue).toStrictEqual(verifyResult);
            });
        });

        describe('when verify result is not null', () => {
            it('should return true', async () => {
                // Arrange
                const token = generateString();
                const publicKey = generateString();
                const verifyResult = { success: true };
                jest.spyOn(jwtService, 'verifyAsync').mockResolvedValueOnce(verifyResult);

                // Act
                const actualValue = await service.verifyToken(token, publicKey);

                // Assert
                expect(actualValue).toStrictEqual(verifyResult);
            });
        });
    });

    describe('getPublicKey', () => {
        it('should return publicKey', async () => {
            // Arrange
            const header = { kid: generateString() };
            const key = generateString();
            const token = generateString();

            jest.spyOn(config, 'get');
            when(config.get).calledWith('auth.uri').mockReturnValue('http://domain.com');

            jest.spyOn(jwtService, 'decode').mockReturnValueOnce({ header });
            jwksRsa.getSigningKeyAsync.mockResolvedValueOnce({ getPublicKey: () => key });

            //Act
            const actualValue = await service.getPublicKey(token);

            //Assert
            expect(actualValue).toStrictEqual(key);
        });
    });
});
