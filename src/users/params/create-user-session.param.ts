export class CreateUserSessionParam {
    constructor(
        readonly ssoToken: string,
        readonly sessionId: string,
        readonly owSeq: string,
        readonly username: string,
        readonly memberId: number,
        readonly ssoTime: Date,
        readonly recheckInTime: Date,
        readonly ip: string,
        readonly browserUserAgent: string,
        readonly siteId: string,
        readonly userId: string,
        readonly language: string,
        readonly currencyCode: string,
        readonly currencyName: string,
        readonly currencyGroupId: string,
        readonly multiplier: number,
        readonly partnerId: string,
        readonly memberName: string,
        readonly siteName: string,
        readonly system: number,
    ) {}
}
