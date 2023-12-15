export class NotifyLoginRequest {
    constructor( // NOSONAR
        readonly Seq: string,
        readonly SiteId: string,
        readonly PlayerId: string,
        readonly Language: string,
        readonly CharacterName: string,
        readonly FirstLogin: boolean,
        readonly OperatorId: string,
        readonly OperatorToken: string,
    ) {}
}
