export class ValidateSignNameResult {
    isValid: boolean;
    notice: string;

    constructor(isValid: boolean = true, notice: string = '') {
        this.isValid = isValid;
        this.notice = notice;
    }
}
