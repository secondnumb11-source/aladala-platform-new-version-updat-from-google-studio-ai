import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  uid: string;
  email: string | null;
  phone?: string;
  name?: string;
  role: string | 'lawyer' | 'client' | 'employee' | 'researcher' | 'admin';
  trialStartedAt?: string;
  trialExpiresAt?: string;
}

interface SupabaseContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  connectionStatus: 'online' | 'offline' | 'checking';
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  profile: null,
  loading: true,
  connectionStatus: 'checking',
});

export const useSupabase = () => useContext(SupabaseContext);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        if (error && error.message.includes('FetchError')) {
          setConnectionStatus('offline');
        } else {
          setConnectionStatus('online');
        }
      } catch (err) {
        setConnectionStatus('offline');
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (u: User) => {
    try {
      // Attempt to load from 'profiles' table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', u.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          uid: data.uid || u.id,
          email: data.email || u.email || null,
          phone: data.phone || undefined,
          name: data.name || undefined,
          role: data.role || 'lawyer',
          trialStartedAt: data.trial_started_at || undefined,
          trialExpiresAt: data.trial_expires_at || undefined,
        });
      } else {
        // Fallback using user metadata
        setProfile({
          uid: u.id,
          email: u.email || null,
          phone: u.user_metadata?.phone || u.phone || undefined,
          name: u.user_metadata?.name || u.user_metadata?.full_name || undefined,
          role: u.user_metadata?.role || 'lawyer',
          trialStartedAt: u.user_metadata?.trialStartedAt,
          trialExpiresAt: u.user_metadata?.trialExpiresAt,
        });
      }
    } catch (err) {
      console.warn("Error fetching Supabase user profile:", err);
      // Construct fallback profile from user metadata or defaults
      setProfile({
        uid: u.id,
        email: u.email || null,
        phone: u.user_metadata?.phone || u.phone || undefined,
        name: u.user_metadata?.name || u.user_metadata?.full_name || undefined,
        role: u.user_metadata?.role || 'lawyer',
        trialStartedAt: u.user_metadata?.trialStartedAt,
        trialExpiresAt: u.user_metadata?.trialExpiresAt,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupabaseContext.Provider value={{ user, profile, loading, connectionStatus }}>
      {children}
    </SupabaseContext.Provider>
  );
}
