<script setup lang="ts">
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref<any[]>([
    // {
    //     label: 'Beranda',
    //     items: [
    //         {
    //             label: 'Dashboard',
    //             icon: 'pi pi-fw pi-home',
    //             to: '/'
    //         }
    //     ]
    // },
    {
        label: 'Aplikasi POS',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/'
            },
            { label: 'Dapur (KDS)', icon: 'pi pi-fw pi-shop', to: '/kitchen' },
            { label: 'Kasir & Penjualan', icon: 'pi pi-fw pi-wallet', to: '/pages/order' },
            {
                label: 'Manajemen Produk',
                icon: 'pi pi-fw pi-box',
                path: '/products',
                items: [
                    { label: 'Produk Kulakan', icon: 'pi pi-fw pi-shopping-bag', to: '/pages/product-kulakan' },
                    { label: 'Produk Olahan', icon: 'pi pi-fw pi-bolt', to: '/pages/product-olahan' }
                ]
            },
            { label: 'Kategori Menu', icon: 'pi pi-fw pi-tags', to: '/pages/category' },
            { label: 'Riwayat Pesanan', icon: 'pi pi-fw pi-history', to: '/pages/order-history' },
            { label: 'Riwayat Stok', icon: 'pi pi-fw pi-list', to: '/pages/stock-history' },
            { label: 'Pengeluaran', icon: 'pi pi-fw pi-money-bill', to: '/pages/pengeluaran' }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
