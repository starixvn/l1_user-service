export class VerifyTokenRequest {
    readonly ip: string;
    readonly token: string;
    readonly browserUserAgent: string;

    constructor(ip: string, token: string, browserUserAgent: string) {
        this.ip = ip;
        this.token = token;
        this.browserUserAgent = browserUserAgent;
    }
}
