import { UMResult } from './um-result';

export class Result {
    isSuccessful: boolean;
    isUM: boolean;

    constructor(readonly errorCode = '0', readonly message = '', readonly umInfo: UMResult = null) {
        this.isSuccessful = this.errorCode === '0';
        this.isUM = umInfo != null;
    }
}
