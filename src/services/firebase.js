import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// IMPORTANT: Replace these with your actual Firebase configuration values
// You can find these in your Firebase project settings.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const initAuth = (onAuthReady) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in.
      onAuthReady(user.uid);
    } else {
      // User is signed out. Attempt to sign in anonymously.
      try {
        const userCredential = await signInAnonymously(auth);
        // The listener will fire again with the new user, so we don't need to do anything here.
      } catch (error) {
        console.error("Anonymous sign-in failed:", error);
        onAuthReady(null); // Signal that auth failed
      }
    }
  });
};

export { db };
