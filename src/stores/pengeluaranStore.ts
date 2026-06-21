import { defineStore } from 'pinia';
import { pengeluaranApi } from '@/api/pengeluaranApi';
import type { Pengeluaran, PengeluaranCreatePayload, PengeluaranUpdatePayload, PengeluaranListParams } from '@/api/pengeluaranApi';

interface PengeluaranState {
    items: Pengeluaran[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
}

export const usePengeluaranStore = defineStore('pengeluaran', {
    state: (): PengeluaranState => ({
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false
    }),

    actions: {
        async fetchItems(params?: PengeluaranListParams) {
            this.loading = true;
            try {
                const result = await pengeluaranApi.list(params);
                this.items = result.data;
                this.totalItems = result.total_items;
                this.totalPages = result.total_pages;
                this.currentPage = result.current_page;
            } finally {
                this.loading = false;
            }
        },

        async createItem(payload: PengeluaranCreatePayload) {
            return await pengeluaranApi.create(payload);
        },

        async updateItem(id: string, payload: PengeluaranUpdatePayload) {
            await pengeluaranApi.update(id, payload);
        },

        async deleteItem(id: string) {
            await pengeluaranApi.remove(id);
        }
    }
});
