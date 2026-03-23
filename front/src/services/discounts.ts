import api from './api';
import type { Discount } from '@/types';

export const discountsService = {
    async getDiscounts(params?: {
        search?: string;
        is_active?: boolean;
        type?: 'percent' | 'fixed';
    }): Promise<Discount[]> {
        const response = await api.get('/admin/discounts', { params });
        return response.data;
    },

    async getDiscount(id: number): Promise<Discount> {
        const response = await api.get(`/admin/discounts/${id}`);
        return response.data;
    },

    async createDiscount(payload: {
        code: string;
        name: string;
        description?: string;
        type: 'percent' | 'fixed';
        value: number;
        min_order_amount?: number;
        max_discount_amount?: number | null;
        start_date?: string | null;
        end_date?: string | null;
        is_active?: boolean;
    }): Promise<Discount> {
        const response = await api.post('/admin/discounts', payload);
        return response.data;
    },

    async updateDiscount(
        id: number,
        payload: Partial<{
            code: string;
            name: string;
            description?: string;
            type: 'percent' | 'fixed';
            value: number;
            min_order_amount: number;
            max_discount_amount: number | null;
            start_date: string | null;
            end_date: string | null;
            is_active: boolean;
        }>
    ): Promise<Discount> {
        const response = await api.put(`/admin/discounts/${id}`, payload);
        return response.data;
    },

    async deleteDiscount(id: number): Promise<void> {
        await api.delete(`/admin/discounts/${id}`);
    },
};
