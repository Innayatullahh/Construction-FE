import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { userSchema, taskSchema, syncStateSchema } from './schema';
import { User, Task } from '../types';

// Add required plugins
addRxPlugin(RxDBUpdatePlugin);

export type DatabaseCollections = {
  users: RxCollection<User>;
  tasks: RxCollection<Task>;
  syncstate: RxCollection<{ id: string; lastSync: string; isOnline: boolean }>;
};

export type Database = RxDatabase<DatabaseCollections>;

let database: Database | null = null;

export async function createDatabase(): Promise<Database> {
  if (database) {
    return database;
  }

  const db = await createRxDatabase<DatabaseCollections>({
    name: 'constructiondb',
    storage: getRxStorageDexie(),
    ignoreDuplicate: true,
  });

  await db.addCollections({
    users: {
      schema: userSchema,
    },
    tasks: {
      schema: taskSchema,
    },
    syncstate: {
      schema: syncStateSchema,
    },
  });

  database = db;
  return db;
}

export async function getDatabase(): Promise<Database> {
  if (!database) {
    return await createDatabase();
  }
  return database;
}
