import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { UpdateMemberAuthRequest, SingleSignOnResponse } from './models';
import { PartnerService } from '../partner/partner.service';
import { SentryLogger } from '../common/providers';

interface ApiConfig {
    baseURL: string;
    requestTimeout: number;
}
@Injectable()
export class SGApiClient {
    private readonly instance: AxiosInstance;
    private readonly defaultRequestTimeout: 2500;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: SentryLogger,
        private readonly partnerService: PartnerService,
    ) {
        const sgApiConfig = this.configService.get<ApiConfig>('sgApi');
        this.instance = axios.create({
            baseURL: sgApiConfig.baseURL,
            timeout: sgApiConfig.requestTimeout || this.defaultRequestTimeout,
        });
    }

    public async updateMemberAuth(request: UpdateMemberAuthRequest) {
        try {
            const operator = await this.partnerService.getPartner(request.OperatorId);
            return await this.sendPostRequest<SingleSignOnResponse>('/MemberAuth/Update', operator.secretKey, request);
        } catch (error) {
            this.logger.error(error);
            return null;
        }
    }

    private async sendPostRequest<T>(url: string, secretKey: string, data?: any) {
        const stringData = JSON.stringify(data);
        const hmac = createHmac('sha256', secretKey);
        const hashResult = hmac.update(stringData).digest();
        const accessKey = hashResult.toString('base64');
        const requestHeaders = { 'Access-Key': accessKey };

        return (await this.instance.post<T>(url, data, { headers: requestHeaders })).data;
    }
}
