import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

type GlobalConfigDocument = GlobalConfig & Document;

@Schema()
class GlobalConfig {
    @Prop({ required: true })
    type: string;

    @Prop({ type: Object })
    configs: object;
}

const GlobalConfigSchema = SchemaFactory.createForClass(GlobalConfig);

export { GlobalConfigDocument, GlobalConfig, GlobalConfigSchema };
