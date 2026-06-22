import { authApi } from '@/api/authApi';
import api from '@/api/axiosInstance';
import { defineStore } from 'pinia';

export interface UserProfile {
    id: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: UserProfile | null;
    profileLoading: boolean;
}

/**
 * Decode the payload section of a JWT without verifying signature.
 * Returns null if the token is malformed or cannot be parsed.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        accessToken: localStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token'),
        user: null,
        profileLoading: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken,

        /** Quick-read claims from the access token (no network call). */
        tokenClaims: (state): Record<string, unknown> | null => {
            if (!state.accessToken) return null;
            return decodeJwtPayload(state.accessToken);
        },

        /** Convenience getter — extracts email from JWT claims. */
        userEmail(): string | null {
            return (this.tokenClaims?.email as string) ?? this.user?.email ?? null;
        },

        /** Convenience getter — extracts role from JWT claims. */
        userRole(): string | null {
            return (this.tokenClaims?.role as string) ?? this.user?.role ?? null;
        }
    },

    actions: {
        /**
         * Register a new user account via POST /v1/authentications/register.
         * Does NOT auto-login — the user is redirected to the login page after.
         */
        async register(email: string, password: string, role?: 'Owner' | 'Staff', storeName?: string) {
            return await authApi.register(email, password, role, storeName);
        },

        /**
         * Authenticate against POST /v1/authentications/login.
         * Stores both tokens in localStorage and Pinia state.
         */
        async login(email: string, password: string) {
            const result = await authApi.login(email, password);
            this.accessToken = result.access_token;
            this.refreshToken = result.refresh_token;
            localStorage.setItem('access_token', result.access_token);
            localStorage.setItem('refresh_token', result.refresh_token);
            return result;
        },

        /**
         * Notify the backend then wipe local state regardless of outcome.
         */
        async logout() {
            try {
                await authApi.logout();
            } finally {
                this._clearSession();
            }
        },

        /**
         * Request a fresh access token using the stored refresh token.
         * Called automatically by the axios response interceptor on 401.
         */
        async refreshAccessToken() {
            if (!this.refreshToken) throw new Error('No refresh token available');
            const result = await authApi.refreshToken(this.refreshToken);
            this.accessToken = result.access_token;
            localStorage.setItem('access_token', result.access_token);
            return result;
        },

        /**
         * Fetch the authenticated user's profile from GET /v1/users/profile.
         * Stores the result in `this.user`.
         */
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

        /**
         * Attempt to restore a session on app startup.
         * If an access token exists, fetches the user profile.
         * Silently clears state if the token is no longer valid.
         */
        async initSession() {
            if (!this.accessToken) return;
            try {
                await this.fetchProfile();
            } catch {
                // Token was invalid / expired and refresh also failed —
                // interceptor already cleared tokens and redirected.
            }
        },

        /** Internal helper to wipe all auth state. */
        _clearSession() {
            this.accessToken = null;
            this.refreshToken = null;
            this.user = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }
});
