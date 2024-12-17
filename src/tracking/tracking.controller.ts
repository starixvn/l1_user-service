import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingRequest } from './models/tracking-request';
import { AuthPipe } from '../pipes/auth.pipe';

@Controller('tracking')
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) {}

    @Post('track')
    async track(@Body() trackingRequest: TrackingRequest) {
        return await this.trackingService.findAndUpdateDevice(trackingRequest);
    }
}
