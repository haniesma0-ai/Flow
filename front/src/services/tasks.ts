import api from './api';
import type { Task, TaskStatus } from '@/types';

export const tasksService = {
    async getTasks(): Promise<Task[]> {
        const response = await api.get('/tasks');
        return response.data;
    },

    async getTask(id: number): Promise<Task> {
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },

    async createTask(data: Partial<Task>): Promise<Task> {
        const response = await api.post('/tasks', data);
        return response.data;
    },

    async updateTask(id: number, data: Partial<Task>): Promise<Task> {
        const response = await api.put(`/tasks/${id}`, data);
        return response.data;
    },

    async deleteTask(id: number): Promise<void> {
        await api.delete(`/tasks/${id}`);
    },

    async updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
        const response = await api.patch(`/tasks/${id}/status`, { status });
        return response.data;
    },
};
