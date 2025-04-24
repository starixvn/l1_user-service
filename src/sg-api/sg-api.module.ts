import { Module } from '@nestjs/common';
import { PartnerModule } from '../partner/partner.module';
import { SGApiClient } from './sg-api.client';

@Module({
    imports: [PartnerModule],
    providers: [SGApiClient],
    exports: [SGApiClient],
})
export class SGApiModule {}
