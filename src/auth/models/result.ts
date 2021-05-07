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
    isDisableAccount: boolean;

    constructor(readonly errorCode: string, readonly message: string, readonly balance = 0) {
        super(errorCode, message);
        this.isDisableAccount = this.errorCode === '2002';
    }
}
