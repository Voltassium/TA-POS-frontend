import api from './axiosInstance';

export interface Category {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface PaginationParams {
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
}

export interface PaginatedResponse<T> {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_previous: boolean;
    has_next: boolean;
    data: T[];
}

export const categoryApi = {
    async list(params?: PaginationParams) {
        const { data } = await api.get<{ data: PaginatedResponse<Category> }>('/categories', { params });
        return data.data;
    },

    async getById(id: string) {
        const { data } = await api.get<{ data: Category }>(`/categories/${id}`);
        return data.data;
    },

    async create(payload: { name: string }) {
        const { data } = await api.post<{ data: Category }>('/categories', payload);
        return data.data;
    },

    async update(id: string, payload: { name?: string }) {
        const { data } = await api.put(`/categories/${id}`, payload);
        return data;
    },

    async remove(id: string) {
        const { data } = await api.delete(`/categories/${id}`);
        return data;
    }
};
