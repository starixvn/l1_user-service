import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type GameConfigDocument = GameConfig & Document;

@Schema()
class GameConfig {
    @Prop({ required: true })
    gameId: number;

    @Prop({ type: Object })
    enabled: boolean;
}

const GameConfigSchema = SchemaFactory.createForClass(GameConfig);

export { GameConfig, GameConfigDocument, GameConfigSchema };

