import mongoose from 'mongoose';
import Log from 'simpl-loggar';
export default class MongoConnection {
    _migrationClient;
    get migrationClient() {
        return this._migrationClient;
    }
    set migrationClient(value) {
        this._migrationClient = value;
    }
    async init(uri) {
        await this.startServer(uri);
        return this.createMigrationClient(uri);
    }
    async disconnect() {
        await mongoose.disconnect();
        if (this.migrationClient)
            await this.migrationClient.close();
    }
    async startServer(uri) {
        await mongoose.connect(uri, {
            dbName: 'Gateway',
        });
        Log.log('Mongo', 'Started server');
    }
    createMigrationClient(uri) {
        return mongoose.createConnection(uri, {
            dbName: 'Migrations',
        });
    }
}
