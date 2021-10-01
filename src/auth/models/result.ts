import { UMInfo } from '../../settings/schemas';
import { Result } from '../../shared/models/result';

export class AuthorizeResult {
    readonly isUM: boolean;
    constructor(readonly authorized: boolean, readonly user: any = null, readonly umInfo: UMInfo = null) {
        this.isUM = umInfo !== null;
    }
}

export class AuthenticateResult {
    readonly isUM: boolean;
    constructor(
        readonly isAuthenticated: boolean,
        readonly umInfo: UMInfo = null,
        readonly username: string = null,
        readonly language: string = null,
        readonly ss: string = null,
        readonly system: number = 0,
        readonly memberName: string = null,
    ) {
        this.isUM = umInfo !== null;
    }
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
