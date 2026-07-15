import { defineStore } from 'pinia';
import { productApi } from '@/api/productApi';
import type { Product, ProductCreatePayload, ProductListParams } from '@/api/productApi';
import { loadProductCache, saveProductCache, queueMutation } from '@/utils/offlineDb';
import type { AxiosError } from 'axios';

interface ProductState {
    products: Product[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
    isFromCache: boolean;
}

export const useProductStore = defineStore('product', {
    state: (): ProductState => ({
        products: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false,
        isFromCache: false
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
                this.isFromCache = false;
                await saveProductCache(result.data);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    const cached = await loadProductCache();
                    if (cached.length > 0) {
                        this.products = cached as Product[];
                        this.totalItems = cached.length;
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
         * Create product. Offline: optimistic update + queue mutation.
         */
        async createProduct(
            payload: ProductCreatePayload
        ): Promise<Product | { offline: true }> {
            try {
                return await productApi.create(payload);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    const mutationId = crypto.randomUUID();
                    const temp: Product = {
                        id: `offline-${mutationId}`,
                        category_id: payload.category_id,
                        category_name: '',
                        product_type: payload.product_type,
                        sku: payload.sku ?? null,
                        harga_beli: payload.harga_beli ?? null,
                        name: payload.name,
                        price: payload.price,
                        stock: payload.stock ?? 0,
                        is_available: payload.is_available ?? true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    this.products.unshift(temp);
                    this.totalItems++;

                    await queueMutation({
                        mutationId,
                        method: 'POST',
                        url: '/products',
                        payload,
                        entity: 'product',
                        label: `Tambah produk "${payload.name}"`
                    });

                    return { offline: true };
                }
                throw err;
            }
        },

        /**
         * Update product. Offline: optimistic update + queue mutation.
         */
        async updateProduct(
            id: string,
            payload: Partial<ProductCreatePayload>
        ): Promise<void | { offline: true }> {
            try {
                await productApi.update(id, payload);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    const idx = this.products.findIndex((p) => p.id === id);
                    if (idx !== -1) {
                        this.products[idx] = { ...this.products[idx], ...payload };
                    }

                    if (!id.startsWith('offline-')) {
                        await queueMutation({
                            mutationId: crypto.randomUUID(),
                            method: 'PUT',
                            url: `/products/${id}`,
                            payload,
                            entity: 'product',
                            label: `Update produk "${payload.name ?? id}"`
                        });
                    }

                    return { offline: true };
                }
                throw err;
            }
        },

        async restockProduct(id: string, payload: { harga_beli: number; jumlah_stok: number }): Promise<void | { offline: true }> {
            try {
                await productApi.restock(id, payload);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    const idx = this.products.findIndex((p) => p.id === id);
                    if (idx !== -1) {
                        this.products[idx].stock += payload.jumlah_stok;
                        this.products[idx].harga_beli = payload.harga_beli;
                    }

                    if (!id.startsWith('offline-')) {
                        await queueMutation({
                            mutationId: crypto.randomUUID(),
                            method: 'POST',
                            url: `/products/${id}/restock`,
                            payload,
                            entity: 'product',
                            label: `Restock produk`
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
        async deleteProduct(id: string) {
            await productApi.remove(id);
        }
    }
});
