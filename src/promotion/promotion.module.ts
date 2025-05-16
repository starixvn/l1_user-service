import { Module, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { PromotionService } from './promotion.service';

@Module({
    imports: [HttpModule, ConfigModule, CommonModule],
    providers: [PromotionService],
    exports: [PromotionService],
})
export class PromotionModule {}
