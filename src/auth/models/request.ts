export class AuthenticateRequest {
    session: string;
    username: string;
    characterName: string;
}

export class SignNameRequest extends AuthenticateRequest {
    signName: string;
}
