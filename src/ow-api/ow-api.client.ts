import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Severity } from "@sentry/node";
import axios, { AxiosInstance } from "axios";
import { OpenIdClient, SentryLogger } from "src/common/providers";
import { VerifyTokenResponse } from "src/ow-api/models/verify-token-response";

import { BaseResponse, GetBalanceRequest, GetBalanceResponse, NotifyLoginRequest, NotifyLoginResponse } from "./models";
import { BaseResult } from "./models/base-respone";
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
    private readonly warningErrorCodes = [3003, 3004, 3006, 3007, 3008, 3009, 3014, 2002, 2005, 3010, 3013, 3002];
    private readonly errors = {
        placeBetFailed: {
            errorCode: 'SB1900',
            errorMessage: 'Đặt cược không thành công.',
        },
        endGameFailed: {
            errorCode: 'SB1901',
            errorMessage: 'Phiên chơi bị lỗi. Vui lòng liên hệ bộ phận CSKH để được hỗ trợ.',
        },
        getBalanceFailed: {
            errorCode: 'SB1902',
            errorMessage: 'Không thể cập nhật số tiền trong tài khoản.',
        },
        enterPortalFailed: {
            errorCode: `SB1903`,
            errorMessage: 'Đã xảy ra lỗi. Vui lòng liên hệ bộ phận CSKH để đươc hỗ trợ.',
            minBet: 0,
            maxBet: 0,
        },
        accountClosed: {
            errorCode: '2002',
            errorMessage: 'Tài khoản của bạn đã bị khoá.',
        },
    };

    constructor(
        private readonly configService: ConfigService,
        private readonly openIdClient: OpenIdClient,
        private readonly logger: SentryLogger,
    ) {
        const apiConfig = this.configService.get<ApiConfig>('api');

        this.instance = axios.create({
            baseURL: apiConfig.baseURL,
            timeout: apiConfig.requestTimeout || this.defaultRequestTimeout,
        });
    }

    async verifyToken(request: VerifyTokenRequest) {
        try {
            return await this.sendPostRequest<VerifyTokenResponse>('/AuthVerification/verify', request);
        } catch (error) {
            this.logger.error(error);
            return null;
        }
    }

    async notifyLogin(request: NotifyLoginRequest, beforeMessage: string) {
        try {
            const response = await this.sendPostRequest<NotifyLoginResponse>('/Member/EnterPortal', request);

            if (this.isErrorResult(response.result)) {
                this.logAfterSendToApi('Notify Login', request, response, beforeMessage, this.getLogLevel(response));
            }

            return response.result;
        } catch (error) {
            this.logAfterSendToApi('Error Notify Login', request, error, beforeMessage, Severity.Error);
            this.logger.error(error);

            return this.errors.enterPortalFailed;
        }
    }

    async getBalance(request: GetBalanceRequest, beforeMessage: string) {
        try {
            const response = await this.sendPostRequest<GetBalanceResponse>('/Member/Balance', request);

            if (this.isErrorResult(response.result)) {
                this.logAfterSendToApi('Get Balance', request, response, beforeMessage, this.getLogLevel(response));
            }

            return response.result;
        } catch (error) {
            this.logAfterSendToApi('Error Get Balance', request, error, beforeMessage, Severity.Error);
            this.logger.error(error);

            return { ...this.errors.getBalanceFailed, balance: 0 };
        }
    }

    isDisabledAccountResult(result: BaseResult) {
        return result.errorCode == 2002;
    }

    isErrorResult(result: BaseResult) {
        return (result?.errorCode ?? 0) !== 0;
    }

    private async sendPostRequest<T>(url: string, data?: any) {
        const requestHeaders = { Authorization: await this.openIdClient.getBearerToken() };

        return (await this.instance.post<T>(url, data, { headers: requestHeaders })).data;
    }

    private logAfterSendToApi(action: string, params, result: BaseResponse, beforeMessage: string, logLevel: Severity) {
        const messages = [
            `Account ${params.SiteId}_${params.ObCustId} performs ${action} at ${new Date()}`,
            '',
            beforeMessage,
            `\nAction Result: ${JSON.stringify(result)}`,
        ];

        const joinedMessages = messages.join('\n');
        this.logger.log(joinedMessages, logLevel);
    }

    private getLogLevel(response: BaseResponse) {
        if (this.isErrorResult(response.result)) {
            return this.warningErrorCodes.includes(response.result.errorCode) ? Severity.Warning : Severity.Error;
        }

        return Severity.Info;
    }
}
