import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type DomainDocument = Domain & mongoose.Document;

@Schema()
export class Domain {
    @Prop()
    value: string;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);
