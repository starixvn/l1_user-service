import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GameResultService } from './game-result.service';
import { GameResultController } from './game-result.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        UsersModule,
        HttpModule.register({
            timeout: 2500,
        }),
    ],
    providers: [GameResultService],
    controllers: [GameResultController],
    exports: [GameResultService],
})
export class GameResultModule {}
