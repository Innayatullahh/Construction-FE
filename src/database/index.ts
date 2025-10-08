import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { userSchema, taskSchema, syncStateSchema } from './schema';
import { User, Task } from '../types';

// Add required plugins
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

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
      migrationStrategies: {
        1: (oldDoc: any) => {
          // Migration from version 0 to 1: Add final-check-awaiting status support
          return oldDoc;
        }
      }
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

export async function clearDatabase(): Promise<void> {
  if (database) {
    await database.destroy();
    database = null;
  }
  // Clear IndexedDB storage
  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      const deleteReq = window.indexedDB.deleteDatabase('constructiondb');
      await new Promise((resolve, reject) => {
        deleteReq.onsuccess = () => resolve(undefined);
        deleteReq.onerror = () => reject(deleteReq.error);
      });
    } catch (error) {
      console.warn('Could not clear IndexedDB:', error);
    }
  }
}
