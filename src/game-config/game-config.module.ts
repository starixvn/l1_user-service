import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GameConfigService } from './game-config.service';
import { GameConfig, GameConfigSchema } from './schemas/game-config.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: GameConfig.name, schema: GameConfigSchema, collection: 'game_configs' },
        ]),
    ],
    providers: [GameConfigService],
    exports: [GameConfigService],
})
export class GameConfigModule {}
