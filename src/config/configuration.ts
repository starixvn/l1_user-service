export default () => ({
    database: {
        uri: process.env.DATABASE_URI,
        options: {
            dbName: 'minigame',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    logIdentifier: 'user-service',
    api: {
        baseURL: 'http://api.lumigame.com',
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 4500,
    },
    auth: {
        uri: 'http://auth.lumigame.com',
        clientId: 'game-server',
        clientSecret: 'gameserver@20luminet&',
    },
});
