<script setup lang="ts">
import type { Order } from '@/api/orderApi';
import { orderApi } from '@/api/orderApi';
import { exportToExcel } from '@/utils/exportExcel';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const toast = useToast();
const orderHistories = ref<Order[]>([]);
const loading = ref(false);
const totalRecords = ref(0);
const dt = ref();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const loadData = async (event?: any) => {
    loading.value = true;
    try {
        const page = event ? event.first / event.rows + 1 : 1;
        const limit = event ? event.rows : 10;
        
        const response = await orderApi.list({
            page,
            page_size: limit,
            search: filters.value.global.value || undefined
        });
        
        orderHistories.value = response.data;
        totalRecords.value = response.total_items;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat riwayat pesanan', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (value: number) => {
    return (value ?? 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatNumber = (value: number) => {
    return (value ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const getStatusSeverity = (status: string) => {
    switch (status) {
        case 'Paid':
            return 'success';
        case 'New':
            return 'info';
        case 'Completed':
            return 'success';
        case 'Cancelled':
            return 'danger';
        default:
            return 'info';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'New':
            return 'Baru';
        case 'Paid':
            return 'Lunas';
        case 'Completed':
            return 'Selesai';
        case 'Cancelled':
            return 'Dibatalkan';
        default:
            return status;
    }
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID');
};

async function exportExcel() {
    try {
        const response = await orderApi.list({ page: 1, page_size: 10000 });
        const fmtCurrency = (v: number) => (v ?? 0).toLocaleString('id-ID');
        exportToExcel(response.data, [
            { header: 'Kode Pesanan', key: 'order_code', width: 20 },
            { header: 'Pelanggan', key: 'customer_name', width: 20, format: (v: string) => v || '-' },
            { header: 'Total Harga', key: 'total_amount', width: 20, format: (v: number) => fmtCurrency(v) },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Tanggal', key: 'created_at', width: 22, format: (v: string) => formatDate(v) }
        ], 'Riwayat_Pesanan');
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil diekspor', life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengekspor data', life: 3000 });
    }
}

function onSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadData();
    }, 400);
}

function clearSearch() {
    filters.value.global.value = null;
    loadData();
}

const showDetailDialog = ref(false);
const selectedOrder = ref<any>(null);
const detailLoading = ref(false);

async function viewOrderDetails(orderId: string) {
    detailLoading.value = true;
    showDetailDialog.value = true;
    selectedOrder.value = null;
    try {
        const data = await orderApi.getById(orderId);
        selectedOrder.value = data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat detail pesanan', life: 3000 });
        showDetailDialog.value = false;
    } finally {
        detailLoading.value = false;
    }
}

onMounted(() => {
    loadData();
});
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <h4 class="m-0">Riwayat Pesanan</h4>
                </template>
                <template #end>
                    <Button label="Ekspor Excel" icon="pi pi-file-excel" severity="success" @click="exportExcel" />
                </template>
            </Toolbar>
            <DataTable
                ref="dt"
                :value="orderHistories"
                :paginator="true"
                :rows="10"
                :loading="loading"
                :totalRecords="totalRecords"
                lazy
                @page="loadData"
                @sort="loadData"
                @row-click="(event) => viewOrderDetails(event.data.id)"
                :rowClass="() => 'cursor-pointer'"
                dataKey="id"
                :rowHover="true"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} pesanan"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-end">
                        <div class="flex items-center gap-2">
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="filters['global'].value" placeholder="Cari..." @input="onSearchInput" @keydown.enter="onSearchInput" />
                            </IconField>
                            <div class="w-8 h-8 flex items-center justify-center">
                                <Button v-if="filters['global'].value" icon="pi pi-times" severity="danger" text rounded @click="clearSearch" v-tooltip.top="'Hapus Pencarian'" class="w-8 h-8 !p-0" />
                            </div>
                        </div>
                    </div>
                </template>
                <template #empty> Tidak ada pesanan ditemukan. </template>
                <Column field="created_at" header="Tanggal" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.created_at) }}
                    </template>
                </Column>
                <Column field="order_code" header="Kode Pesanan" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.order_code }}
                    </template>
                </Column>
                <Column field="customer_name" header="Pelanggan" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.customer_name || '-' }}
                    </template>
                </Column>
                <Column field="total_amount" header="Total Harga (Rp)" style="min-width: 12rem" alignHeader="right" bodyClass="text-right">
                    <template #body="{ data }">
                        <div class="text-right w-full">
                            {{ formatNumber(data.total_amount) }}
                        </div>
                    </template>
                </Column>
                <Column field="status" header="Status" style="min-width: 12rem">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Dialog Detail Pesanan -->
        <Dialog v-model:visible="showDetailDialog" modal :header="selectedOrder ? 'Detail Pesanan - ' + selectedOrder.order_code : 'Memuat Detail...'" :style="{ width: '600px' }">
            <div v-if="detailLoading" class="flex justify-center p-8">
                <ProgressSpinner />
            </div>
            <div v-else-if="selectedOrder" class="flex flex-col gap-4">
                <!-- Info Ringkas -->
                <div class="grid grid-cols-2 gap-4 bg-surface-50 dark:bg-surface-900/30 p-4 rounded-lg border border-surface-200 dark:border-surface-700">
                    <div>
                        <div class="text-sm text-surface-500 font-medium">Pelanggan</div>
                        <div class="font-semibold text-lg">{{ selectedOrder.customer_name || '-' }}</div>
                    </div>
                    <div>
                        <div class="text-sm text-surface-500 font-medium">Meja</div>
                        <div class="font-semibold text-lg">{{ selectedOrder.table_id || '-' }}</div>
                    </div>
                    <div>
                        <div class="text-sm text-surface-500 font-medium">Kasir</div>
                        <div class="font-semibold text-lg">{{ selectedOrder.staff_name || '-' }}</div>
                    </div>
                    <div>
                        <div class="text-sm text-surface-500 font-medium">Waktu Transaksi</div>
                        <div class="font-semibold">{{ formatDate(selectedOrder.created_at) }}</div>
                    </div>
                    <div>
                        <div class="text-sm text-surface-500 font-medium">Status</div>
                        <Tag :value="getStatusLabel(selectedOrder.status)" :severity="getStatusSeverity(selectedOrder.status)" class="mt-1" />
                    </div>
                    <div v-if="selectedOrder.payment">
                        <div class="text-sm text-surface-500 font-medium">Metode Pembayaran</div>
                        <div class="font-semibold mt-1">
                            <Tag :value="selectedOrder.payment.payment_method" severity="info" />
                        </div>
                    </div>
                </div>

                <!-- Daftar Item -->
                <div>
                    <h5 class="font-semibold mb-2">Item Pesanan</h5>
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-surface-100 dark:bg-surface-800 text-sm font-medium border-b border-surface-200 dark:border-surface-700">
                                    <th class="p-3">Menu</th>
                                    <th class="p-3 text-right">Harga</th>
                                    <th class="p-3 text-center">Qty</th>
                                    <th class="p-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in selectedOrder.items" :key="item.id" class="border-b border-surface-200 dark:border-surface-700 text-sm last:border-0">
                                    <td class="p-3 font-medium">{{ item.product_name || `Produk #${item.product_id}` }}</td>
                                    <td class="p-3 text-right">{{ formatCurrency(item.unit_price) }}</td>
                                    <td class="p-3 text-center">{{ item.quantity }}</td>
                                    <td class="p-3 text-right font-semibold">{{ formatCurrency(item.subtotal) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Ringkasan Keuangan -->
                <div class="flex flex-col gap-2 text-right border-t border-surface-200 dark:border-surface-700 pt-3">
                    <div class="flex justify-between text-lg font-bold">
                        <span>Total Bayar:</span>
                        <span class="text-primary">{{ formatCurrency(selectedOrder.total_amount) }}</span>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Tutup" severity="secondary" text @click="showDetailDialog = false" />
            </template>
        </Dialog>
    </div>
</template>