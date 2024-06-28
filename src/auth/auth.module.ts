import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CurrencyGroupGamesModule } from '../currency-group-games/currency-group-games.module';
import { CurrencyGroupModule } from '../currency-groups/currency-group.module';
import { ExchangeRateModule } from '../exchange_rates/exchange-rate.module';
import { GameConfigModule } from '../game-config/game-config.module';
import { OWApiModule } from '../ow-api/ow-api.module';
import { PartnerConfigModule } from '../partner-config/partner-config.module';
import { PartnerModule } from '../partner/partner.module';
import { UMModule } from '../um/um.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Spin, SpinSchema } from './schemas/spins';

@Module({
    imports: [
        UsersModule,
        OWApiModule,
        PartnerConfigModule,
        GameConfigModule,
        CurrencyGroupGamesModule,
        UMModule,
        CurrencyGroupModule,
        PartnerModule,
        MongooseModule.forFeature([{ name: Spin.name, schema: SpinSchema, collection: 'spins' }]),
        ExchangeRateModule
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
