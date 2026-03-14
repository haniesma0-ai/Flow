import api from './api';
import type { DashboardStats } from '@/types';

export type { DashboardStats };

export const dashboardService = {
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await api.get('/stats/dashboard');
        return response.data;
    },

    async getSalesStats(): Promise<Record<string, unknown>> {
        const response = await api.get('/stats/sales');
        return response.data;
    },

    async getProductStats(): Promise<Record<string, unknown>> {
        const response = await api.get('/stats/products');
        return response.data;
    },
};
