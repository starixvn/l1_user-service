export class BaseResponse {
    timeStamp: string;
    result: BaseResult;
}

export class BaseResult {
    errorCode: number;
    errorMessage: string;
}
