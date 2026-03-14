import api from './api';
import type { Product } from '@/types';

export const productsService = {
    async getProducts(): Promise<Product[]> {
        const response = await api.get('/products');
        return response.data;
    },

    async getProduct(id: number): Promise<Product> {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    async createProduct(data: Partial<Product>): Promise<Product> {
        const response = await api.post('/products', data);
        return response.data;
    },

    async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },

    async deleteProduct(id: number): Promise<void> {
        await api.delete(`/products/${id}`);
    },
};
