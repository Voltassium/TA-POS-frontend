<script setup lang="ts">
import { stockHistoryApi, type StockHistory } from '@/api/stockHistoryApi';
import { exportToExcel } from '@/utils/exportExcel';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const toast = useToast();
const stockHistories = ref<StockHistory[]>([]);
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

        const response = await stockHistoryApi.list({
            page,
            page_size: limit,
            search: filters.value.global.value || undefined
        });

        stockHistories.value = response.data;
        totalRecords.value = response.total_items;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat riwayat stok', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const getChangeLabel = (change: number) => {
    if (change > 0) return 'success';
    if (change < 0) return 'danger';
    return 'info';
};

const getChangeText = (change: number) => {
    if (change > 0) return `+${change}`;
    return change.toString();
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID');
};

const translateReason = (reason: string) => {
    if (!reason) return '-';
    
    let text = reason;
    text = text.replace(/Order ([\w-]+) Created/g, 'Pesanan $1 Dibuat');
    text = text.replace(/Order ([\w-]+) Cancelled/g, 'Pesanan $1 Dibatalkan');
    text = text.replace(/Item added to Order ([\w-]+)/g, 'Item ditambahkan ke Pesanan $1');
    text = text.replace(/Item removed from Order ([\w-]+)/g, 'Item dihapus dari Pesanan $1');
    
    if (text === 'Initial Stock') return 'Stok Awal';
    if (text.toLowerCase() === 'manual adjustment') return 'Penyesuaian Manual';
    if (text.toLowerCase() === 'stock update') return 'Pembaruan Stok';
    
    return text;
};

async function exportExcel() {
    try {
        const response = await stockHistoryApi.list({ page: 1, page_size: 10000 });
        exportToExcel(response.data, [
            { header: 'Produk', key: 'product_name', width: 25 },
            { header: 'Perubahan', key: 'change', width: 12, format: (v: number) => v > 0 ? `+${v}` : String(v) },
            { header: 'Alasan', key: 'reason', width: 35, format: (v: string) => translateReason(v) },
            { header: 'Tanggal', key: 'created_at', width: 22, format: (v: string) => formatDate(v) }
        ], 'Riwayat_Stok');
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
                    <h4 class="m-0">Riwayat Stok</h4>
                </template>
                <template #end>
                    <Button label="Ekspor Excel" icon="pi pi-file-excel" severity="success" @click="exportExcel" />
                </template>
            </Toolbar>
            <DataTable 
                ref="dt" 
                :value="stockHistories" 
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
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} riwayat"
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
                <template #empty> Tidak ada riwayat stok ditemukan. </template>
                <Column field="product_name" header="Produk" style="min-width: 10rem">
                    <template #body="{ data }">
                        {{ data.product_name }}
                    </template>
                </Column>
                <Column field="change" header="Perubahan" style="min-width: 12rem">
                    <template #body="{ data }">
                        <Tag :value="getChangeText(data.change)" :severity="getChangeLabel(data.change)" />
                    </template>
                </Column>
                <Column field="reason" header="Alasan" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ translateReason(data.reason) }}
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
