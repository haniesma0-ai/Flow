import api from './api';
import type { Invoice, InvoiceStatus } from '@/types';

export const invoicesService = {
    async getInvoices(): Promise<Invoice[]> {
        const response = await api.get('/invoices');
        return response.data;
    },

    async getInvoice(id: number): Promise<Invoice> {
        const response = await api.get(`/invoices/${id}`);
        return response.data;
    },

    async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
        const response = await api.post('/invoices', data);
        return response.data;
    },

    async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice> {
        const response = await api.put(`/invoices/${id}`, data);
        return response.data;
    },

    async deleteInvoice(id: number): Promise<void> {
        await api.delete(`/invoices/${id}`);
    },

    async updateInvoiceStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
        const response = await api.patch(`/invoices/${id}/status`, { status });
        return response.data;
    },
};
