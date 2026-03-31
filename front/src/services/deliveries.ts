import api from './api';
import type { Delivery, DeliveryStatus, CashSummary, DriverLocation } from '@/types';

const DELIVERIES_CACHE_TTL_MS = 15000;
let deliveriesCache: Delivery[] | null = null;
let deliveriesCacheAt = 0;
let deliveriesInFlight: Promise<Delivery[]> | null = null;

export const invalidateDeliveriesCache = () => {
    deliveriesCache = null;
    deliveriesCacheAt = 0;
    deliveriesInFlight = null;
};

export const deliveriesService = {
    async getDeliveries(options?: { force?: boolean }): Promise<Delivery[]> {
        const force = options?.force === true;
        const now = Date.now();

        if (!force && deliveriesCache && now - deliveriesCacheAt < DELIVERIES_CACHE_TTL_MS) {
            return deliveriesCache;
        }

        if (!force && deliveriesInFlight) {
            return deliveriesInFlight;
        }

        deliveriesInFlight = api.get('/deliveries')
            .then((response) => {
                const list = Array.isArray(response.data) ? response.data : [];
                deliveriesCache = list;
                deliveriesCacheAt = Date.now();
                return list;
            })
            .finally(() => {
                deliveriesInFlight = null;
            });

        return deliveriesInFlight;
    },

    async getDelivery(id: number): Promise<Delivery> {
        const response = await api.get(`/deliveries/${id}`);
        return response.data;
    },

    async createDelivery(data: Partial<Delivery>): Promise<Delivery> {
        const response = await api.post('/deliveries', data);
        invalidateDeliveriesCache();
        return response.data;
    },

    async updateDelivery(id: number, data: Partial<Delivery>): Promise<Delivery> {
        const response = await api.put(`/deliveries/${id}`, data);
        invalidateDeliveriesCache();
        return response.data;
    },

    async deleteDelivery(id: number): Promise<void> {
        await api.delete(`/deliveries/${id}`);
        invalidateDeliveriesCache();
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
        invalidateDeliveriesCache();
        return response.data;
    },

    /** Driver confirms COD payment collection.
     *  GPS coordinates are REQUIRED by the backend — the driver must be
     *  physically present at the delivery location. */
    async confirmPayment(
        id: number,
        data: { collected_amount: number; latitude: number; longitude: number }
    ): Promise<Delivery> {
        const response = await api.post(`/deliveries/${id}/confirm-payment`, data);
        invalidateDeliveriesCache();
        return response.data;
    },

    /** Capture customer digital signature */
    async captureSignature(
        id: number,
        data: { signature_data: string; latitude?: number; longitude?: number }
    ): Promise<Delivery> {
        const response = await api.post(`/deliveries/${id}/capture-signature`, data);
        invalidateDeliveriesCache();
        return response.data;
    },

    /** Update driver GPS location during delivery */
    async updateLocation(
        id: number,
        data: { latitude: number; longitude: number }
    ): Promise<void> {
        await api.post(`/deliveries/${id}/update-location`, data);
        invalidateDeliveriesCache();
    },

    /** Driver submits cash summary at end of round */
    async submitCashSummary(deliveryIds: number[]): Promise<CashSummary> {
        const response = await api.post('/deliveries/cash-summary', {
            delivery_ids: deliveryIds,
        });
        invalidateDeliveriesCache();
        return response.data;
    },

    /** Admin verifies cash for a delivery */
    async verifyCash(id: number): Promise<Delivery> {
        const response = await api.post(`/deliveries/${id}/verify-cash`);
        invalidateDeliveriesCache();
        return response.data;
    },

    /** Admin gets real-time driver locations */
    async trackDrivers(): Promise<DriverLocation[]> {
        const response = await api.get('/deliveries/track-drivers');
        return response.data;
    },
};
