<script setup lang="ts">
import { useOrderStore } from '@/stores/orderStore';
import { syncAll, getTotalPendingCount } from '@/utils/offlineSync';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, onUnmounted, ref } from 'vue';

const toast = useToast();
const orderStore = useOrderStore();

const isOffline = ref(!navigator.onLine);
const syncing = ref(false);
const totalPending = ref(0);

async function refreshPendingCount() {
    totalPending.value = await getTotalPendingCount();
}

function handleOffline() {
    isOffline.value = true;
}

async function handleOnline() {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
        await axios.get(`${apiUrl}/ping`, { timeout: 3000 });
        isOffline.value = false;
        await autoSync();
    } catch {}
}

async function autoSync() {
    await refreshPendingCount();
    if (totalPending.value === 0) return;

    syncing.value = true;
    try {
        const result = await syncAll();
        await refreshPendingCount();
        await orderStore.refreshOfflineCount();

        const totalSynced = result.orders.synced + result.mutations.synced;
        const totalFailed = result.orders.failed + result.mutations.failed;
        const totalSkipped = result.mutations.skipped;

        if (totalSynced > 0) {
            const detail =
                result.mutations.details.filter((d) => d.startsWith('✓')).join('\n') ||
                `${totalSynced} item berhasil disinkronkan.`;
            toast.add({
                severity: 'success',
                summary: 'Sinkronisasi Berhasil',
                detail,
                life: 6000
            });
        }

        if (totalSkipped > 0) {
            toast.add({
                severity: 'info',
                summary: 'Dilewati (Idempoten)',
                detail: `${totalSkipped} item sudah ada di server, dilewati.`,
                life: 4000
            });
        }

        if (totalFailed > 0) {
            toast.add({
                severity: 'warn',
                summary: 'Sebagian Gagal',
                detail: `${totalFailed} item gagal disinkronkan dan dihapus dari antrian.`,
                life: 5000
            });
        }
    } catch {
        toast.add({
            severity: 'error',
            summary: 'Gagal Sinkronisasi',
            detail: 'Terjadi kesalahan saat menyinkronkan data offline.',
            life: 5000
        });
    } finally {
        syncing.value = false;
    }
}

onMounted(async () => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    await refreshPendingCount();
    if (navigator.onLine && totalPending.value > 0) {
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
            <span class="offline-text">Anda sedang offline — data dibaca dari cache, perubahan akan disimpan lokal</span>
        </div>
    </transition>

    <!-- Syncing indicator -->
    <transition name="offline-banner">
        <div v-if="syncing && !isOffline" class="syncing-banner" role="status">
            <i class="pi pi-spin pi-spinner syncing-icon"></i>
            <span class="syncing-text">Menyinkronkan pesanan offline...</span>
        </div>
    </transition>

    <!-- Pending offline data badge -->
    <transition name="offline-banner">
        <div v-if="!isOffline && !syncing && totalPending > 0" class="pending-banner" role="status" @click="autoSync">
            <i class="pi pi-cloud-upload pending-icon"></i>
            <span class="pending-text">{{ totalPending }} item menunggu sinkronisasi</span>
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
    from {
        opacity: 0;
        transform: translateY(-100%);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
@keyframes banner-slide-up {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-100%);
    }
}
</style>
