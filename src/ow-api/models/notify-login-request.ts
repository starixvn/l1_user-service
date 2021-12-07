export class NotifyLoginRequest {
    constructor(
        readonly Seq: string,
        readonly SiteId: string,
        readonly ObCustId: number,
        readonly Language: string,
        readonly CharacterName: string,
        readonly FirstLogin: boolean,
        readonly PartnerId: string,
    ) {}
}
