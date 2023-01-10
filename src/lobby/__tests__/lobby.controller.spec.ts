import { Test } from '@nestjs/testing';
import { LobbyController } from '../lobby.controller';
import { LobbyService } from '../lobby.service';
import { LobbyConfigsResult } from '../models/result';

jest.mock('../lobby.service');

describe('Lobby Controller', () => {
    let lobbyService: LobbyService;
    let lobbyController: LobbyController;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [LobbyController],
            providers: [LobbyService],
        }).compile();

        lobbyService = module.get<LobbyService>(LobbyService);
        lobbyController = module.get<LobbyController>(LobbyController);
    });

    describe('getLobbyConfigs', () => {
        it('should return lobby from service', async () => {
            // Arrange
            const expectResult = new LobbyConfigsResult(true, {});

            jest.spyOn(lobbyService, 'getLobbyConfigs').mockResolvedValue(expectResult);

            // Act
            const actualValue = await lobbyController.getLobbyConfigs({
                session: 'session',
                username: 'user1',
                browserUserAgent: 'userAgent',
            });

            // Assert
            expect(actualValue).toBe(expectResult);
        });
    });
});
