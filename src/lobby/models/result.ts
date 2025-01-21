export class LobbyConfigsResult {
    constructor(readonly isAuthenticated: boolean, readonly lobbyConfigs: any = null) {}
}

export class DirectLobbyConfigsResult {
    constructor(readonly isAuthenticated: boolean, readonly directLobbyConfigs: any = null) {}
}
