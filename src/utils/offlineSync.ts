import api from '@/api/axiosInstance';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { orderApi } from '@/api/orderApi';
import {
    deleteOfflineOrder,
    getAllOfflineOrders,
    getAllMutations,
    deleteMutation,
    getPendingMutationCount,
    getOfflineOrderCount
} from './offlineDb';

export interface SyncResult {
    synced: number;
    failed: number;
    skipped: number;
}

// ─── Legacy: sync offline orders (v1 queue) ───────────────────────────────────

export async function syncOfflineOrders(): Promise<SyncResult> {
    const pendingOrders = await getAllOfflineOrders();

    if (pendingOrders.length === 0) {
        return { synced: 0, failed: 0, skipped: 0 };
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

    return { synced, failed, skipped: 0 };
}

// ─── Generic: sync mutation queue (v3) ───────────────────────────────────────

/**
 * Sync all queued mutations to the server.
 *
 * Idempotency strategy:
 * - Each mutation carries a UUID `mutationId` sent as `X-Idempotency-Key`.
 * - 409 Conflict  → item already exists on server, remove from queue (skipped).
 * - 404 Not Found → item already gone (DELETE/PUT on missing record), skip.
 * - Other 4xx/5xx → remove from queue, count as failed (retrying won't help).
 * - Network error → keep in queue, will retry on next online event.
 */
export async function syncMutationQueue(): Promise<SyncResult & { details: string[] }> {
    const mutations = await getAllMutations();

    if (mutations.length === 0) {
        return { synced: 0, failed: 0, skipped: 0, details: [] };
    }

    let synced = 0;
    let failed = 0;
    let skipped = 0;
    const details: string[] = [];

    for (const mutation of mutations) {
        const config: AxiosRequestConfig = {
            method: mutation.method,
            url: mutation.url,
            headers: { 'X-Idempotency-Key': mutation.mutationId }
        };

        if (mutation.payload) {
            config.data = mutation.payload;
        }

        try {
            await api(config);
            if (mutation.id !== undefined) await deleteMutation(mutation.id);
            synced++;
            details.push(`✓ ${mutation.label}`);
        } catch (err) {
            const axiosErr = err as AxiosError;

            if (!axiosErr.response) {
                // Network error: keep in queue, retry later
                continue;
            }

            const status = axiosErr.response.status;

            // Idempotent resolution: treat as already done
            if (status === 409 || (status === 404 && mutation.method !== 'POST')) {
                if (mutation.id !== undefined) await deleteMutation(mutation.id);
                skipped++;
                details.push(`~ ${mutation.label} (sudah ada/tidak ditemukan, dilewati)`);
            } else {
                // Other server errors: unrecoverable, remove from queue
                if (mutation.id !== undefined) await deleteMutation(mutation.id);
                failed++;
                details.push(`✗ ${mutation.label} (gagal: ${status})`);
            }
        }
    }

    return { synced, failed, skipped, details };
}

// ─── Combined sync + count ────────────────────────────────────────────────────

/**
 * Run full sync: offline orders queue + generic mutation queue.
 */
export async function syncAll(): Promise<{
    orders: SyncResult;
    mutations: SyncResult & { details: string[] };
}> {
    const [orders, mutations] = await Promise.all([
        syncOfflineOrders(),
        syncMutationQueue()
    ]);
    return { orders, mutations };
}

/**
 * Get total pending items across both queues.
 */
export async function getTotalPendingCount(): Promise<number> {
    const [orderCount, mutationCount] = await Promise.all([
        getOfflineOrderCount(),
        getPendingMutationCount()
    ]);
    return orderCount + mutationCount;
}
