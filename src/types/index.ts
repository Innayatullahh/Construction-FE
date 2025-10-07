export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  position?: {
    x: number;
    y: number;
  };
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  status: ChecklistStatus;
  createdAt: string;
}

export type TaskStatus = 'not-started' | 'in-progress' | 'blocked' | 'completed';
export type ChecklistStatus = 'not-started' | 'in-progress' | 'blocked' | 'completed';

export interface CreateUserRequest {
  name: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  position?: {
    x: number;
    y: number;
  };
}

export interface CreateChecklistItemRequest {
  text: string;
}

export interface UpdateChecklistItemRequest {
  text?: string;
  status?: ChecklistStatus;
}
