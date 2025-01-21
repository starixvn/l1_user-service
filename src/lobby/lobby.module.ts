import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { LobbyController } from './lobby.controller';
import { LobbyService } from './lobby.service';
import { Lobby, LobbySchema } from './schemas/lobby.schema';
import { DirectLobby, DirectLobbySchema } from './schemas/direct-lobby.schema';

@Module({
    imports: [
        CacheModule.register(),
        MongooseModule.forFeature([{ name: Lobby.name, schema: LobbySchema, collection: 'lobbies' }]),
        MongooseModule.forFeature([{ name: DirectLobby.name, schema: DirectLobbySchema, collection: 'direct_lobbies' }]),
        UsersModule,
    ],
    providers: [LobbyService],
    exports: [LobbyService],
    controllers: [LobbyController],
})
export class LobbyModule {}
