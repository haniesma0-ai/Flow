import api from './api';

export interface LoginData {
    email: string;
    password: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'commercial' | 'chauffeur' | 'client' | 'user';
    phone?: string;
    avatar?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export const authService = {
    async login(data: LoginData): Promise<AuthResponse> {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    async getMe(): Promise<User> {
        const response = await api.get('/auth/me');
        return response.data;
    },
};
