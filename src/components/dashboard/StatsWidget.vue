<script setup lang="ts">


const props = defineProps<{
    stats: {
        total_orders: number;
        total_revenue: number;
        total_profit: number;
        total_expenses: number;
    };
    rangeLabel?: string;
}>();

function formatCurrency(value: number) {
    if (value != null) return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    return '-';
}
</script>

<template>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Total Pesanan Selesai</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ props.stats?.total_orders || 0 }}</div>
                </div>
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-shopping-cart text-blue-500 text-xl!"></i>
                </div>
            </div>
            <span class="text-muted-color">{{ props.rangeLabel || 'Hari Ini' }}</span>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Total Pendapatan</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ formatCurrency(props.stats?.total_revenue || 0) }}</div>
                </div>
                <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-dollar text-orange-500 text-xl!"></i>
                </div>
            </div>
            <span class="text-muted-color">{{ props.rangeLabel || 'Hari Ini' }}</span>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Total Pengeluaran</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ formatCurrency(props.stats?.total_expenses || 0) }}</div>
                </div>
                <div class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-chart-line text-red-500 text-xl!"></i>
                </div>
            </div>
            <span class="text-muted-color">{{ props.rangeLabel || 'Hari Ini' }}</span>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Laba Bersih (P&L)</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl" :class="{'text-red-500': props.stats?.total_profit < 0, 'text-green-500': props.stats?.total_profit > 0}">{{ formatCurrency(props.stats?.total_profit || 0) }}</div>
                </div>
                <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-wallet text-green-500 text-xl!"></i>
                </div>
            </div>
            <span class="text-muted-color">{{ props.rangeLabel || 'Hari Ini' }}</span>
        </div>
    </div>
</template>
