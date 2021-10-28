export class GetBalanceRequest {
    constructor(
        readonly Seq: string,
        readonly SiteId: string,
        readonly ObCustId: number,
        readonly Language: string,
        readonly PartnerId: string,
    ) {}
}
