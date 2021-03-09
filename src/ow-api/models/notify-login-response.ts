import { BaseResponse, BaseResult } from "./base-respone";

export class NotifyLoginResponse extends BaseResponse {
    result: NotifyLoginResult;
}

export class NotifyLoginResult extends BaseResult {
    minBet: number;
    maxBet: number;
}
