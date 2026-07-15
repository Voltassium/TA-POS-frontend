<script setup lang="ts">
import type { Pengeluaran } from '@/api/pengeluaranApi';
import { pengeluaranApi } from '@/api/pengeluaranApi';
import { usePengeluaranStore } from '@/stores/pengeluaranStore';
import { useOnlineStatus } from '@/composables/useOnlineStatus';
import { exportToExcel } from '@/utils/exportExcel';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { getErrorMessage } from '@/utils/errorUtils';

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const toast = useToast();
const store = usePengeluaranStore();
const { isOffline } = useOnlineStatus();

const dt = ref();
const itemDialog = ref(false);
const deleteDialog = ref(false);
const item = ref<Record<string, any>>({});
const submitted = ref(false);
const lazyParams = ref<any>({
    page: 1,
    page_size: 10,
    start_date: undefined,
    end_date: undefined,
    search: undefined
});

const categoryOptions = ref([
    'Belanja Harian',
    'Gaji Karyawan',
    'Sewa Tempat',
    'Listrik & Air',
    'Perlengkapan',
    'Transportasi',
    'Marketing',
    'Lainnya'
]);

onMounted(() => {
    loadItems();
});

async function loadItems() {
    try {
        await store.fetchItems(lazyParams.value);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: getErrorMessage(error, 'Gagal memuat daftar pengeluaran'), life: 3000 });
    }
}

function onPage(event: { page: number; rows: number }) {
    lazyParams.value.page = event.page + 1;
    lazyParams.value.page_size = event.rows;
    loadItems();
}

function openNew() {
    item.value = {
        tanggal: new Date().toISOString().split('T')[0],
        category: null,
        description: '',
        amount: null
    };
    submitted.value = false;
    itemDialog.value = true;
}

function hideDialog() {
    itemDialog.value = false;
    submitted.value = false;
}

function editItem(row: Pengeluaran) {
    item.value = { ...row };
    itemDialog.value = true;
}

function confirmDeleteItem(row: Pengeluaran) {
    if (isOffline.value) {
        toast.add({
            severity: 'warn',
            summary: 'Tidak Tersedia Offline',
            detail: 'Operasi hapus tidak dapat dilakukan saat offline. Hubungkan kembali ke internet.',
            life: 4000
        });
        return;
    }
    item.value = row;
    deleteDialog.value = true;
}

function formatCurrency(value: number) {
    if (value != null) return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return '-';
}

function formatNumber(value: number) {
    if (value != null) return value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return '-';
}

function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function saveItem() {
    submitted.value = true;

    if (!item.value.tanggal) return;
    if (!item.value.category) return;
    if (item.value.amount == null || item.value.amount <= 0) return;

    try {
        const payload = {
            tanggal: item.value.tanggal,
            category: item.value.category,
            description: item.value.description || null,
            amount: item.value.amount
        };

        if (item.value.id) {
            const result = await store.updateItem(item.value.id, payload);
            const isOfflineResult = result && typeof result === 'object' && 'offline' in result;
            toast.add({
                severity: isOfflineResult ? 'warn' : 'success',
                summary: isOfflineResult ? 'Disimpan Offline' : 'Berhasil',
                detail: isOfflineResult
                    ? 'Pengeluaran diperbarui secara lokal dan akan disinkronkan saat online.'
                    : 'Pengeluaran berhasil diperbarui',
                life: 3000
            });
        } else {
            const result = await store.createItem(payload);
            const isOfflineResult = result && typeof result === 'object' && 'offline' in result;
            toast.add({
                severity: isOfflineResult ? 'warn' : 'success',
                summary: isOfflineResult ? 'Disimpan Offline' : 'Berhasil',
                detail: isOfflineResult
                    ? 'Pengeluaran ditambahkan secara lokal dan akan disinkronkan saat online.'
                    : 'Pengeluaran berhasil ditambahkan',
                life: 3000
            });
        }

        itemDialog.value = false;
        item.value = {};
        if (!isOffline.value) await loadItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: getErrorMessage(error, 'Gagal menyimpan pengeluaran'), life: 3000 });
    }
}

async function deleteItem() {
    try {
        await store.deleteItem(item.value.id);
        deleteDialog.value = false;
        item.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengeluaran berhasil dihapus', life: 3000 });
        await loadItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: getErrorMessage(error, 'Gagal menghapus pengeluaran'), life: 3000 });
    }
}

const dateRange = ref<Date[] | null>(null);

function formatDateToYmd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function onFilterDate() {
    if (dateRange.value && dateRange.value[0]) {
        lazyParams.value.start_date = formatDateToYmd(dateRange.value[0]);
        if (dateRange.value[1]) {
            lazyParams.value.end_date = formatDateToYmd(dateRange.value[1]);
        } else {
            lazyParams.value.end_date = lazyParams.value.start_date;
        }
    } else {
        lazyParams.value.start_date = undefined;
        lazyParams.value.end_date = undefined;
    }
    lazyParams.value.page = 1;
    loadItems();
}

function clearDateFilter() {
    dateRange.value = null;
    lazyParams.value.start_date = undefined;
    lazyParams.value.end_date = undefined;
    lazyParams.value.page = 1;
    loadItems();
}

function onSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        lazyParams.value.page = 1;
        loadItems();
    }, 400);
}

function clearSearch() {
    lazyParams.value.search = undefined;
    lazyParams.value.page = 1;
    loadItems();
}

async function exportExcel() {
    try {
        const params: any = { page: 1, page_size: 10000 };
        if (lazyParams.value.start_date) params.start_date = lazyParams.value.start_date;
        if (lazyParams.value.end_date) params.end_date = lazyParams.value.end_date;
        const response = await pengeluaranApi.list(params);
        const fmtCurrency = (v: number) => v != null ? v.toLocaleString('id-ID') : '-';
        const fmtDate = (v: string) => new Date(v + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        exportToExcel(response.data, [
            { header: 'Tanggal', key: 'tanggal', width: 28, format: (v: string) => fmtDate(v) },
            { header: 'Kategori', key: 'category', width: 18 },
            { header: 'Keterangan', key: 'description', width: 30, format: (v: string) => v || '-' },
            { header: 'Jumlah', key: 'amount', width: 20, format: (v: number) => fmtCurrency(v) },
            { header: 'Dicatat', key: 'created_at', width: 18, format: (v: string) => new Date(v).toLocaleDateString('id-ID') }
        ], 'Pengeluaran');
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil diekspor', life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengekspor data', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Pengeluaran" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Ekspor Excel" icon="pi pi-file-excel" severity="success" @click="exportExcel" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="store.items"
                :loading="store.loading"
                dataKey="id"
                :paginator="true"
                :rows="lazyParams.page_size"
                :totalRecords="store.totalItems"
                :lazy="true"
                @page="onPage"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} pengeluaran"
            >
                <template #header>
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h4 class="m-0 text-xl font-bold">Kelola Pengeluaran</h4>
                        <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
                            <!-- Search -->
                            <div class="flex items-center gap-2">
                                <IconField class="flex-1 sm:w-64">
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText v-model="lazyParams.search" placeholder="Cari..." class="w-full" @input="onSearchInput" @keydown.enter="onSearchInput" />
                                </IconField>
                                <Button v-if="lazyParams.search" icon="pi pi-times" severity="danger" text rounded @click="clearSearch" v-tooltip.top="'Hapus Pencarian'" />
                            </div>
                            <span class="hidden sm:inline text-surface-300">|</span>
                            <!-- Date Range Picker -->
                            <div class="flex items-center gap-2">
                                <DatePicker
                                    v-model="dateRange"
                                    selectionMode="range"
                                    :manualInput="false"
                                    placeholder="Filter Tanggal"
                                    showIcon
                                    iconDisplay="input"
                                    dateFormat="dd/mm/yy"
                                    class="flex-1 sm:w-60"
                                />
                                <Button icon="pi pi-filter" severity="secondary" @click="onFilterDate" v-tooltip.top="'Filter Tanggal'" />
                                <Button v-if="dateRange" icon="pi pi-filter-slash" severity="danger" outlined @click="clearDateFilter" v-tooltip.top="'Hapus Filter Tanggal'" />
                            </div>
                        </div>
                    </div>
                </template>

                <template #empty> Tidak ada pengeluaran ditemukan. </template>

                <Column field="tanggal" header="Tanggal" style="min-width: 14rem">
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data.tanggal) }}
                    </template>
                </Column>
                <Column field="category" header="Kategori" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.category" severity="secondary" />
                    </template>
                </Column>
                <Column field="description" header="Keterangan" style="min-width: 16rem">
                    <template #body="slotProps">
                        {{ slotProps.data.description || '-' }}
                    </template>
                </Column>
                <Column field="amount" header="Jumlah (Rp)" style="min-width: 10rem" alignHeader="right" bodyClass="text-right">
                    <template #body="slotProps">
                        <div class="text-right w-full">
                            <span class="font-semibold text-red-500">{{ formatNumber(slotProps.data.amount) }}</span>
                        </div>
                    </template>
                </Column>
                <Column field="created_at" header="Dicatat" style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.created_at).toLocaleDateString('id-ID') }}
                    </template>
                </Column>

            </DataTable>
        </div>

        <Dialog v-model:visible="itemDialog" :style="{ width: '500px' }" header="Detail Pengeluaran" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="tanggal" class="block font-bold mb-3">Tanggal</label>
                    <InputText id="tanggal" v-model="item.tanggal" type="date" :invalid="submitted && !item.tanggal" fluid />
                    <small v-if="submitted && !item.tanggal" class="text-red-500">Tanggal wajib diisi.</small>
                </div>
                <div>
                    <label for="category" class="block font-bold mb-3">Kategori Pengeluaran</label>
                    <Select
                        id="category"
                        v-model="item.category"
                        :options="categoryOptions"
                        placeholder="Pilih Kategori"
                        :invalid="submitted && !item.category"
                        fluid
                    />
                    <small v-if="submitted && !item.category" class="text-red-500">Kategori wajib dipilih.</small>
                </div>
                <div>
                    <label for="amount" class="block font-bold mb-3">Jumlah (Rp)</label>
                    <InputNumber id="amount" v-model="item.amount" mode="currency" currency="IDR" locale="id-ID" :invalid="submitted && (item.amount == null || item.amount <= 0)" fluid />
                    <small v-if="submitted && (item.amount == null || item.amount <= 0)" class="text-red-500">Jumlah wajib diisi dan lebih dari 0.</small>
                </div>
                <div>
                    <label for="description" class="block font-bold mb-3">Keterangan</label>
                    <Textarea id="description" v-model="item.description" rows="3" fluid />
                </div>
            </div>

            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveItem" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl!" />
                <span>Apakah Anda yakin ingin menghapus pengeluaran <b>{{ item.category }}</b> sebesar <b>{{ formatCurrency(item.amount) }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteItem" />
            </template>
        </Dialog>
    </div>
</template>
