import api from './axiosInstance';

export interface Category {
    id: number;
    name: string;
    image_url: string;
    created_at: string;
    updated_at: string;
}

export interface PaginationParams {
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
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

    async getById(id: number) {
        const { data } = await api.get<{ data: Category }>(`/categories/${id}`);
        return data.data;
    },

    async create(payload: { name: string; image_url?: string }) {
        const { data } = await api.post<{ data: Category }>('/categories', payload);
        return data.data;
    },

    async update(id: number, payload: { name?: string; image_url?: string }) {
        const { data } = await api.put(`/categories/${id}`, payload);
        return data;
    },

    async remove(id: number) {
        const { data } = await api.delete(`/categories/${id}`);
        return data;
    }
};
