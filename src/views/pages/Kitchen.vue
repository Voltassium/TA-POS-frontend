<script setup lang="ts">
import { orderApi } from '@/api/orderApi';
import type { OrderDetail, OrderItem } from '@/api/orderApi';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const toast = useToast();
const orders = ref<OrderDetail[]>([]);
const loading = ref(false);
const interval = ref<any>(null);

onMounted(() => {
    loadKitchenOrders();
    interval.value = setInterval(() => {
        loadKitchenOrders();
    }, 10000);
});

onUnmounted(() => {
    if (interval.value) clearInterval(interval.value);
});

async function loadKitchenOrders() {
    loading.value = true;
    try {
        const result = await orderApi.list({ page: 1, page_size: 50, status: 'Paid' });
        // Fetch full details for each order so we get items with served_qty
        const details = await Promise.all(result.data.map((o: any) => orderApi.getById(o.id)));
        orders.value = details;
    } catch {
        // Silently fail on auto-refresh
    } finally {
        loading.value = false;
    }
}

function orderProgress(order: OrderDetail): { served: number; total: number } {
    if (!order.items || order.items.length === 0) return { served: 0, total: 0 };
    const total = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const served = order.items.reduce((sum, i) => sum + (i.served_qty || 0), 0);
    return { served, total };
}

function progressPercent(order: OrderDetail): number {
    const { served, total } = orderProgress(order);
    if (total === 0) return 0;
    return Math.round((served / total) * 100);
}

function isItemFullyServed(item: OrderItem): boolean {
    return (item.served_qty || 0) >= item.quantity;
}

async function incrementServed(order: OrderDetail, item: OrderItem) {
    if ((item.served_qty || 0) >= item.quantity) return;
    const newQty = (item.served_qty || 0) + 1;
    try {
        const updated = await orderApi.updateItemServedQty(order.id, item.id, newQty);
        // If order became Ready, remove it from the list
        if (updated.status === 'Ready') {
            orders.value = orders.value.filter((o) => o.id !== order.id);
            toast.add({ severity: 'success', summary: 'Selesai!', detail: `Pesanan ${order.order_code} selesai dan siap disajikan!`, life: 3000 });
        } else {
            // Update the order in-place
            const idx = orders.value.findIndex((o) => o.id === order.id);
            if (idx !== -1) orders.value[idx] = updated;
        }
    } catch {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui item', life: 3000 });
    }
}

async function decrementServed(order: OrderDetail, item: OrderItem) {
    if ((item.served_qty || 0) <= 0) return;
    const newQty = (item.served_qty || 0) - 1;
    try {
        const updated = await orderApi.updateItemServedQty(order.id, item.id, newQty);
        const idx = orders.value.findIndex((o) => o.id === order.id);
        if (idx !== -1) orders.value[idx] = updated;
    } catch {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui item', life: 3000 });
    }
}

async function markAllServed(order: OrderDetail) {
    try {
        // Mark each unfinished item as fully served
        for (const item of order.items) {
            if ((item.served_qty || 0) < item.quantity) {
                await orderApi.updateItemServedQty(order.id, item.id, item.quantity);
            }
        }
        orders.value = orders.value.filter((o) => o.id !== order.id);
        toast.add({ severity: 'success', summary: 'Selesai!', detail: `Pesanan ${order.order_code} selesai dan siap disajikan!`, life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui status pesanan', life: 3000 });
        await loadKitchenOrders();
    }
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">Dapur - Daftar Pesanan Masuk</div>
            <Button icon="pi pi-refresh" outlined @click="loadKitchenOrders" v-tooltip="'Refresh Data'" />
        </div>

        <div v-if="loading && orders.length === 0" class="flex justify-center p-8">
            <ProgressSpinner />
        </div>

        <div v-else-if="orders.length === 0" class="text-center p-8 text-surface-500">
            <i class="pi pi-check-circle text-4xl mb-4 text-green-500"></i>
            <p class="text-xl">Semua pesanan sudah selesai!</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Card v-for="ord in orders" :key="ord.id" class="border-2 border-orange-200 dark:border-orange-800">
                <template #title>
                    <div class="flex flex-col bg-orange-100 dark:bg-orange-900/30 p-3 -mx-4 -mt-4 mb-2 rounded-t-lg">
                        <div class="flex justify-between items-center">
                            <span class="text-orange-600 dark:text-orange-400 font-bold">Meja: {{ ord.table_id ?? '-' }}</span>
                            <span class="text-sm font-normal">{{ ord.order_code }}</span>
                        </div>
                        <div v-if="ord.customer_name" class="mt-1 text-sm font-medium text-orange-800 dark:text-orange-200">
                            Pelanggan: {{ ord.customer_name }}
                        </div>
                    </div>
                </template>
                <template #content>
                    <!-- Time & Progress -->
                    <div class="flex justify-between items-center text-sm text-surface-500 mb-3">
                        <span>Waktu: {{ new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}</span>
                        <Tag
                            :severity="progressPercent(ord) === 100 ? 'success' : progressPercent(ord) > 0 ? 'warn' : 'danger'"
                            :value="`${orderProgress(ord).served}/${orderProgress(ord).total}`"
                        />
                    </div>

                    <!-- Progress Bar -->
                    <ProgressBar :value="progressPercent(ord)" :showValue="false" class="mb-4" style="height: 6px" />

                    <!-- Item List with Checklist -->
                    <ul class="list-none p-0 m-0 space-y-3">
                        <li
                            v-for="item in ord.items"
                            :key="item.id"
                            class="flex justify-between items-center border-b border-surface-200 dark:border-surface-700 pb-2 transition-all duration-200"
                            :class="{ 'opacity-50': isItemFullyServed(item) }"
                        >
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                <i
                                    class="pi text-lg flex-shrink-0"
                                    :class="isItemFullyServed(item) ? 'pi-check-circle text-green-500' : 'pi-circle text-surface-400'"
                                />
                                <span class="font-medium truncate" :class="{ 'line-through': isItemFullyServed(item) }">
                                    {{ item.product_name || `Produk #${item.product_id}` }}
                                </span>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                                <Button
                                    icon="pi pi-minus"
                                    severity="secondary"
                                    text
                                    rounded
                                    size="small"
                                    :disabled="(item.served_qty || 0) <= 0"
                                    @click="decrementServed(ord, item)"
                                    class="!w-7 !h-7"
                                />
                                <span class="text-sm font-mono w-12 text-center" :class="isItemFullyServed(item) ? 'text-green-500 font-bold' : ''">
                                    {{ item.served_qty || 0 }}/{{ item.quantity }}
                                </span>
                                <Button
                                    icon="pi pi-plus"
                                    severity="success"
                                    text
                                    rounded
                                    size="small"
                                    :disabled="isItemFullyServed(item)"
                                    @click="incrementServed(ord, item)"
                                    class="!w-7 !h-7"
                                />
                            </div>
                        </li>
                    </ul>
                </template>
                <template #footer>
                    <Button
                        label="Pesanan Selesai"
                        icon="pi pi-check"
                        severity="success"
                        class="w-full mt-2"
                        @click="markAllServed(ord)"
                    />
                </template>
            </Card>
        </div>
    </div>
</template>
