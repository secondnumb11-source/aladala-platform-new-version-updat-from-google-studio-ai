import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables for security
// The provided values have been integrated as defaults but should be moved to .env for production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCIgVDe5mfNZK7oE9XwxhdLTH8MBC36o0o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "platform-ai-studio-fileeeee.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "platform-ai-studio-fileeeee",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "platform-ai-studio-fileeeee.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "699587980568",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:699587980568:web:9e93151c0c3ebfb5a4826d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PZYWD5NXFG"
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
