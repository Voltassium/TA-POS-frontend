<script setup lang="ts">
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import { paymentApi } from '@/api/paymentApi';
import type { PaymentCreatePayload } from '@/api/paymentApi';
import type { Order } from '@/api/orderApi';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import '@/assets/print.css';

const toast = useToast();
const orderStore = useOrderStore();
const productStore = useProductStore();

const orderDialog = ref(false);
const detailDialog = ref(false);
const deleteOrderDialog = ref(false);
const paymentDialog = ref(false);
const order = ref<Record<string, any>>({});
const submitted = ref(false);
const saving = ref(false);
const payingSaving = ref(false);

const statusFilter = ref<string | null>(null);
const lazyParams = ref({
    page: 1,
    page_size: 12
});
const statusOptions = ref([
    { label: 'Semua', value: null },
    { label: 'Buka', value: 'Open' },
    { label: 'Lunas', value: 'Paid' },
    { label: 'Dibatalkan', value: 'Cancelled' }
]);

// New order items state
const selectedProduct = ref<any>(null);
const selectedQuantity = ref<number>(1);
const orderProducts = ref<any[]>([]);

// Payment state
const paymentMethod = ref<'Cash' | 'Card' | 'Digital Wallet'>('Cash');
const amountPaid = ref<number>(0);
const paymentMethodOptions = ref([
    { label: 'Tunai', value: 'Cash' },
    { label: 'Kartu', value: 'Card' },
    { label: 'Dompet Digital', value: 'Digital Wallet' }
]);

const productOptions = computed(() => {
    return productStore.products.map(p => ({
        label: `${p.name} — ${formatCurrency(p.price)}`,
        value: p,
        product_id: p.id,
        product_name: p.name,
        price: p.price
    }));
});

const orderTotal = computed(() => {
    return orderProducts.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const paymentChange = computed(() => {
    if (!orderStore.selectedOrder) return 0;
    return Math.max(0, amountPaid.value - orderStore.selectedOrder.total_amount);
});

onMounted(() => {
    loadOrders();
});

async function loadOrders() {
    try {
        const params: Record<string, any> = { ...lazyParams.value };
        if (statusFilter.value) {
            params.status = statusFilter.value;
        }
        await orderStore.fetchOrders(params);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat daftar pesanan', life: 3000 });
    }
}

function onPage(event: { page: number; rows: number }) {
    lazyParams.value.page = event.page + 1;
    lazyParams.value.page_size = event.rows;
    loadOrders();
}

function onStatusFilter() {
    lazyParams.value.page = 1;
    loadOrders();
}

async function openNew() {
    order.value = { table_id: null };
    orderProducts.value = [];
    selectedProduct.value = null;
    selectedQuantity.value = 1;
    submitted.value = false;
    saving.value = false;

    try {
        await productStore.fetchProducts({ page: 1, page_size: 100 });
    } catch (e) {}

    orderDialog.value = true;
}

function hideDialog() {
    orderDialog.value = false;
    submitted.value = false;
}

function addProductToOrder() {
    if (!selectedProduct.value) return;

    const existing = orderProducts.value.find(item => item.product_id === selectedProduct.value.product_id);
    if (existing) {
        existing.quantity += selectedQuantity.value;
    } else {
        orderProducts.value.push({
            product_id: selectedProduct.value.product_id,
            product_name: selectedProduct.value.product_name,
            price: selectedProduct.value.price,
            quantity: selectedQuantity.value
        });
    }

    selectedProduct.value = null;
    selectedQuantity.value = 1;
}

function removeProductFromOrder(index: number) {
    orderProducts.value.splice(index, 1);
}

async function viewOrderDetail(ord: Order) {
    try {
        await orderStore.fetchOrderDetail(ord.id);
        detailDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat detail pesanan', life: 3000 });
    }
}

function confirmCancelOrder(ord: Order) {
    order.value = ord;
    deleteOrderDialog.value = true;
}

function openPaymentDialog(ord: Order) {
    viewOrderDetail(ord).then(() => {
        paymentMethod.value = 'Cash';
        amountPaid.value = orderStore.selectedOrder?.total_amount || 0;
        payingSaving.value = false;
        paymentDialog.value = true;
    });
}

async function submitPayment() {
    if (!orderStore.selectedOrder) return;
    if (amountPaid.value < orderStore.selectedOrder.total_amount) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Jumlah bayar kurang dari total pesanan', life: 3000 });
        return;
    }

    payingSaving.value = true;
    try {
        const payload: PaymentCreatePayload = {
            order_id: orderStore.selectedOrder.id,
            payment_method: paymentMethod.value,
            amount_paid: amountPaid.value
        };
        await paymentApi.create(payload);

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pembayaran berhasil diproses', life: 3000 });
        paymentDialog.value = false;
        await loadOrders();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memproses pembayaran', life: 3000 });
    } finally {
        payingSaving.value = false;
    }
}

async function saveOrder() {
    submitted.value = true;

    if (orderProducts.value.length === 0) return;

    saving.value = true;
    try {
        const payload = {
            table_id: order.value.table_id || undefined,
            items: orderProducts.value.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        };

        await orderStore.createOrder(payload);

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pesanan berhasil dibuat', life: 3000 });
        orderDialog.value = false;
        order.value = {};
        await loadOrders();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal membuat pesanan', life: 3000 });
    } finally {
        saving.value = false;
    }
}

async function updateStatus(ord: Order, newStatus: 'Open' | 'Paid' | 'Cancelled') {
    try {
        await orderStore.updateOrderStatus(ord.id, newStatus);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: `Status pesanan diperbarui`, life: 3000 });
        await loadOrders();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui status', life: 3000 });
    }
}

async function cancelOrder() {
    try {
        await orderStore.cancelOrder(order.value.id);
        deleteOrderDialog.value = false;
        order.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pesanan dibatalkan', life: 3000 });
        await loadOrders();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal membatalkan pesanan', life: 3000 });
    }
}

function getStatusSeverity(status: string) {
    switch (status) {
        case 'Open': return 'info';
        case 'Paid': return 'success';
        case 'Cancelled': return 'danger';
        default: return undefined;
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'Open': return 'Buka';
        case 'Paid': return 'Lunas';
        case 'Cancelled': return 'Dibatalkan';
        case 'Ready': return 'Siap';
        default: return status;
    }
}

function formatCurrency(value: number) {
    if (value != null) return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    return '-';
}

function formatTableId(tableId: number | null) {
    return tableId != null ? tableId : '-';
}

function printReceipt() {
    window.print();
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Pesanan Baru" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Select
                        v-model="statusFilter"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Filter Status"
                        @change="onStatusFilter"
                        style="width: 200px"
                    />
                </template>
            </Toolbar>

            <!-- Cards Grid View -->
            <div v-if="orderStore.loading" class="flex justify-center p-8">
                <ProgressSpinner />
            </div>

            <div v-else-if="orderStore.orders.length === 0" class="text-center p-8 text-surface-500">
                Belum ada pesanan yang ditemukan.
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div v-for="ord in orderStore.orders" :key="ord.id" class="col-span-1">
                    <Card class="h-full flex flex-col">
                        <template #title>
                            <div class="flex justify-between items-center">
                                <span>#{{ ord.id }}</span>
                                <Tag :value="getStatusLabel(ord.status)" :severity="getStatusSeverity(ord.status)" />
                            </div>
                        </template>
                        <template #subtitle>
                            Meja: {{ formatTableId(ord.table_id) }}
                        </template>
                        <template #content>
                            <div class="flex flex-col gap-2 mt-2">
                                <span class="text-sm">Kasir ID: {{ ord.staff_id }}</span>
                                <span class="font-bold text-lg text-primary">{{ formatCurrency(ord.total_amount) }}</span>
                                <span class="text-xs text-surface-500">{{ new Date(ord.created_at).toLocaleString('id-ID') }}</span>
                            </div>
                        </template>
                        <template #footer>
                            <div class="flex gap-2 justify-end mt-auto pt-4">
                                <Button icon="pi pi-eye" outlined rounded @click="viewOrderDetail(ord)" v-tooltip.top="'Lihat Detail'" />
                                <Button
                                    v-if="ord.status === 'Open'"
                                    icon="pi pi-wallet"
                                    outlined
                                    rounded
                                    severity="success"
                                    @click="openPaymentDialog(ord)"
                                    v-tooltip.top="'Bayar'"
                                />
                                <Button
                                    v-if="ord.status === 'Open'"
                                    icon="pi pi-times"
                                    outlined
                                    rounded
                                    severity="danger"
                                    @click="confirmCancelOrder(ord)"
                                    v-tooltip.top="'Batalkan'"
                                />
                            </div>
                        </template>
                    </Card>
                </div>
            </div>

            <!-- Paginator -->
            <Paginator
                v-if="orderStore.totalItems > 0"
                :rows="lazyParams.page_size"
                :totalRecords="orderStore.totalItems"
                :rowsPerPageOptions="[6, 12, 24]"
                @page="onPage"
            />
        </div>

        <!-- Create Order Dialog -->
        <Dialog v-model:visible="orderDialog" :style="{ width: '650px' }" header="Pesanan Baru" :modal="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="table_id" class="block font-bold mb-2">Nomor Meja <span class="text-surface-400 font-normal text-sm">(opsional)</span></label>
                    <InputNumber id="table_id" v-model="order.table_id" :min="1" placeholder="Kosongkan jika tanpa meja" fluid />
                </div>

                <Divider />

                <div>
                    <label class="block font-bold mb-2">Tambah Produk</label>
                    <div class="flex items-center gap-2 mb-4">
                        <Select
                            v-model="selectedProduct"
                            :options="productOptions"
                            optionLabel="label"
                            placeholder="Pilih Produk"
                            class="flex-1"
                            filter
                        />
                        <InputNumber v-model="selectedQuantity" :min="1" placeholder="Qty" style="width: 80px" />
                        <Button icon="pi pi-plus" severity="secondary" @click="addProductToOrder" :disabled="!selectedProduct" />
                    </div>

                    <transition-group name="list" tag="div">
                        <div v-for="(item, index) in orderProducts" :key="item.product_id" class="flex items-center justify-between p-3 mb-2 border border-surface-200 dark:border-surface-700 rounded-lg transition-all duration-300">
                            <div class="flex-1">
                                <span class="font-semibold">{{ item.product_name }}</span>
                                <div class="text-sm text-surface-500 mt-1">
                                    {{ item.quantity }}x {{ formatCurrency(item.price) }}
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="font-semibold text-primary">{{ formatCurrency(item.price * item.quantity) }}</span>
                                <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="removeProductFromOrder(index)" />
                            </div>
                        </div>
                    </transition-group>

                    <p v-if="orderProducts.length === 0 && !submitted" class="text-surface-400 text-sm text-center py-4">Belum ada produk yang ditambahkan.</p>
                    <small v-if="submitted && orderProducts.length === 0" class="text-red-500">Tambahkan minimal 1 produk untuk membuat pesanan.</small>
                </div>
            </div>

            <template #footer>
                <div class="flex items-center justify-between w-full">
                    <div class="font-bold text-lg">
                        Total: <span class="text-primary">{{ formatCurrency(orderTotal) }}</span>
                    </div>
                    <div class="flex gap-2">
                        <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                        <Button label="Buat Pesanan" icon="pi pi-check" @click="saveOrder" :loading="saving" :disabled="saving" />
                    </div>
                </div>
            </template>
        </Dialog>

        <!-- Payment Dialog -->
        <Dialog v-model:visible="paymentDialog" :style="{ width: '500px' }" header="Pembayaran" :modal="true">
            <div v-if="orderStore.selectedOrder" class="flex flex-col gap-4">
                <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-surface-500">Pesanan</span>
                        <span class="font-bold">#{{ orderStore.selectedOrder.id }}</span>
                    </div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-surface-500">Meja</span>
                        <span class="font-bold">{{ formatTableId(orderStore.selectedOrder.table_id) }}</span>
                    </div>
                    <Divider />
                    <div v-for="item in orderStore.selectedOrder.items" :key="item.id" class="flex justify-between items-center text-sm mb-1">
                        <span>{{ item.product_name }} x{{ item.quantity }}</span>
                        <span>{{ formatCurrency(item.subtotal) }}</span>
                    </div>
                    <Divider />
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-lg">Total</span>
                        <span class="font-bold text-lg text-primary">{{ formatCurrency(orderStore.selectedOrder.total_amount) }}</span>
                    </div>
                </div>

                <div>
                    <label class="block font-bold mb-2">Metode Pembayaran</label>
                    <Select
                        v-model="paymentMethod"
                        :options="paymentMethodOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Pilih metode"
                        fluid
                    />
                </div>

                <div>
                    <label class="block font-bold mb-2">Jumlah Bayar</label>
                    <InputNumber v-model="amountPaid" mode="currency" currency="IDR" locale="id-ID" :min="0" fluid />
                </div>

                <div v-if="amountPaid >= orderStore.selectedOrder.total_amount" class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                    <span class="text-surface-500">Kembalian: </span>
                    <span class="font-bold text-xl text-green-600 dark:text-green-400">{{ formatCurrency(paymentChange) }}</span>
                </div>
                <div v-else-if="amountPaid > 0" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                    <span class="text-red-500 text-sm">Jumlah bayar kurang {{ formatCurrency(orderStore.selectedOrder.total_amount - amountPaid) }}</span>
                </div>
            </div>

            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="paymentDialog = false" />
                <Button
                    label="Proses Pembayaran"
                    icon="pi pi-wallet"
                    @click="submitPayment"
                    :loading="payingSaving"
                    :disabled="payingSaving || !orderStore.selectedOrder || amountPaid < (orderStore.selectedOrder?.total_amount || 0)"
                />
            </template>
        </Dialog>

        <!-- Order Detail Dialog -->
        <Dialog v-model:visible="detailDialog" :style="{ width: '700px' }" header="Detail Pesanan" :modal="true">
            <div v-if="orderStore.selectedOrder" class="flex flex-col gap-4">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-4">
                        <span class="font-bold">ID Pesanan:</span> {{ orderStore.selectedOrder.id }}
                    </div>
                    <div class="col-span-4">
                        <span class="font-bold">Meja:</span> {{ formatTableId(orderStore.selectedOrder.table_id) }}
                    </div>
                    <div class="col-span-4">
                        <span class="font-bold">Status:</span>
                        <Tag :value="getStatusLabel(orderStore.selectedOrder.status)" :severity="getStatusSeverity(orderStore.selectedOrder.status)" />
                    </div>
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-4">
                        <span class="font-bold">Kasir ID:</span> {{ orderStore.selectedOrder.staff_id }}
                    </div>
                    <div class="col-span-4">
                        <span class="font-bold">Total:</span> {{ formatCurrency(orderStore.selectedOrder.total_amount) }}
                    </div>
                    <div class="col-span-4">
                        <span class="font-bold">Dibuat:</span> {{ new Date(orderStore.selectedOrder.created_at).toLocaleString('id-ID') }}
                    </div>
                </div>

                <Divider />

                <h5>Daftar Produk</h5>
                <DataTable :value="orderStore.selectedOrder.items" dataKey="id" v-if="orderStore.selectedOrder.items && orderStore.selectedOrder.items.length > 0">
                    <Column field="product_name" header="Produk" style="min-width: 12rem">
                        <template #body="slotProps">
                            {{ slotProps.data.product_name || `Produk #${slotProps.data.product_id}` }}
                        </template>
                    </Column>
                    <Column field="quantity" header="Qty" style="min-width: 4rem"></Column>
                    <Column field="unit_price" header="Harga" style="min-width: 8rem">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.unit_price) }}
                        </template>
                    </Column>
                    <Column field="subtotal" header="Subtotal" style="min-width: 8rem">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.subtotal) }}
                        </template>
                    </Column>
                </DataTable>
                <p v-else class="text-surface-400">Tidak ada item di pesanan ini.</p>

                <Divider />

                <h5>Pembayaran</h5>
                <div v-if="orderStore.selectedOrder.payment">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-4">
                            <span class="font-bold">Metode:</span> {{ orderStore.selectedOrder.payment.payment_method }}
                        </div>
                        <div class="col-span-4">
                            <span class="font-bold">Dibayar:</span> {{ formatCurrency(orderStore.selectedOrder.payment.amount_paid) }}
                        </div>
                        <div class="col-span-4">
                            <span class="font-bold">Waktu:</span> {{ new Date(orderStore.selectedOrder.payment.timestamp).toLocaleString('id-ID') }}
                        </div>
                    </div>
                </div>
                <p v-else class="text-surface-400">Belum ada pembayaran.</p>

                <!-- Printable Receipt Template -->
                <div id="printable-receipt" class="hidden">
                    <div class="receipt-container">
                        <div class="receipt-header">
                            <h2>Sistem POS</h2>
                            <p>Pesanan #{{ orderStore.selectedOrder.id }} - Meja {{ formatTableId(orderStore.selectedOrder.table_id) }}</p>
                            <p>{{ new Date(orderStore.selectedOrder.created_at).toLocaleString('id-ID') }}</p>
                        </div>
                        <div v-for="item in orderStore.selectedOrder.items" :key="item.product_id" class="receipt-item">
                            <div>
                                {{ item.product_name || `Produk #${item.product_id}` }}<br>
                                {{ item.quantity }} x {{ formatCurrency(item.unit_price) }}
                            </div>
                            <div>
                                <br>{{ formatCurrency(item.subtotal) }}
                            </div>
                        </div>
                        <div class="receipt-total">
                            Total: {{ formatCurrency(orderStore.selectedOrder.total_amount) }}
                            <div v-if="orderStore.selectedOrder.payment">
                                Dibayar: {{ formatCurrency(orderStore.selectedOrder.payment.amount_paid) }}
                            </div>
                        </div>
                        <div class="receipt-footer">
                            Terima Kasih Atas Kunjungan Anda!
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cetak Nota" icon="pi pi-print" severity="secondary" @click="printReceipt" />
                <Button label="Tutup" icon="pi pi-times" text @click="detailDialog = false" />
            </template>
        </Dialog>

        <!-- Cancel Order Confirmation -->
        <Dialog v-model:visible="deleteOrderDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl!" />
                <span v-if="order">Apakah Anda yakin ingin membatalkan Pesanan <b>#{{ order.id }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteOrderDialog = false" />
                <Button label="Ya, Batalkan" icon="pi pi-check" severity="danger" @click="cancelOrder" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}
.list-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}
.list-leave-to {
    opacity: 0;
    transform: translateX(20px);
}
</style>
