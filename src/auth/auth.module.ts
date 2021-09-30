import { Module } from "@nestjs/common";

import { GlobalConfigModule } from "../global-config/global-config.module";
import { OWApiModule } from "../ow-api/ow-api.module";
import { SettingsModule } from "../settings/settings.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
    imports: [UsersModule, OWApiModule, GlobalConfigModule, SettingsModule],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
