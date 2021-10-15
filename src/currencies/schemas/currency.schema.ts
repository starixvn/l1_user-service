import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId } from "mongoose";

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
    partnerId: ObjectId;

    @Prop({ required: true })
    currencyGroupId: ObjectId;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
