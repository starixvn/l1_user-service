import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { UserSessionsService, UserInfosService } from '../users/providers';
import { UserSession, UserSessionSchema, UserInfo, UserInfoSchema } from '../users/schemas';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }]),
        MongooseModule.forFeature([{ name: UserInfo.name, schema: UserInfoSchema }]),
        JwtModule.register({}),
    ],
    providers: [AdminService, UserSessionsService, UserInfosService],
    controllers: [AdminController],
    exports: [AdminService],
})
export class AdminModule {}
