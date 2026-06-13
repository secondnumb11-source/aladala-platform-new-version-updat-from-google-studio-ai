import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  memoryLocalCache
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Ensure Firebase is only initialized once, even during HMR or multiple imports
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let firestoreInstance;
try {
  // Try initializing with settings, memory cache persistence config
  firestoreInstance = initializeFirestore(app, {
    localCache: memoryLocalCache()
  }, (firebaseConfig as any).firestoreDatabaseId);
} catch (e) {
  // If already initialized (e.g., in HMR/re-renders), retrieve the existing instance safely
  firestoreInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
}

export const db = firestoreInstance;

export const auth = getAuth(app);
export const storage = getStorage(app);

