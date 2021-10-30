import { Module } from '@nestjs/common';

import { CurrenciesModule } from '../currencies/currencies.module';
import { GlobalConfigModule } from '../global-config/global-config.module';
import { OWApiModule } from '../ow-api/ow-api.module';
import { UMModule } from '../um/um.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
    imports: [UsersModule, OWApiModule, GlobalConfigModule, CurrenciesModule, UMModule],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
