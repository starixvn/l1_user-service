import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserInfo, UserInfoSchema } from "./schemas/user-info.schema";
import { User, UserSchema } from "./schemas/user.schema";
import { UsersService } from "./users.service";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: UserInfo.name, schema: UserInfoSchema }]),
    ],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
