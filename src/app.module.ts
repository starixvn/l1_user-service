import { ConfigModule, ConfigService } from '@nestjs/config';

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import configuration from './config/configuration';
import { CurrencyGroupGamesModule } from './currency-group-games/currency-group-games.module';
import { CurrencyGroupModule } from './currency-groups/currency-group.module';
import { GlobalConfigModule } from './global-config/global-config.module';
import { HealthModule } from './health';
import { OWApiModule } from './ow-api/ow-api.module';
import { SettingsModule } from './settings/settings.module';
import { UMModule } from './um/um.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { GameResultModule } from './game-result/game-result.module';
import { BackendAuthenticateMiddleware } from './middlewares/backend-authenticate.middleware';
import { AdminController } from './admin/admin.controller';
import { JwtModule } from '@nestjs/jwt';
import { GameBackendModule } from './game-backend/game-backend.module';
import { GameBackendController } from './game-backend/game-backend.controller';
import { LobbyModule } from './lobby/lobby.module';
import { DomainModule } from './domain/domain.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchangeRateModule } from './exchange_rates/exchange-rate.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                ...configService.get('database'),
            }),
            inject: [ConfigService],
        }),
        CommonModule,
        UsersModule,
        OWApiModule,
        AuthModule,
        HealthModule,
        GlobalConfigModule,
        SettingsModule,
        CurrencyGroupGamesModule,
        UMModule,
        CurrencyGroupModule,
        AdminModule,
        GameResultModule,
        GameBackendModule,
        LobbyModule,
        DomainModule,
        JwtModule.register({}),
        ScheduleModule.forRoot(),
        ExchangeRateModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(BackendAuthenticateMiddleware).forRoutes(AdminController);
        consumer.apply(BackendAuthenticateMiddleware).forRoutes(GameBackendController);
    }
}
