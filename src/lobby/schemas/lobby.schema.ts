import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type LobbyDocument = Lobby & mongoose.Document;

@Schema()
class Game {
    @Prop()
    id: number;

    @Prop()
    name: string;
}
const GameSchema = SchemaFactory.createForClass(Game);

@Schema()
class GameSetting {
    @Prop()
    gameId: number;

    @Prop()
    bigSize: boolean;

    @Prop()
    newTag: boolean;
}
const GameSettingSchema = SchemaFactory.createForClass(GameSetting);

@Schema()
class GameCategory {
    @Prop({ type: Object })
    name: object;

    @Prop({ type: [GameSettingSchema] })
    gameSettings: GameSetting[];
}
const GameCategorySchema = SchemaFactory.createForClass(GameCategory);

@Schema()
class RoundTimerGame {
    @Prop({ type: [GameSchema] })
    games: Game[];

    @Prop()
    main: number;
}
const RoundTimerGameSchema = SchemaFactory.createForClass(RoundTimerGame);

@Schema()
class Banner {
    @Prop()
    gameId: number;

    @Prop()
    displayTime: number;
}
const BannerSchema = SchemaFactory.createForClass(Banner);

@Schema()
export class Lobby {
    @Prop()
    name: string;

    @Prop({ type: [String] })
    currencyGroupIds: string[];

    @Prop({ type: [Number] })
    miniPanelGameIds: number[];

    @Prop({ type: [GameCategorySchema] })
    categories: GameCategory[];

    @Prop({ type: [BannerSchema] })
    banners: Banner[];

    @Prop({ type: Object })
    roundTimerGame: RoundTimerGame;
}

export const LobbySchema = SchemaFactory.createForClass(Lobby);
