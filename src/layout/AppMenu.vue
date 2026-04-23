<script setup lang="ts">
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref<any[]>([
    {
        label: 'Beranda',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/'
            }
        ]
    },
    {
        label: 'Aplikasi POS',
        items: [
            { label: 'Dapur (KDS)', icon: 'pi pi-fw pi-shop', to: '/kitchen' },
            { label: 'Kasir & Penjualan', icon: 'pi pi-fw pi-wallet', to: '/pages/order' },
            { label: 'Manajemen Produk', icon: 'pi pi-fw pi-box', to: '/pages/product' },
            { label: 'Kategori Menu', icon: 'pi pi-fw pi-tags', to: '/pages/category' }
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
