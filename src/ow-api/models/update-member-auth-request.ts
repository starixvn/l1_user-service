export class UpdateMemberAuthRequest {
    constructor(readonly Token: string, readonly Language: string, readonly GameTypeId: number, readonly CurrencyGroupId: string) {}
}
