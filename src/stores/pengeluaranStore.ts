import { defineStore } from 'pinia';
import { pengeluaranApi } from '@/api/pengeluaranApi';
import type {
    Pengeluaran,
    PengeluaranCreatePayload,
    PengeluaranUpdatePayload,
    PengeluaranListParams
} from '@/api/pengeluaranApi';
import { loadCache, queueMutation, saveCache } from '@/utils/offlineDb';
import type { AxiosError } from 'axios';

const CACHE_KEY = 'pengeluaran';

interface PengeluaranState {
    items: Pengeluaran[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
    isFromCache: boolean;
}

export const usePengeluaranStore = defineStore('pengeluaran', {
    state: (): PengeluaranState => ({
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false,
        isFromCache: false
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
                this.isFromCache = false;
                await saveCache(CACHE_KEY, result);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    const cached = await loadCache<typeof result>(CACHE_KEY);
                    if (cached) {
                        this.items = cached.data;
                        this.totalItems = cached.total_items;
                        this.totalPages = cached.total_pages;
                        this.currentPage = cached.current_page;
                        this.isFromCache = true;
                        return;
                    }
                }
                throw err;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Create pengeluaran. Offline: optimistic update + queue mutation.
         */
        async createItem(
            payload: PengeluaranCreatePayload
        ): Promise<Pengeluaran | { offline: true }> {
            try {
                return await pengeluaranApi.create(payload);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    const mutationId = crypto.randomUUID();
                    const temp: Pengeluaran = {
                        id: `offline-${mutationId}`,
                        store_id: 0,
                        tanggal: payload.tanggal,
                        category: payload.category,
                        description: payload.description ?? null,
                        amount: payload.amount,
                        created_by: '',
                        created_at: new Date().toISOString()
                    };
                    this.items.unshift(temp);
                    this.totalItems++;

                    await queueMutation({
                        mutationId,
                        method: 'POST',
                        url: '/pengeluaran',
                        payload,
                        entity: 'pengeluaran',
                        label: `Tambah pengeluaran "${payload.category}" Rp${payload.amount.toLocaleString('id-ID')}`
                    });

                    return { offline: true };
                }
                throw err;
            }
        },

        /**
         * Update pengeluaran. Offline: optimistic update + queue mutation.
         */
        async updateItem(
            id: string,
            payload: PengeluaranUpdatePayload
        ): Promise<void | { offline: true }> {
            try {
                await pengeluaranApi.update(id, payload);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    const idx = this.items.findIndex((i) => i.id === id);
                    if (idx !== -1) {
                        this.items[idx] = { ...this.items[idx], ...payload };
                    }

                    if (!id.startsWith('offline-')) {
                        await queueMutation({
                            mutationId: crypto.randomUUID(),
                            method: 'PUT',
                            url: `/pengeluaran/${id}`,
                            payload,
                            entity: 'pengeluaran',
                            label: `Update pengeluaran`
                        });
                    }

                    return { offline: true };
                }
                throw err;
            }
        },

        /**
         * Delete is NOT supported offline.
         * The caller (page) must check `isOffline` before calling this.
         */
        async deleteItem(id: string) {
            await pengeluaranApi.remove(id);
        }
    }
});
