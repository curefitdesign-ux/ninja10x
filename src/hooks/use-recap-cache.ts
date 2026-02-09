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

function makeKey(weekNumber: number): string {
  return `week-${weekNumber}`;
}

/** Save a generated recap video blob to cache */
export async function saveRecapToCache(weekNumber: number, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const entry: CachedRecap = {
      key: makeKey(weekNumber),
      blob,
      createdAt: Date.now(),
      weekNumber,
    };
    store.put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    console.log(`[RecapCache] Saved week ${weekNumber} recap`);
  } catch (err) {
    console.warn('[RecapCache] Failed to save:', err);
  }
}

/** Get a cached recap video blob, returns null if not cached */
export async function getRecapFromCache(weekNumber: number): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(makeKey(weekNumber));
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const result = req.result as CachedRecap | undefined;
        if (result?.blob) {
          console.log(`[RecapCache] Cache hit for week ${weekNumber}`);
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

/** Check if a recap is cached (fast, no blob read) */
export async function hasRecapCached(weekNumber: number): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count(IDBKeyRange.only(makeKey(weekNumber)));
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/** Delete a cached recap (for regeneration) */
export async function deleteRecapFromCache(weekNumber: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(makeKey(weekNumber));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    console.log(`[RecapCache] Deleted week ${weekNumber} cache`);
  } catch (err) {
    console.warn('[RecapCache] Failed to delete:', err);
  }
}
