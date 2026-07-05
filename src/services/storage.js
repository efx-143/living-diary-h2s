import localforage from "localforage";

// --- Configuration for localForage ---
// This sets up different stores for different types of data, which is more robust.
localforage.setDriver([
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE
]).catch(function (e) {
    console.error("localForage driver setup failed:", e);
});

const entryStore = localforage.createInstance({
  name: "LivingDiary",
  storeName: "diary_entries"
});

const settingsStore = localforage.createInstance({
  name: "LivingDiary",
  storeName: "user_settings"
});

// --- Functions for Offline Diary Entries ---
export const saveEntryOffline = async (entry) => {
  const existing = (await entryStore.getItem("offline_entries")) || [];
  existing.push(entry);
  await entryStore.getItem("offline_entries", existing);
};

export const getOfflineEntries = async () => {
  return (await entryStore.getItem("offline_entries")) || [];
};

export const clearOfflineEntries = async () => {
  await entryStore.setItem("offline_entries", []);
};

// --- Functions for Persistent App Settings ---
// These are used for theme, language, username, and tutorial status.
export const setPersistentValue = async (key, value) => {
  try {
    // This correctly saves settings like 'theme' and 'language'
    await settingsStore.setItem(key, value);
  } catch (error) {
    console.error(`Failed to set persistent value for ${key}:`, error);
  }
};

export const getPersistentValue = async (key) => {
  try {
    // This correctly retrieves the saved settings
    return await settingsStore.getItem(key);
  } catch (error) {
    console.error(`Failed to get persistent value for ${key}:`, error);
    return null;
  }
};