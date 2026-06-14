import api from './axiosInstance';
import type { PaginatedResponse, PaginationParams } from './categoryApi';

export interface Product {
    id: number;
    category_id: number;
    category_name: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    is_available: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductCreatePayload {
    category_id: number;
    name: string;
    description?: string;
    price: number;
    stock?: number;
    is_available?: boolean;
}

export interface ProductListParams extends PaginationParams {
    category_id?: number;
}

export const productApi = {
    async list(params?: ProductListParams) {
        const { data } = await api.get<{ data: PaginatedResponse<Product> }>('/products', { params });
        return data.data;
    },

    async getById(id: number) {
        const { data } = await api.get<{ data: Product }>(`/products/${id}`);
        return data.data;
    },

    async create(payload: ProductCreatePayload) {
        const { data } = await api.post<{ data: Product }>('/products', payload);
        return data.data;
    },

    async update(id: number, payload: Partial<ProductCreatePayload>) {
        const { data } = await api.put(`/products/${id}`, payload);
        return data;
    },

    async remove(id: number) {
        const { data } = await api.delete(`/products/${id}`);
        return data;
    }
};
