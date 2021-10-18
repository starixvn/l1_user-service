import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CurrencyDocument = Currency & Document;

@Schema()
export class Currency {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    code: string;

    @Prop({ required: true })
    rate: number;

    @Prop({ default: true })
    enabled: boolean;

    @Prop()
    isTest: boolean;

    @Prop({ required: true })
    partnerId: string;

    @Prop({ required: true })
    groupId: string;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
