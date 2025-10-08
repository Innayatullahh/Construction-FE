import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { useTaskStore } from '../stores/taskStore';
import { Edit, Trash2, CheckCircle, Clock, AlertCircle, XCircle, Eye } from 'lucide-react';
import Draggable from 'react-draggable';

interface TaskCardProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

const statusConfig = {
  'not-started': { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Not Started' },
  'in-progress': { color: 'bg-blue-100 text-blue-700', icon: Edit, label: 'In Progress' },
  'blocked': { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Blocked' },
  'final-check-awaiting': { color: 'bg-yellow-100 text-yellow-700', icon: Eye, label: 'Final Check awaiting' },
  'completed': { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showChecklist, setShowChecklist] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const { addChecklistItem, updateChecklistItem, deleteChecklistItem } = useTaskStore();

  const handleSave = () => {
    onUpdate({
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const handleStatusChange = (status: TaskStatus) => {
    onUpdate({ status });
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    
    await addChecklistItem(task.id, newChecklistItem.trim());
    setNewChecklistItem('');
  };

  const handleChecklistItemUpdate = async (itemId: string, updates: Partial<{ text: string; status: any }>) => {
    await updateChecklistItem(task.id, itemId, updates);
  };

  const handleChecklistItemDelete = async (itemId: string) => {
    await deleteChecklistItem(task.id, itemId);
  };

  const StatusIcon = statusConfig[task.status].icon;
  const statusColor = statusConfig[task.status].color;

  return (
    <Draggable
      defaultPosition={task.position || { x: 0, y: 0 }}
      onStop={(e, data) => onUpdate({ position: { x: data.x, y: data.y } })}
    >
      <div 
        data-task-id={task.id}
        className="absolute bg-white border border-construction-300 rounded-lg shadow-lg min-w-[280px] max-w-[320px] z-10"
      >
        {/* Header */}
        <div className="p-3 border-b border-construction-200">
          <div className="flex items-start justify-between">
            {isEditing ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-2 py-1 border border-construction-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-2 py-1 border border-construction-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleSave}
                    className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-2 py-1 bg-construction-300 text-construction-700 text-xs rounded hover:bg-construction-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="font-medium text-construction-900 text-sm">{task.title}</h3>
                {task.description && (
                  <p className="text-construction-600 text-xs mt-1">{task.description}</p>
                )}
              </div>
            )}
            
            {!isEditing && (
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-construction-400 hover:text-construction-600"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-construction-700">Status:</span>
            <div className="flex gap-1">
              {Object.entries(statusConfig).map(([status, config]) => {
                const Icon = config.icon;
                const isActive = status === task.status;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as TaskStatus)}
                    className={`p-2 rounded transition-all ${
                      isActive 
                        ? statusColor + ' shadow-sm' 
                        : 'text-construction-400 hover:text-construction-600 hover:bg-construction-50'
                    }`}
                    title={`Set to ${config.label}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowChecklist(!showChecklist)}
                className="text-xs font-medium text-construction-700 hover:text-construction-900"
              >
                Checklist ({task.checklist.length})
              </button>
            </div>

            {showChecklist && (
              <div className="space-y-2">
                {task.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleChecklistItemUpdate(item.id, { 
                        status: item.status === 'completed' ? 'not-started' : 'completed' 
                      })}
                      className={`p-1 rounded ${
                        item.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-construction-400 hover:text-construction-600'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    <span className={`text-xs flex-1 ${
                      item.status === 'completed' ? 'line-through text-construction-500' : 'text-construction-700'
                    }`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => handleChecklistItemDelete(item.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add checklist item"
                    className="flex-1 px-2 py-1 border border-construction-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                  />
                  <button
                    onClick={handleAddChecklistItem}
                    disabled={!newChecklistItem.trim()}
                    className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
};
