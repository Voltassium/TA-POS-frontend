import api from './axiosInstance';

export interface UserItem {
    id: string;
    email: string;
    role: string;
    store_id?: number | null;
    created_at: string;
    updated_at: string;
}

export interface ListUserResponse {
    data: UserItem[];
    meta: {
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
    };
}

export interface CreateUserByAdminPayload {
    email: string;
    password: string;
    role: 'chef' | 'staff' | 'superadmin';
}

export interface UpdateUserPayload {
    email?: string;
    password?: string;
    role?: string;
}

export const userApi = {
    async list(params?: { page?: number; page_size?: number; order_by?: string; order_dir?: string }) {
        const { data } = await api.get<{ data: ListUserResponse }>('/users', { params });
        return data.data;
    },

    async getById(id: string) {
        const { data } = await api.get<{ data: UserItem }>(`/users/${id}`);
        return data.data;
    },

    async create(payload: CreateUserByAdminPayload) {
        const { data } = await api.post('/users', payload);
        return data;
    },

    async update(id: string, payload: UpdateUserPayload) {
        const { data } = await api.put(`/users/${id}`, payload);
        return data;
    },

    async remove(id: string) {
        const { data } = await api.delete(`/users/${id}`);
        return data;
    },

    async getProfile() {
        const { data } = await api.get<{ data: UserItem }>('/users/profile');
        return data.data;
    }
};
