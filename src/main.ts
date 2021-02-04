import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import * as Sentry from "@sentry/node";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import helmet from "fastify-helmet";

import { AppModule } from "./app.module";
import { SentryLogger } from "./common/providers/logger.service";
import { NODE_ENV, PORT, SENTRY_DSN, SENTRY_RELEASE } from "./environments";

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: NODE_ENV,
        maxValueLength: 5000,
        release: SENTRY_RELEASE ? `user-service@${SENTRY_RELEASE}` : '',
    });

    Sentry.captureMessage(`Logger started at ${new Date()}`);
    app.useLogger(app.get(SentryLogger));

    app.use(compression());
    app.register(helmet, { contentSecurityPolicy: false });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    await app.listen(PORT);

    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
