import { Injectable, LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Sentry from "@sentry/node";

@Injectable()
export class SentryLogger implements LoggerService {
    private logIdentifier: string;

    constructor(private readonly configService: ConfigService) {
        this.logIdentifier = this.configService.get('logIdentifier');
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
            this.log(`${this.logIdentifier} ${exception}`, Sentry.Severity.Error);
        } else {
            if (!exception) {
                exception = `Exception is null at ${new Date()}`;
            }

            Sentry.captureException(exception);
        }
    }

    warn(message: string) {
        Sentry.captureMessage(`${this.logIdentifier} ${message}`, Sentry.Severity.Warning);
    }

    debug?(message: string) {
        Sentry.captureMessage(`${this.logIdentifier} ${message}`, Sentry.Severity.Debug);
    }

    verbose?(message: string) {
        Sentry.captureMessage(`${this.logIdentifier} ${message}`, Sentry.Severity.Log);
    }
}
