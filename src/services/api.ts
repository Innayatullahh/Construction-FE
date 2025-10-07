import { User, Task, CreateUserRequest, CreateTaskRequest, UpdateTaskRequest, CreateChecklistItemRequest, UpdateChecklistItemRequest } from '../types';
import { config } from '../config';

const API_BASE_URL = config.backendUrl + '/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', url, options);
    console.log('Full URL constructed:', url);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // User endpoints
  async createOrGetUser(request: CreateUserRequest): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  // Task endpoints
  async getTasksByUserId(userId: string): Promise<Task[]> {
    return this.request<Task[]>(`/tasks/user/${userId}`);
  }

  async getTaskById(id: string): Promise<Task> {
    const encodedId = encodeURIComponent(id);
    return this.request<Task>(`/tasks/${encodedId}`);
  }

  async createTask(userId: string, request: CreateTaskRequest): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...request, userId }),
    });
  }

  async updateTask(id: string, request: UpdateTaskRequest): Promise<Task> {
    const encodedId = encodeURIComponent(id);
    return this.request<Task>(`/tasks/${encodedId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteTask(id: string): Promise<void> {
    console.log('API deleteTask called with ID:', id);
    const encodedId = encodeURIComponent(id);
    console.log('Encoded ID:', encodedId);
    console.log('Constructed URL:', `/tasks/${encodedId}`);
    return this.request<void>(`/tasks/${encodedId}`, {
      method: 'DELETE',
    });
  }

  // Checklist endpoints
  async addChecklistItem(taskId: string, request: CreateChecklistItemRequest): Promise<any> {
    return this.request<any>(`/tasks/${taskId}/checklist`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateChecklistItem(taskId: string, itemId: string, request: UpdateChecklistItemRequest): Promise<any> {
    return this.request<any>(`/tasks/${taskId}/checklist/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/checklist/${itemId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
