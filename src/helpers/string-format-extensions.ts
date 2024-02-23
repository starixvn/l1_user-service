export class StringFormatExtensions {
    formatUserName(operatorId: string, playerId: string) {
        console.log('formatUserName', `${operatorId}_${playerId}`);
        return `${operatorId}_${playerId}`;
    }
}
