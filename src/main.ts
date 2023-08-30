import { initializer, initSpanProcessor, addIdentifiers } from 'sc-instrument';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'fastify-helmet';
import { join } from 'path';

import { SentryLogger } from './common/providers/logger.service';
import { DomainService } from './domain/domain.service';

async function bootstrap() {
    if (process.env.ENABLE_OTEL) {
        initSpanProcessor(process.env.OTEL_EXPORTER ?? '', initializer);
        addIdentifiers(`${process.env.SYSTEM_TYPE} - User Service`, process.env.ENV ?? '', initializer);
        initializer.start();
    }

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    app.useLogger(app.get(SentryLogger));
    app.register(helmet, { contentSecurityPolicy: false, frameguard: false });
    app.useStaticAssets({
        root: join(__dirname, '..', 'public'),
    });
    app.setViewEngine({
        engine: {
            handlebars: require('handlebars'),
        },
        templates: join(__dirname, '..', 'views'),
    });

    const domain = app.get(DomainService);
    console.log(process.env.ENV.toLocaleLowerCase());

    app.enableCors({
        origin: (origin, callback) => {
            if (domain.isAllowAccess(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`Not allowed by CORS ${origin}`));
            }
        },
    });

    await app.init();

    const config = new DocumentBuilder()
        .setTitle('User Service')
        .setDescription('The User Service description')
        .setVersion('1.0')
        .addTag('user-service')
        .build();

    if (process.env.NODE_ENV !== 'PROD') {
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api', app, document);
    }

    await app.listen(process.env.PORT || 300, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
