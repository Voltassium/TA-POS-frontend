import type { CreateOrderPayload, Order, OrderDetail, OrderListParams, OrderStatus } from '@/api/orderApi';
import { orderApi } from '@/api/orderApi';
import { getOfflineOrderCount, loadCache, saveCache, saveOfflineOrder, queueMutation } from '@/utils/offlineDb';
import { syncAll, getTotalPendingCount } from '@/utils/offlineSync';
import type { AxiosError } from 'axios';
import { defineStore } from 'pinia';

interface OrderState {
    orders: Order[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
    selectedOrder: OrderDetail | null;
    offlineCount: number;
    isFromCache: boolean;
}

export const useOrderStore = defineStore('order', {
    state: (): OrderState => ({
        orders: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false,
        selectedOrder: null,
        offlineCount: 0,
        isFromCache: false
    }),

    actions: {
        async fetchOrders(params?: OrderListParams) {
            this.loading = true;
            const cacheKey = `orders:${JSON.stringify(params ?? {})}`;
            try {
                const result = await orderApi.list(params);
                this.orders = result.data;
                this.totalItems = result.total_items;
                this.totalPages = result.total_pages;
                this.currentPage = result.current_page;
                this.isFromCache = false;
                await saveCache(cacheKey, result);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    const cached = await loadCache<typeof result>(cacheKey);
                    if (cached) {
                        this.orders = cached.data;
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

        async fetchOrderDetail(id: string) {
            this.loading = true;
            try {
                const detail = await orderApi.getById(id);
                this.selectedOrder = detail;
                return detail;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Create an order. If the network is unavailable, the order is
         * queued in IndexedDB and will be synced when connectivity returns.
         * Returns { offline: true } when saved offline, or the created order.
         */
        async createOrder(payload: CreateOrderPayload): Promise<OrderDetail | { offline: true }> {
            try {
                const created = await orderApi.create(payload);
                return created;
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    await saveOfflineOrder(payload);
                    await this.refreshOfflineCount();
                    return { offline: true };
                }
                throw err;
            }
        },

        async updateOrderStatus(id: string, status: OrderStatus): Promise<void | { offline: true }> {
            try {
                await orderApi.updateStatus(id, status);
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    if (this.selectedOrder && this.selectedOrder.id === id) {
                        this.selectedOrder.status = status;
                    }
                    const idx = this.orders.findIndex((o) => o.id === id);
                    if (idx !== -1) {
                        this.orders[idx].status = status;
                    }

                    await queueMutation({
                        mutationId: crypto.randomUUID(),
                        method: 'PATCH',
                        url: `/orders/${id}/status`,
                        payload: { status },
                        entity: 'order',
                        label: `Update status pesanan menjadi ${status}`
                    });
                    await this.refreshOfflineCount();
                    return { offline: true };
                }
                throw err;
            }
        },

        async cancelOrder(id: string) {
            await orderApi.cancel(id);
        },

        async addItem(orderId: string, productId: string, quantity: number) {
            const updated = await orderApi.addItem(orderId, productId, quantity);
            this.selectedOrder = updated;
            return updated;
        },

        async removeItem(orderId: string, itemId: string) {
            const updated = await orderApi.removeItem(orderId, itemId);
            this.selectedOrder = updated;
            return updated;
        },

        async updateItemServedQty(orderId: string, itemId: string, servedQty: number): Promise<OrderDetail | { offline: true }> {
            try {
                const updated = await orderApi.updateItemServedQty(orderId, itemId, servedQty);
                this.selectedOrder = updated;
                
                const idx = this.orders.findIndex((o) => o.id === orderId);
                if (idx !== -1) {
                    this.orders[idx] = updated; // keep list in sync
                }
                
                return updated;
            } catch (err) {
                const axiosErr = err as AxiosError;
                if (!axiosErr.response) {
                    // Optimistic update
                    let updatedDetail = this.selectedOrder;
                    
                    if (this.selectedOrder && this.selectedOrder.id === orderId) {
                        const itemIdx = this.selectedOrder.items.findIndex(i => i.id === itemId);
                        if (itemIdx !== -1) {
                            this.selectedOrder.items[itemIdx].served_qty = servedQty;
                            
                            // Check if all items are fully served -> change status to Completed
                            const allServed = this.selectedOrder.items.every(i => (i.served_qty || 0) >= i.quantity);
                            if (allServed) {
                                this.selectedOrder.status = 'Completed';
                            }
                        }
                    } else {
                        // Find in orders list
                        const orderIdx = this.orders.findIndex(o => o.id === orderId);
                        if (orderIdx !== -1) {
                            const order = this.orders[orderIdx];
                            if (order.items) {
                                const itemIdx = order.items.findIndex(i => i.id === itemId);
                                if (itemIdx !== -1) {
                                    order.items[itemIdx].served_qty = servedQty;
                                    
                                    const allServed = order.items.every(i => (i.served_qty || 0) >= i.quantity);
                                    if (allServed) {
                                        order.status = 'Completed';
                                    }
                                }
                            }
                            updatedDetail = order as OrderDetail;
                        }
                    }

                    await queueMutation({
                        mutationId: crypto.randomUUID(),
                        method: 'PATCH',
                        url: `/orders/${orderId}/items/${itemId}/served`,
                        payload: { served_qty: servedQty },
                        entity: 'order',
                        label: `Update progress pesanan`
                    });
                    await this.refreshOfflineCount();

                    return updatedDetail || { offline: true };
                }
                throw err;
            }
        },

        async refreshOfflineCount() {
            this.offlineCount = await getTotalPendingCount();
        },

        async syncPendingOrders() {
            const result = await syncAll();
            await this.refreshOfflineCount();
            return result;
        }
    }
});
