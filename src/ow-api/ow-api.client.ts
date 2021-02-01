import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { OpenIdClient } from "src/open-id/open-id.client";
import { VerifyTokenResponse } from "src/ow-api/models/verify-token-response";

import { GetBalanceRequest } from "./models";
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
        return await this.sendPostRequest<VerifyTokenResponse>('/AuthVerification/verify', request);
    }

    async getBalance(request: GetBalanceRequest) {
        return await this.sendPostRequest('/Member/Balance', request);
    }

    private async sendPostRequest<T>(url: string, data?: any) {
        const requestHeaders = { Authorization: await this.openIdClient.getBearerToken() };

        return (await this.instance.post<T>(url, data, { headers: requestHeaders })).data;
    }
}
