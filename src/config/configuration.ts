export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        uri: process.env.DATABASE_URI,
        options: {
            dbName: 'minigame',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        dsn: process.env.SENTRY_DSN,
        maxValueLength: 5000,
        environment: process.env,
        release: '',
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
