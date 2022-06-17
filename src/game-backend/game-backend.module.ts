import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { GameBackendController } from './game-backend.controller';

@Module({
    imports: [UsersModule],
    providers: [],
    controllers: [GameBackendController],
    exports: [],
})
export class GameBackendModule {}
