<script setup lang="ts">
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { useStatisticsStore } from '@/stores/statisticsStore';
import { onMounted, ref, watch } from 'vue';

const statisticsStore = useStatisticsStore();
const selectedRange = ref('daily');

const rangeOptions = ref([
    { label: 'Hari Ini', value: 'daily' },
    { label: 'Minggu Ini', value: 'weekly' },
    { label: 'Bulan Ini', value: 'monthly' },
    { label: 'Semua Waktu', value: 'all' }
]);

const rangeLabel = ref('Hari Ini');

async function loadData() {
    try {
        await Promise.all([
            statisticsStore.fetchDashboardData(selectedRange.value as any),
            statisticsStore.fetchComparisonStats()
        ]);
        const option = rangeOptions.value.find(o => o.value === selectedRange.value);
        if (option) rangeLabel.value = option.label;
    } catch (e) {
        console.error(e);
    }
}

watch(selectedRange, () => {
    loadData();
});

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="flex flex-col gap-8">
        <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold m-0">Dashboard</h2>
            <Select 
                v-model="selectedRange" 
                :options="rangeOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Pilih Waktu" 
                class="w-48"
            />
        </div>

        <div class="grid grid-cols-12 gap-8">
            <StatsWidget v-if="statisticsStore.dashboardData" :stats="statisticsStore.dashboardData.stats" :rangeLabel="rangeLabel" />

        <div class="col-span-12 xl:col-span-12">
            <RevenueStreamWidget :comparisonStats="statisticsStore.comparisonStats" />
        </div>
        
        <div class="col-span-12 xl:col-span-12">
            <BestSellingWidget v-if="statisticsStore.dashboardData" :topProducts="statisticsStore.dashboardData.top_products" />
        </div>
        </div>
    </div>
</template>
