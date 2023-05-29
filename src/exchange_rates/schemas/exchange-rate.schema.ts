import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ExchangeRateDocument = ExchangeRate & mongoose.Document;

@Schema()
export class ExchangeRate {
    @Prop({ required: true })
    exId: number;

    @Prop({ required: true })
    time: Date;

    @Prop({ required: true })
    source: string;

    @Prop({ type: Object })
    code: object;
}

export const ExchangeRateSchema = SchemaFactory.createForClass(ExchangeRate);
