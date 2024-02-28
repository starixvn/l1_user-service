export class StringFormatExtensions {
    formatUserName(operatorId: string, playerId: string) {
        return `${operatorId}_${playerId}`;
    }
}
