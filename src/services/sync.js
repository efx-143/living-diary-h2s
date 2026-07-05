import { collection, addDoc } from "firebase/firestore";
import { getOfflineEntries, clearOfflineEntries } from "./storage";
import { db } from "./firebase";

export const syncOfflineEntries = async (userId) => {
  try {
    const entries = await getOfflineEntries();
    if (entries.length === 0) return;

    console.log(`Syncing ${entries.length} offline entries...`);
    const colRef = collection(db, `users/${userId}/entries`);
    
    // Use Promise.all to send all entries concurrently for faster sync
    await Promise.all(entries.map(entry => addDoc(colRef, entry)));

    await clearOfflineEntries();
    console.log("Offline sync complete.");
  } catch (error) {
    console.error("Error syncing offline entries:", error);
  }
};
