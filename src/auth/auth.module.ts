import { Module } from '@nestjs/common';
import { CurrencyGroupGamesModule } from '../currency-group-games/currency-group-games.module';
import { PartnerConfigModule } from '../partner-config/partner-config.module';
import { OWApiModule } from '../ow-api/ow-api.module';
import { UMModule } from '../um/um.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CurrencyGroupModule } from '../currency-groups/currency-group.module';
import { MiddleSiteApiModule } from '../middle-site-api/middle-site-api.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Spin, SpinSchema } from './schemas/spins';
import { PartnerModule } from '../partner/partner.module';

@Module({
    imports: [
        UsersModule,
        OWApiModule,
        PartnerConfigModule,
        CurrencyGroupGamesModule,
        UMModule,
        CurrencyGroupModule,
        MiddleSiteApiModule,
        PartnerModule,
        MongooseModule.forFeature([{ name: Spin.name, schema: SpinSchema, collection: 'spins' }]),
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
