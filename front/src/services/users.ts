import api from './api';
import type { User } from '@/types';

export const usersService = {
    async getUsers(): Promise<User[]> {
        const response = await api.get('/admin/users');
        return response.data;
    },

    async createUser(data: {
        name: string;
        email: string;
        password: string;
        role: string;
        phone?: string;
    }): Promise<User> {
        const response = await api.post('/admin/users', data);
        return response.data;
    },

    async updateUser(id: number, data: Partial<{
        name: string;
        email: string;
        password: string;
        role: string;
        phone?: string;
        is_active: boolean;
    }>): Promise<User> {
        const response = await api.put(`/admin/users/${id}`, data);
        return response.data;
    },

    async deleteUser(id: number): Promise<void> {
        await api.delete(`/admin/users/${id}`);
    },
};
