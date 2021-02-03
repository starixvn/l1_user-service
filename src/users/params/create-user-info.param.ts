export class CreateUserInfoParam {
    id: string;
    name: string;
    joinedOn: Date;
    currency: string;
    avatarId: number;
    UID: number;

    constructor(id: string, name: string, currency: string, UID: number) {
        this.id = id;
        this.name = name;
        this.currency = currency;
        this.UID = UID;

        this.joinedOn = new Date();
        this.avatarId = (Math.random() * 40 + 1) >> 0;
    }
}
