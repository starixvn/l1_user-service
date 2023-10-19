import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import path from 'path';

let mongod: MongoMemoryServer;

process.env = Object.assign(process.env, {
    MONGOMS_SYSTEM_BINARY: path.join(
        '..',
        '..',
        'node_modules',
        '.cache',
        'mongodb-memory-server-core',
        'mongodb-binaries',
        '*', // MongoDB version is expanded
        'mongod.exe',
    ),
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
    mongod && (await mongod.stop());
};
