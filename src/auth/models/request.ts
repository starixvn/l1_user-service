export class AuthenticateRequest {
    session: string;
    username: string;
}

export class SignNameRequest extends AuthenticateRequest {
    signName: string;
}
