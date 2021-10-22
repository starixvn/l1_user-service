import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

export type CurrencyGroupGameDocument = CurrencyGroupGame & mongoose.Document;

@Schema()
class Chip {
    @Prop({ required: true })
    value: number;

    @Prop({ required: true })
    text: string;

    @Prop({ required: true })
    color: string;
}

const ChipSchema = SchemaFactory.createForClass(Chip);

@Schema()
export class CurrencyGroupGame {
    @Prop({ required: true })
    groupId: string;

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

    @Prop({ type: [ChipSchema] })
    chips: Chip[];
}

export const CurrencyGroupGameSchema = SchemaFactory.createForClass(CurrencyGroupGame);
