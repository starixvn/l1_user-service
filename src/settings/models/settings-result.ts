import { UMInfo } from "../schemas";

export class SettingsResult {
    readonly isUM: boolean;
    readonly umInfo: UMInfo;

    constructor(isUM: boolean, umInfo: UMInfo) {
        this.isUM = isUM;
        this.umInfo = umInfo;
    }
}
