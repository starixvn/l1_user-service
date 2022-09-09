import { VerifySessionRequest } from '../../users/models';
import { IsString } from 'class-validator';

export class GetAccessURLRequest extends VerifySessionRequest {
    @IsString()
    readonly language: string;

    @IsString()
    readonly gameId: string;
}
