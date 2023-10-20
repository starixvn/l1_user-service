import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { join } from 'path';
import { disconnect } from 'mongoose';

let mongod: MongoMemoryServer;

process.env = Object.assign(process.env, {
    MONGOMS_SYSTEM_BINARY: join('mongo', 'mongod.exe'),
    MONGOMS_RUNTIME_DOWNLOAD: false,
});

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
