import { defineStore } from 'pinia';
import { categoryApi } from '@/api/categoryApi';
import type { Category, PaginationParams } from '@/api/categoryApi';

interface CategoryState {
    categories: Category[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
}

export const useCategoryStore = defineStore('category', {
    state: (): CategoryState => ({
        categories: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false
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
            } finally {
                this.loading = false;
            }
        },

        async createCategory(payload: { name: string }) {
            const created = await categoryApi.create(payload);
            return created;
        },

        async updateCategory(id: string, payload: { name?: string }) {
            await categoryApi.update(id, payload);
        },

        async deleteCategory(id: string) {
            await categoryApi.remove(id);
        }
    }
});
