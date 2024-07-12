export class CreateUserSessionParam {
    readonly ssoToken: string;
    readonly sessionId: string;
    readonly owSeq: string;
    readonly username: string;
    readonly memberId: string;
    readonly ssoTime: Date;
    readonly recheckInTime: Date;
    readonly ip: string;
    readonly browserUserAgent: string;
    readonly siteId: string;
    readonly userId: string;
    readonly language: string;
    readonly currencyCode: string;
    readonly currencyName: string;
    readonly currencyGroupId: string;
    readonly isTestCurrency: boolean;
    readonly multiplier: number;
    readonly partnerId: string;
    readonly memberName: string;
    readonly siteName: string;
    readonly system: number;

    readonly operatorId: string;
    readonly playerId: string;
    readonly playerName: string;
    readonly disableJackpotGames: boolean;
    readonly operatorToken: string;
    readonly disableAward: boolean;

    constructor({
        ssoToken,
        sessionId,
        owSeq,
        username,
        memberId,
        ssoTime,
        recheckInTime,
        ip,
        browserUserAgent,
        siteId,
        userId,
        language,
        currencyCode,
        currencyName,
        currencyGroupId,
        isTestCurrency,
        multiplier,
        partnerId,
        memberName,
        siteName,
        system,
        operatorId,
        playerId,
        playerName,
        disableJackpotGames,
        operatorToken,
        disableAward
    }: any) {
        this.ssoToken = ssoToken;
        this.sessionId = sessionId;
        this.owSeq = owSeq;
        this.username = username;
        this.memberId = memberId;
        this.ssoTime = ssoTime;
        this.recheckInTime = recheckInTime;
        this.ip = ip;
        this.browserUserAgent = browserUserAgent;
        this.siteId = siteId;
        this.userId = userId;
        this.language = language;
        this.currencyCode = currencyCode;
        this.currencyName = currencyName;
        this.currencyGroupId = currencyGroupId;
        this.isTestCurrency = isTestCurrency;
        this.multiplier = multiplier;
        this.partnerId = partnerId;
        this.memberName = memberName;
        this.siteName = siteName;
        this.system = system;
        this.operatorId = operatorId;
        this.playerId = playerId;
        this.playerName = playerName;
        this.disableJackpotGames = disableJackpotGames;
        this.operatorToken = operatorToken;
        this.disableAward = disableAward;
    }
}
