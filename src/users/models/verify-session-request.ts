export class VerifySessionRequest {
    constructor(readonly session: string, readonly username: string, readonly browserUserAgent: string) {}
}
