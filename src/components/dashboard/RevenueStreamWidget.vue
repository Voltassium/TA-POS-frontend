<script setup lang="ts">
import type { FinanceChartData } from '@/api/statisticsApi';
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{
    financeData: FinanceChartData[]
}>();

const { layoutConfig, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

function setChartData() {
    const documentStyle = getComputedStyle(document.documentElement);

    const labels = props.financeData?.map(d => d.date) || [];
    
    const salesData = props.financeData?.map(d => d.revenue) || [];
    const expensesData = props.financeData?.map(d => d.expenses) || [];
    const profitData = props.financeData?.map(d => d.profit) || [];

    return {
        labels: labels,
        datasets: [
            {
                type: 'line',
                label: 'Penjualan (IDR)',
                borderColor: documentStyle.getPropertyValue('--p-green-500'),
                backgroundColor: documentStyle.getPropertyValue('--p-green-500'),
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                data: salesData,
            },
            {
                type: 'line',
                label: 'Pengeluaran (IDR)',
                borderColor: documentStyle.getPropertyValue('--p-red-500'),
                backgroundColor: documentStyle.getPropertyValue('--p-red-500'),
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                data: expensesData,
            },
            {
                type: 'bar',
                label: 'Laba Bersih (IDR)',
                backgroundColor: documentStyle.getPropertyValue('--p-blue-500'),
                data: profitData,
                borderRadius: 4
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
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
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
                    color: textMutedColor,
                    callback: function(value: number) {
                        if (value === 0) return 'Rp 0';
                        if (Math.abs(value) >= 1000000) {
                            return 'Rp ' + (value / 1000000).toFixed(1) + 'Jt';
                        } else if (Math.abs(value) >= 1000) {
                            return 'Rp ' + (value / 1000).toFixed(0) + 'Rb';
                        }
                        return 'Rp ' + value;
                    }
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

watch([() => layoutConfig.primary, () => layoutConfig.surface, isDarkTheme, () => props.financeData], () => {
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
        <div class="font-semibold text-xl mb-4">Grafik Perbandingan Keuangan</div>
        <Chart type="line" :data="chartData" :options="chartOptions" class="h-80" />
    </div>
</template>
