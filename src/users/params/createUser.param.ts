export class CreateUserParam {
    readonly username: string;
    readonly password: string;
    readonly regDate: Date;
    readonly clientId: string;
    readonly memberId: number;
    readonly memberName: string;
    readonly currency: string;

    constructor(
        username: string,
        password: string,
        regDate: Date,
        clientId: string,
        memberId: number,
        memberName: string,
        currency: string,
    ) {
        this.username = username;
        this.password = password;

        this.regDate = regDate;
        this.clientId = clientId;
        this.memberId = memberId;
        this.memberName = memberName;
        this.currency = currency;
    }
}
