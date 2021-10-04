import { UMInfo } from '../../../src/settings/schemas';

export class Result {
    isSuccessful: boolean;
    isUM: boolean;

    constructor(readonly errorCode = '0', readonly message = '', readonly umInfo: UMInfo = null) {
        this.isSuccessful = this.errorCode === '0';
        this.isUM = umInfo != null;
    }
}
