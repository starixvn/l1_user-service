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
import { BackendAuthenticateMiddleware } from './middlewares/backend-authenticate.middleware';
import { AdminController } from './admin/admin.controller';
import { JwtModule } from '@nestjs/jwt';
import { GameBackendModule } from './game-backend/game-backend.module';
import { GameBackendController } from './game-backend/game-backend.controller';
import { OpenTelemetryModule } from 'nestjs-otel';

const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
    metrics: {
        hostMetrics: true, // Includes Host Metrics
        defaultMetrics: false, // Includes Default Metrics
        apiMetrics: {
            enable: true, // Includes api metrics
            timeBuckets: [], // You can change the default time buckets
            defaultAttributes: {
                // You can set default labels for api metrics
                custom: 'label',
            },
            ignoreRoutes: ['/favicon.ico', '/'], // You can ignore specific routes (See https://docs.nestjs.com/middleware#excluding-routes for options)
            ignoreUndefinedRoutes: false, //Records metrics for all URLs, even undefined ones
        },
    },
});

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
        JwtModule.register({}),
        OpenTelemetryModuleConfig,
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
