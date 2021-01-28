export class CreateUserDto {
    readonly userName: string;
    readonly password: string;
    readonly regDate: Date;
    readonly memberId: string;
    readonly memberName: string;
    readonly clientId: number;
    readonly currency: string;
}
