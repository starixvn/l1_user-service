import { BaseResponse, BaseResult } from "./base-respone";

export interface GetBalanceResponse extends BaseResponse {
    result: GetBalanceResult;
}

export interface GetBalanceResult extends BaseResult {
    balance: number;
}
