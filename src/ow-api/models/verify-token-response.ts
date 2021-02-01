export interface VerifyTokenResponse {
    memberId: number;
    memberName: string;
    siteId: string;
    clientId: string;
    domain: string;
    language: string;
    currency: string;
    seq: string;
    memberKey: string;
    code: number;
    message: string;
    isSuccessful: boolean;
}
