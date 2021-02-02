import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import * as Sentry from "@sentry/node";
import helmet from "fastify-helmet";

import { AppModule } from "./app.module";
import { SentryLogger } from "./common/providers/logger.service";

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.ENV,
        maxValueLength: 5000,
        release: process.env.SENTRY_RELEASE ? `user-service@${process.env.SENTRY_RELEASE}` : '',
    });

    Sentry.captureMessage(`Logger started at ${new Date()}`);

    app.useLogger(app.get(SentryLogger));
    app.register(helmet, { contentSecurityPolicy: false });

    const corsWhiteList = process.env.CORS_WHITELIST.split(',');
    app.enableCors({
        origin: (origin, callback) => {
            if (corsWhiteList.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error(`Not allowed by CORS ${origin}`));
            }
        },
    });

    await app.listen(process.env.PORT || 3000);

    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
