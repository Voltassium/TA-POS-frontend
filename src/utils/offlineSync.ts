import { orderApi } from '@/api/orderApi';
import { deleteOfflineOrder, getAllOfflineOrders } from './offlineDb';

export interface SyncResult {
    synced: number;
    failed: number;
}

/**
 * Attempt to sync all queued offline orders to the backend.
 * Each order is POSTed individually. Successfully synced orders are
 * removed from IndexedDB. Failed orders remain in the queue for retry.
 */
export async function syncOfflineOrders(): Promise<SyncResult> {
    const pendingOrders = await getAllOfflineOrders();

    if (pendingOrders.length === 0) {
        return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const entry of pendingOrders) {
        try {
            await orderApi.create(entry.payload);
            if (entry.id !== undefined) {
                await deleteOfflineOrder(entry.id);
            }
            synced++;
        } catch {
            failed++;
        }
    }

    return { synced, failed };
}
