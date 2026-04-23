<script setup lang="ts">


const props = defineProps<{
    stats: {
        total_orders: number;
        total_revenue: number;
    }
}>();

function formatCurrency(value: number) {
    if (value != null) return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    return '-';
}
</script>

<template>
    <div class="col-span-12 lg:col-span-6 xl:col-span-6">
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
            <span class="text-muted-color">Seluruh waktu</span>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-6">
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
            <span class="text-muted-color">Seluruh waktu</span>
        </div>
    </div>
</template>
