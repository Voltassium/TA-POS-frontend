import api from './axiosInstance';
import type { PaginationParams, PaginatedResponse } from './categoryApi';

export interface Order {
    id: number;
    table_id: number | null;
    staff_id: number;
    total_amount: number;
    discount_type: string | null;
    discount_value: number;
    discount_amount: number;
    status: 'Open' | 'Paid' | 'Cancelled' | 'Ready';
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: number;
    product_id: number;
    product_name?: string;
    quantity: number;
    price: number;
    subtotal: number;
    served_qty: number;
}

export interface OrderDetail extends Order {
    items: OrderItem[];
    payment: Payment | null;
}

export interface Payment {
    id: number;
    order_id: number;
    payment_method: 'Cash' | 'Card' | 'Digital Wallet';
    amount_paid: number;
    timestamp: string;
}

export interface OrderListParams extends PaginationParams {
    status?: OrderStatus;
    exclude_status?: OrderStatus;
}

export interface CreateOrderPayload {
    table_id?: number | null;
    items: { product_id: number; quantity: number }[];
}

export const orderApi = {
    async list(params?: OrderListParams) {
        const { data } = await api.get<{ data: PaginatedResponse<Order> }>('/orders', { params });
        return data.data;
    },

    async getById(id: number) {
        const { data } = await api.get<{ data: OrderDetail }>(`/orders/${id}`);
        return data.data;
    },

    async create(payload: CreateOrderPayload) {
        const { data } = await api.post<{ data: OrderDetail }>('/orders', payload);
        return data.data;
    },

    async updateStatus(id: number, status: 'Open' | 'Paid' | 'Cancelled' | 'Ready') {
        const { data } = await api.patch(`/orders/${id}/status`, { status });
        return data;
    },

    async cancel(id: number) {
        const { data } = await api.delete(`/orders/${id}`);
        return data;
    },

    async addItem(orderId: number, productId: number, quantity: number) {
        const { data } = await api.post<{ data: OrderDetail }>(`/orders/${orderId}/items`, {
            product_id: productId,
            quantity
        });
        return data.data;
    },

    async removeItem(orderId: number, itemId: number) {
        const { data } = await api.delete<{ data: OrderDetail }>(`/orders/${orderId}/items/${itemId}`);
        return data.data;
    },

    async updateItemServedQty(orderId: number, itemId: number, servedQty: number) {
        const { data } = await api.patch<{ data: OrderDetail }>(`/orders/${orderId}/items/${itemId}/served`, {
            served_qty: servedQty
        });
        return data.data;
    }
};
