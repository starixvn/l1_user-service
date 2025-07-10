export class CreateUserInfoParam {
    joinedOn: Date;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly currency: string,
        readonly UID: number,
        readonly avatarId: number,
        readonly playerNickname: string,
        readonly playerAvatarUrl: string,
    ) {
        this.joinedOn = new Date();
    }
}
