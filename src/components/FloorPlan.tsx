import React, { useState, useRef } from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import { Grid3X3 } from 'lucide-react';

interface FloorPlanProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (title: string, description?: string, position?: { x: number; y: number }) => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  const handleFloorPlanClick = (e: React.MouseEvent) => {
    if (isCreating) return;
    
    const rect = floorPlanRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setClickPosition({ x, y });
    setIsCreating(true);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    
    onTaskCreate(newTaskTitle.trim(), newTaskDescription.trim() || undefined, clickPosition || undefined);
    setIsCreating(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setClickPosition(null);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setClickPosition(null);
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm border border-construction-200">
      <div className="p-4 border-b border-construction-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-construction-900 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Floor Plan
          </h2>
          <div className="text-sm text-construction-500">
            Click on the floor plan to add tasks
          </div>
        </div>
        
        {/* Legend and Stats */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-construction-600 font-medium">Status:</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-4 h-5 bg-gradient-to-b from-gray-500 to-gray-600 rounded-t-full rounded-b-full border border-white shadow-sm"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-3 border-l-transparent border-r-transparent border-t-gray-500"></div>
              </div>
              <span className="text-construction-600">Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-4 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-t-full rounded-b-full border border-white shadow-sm"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-3 border-l-transparent border-r-transparent border-t-blue-500"></div>
              </div>
              <span className="text-construction-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-4 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-t-full rounded-b-full border border-white shadow-sm"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-3 border-l-transparent border-r-transparent border-t-red-500"></div>
              </div>
              <span className="text-construction-600">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-4 h-5 bg-gradient-to-b from-green-500 to-green-600 rounded-t-full rounded-b-full border border-white shadow-sm"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-3 border-l-transparent border-r-transparent border-t-green-500"></div>
              </div>
              <span className="text-construction-600">Completed</span>
            </div>
          </div>
          
          {/* Task Statistics */}
          <div className="flex items-center gap-4 text-xs text-construction-600">
            <span>Tasks: {tasks.length}</span>
            <span>On Floor: {tasks.filter(task => task.position).length}</span>
            <span>Completed: {tasks.filter(task => task.status === 'completed').length}</span>
          </div>
        </div>
      </div>
      
      <div 
        ref={floorPlanRef}
        className="relative w-full h-[600px] bg-gradient-to-br from-construction-50 to-construction-100 border-2 border-dashed border-construction-300 cursor-crosshair"
        onClick={handleFloorPlanClick}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Construction site elements */}
        <div className="absolute inset-4">
          {/* Building outline */}
          <div className="absolute top-4 left-4 w-32 h-32 border-2 border-construction-400 bg-construction-200/50 rounded"></div>
          <div className="absolute top-4 right-4 w-24 h-24 border-2 border-construction-400 bg-construction-200/50 rounded"></div>
          <div className="absolute bottom-4 left-4 w-40 h-20 border-2 border-construction-400 bg-construction-200/50 rounded"></div>
          <div className="absolute bottom-4 right-4 w-28 h-28 border-2 border-construction-400 bg-construction-200/50 rounded"></div>
        </div>

        {/* Task markers - Location Pin Style */}
        {tasks.filter(task => task.position).map((task) => (
          <div
            key={`marker-${task.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-full z-10 cursor-pointer hover:scale-110 transition-all duration-200"
            style={{
              left: task.position?.x,
              top: task.position?.y,
            }}
            title={`${task.title} - ${task.status}`}
            onClick={(e) => {
              e.stopPropagation();
              // Focus on the task card
              const taskCard = document.querySelector(`[data-task-id="${task.id}"]`);
              if (taskCard) {
                taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          >
            {/* Location Pin */}
            <div className="relative">
              {/* Pin Shadow */}
              <div className="absolute top-2 left-1 w-6 h-8 bg-black/20 rounded-full blur-sm"></div>
              
              {/* Main Pin Body */}
              <div className={`relative w-8 h-10 rounded-t-full rounded-bl-full border-2 border-white shadow-lg ${
                task.status === 'not-started' ? 'bg-gradient-to-b from-gray-500 to-gray-600' :
                task.status === 'in-progress' ? 'bg-gradient-to-b from-blue-500 to-blue-600' :
                task.status === 'blocked' ? 'bg-gradient-to-b from-red-500 to-red-600' :
                'bg-gradient-to-b from-green-500 to-green-600'
              }`}>
                {/* Inner Circle */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/30 rounded-full border border-white/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                
                {/* Status Indicator */}
                {task.checklist.filter(item => item.status === 'completed').length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Urgent Indicator - for tasks with many checklist items */}
                {task.checklist.length > 3 && (
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-500 rounded-full border border-white animate-pulse"></div>
                )}
              </div>
              
              {/* Pin Point */}
              <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent ${
                task.status === 'not-started' ? 'border-t-gray-500' :
                task.status === 'in-progress' ? 'border-t-blue-500' :
                task.status === 'blocked' ? 'border-t-red-500' :
                task.status === 'final-check-awaiting' ? 'border-t-yellow-500' :
                'border-t-green-500'
              }`}></div>
            </div>
          </div>
        ))}

        {/* Task cards */}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={(updates) => onTaskUpdate(task.id, updates)}
            onDelete={() => onTaskDelete(task.id)}
          />
        ))}

        {/* Create task form */}
        {isCreating && (
          <div 
            className="absolute bg-white border border-construction-300 rounded-lg shadow-lg p-4 min-w-[300px] z-10"
            style={{
              left: clickPosition?.x,
              top: clickPosition?.y,
            }}
          >
            <h3 className="font-medium text-construction-900 mb-3">Create New Task</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-construction-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
              <textarea
                placeholder="Task description (optional)"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full px-3 py-2 border border-construction-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={handleCancelCreate}
                  className="flex-1 bg-construction-300 text-construction-700 px-3 py-2 rounded-md hover:bg-construction-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
