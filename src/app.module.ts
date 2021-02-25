import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import configuration from "./config/configuration";
import { HealthModule } from "./health";
import { OWApiModule } from "./ow-api/ow-api.module";
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
        CommonModule,
        UsersModule,
        OWApiModule,
        AuthModule,
        HealthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
