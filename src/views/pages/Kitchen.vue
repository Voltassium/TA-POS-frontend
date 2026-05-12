<script setup lang="ts">
import { useOrderStore } from '@/stores/orderStore';
import { useToast } from 'primevue/usetoast';
import { onMounted, onUnmounted, ref } from 'vue';

const toast = useToast();
const orderStore = useOrderStore();
const interval = ref<any>(null);

onMounted(() => {
    loadKitchenOrders();
    // Refresh every 10 seconds
    interval.value = setInterval(() => {
        loadKitchenOrders();
    }, 10000);
});

onUnmounted(() => {
    if (interval.value) clearInterval(interval.value);
});

async function loadKitchenOrders() {
    try {
        // Fetch only Paid orders (which means they are ready to be cooked)
        await orderStore.fetchOrders({ page: 1, page_size: 50, status: 'Paid' });
    } catch (error) {
        // Silently fail on auto-refresh
    }
}

async function markAsReady(orderId: number) {
    try {
        await orderStore.updateOrderStatus(orderId, 'Ready');
        toast.add({ severity: 'success', summary: 'Berhasil', detail: `Pesanan #${orderId} telah selesai dan siap disajikan!`, life: 3000 });
        await loadKitchenOrders();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui status pesanan', life: 3000 });
    }
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">Dapur - Daftar Pesanan Masuk</div>
            <Button icon="pi pi-refresh" outlined @click="loadKitchenOrders" v-tooltip="'Refresh Data'" />
        </div>

        <div v-if="orderStore.loading && orderStore.orders.length === 0" class="flex justify-center p-8">
            <ProgressSpinner />
        </div>

        <div v-else-if="orderStore.orders.length === 0" class="text-center p-8 text-surface-500">
            <i class="pi pi-check-circle text-4xl mb-4 text-green-500"></i>
            <p class="text-xl">Semua pesanan sudah selesai!</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Card v-for="ord in orderStore.orders" :key="ord.id" class="border-2 border-orange-200 dark:border-orange-800">
                <template #title>
                    <div class="flex justify-between items-center bg-orange-100 dark:bg-orange-900/30 p-3 -mx-4 -mt-4 mb-2 rounded-t-lg">
                        <span class="text-orange-600 dark:text-orange-400 font-bold">Meja: {{ ord.table_id }}</span>
                        <span class="text-sm">#{{ ord.id }}</span>
                    </div>
                </template>
                <template #content>
                    <div class="text-sm text-surface-500 mb-2">
                        Waktu: {{ new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
                    </div>
                    <ul class="list-none p-0 m-0 space-y-2">
                        <li v-for="item in ord.items" :key="item.product_id" class="flex justify-between items-center border-b border-surface-200 dark:border-surface-700 pb-2">
                            <span class="font-medium">{{ item.quantity }}x {{ item.product_name || `Produk #${item.product_id}` }}</span>
                        </li>
                    </ul>
                </template>
                <template #footer>
                    <Button label="Pesanan Selesai" icon="pi pi-check" severity="success" class="w-full mt-2" @click="markAsReady(ord.id)" />
                </template>
            </Card>
        </div>
    </div>
</template>
