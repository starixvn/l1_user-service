import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        return `Hello from ${process.env.ENV} - ${process.env.SYSTEM_TYPE}`;
    }
}
