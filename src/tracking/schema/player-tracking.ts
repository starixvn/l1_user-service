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

@Schema({ timestamps: true })
class PlayerTracking {
    @Prop({ unique: true })
    visitorId: string;

    @Prop({ type: [PlayerSchema] })
    players: Player[];

    @Prop({ type: [String] })
    linkedVisitorIds: string[];

    @Prop({ type: [DeviceSchema] })
    deviceHistory: Device[];
}

const PlayerTrackingSchema = SchemaFactory.createForClass(PlayerTracking);

// Index for visitorId
PlayerTrackingSchema.index({ visitorId: 1 }, { unique: true });

// Indexes for players fields
PlayerTrackingSchema.index({ 'players.playerId': 1, 'players.operatorId': 1 });
PlayerTrackingSchema.index({ 'players.playerId': 1 });
PlayerTrackingSchema.index({ 'players.operatorId': 1 });

type PlayerTrackingDocument = PlayerTracking & Document;

export { PlayerTrackingSchema, PlayerTracking, PlayerTrackingDocument, Device, Player };
