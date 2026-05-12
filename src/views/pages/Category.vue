<script setup lang="ts">
import type { Category } from '@/api/categoryApi';
import { useCategoryStore } from '@/stores/categoryStore';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const categoryStore = useCategoryStore();

const dt = ref();
const categoryDialog = ref(false);
const deleteCategoryDialog = ref(false);
const category = ref<Partial<Category>>({});
const submitted = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const lazyParams = ref({
    page: 1,
    page_size: 10
});

onMounted(() => {
    loadCategories();
});

async function loadCategories() {
    try {
        await categoryStore.fetchCategories(lazyParams.value);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat daftar kategori', life: 3000 });
    }
}

function onPage(event: { page: number; rows: number }) {
    lazyParams.value.page = event.page + 1;
    lazyParams.value.page_size = event.rows;
    loadCategories();
}

function openNew() {
    category.value = {};
    submitted.value = false;
    categoryDialog.value = true;
}

function hideDialog() {
    categoryDialog.value = false;
    submitted.value = false;
}

function editCategory(cat: Category) {
    category.value = { ...cat };
    categoryDialog.value = true;
}

function confirmDeleteCategory(cat: Category) {
    category.value = cat;
    deleteCategoryDialog.value = true;
}

async function saveCategory() {
    submitted.value = true;

    if (!category.value.name?.trim()) return;

    try {
        if (category.value.id) {
            await categoryStore.updateCategory(category.value.id, {
                name: category.value.name,
                image_url: category.value.image_url
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kategori berhasil diperbarui', life: 3000 });
        } else {
            await categoryStore.createCategory({
                name: category.value.name,
                image_url: category.value.image_url
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kategori berhasil ditambahkan', life: 3000 });
        }
        categoryDialog.value = false;
        category.value = {};
        await loadCategories();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan kategori', life: 3000 });
    }
}

async function deleteCategory() {
    try {
        await categoryStore.deleteCategory(category.value.id!);
        deleteCategoryDialog.value = false;
        category.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kategori berhasil dihapus', life: 3000 });
        await loadCategories();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus kategori', life: 3000 });
    }
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
                    <Button label="Tambah Baru" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Ekspor" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="categoryStore.categories"
                :loading="categoryStore.loading"
                dataKey="id"
                :paginator="true"
                :rows="lazyParams.page_size"
                :totalRecords="categoryStore.totalItems"
                :lazy="true"
                :filters="filters"
                @page="onPage"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} kategori"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Kelola Kategori</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <template #empty> Tidak ada kategori ditemukan. </template>

                <Column field="id" header="ID" sortable style="min-width: 6rem"></Column>
                <Column field="name" header="Nama" sortable style="min-width: 16rem"></Column>
                <Column field="image_url" header="Gambar" style="min-width: 12rem">
                    <template #body="slotProps">
                        <img v-if="slotProps.data.image_url" :src="slotProps.data.image_url" alt="Gambar kategori" class="rounded" style="width: 64px; height: 64px; object-fit: cover" />
                        <span v-else class="text-surface-400">Tidak ada gambar</span>
                    </template>
                </Column>
                <Column field="created_at" header="Dibuat" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.created_at).toLocaleDateString('id-ID') }}
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCategory(slotProps.data)" v-tooltip.top="'Edit'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteCategory(slotProps.data)" v-tooltip.top="'Hapus'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="categoryDialog" :style="{ width: '450px' }" header="Detail Kategori" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="name" class="block font-bold mb-3">Nama</label>
                    <InputText id="name" v-model.trim="category.name" required autofocus :invalid="submitted && !category.name" fluid />
                    <small v-if="submitted && !category.name" class="text-red-500">Nama wajib diisi.</small>
                </div>
                <div>
                    <label for="image_url" class="block font-bold mb-3">URL Gambar</label>
                    <InputText id="image_url" v-model.trim="category.image_url" fluid placeholder="https://..." />
                </div>
            </div>

            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveCategory" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCategoryDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl!" />
                <span v-if="category">Apakah Anda yakin ingin menghapus <b>{{ category.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteCategoryDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteCategory" />
            </template>
        </Dialog>
    </div>
</template>
