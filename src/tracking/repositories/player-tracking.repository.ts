import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerTracking, PlayerTrackingDocument, Device } from '../schema/player-tracking';
import { UserSession } from '../../users/schemas';

export interface IPlayerTrackingRepository {
    findByVisitorId(visitorId: string): Promise<PlayerTrackingDocument>;
    findByPlayerAndOperator(playerId: string, operatorId: string): Promise<PlayerTrackingDocument>;
    updateOne(visitorId: string, tracking: Partial<PlayerTracking>): Promise<PlayerTrackingDocument>;
    create(tracking: Partial<PlayerTracking>): Promise<PlayerTrackingDocument>;
    updateLinkedVisitorIds(visitorId: string, newVisitorId: string): Promise<void>;
}

@Injectable()
export class PlayerTrackingRepository implements IPlayerTrackingRepository {
    constructor(@InjectModel(PlayerTracking.name) private readonly playerTrackingModel: Model<PlayerTrackingDocument>) {}

    async findByVisitorId(visitorId: string): Promise<PlayerTrackingDocument> {
        return this.playerTrackingModel.findOne({ visitorId });
    }

    async findByPlayerAndOperator(playerId: string, operatorId: string): Promise<PlayerTrackingDocument> {
        return this.playerTrackingModel.findOne({
            'players.playerId': playerId,
            'players.operatorId': operatorId,
        });
    }

    async updateOne(visitorId: string, tracking: Partial<PlayerTracking>): Promise<PlayerTrackingDocument> {
        return this.playerTrackingModel.findOneAndUpdate({ visitorId }, tracking, { new: true, useFindAndModify: false });
    }

    async create(tracking: Partial<PlayerTracking>): Promise<PlayerTrackingDocument> {
        const newTracking = new this.playerTrackingModel(tracking);
        return newTracking.save();
    }

    async updateLinkedVisitorIds(visitorId: string, newVisitorId: string): Promise<void> {
        await this.playerTrackingModel.findOneAndUpdate({ visitorId }, { $addToSet: { linkedVisitorIds: newVisitorId } });
    }
}
