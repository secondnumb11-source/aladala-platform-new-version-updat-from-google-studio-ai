import { createClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase Client instance
 * To resolve "Multiple GoTrueClient instances" warnings, all components
 * must import the client from this file.
 */

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

const rawSupabaseUrl = getViteEnv('VITE_SUPABASE_URL') || getViteEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://sydcelofkzvtsfatxnka.supabase.co';
const supabaseUrl = rawSupabaseUrl.startsWith('http') ? rawSupabaseUrl : `https://${rawSupabaseUrl}`;
const supabaseAnonKey = getViteEnv('VITE_SUPABASE_ANON_KEY') || getViteEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getViteEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || getViteEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || 'sb_publishable_VW8gI2hAK_UzF8ApuoUUhA_KUmR1KYz';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. API calls will fail.');
}

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Primary Singleton Instance
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {

  auth: {
    persistSession: typeof window !== 'undefined', // Only persist in browser
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== 'undefined',
    flowType: 'pkce'
  }
});

