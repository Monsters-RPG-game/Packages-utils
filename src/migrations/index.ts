import Log from 'simpl-loggar';
import MongoConnection from './connection.js';
import getModel from './model.js';
import type { IMigrationFile } from '../../types/index.js';
import type { Connection } from 'mongoose';

export default class Migrations {
  private readonly _client: MongoConnection;

  private _migrationClient: Connection | undefined;
  constructor() {
    this._client = new MongoConnection();
  }

  private get migrationClient(): Connection | undefined {
    return this._migrationClient;
  }

  private set migrationClient(value: Connection | undefined) {
    this._migrationClient = value;
  }

  private get client(): MongoConnection {
    return this._client;
  }

  private async getLastMigration(dbName: string): Promise<string[]> {
    const Model = getModel(this.migrationClient as Connection);
    const entry = await Model.find({ dbName });

    return entry.map((e) => e.changes).flat();
  }

  /**
   * Run migrations.
   * @param migrations Migrations to run.
   * @param target Service to target. Eg.: Gateway.
   * @param mongoUrl Link to mongoDB.
   */
  async init(migrations: Record<string, IMigrationFile>, target: string, mongoUrl: string): Promise<void> {
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

  disconnect(): void {
    this.client.disconnect().catch((err) => {
      Log.error('Migrations', 'Could not disconnect. Is mongo down?', err);
    });
  }

  private async migrate(toMigrate: [string, IMigrationFile][]): Promise<void> {
    let migrationName = '';
    let down: (() => Promise<void>) | undefined;
    const succeeded: string[] = [];

    try {
      await Promise.all(
        toMigrate.map(async ([k, v]) => {
          migrationName = k;
          down = (): Promise<void> => v.down();
          const result = await v.up();
          if (typeof result === 'number') {
            Log.log('Migration', `${k} finished. Inserted ${result} entries`);
          }
          succeeded.push(k);
        }),
      );
      await this.saveChanges(succeeded);
    } catch (err) {
      Log.error('Migrations', `Could not migrate ${migrationName}`, (err as Error).message);
      if (down) {
        Log.log('Migration', 'Migrating down');
        await down();
      } else {
        Log.log('Migration', 'Migrate down does not exist. Is file corrupted?');
      }
    }
  }

  private async saveChanges(changes: string[]): Promise<void> {
    const Model = getModel(this.migrationClient as Connection);
    const newElement = new Model({ changes, dbName: 'Gateway' });
    await newElement.save();
  }
}
