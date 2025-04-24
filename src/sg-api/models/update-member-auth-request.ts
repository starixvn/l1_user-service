export class UpdateMemberAuthRequest {
    constructor(readonly Token: string, readonly OperatorId: string, readonly GameTypeId: number, readonly CurrencyGroupId: string) {}
}
