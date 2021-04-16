import { VerifySessionRequest } from "../../users/models";

export class CreateNicknameRequest extends VerifySessionRequest {
    nickname: string;

    constructor(session: string, username: string, browserUserAgent: string, nickname: string) {
        super(session, username, browserUserAgent);

        this.nickname = nickname;
    }
}
