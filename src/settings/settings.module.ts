import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { Chip, ChipSchema } from './schemas/chip.schema';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { CurrencyGroupGamesModule } from '../currency-group-games/currency-group-games.module';

@Module({
    imports: [
        CacheModule.register(),
        MongooseModule.forFeature([{ name: Chip.name, schema: ChipSchema }]),
        UsersModule,
        CurrencyGroupGamesModule,
    ],
    providers: [SettingsService],
    controllers: [SettingsController],
    exports: [SettingsService],
})
export class SettingsModule {}
