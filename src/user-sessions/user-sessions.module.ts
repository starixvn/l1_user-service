import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserSession, UserSessionSchema } from "./schemas/user-session.schema";
import { UserSessionsService } from "./user-sessions.service";

@Module({
    imports: [MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }])],
    providers: [UserSessionsService],
    exports: [UserSessionsService],
})
export class UserSessionsModule {}
