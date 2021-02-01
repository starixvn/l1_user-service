export class GetBalanceRequest {
    readonly Seq: string;
    readonly SiteId: string;
    readonly ObCustId: string;
    readonly Language: string;

    constructor(Seq: string, SiteId: string, ObCustId: string, Language: string) {
        this.Seq = Seq;
        this.SiteId = SiteId;
        this.ObCustId = ObCustId;
        this.Language = Language;
    }
}
