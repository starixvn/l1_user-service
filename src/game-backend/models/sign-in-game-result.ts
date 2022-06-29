import { UserSession } from '../../users/schemas';

export class SignInGameResult {
    id: string;
    playerId: number;
    operatorId: string;
    currencyName: string;
    currencyCode: string;
    currencyGroupId: string;
    operatorToken: string;
    siteName: string;
    siteId: string;
    system: number;
    language: string;
    ip: string;
    multiplier: number;
    isTestCurrency: boolean;
    sessionId: string;

    constructor(session: UserSession) {
        this.id = session.userId;
        this.playerId = session.playerId;
        this.operatorId = session.operatorId;
        this.currencyName = session.currencyName;
        this.currencyCode = session.currencyCode;
        this.currencyGroupId = session.currencyGroupId;
        this.operatorToken = session.operatorToken;
        this.siteName = session.siteName;
        this.siteId = session.siteId;
        this.system = session.system;
        this.language = session.language;
        this.ip = session.ip;
        this.multiplier = session.multiplier;
        this.isTestCurrency = session.isTestCurrency;
        this.sessionId = session.sessionId;
    }
}
