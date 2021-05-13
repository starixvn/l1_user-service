export class CreateUserParam {
    constructor(
        readonly username: string,
        readonly password: string,
        readonly regDate: Date,
        readonly clientId: string,
        readonly memberId: number,
        readonly memberName: string,
        readonly currency: string,
    ) {}
}
