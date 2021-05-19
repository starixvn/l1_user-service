import { Module } from "@nestjs/common";

import { GlobalConfigModule } from "../global-config/global-config.module";
import { OWApiModule } from "../ow-api/ow-api.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
    imports: [UsersModule, OWApiModule, GlobalConfigModule],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
