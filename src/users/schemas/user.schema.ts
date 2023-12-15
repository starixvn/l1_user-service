import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
class Local {
    @Prop()
    username: string;

    @Prop()
    password: string;

    @Prop()
    regDate: Date;

    @Prop()
    partnerId: string;

    @Prop()
    clientId: string;

    @Prop()
    memberId: string;

    @Prop()
    memberName: string;

    @Prop()
    currency: string;

    @Prop()
    operatorId: string;

    @Prop()
    playerId: string;

    @Prop()
    playerName: string;
}
const localSchema = SchemaFactory.createForClass(Local);

@Schema()
export class User {
    @Prop({ type: localSchema })
    local: Local;

    @Prop()
    playerId: string;

    @Prop()
    operatorId: string;

    @Prop()
    operatorPlayerId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
