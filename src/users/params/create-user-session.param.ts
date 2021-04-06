export class CreateUserSessionParam {
    readonly ssoToken: string;
    readonly sessionId: string;
    readonly owSeq: string;
    readonly username: string;
    readonly memberId: number;
    readonly ssoTime: Date;
    readonly recheckInTime: Date;
    readonly ip: string;
    readonly browserUserAgent: string;
    readonly siteId: string;
    readonly userId: string;
    readonly language: string;
    readonly currency: string;
    readonly clientId: string;
    readonly memberName: string;
    readonly siteName: string;
    readonly system: number;

    constructor(
        ssoToken: string,
        sessionId: string,
        owSeq: string,
        username: string,
        memberId: number,
        ssoTime: Date,
        recheckInTime: Date,
        ip: string,
        browserUserAgent: string,
        siteId: string,
        userId: string,
        language: string,
        currency: string,
        clientId: string,
        memberName: string,
        siteName: string,
        system: number,
    ) {
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
        this.currency = currency;
        this.clientId = clientId;
        this.memberName = memberName;
        this.siteName = siteName;
        this.system = system;
    }
}
