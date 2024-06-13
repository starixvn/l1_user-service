import { IsArray } from 'class-validator';
import { VerifySessionRequest } from '../../users/models';

export class GetCurrencyGroupGameRequest extends VerifySessionRequest {
    @IsArray()
    readonly gameIds: number[];
}
