import { Inject, Body, Controller, Post, HttpStatus, HttpException } from '@nestjs/common';
import { SignInGameRequest, SignInGameResult } from './models';
import { UserSessionsService } from '../users/providers';
import { ValidationPipe } from './validation-pipe';

@Controller('gameBackend')
export class GameBackendController {
    ForbiddenError = new HttpException('', HttpStatus.FORBIDDEN);

    @Inject(UserSessionsService) private readonly userSessionsService: UserSessionsService;

    @Post('signInGame')
    async signInGame(@Body(new ValidationPipe()) request: SignInGameRequest): Promise<SignInGameResult | HttpException> {
        const { isAuthenticated, session } = await this.userSessionsService.verifySession(request);

        return isAuthenticated ? new SignInGameResult(session) : this.ForbiddenError;
    }
}
