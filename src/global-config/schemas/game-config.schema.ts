import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type GameConfigDocument = GameConfig & Document;

@Schema()
class GameConfig {
    @Prop({ required: true })
    gameId: number;

    @Prop({ required: true })
    isBeta: boolean;
}

const GameConfigSchema = SchemaFactory.createForClass(GameConfig);

export { GameConfigDocument, GameConfig, GameConfigSchema };
