import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

type UserInfoDocument = UserInfo & Document;

@Schema()
class UserInfo {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ default: new Date() })
    joinedOn: Date;

    @Prop({ default: 0 })
    red: number;

    @Prop({ default: 0 })
    redWin: number;

    @Prop({ default: 0 })
    redLost: number;

    @Prop({ default: 0 })
    redPlay: number;

    @Prop({ default: false })
    type: boolean;

    @Prop({ default: 0 })
    avatarId: number;

    @Prop({ default: '' })
    currency: string;

    @Prop({ default: false })
    inRoom: boolean;

    @Prop({ default: false })
    disabled: boolean;

    @Prop({ default: '' })
    inGameRoom: string;

    @Prop({ default: false })
    banned: boolean;
}
const UserInfoSchema = SchemaFactory.createForClass(UserInfo);
// UserInfoSchema.plugin(MongooseAutoIncrementID.plugin, {
//     modelName: 'UserInfo',
//     field: 'UID',
// });

export { UserInfoDocument, UserInfo, UserInfoSchema };
