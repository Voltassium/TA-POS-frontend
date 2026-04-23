import api from './axiosInstance';
import type { Payment } from './orderApi';

export interface PaymentCreatePayload {
    order_id: number;
    payment_method: 'Cash' | 'Card' | 'Digital Wallet';
    amount_paid: number;
}

export const paymentApi = {
    async create(payload: PaymentCreatePayload) {
        const { data } = await api.post<{ data: Payment }>('/payments', payload);
        return data.data;
    },

    async getByOrder(orderId: number) {
        const { data } = await api.get<{ data: Payment }>(`/payments/${orderId}`);
        return data.data;
    }
};
