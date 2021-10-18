import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import * as mongoose from "mongoose";

import { Chip } from "./chip.schema";

export type GameOfCurrencyGroupDocument = GameOfCurrencyGroup & Document;

@Schema()
export class GameOfCurrencyGroup {
    @Prop({ required: true })
    groupId: string;

    @Prop({ required: true })
    gameId: number;

    @Prop({ required: true })
    enabled: boolean;

    @Prop({ required: true })
    minBet: number;

    @Prop({ required: true })
    maxBet: number;

    @Prop({ type: Object })
    maxBetPerChoices: object;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chip' }] })
    chips: Chip[];
}

export const GameOfCurrencyGroupSchema = SchemaFactory.createForClass(GameOfCurrencyGroup);
