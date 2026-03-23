import api from './api';
import type { Incident } from '@/types';

interface IncidentQuery {
    incident_status?: 'open' | 'in_review' | 'resolved';
    delivery_status?: string;
    search?: string;
}

export const incidentsService = {
    async getIncidents(query?: IncidentQuery): Promise<Incident[]> {
        const response = await api.get('/incidents', { params: query });
        return response.data;
    },

    async getIncident(deliveryId: number): Promise<Incident> {
        const response = await api.get(`/incidents/${deliveryId}`);
        return response.data;
    },

    async createIncident(
        deliveryId: number,
        payload: {
            incident_report: string;
            incident_status?: 'open' | 'in_review' | 'resolved';
            incident_resolution_notes?: string;
        }
    ): Promise<Incident> {
        const response = await api.post(`/deliveries/${deliveryId}/incident`, payload);
        return response.data;
    },

    async updateIncident(
        deliveryId: number,
        payload: {
            incident_report?: string;
            incident_status?: 'open' | 'in_review' | 'resolved';
            incident_resolution_notes?: string;
        }
    ): Promise<Incident> {
        const response = await api.put(`/incidents/${deliveryId}`, payload);
        return response.data;
    },

    async deleteIncident(deliveryId: number): Promise<void> {
        await api.delete(`/incidents/${deliveryId}`);
    },
};
