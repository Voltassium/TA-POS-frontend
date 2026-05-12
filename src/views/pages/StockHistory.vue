<script setup lang="ts">
import { stockHistoryApi, type StockHistory } from '@/api/stockHistoryApi';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

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

onMounted(() => {
    loadData();
});
</script>

<template>
    <div>
        <div class="card">
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
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Riwayat Stok</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." @keydown.enter="loadData" />
                        </IconField>
                    </div>
                </template>
                <template #empty> Tidak ada riwayat stok ditemukan. </template>
                <Column field="id" header="ID Riwayat" style="min-width: 10rem">
                    <template #body="{ data }"> #{{ data.id }} </template>
                </Column>
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
                <Column field="reason" header="Alasan" style="min-width: 12rem" />
                <Column field="created_at" header="Tanggal" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.created_at) }}
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
