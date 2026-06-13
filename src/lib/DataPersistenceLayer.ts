import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'AdalahStore';
const DB_VERSION = 1;
const STORE_NAME = 'memos_and_drafts';

class DataPersistenceLayer {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    try {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        },
      }).catch(err => {
        console.warn("IndexedDB initialization failed, falling back", err);
        return null as any;
      });
    } catch(err) {
      console.warn("IndexedDB synchronous initialization failed", err);
      this.dbPromise = Promise.resolve(null as any);
    }
  }

  async saveDraft(id: string, content: any): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.put({ id, content, lastUpdated: new Date().toISOString() });
    await tx.done;
  }

  async getDraft(id: string): Promise<any | null> {
    const db = await this.dbPromise;
    if (!db) return null;
    const record = await db.get(STORE_NAME, id);
    return record ? record.content : null;
  }

  async getAllDrafts(): Promise<any[]> {
    const db = await this.dbPromise;
    if (!db) return [];
    return await db.getAll(STORE_NAME);
  }

  async deleteDraft(id: string): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.delete(id);
    await tx.done;
  }
}

export const persistenceLayer = new DataPersistenceLayer();
