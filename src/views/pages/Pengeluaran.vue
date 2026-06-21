<script setup lang="ts">
import type { Pengeluaran } from '@/api/pengeluaranApi';
import { usePengeluaranStore } from '@/stores/pengeluaranStore';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const store = usePengeluaranStore();

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
    'Bahan Baku',
    'Gaji Karyawan',
    'Sewa Tempat',
    'Listrik & Air',
    'Gas & BBM',
    'Perlengkapan',
    'Perawatan',
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
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat daftar pengeluaran', life: 3000 });
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
    item.value = row;
    deleteDialog.value = true;
}

function formatCurrency(value: number) {
    if (value != null) return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
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
            await store.updateItem(item.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengeluaran berhasil diperbarui', life: 3000 });
        } else {
            await store.createItem(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengeluaran berhasil ditambahkan', life: 3000 });
        }

        itemDialog.value = false;
        item.value = {};
        await loadItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan pengeluaran', life: 3000 });
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
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus pengeluaran', life: 3000 });
    }
}

function onFilterDate() {
    lazyParams.value.page = 1;
    loadItems();
}

function clearDateFilter() {
    lazyParams.value.start_date = undefined;
    lazyParams.value.end_date = undefined;
    lazyParams.value.page = 1;
    loadItems();
}

function exportCSV() {
    dt.value.exportCSV();
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
                    <Button label="Ekspor" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
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
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Kelola Pengeluaran</h4>
                        <div class="flex gap-2 items-center">
                            <InputText v-model="lazyParams.start_date" type="date" placeholder="Dari tanggal" />
                            <span>—</span>
                            <InputText v-model="lazyParams.end_date" type="date" placeholder="Sampai tanggal" />
                            <Button icon="pi pi-search" severity="secondary" @click="onFilterDate" v-tooltip.top="'Filter'" />
                            <Button icon="pi pi-times" severity="danger" outlined @click="clearDateFilter" v-tooltip.top="'Hapus Filter'" />
                        </div>
                    </div>
                </template>

                <template #empty> Tidak ada pengeluaran ditemukan. </template>

                <Column field="tanggal" header="Tanggal" sortable style="min-width: 14rem">
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data.tanggal) }}
                    </template>
                </Column>
                <Column field="category" header="Kategori" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.category" severity="secondary" />
                    </template>
                </Column>
                <Column field="description" header="Keterangan" style="min-width: 16rem">
                    <template #body="slotProps">
                        {{ slotProps.data.description || '-' }}
                    </template>
                </Column>
                <Column field="amount" header="Jumlah" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <span class="font-semibold text-red-500">{{ formatCurrency(slotProps.data.amount) }}</span>
                    </template>
                </Column>
                <Column field="created_at" header="Dicatat" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.created_at).toLocaleDateString('id-ID') }}
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editItem(slotProps.data)" v-tooltip.top="'Edit'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteItem(slotProps.data)" v-tooltip.top="'Hapus'" />
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
