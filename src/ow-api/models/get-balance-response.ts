import { BaseResponse, BaseResult } from "./base-respone";

export class GetBalanceResponse extends BaseResponse {
    result: GetBalanceResult;
}

export class GetBalanceResult extends BaseResult {
    balance: number;
}
