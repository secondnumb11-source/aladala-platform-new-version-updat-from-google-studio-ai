import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getViteEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  try {
    return (import.meta as any).env?.[key] || '';
  } catch {
    return '';
  }
};

// Firebase configuration using environment variables for security
const firebaseConfig = {
  apiKey: getViteEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getViteEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getViteEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getViteEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getViteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getViteEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getViteEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (Client-side only)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, googleProvider, analytics };
