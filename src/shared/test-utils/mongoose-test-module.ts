import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { disconnect } from 'mongoose';
import { ConfigService } from '@nestjs/config';

export const rootMongooseTestModule = (options: MongooseModuleOptions = {}) =>
    MongooseModule.forRootAsync({
        imports: [ConfigService],
        useFactory: async (configService: ConfigService) => {
            const uri = configService.get<string>('database.uri');
            const dbName = configService.get<string>('database.options.dbName');
            
            return {
                uri,
                dbName,
                ...options,
            };
        },
        inject: [ConfigService],
    });

export const closeInMongodConnection = async () => {
    await disconnect();
};
