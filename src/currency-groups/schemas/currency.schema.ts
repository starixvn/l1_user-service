import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type CurrencyDocument = Currency & mongoose.Document;

@Schema()
export class Currency {
    @Prop()
    name: string;

    @Prop()
    code: boolean;

    @Prop()
    multiplier: number;

    @Prop()
    enabled: string;

    @Prop()
    isTest: boolean;

    @Prop()
    partnerId: string;

    @Prop()
    groupId: mongoose.Types.ObjectId;

    @Prop()
    operatorId: string;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
