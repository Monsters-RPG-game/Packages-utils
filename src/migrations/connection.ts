import mongoose from 'mongoose';
import Log from 'simpl-loggar';
import type { Connection, ConnectOptions } from 'mongoose';

export default class MongoConnection {
  private _migrationClient: Connection | undefined;

  private get migrationClient(): Connection | undefined {
    return this._migrationClient;
  }

  private set migrationClient(value: Connection | undefined) {
    this._migrationClient = value;
  }

  async init(uri: string): Promise<Connection> {
    await this.startServer(uri);
    return this.createMigrationClient(uri);
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    if (this.migrationClient) await this.migrationClient.close();
  }

  private async startServer(uri: string): Promise<void> {
    await mongoose.connect(uri, {
      dbName: 'Gateway',
    } as ConnectOptions);
    Log.log('Mongo', 'Started server');
  }

  private createMigrationClient(uri: string): Connection {
    return mongoose.createConnection(uri, {
      dbName: 'Migrations',
    } as ConnectOptions);
  }
}
