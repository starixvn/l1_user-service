import { IsString } from 'class-validator';
import { VerifySessionRequest } from '../../users/models/verify-session-request';

export class TrackingRequest extends VerifySessionRequest {
    @IsString()
    readonly ip: string;

    @IsString()
    readonly browserUserAgent: string;

    @IsString()
    readonly visitorId: string;
}
