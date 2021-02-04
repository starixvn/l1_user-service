export class VerifySessionRequest {
    session: string;
    username: string;
    browserUserAgent: string;

    constructor(session: string, username: string, browserUserAgent: string) {
        this.session = session;
        this.username = username;
        this.browserUserAgent = browserUserAgent;
    }
}
