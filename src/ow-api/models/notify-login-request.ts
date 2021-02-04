export class NotifyLoginRequest {
    readonly Seq: string;
    readonly SiteId: string;
    readonly ObCustId: number;
    readonly Language: string;
    readonly CharacterName: string;
    readonly FirstLogin: boolean;

    constructor(Seq: string, SiteId: string, ObCustId: number, Language: string, CharacterName: string, FirstLogin: boolean) {
        this.Seq = Seq;
        this.SiteId = SiteId;
        this.ObCustId = ObCustId;
        this.Language = Language;
        this.CharacterName = CharacterName;
        this.FirstLogin = FirstLogin;
    }
}
