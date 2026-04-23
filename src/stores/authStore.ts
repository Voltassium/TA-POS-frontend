import { defineStore } from 'pinia';
import { authApi } from '@/api/authApi';

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        accessToken: localStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token')
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken
    },

    actions: {
        async login(email: string, password: string) {
            const result = await authApi.login(email, password);
            this.accessToken = result.access_token;
            this.refreshToken = result.refresh_token;
            localStorage.setItem('access_token', result.access_token);
            localStorage.setItem('refresh_token', result.refresh_token);
            return result;
        },

        async logout() {
            try {
                await authApi.logout();
            } finally {
                this.accessToken = null;
                this.refreshToken = null;
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        },

        async refreshAccessToken() {
            if (!this.refreshToken) throw new Error('No refresh token available');
            const result = await authApi.refreshToken(this.refreshToken);
            this.accessToken = result.access_token;
            localStorage.setItem('access_token', result.access_token);
            return result;
        }
    }
});
