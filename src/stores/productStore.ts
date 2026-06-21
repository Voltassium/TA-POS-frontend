import { defineStore } from 'pinia';
import { productApi } from '@/api/productApi';
import type { Product, ProductCreatePayload, ProductListParams } from '@/api/productApi';

interface ProductState {
    products: Product[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
}

export const useProductStore = defineStore('product', {
    state: (): ProductState => ({
        products: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false
    }),

    actions: {
        async fetchProducts(params?: ProductListParams) {
            this.loading = true;
            try {
                const result = await productApi.list(params);
                this.products = result.data;
                this.totalItems = result.total_items;
                this.totalPages = result.total_pages;
                this.currentPage = result.current_page;
            } finally {
                this.loading = false;
            }
        },

        async createProduct(payload: ProductCreatePayload) {
            const created = await productApi.create(payload);
            return created;
        },

        async updateProduct(id: string, payload: Partial<ProductCreatePayload>) {
            await productApi.update(id, payload);
        },

        async deleteProduct(id: string) {
            await productApi.remove(id);
        }
    }
});
