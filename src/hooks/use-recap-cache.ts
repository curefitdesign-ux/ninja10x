/**
 * IndexedDB-based cache for generated recap videos.
 * Stores video blobs keyed by weekNumber so we don't regenerate every time.
 */

const DB_NAME = 'recap-cache';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface CachedRecap {
  key: string; // e.g. "week-1"
  blob: Blob;
  createdAt: number;
  weekNumber: number;
}

function makeKey(weekNumber: number, userId?: string): string {
  return userId ? `${userId}-week-${weekNumber}` : `week-${weekNumber}`;
}

/** Save a generated recap video blob to cache (scoped to userId) */
export async function saveRecapToCache(weekNumber: number, blob: Blob, userId?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const entry: CachedRecap = {
      key: makeKey(weekNumber, userId),
      blob,
      createdAt: Date.now(),
      weekNumber,
    };
    store.put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    console.log(`[RecapCache] Saved week ${weekNumber} recap for user ${userId || 'unknown'}`);
  } catch (err) {
    console.warn('[RecapCache] Failed to save:', err);
  }
}

/** Get a cached recap video blob, returns null if not cached (scoped to userId) */
export async function getRecapFromCache(weekNumber: number, userId?: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(makeKey(weekNumber, userId));
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const result = req.result as CachedRecap | undefined;
        if (result?.blob) {
          console.log(`[RecapCache] Cache hit for week ${weekNumber} user ${userId || 'unknown'}`);
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Check if a recap is cached (fast, no blob read, scoped to userId) */
export async function hasRecapCached(weekNumber: number, userId?: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count(IDBKeyRange.only(makeKey(weekNumber, userId)));
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/** Delete a cached recap (for regeneration, scoped to userId) */
export async function deleteRecapFromCache(weekNumber: number, userId?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(makeKey(weekNumber, userId));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    console.log(`[RecapCache] Deleted week ${weekNumber} cache for user ${userId || 'unknown'}`);
  } catch (err) {
    console.warn('[RecapCache] Failed to delete:', err);
  }
}
