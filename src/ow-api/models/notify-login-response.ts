import { BaseResponse, BaseResult } from "./base-respone";

export interface NotifyLoginResponse extends BaseResponse {
    result: NotifyLoginResult;
}

export interface NotifyLoginResult extends BaseResult {
    minBet: number;
    maxBet: number;
}
