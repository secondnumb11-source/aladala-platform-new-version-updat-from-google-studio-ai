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

const supabaseUrl = getViteEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getViteEnv('VITE_SUPABASE_ANON_KEY');

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

