import api from './api';
import type { Order, OrderStatus } from '@/types';

export const ordersService = {
    async getOrders(): Promise<Order[]> {
        const response = await api.get('/orders');
        return response.data;
    },

    async getOrder(id: number): Promise<Order> {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    async createOrder(data: Partial<Order>): Promise<Order> {
        const response = await api.post('/orders', data);
        return response.data;
    },

    async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
        const response = await api.put(`/orders/${id}`, data);
        return response.data;
    },

    async deleteOrder(id: number): Promise<void> {
        await api.delete(`/orders/${id}`);
    },

    async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
        const response = await api.patch(`/orders/${id}/status`, { status });
        return response.data;
    },
};
