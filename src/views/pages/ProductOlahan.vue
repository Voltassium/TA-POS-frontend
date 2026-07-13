<script setup lang="ts">
import type { Product, ProductType } from '@/api/productApi';
import { productApi } from '@/api/productApi';
import { useCategoryStore } from '@/stores/categoryStore';
import { useProductStore } from '@/stores/productStore';
import { exportToExcel } from '@/utils/exportExcel';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const toast = useToast();
const productStore = useProductStore();
const categoryStore = useCategoryStore();

const dt = ref();
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const product = ref<Record<string, any>>({});
const submitted = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const lazyParams = ref<any>({
    page: 1,
    page_size: 10,
    search: undefined,
    product_type: 'Olahan'
});

const showDetailDialog = ref(false);
const selectedProduct = ref<Product | null>(null);

function onRowClick(event: { data: Product }) {
    selectedProduct.value = event.data;
    showDetailDialog.value = true;
}

function onEditFromDetail() {
    if (selectedProduct.value) {
        const prod = selectedProduct.value;
        showDetailDialog.value = false;
        editProduct(prod);
    }
}

function onDeleteFromDetail() {
    if (selectedProduct.value) {
        const prod = selectedProduct.value;
        showDetailDialog.value = false;
        confirmDeleteProduct(prod);
    }
}

const categoryOptions = computed(() =>
    categoryStore.categories.map((c) => ({ label: c.name, value: c.id }))
);

const isKulakan = false;

onMounted(async () => {
    await loadProducts();
    try {
        await categoryStore.fetchCategories({ page: 1, page_size: 100 });
    } catch {
    }
});

async function loadProducts() {
    try {
        lazyParams.value.search = filters.value.global.value || undefined;
        await productStore.fetchProducts(lazyParams.value);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat daftar produk', life: 3000 });
    }
}

function onPage(event: { page: number; rows: number }) {
    lazyParams.value.page = event.page + 1;
    lazyParams.value.page_size = event.rows;
    loadProducts();
}

function onSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        lazyParams.value.page = 1;
        loadProducts();
    }, 400);
}

function clearSearch() {
    filters.value.global.value = null;
    lazyParams.value.page = 1;
    loadProducts();
}

function openNew() {
    product.value = { is_available: true, product_type: 'Olahan' };
    submitted.value = false;
    productDialog.value = true;
}

function hideDialog() {
    productDialog.value = false;
    submitted.value = false;
}

function editProduct(prod: Product) {
    product.value = { ...prod };
    productDialog.value = true;
}

function confirmDeleteProduct(prod: Product) {
    product.value = prod;
    deleteProductDialog.value = true;
}

function formatCurrency(value: number) {
    if (value != null) return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return '-';
}

function formatNumber(value: number) {
    if (value != null) return value.toLocaleString('id-ID');
    return '-';
}

async function saveProduct() {
    submitted.value = true;

    if (!product.value.name?.trim()) return;
    if (!product.value.category_id) return;
    if (product.value.price == null || product.value.price < 0) return;

    try {
        const payload = {
            category_id: product.value.category_id,
            product_type: 'Olahan' as ProductType,
            sku: product.value.sku || null,
            harga_beli: null,
            name: product.value.name,
            price: product.value.price,
            stock: 0,
            is_available: true
        };

        if (product.value.id) {
            await productStore.updateProduct(product.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Produk berhasil diperbarui', life: 3000 });
        } else {
            await productStore.createProduct(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Produk berhasil ditambahkan', life: 3000 });
        }

        productDialog.value = false;
        product.value = {};
        await loadProducts();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan produk', life: 3000 });
    }
}

async function deleteProduct() {
    try {
        await productStore.deleteProduct(product.value.id);
        deleteProductDialog.value = false;
        product.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Produk berhasil dihapus', life: 3000 });
        await loadProducts();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus produk', life: 3000 });
    }
}

async function exportExcel() {
    try {
        const response = await productApi.list({ page: 1, page_size: 1000, product_type: 'Olahan' });
        exportToExcel(response.data, [
            { header: 'SKU', key: 'sku', width: 15, format: (v: string) => v || '-' },
            { header: 'Nama', key: 'name', width: 25 },
            { header: 'Kategori', key: 'category_name', width: 18 },
            { header: 'Harga Jual', key: 'price', width: 18, format: (v: number) => v != null ? v.toLocaleString('id-ID') : '-' },
            { header: 'Dibuat', key: 'created_at', width: 18, format: (v: string) => new Date(v).toLocaleDateString('id-ID') }
        ], 'Produk_Olahan');
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
                    <Button label="Tambah Baru" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Ekspor Excel" icon="pi pi-file-excel" severity="success" @click="exportExcel" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="productStore.products"
                :loading="productStore.loading"
                dataKey="id"
                :paginator="true"
                :rows="lazyParams.page_size"
                :totalRecords="productStore.totalItems"
                :lazy="true"
                :filters="filters"
                @page="onPage"
                @row-click="onRowClick"
                :rowClass="() => 'cursor-pointer'"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} produk"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Kelola Produk Olahan</h4>
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

                <template #empty> Tidak ada produk ditemukan. </template>

                <Column field="sku" header="SKU" style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ slotProps.data.sku || '-' }}
                    </template>
                </Column>
                <Column field="name" header="Nama" style="min-width: 14rem"></Column>
                <Column field="category_name" header="Kategori" style="min-width: 10rem"></Column>
                <Column field="price" header="Harga Jual (Rp)" style="min-width: 8rem; text-align: right">
                    <template #body="slotProps">
                        {{ formatNumber(slotProps.data.price) }}
                    </template>
                </Column>
                <Column field="created_at" header="Dibuat" style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.created_at).toLocaleDateString('id-ID') }}
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- ======== Dialog: Detail Produk ======== -->
        <Dialog
            v-model:visible="showDetailDialog"
            modal
            header="Detail Produk"
            :style="{ width: '450px' }"
            id="dialog-detail-produk"
        >
            <div class="flex flex-col gap-4 pt-2" v-if="selectedProduct">
                <div>
                    <p class="m-0 font-semibold text-lg">{{ selectedProduct.name }}</p>
                    <p class="text-surface-500 text-sm mt-1 mb-0" v-if="selectedProduct.sku">SKU: {{ selectedProduct.sku }}</p>
                </div>
                
                <hr class="border-surface-200 dark:border-surface-700 m-0" />

                <div class="flex flex-col gap-3">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-surface-500 font-medium">Kategori:</span>
                        <span class="text-surface-700 dark:text-surface-300">{{ selectedProduct.category_name }}</span>
                    </div>

                    <div class="flex justify-between items-center text-sm" v-if="isKulakan">
                         <span class="text-surface-500 font-medium">Harga Beli:</span>
                         <span class="text-surface-700 dark:text-surface-300">{{ formatCurrency(selectedProduct.harga_beli) }}</span>
                    </div>

                    <div class="flex justify-between items-center text-sm">
                        <span class="text-surface-500 font-medium">Harga Jual:</span>
                        <span class="text-surface-700 dark:text-surface-300 font-semibold">{{ formatCurrency(selectedProduct.price) }}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-surface-500 font-medium">Dibuat:</span>
                        <span class="text-surface-700 dark:text-surface-300">{{ new Date(selectedProduct.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}</span>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-between w-full">
                    <div class="flex gap-2">
                        <Button
                            id="btn-edit-detail"
                            label="Edit"
                            icon="pi pi-pencil"
                            severity="info"
                            outlined
                            @click="onEditFromDetail"
                        />
                        <Button
                            id="btn-delete-detail"
                            label="Hapus"
                            icon="pi pi-trash"
                            severity="danger"
                            outlined
                            @click="onDeleteFromDetail"
                        />
                    </div>
                    <Button label="Tutup" severity="secondary" text @click="showDetailDialog = false" />
                </div>
            </template>
        </Dialog>

        <!-- Dialog: Tambah/Edit Produk -->
        <Dialog v-model:visible="productDialog" :style="{ width: '500px' }" :header="product.id ? 'Edit Produk' : 'Tambah Produk'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="name" class="block font-bold mb-3">Nama</label>
                    <InputText id="name" v-model.trim="product.name" required autofocus :invalid="submitted && !product.name" fluid />
                    <small v-if="submitted && !product.name" class="text-red-500">Nama wajib diisi.</small>
                </div>
                <div>
                    <label for="sku" class="block font-bold mb-3">SKU</label>
                    <InputText id="sku" v-model.trim="product.sku" fluid />
                </div>

                <div>
                    <label for="category" class="block font-bold mb-3">Kategori</label>
                    <Select
                        id="category"
                        v-model="product.category_id"
                        :options="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Pilih Kategori"
                        :invalid="submitted && !product.category_id"
                        fluid
                    />
                    <small v-if="submitted && !product.category_id" class="text-red-500">Kategori wajib dipilih.</small>
                </div>

                <div>
                    <label for="price" class="block font-bold mb-3">Harga Jual</label>
                    <InputNumber id="price" v-model="product.price" mode="currency" currency="IDR" locale="id-ID" :invalid="submitted && (product.price == null || product.price < 0)" fluid />
                    <small v-if="submitted && (product.price == null || product.price < 0)" class="text-red-500">Harga jual wajib diisi.</small>
                </div>
            </div>

            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl!" />
                <span v-if="product">Apakah Anda yakin ingin menghapus <b>{{ product.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteProductDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteProduct" />
            </template>
        </Dialog>
    </div>
</template>
