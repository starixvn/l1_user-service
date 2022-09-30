import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type UserInfoDocument = UserInfo & Document;

@Schema()
class Settings {
    @Prop({ default: undefined })
    quickBet: boolean;

    @Prop({ default: '' })
    theme: string;
}

const SettingsSchema = SchemaFactory.createForClass(Settings);

@Schema()
class UserInfo {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true, unique: true })
    UID: number;

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

    @Prop({ default: 0 })
    minBet: number;

    @Prop({ default: 0 })
    maxBet: number;

    @Prop()
    betLimitModifiedDate: Date;

    @Prop({ type: SettingsSchema })
    settings: Settings;

    @Prop({ default: false })
    isSignedInSM: boolean;

    @Prop({ default: 0 })
    scoins: number;
}

const UserInfoSchema = SchemaFactory.createForClass(UserInfo);

export { UserInfoDocument, UserInfo, UserInfoSchema };
