import { Domain, DomainDocument } from './schemas/domain.schema';
import { Inject, Injectable, CACHE_MANAGER } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { SentryLogger } from '../common/providers/logger.service';

@Injectable()
export class DomainService {
    private readonly corsCacheKey = 'CORS_WHITELIST';
    private readonly cacheTimeOut = +process.env.CACHE_TIMEOUT_CORS * 60;
    private cachedDomains = '';

    constructor(
        @InjectModel(Domain.name)
        private readonly domainModel: Model<DomainDocument>,
        @Inject(SentryLogger) private readonly logger: SentryLogger,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {
        this.getDomains();
    }

    async getDomains() {
        try {
            const cacheCors = await this.cacheManager.get(this.corsCacheKey);
            if (cacheCors) {
                return cacheCors;
            }

            const domains = await this.domainModel.findOne({}).lean().exec();
            const configuredDomains = domains.value;
            this.cachedDomains = configuredDomains;
            await this.cacheManager.set(this.corsCacheKey, configuredDomains, { ttl: this.cacheTimeOut });

            return configuredDomains;
        } catch (error) {
            this.logger.error(error);

            return '';
        }
    }

    isAllowAccess(origin) {
        const disableCors = process.env.DISABLE_CORS.toLocaleLowerCase() === 'true';
        if (disableCors) {
            return true;
        }

        const mainDomain = this.getMainDomain(origin);
        return !mainDomain || !this.cachedDomains || this.cachedDomains.includes(mainDomain);
    }

    getMainDomain(domain) {
        if (!domain) {
            return '';
        }

        domain = domain.replace(/^https?:\/\//, '');

        const domainParts = domain.split('.');
        if (domainParts.length < 2) {
            return '';
        }
        return `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`;
    }

    @Cron('*/10 * * * *')
    async handleCron() {
        try {
            await this.getDomains();
        } catch (error) {
            this.logger.error(`Error in scheduled getDomains: ${error.message}`);
        }
    }
}
