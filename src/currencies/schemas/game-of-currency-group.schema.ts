import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId } from "mongoose";

export type GameOfCurrencyGroupDocument = GameOfCurrencyGroup & Document;

@Schema()
export class GameOfCurrencyGroup {
    @Prop({ required: true })
    groupId: ObjectId;

    @Prop({ required: true })
    gameId: number;

    @Prop({ required: true })
    enabled: boolean;

    @Prop({ required: true })
    minBet: number;

    @Prop({ required: true })
    maxBet: number;

    @Prop()
    maxBetPerChoices: Object;
}

export const GameOfCurrencyGroupSchema = SchemaFactory.createForClass(GameOfCurrencyGroup);
