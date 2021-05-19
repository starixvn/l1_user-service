export class Result {
    isSuccessful: boolean;

    constructor(readonly errorCode = '0', readonly message = '') {
        this.isSuccessful = this.errorCode === '0';
    }
}

export class AuthorizeResult {
    constructor(readonly authorized: boolean, readonly user: any = null) {}
}

export class AuthenticateResult {
    constructor(
        readonly isAuthenticated: boolean,
        readonly username: string = null,
        readonly language: string = null,
        readonly ss: string = null,
        readonly system: number = 0,
    ) {}
}

export class GetBalanceResult extends Result {
    constructor(readonly errorCode: string, readonly message: string, readonly balance = 0) {
        super(errorCode, message);
    }
}

export class ReCheckInResponse extends GetBalanceResult {
    isDisableAccount: boolean;

    constructor(readonly balance = 0, readonly apiError: Result = null) {
        super('0', '', balance);

        this.isDisableAccount = apiError && apiError.errorCode === '2002';
    }
}
