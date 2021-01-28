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
    api: {
        apiUrl: 'http://api.lumigame.com',
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 4500,
    },
    logIdentifier: 'user-service',
});
