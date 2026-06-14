import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * Schema for the SeliPOS offline IndexedDB database.
 * Stores order creation payloads that were created while the device was offline.
 */
interface SeliPOSOfflineDB extends DBSchema {
    offlineOrders: {
        key: number;
        value: {
            id?: number;
            payload: OfflineOrderPayload;
            createdAt: string;
        };
        indexes: { 'by-created': string };
    };
}

export interface OfflineOrderPayload {
    table_id?: number | null;
    items: { product_id: number; quantity: number }[];
}

const DB_NAME = 'selipos-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SeliPOSOfflineDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SeliPOSOfflineDB>> {
    if (!dbPromise) {
        dbPromise = openDB<SeliPOSOfflineDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('offlineOrders', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('by-created', 'createdAt');
            }
        });
    }
    return dbPromise;
}

/**
 * Queue an order creation payload into IndexedDB for later sync.
 */
export async function saveOfflineOrder(payload: OfflineOrderPayload): Promise<number> {
    const db = await getDB();
    const id = await db.add('offlineOrders', {
        payload,
        createdAt: new Date().toISOString()
    });
    return id;
}

/**
 * Retrieve all pending offline orders, sorted by creation time.
 */
export async function getAllOfflineOrders() {
    const db = await getDB();
    return db.getAllFromIndex('offlineOrders', 'by-created');
}

/**
 * Delete a successfully synced order from the offline queue.
 */
export async function deleteOfflineOrder(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('offlineOrders', id);
}

/**
 * Get the count of pending offline orders (for UI badge display).
 */
export async function getOfflineOrderCount(): Promise<number> {
    const db = await getDB();
    return db.count('offlineOrders');
}
