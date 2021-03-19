export interface BaseResponse {
    timeStamp: string;
    result: BaseResult;
}

export interface BaseResult {
    errorCode: number | string;
    errorMessage: string;
}
