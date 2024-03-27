import { IsInt } from 'class-validator';
import { VerifySessionRequest } from './verify-session-request';

export class UpdateAvatarRequest extends VerifySessionRequest {
    @IsInt()
    readonly avatarId: number;
}
