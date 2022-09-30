import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

import { AuthConfig } from "../config/auth-config";
import { OpenIdClientHelper } from "../helpers";

@Injectable()
export class MiddleSiteApiClient {
    private readonly defaultRequestTimeout: 2500;
    private readonly instance: AxiosInstance;
    private readonly openIdClient: OpenIdClientHelper;

    constructor(private readonly configService: ConfigService) {
        const authConfigs = this.configService.get<AuthConfig>('middleSite.auth');
        this.openIdClient = new OpenIdClientHelper(authConfigs);

        this.instance = axios.create({
            baseURL: this.configService.get<string>('middleSite.apiUrl'),
            timeout: this.defaultRequestTimeout,
        });
    }

    async IsNicknameExisted(nickname: string) {
        return this.get<boolean>(`/memberData/IsNicknameExisted?nickname=${nickname}`);
    }

    private async get<T>(url: string, data?: any) {
        const requestHeaders = { Authorization: await this.openIdClient.getBearerToken(), 'Content-Type': 'application/json' };

        return (await this.instance.get<T>(url, { headers: requestHeaders, data: data ?? {} })).data;
    }
}
