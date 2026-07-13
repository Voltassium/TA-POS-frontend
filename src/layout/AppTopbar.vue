<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
    await authStore.logout();
    router.push('/auth/login');
};
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo flex items-center gap-2">
                <img src="/pwa-512x512.png" alt="SeliPOS Logo" class="w-8 h-8 rounded-lg" />
                <span class="font-bold text-xl text-surface-900 dark:text-surface-0">SeliPOS</span>
            </router-link>
        </div>

        <div class="layout-topbar-center">
            <span v-if="authStore.user?.store_name" class="store-badge">
                <i class="pi pi-shop mr-2 text-indigo-500"></i>
                {{ authStore.user.store_name }}
            </span>
            <span v-else-if="authStore.user?.role" class="store-badge-admin">
                <i class="pi pi-cog mr-2 text-emerald-500"></i>
                Portal {{ authStore.user.role }}
            </span>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <button type="button" class="layout-topbar-action text-red-500 dark:text-red-400" @click="handleLogout" title="Logout">
                    <i class="pi pi-sign-out"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.layout-topbar-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    pointer-events: none;
    white-space: nowrap;
}

.store-badge {
    pointer-events: auto;
    background: rgba(99, 102, 241, 0.06);
    border: 1px solid rgba(99, 102, 241, 0.2);
    padding: 0.5rem 1.25rem;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 1.05rem;
    color: #4f46e5;
    letter-spacing: 0.3px;
    display: inline-flex;
    align-items: center;
    box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.store-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 12px -2px rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.4);
}

.store-badge-admin {
    pointer-events: auto;
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.2);
    padding: 0.5rem 1.25rem;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 1.05rem;
    color: #10b981;
    letter-spacing: 0.3px;
    display: inline-flex;
    align-items: center;
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.05);
    text-transform: capitalize;
}

:deep(.app-dark) {
    .store-badge {
        background: rgba(129, 140, 248, 0.12);
        border-color: rgba(129, 140, 248, 0.3);
        color: #818cf8;
    }
    .store-badge-admin {
        background: rgba(52, 211, 153, 0.12);
        border-color: rgba(52, 211, 153, 0.3);
        color: #34d399;
    }
}
</style>
