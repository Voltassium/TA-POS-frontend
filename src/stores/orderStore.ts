import type { CreateOrderPayload, Order, OrderDetail, OrderListParams, OrderStatus } from '@/api/orderApi';
import { orderApi } from '@/api/orderApi';
import { getOfflineOrderCount, saveOfflineOrder } from '@/utils/offlineDb';
import { syncOfflineOrders } from '@/utils/offlineSync';
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
}

export const useOrderStore = defineStore('order', {
    state: (): OrderState => ({
        orders: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false,
        selectedOrder: null,
        offlineCount: 0
    }),

    actions: {
        async fetchOrders(params?: OrderListParams) {
            this.loading = true;
            try {
                const result = await orderApi.list(params);
                this.orders = result.data;
                this.totalItems = result.total_items;
                this.totalPages = result.total_pages;
                this.currentPage = result.current_page;
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

        async updateOrderStatus(id: string, status: OrderStatus) {
            await orderApi.updateStatus(id, status);
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

        async updateItemServedQty(orderId: string, itemId: string, servedQty: number) {
            const updated = await orderApi.updateItemServedQty(orderId, itemId, servedQty);
            this.selectedOrder = updated;
            return updated;
        },

        async refreshOfflineCount() {
            this.offlineCount = await getOfflineOrderCount();
        },


        async syncPendingOrders() {
            const result = await syncOfflineOrders();
            await this.refreshOfflineCount();
            return result;
        }
    }
});

