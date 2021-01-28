import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserSessionDocument = UserSession & Document;

@Schema()
export class UserSession {
    @Prop()
    ssoToken: string;

    @Prop({ unique: true })
    sessionId: string;

    @Prop()
    siteId: string;

    @Prop()
    userId: string;

    @Prop()
    username: string;

    @Prop()
    owSeq: string;

    @Prop()
    memberId: number;

    @Prop()
    ssoTime: Date;

    @Prop({ required: true })
    recheckInTime: Date;

    @Prop()
    ip: string;

    @Prop()
    browserUserAgent: string;

    @Prop()
    language: string;

    @Prop()
    currency: string;

    @Prop()
    clientId: string;

    @Prop()
    memberName: string;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
