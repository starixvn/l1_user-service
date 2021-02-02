import { Module } from "@nestjs/common";
import { OWApiModule } from "src/ow-api/ow-api.module";
import { UserSessionsModule } from "src/user-sessions/user-sessions.module";
import { UsersModule } from "src/users/users.module";

import { AuthService } from "./auth.service";

@Module({
    imports: [UsersModule, UserSessionsModule, OWApiModule],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
