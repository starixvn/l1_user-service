import { VerifySessionRequest } from "../../users/models";

export class CreateNicknameRequest extends VerifySessionRequest {
    constructor(
        readonly session: string,
        readonly username: string,
        readonly browserUserAgent: string,
        readonly nickname: string,
        readonly avatar: number,
    ) {
        super(session, username, browserUserAgent);
    }
}
