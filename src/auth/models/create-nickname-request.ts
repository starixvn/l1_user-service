import { IsString, IsInt } from 'class-validator';
import { VerifySessionRequest } from '../../users/models';

export class CreateNicknameRequest extends VerifySessionRequest {
    @IsString()
    readonly nickname: string;

    @IsInt()
    readonly avatar: number;
}
