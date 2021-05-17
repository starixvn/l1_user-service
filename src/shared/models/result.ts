export class Result {
    isSuccessful: boolean;

    constructor(readonly errorCode = '0', readonly message = '') {
        this.isSuccessful = this.errorCode === '0';
    }
}
