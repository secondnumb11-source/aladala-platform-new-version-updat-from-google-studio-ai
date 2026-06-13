import React, { createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  phone?: string;
  name?: string;
  role: string | 'lawyer' | 'client' | 'employee' | 'researcher' | 'admin';
  trialStartedAt?: string;
  trialExpiresAt?: string;
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  connectionStatus: 'online' | 'offline' | 'checking';
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  loading: true,
  connectionStatus: 'checking',
});

export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Use getDocFromServer to bypass local cache and truly test the network
        await getDocFromServer(doc(db, 'system', 'connectivity'));
        setConnectionStatus('online');
      } catch (error: any) {
        // code=unavailable is the typical error when Firestore is unreachable
        if (error?.code === 'unavailable' || (error instanceof Error && error.message.includes('unavailable'))) {
          console.warn("[Firebase Context] Firestore service is currently unreachable (unavailable). The app will operate in hybrid-memory mode.");
          setConnectionStatus('offline');
        } else {
          // If it's just 'not-found', the service is actually reachable
          setConnectionStatus('online');
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Attempt to get profile, with error handling for offline state
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error: any) {
          console.warn("Error fetching user profile (likely offline):", error?.code || error);
          // If Firestore fails, we still allow the session but with null profile
          // The App component will poll /api/state which acts as our reliable fallback
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, connectionStatus }}>
      {children}
    </FirebaseContext.Provider>
  );
}
