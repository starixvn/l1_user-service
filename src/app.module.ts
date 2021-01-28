import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import configuration from "./config/configuration";
import { LoggerModule } from "./logger/logger.module";
import { UserSessionsModule } from "./user-sessions/user-sessions.module";
import { UsersModule } from "./users/users.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env.development', '.env.local'],
            isGlobal: true,
            load: [configuration],
        }),
        MongooseModule.forRootAsync({
            useFactory: async (config: ConfigService) => ({
                ...config.get('database'),
            }),
            inject: [ConfigService],
        }),
        UsersModule,
        UserSessionsModule,
        LoggerModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
