import { Issuer, TokenSet } from "openid-client";

import { AuthConfig } from "../config/auth-config";

export class OpenIdClientHelper {
    private readonly authConfig: AuthConfig;
    private readonly beforeTokenExpired = 60 * 5;
    private tokenSet: TokenSet;

    constructor(authConfig: AuthConfig) {
        this.authConfig = authConfig;
    }

    async getBearerToken() {
        if (!this.tokenSet || this.isTokenExpired(this.tokenSet)) {
            const metadata = {
                grant_type: 'client_credentials',
                client_id: this.authConfig.clientId,
                client_secret: this.authConfig.clientSecret,
            };
            const issuer = await Issuer.discover(this.authConfig.uri);
            const client = new issuer.Client(metadata);
            this.tokenSet = await client.grant(metadata);
        }

        return `${this.tokenSet.token_type} ${this.tokenSet.access_token}`;
    }

    private isTokenExpired(token: TokenSet) {
        return !token.expires_at || token.expires_at - Date.now() / 1000 - this.beforeTokenExpired <= 0;
    }
}
