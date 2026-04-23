<script setup lang="ts">
import { computed } from 'vue';
import type { TopSellingProduct } from '@/api/statisticsApi';

const props = defineProps<{
    topProducts: TopSellingProduct[]
}>();

const maxQuantity = computed(() => {
    if (!props.topProducts || props.topProducts.length === 0) return 0;
    return Math.max(...props.topProducts.map(p => p.quantity));
});

function getPercentage(quantity: number) {
    if (maxQuantity.value === 0) return 0;
    return Math.round((quantity / maxQuantity.value) * 100);
}

const colors = ['bg-orange-500', 'bg-cyan-500', 'bg-pink-500', 'bg-green-500', 'bg-purple-500', 'bg-teal-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];
const textColors = ['text-orange-500', 'text-cyan-500', 'text-pink-500', 'text-green-500', 'text-purple-500', 'text-teal-500', 'text-blue-500', 'text-yellow-500', 'text-red-500', 'text-indigo-500'];

</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">Menu Terlaris</div>
        </div>
        <ul class="list-none p-0 m-0">
            <li v-for="(product, index) in props.topProducts" :key="product.product_id" class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <span class="text-surface-900 dark:text-surface-0 font-medium mr-2 mb-1 md:mb-0">{{ product.product_name }}</span>
                    <div class="mt-1 text-muted-color">{{ product.category_name || 'Tanpa Kategori' }}</div>
                </div>
                <div class="mt-2 md:mt-0 ml-0 md:ml-20 flex items-center">
                    <div class="bg-surface-300 dark:bg-surface-500 rounded-border overflow-hidden w-40 lg:w-24" style="height: 8px">
                        <div :class="[colors[index % colors.length], 'h-full']" :style="{ width: getPercentage(product.quantity) + '%' }"></div>
                    </div>
                    <span :class="[textColors[index % textColors.length], 'ml-4 font-medium']">{{ product.quantity }} terjual</span>
                </div>
            </li>
            <li v-if="!props.topProducts || props.topProducts.length === 0" class="text-surface-500 text-center py-4">
                Belum ada data penjualan
            </li>
        </ul>
    </div>
</template>
