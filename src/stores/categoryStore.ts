import { defineStore } from 'pinia';
import { categoryApi } from '@/api/categoryApi';
import type { Category, PaginationParams } from '@/api/categoryApi';
import { loadCache, queueMutation, saveCache } from '@/utils/offlineDb';
import type { AxiosError } from 'axios';

const CACHE_KEY = 'categories';

interface CategoryState {
    categories: Category[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
    isFromCache: boolean;
}

export const useCategoryStore = defineStore('category', {
    state: (): CategoryState => ({
        categories: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false,
        isFromCache: false
    }),

    actions: {
        async fetchCategories(params?: PaginationParams) {
            this.loading = true;
            try {
                const result = await categoryApi.list(params);
                this.categories = result.data;
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
                        this.categories = cached.data;
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
         * Create a category. Offline: optimistic update + queue mutation.
         * Returns `{ offline: true }` when queued, or the created category.
         */
        async createCategory(payload: { name: string }): Promise<Category | { offline: true }> {
            try {
                const created = await categoryApi.create(payload);
                return created;
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    // Optimistic update
                    const mutationId = crypto.randomUUID();
                    const temp: Category = {
                        id: `offline-${mutationId}`,
                        name: payload.name,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    this.categories.unshift(temp);
                    this.totalItems++;

                    await queueMutation({
                        mutationId,
                        method: 'POST',
                        url: '/categories',
                        payload,
                        entity: 'category',
                        label: `Tambah kategori "${payload.name}"`
                    });

                    return { offline: true };
                }
                throw err;
            }
        },

        /**
         * Update a category. Offline: optimistic update + queue mutation.
         * Returns `{ offline: true }` when queued.
         */
        async updateCategory(
            id: string,
            payload: { name?: string }
        ): Promise<void | { offline: true }> {
            try {
                await categoryApi.update(id, payload);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    // Optimistic update in local state
                    const idx = this.categories.findIndex((c) => c.id === id);
                    if (idx !== -1) {
                        this.categories[idx] = { ...this.categories[idx], ...payload };
                    }

                    // Don't queue mutations for temp offline-created items
                    if (!id.startsWith('offline-')) {
                        await queueMutation({
                            mutationId: crypto.randomUUID(),
                            method: 'PUT',
                            url: `/categories/${id}`,
                            payload,
                            entity: 'category',
                            label: `Update kategori "${payload.name ?? id}"`
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
        async deleteCategory(id: string) {
            await categoryApi.remove(id);
        }
    }
});
