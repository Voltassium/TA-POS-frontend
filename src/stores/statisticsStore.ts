import { defineStore } from 'pinia';
import { ref } from 'vue';
import { statisticsApi, type DashboardResponse } from '@/api/statisticsApi';

export const useStatisticsStore = defineStore('statistics', () => {
    const dashboardData = ref<DashboardResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchDashboardData() {
        loading.value = true;
        error.value = null;
        try {
            const response = await statisticsApi.getDashboardData();
            dashboardData.value = response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch dashboard data';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    return {
        dashboardData,
        loading,
        error,
        fetchDashboardData
    };
});
