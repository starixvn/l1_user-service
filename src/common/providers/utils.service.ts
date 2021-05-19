import { Injectable } from "@nestjs/common";

@Injectable()
export class UtilsService {
    normalizeIP(ip: string) {
        let result = ip;
        if (ip && ip.includes(',')) {
            result = ip.split(',')[0].trim();
        }

        if (result.substr(0, 7) === '::ffff:') {
            result = result.substr(7);
        }

        return result;
    }
}
