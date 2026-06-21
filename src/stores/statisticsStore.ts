import { defineStore } from 'pinia';
import { ref } from 'vue';
import { statisticsApi, type DashboardResponse, type DashboardStats } from '@/api/statisticsApi';

export const useStatisticsStore = defineStore('statistics', () => {
    const dashboardData = ref<DashboardResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const comparisonStats = ref<Record<'daily' | 'weekly' | 'monthly', DashboardStats | null>>({
        daily: null,
        weekly: null,
        monthly: null
    });

    async function fetchDashboardData(range: 'daily' | 'weekly' | 'monthly' | 'all' = 'daily') {
        loading.value = true;
        error.value = null;
        try {
            const response = await statisticsApi.getDashboardData(range);
            dashboardData.value = response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch dashboard data';
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
                    const response = await statisticsApi.getDashboardData(range);
                    comparisonStats.value[range] = response.stats;
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
        fetchDashboardData,
        fetchComparisonStats
    };
});
