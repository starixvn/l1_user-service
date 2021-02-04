import * as dotenv from "dotenv";

dotenv.config();

export const NODE_ENV: string = process.env.NODE_ENV || 'development';
export const PORT = +process.env.PORT || 5000;

export const SENTRY_DSN: string = process.env.SENTRY_DSN;
export const SENTRY_RELEASE: string = process.env.SENTRY_RELEASE;
