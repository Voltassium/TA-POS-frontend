import api from './axiosInstance';
import type { PaginatedResponse, PaginationParams } from './categoryApi';

export type ProductType = 'Kulakan' | 'Olahan';

export interface Product {
    id: string;
    category_id: string;
    category_name: string;
    product_type: ProductType;
    sku?: string | null;
    harga_beli?: number | null;
    name: string;
    description: string;
    price: number;
    stock: number;
    is_available: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductCreatePayload {
    category_id: string;
    product_type: ProductType;
    sku?: string | null;
    harga_beli?: number | null;
    name: string;
    description?: string;
    price: number;
    stock?: number;
    is_available?: boolean;
}

export interface ProductListParams extends PaginationParams {
    category_id?: string;
    product_type?: ProductType;
}

export const productApi = {
    async list(params?: ProductListParams) {
        const { data } = await api.get<{ data: PaginatedResponse<Product> }>('/products', { params });
        return data.data;
    },

    async getById(id: string) {
        const { data } = await api.get<{ data: Product }>(`/products/${id}`);
        return data.data;
    },

    async create(payload: ProductCreatePayload) {
        const { data } = await api.post<{ data: Product }>('/products', payload);
        return data.data;
    },

    async update(id: string, payload: Partial<ProductCreatePayload>) {
        const { data } = await api.put(`/products/${id}`, payload);
        return data;
    },

    async remove(id: string) {
        const { data } = await api.delete(`/products/${id}`);
        return data;
    }
};
