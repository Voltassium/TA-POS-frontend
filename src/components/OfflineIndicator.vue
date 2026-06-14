<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const orderStore = useOrderStore();

const isOffline = ref(!navigator.onLine);
const syncing = ref(false);

function handleOffline() {
    isOffline.value = true;
}

async function handleOnline() {
    isOffline.value = false;
    await autoSync();
}

async function autoSync() {
    if (orderStore.offlineCount === 0) return;

    syncing.value = true;
    try {
        const result = await orderStore.syncPendingOrders();

        if (result.synced > 0) {
            toast.add({
                severity: 'success',
                summary: 'Sinkronisasi Berhasil',
                detail: `${result.synced} pesanan offline berhasil dikirim ke server.`,
                life: 5000
            });
        }

        if (result.failed > 0) {
            toast.add({
                severity: 'warn',
                summary: 'Sinkronisasi Sebagian',
                detail: `${result.failed} pesanan gagal disinkronkan. Akan dicoba lagi nanti.`,
                life: 5000
            });
        }
    } catch {
        toast.add({
            severity: 'error',
            summary: 'Gagal Sinkronisasi',
            detail: 'Terjadi kesalahan saat menyinkronkan pesanan offline.',
            life: 5000
        });
    } finally {
        syncing.value = false;
    }
}

onMounted(async () => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending orders on mount
    await orderStore.refreshOfflineCount();
    // If we're online and have pending orders, sync immediately
    if (navigator.onLine && orderStore.offlineCount > 0) {
        await autoSync();
    }
});

onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
});
</script>

<template>
    <!-- Offline banner -->
    <transition name="offline-banner">
        <div v-if="isOffline" class="offline-banner" role="status">
            <i class="pi pi-wifi-off offline-icon"></i>
            <span class="offline-text">Anda sedang offline — pesanan baru akan disimpan lokal</span>
        </div>
    </transition>

    <!-- Syncing indicator -->
    <transition name="offline-banner">
        <div v-if="syncing && !isOffline" class="syncing-banner" role="status">
            <i class="pi pi-spin pi-spinner syncing-icon"></i>
            <span class="syncing-text">Menyinkronkan pesanan offline...</span>
        </div>
    </transition>

    <!-- Pending offline orders badge -->
    <transition name="offline-banner">
        <div v-if="!isOffline && !syncing && orderStore.offlineCount > 0" class="pending-banner" role="status" @click="autoSync">
            <i class="pi pi-cloud-upload pending-icon"></i>
            <span class="pending-text">{{ orderStore.offlineCount }} pesanan menunggu sinkronisasi</span>
            <button class="pending-sync-btn">Sinkronkan</button>
        </div>
    </transition>
</template>

<style scoped>
.offline-banner,
.syncing-banner,
.pending-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
}

.offline-banner {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: #ffffff;
}

.syncing-banner {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
}

.pending-banner {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #ffffff;
    cursor: pointer;
    transition: filter 0.15s ease;
}

.pending-banner:hover {
    filter: brightness(1.05);
}

.offline-icon,
.syncing-icon,
.pending-icon {
    font-size: 0.9rem;
}

.pending-sync-btn {
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    border-radius: 0.375rem;
    padding: 0.2rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-left: 0.5rem;
}

.pending-sync-btn:hover {
    background: rgba(255, 255, 255, 0.35);
}

/* Transition */
.offline-banner-enter-active {
    animation: banner-slide-down 0.3s ease-out;
}
.offline-banner-leave-active {
    animation: banner-slide-up 0.2s ease-in;
}

@keyframes banner-slide-down {
    from { opacity: 0; transform: translateY(-100%); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes banner-slide-up {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-100%); }
}
</style>
