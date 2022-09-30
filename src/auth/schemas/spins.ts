import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type SpinDocument = Spin & Document;

@Schema()
class Spin {
    @Prop()
    memberId: number;

    @Prop()
    availSpins: number;

    @Prop()
    usedSpins: number;

    @Prop()
    enabled: boolean;
}

const SpinSchema = SchemaFactory.createForClass(Spin);
export { Spin, SpinDocument, SpinSchema };
