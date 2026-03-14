import api from './api';

export interface Career {
    id: number;
    title: string;
    location: string;
    type: string;
    description: string;
    requirements: string | null;
    department: string | null;
    contactEmail: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const careersService = {
    // Public endpoint (no auth)
    async getPublicCareers(): Promise<Career[]> {
        const response = await api.get('/careers/public');
        return response.data || [];
    },

    // Admin endpoints
    async getCareers(): Promise<Career[]> {
        const response = await api.get('/admin/careers');
        return response.data || [];
    },

    async createCareer(data: {
        title: string;
        location: string;
        type: string;
        description: string;
        requirements?: string;
        department?: string;
        contact_email?: string;
        is_active?: boolean;
    }): Promise<Career> {
        const response = await api.post('/admin/careers', data);
        return response.data;
    },

    async updateCareer(id: number, data: Partial<{
        title: string;
        location: string;
        type: string;
        description: string;
        requirements: string;
        department: string;
        contact_email: string;
        is_active: boolean;
    }>): Promise<Career> {
        const response = await api.put(`/admin/careers/${id}`, data);
        return response.data;
    },

    async deleteCareer(id: number): Promise<void> {
        await api.delete(`/admin/careers/${id}`);
    },
};
