import api from './axiosInstance';

export interface Store {
    id: number;
    name: string;
    address?: string;
    created_at: string;
    updated_at: string;
}

export const storeApi = {
    async createStore(name: string, address?: string) {
        const { data } = await api.post<{ data: Store }>('/stores', { name, address });
        return data.data;
    }
};
