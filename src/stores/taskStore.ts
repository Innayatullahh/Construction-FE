import { create } from 'zustand';
import { Task, ChecklistStatus } from '../types';
import { getDatabase, clearDatabase } from '../database';
import { apiService } from '../services/api';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: (userId: string) => Promise<void>;
  createTask: (userId: string, title: string, description?: string, position?: { x: number; y: number }) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addChecklistItem: (taskId: string, text: string) => Promise<void>;
  updateChecklistItem: (taskId: string, itemId: string, updates: Partial<{ text: string; status: ChecklistStatus }>) => Promise<void>;
  deleteChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  cleanupDuplicates: (userId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearDatabaseAndRetry: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (userId: string) => {
    console.log('TaskStore: Starting to fetch tasks for user:', userId);
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      console.log('TaskStore: Database connection established for fetch');
      
      // Clean up any existing duplicates first
      await get().cleanupDuplicates(userId);
      
      // Try to fetch from backend first
      try {
        console.log('TaskStore: Attempting to fetch tasks from backend...');
        const serverTasks = await apiService.getTasksByUserId(userId);
        console.log('TaskStore: Received tasks from backend:', serverTasks.length, 'tasks');
        
        // Store server tasks in local database using upsert to prevent duplicates
        for (const task of serverTasks) {
          await db.tasks.upsert(task);
        }
        
        // Get all tasks from local database to include any local-only tasks
        const allTasks = await db.tasks.find({
          selector: { userId },
          sort: [{ createdAt: 'desc' }],
        }).exec();
        
        console.log('TaskStore: Total tasks in local database:', allTasks.length);
        set({ tasks: allTasks.map(doc => doc.toJSON() as Task), isLoading: false });
        return;
      } catch (apiError) {
        console.warn('TaskStore: Failed to fetch tasks from backend, using local data:', apiError);
      }
      
      // Fallback to local database
      console.log('TaskStore: Falling back to local database...');
      const tasks = await db.tasks.find({
        selector: { userId },
        sort: [{ createdAt: 'desc' }],
      }).exec();
      
      console.log('TaskStore: Local tasks found:', tasks.length);
      set({ tasks: tasks.map(doc => doc.toJSON() as Task), isLoading: false });
    } catch (error) {
      console.error('TaskStore: Error fetching tasks:', error);
      set({ error: 'Failed to fetch tasks', isLoading: false });
    }
  },

  createTask: async (userId: string, title: string, description?: string, position?: { x: number; y: number }) => {
    console.log('TaskStore: Starting task creation', { userId, title, description, position });
    try {
      const db = await getDatabase();
      console.log('TaskStore: Database connection established');
      
      // Try to create task on backend first
      let newTask: Task;
      try {
        console.log('TaskStore: Attempting to create task on backend...');
        newTask = await apiService.createTask(userId, {
          title,
          description,
          position,
        });
        // Use upsert to prevent duplicates when storing backend-created task
        await db.tasks.upsert(newTask);
        console.log('TaskStore: Task created successfully on server:', newTask.id);
      } catch (apiError) {
        console.warn('TaskStore: Failed to create task on backend, creating locally:', apiError);
        // Fallback to local creation with local ID
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newTask = {
          id: taskId,
          userId,
          title,
          description,
          status: 'not-started',
          position,
          checklist: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        // Insert local-only task
        await db.tasks.insert(newTask);
        console.log('TaskStore: Task created locally with ID:', taskId);
      }
      
      // Update local state
      console.log('TaskStore: Updating local state with new task');
      set(state => ({
        tasks: [newTask, ...state.tasks]
      }));
      console.log('TaskStore: Task creation completed successfully');
    } catch (error) {
      console.error('TaskStore: Error creating task:', error);
      // Check if it's a schema error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'DB6') {
        console.log('TaskStore: Schema error detected, clearing database...');
        await get().clearDatabaseAndRetry();
        set({ error: 'Database schema updated. Please try creating the task again.' });
      } else {
        set({ error: 'Failed to create task' });
      }
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>) => {
    try {
      const db = await getDatabase();
      const task = await db.tasks.findOne(taskId).exec();
      
      if (task) {
        // Update local database first
        await task.incrementalModify((doc) => {
          Object.assign(doc, updates);
          doc.updatedAt = new Date().toISOString();
          return doc;
        });
        
        // Update local state
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          )
        }));

        // Sync with backend API
        try {
          await apiService.updateTask(taskId, updates);
        } catch (apiError) {
          console.warn('Failed to sync with backend:', apiError);
          // Don't throw error - local update succeeded
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      set({ error: 'Failed to update task' });
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      console.log('Store deleteTask called with ID:', taskId);
      const db = await getDatabase();
      const task = await db.tasks.findOne(taskId).exec();
      
      if (task) {
        // Delete from local database first
        await task.remove();
        
        // Update local state
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId)
        }));

        // Sync with backend API
        try {
          console.log('Calling API deleteTask with ID:', taskId);
          await apiService.deleteTask(taskId);
        } catch (apiError) {
          console.warn('Failed to sync delete with backend:', apiError);
          // Don't throw error - local delete succeeded
        }
      } else {
        console.warn('Task not found in local database:', taskId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ error: 'Failed to delete task' });
    }
  },

  addChecklistItem: async (taskId: string, text: string) => {
    try {
      const db = await getDatabase();
      const task = await db.tasks.findOne(taskId).exec();
      
      if (task) {
        await task.incrementalModify((doc) => {
          const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text,
            status: 'not-started' as ChecklistStatus,
            createdAt: new Date().toISOString(),
          };
          
          doc.checklist = [...doc.checklist, newItem];
          doc.updatedAt = new Date().toISOString();
          return doc;
        });
        
        // Update local state
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { 
                  ...t, 
                  checklist: [...t.checklist, {
                    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    text,
                    status: 'not-started' as ChecklistStatus,
                    createdAt: new Date().toISOString(),
                  }], 
                  updatedAt: new Date().toISOString() 
                }
              : t
          )
        }));
      }
    } catch (error) {
      console.error('Error adding checklist item:', error);
      set({ error: 'Failed to add checklist item' });
    }
  },

  updateChecklistItem: async (taskId: string, itemId: string, updates: Partial<{ text: string; status: ChecklistStatus }>) => {
    try {
      const db = await getDatabase();
      const task = await db.tasks.findOne(taskId).exec();
      
      if (task) {
        await task.incrementalModify((doc) => {
          const updatedChecklist = doc.checklist.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          );
          doc.checklist = updatedChecklist;
          doc.updatedAt = new Date().toISOString();
          return doc;
        });
        
        // Update local state
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { 
                  ...t, 
                  checklist: t.checklist.map(item => 
                    item.id === itemId ? { ...item, ...updates } : item
                  ), 
                  updatedAt: new Date().toISOString() 
                }
              : t
          )
        }));

        // Sync with backend API
        try {
          await apiService.updateChecklistItem(taskId, itemId, updates);
        } catch (apiError) {
          console.warn('Failed to sync checklist item with backend:', apiError);
        }
      }
    } catch (error) {
      console.error('Error updating checklist item:', error);
      set({ error: 'Failed to update checklist item' });
    }
  },

  deleteChecklistItem: async (taskId: string, itemId: string) => {
    try {
      const db = await getDatabase();
      const task = await db.tasks.findOne(taskId).exec();
      
      if (task) {
        await task.incrementalModify((doc) => {
          doc.checklist = doc.checklist.filter(item => item.id !== itemId);
          doc.updatedAt = new Date().toISOString();
          return doc;
        });
        
        // Update local state
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { 
                  ...t, 
                  checklist: t.checklist.filter(item => item.id !== itemId), 
                  updatedAt: new Date().toISOString() 
                }
              : t
          )
        }));
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      set({ error: 'Failed to delete checklist item' });
    }
  },

  cleanupDuplicates: async (userId: string) => {
    try {
      const db = await getDatabase();
      
      // Get all tasks for the user
      const allTasks = await db.tasks.find({
        selector: { userId },
      }).exec();
      
      // Group tasks by title and description to find duplicates
      const taskGroups = new Map<string, Task[]>();
      
      allTasks.forEach(doc => {
        const task = doc.toJSON() as Task;
        const key = `${task.title}|${task.description || ''}`;
        
        if (!taskGroups.has(key)) {
          taskGroups.set(key, []);
        }
        taskGroups.get(key)!.push(task);
      });
      
      // Remove duplicates, keeping the most recent one
      for (const [, tasks] of taskGroups) {
        if (tasks.length > 1) {
          // Sort by updatedAt (most recent first)
          tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          
          // Keep the first (most recent) task, remove the rest
          const tasksToRemove = tasks.slice(1);
          
          for (const taskToRemove of tasksToRemove) {
            const doc = await db.tasks.findOne(taskToRemove.id).exec();
            if (doc) {
              await doc.remove();
              console.log(`Removed duplicate task: ${taskToRemove.title}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
    }
  },

  setError: (error: string | null) => set({ error }),

  clearDatabaseAndRetry: async () => {
    console.log('TaskStore: Clearing database due to schema error...');
    try {
      await clearDatabase();
      console.log('TaskStore: Database cleared successfully');
      set({ error: null, tasks: [] });
    } catch (error) {
      console.error('TaskStore: Error clearing database:', error);
      set({ error: 'Failed to clear database. Please refresh the page.' });
    }
  },
}));
