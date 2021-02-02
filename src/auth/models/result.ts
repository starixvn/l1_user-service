import { UserInfo } from "src/users/schemas/user-info.schema";

export class Result {
    isOK: boolean;
    message: string;

    constructor(isOk = true, message = '') {
        this.isOK = isOk;
        this.message = message;
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

export class UnAuthorizeResult extends AuthorizeResult {
    constructor() {
        super(false, null);
    }
}
