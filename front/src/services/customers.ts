import api from './api';
import type { Customer } from '@/types';

export const customersService = {
    async getCustomers(): Promise<Customer[]> {
        const response = await api.get('/customers');
        return response.data;
    },

    async getCustomer(id: number): Promise<Customer> {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },

    async createCustomer(data: Partial<Customer>): Promise<Customer> {
        const response = await api.post('/customers', data);
        return response.data;
    },

    async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    },

    async deleteCustomer(id: number): Promise<void> {
        await api.delete(`/customers/${id}`);
    },
};
