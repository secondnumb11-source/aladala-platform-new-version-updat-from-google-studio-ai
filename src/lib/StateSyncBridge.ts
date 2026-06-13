import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

/**
 * StateSyncBridge: unifies app state synchronization between Firebase,
 * LocalStorage, and in-memory React states.
 */
export const StateSyncBridge = {
  syncState: async (userId: string, stateKey: string, localState: any, setStateFn: (val: any) => void) => {
    if (!userId) return;
    try {
      // Create standard cache key
      const localKey = `adalah-sync-${userId}-${stateKey}`;
      
      // Load local cache immediately to prevent layout shifts
      const cached = localStorage.getItem(localKey);
      if (cached) {
        try {
          setStateFn(JSON.parse(cached));
        } catch (e) {
          console.warn('Failed to parse local cache', e);
        }
      }

      // Sync with Firebase Document
      const docRef = doc(db, "user_state", `${userId}_${stateKey}`);
      
      // Real-time listener for remote updates
      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data().payload;
          localStorage.setItem(localKey, JSON.stringify(remoteData));
          setStateFn(remoteData);
        }
      });

      return unsubscribe; // Return cleanup function
    } catch (err) {
      console.warn(`[StateSyncBridge] Error syncing ${stateKey}:`, err);
    }
  },

  updateState: async (userId: string, stateKey: string, newState: any) => {
    if (!userId) return;
    try {
      const localKey = `adalah-sync-${userId}-${stateKey}`;
      localStorage.setItem(localKey, JSON.stringify(newState));
      
      const docRef = doc(db, "user_state", `${userId}_${stateKey}`);
      await setDoc(docRef, { payload: newState, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn(`[StateSyncBridge] Error updating ${stateKey}:`, err);
    }
  }
};
