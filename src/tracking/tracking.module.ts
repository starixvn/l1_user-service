import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayerTracking, PlayerTrackingSchema } from './schema/player-tracking';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { UsersModule } from '../users/users.module';
import { PlayerTrackingRepository } from './repositories/player-tracking.repository';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: PlayerTracking.name, schema: PlayerTrackingSchema, collection: 'player_tracking' }]),
        UsersModule,
    ],
    providers: [
        TrackingService,
        {
            provide: 'IPlayerTrackingRepository',
            useClass: PlayerTrackingRepository,
        },
    ],
    controllers: [TrackingController],
    exports: [TrackingService],
})
export class TrackingModule {}
