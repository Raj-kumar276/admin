// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Values are sourced from environment variables with defaults provided from Firebase Console
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCnF6npLhhXHIbrPi_D1SF4CILE1MiAmhc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "onebuddy-admin.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "onebuddy-admin",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "onebuddy-admin.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "977426522268",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:977426522268:web:57531b3d8bf20dc94f8d59",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LTBJE7PQRX"
};

// Initialize Firebase (singleton pattern prevents duplicate app initialization)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Analytics conditionally (only in browser environments where supported)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported in this environment
    });
}

// Common Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
