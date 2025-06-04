import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { disconnect } from 'mongoose';

let mongod: MongoMemoryServer;

export const rootMongooseTestModule = (options: MongooseModuleOptions = {}) =>
    MongooseModule.forRootAsync({
        useFactory: async () => {
            mongod = await MongoMemoryServer.create();
            const mongoUri = mongod.getUri();

            return {
                uri: mongoUri,
                ...options,
            };
        },
    });

export const closeInMongodConnection = async () => {
    await disconnect();
    mongod && (await mongod.stop());
};
