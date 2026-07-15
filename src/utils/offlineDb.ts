import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ─── Schema ───────────────────────────────────────────────────────────────────

/**
 * Schema for the SeliPOS offline IndexedDB database.
 *
 * v1 — offlineOrders    : order creation payloads queued while offline (legacy)
 * v2 — cachedProducts   : snapshot of the last successful product list fetch
 * v3 — readCache        : generic key-value read cache for any entity list
 *      mutationQueue     : generic write queue (POST/PUT/PATCH/DELETE) with idempotency
 */
interface SeliPOSOfflineDB extends DBSchema {
    // ── v1 (kept for backward compat with orderStore) ────────────────────────
    offlineOrders: {
        key: number;
        value: {
            id?: number;
            payload: OfflineOrderPayload;
            createdAt: string;
        };
        indexes: { 'by-created': string };
    };

    // ── v2 (kept for backward compat with productStore) ──────────────────────
    cachedProducts: {
        key: string;
        value: {
            key: string;
            data: any[];
            savedAt: string;
        };
    };

    // ── v3 ───────────────────────────────────────────────────────────────────
    readCache: {
        key: string;
        value: {
            key: string;
            data: any;
            savedAt: string;
        };
    };

    mutationQueue: {
        key: number;
        value: {
            id?: number;
            mutationId: string;      // UUID for idempotency
            method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
            url: string;             // relative path, e.g. '/categories'
            payload?: any;
            entity: string;          // e.g. 'category', 'pengeluaran'
            label: string;           // human-readable for notifications
            createdAt: string;
        };
        indexes: { 'by-created': string };
    };
}

export interface OfflineOrderPayload {
    table_id?: number | null;
    items: { product_id: string; quantity: number }[];
}

export interface QueuedMutation {
    id?: number;
    mutationId: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    payload?: any;
    entity: string;
    label: string;
    createdAt: string;
}

const DB_NAME = 'selipos-offline';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<SeliPOSOfflineDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SeliPOSOfflineDB>> {
    if (!dbPromise) {
        dbPromise = openDB<SeliPOSOfflineDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                // v1: offlineOrders
                if (oldVersion < 1) {
                    const store = db.createObjectStore('offlineOrders', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('by-created', 'createdAt');
                }
                // v2: cachedProducts
                if (oldVersion < 2) {
                    db.createObjectStore('cachedProducts', { keyPath: 'key' });
                }
                // v3: readCache + mutationQueue
                if (oldVersion < 3) {
                    db.createObjectStore('readCache', { keyPath: 'key' });
                    const mq = db.createObjectStore('mutationQueue', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    mq.createIndex('by-created', 'createdAt');
                }
            }
        });
    }
    return dbPromise;
}

// ─── Legacy: offline order queue (v1) ────────────────────────────────────────

export async function saveOfflineOrder(payload: OfflineOrderPayload): Promise<number> {
    const db = await getDB();
    const id = await db.add('offlineOrders', {
        payload,
        createdAt: new Date().toISOString()
    });
    return id;
}

export async function getAllOfflineOrders() {
    const db = await getDB();
    return db.getAllFromIndex('offlineOrders', 'by-created');
}

export async function deleteOfflineOrder(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('offlineOrders', id);
}

export async function getOfflineOrderCount(): Promise<number> {
    const db = await getDB();
    return db.count('offlineOrders');
}

// ─── Legacy: product cache (v2) ──────────────────────────────────────────────

const PRODUCT_CACHE_KEY = 'products';

export async function saveProductCache(products: any[]): Promise<void> {
    const db = await getDB();
    await db.put('cachedProducts', {
        key: PRODUCT_CACHE_KEY,
        data: products,
        savedAt: new Date().toISOString()
    });
}

export async function loadProductCache(): Promise<any[]> {
    const db = await getDB();
    const entry = await db.get('cachedProducts', PRODUCT_CACHE_KEY);
    return entry?.data ?? [];
}

// ─── Generic read cache (v3) ─────────────────────────────────────────────────

/**
 * Save any data to the read cache under the given key.
 * Key should be descriptive, e.g. 'categories:p1', 'dashboard:daily'.
 */
export async function saveCache(key: string, data: any): Promise<void> {
    const db = await getDB();
    await db.put('readCache', { key, data, savedAt: new Date().toISOString() });
}

/**
 * Load cached data by key. Returns null if not found.
 */
export async function loadCache<T = any>(key: string): Promise<T | null> {
    const db = await getDB();
    const entry = await db.get('readCache', key);
    return entry ? (entry.data as T) : null;
}

// ─── Generic mutation queue (v3) ─────────────────────────────────────────────

/**
 * Queue a write mutation for later sync when back online.
 * Each mutation gets a UUID mutationId for idempotency.
 */
export async function queueMutation(
    mutation: Omit<QueuedMutation, 'id' | 'createdAt'>
): Promise<number> {
    const db = await getDB();
    const id = await db.add('mutationQueue', {
        ...mutation,
        createdAt: new Date().toISOString()
    });
    return id;
}

export async function getAllMutations(): Promise<QueuedMutation[]> {
    const db = await getDB();
    return db.getAllFromIndex('mutationQueue', 'by-created') as Promise<QueuedMutation[]>;
}

export async function deleteMutation(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('mutationQueue', id);
}

export async function getPendingMutationCount(): Promise<number> {
    const db = await getDB();
    return db.count('mutationQueue');
}
