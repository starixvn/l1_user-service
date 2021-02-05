import { UserInfo } from "src/users";

export class Result {
    isSuccessful: boolean;
    message: string;

    constructor(isSuccessful, message) {
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
    isSessionExpired: boolean = false;
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

export class ReCheckInResult {
    isSuccessful: boolean;
    balance: number;
    isDisableAccount: boolean;
    message: string;

    constructor(isSuccessful: boolean, balance = 0, isDisableAccount = false, message = '') {
        this.isSuccessful = isSuccessful;
        this.balance = balance;
        this.isDisableAccount = isDisableAccount;
        this.message = message;
    }
}
