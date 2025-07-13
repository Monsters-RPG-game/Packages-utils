import type { Connection } from 'mongoose';
export default class MongoConnection {
    private _migrationClient;
    private get migrationClient();
    private set migrationClient(value);
    init(uri: string): Promise<Connection>;
    disconnect(): Promise<void>;
    private startServer;
    private createMigrationClient;
}
