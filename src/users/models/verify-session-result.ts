import { UserSession } from "../schemas";

export class VerifySessionResult {
    isAuthenticated: boolean;
    session: UserSession;

    constructor(isAuthenticated: boolean, session: UserSession) {
        this.isAuthenticated = isAuthenticated;
        this.session = session;
    }
}
