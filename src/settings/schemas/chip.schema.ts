import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ChipDocument = Chip & Document;

@Schema()
export class Chip {
    @Prop()
    value: number;

    @Prop()
    text: string;

    @Prop()
    color: string;
}

export const ChipSchema = SchemaFactory.createForClass(Chip);
