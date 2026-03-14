import api from './api';

export interface NotificationData {
    id: number;
    type: 'order' | 'delivery' | 'invoice' | 'stock' | 'system';
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: string;
}

export const notificationsService = {
    async getAll(): Promise<NotificationData[]> {
        const response = await api.get('/notifications');
        return response.data;
    },

    async getUnreadCount(): Promise<number> {
        const response = await api.get('/notifications/unread-count');
        return response.data.count;
    },

    async markAsRead(id: number): Promise<void> {
        await api.patch(`/notifications/${id}/read`);
    },

    async markAllRead(): Promise<void> {
        await api.post('/notifications/mark-all-read');
    },

    async remove(id: number): Promise<void> {
        await api.delete(`/notifications/${id}`);
    },

    async clearAll(): Promise<void> {
        await api.delete('/notifications');
    },
};
