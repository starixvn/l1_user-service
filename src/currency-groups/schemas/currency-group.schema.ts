import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type CurrencyGroupDocument = CurrencyGroup & mongoose.Document;

@Schema()
export class CurrencyGroup {
    @Prop()
    name: string;

    @Prop()
    enabled: boolean;

    @Prop()
    partnerId: string;

    @Prop()
    operatorId: string;

    @Prop()
    fractionalOddsFormat: boolean;
}

export const CurrencyGroupSchema = SchemaFactory.createForClass(CurrencyGroup);
