export class NotifyLoginRequest {
    constructor(
        readonly Seq: string,
        readonly SiteId: string,
        readonly PlayerId: number,
        readonly Language: string,
        readonly CharacterName: string,
        readonly FirstLogin: boolean,
        readonly OperatorId: string,
        readonly OperatorToken: string,
    ) {}
}
