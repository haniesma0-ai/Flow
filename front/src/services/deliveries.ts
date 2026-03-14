import api from './api';
import type { Delivery, DeliveryStatus, CashSummary, DriverLocation } from '@/types';

export const deliveriesService = {
    async getDeliveries(): Promise<Delivery[]> {
        const response = await api.get('/deliveries');
        return response.data;
    },

    async getDelivery(id: number): Promise<Delivery> {
        const response = await api.get(`/deliveries/${id}`);
        return response.data;
    },

    async createDelivery(data: Partial<Delivery>): Promise<Delivery> {
        const response = await api.post('/deliveries', data);
        return response.data;
    },

    async updateDelivery(id: number, data: Partial<Delivery>): Promise<Delivery> {
        const response = await api.put(`/deliveries/${id}`, data);
        return response.data;
    },

    async deleteDelivery(id: number): Promise<void> {
        await api.delete(`/deliveries/${id}`);
    },

    async updateDeliveryStatus(
        id: number,
        status: DeliveryStatus,
        location?: { latitude: number; longitude: number }
    ): Promise<Delivery> {
        const response = await api.patch(`/deliveries/${id}/status`, {
            status,
            ...location,
        });
        return response.data;
    },

    /** Driver confirms COD payment collection */
    async confirmPayment(
        id: number,
        data: { collected_amount: number; latitude: number; longitude: number }
    ): Promise<Delivery> {
        const response = await api.post(`/deliveries/${id}/confirm-payment`, data);
        return response.data;
    },

    /** Capture customer digital signature */
    async captureSignature(
        id: number,
        data: { signature_data: string; latitude?: number; longitude?: number }
    ): Promise<Delivery> {
        const response = await api.post(`/deliveries/${id}/capture-signature`, data);
        return response.data;
    },

    /** Update driver GPS location during delivery */
    async updateLocation(
        id: number,
        data: { latitude: number; longitude: number }
    ): Promise<void> {
        await api.post(`/deliveries/${id}/update-location`, data);
    },

    /** Driver submits cash summary at end of round */
    async submitCashSummary(deliveryIds: number[]): Promise<CashSummary> {
        const response = await api.post('/deliveries/cash-summary', {
            delivery_ids: deliveryIds,
        });
        return response.data;
    },

    /** Admin verifies cash for a delivery */
    async verifyCash(id: number): Promise<Delivery> {
        const response = await api.post(`/deliveries/${id}/verify-cash`);
        return response.data;
    },

    /** Admin gets real-time driver locations */
    async trackDrivers(): Promise<DriverLocation[]> {
        const response = await api.get('/deliveries/track-drivers');
        return response.data;
    },
};
