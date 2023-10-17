import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Severity } from '@sentry/node';
import axios, { AxiosInstance } from 'axios';

import { SentryLogger } from '../common/providers';
import { AuthConfig } from '../config/auth-config';
import { OpenIdClientHelper } from '../helpers';
import { VerifyTokenResponse } from '../ow-api/models/verify-token-response';
import {
    BaseResponse,
    GetBalanceRequest,
    GetBalanceResponse,
    NotifyLoginRequest,
    NotifyLoginResponse,
    SingleSignOnResponse,
    UpdateMemberAuthRequest,
} from './models';
import { BaseResult } from './models/base-respone';
import { VerifyTokenRequest } from './models/verify-token-request';

interface ApiConfig {
    baseURL: string;
    useAuthenticate: boolean;
    requestTimeout: number;
    placeBetTimeout: number;
}

class Errors {
    public static enterPortalFailed: BaseResult = {
        errorCode: `SB1903`,
        errorMessage: 'Đã xảy ra lỗi. Vui lòng liên hệ bộ phận CSKH để đươc hỗ trợ.',
    };

    public static getBalanceFailed: BaseResult = {
        errorCode: `SB1902`,
        errorMessage: 'Không thể cập nhật số tiền trong tài khoản.',
    };

    public static accountClosed: BaseResult = {
        errorCode: '2002',
        errorMessage: 'Tài khoản đã bị đóng. Phiên đăng nhập sẽ hết hạn sau 10 giây. Vui lòng liên hệ với cấp trên để biết thêm chi tiết.',
    };
}

@Injectable()
export class OWApiClient {
    private readonly instance: AxiosInstance;
    private readonly defaultRequestTimeout: 2500;
    private readonly warningErrorCodes = [3003, 3004, 3006, 3007, 3008, 3009, 3014, 2002, 2005, 3010, 3013, 3002, 1001, 1002];
    private readonly openIdClient: OpenIdClientHelper;

    constructor(private readonly configService: ConfigService, private readonly logger: SentryLogger) {
        const authConfig = this.configService.get<AuthConfig>('auth');
        this.openIdClient = new OpenIdClientHelper(authConfig);

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
            const response = await this.sendPostRequest<NotifyLoginResponse>('/Player/EnterPortal', request);

            if (this.isErrorResult(response.result)) {
                this.logAfterSendToApi('Notify Login', request, response, beforeMessage, this.getLogLevel(response));
            }

            return response.result;
        } catch (error) {
            this.logAfterSendToApi('Error Notify Login', request, error, beforeMessage, Severity.Error);
            this.logger.error(error);

            return { ...Errors.enterPortalFailed, minBet: 0, maxBet: 0 };
        }
    }

    async getBalance(request: GetBalanceRequest, beforeMessage: string) {
        try {
            const response = await this.sendPostRequest<GetBalanceResponse>('/Player/Balance', request);

            if (this.isErrorResult(response.result)) {
                this.logAfterSendToApi('Get Balance', request, response, beforeMessage, this.getLogLevel(response));

                if (this.isDisabledAccountResult(response.result)) {
                    return { ...Errors.accountClosed, balance: 0 };
                }
            }

            return response.result;
        } catch (error) {
            this.logAfterSendToApi('Error Get Balance', request, error, beforeMessage, Severity.Error);
            this.logger.error(error);

            return { ...Errors.getBalanceFailed, balance: 0 };
        }
    }

    isDisabledAccountResult(result: BaseResult) {
        return result.errorCode === Errors.accountClosed.errorCode;
    }

    isErrorResult(result: BaseResult) {
        return (result?.errorCode ?? 0) !== 0;
    }

    public async updateMemberAuth(request: UpdateMemberAuthRequest) {
        try {
            return await this.sendPostRequest<SingleSignOnResponse>('/AuthVerification/UpdateMemberAuth', request);
        } catch (error) {
            this.logger.error(error);

            return null;
        }
    }

    private async sendPostRequest<T>(url: string, data?: any) {
        const requestHeaders = { Authorization: await this.openIdClient.getBearerToken() };

        return (await this.instance.post<T>(url, data, { headers: requestHeaders })).data;
    }

    private logAfterSendToApi(action: string, params, result: BaseResponse, beforeMessage: string, logLevel: Severity) {
        const messages = [
            `Account ${params.SiteId}_${params.PlayerId} performs ${action} at ${new Date()}`,
            '',
            beforeMessage,
            `\nAction Result: ${JSON.stringify(result)}`,
        ];

        const joinedMessages = messages.join('\n');
        this.logger.log(joinedMessages, logLevel);
    }

    private getLogLevel(response: BaseResponse): Severity {
        if (this.isErrorResult(response.result)) {
            return this.warningErrorCodes.includes(+response.result.errorCode) ? Severity.Warning : Severity.Error;
        }

        return Severity.Info;
    }
}
