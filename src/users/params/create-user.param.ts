export class CreateUserParam {
    constructor(
        readonly username: string,
        readonly password: string,
        readonly regDate: Date,
        readonly partnerId: string,
        readonly memberId: string,
        readonly memberName: string,
        readonly currency: string,
    ) {}
}
