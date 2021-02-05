import { UserInfo } from "src/users";

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
    isSessionExpired: boolean = true;
}

export class AuthorizeResult {
    authorized: boolean;
    user: UserInfo;

    constructor(authorized: boolean, user: UserInfo) {
        this.authorized = authorized;
        this.user = user;
    }
}

export class AuthenticateResult {
    isAuthenticated: boolean;
    username: string;
    language: string;
    ss: string;

    constructor(isAuthenticated: boolean, username = null, language = null, ss = null) {
        this.isAuthenticated = isAuthenticated;
        this.username = username;
        this.language = language;
        this.ss = ss;
    }
}

export class ReCheckInResult extends Result {
    balance: number;
    isDisableAccount: boolean;

    constructor(isSuccessful: boolean, balance = 0, isDisableAccount = false, message = '') {
        super(isSuccessful, message);
        this.balance = balance;
        this.isDisableAccount = isDisableAccount;
    }
}
