import api from './api';
import type { Order, OrderStatus } from '@/types';

const ORDERS_CACHE_TTL_MS = 20000;
let ordersCache: Order[] | null = null;
let ordersCacheAt = 0;
let ordersInFlight: Promise<Order[]> | null = null;

const invalidateOrdersCache = () => {
    ordersCache = null;
    ordersCacheAt = 0;
};

export const ordersService = {
    async getOrders(options?: { force?: boolean }): Promise<Order[]> {
        const force = options?.force === true;
        const now = Date.now();

        if (!force && ordersCache && now - ordersCacheAt < ORDERS_CACHE_TTL_MS) {
            return ordersCache;
        }

        if (!force && ordersInFlight) {
            return ordersInFlight;
        }

        ordersInFlight = api.get('/orders')
            .then((response) => {
                const list = Array.isArray(response.data) ? response.data : [];
                ordersCache = list;
                ordersCacheAt = Date.now();
                return list;
            })
            .finally(() => {
                ordersInFlight = null;
            });

        return ordersInFlight;
    },

    async getOrder(id: number): Promise<Order> {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    async createOrder(data: Partial<Order>): Promise<Order> {
        const response = await api.post('/orders', data);
        invalidateOrdersCache();
        return response.data;
    },

    async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
        const response = await api.put(`/orders/${id}`, data);
        invalidateOrdersCache();
        return response.data;
    },

    async deleteOrder(id: number): Promise<void> {
        await api.delete(`/orders/${id}`);
        invalidateOrdersCache();
    },

    async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
        const response = await api.patch(`/orders/${id}/status`, { status });
        invalidateOrdersCache();
        return response.data;
    },
};
