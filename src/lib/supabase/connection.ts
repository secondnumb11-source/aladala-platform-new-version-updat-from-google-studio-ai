import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function validateSupabaseConnection() {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sydcelofkzvtsfatxnka.supabase.co';
  const url = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`) : undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_VW8gI2hAK_UzF8ApuoUUhA_KUmR1KYz';

  if (!url || !key) {
    console.error('[Supabase Diagnostics] ❌ Missing Environment Variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY are not defined.');
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
       console.error('[Supabase Diagnostics] ❌ Invalid URL protocol: Must be HTTP or HTTPS.', url);
       return false;
    }
  } catch (e) {
    console.error('[Supabase Diagnostics] ❌ Invalid VITE_SUPABASE_URL format:', url);
    return false;
  }

  return true;
}

export function useSupabaseConnection() {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isConfigValid = validateSupabaseConnection();
    
    if (!isConfigValid) {
      setIsValid(false);
      setError('Missing or invalid Supabase connection environment variables.');
      return;
    }

    // Attempt a basic health check ping
    const checkPing = async () => {
      try {
        // We do a simple limit(0) query just to test network and credentials
        const { error: pingError } = await supabase.from('audit_trails').select('id').limit(0);
        
        if (pingError && (pingError.code !== '42P01')) { // 42P01 means table doesn't exist, but connection works
          console.warn('[Supabase Connection Ping] warning/error:', pingError.message);
        }
        
        // Also ping the Auth endpoint
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
          console.warn('[Supabase Auth Ping] warning/error:', authError.message);
          let detailMsg = authError.message;
          if (authError.message.includes('JWT') || authError.message.toLowerCase().includes('clock')) {
            detailMsg += " (Please check your system time/clock)";
          }
          setError('Auth Connection Error: ' + detailMsg);
        } else {
          setIsValid(true);
        }
      } catch (err: any) {
        console.error('[Supabase Connection Ping] Exception:', err);
        setIsValid(false);
        setError('Network error or invalid Supabase credentials: ' + (err?.message || err));
      }
    };

    checkPing();
  }, []);

  return { isValid, error };
}
