import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { OpenIdClient } from "src/open-id/open-id.client";
import { VerifyTokenResponse } from "src/ow-api/models/verify-token-response";

import { VerifyTokenRequest } from "./models/verify-token-request";

interface ApiConfig {
    baseURL: string;
    useAuthenticate: boolean;
    requestTimeout: number;
    placeBetTimeout: number;
}

@Injectable()
export class OWApiClient {
    private instance: AxiosInstance;
    private readonly defaultRequestTimeout: 2500;

    constructor(private readonly configService: ConfigService, private readonly openIdClient: OpenIdClient) {
        const apiConfig = this.configService.get<ApiConfig>('api');

        this.instance = axios.create({
            baseURL: apiConfig.baseURL,
            timeout: apiConfig.requestTimeout || this.defaultRequestTimeout,
        });
    }

    async verifyToken(request: VerifyTokenRequest) {
        const requestHeaders = { Authorization: await this.openIdClient.getBearerToken() };

        return (await this.instance.post<VerifyTokenResponse>('/AuthVerification/verify', request, { headers: requestHeaders })).data;
    }
}
