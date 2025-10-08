import React, { useState } from "react";
import { Task, TaskStatus } from "../types";
import { useTaskStore } from "../stores/taskStore";
import {
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (title: string, description?: string) => void;
}

const statusConfig = {
  "not-started": {
    color: "bg-gray-100 text-gray-700 border-gray-200",
    label: "Not Started",
  },
  "in-progress": {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    label: "In Progress",
  },
  blocked: {
    color: "bg-red-100 text-red-700 border-red-200",
    label: "Blocked",
  },
  "final-check-awaiting": {
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    label: "Final Check awaiting",
  },
  completed: {
    color: "bg-green-100 text-green-700 border-green-200",
    label: "Completed",
  },
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>("not-started");
  const { addChecklistItem, updateChecklistItem, deleteChecklistItem, deleteTask } =
    useTaskStore();

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    console.log('Creating task:', { title: newTaskTitle.trim(), description: newTaskDescription.trim() });
    onTaskCreate(newTaskTitle.trim(), newTaskDescription.trim() || undefined);
    setIsCreating(false);
    setNewTaskTitle("");
    setNewTaskDescription("");
  };

  const handleAddChecklistItem = async (taskId: string, text: string) => {
    if (!text.trim()) return;
    await addChecklistItem(taskId, text.trim());
  };

  const handleChecklistItemUpdate = async (
    taskId: string,
    itemId: string,
    updates: Partial<{ text: string; status: any }>
  ) => {
    await updateChecklistItem(taskId, itemId, updates);
  };

  const handleChecklistItemDelete = async (taskId: string, itemId: string) => {
    await deleteChecklistItem(taskId, itemId);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskStatus(task.status);
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editTaskTitle.trim()) return;

    await onTaskUpdate(editingTask.id, {
      title: editTaskTitle.trim(),
      description: editTaskDescription.trim() || undefined,
      status: editTaskStatus,
    });

    setEditingTask(null);
    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskStatus("not-started");
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskStatus("not-started");
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      console.log('Deleting task with ID:', taskId);
      await deleteTask(taskId);
      onTaskDelete(taskId);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm border border-construction-200">
      <div className="p-4 border-b border-construction-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-construction-900">
            Task Board
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-construction-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-construction-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TaskStatus | "all")
            }
            className="px-3 py-2 border border-construction-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4">
        {/* Create Task Form */}
        {isCreating && (
          <div className="mb-4 p-4 bg-construction-50 rounded-lg border border-construction-200">
            <h3 className="font-medium text-construction-900 mb-3">
              Create New Task
            </h3>
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
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-construction-300 text-construction-700 rounded-md hover:bg-construction-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Form */}
        {editingTask && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-construction-900 mb-3">
              Edit Task
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task title"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-construction-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
              <textarea
                placeholder="Task description (optional)"
                value={editTaskDescription}
                onChange={(e) => setEditTaskDescription(e.target.value)}
                className="w-full px-3 py-2 border border-construction-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
              <select
                value={editTaskStatus}
                onChange={(e) => setEditTaskStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-construction-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="final-check-awaiting">Final Check awaiting</option>
                <option value="completed">Completed</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTaskTitle.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-construction-300 text-construction-700 rounded-md hover:bg-construction-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-construction-500">
              {searchTerm || statusFilter !== "all"
                ? "No tasks match your filters"
                : "No tasks yet. Create your first task!"}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-construction-100 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          task.status === "not-started"
                            ? "bg-gray-400"
                            : task.status === "in-progress"
                            ? "bg-blue-500"
                            : task.status === "blocked"
                            ? "bg-red-500"
                            : task.status === "final-check-awaiting"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      ></div>
                      <h3 className="text-lg font-semibold text-construction-900">
                        {task.title}
                      </h3>
                    </div>
                    <div className="pb-3">
                      <span
                        className={`px-3 py-2 rounded-full text-xs font-medium ${
                          statusConfig[task.status].color
                        }`}
                      >
                        {statusConfig[task.status].label}
                      </span>
                    </div>

                    {/* Status Change Options */}
                    <div className="flex flex-col gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-construction-600">
                          Quick Change:
                        </span>
                        <button
                          onClick={() =>
                            onTaskUpdate(task.id, { status: "not-started" })
                          }
                          className={`p-1 rounded ${
                            task.status === "not-started"
                              ? "bg-gray-100 text-gray-700"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          title="Not Started"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            onTaskUpdate(task.id, { status: "in-progress" })
                          }
                          className={`p-1 rounded ${
                            task.status === "in-progress"
                              ? "bg-blue-100 text-blue-700"
                              : "text-blue-400 hover:text-blue-600"
                          }`}
                          title="In Progress"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            onTaskUpdate(task.id, { status: "blocked" })
                          }
                          className={`p-1 rounded ${
                            task.status === "blocked"
                              ? "bg-red-100 text-red-700"
                              : "text-red-400 hover:text-red-600"
                          }`}
                          title="Blocked"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            onTaskUpdate(task.id, { status: "final-check-awaiting" })
                          }
                          className={`p-1 rounded ${
                            task.status === "final-check-awaiting"
                              ? "bg-yellow-100 text-yellow-700"
                              : "text-yellow-400 hover:text-yellow-600"
                          }`}
                          title="Final Check Awaiting"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            onTaskUpdate(task.id, { status: "completed" })
                          }
                          className={`p-1 rounded ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "text-green-400 hover:text-green-600"
                          }`}
                          title="Completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Dropdown for status change */}
                      <div className="flex flex-col md:flex-row items-center gap-2">
                        <label className="text-xs text-construction-600">
                          Status:
                        </label>
                        <select
                          value={task.status}
                          onChange={(e) => {
                            onTaskUpdate(task.id, {
                              status: e.target.value as TaskStatus,
                            });
                          }}
                          className="text-xs px-2 py-1 border border-construction-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                          <option value="not-started">Not Started</option>
                          <option value="in-progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="final-check-awaiting">Final Check awaiting</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-construction-600 text-sm mb-3">
                        {task.description}
                      </p>
                    )}

                    {/* Checklist */}
                    {task.checklist.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-construction-800 flex items-center gap-2">
                            <span>Checklist</span>
                            <span className="text-xs text-construction-500">
                              ({task.checklist.length} items)
                            </span>
                          </h4>
                          <button className="text-construction-400 hover:text-construction-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-3">
                          {task.checklist.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 bg-construction-50 rounded-lg"
                            >
                              <button
                                onClick={() =>
                                  handleChecklistItemUpdate(task.id, item.id, {
                                    status:
                                      item.status === "completed"
                                        ? "not-started"
                                        : "completed",
                                  })
                                }
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  item.status === "completed"
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-construction-300 hover:border-construction-400"
                                }`}
                              >
                                {item.status === "completed" && (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                              </button>
                              <div className="flex-1">
                                <span
                                  className={`text-sm font-medium ${
                                    item.status === "completed"
                                      ? "line-through text-construction-500"
                                      : "text-construction-800"
                                  }`}
                                >
                                  {item.text}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      item.status === "not-started"
                                        ? "bg-gray-400"
                                        : item.status === "in-progress"
                                        ? "bg-blue-500"
                                        : item.status === "blocked"
                                        ? "bg-red-500"
                                        : item.status === "final-check-awaiting"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                  ></div>
                                  <span
                                    className={`text-xs ${
                                      item.status === "not-started"
                                        ? "text-gray-500"
                                        : item.status === "in-progress"
                                        ? "text-blue-600"
                                        : item.status === "blocked"
                                        ? "text-red-600"
                                        : item.status === "final-check-awaiting"
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {item.status === "not-started"
                                      ? "Not started"
                                      : item.status === "in-progress"
                                      ? "In progress"
                                      : item.status === "blocked"
                                      ? "Blocked"
                                      : item.status === "final-check-awaiting"
                                      ? "Final check awaiting"
                                      : "Completed"}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleChecklistItemDelete(task.id, item.id)
                                }
                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add checklist item */}
                        <div className="mt-4">
                          <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg border border-primary-200">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                              <Plus className="w-4 h-4 text-white" />
                            </div>
                            <input
                              type="text"
                              placeholder="Add new item"
                              className="flex-1 bg-transparent text-sm placeholder-construction-500 focus:outline-none"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  const input = e.target as HTMLInputElement;
                                  handleAddChecklistItem(task.id, input.value);
                                  input.value = "";
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-4 md:mt-0">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-blue-400 hover:text-blue-600"
                      title="Edit task"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-400 hover:text-red-600"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
