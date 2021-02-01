export class BaseResponse {
    timeStamp: string;
    result: BaseResult;
}

export class BaseResult {
    seq: string;
    errorCode: number;
    errorMessage: string;
    errorDescription: string;
}
