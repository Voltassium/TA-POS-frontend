<script setup lang="ts">
import type { Order } from '@/api/orderApi';
import { orderApi } from '@/api/orderApi';
import { exportToExcel } from '@/utils/exportExcel';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// You might need to adjust the Order interface imports based on your existing code

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
    return (value ?? 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'Paid':
            return 'success';
        case 'Open':
            return 'info';
        case 'Ready':
            return 'warning';
        case 'Cancelled':
            return 'danger';
        default:
            return 'info';
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
                dataKey="id"
                :rowHover="true"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} pesanan"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-end">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." @input="onSearchInput" @keydown.enter="onSearchInput" />
                        </IconField>
                        <Button v-if="filters['global'].value" icon="pi pi-times" severity="danger" text rounded @click="clearSearch" v-tooltip.top="'Hapus Pencarian'" />
                    </div>
                </template>
                <template #empty> Tidak ada pesanan ditemukan. </template>
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
                <Column field="total_amount" header="Total Harga" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatCurrency(data.total_amount) }}
                    </template>
                </Column>
                <Column field="status" header="Status" style="min-width: 12rem">
                    <template #body="{ data }">
                        <Tag :value="data.status" :severity="getStatusLabel(data.status)" />
                    </template>
                </Column>
                <Column field="created_at" header="Tanggal" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.created_at) }}
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>