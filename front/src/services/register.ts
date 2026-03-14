import api from './api';

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export const registerService = {
    async register(data: RegisterData) {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
};
