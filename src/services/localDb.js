import { openDB } from 'idb';

const DB_NAME = 'LivingDiaryDB';
// --- FIX --- Version number is set to 3 to ensure a fresh database is created.
const DB_VERSION = 3; 
const STORE_NAME = 'entries';

let dbPromise;

const initDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    // This function will create the 'entries' object store.
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
};

export const getLocalEntries = async () => {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
};

export const addLocalEntry = async (entry) => {
  const db = await initDB();
  await db.put(STORE_NAME, entry);
};

export const updateLocalEntry = async (entry) => {
  const db = await initDB();
  await db.put(STORE_NAME, entry);
};

export const getLocalEntry = async (id) => {
  const db = await initDB();
  return await db.get(STORE_NAME, id);
};

export const deleteLocalEntry = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};