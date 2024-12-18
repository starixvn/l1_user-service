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
class Player {
    @Prop()
    playerId: string;

    @Prop()
    operatorId: string;

    @Prop()
    playerName: string;

    @Prop({ type: Date, default: Date.now })
    lastUsedTime: Date;
}

const PlayerSchema = SchemaFactory.createForClass(Player);

@Schema()
class PlayerTracking {
    @Prop()
    visitorId: string;

    @Prop({ type: [PlayerSchema] })
    players: Player[];

    @Prop({ type: [String] })
    linkedVisitorIds: string[];

    @Prop({ type: [DeviceSchema] })
    deviceHistory: Device[];

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
}

const PlayerTrackingSchema = SchemaFactory.createForClass(PlayerTracking);

type PlayerTrackingDocument = PlayerTracking & Document;

export { PlayerTrackingSchema, PlayerTracking, PlayerTrackingDocument, Device, Player };
