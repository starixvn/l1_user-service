import { Body, Controller, Post } from '@nestjs/common';
import { AuthPipe } from '../pipes/auth.pipe';
import { VerifySessionRequest } from '../users/models';
import { LobbyService } from './lobby.service';

@Controller('lobby')
export class LobbyController {
    constructor(private readonly lobbyService: LobbyService) {}

    @Post('configs')
    async getLobbyConfigs(@Body(new AuthPipe()) body: VerifySessionRequest) {
        return this.lobbyService.getLobbyConfigs(body);
    }
}
