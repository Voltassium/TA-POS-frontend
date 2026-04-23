<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';
import type { SalesData } from '@/api/statisticsApi';

const props = defineProps<{
    salesChart: SalesData[]
}>();

const { layoutConfig, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

function setChartData() {
    const documentStyle = getComputedStyle(document.documentElement);

    const labels = props.salesChart.map(s => s.date);
    const data = props.salesChart.map(s => s.total);

    return {
        labels: labels,
        datasets: [
            {
                type: 'bar',
                label: 'Penjualan (IDR)',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
                data: data,
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
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                stacked: true,
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

watch([() => layoutConfig.primary, () => layoutConfig.surface, isDarkTheme, () => props.salesChart], () => {
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
        <div class="font-semibold text-xl mb-4">Grafik Penjualan Harian</div>
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
    </div>
</template>
