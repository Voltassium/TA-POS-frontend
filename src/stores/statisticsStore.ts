import { defineStore } from 'pinia';
import { ref } from 'vue';
import { statisticsApi, type DashboardResponse, type DashboardStats } from '@/api/statisticsApi';
import { loadCache, saveCache } from '@/utils/offlineDb';
import type { AxiosError } from 'axios';

export const useStatisticsStore = defineStore('statistics', () => {
    const dashboardData = ref<DashboardResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const isFromCache = ref(false);

    const comparisonStats = ref<Record<'daily' | 'weekly' | 'monthly', DashboardStats | null>>({
        daily: null,
        weekly: null,
        monthly: null
    });

    async function fetchDashboardData(range: 'daily' | 'weekly' | 'monthly' | 'all' = 'daily') {
        loading.value = true;
        error.value = null;
        const cacheKey = `dashboard:${range}`;
        try {
            const response = await statisticsApi.getDashboardData(range);
            dashboardData.value = response.data;
            isFromCache.value = false;
            await saveCache(cacheKey, response.data);
        } catch (err: any) {
            const axiosErr = err as AxiosError;
            if (!axiosErr.response) {
                const cached = await loadCache<DashboardResponse>(cacheKey);
                if (cached) {
                    dashboardData.value = cached;
                    isFromCache.value = true;
                    return;
                }
            }
            error.value = err.response?.data?.message || 'Gagal memuat data dashboard';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function fetchComparisonStats() {
        const ranges = ['daily', 'weekly', 'monthly'] as const;
        try {
            await Promise.all(
                ranges.map(async (range) => {
                    const cacheKey = `dashboard:${range}`;
                    try {
                        const response = await statisticsApi.getDashboardData(range);
                        comparisonStats.value[range] = response.stats;
                        await saveCache(cacheKey, response.data);
                    } catch (err) {
                        const axiosErr = err as AxiosError;
                        if (!axiosErr.response) {
                            const cached = await loadCache<DashboardResponse>(cacheKey);
                            if (cached) {
                                comparisonStats.value[range] = cached.stats;
                            }
                        }
                    }
                })
            );
        } catch (err: any) {
            console.error('Failed to fetch comparison stats', err);
        }
    }

    return {
        dashboardData,
        comparisonStats,
        loading,
        error,
        isFromCache,
        fetchDashboardData,
        fetchComparisonStats
    };
});
