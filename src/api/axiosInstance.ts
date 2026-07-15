import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    }
});

// ─── Request interceptor — attach access token ───────────────────────────────s
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 / token refresh ───────────────────────
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (originalRequest.url?.includes('/authentications/login')) {
            return Promise.reject(error);
        }

        // ── Network error (offline / timeout): NO HTTP response at all ──────────
        // Do NOT redirect to login — the user is likely offline and their
        // session cookie is still valid. Let the calling code handle the error.
        if (!error.response) {
            return Promise.reject(error);
        }

        // ── 401 Unauthorized: session expired, try to refresh ─────────────────
        if (error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${API_BASE_URL}/authentications/refresh-token`, {}, {
                    withCredentials: true,
                    headers: {
                        'ngrok-skip-browser-warning': 'true'
                    }
                });
                
                processQueue(null, null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Only clear session if the refresh endpoint itself returned a response
                // (meaning the server explicitly rejected the token, not a network issue)
                const refreshAxiosErr = refreshError as AxiosError;
                if (refreshAxiosErr.response) {
                    localStorage.removeItem('user_role');
                    window.location.href = '/auth/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
