import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function validateSupabaseConnection() {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sydcelofkzvtsfatxnka.supabase.co';
  const url = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`) : undefined;
  const keyRaw = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const key = keyRaw.startsWith('eyJ') ? keyRaw : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZGNlbG9ma3p2dHNmYXR4bmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDE1ODUsImV4cCI6MjA5NjkxNzU4NX0._ZSotmVi0yTtTyzZNI9e4y9i8CcG4jLIz8HlKivxV_o';

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

    let retryCount = 0;
    const maxRetries = 3;

    // Attempt a basic health check ping
    const checkPing = async () => {
      try {
        // 1. Perform trial query on the main 'cases' table to check permissions
        const { error: casesError } = await supabase.from('cases').select('id').limit(1);
        if (casesError && (casesError.code === '42501' || casesError.message?.includes('row-level security') || casesError.message?.includes('policy'))) {
          console.warn('[Supabase RLS Warning] 42501 Security Policy Violation on "cases":', casesError.message);
          // Instead of hard blocking, we mark as valid but with a warning in console
          // This allows users to see the landing page/auth and login
          setIsValid(true);
          return;
        }

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
          throw new Error('Auth Connection Error: ' + detailMsg);
        } else {
          setIsValid(true);
        }
      } catch (err: any) {
        console.error('[Supabase Connection Ping] Exception:', err);
        throw err;
      }
    };

    const connectWithRetry = async () => {
      try {
        await checkPing();
      } catch (err: any) {
        if (retryCount >= maxRetries) {
          console.warn('[Supabase] Max retries reached. Please check your API key.');
          setIsValid(false);
          setError('Network error or invalid Supabase credentials: ' + (err?.message || err));
          return;
        }
        retryCount++;
        setTimeout(connectWithRetry, Math.pow(2, retryCount) * 1000);
      }
    };

    connectWithRetry();
  }, []);

  return { isValid, error };
}
