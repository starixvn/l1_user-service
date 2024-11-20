import { Result } from '../../shared/models/result';
import { UMResult } from '../../shared/models/um-result';

export class AuthorizeResult {
    readonly isUM: boolean;
    constructor(readonly authorized: boolean, readonly user: any = null, readonly umInfo: UMResult = null) {
        this.isUM = umInfo !== null;
    }
}

export class AuthenticateResult {
    readonly isUM: boolean;
    constructor(
        readonly isAuthenticated: boolean,
        readonly umInfo: UMResult = null,
        readonly username: string = null,
        readonly language: string = null,
        readonly ss: string = null,
        readonly system: number = 0,
        readonly memberName: string = null,
        readonly rate: number = 1,
        readonly offerGames: any = null,
        readonly fractionalOddsFormat: boolean = null,
    ) {
        this.isUM = umInfo !== null;
    }
}

export class GetBalanceResult extends Result {
    constructor(
        readonly errorCode: string,
        readonly message: string,
        readonly balance = 0,
        readonly scoins = 0,
        readonly availableSpins = 0,
    ) {
        super(errorCode, message);
    }
}

export class ReCheckInResponse extends GetBalanceResult {
    isDisableAccount: boolean;

    constructor(readonly balance = 0, readonly apiError: Result = null, readonly availSpins = 0, readonly scoins = 0) {
        super('0', '', balance);

        this.isDisableAccount = apiError && apiError.errorCode === '2002';
    }
}

export class GetSettingGamesResult {
    readonly isUM: boolean;
    constructor(readonly isAuthenticated: boolean, readonly settingGames: any = null, readonly umInfo: UMResult = null) {
        this.isUM = umInfo !== null;
    }
}
