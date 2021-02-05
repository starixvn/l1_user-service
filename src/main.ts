import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as Sentry from "@sentry/node";
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

    const config = new DocumentBuilder()
        .setTitle('User Service')
        .setDescription('The User Service description')
        .setVersion('1.0')
        .addTag('user-service')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(PORT);

    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
