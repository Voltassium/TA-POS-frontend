import { authApi } from '@/api/authApi';
import api from '@/api/axiosInstance';
import { defineStore } from 'pinia';

export interface UserProfile {
    id: string;
    email: string;
    role: string;
    store_name?: string;
    created_at: string;
    updated_at: string;
}

interface AuthState {
    user: UserProfile | null;
    profileLoading: boolean;
    role: string | null;
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        profileLoading: false,
        role: localStorage.getItem('user_role')
    }),

    getters: {
        isAuthenticated(state): boolean {
            return !!state.role;
        },

        userEmail(state): string | null {
            return state.user?.email ?? null;
        },
        
        userRole(state): string | null {
            return state.role ?? state.user?.role ?? null;
        }
    },

    actions: {
        async register(email: string, password: string, role?: 'owner' | 'staff', storeName?: string) {
            return await authApi.register(email, password, role, storeName);
        },

        async login(email: string, password: string) {
            const result = await authApi.login(email, password);
            if (result.role) {
                const roleLower = result.role.toLowerCase();
                localStorage.setItem('user_role', roleLower);
                this.role = roleLower;
            }
            return result;
        },

        async logout() {
            try {
                await authApi.logout();
            } finally {
                this._clearSession();
            }
        },

        async refreshAccessToken() {
            const result = await authApi.refreshToken();
            return result;
        },

        async fetchProfile() {
            if (this.profileLoading) return;
            this.profileLoading = true;
            try {
                const { data } = await api.get<{ data: UserProfile }>('/users/profile');
                this.user = data.data;
            } catch (err) {
                this.user = null;
                throw err;
            } finally {
                this.profileLoading = false;
            }
        },

        async initSession() {
            if (!localStorage.getItem('user_role')) return;
            try {
                await this.fetchProfile();
            } catch {
            }
        },
        _clearSession() {
            this.user = null;
            this.role = null;
            localStorage.removeItem('user_role');
        }
    }
});
