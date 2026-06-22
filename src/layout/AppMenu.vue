<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import { computed } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const authStore = useAuthStore();
const role = computed(() => authStore.userRole ?? '');

/**
 * Definisi semua item menu beserta roles yang diizinkan.
 * Jika roles tidak ada / kosong, semua role bisa melihatnya.
 */
const allMenuItems = computed(() => [
    {
        label: 'Aplikasi POS',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/',
                roles: ['superadmin', 'owner']
            },
            {
                label: 'Dapur (KDS)',
                icon: 'pi pi-fw pi-shop',
                to: '/kitchen',
                roles: ['superadmin', 'chef']
            },
            {
                label: 'Kasir & Penjualan',
                icon: 'pi pi-fw pi-wallet',
                to: '/pages/order',
                roles: ['superadmin', 'staff']
            },
            {
                label: 'Manajemen Produk',
                icon: 'pi pi-fw pi-box',
                path: '/products',
                roles: ['superadmin'],
                items: [
                    {
                        label: 'Produk Kulakan',
                        icon: 'pi pi-fw pi-shopping-bag',
                        to: '/pages/product-kulakan',
                        roles: ['superadmin']
                    },
                    {
                        label: 'Produk Olahan',
                        icon: 'pi pi-fw pi-bolt',
                        to: '/pages/product-olahan',
                        roles: ['superadmin']
                    }
                ]
            },
            {
                label: 'Kategori Menu',
                icon: 'pi pi-fw pi-tags',
                to: '/pages/category',
                roles: ['superadmin']
            },
            {
                label: 'Riwayat Pesanan',
                icon: 'pi pi-fw pi-history',
                to: '/pages/order-history',
                roles: ['superadmin', 'owner', 'staff']
            },
            {
                label: 'Riwayat Stok',
                icon: 'pi pi-fw pi-list',
                to: '/pages/stock-history',
                roles: ['superadmin', 'owner', 'staff']
            },
            {
                label: 'Pengeluaran',
                icon: 'pi pi-fw pi-money-bill',
                to: '/pages/pengeluaran',
                roles: ['superadmin', 'owner']
            },
            {
                label: 'Manajemen Akun',
                icon: 'pi pi-fw pi-users',
                to: '/pages/manajemen-akun',
                roles: ['superadmin', 'owner']
            }
        ]
    }
]);

/**
 * Filter item menu berdasarkan role user yang sedang login.
 * Jika suatu item memiliki sub-items, filter juga sub-itemnya.
 */
function isAllowed(itemRoles: string[] | undefined): boolean {
    if (!itemRoles || itemRoles.length === 0) return true;
    return itemRoles.includes(role.value);
}

const model = computed(() => {
    return allMenuItems.value
        .map((section) => ({
            ...section,
            items: section.items
                .filter((item) => isAllowed(item.roles))
                .map((item) => {
                    if (!item.items) return item;
                    const filteredSubs = item.items.filter((sub) => isAllowed(sub.roles));
                    return { ...item, items: filteredSubs };
                })
                .filter((item) => {
                    if (item.items !== undefined) return item.items.length > 0;
                    return true;
                })
        }))
        .filter((section) => section.items.length > 0);
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!(item as any).separator" :item="item" :index="i"></app-menu-item>
            <li v-if="(item as any).separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
