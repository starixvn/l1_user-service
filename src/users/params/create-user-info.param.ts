export class CreateUserInfoParam {
    joinedOn: Date;

    constructor(readonly id: string, readonly name: string, readonly currency: string, readonly UID: number, readonly avatarId: number) {
        this.joinedOn = new Date();
    }
}
