<script setup lang="ts">
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { useStatisticsStore } from '@/stores/statisticsStore';
import { onMounted } from 'vue';

const statisticsStore = useStatisticsStore();

onMounted(async () => {
    try {
        await statisticsStore.fetchDashboardData();
    } catch (e) {
        console.error(e);
    }
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget v-if="statisticsStore.dashboardData" :stats="statisticsStore.dashboardData.stats" />

        <div class="col-span-12 xl:col-span-12">
            <RevenueStreamWidget v-if="statisticsStore.dashboardData" :salesChart="statisticsStore.dashboardData.sales_chart" />
        </div>
        
        <div class="col-span-12 xl:col-span-12">
            <BestSellingWidget v-if="statisticsStore.dashboardData" :topProducts="statisticsStore.dashboardData.top_products" />
        </div>
    </div>
</template>
