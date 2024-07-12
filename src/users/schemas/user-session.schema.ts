import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
    memberId: string;

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
    currencyCode: string;

    @Prop()
    currencyName: string;

    @Prop()
    currencyGroupId: string;

    @Prop()
    isTestCurrency: boolean;

    @Prop()
    multiplier: number;

    @Prop()
    partnerId: string;

    @Prop()
    memberName: string;

    @Prop()
    siteName: string;

    @Prop()
    system: number;

    @Prop()
    operatorId: string;

    @Prop()
    playerId: string;

    @Prop()
    playerName: string;

    @Prop()
    disableJackpotGames: boolean;

    @Prop()
    operatorToken: string;

    @Prop()
    disableAward: boolean;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
