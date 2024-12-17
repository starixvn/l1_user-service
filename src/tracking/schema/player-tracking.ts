import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
class Device {
    @Prop()
    model: string;

    @Prop()
    os: string;

    @Prop()
    browser: string;

    @Prop({ type: Date, default: Date.now })
    lastUsedTime: Date;
}

const DeviceSchema = SchemaFactory.createForClass(Device);

@Schema()
class PlayerTracking {
    @Prop()
    playerId: string;

    @Prop()
    operatorId: string;

    @Prop()
    playerName: string;

    @Prop()
    visitorId: string;

    @Prop({ type: [DeviceSchema] })
    deviceHistory: Device[];
}

const PlayerTrackingSchema = SchemaFactory.createForClass(PlayerTracking);

type PlayerTrackingDocument = PlayerTracking & Document;

export { PlayerTrackingSchema, PlayerTracking, PlayerTrackingDocument, Device };
