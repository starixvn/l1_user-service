import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type UMInfoDocument = UMInfo & Document;

@Schema()
class UMInfo {
    @Prop()
    time: Date;

    @Prop()
    start: Date;

    @Prop()
    end: Date;

    @Prop()
    finish: boolean;

    @Prop()
    partnerId: string;
}

const UMInfoSchema = SchemaFactory.createForClass(UMInfo);

export { UMInfoDocument, UMInfo, UMInfoSchema };
