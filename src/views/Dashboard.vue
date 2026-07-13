<script setup lang="ts">
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { orderApi } from '@/api/orderApi';
import { pengeluaranApi } from '@/api/pengeluaranApi';
import { useStatisticsStore } from '@/stores/statisticsStore';
import { exportMultipleSheetsToExcel } from '@/utils/exportExcel';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

const statisticsStore = useStatisticsStore();
const toast = useToast();
const selectedRange = ref('daily');

const rangeOptions = ref([
    { label: 'Hari Ini', value: 'daily' },
    { label: 'Minggu Ini', value: 'weekly' },
    { label: 'Bulan Ini', value: 'monthly' },
    { label: 'Semua Waktu', value: 'all' }
]);

const rangeLabel = ref('Hari Ini');

async function loadData() {
    try {
        await Promise.all([
            statisticsStore.fetchDashboardData(selectedRange.value as any),
            statisticsStore.fetchComparisonStats()
        ]);
        const option = rangeOptions.value.find(o => o.value === selectedRange.value);
        if (option) rangeLabel.value = option.label;
    } catch (e) {
        console.error(e);
    }
}

async function exportExcel() {
    const data = statisticsStore.dashboardData;
    if (!data) return;

    try {
        let start_date: string | undefined = undefined;
        let end_date: string | undefined = undefined;

        const now = new Date();
        const yyyy_mm_dd = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

        if (selectedRange.value === 'daily') {
            start_date = yyyy_mm_dd(now);
            end_date = yyyy_mm_dd(now);
        } else if (selectedRange.value === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            start_date = yyyy_mm_dd(lastWeek);
            end_date = yyyy_mm_dd(now);
        } else if (selectedRange.value === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setDate(now.getDate() - 30);
            start_date = yyyy_mm_dd(lastMonth);
            end_date = yyyy_mm_dd(now);
        }

        const [ordersRes, pengeluaranRes] = await Promise.all([
            orderApi.list({ page: 1, page_size: 10000, status: 'Completed', start_date, end_date }),
            pengeluaranApi.list({ page: 1, page_size: 10000, start_date, end_date })
        ]);

        const orders = ordersRes.data;
        const pengeluaran = pengeluaranRes.data;

        const stats = data.stats;
        
        // 1. Sheet Ringkasan
        const summaryData = [
            { label: 'Total Pesanan', value: stats.total_orders, description: 'Jumlah seluruh pesanan yang telah berstatus selesai.' },
            { label: 'Total Pendapatan', value: stats.total_revenue, description: 'Total pendapatan dari semua pesanan selesai.' },
            { label: 'Total Pengeluaran', value: stats.total_expenses, description: 'Total dari transaksi pengeluaran operasional ditambah total biaya beli stok produk kulakan.' },
            { label: 'Total Keuntungan', value: stats.total_profit, description: 'Total Pendapatan dikurangi Total Pengeluaran.' }
        ];
        
        const summaryColumns = [
            { header: 'Metrik', key: 'label', width: 25 },
            { header: 'Nilai', key: 'value', width: 20, format: (v: any, row: any) => row.label === 'Total Pesanan' ? v : (v ?? 0).toLocaleString('id-ID') },
            { header: 'Keterangan Sumber', key: 'description', width: 80 }
        ];

        // 2. Sheet Aliran Keuangan
        const financeColumns = [
            { header: 'Tanggal', key: 'date', width: 15 },
            { header: 'Pendapatan (Penjualan)', key: 'revenue', width: 25, format: (v: number) => (v ?? 0).toLocaleString('id-ID') },
            { header: 'Pengeluaran (Operasional & Kulakan)', key: 'expenses', width: 35, format: (v: number) => (v ?? 0).toLocaleString('id-ID') },
            { header: 'Keuntungan (Profit)', key: 'profit', width: 25, format: (v: number) => (v ?? 0).toLocaleString('id-ID') }
        ];

        // 3. Sheet Produk Terlaris
        const productColumns = [
            { header: 'ID Produk', key: 'product_id', width: 12 },
            { header: 'Nama Produk', key: 'product_name', width: 25 },
            { header: 'Kategori', key: 'category_name', width: 18 },
            { header: 'Jumlah Terjual', key: 'quantity', width: 15 }
        ];

        // 4. Sheet Riwayat Pesanan
        const orderColumns = [
            { header: 'Kode Pesanan', key: 'order_code', width: 20 },
            { header: 'Tanggal', key: 'created_at', width: 25, format: (v: string) => new Date(v).toLocaleString('id-ID') },
            { header: 'Total (Rp)', key: 'total_amount', width: 18, format: (v: number) => (v ?? 0).toLocaleString('id-ID') },
            { header: 'Kasir', key: 'staff_name', width: 20 }
        ];

        // 5. Sheet Riwayat Pengeluaran
        const expenseColumns = [
            { header: 'Tanggal', key: 'tanggal', width: 15, format: (v: string) => new Date(v).toLocaleDateString('id-ID') },
            { header: 'Kategori', key: 'category', width: 20 },
            { header: 'Deskripsi', key: 'description', width: 35 },
            { header: 'Jumlah (Rp)', key: 'amount', width: 18, format: (v: number) => (v ?? 0).toLocaleString('id-ID') },
            { header: 'Kasir', key: 'created_by', width: 20 }
        ];

        exportMultipleSheetsToExcel([
            { name: 'Ringkasan', data: summaryData, columns: summaryColumns },
            { name: 'Aliran Keuangan', data: data.finance_chart || [], columns: financeColumns },
            { name: 'Produk Terlaris', data: data.top_products || [], columns: productColumns },
            { name: 'Riwayat Pesanan', data: orders || [], columns: orderColumns },
            { name: 'Riwayat Pengeluaran', data: pengeluaran || [], columns: expenseColumns }
        ], `Laporan_Dashboard_${selectedRange.value}_${new Date().toISOString().split('T')[0]}`);

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Laporan Dashboard berhasil diekspor ke Excel', life: 3000 });
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengekspor laporan Dashboard', life: 3000 });
    }
}

watch(selectedRange, () => {
    loadData();
});

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="flex flex-col gap-8">
        <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold m-0">Dashboard</h2>
            <div class="flex items-center gap-3">
                <Button 
                    label="Ekspor Excel" 
                    icon="pi pi-file-excel" 
                    severity="success" 
                    @click="exportExcel" 
                    :disabled="!statisticsStore.dashboardData" 
                />
                <Select 
                    v-model="selectedRange" 
                    :options="rangeOptions" 
                    optionLabel="label" 
                    optionValue="value" 
                    placeholder="Pilih Waktu" 
                    class="w-48"
                />
            </div>
        </div>

        <div class="grid grid-cols-12 gap-8">
            <StatsWidget v-if="statisticsStore.dashboardData" :stats="statisticsStore.dashboardData.stats" :rangeLabel="rangeLabel" />

        <div class="col-span-12 xl:col-span-12">
            <RevenueStreamWidget v-if="statisticsStore.dashboardData" :financeData="statisticsStore.dashboardData.finance_chart" />
        </div>
        
        <div class="col-span-12 xl:col-span-12">
            <BestSellingWidget v-if="statisticsStore.dashboardData" :topProducts="statisticsStore.dashboardData.top_products" />
        </div>
        </div>
    </div>
</template>
