export class GetBalanceRequest {
    constructor(
        readonly Seq: string,
        readonly SiteId: string,
        readonly PlayerId: string,
        readonly Language: string,
        readonly OperatorId: string,
        readonly OperatorToken: string,
    ) {}
}
