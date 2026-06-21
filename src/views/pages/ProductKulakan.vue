<script setup lang="ts">
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import type { Product } from '@/api/productApi';
import type { ProductType } from '@/api/productApi';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';

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
    product_type: 'Kulakan'
});

const categoryOptions = computed(() =>
    categoryStore.categories.map((c) => ({ label: c.name, value: c.id }))
);

const isKulakan = true;

onMounted(async () => {
    await loadProducts();
    try {
        await categoryStore.fetchCategories({ page: 1, page_size: 100 });
    } catch {
        // Silently fail — categories dropdown will be empty
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

function openNew() {
    product.value = { is_available: true, product_type: 'Kulakan' };
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
    if (value != null) return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
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
            product_type: 'Kulakan' as ProductType,
            sku: product.value.sku || null,
            harga_beli: product.value.harga_beli ?? null,
            name: product.value.name,
            description: product.value.description || '',
            price: product.value.price,
            is_available: product.value.is_available ?? true
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
                :value="productStore.products"
                :loading="productStore.loading"
                dataKey="id"
                :paginator="true"
                :rows="lazyParams.page_size"
                :totalRecords="productStore.totalItems"
                :lazy="true"
                :filters="filters"
                @page="onPage"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} produk"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Kelola Produk Kulakan</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." @keydown.enter="loadProducts" />
                        </IconField>
                    </div>
                </template>

                <template #empty> Tidak ada produk ditemukan. </template>

                <Column field="sku" header="SKU" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ slotProps.data.sku || '-' }}
                    </template>
                </Column>
                <Column field="name" header="Nama" sortable style="min-width: 14rem"></Column>
                <Column field="category_name" header="Kategori" sortable style="min-width: 10rem"></Column>

                <Column field="price" header="Harga Jual" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.price) }}
                    </template>
                </Column>
                <Column field="harga_beli" header="Harga Beli" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ slotProps.data.harga_beli ? formatCurrency(slotProps.data.harga_beli) : '-' }}
                    </template>
                </Column>
                <Column field="stock" header="Stok" sortable style="min-width: 8rem"></Column>
                <Column field="is_available" header="Ketersediaan" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.is_available ? 'Tersedia' : 'Habis'" :severity="slotProps.data.is_available ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column field="created_at" header="Dibuat" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.created_at).toLocaleDateString('id-ID') }}
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" v-tooltip.top="'Edit'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" v-tooltip.top="'Hapus'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="productDialog" :style="{ width: '500px' }" header="Detail Produk" :modal="true">
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
                    <label for="description" class="block font-bold mb-3">Deskripsi</label>
                    <Textarea id="description" v-model="product.description" rows="3" cols="20" fluid />
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

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="price" class="block font-bold mb-3">Harga Jual</label>
                        <InputNumber id="price" v-model="product.price" mode="currency" currency="IDR" locale="id-ID" :invalid="submitted && (product.price == null || product.price < 0)" fluid />
                        <small v-if="submitted && (product.price == null || product.price < 0)" class="text-red-500">Harga jual wajib diisi.</small>
                    </div>
                    <div v-if="isKulakan" class="col-span-6">
                        <label for="harga_beli" class="block font-bold mb-3">Harga Beli</label>
                        <InputNumber id="harga_beli" v-model="product.harga_beli" mode="currency" currency="IDR" locale="id-ID" fluid />
                    </div>
                    <div class="col-span-4">
                        <label for="stock" class="block font-bold mb-3">Stok</label>
                        <InputNumber id="stock" v-model="product.stock" fluid />
                    </div>
                    <div class="col-span-4">
                        <label for="is_available" class="block font-bold mb-3">Ketersediaan</label>
                        <ToggleSwitch id="is_available" v-model="product.is_available" />
                    </div>
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
