import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GlobalConfigService } from './global-config.service';
import { GlobalConfig, GlobalConfigSchema } from './schemas/global-config.schema';
import { GameConfig, GameConfigSchema } from './schemas/game-config.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: GlobalConfig.name, schema: GlobalConfigSchema, collection: 'global_configs' },
            { name: GameConfig.name, schema: GameConfigSchema, collection: 'game_configs' },
        ]),
    ],
    providers: [GlobalConfigService],
    exports: [GlobalConfigService],
})
export class GlobalConfigModule {}
