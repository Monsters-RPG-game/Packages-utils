import Log from 'simpl-loggar';
import MongoConnection from './connection.js';
import getModel from './model.js';
export default class Migrations {
    _client;
    _migrationClient;
    constructor() {
        this._client = new MongoConnection();
    }
    get migrationClient() {
        return this._migrationClient;
    }
    set migrationClient(value) {
        this._migrationClient = value;
    }
    get client() {
        return this._client;
    }
    async getLastMigration(dbName) {
        const Model = getModel(this.migrationClient);
        const entry = await Model.find({ dbName });
        return entry.map((e) => e.changes).flat();
    }
    /**
     * Run migrations.
     * @param migrations Migrations to run.
     * @param target Service to target. Eg.: Gateway.
     * @param mongoUrl Link to mongoDB.
     */
    async init(migrations, target, mongoUrl) {
        this.migrationClient = await this.client.init(mongoUrl);
        const lastMigration = await this.getLastMigration(target);
        const toRun = Object.entries(migrations).filter(([k]) => {
            return !lastMigration.includes(k);
        });
        if (toRun.length === 0) {
            Log.log('Migrations', 'Nothing to migrate');
            return;
        }
        await this.migrate(toRun);
    }
    disconnect() {
        this.client.disconnect().catch((err) => {
            Log.error('Migrations', 'Could not disconnect. Is mongo down?', err);
        });
    }
    async migrate(toMigrate) {
        let migrationName = '';
        let down;
        const succeeded = [];
        try {
            await Promise.all(toMigrate.map(async ([k, v]) => {
                migrationName = k;
                down = () => v.down();
                const result = await v.up();
                if (typeof result === 'number') {
                    Log.log('Migration', `${k} finished. Inserted ${result} entries`);
                }
                succeeded.push(k);
            }));
            await this.saveChanges(succeeded);
        }
        catch (err) {
            Log.error('Migrations', `Could not migrate ${migrationName}`, err.message);
            if (down) {
                Log.log('Migration', 'Migrating down');
                await down();
            }
            else {
                Log.log('Migration', 'Migrate down does not exist. Is file corrupted?');
            }
        }
    }
    async saveChanges(changes) {
        const Model = getModel(this.migrationClient);
        const newElement = new Model({ changes, dbName: 'Gateway' });
        await newElement.save();
    }
}
