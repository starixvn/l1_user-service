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
    api: {
        baseURL: process.env.API_URI,
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 4500,
    },
    auth: {
        uri: process.env.AUTH_URI,
        clientId: 'game-server',
        clientSecret: 'gameserver@20luminet&',
    },
    sentry: {
        dns: process.env.SENTRY_DNS,
        release: process.env.SENTRY_RELEASE,
        env: process.env.ENV,
        logIdentifier: 'user-service',
    },
});
