import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type CurrencyGroupGameDocument = CurrencyGroupGame & mongoose.Document;

@Schema()
export class CurrencyGroupGame {
    @Prop({ required: true })
    groupId: mongoose.Types.ObjectId;

    @Prop({ required: true })
    gameId: number;

    @Prop({ required: true })
    gameName: string;

    @Prop({ required: true })
    enabled: boolean;

    @Prop({ required: true })
    minBet: number;

    @Prop({ required: true })
    maxBet: number;

    @Prop({ type: Object })
    maxBetPerChoices: object;

    @Prop({ type: [Number] })
    chips: string[];
}

export const CurrencyGroupGameSchema = SchemaFactory.createForClass(CurrencyGroupGame);
