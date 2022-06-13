import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AuthenticateMiddleware } from './middlewares/authenticate.middleware';
import { AdminController } from './admin/admin.controller';
import { JwtModule } from '@nestjs/jwt';

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
        JwtModule.register({}),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthenticateMiddleware).forRoutes(AdminController);
        consumer.apply(AuthenticateMiddleware).forRoutes('users/signInGame');
    }
}
