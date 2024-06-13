import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CurrencyGroupGameService } from './currency-group-games.service';
import { CurrencyGroupGame, CurrencyGroupGameSchema } from './schemas';

@Module({
    imports: [
        CacheModule.register(),
        MongooseModule.forFeature([{ name: CurrencyGroupGame.name, schema: CurrencyGroupGameSchema, collection: 'currency_group_games' }]),
    ],
    providers: [CurrencyGroupGameService],
    exports: [CurrencyGroupGameService],
})
export class CurrencyGroupGamesModule {}
