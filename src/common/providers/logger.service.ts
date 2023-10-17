import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

interface SentryConfig {
    dns: string;
    env: string;
    release: string;
    logIdentifier: string;
}

@Injectable()
export class SentryLogger implements LoggerService {
    private readonly config: SentryConfig;

    constructor(private readonly configService: ConfigService) {
        this.config = this.configService.get<SentryConfig>('sentry');
        Sentry.init({
            dsn: this.config.dns,
            environment: this.config.env,
            maxValueLength: 5000,
            release: this.config.release ? `user-service@${this.config.release}` : '',
        });

        Sentry.captureMessage(`Logger started at ${new Date()}`);
    }

    log(message: string, context = Sentry.Severity.Info) {
        Sentry.captureMessage(message, context);
    }

    error(exception: any) {
        if (
            typeof exception === 'string' ||
            exception instanceof String ||
            (exception && exception.message == null && exception.stack == null)
        ) {
            this.log(`${this.config.logIdentifier} ${exception}`, Sentry.Severity.Error);
        } else {
            if (!exception) {
                exception = `Exception is null at ${new Date()}`;
            }

            Sentry.captureException(exception);
        }
    }

    warn(message: string) {
        Sentry.captureMessage(`${this.config.logIdentifier} ${message}`, Sentry.Severity.Warning);
    }

    debug?(message: string) {
        Sentry.captureMessage(`${this.config.logIdentifier} ${message}`, Sentry.Severity.Debug);
    }

    verbose?(message: string) {
        Sentry.captureMessage(`${this.config.logIdentifier} ${message}`, Sentry.Severity.Log);
    }

    composeBeforeCallMessage(session, params) {
        const characterName = session && session.characterName ? `\n\tCharacter: ${session.characterName} ` : '';
        return `Before Action at ${new Date()}: \n\tSession: ${JSON.stringify(session)} ${characterName}\n\tParams:${JSON.stringify(
            params,
        )}`;
    }

    logAfterSendToApi(action, params, result, beforeMessage: string, logLevel) {
        const messages = [
            `Account ${params.SiteId}_${params.PlayerId} performs ${action} at ${new Date()}`,
            '',
            beforeMessage,
            `\nAction Result: ${JSON.stringify(result)}`,
        ];

        const joinedMessages = messages.join('\n');
        Sentry.captureMessage(joinedMessages, logLevel);
    }
}
