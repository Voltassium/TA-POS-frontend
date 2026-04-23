import { defineStore } from 'pinia';
import { orderApi } from '@/api/orderApi';
import type { Order, OrderDetail, OrderListParams, CreateOrderPayload } from '@/api/orderApi';

interface OrderState {
    orders: Order[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
    selectedOrder: OrderDetail | null;
}

export const useOrderStore = defineStore('order', {
    state: (): OrderState => ({
        orders: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        loading: false,
        selectedOrder: null
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

        async fetchOrderDetail(id: number) {
            this.loading = true;
            try {
                const detail = await orderApi.getById(id);
                this.selectedOrder = detail;
                return detail;
            } finally {
                this.loading = false;
            }
        },

        async createOrder(payload: CreateOrderPayload) {
            const created = await orderApi.create(payload);
            return created;
        },

        async updateOrderStatus(id: number, status: 'Open' | 'Paid' | 'Cancelled' | 'Ready') {
            await orderApi.updateStatus(id, status);
        },

        async cancelOrder(id: number) {
            await orderApi.cancel(id);
        },

        async addItem(orderId: number, productId: number, quantity: number) {
            const updated = await orderApi.addItem(orderId, productId, quantity);
            this.selectedOrder = updated;
            return updated;
        },

        async removeItem(orderId: number, itemId: number) {
            const updated = await orderApi.removeItem(orderId, itemId);
            this.selectedOrder = updated;
            return updated;
        }
    }
});
