import { apiService } from './api';
import { getDatabase } from '../database';
import { Task, User } from '../types';

export class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private lastSyncTime: number = 0;
  private syncDebounceTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.debouncedSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Initial sync check
    this.debouncedSync();
  }

  private debouncedSync() {
    // Clear existing timeout
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
    }

    // Debounce sync calls to prevent too frequent syncing
    this.syncDebounceTimeout = setTimeout(() => {
      this.sync();
    }, 1000); // Wait 1 second before syncing
  }

  async sync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    // Rate limiting: don't sync more than once every 5 seconds
    const now = Date.now();
    if (now - this.lastSyncTime < 5000) {
      console.log('Sync rate limited, skipping...');
      return;
    }

    this.syncInProgress = true;
    this.lastSyncTime = now;

    try {
      const db = await getDatabase();
      
      // Get all local tasks that need syncing
      const localTasks = await db.tasks.find({
        selector: {},
        sort: [{ updatedAt: 'desc' }],
      }).exec();

      // Get all local users
      const localUsers = await db.users.find({
        selector: {},
      }).exec();

      // Sync users first
      for (const userDoc of localUsers) {
        const user = userDoc.toJSON();
        try {
          await apiService.getUserById(user.id);
        } catch (error) {
          // User doesn't exist on server, create it
          try {
            await apiService.createOrGetUser({ name: user.name });
          } catch (createError) {
            console.error('Error syncing user:', createError);
          }
        }
      }

      // Sync tasks - only sync tasks that were created on the server
      for (const taskDoc of localTasks) {
        const task = taskDoc.toJSON();
        
        // Skip local-only tasks (those with local IDs starting with 'task_')
        if (task.id.startsWith('task_')) {
          // This is a local-only task, try to create it on server
          try {
            await apiService.createTask(task.userId, {
              title: task.title,
              description: task.description,
              position: task.position,
            });
          } catch (createError) {
            console.error('Error creating local task on server:', createError);
          }
          continue;
        }
        
        // For server-created tasks, try to get them from server
        try {
          await apiService.getTaskById(task.id);
        } catch (error) {
          // Task doesn't exist on server, create it
          try {
            await apiService.createTask(task.userId, {
              title: task.title,
              description: task.description,
              position: task.position,
            });
          } catch (createError) {
            console.error('Error syncing task:', createError);
          }
        }
      }

      // Update sync state
      await db.syncstate.upsert({
        id: 'sync_state',
        lastSync: new Date().toISOString(),
        isOnline: this.isOnline,
      });

    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async pullFromServer(userId: string): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    try {
      const db = await getDatabase();
      
      // Fetch tasks from server
      const serverTasks = await apiService.getTasksByUserId(userId);
      
      // Update local database
      for (const serverTask of serverTasks) {
        await db.tasks.upsert(serverTask);
      }

    } catch (error) {
      console.error('Error pulling from server:', error);
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const syncService = new SyncService();
