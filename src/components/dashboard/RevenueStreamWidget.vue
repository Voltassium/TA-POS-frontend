<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';
import type { DashboardStats } from '@/api/statisticsApi';

const props = defineProps<{
    comparisonStats: Record<'daily' | 'weekly' | 'monthly', DashboardStats | null>
}>();

const { layoutConfig, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

function setChartData() {
    const documentStyle = getComputedStyle(document.documentElement);

    const labels = ['Hari Ini', 'Minggu Ini', 'Bulan Ini'];
    const periods = ['daily', 'weekly', 'monthly'] as const;
    
    const salesData = periods.map(p => props.comparisonStats[p]?.total_revenue || 0);
    const expensesData = periods.map(p => props.comparisonStats[p]?.total_expenses || 0);
    const profitData = periods.map(p => props.comparisonStats[p]?.total_profit || 0);

    return {
        labels: labels,
        datasets: [
            {
                type: 'bar',
                label: 'Penjualan (IDR)',
                backgroundColor: documentStyle.getPropertyValue('--p-green-500'),
                data: salesData,
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Pengeluaran (IDR)',
                backgroundColor: documentStyle.getPropertyValue('--p-red-500'),
                data: expensesData,
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Laba Bersih (IDR)',
                backgroundColor: documentStyle.getPropertyValue('--p-blue-500'),
                data: profitData,
                barThickness: 32
            }
        ]
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        scales: {
            x: {
                stacked: false,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                stacked: false,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            }
        }
    };
}

watch([() => layoutConfig.primary, () => layoutConfig.surface, isDarkTheme, () => props.comparisonStats], () => {
    chartData.value = setChartData() as any;
    chartOptions.value = setChartOptions() as any;
}, { deep: true });

onMounted(() => {
    chartData.value = setChartData() as any;
    chartOptions.value = setChartOptions() as any;
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Perbandingan Keuangan (Harian, Mingguan, Bulanan)</div>
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
    </div>
</template>
