import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type PartnerConfigDocument = PartnerConfig & Document;

@Schema()
class PartnerConfig {
    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    partnerId: string;

    @Prop({ type: Object })
    value: object;

    @Prop({ required: true })
    operatorId: string;
}

const PartnerConfigSchema = SchemaFactory.createForClass(PartnerConfig);

export { PartnerConfigDocument, PartnerConfig, PartnerConfigSchema };
