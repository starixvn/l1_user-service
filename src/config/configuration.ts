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
        audiences: ['api', 'admin-api', 'game-services'],
    },
    sentry: {
        dns: process.env.SENTRY_DNS,
        release: process.env.SENTRY_RELEASE,
        env: process.env.ENV,
        logIdentifier: 'user-service',
    },
    prefixCharacterName: process.env.PREFIX_CHARACTER_NAME,
    middleSite: {
        auth: {
            uri: process.env.MIDDLE_SITE_AUTH_URI,
            clientId: 'game-server',
            clientSecret: 'gameserver@20luminet&',
        },
        apiUrl: process.env.MIDDLE_SITE_URI,
    },
    adminSecretKey: process.env.ADMIN_SECRET_KEY,
    gameResult: {
        url: process.env.GAME_RESULT_URL,
        clientId: 'Game Client',
        clientKey: process.env.GAME_RESULT_CLIENT_KEY,
    },
    systemName: process.env.SYSTEM_TYPE,
});
