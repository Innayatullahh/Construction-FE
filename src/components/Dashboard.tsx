import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { FloorPlan } from './FloorPlan';
import { TaskBoard } from './TaskBoard';
import { syncService } from '../services/syncService';
import { LogOut, Wifi, WifiOff } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, setError } = useTaskStore();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  useEffect(() => {
    console.log('Dashboard: useEffect triggered, user:', user);
    if (user) {
      console.log('Dashboard: User is logged in, fetching tasks for:', user.id);
      fetchTasks(user.id);
    } else {
      console.log('Dashboard: No user logged in');
    }
  }, [user, fetchTasks]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync service will handle its own debouncing
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTaskCreate = async (title: string, description?: string, position?: { x: number; y: number }) => {
    if (!user) {
      console.error('No user logged in - cannot create task');
      setError('You must be logged in to create tasks');
      return;
    }
    
    console.log('Dashboard: Creating task for user:', user.id, { title, description, position });
    try {
      await createTask(user.id, title, description, position);
      console.log('Dashboard: Task created successfully');
    } catch (error) {
      console.error('Dashboard: Task creation failed:', error);
      setError('Failed to create task');
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      await updateTask(taskId, updates);
    } catch (error) {
      console.error('Dashboard: updateTask failed:', error);
      setError('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      setError('Failed to delete task');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-construction-800 to-construction-600 bg-clip-text text-transparent">
                  Construction Management
                </h1>
                <p className="text-sm text-construction-600">
                  Welcome back, <span className="font-medium text-construction-800">{user.name}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Online/Offline indicator */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Offline</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-construction-600 hover:text-construction-900 hover:bg-construction-100 rounded-lg transition-all duration-200 border border-construction-200 hover:border-construction-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-construction-900">{tasks.length}</p>
                <p className="text-sm text-construction-600">Total Tasks</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-construction-900">{tasks.filter(t => t.status === 'completed').length}</p>
                <p className="text-sm text-construction-600">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-construction-900">{tasks.filter(t => t.status === 'in-progress').length}</p>
                <p className="text-sm text-construction-600">In Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Floor Plan */}
          <div className="lg:col-span-7">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-construction-100">
                <h2 className="text-lg font-semibold text-construction-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Floor Plan
                </h2>
                <p className="text-sm text-construction-600 mt-1">Interactive construction site layout</p>
              </div>
              <div className="p-6">
                <FloorPlan
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  onTaskCreate={handleTaskCreate}
                />
              </div>
            </div>
          </div>
          
          {/* Task Board */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-construction-100">
                <h2 className="text-lg font-semibold text-construction-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Task Board
                </h2>
                <p className="text-sm text-construction-600 mt-1">Manage your construction tasks</p>
              </div>
              <div className="p-6">
                <TaskBoard
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  onTaskCreate={handleTaskCreate}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
