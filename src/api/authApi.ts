import api from './axiosInstance';

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    role: string;
}

export const authApi = {
    async login(email: string, password: string) {
        const { data } = await api.post<{ data: LoginResponse }>('/authentications/login', { email, password });
        return data.data;
    },

    async register(email: string, password: string, role?: 'owner' | 'staff', storeName?: string) {
        const { data } = await api.post('/authentications/register', { email, password, role, store_name: storeName });
        return data;
    },

    async refreshToken() {
        const { data } = await api.post<{ data: { access_token: string } }>('/authentications/refresh-token', {});
        return data.data;
    },

    async logout() {
        const { data } = await api.post('/authentications/logout');
        return data;
    }
};
