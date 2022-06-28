export class GetBalanceRequest {
    constructor(
        readonly Seq: string,
        readonly SiteId: string,
        readonly PlayerId: number,
        readonly Language: string,
        readonly OperatorId: string,
        readonly OperatorToken: string,
    ) {}
}
