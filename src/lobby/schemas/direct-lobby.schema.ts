import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type DirectLobbyDocument = DirectLobby & mongoose.Document;

@Schema()
export class DirectLobby {
    @Prop()
    name: string;

    @Prop({ type: [String] })
    currencyGroupIds: string[];

    @Prop({ type: [Number] })
    gameIds: number[];

    @Prop({ type: [Number] })
    newGames: number[];
}

export const DirectLobbySchema = SchemaFactory.createForClass(DirectLobby);
