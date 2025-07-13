import type { IMigrationFile } from '../../types/index.js';
export default class Migrations {
    private readonly _client;
    private _migrationClient;
    constructor();
    private get migrationClient();
    private set migrationClient(value);
    private get client();
    private getLastMigration;
    /**
     * Run migrations.
     * @param migrations Migrations to run.
     * @param target Service to target. Eg.: Gateway.
     * @param mongoUrl Link to mongoDB.
     */
    init(migrations: Record<string, IMigrationFile>, target: string, mongoUrl: string): Promise<void>;
    disconnect(): void;
    private migrate;
    private saveChanges;
}
