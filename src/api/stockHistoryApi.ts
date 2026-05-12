import api from './axiosInstance';
import type { PaginatedResponse, PaginationParams } from './categoryApi';

export interface StockHistory {
    id: number;
    product_id: number;
    product_name: string;
    change: number;
    reason: string;
    created_at: string;
}

export interface StockHistoryListParams extends PaginationParams {
    product_id?: number;
    search?: string;
}

export const stockHistoryApi = {
    async list(params?: StockHistoryListParams) {
        const { data } = await api.get<{ data: PaginatedResponse<StockHistory> }>('/stock-histories', { params });
        return data.data;
    }
};
