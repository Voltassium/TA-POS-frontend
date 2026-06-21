import api from './axiosInstance';
import type { PaginatedResponse, PaginationParams } from './categoryApi';

export interface Pengeluaran {
    id: string;
    store_id: number;
    tanggal: string;
    category: string;
    description?: string | null;
    amount: number;
    created_by: string;
    created_at: string;
}

export interface PengeluaranCreatePayload {
    tanggal: string;
    category: string;
    description?: string | null;
    amount: number;
}

export interface PengeluaranUpdatePayload {
    tanggal?: string;
    category?: string;
    description?: string | null;
    amount?: number;
}

export interface PengeluaranListParams extends PaginationParams {
    start_date?: string;
    end_date?: string;
}

export const pengeluaranApi = {
    async list(params?: PengeluaranListParams) {
        const { data } = await api.get<{ data: PaginatedResponse<Pengeluaran> }>('/pengeluaran', { params });
        return data.data;
    },

    async getById(id: string) {
        const { data } = await api.get<{ data: Pengeluaran }>(`/pengeluaran/${id}`);
        return data.data;
    },

    async create(payload: PengeluaranCreatePayload) {
        const { data } = await api.post<{ data: Pengeluaran }>('/pengeluaran', payload);
        return data.data;
    },

    async update(id: string, payload: PengeluaranUpdatePayload) {
        const { data } = await api.put(`/pengeluaran/${id}`, payload);
        return data;
    },

    async remove(id: string) {
        const { data } = await api.delete(`/pengeluaran/${id}`);
        return data;
    }
};
