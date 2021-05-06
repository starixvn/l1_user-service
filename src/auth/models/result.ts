import { BaseResult } from "../../ow-api/models";

export class Result {
    isSuccessful: boolean;
    message: string;

    constructor(isSuccessful: boolean, message: string) {
        this.isSuccessful = isSuccessful;
        this.message = message;
    }
}

export class SuccessResult extends Result {
    constructor() {
        super(true, null);
    }
}

export class FailedResult extends Result {
    constructor(message: string) {
        super(false, message);
    }
}

export class ExpiredSessionResult {
    isSessionExpired = true;
}

export class AuthorizeResult {
    authorized: boolean;
    user: any;

    constructor(authorized: boolean, user: any = null) {
        this.authorized = authorized;
        this.user = user;
    }
}

export class AuthenticateResult {
    isAuthenticated: boolean;
    username: string;
    language: string;
    ss: string;
    system: number;

    constructor(isAuthenticated: boolean, username = null, language = null, ss = null, system = 0) {
        this.isAuthenticated = isAuthenticated;
        this.username = username;
        this.language = language;
        this.ss = ss;
        this.system = system;
    }
}

export class ReCheckInResult extends Result {
    balance: number;
    isDisableAccount: boolean;
    apiError: BaseResult;

    constructor(isSuccessful: boolean, balance = 0, isDisableAccount = false, apiError = null, message = '') {
        super(isSuccessful, message);
        this.balance = balance;
        this.isDisableAccount = isDisableAccount;
        this.apiError = apiError;
    }
}

export class CreateCharacterNameResult extends Result {
    user: any;

    constructor(isSuccessful: boolean, message = '', user: any = null) {
        super(isSuccessful, message);

        this.user = user;
    }
}
