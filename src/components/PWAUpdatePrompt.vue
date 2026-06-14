<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
        // Check for updates every 60 minutes
        if (registration) {
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);
        }
    }
});

function close() {
    needRefresh.value = false;
}
</script>

<template>
    <transition name="pwa-toast">
        <div v-if="needRefresh" class="pwa-toast" role="alert">
            <div class="pwa-toast-content">
                <i class="pi pi-refresh pwa-toast-icon"></i>
                <div class="pwa-toast-text">
                    <span class="pwa-toast-title">Versi baru tersedia</span>
                    <span class="pwa-toast-desc">Perbarui untuk mendapatkan fitur terbaru.</span>
                </div>
            </div>
            <div class="pwa-toast-actions">
                <button class="pwa-btn pwa-btn-primary" @click="updateServiceWorker()">
                    Perbarui
                </button>
                <button class="pwa-btn pwa-btn-text" @click="close">
                    Nanti
                </button>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.pwa-toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    background: var(--p-surface-0, #ffffff);
    border: 1px solid var(--p-surface-200, #e2e8f0);
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 22rem;
}

:root.app-dark .pwa-toast {
    background: var(--p-surface-800, #1e293b);
    border-color: var(--p-surface-700, #334155);
}

.pwa-toast-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.pwa-toast-icon {
    font-size: 1.25rem;
    color: var(--p-primary-color, #4f46e5);
    margin-top: 0.125rem;
}

.pwa-toast-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.pwa-toast-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--p-text-color, #1e293b);
}

.pwa-toast-desc {
    font-size: 0.8rem;
    color: var(--p-text-muted-color, #64748b);
}

.pwa-toast-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.pwa-btn {
    border: none;
    border-radius: 0.5rem;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
}

.pwa-btn-primary {
    background: var(--p-primary-color, #4f46e5);
    color: #ffffff;
}

.pwa-btn-primary:hover {
    filter: brightness(1.1);
}

.pwa-btn-text {
    background: transparent;
    color: var(--p-text-muted-color, #64748b);
}

.pwa-btn-text:hover {
    background: var(--p-surface-100, #f1f5f9);
}

:root.app-dark .pwa-btn-text:hover {
    background: var(--p-surface-700, #334155);
}

/* Transition */
.pwa-toast-enter-active {
    animation: pwa-slide-up 0.3s ease-out;
}
.pwa-toast-leave-active {
    animation: pwa-slide-down 0.2s ease-in;
}

@keyframes pwa-slide-up {
    from { opacity: 0; transform: translateY(1rem); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes pwa-slide-down {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(1rem); }
}
</style>
