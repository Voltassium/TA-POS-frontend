<script setup lang="ts">
import type { Order } from '@/api/orderApi';
import { orderApi } from '@/api/orderApi';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

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
            page_size: limit
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

onMounted(() => {
    loadData();
});
</script>

<template>
    <div>
        <div class="card">
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
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Riwayat Pesanan</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." @keydown.enter="loadData" />
                        </IconField>
                    </div>
                </template>
                <template #empty> Tidak ada pesanan ditemukan. </template>
                <Column field="order_code" header="Kode Pesanan" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.order_code }}
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