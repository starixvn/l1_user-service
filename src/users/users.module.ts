import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import * as providers from './providers';
import { UserSession, UserSessionSchema } from './schemas';
import { UserInfo, UserInfoSchema } from './schemas/user-info.schema';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: UserInfo.name, schema: UserInfoSchema }]),
        MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }]),
    ],
    providers: Object.values(providers),
    controllers: [UsersController],
    exports: Object.values(providers),
})
export class UsersModule {}
