import { openDB } from 'idb';

const DB_NAME = 'LivingDiaryDB';
const STORE_NAME = 'storyImages';
const STORY_CACHE_STORE_NAME = 'storyCache';
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
    if (oldVersion < 2 && !db.objectStoreNames.contains(STORY_CACHE_STORE_NAME)) {
        db.createObjectStore(STORY_CACHE_STORE_NAME);
    }
  },
});

export const storeImage = async (key, blob) => {
  try {
    const db = await dbPromise;
    await db.put(STORE_NAME, blob, key);
  } catch (error) {
    console.error("Failed to store image in IndexedDB:", error);
  }
};

export const getLocalImage = async (key) => {
  try {
    const db = await dbPromise;
    const blob = await db.get(STORE_NAME, key);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    console.error("Failed to retrieve image from IndexedDB:", error);
    return null;
  }
};

// --- CHANGE IS HERE ---
// We will no longer save the localImageUrl in the main cache.
export const cacheStoryData = async (storyData) => {
    try {
        const db = await dbPromise;
        // Create a clean version of panels without localImageUrl
        const cleanPanels = storyData.panels.map(({ localImageUrl, ...rest }) => rest);
        const cleanStoryData = { ...storyData, panels: cleanPanels };
        await db.put(STORY_CACHE_STORE_NAME, cleanStoryData, 'lastStory');
    } catch (error) {
        console.error("Failed to cache story data:", error);
    }
};

export const getCachedStoryData = async () => {
    try {
        const db = await dbPromise;
        return await db.get(STORY_CACHE_STORE_NAME, 'lastStory');
    } catch (error) {
        console.error("Failed to retrieve cached story data:", error);
        return null;
    }
};

export const cacheImageAndGetLocalUrl = async (remoteUrl) => {
  if (!remoteUrl) return null;

  const isCached = await getLocalImage(remoteUrl);
  if (isCached) {
    return isCached;
  }

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const blob = await response.blob();
    await storeImage(remoteUrl, blob);
    return await getLocalImage(remoteUrl);
  } catch (error) {
    console.error(`Failed to cache image ${remoteUrl}:`, error);
    return remoteUrl; // Fallback to remote URL on error
  }
};