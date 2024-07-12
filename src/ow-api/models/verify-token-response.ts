export interface VerifyTokenResponse {
    playerId: string;
    playerName: string;
    siteId: string;
    operatorId: string;
    domain: string;
    language: string;
    currencyCode: string;
    currencyName: string;
    currencyGroupId: string;
    isTestCurrency: boolean;
    multiplier: number;
    seq: string;
    memberKey: string;
    code: number;
    message: string;
    isSuccessful: boolean;
    siteName: string;
    appType: number;
    disableJackpotGames?: boolean;
    operatorToken: string;
    operatorPlayerId: string;
    disableAward?: boolean;
}
