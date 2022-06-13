import { UserSession } from '../schemas';

export class SignInGameResult {
    isSuccessful: boolean;
    id: string;
    playerId: number;
    operatorId: string;
    currency: string;
    currencyGroupId: string;
    operatorToken: string;
    siteName: string;
    siteId: string;
    currencyCode: string;
    system: number;
    language: string;
    ip: string;
    multiplier: number;

    constructor(isSuccessful: boolean, session: UserSession) {
        this.isSuccessful = isSuccessful;

        if (isSuccessful) {
            this.id = session.userId;
            this.playerId = session.playerId;
            this.operatorId = session.operatorId;
            this.currency = session.currencyName;
            this.currencyGroupId = session.currencyGroupId;
            this.operatorToken = session.operatorToken;
            this.siteName = session.siteName;
            this.siteId = session.siteId;
            this.currencyCode = session.currencyCode;
            this.system = session.system;
            this.language = session.language;
            this.ip = session.ip;
            this.multiplier = session.multiplier;
        }
    }
}
