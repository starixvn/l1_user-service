import { VerifySessionRequest } from '../../users/models';

export class GetAccessURLRequest extends VerifySessionRequest {
    constructor(
        readonly session: string,
        readonly username: string,
        readonly browserUserAgent: string,
        readonly language: string,
        readonly gameId: string,
    ) {
        super(session, username, browserUserAgent);
    }
}
