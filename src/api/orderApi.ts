import api from './axiosInstance';
import type { PaginationParams, PaginatedResponse } from './categoryApi';

export type OrderStatus = 'New' | 'Paid' | 'Cancelled' | 'Completed';

export interface Order {
    id: string;
    order_code: string;
    table_id: number | null;
    customer_name: string | null;
    staff_id: string;
    staff_name: string;
    total_amount: number;
    discount_type: string | null;
    discount_value: number;
    discount_amount: number;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    product_id: string;
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
    id: string;
    order_id: string;
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
    customer_name?: string | null;
    items: { product_id: string; quantity: number }[];
}

export const orderApi = {
    async list(params?: OrderListParams) {
        const { data } = await api.get<{ data: PaginatedResponse<Order> }>('/orders', { params });
        return data.data;
    },

    async getById(id: string) {
        const { data } = await api.get<{ data: OrderDetail }>(`/orders/${id}`);
        return data.data;
    },

    async create(payload: CreateOrderPayload) {
        const { data } = await api.post<{ data: OrderDetail }>('/orders', payload);
        return data.data;
    },

    async updateStatus(id: string, status: OrderStatus) {
        const { data } = await api.patch(`/orders/${id}/status`, { status });
        return data;
    },

    async cancel(id: string) {
        const { data } = await api.delete(`/orders/${id}`);
        return data;
    },

    async addItem(orderId: string, productId: string, quantity: number) {
        const { data } = await api.post<{ data: OrderDetail }>(`/orders/${orderId}/items`, {
            product_id: productId,
            quantity
        });
        return data.data;
    },

    async removeItem(orderId: string, itemId: string) {
        const { data } = await api.delete<{ data: OrderDetail }>(`/orders/${orderId}/items/${itemId}`);
        return data.data;
    },

    async updateItemServedQty(orderId: string, itemId: string, servedQty: number) {
        const { data } = await api.patch<{ data: OrderDetail }>(`/orders/${orderId}/items/${itemId}/served`, {
            served_qty: servedQty
        });
        return data.data;
    }
};
