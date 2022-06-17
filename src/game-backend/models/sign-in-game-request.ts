import { IsString, IsNotEmpty } from 'class-validator';

export class SignInGameRequest {
    @IsString()
    @IsNotEmpty()
    session: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    browserUserAgent: string;

    constructor(session: string, username: string, browserUserAgent: string) {
        this.session = session;
        this.username = username;
        this.browserUserAgent = browserUserAgent;
    }
}
