import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type PartnerDocument = Partner & Document;

@Schema()
class Partner {
    @Prop({ type: Boolean })
    isDisplayPlayerCurrency: boolean;

    @Prop({ type: String })
    partnerId: string;

    @Prop({ type: String })
    name: string;

    @Prop({ type: String })
    secretKey: string;

    @Prop({ type: String })
    clubVersionUrl: string;

    @Prop({ type: String })
    mobiVersionUrl: string;

    @Prop({ type: String })
    miniVersionUrl: string;

    @Prop({ type: String })
    testCurrencyUrl: string;

    @Prop({ type: String })
    megaKenoUrl: string;
}

const PartnerSchema = SchemaFactory.createForClass(Partner);

export { PartnerDocument, Partner, PartnerSchema };
