import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import * as jwksClient from 'jwks-rsa';
import { SentryLogger } from '../common/providers';

@Injectable()
export class BackendAuthenticateMiddleware implements NestMiddleware {
    @Inject(ConfigService) private readonly config: ConfigService;
    @Inject(SentryLogger) private readonly logger: SentryLogger;
    @Inject(JwtService) private readonly jwtService: JwtService;

    private readonly tokenType = 'Bearer';
    private readonly UnauthorizedCode = 401;

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            const token = this.getBearerToken(req);
            if (token == null) {
                this.sendError(res, this.UnauthorizedCode);
                return;
            }

            const publicKey = await this.getPublicKey(token);
            const isValid = await this.verifyToken(token, publicKey);

            if (isValid) {
                next();
            } else {
                this.sendError(res, this.UnauthorizedCode);
            }
        } catch (ex) {
            this.logger.error(ex);
            this.sendError(res, this.UnauthorizedCode);
        }
    }

    getBearerToken(req: Request): string {
        const authorization = req.headers.authorization;
        if (!authorization) {
            return null;
        }

        const parts = authorization.split(' ');
        if (parts[0] === this.tokenType) {
            return parts[1];
        }

        return null;
    }

    async verifyToken(token: string, publicKey: string): Promise<any> {
        const verifyOptions: JwtVerifyOptions = {
            ignoreNotBefore: true,
            audience: this.config.get('auth.audiences'),
            publicKey,
            issuer: this.config.get("auth.validIssuers"),
        };

        return this.jwtService.verifyAsync(token, verifyOptions);
    }

    async getPublicKey(token: string): Promise<string> {
        const authUrl = this.config.get('auth.uri');
        const jwks = '.well-known/openid-configuration/jwks';
        const jwksUri = new URL(jwks, authUrl).href;
        const client = jwksClient({ jwksUri });
        const decodedToken = this.jwtService.decode(token, { complete: true }) as any;

        const key = await client.getSigningKeyAsync(decodedToken.header.kid);

        return key.getPublicKey();
    }

    sendError(res: Response, code: number): void {
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errorCode: code }));
    }
}
