import { PlayerTrackingDocument } from '../schema/player-tracking';

export enum TrackingStatus {
    CREATED = 'created',
    UPDATED = 'updated',
    ERROR = 'error',
    FAILED = 'failed',
}

export interface TrackingResponse {
    status: TrackingStatus;
    error?: string;
}
