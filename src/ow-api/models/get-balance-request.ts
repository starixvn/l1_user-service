export class GetBalanceRequest {
    readonly Seq: string;
    readonly SiteId: string;
    readonly ObCustId: number;
    readonly Language: string;

    constructor(Seq: string, SiteId: string, ObCustId: number, Language: string) {
        this.Seq = Seq;
        this.SiteId = SiteId;
        this.ObCustId = ObCustId;
        this.Language = Language;
    }
}
