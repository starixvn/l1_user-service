import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ChipDocument = Chip & Document;

@Schema()
export class Chip {
    @Prop({ required: true })
    value: number;

    @Prop({ required: true })
    text: string;
}

export const ChipSchema = SchemaFactory.createForClass(Chip);
