import { create } from 'zustand';
import { Task, TaskStatus, ChecklistStatus } from '../types';
import { getDatabase } from '../database';
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
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      
      // Try to fetch from backend first
      try {
        const serverTasks = await apiService.getTasksByUserId(userId);
        // Store server tasks in local database
        for (const task of serverTasks) {
          await db.tasks.upsert(task);
        }
        set({ tasks: serverTasks, isLoading: false });
        return;
      } catch (apiError) {
        console.warn('Failed to fetch tasks from backend, using local data:', apiError);
      }
      
      // Fallback to local database
      const tasks = await db.tasks.find({
        selector: { userId },
        sort: [{ createdAt: 'desc' }],
      }).exec();
      
      set({ tasks: tasks.map(doc => doc.toJSON() as Task), isLoading: false });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ error: 'Failed to fetch tasks', isLoading: false });
    }
  },

  createTask: async (userId: string, title: string, description?: string, position?: { x: number; y: number }) => {
    try {
      const db = await getDatabase();
      
      // Try to create task on backend first
      let newTask: Task;
      try {
        newTask = await apiService.createTask(userId, {
          title,
          description,
          position,
        });
      } catch (apiError) {
        console.warn('Failed to create task on backend, creating locally:', apiError);
        // Fallback to local creation
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
      }

      // Store in local database
      await db.tasks.insert(newTask);
      
      // Update local state
      set(state => ({
        tasks: [newTask, ...state.tasks]
      }));
    } catch (error) {
      console.error('Error creating task:', error);
      set({ error: 'Failed to create task' });
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
      const db = await getDatabase();
      const task = await db.tasks.findOne(taskId).exec();
      
      if (task) {
        await task.remove();
        
        // Update local state
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId)
        }));
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

  setError: (error: string | null) => set({ error }),
}));
