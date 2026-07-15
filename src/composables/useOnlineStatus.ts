import { onMounted, onUnmounted, ref } from 'vue';

/**
 * Reactive online/offline status composable.
 * Uses both `navigator.onLine` and window events for real-time updates.
 */
export function useOnlineStatus() {
    const isOffline = ref(!navigator.onLine);

    const handleOffline = () => {
        isOffline.value = true;
    };

    const handleOnline = () => {
        isOffline.value = false;
    };

    onMounted(() => {
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
    });

    onUnmounted(() => {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
    });

    return { isOffline };
}
