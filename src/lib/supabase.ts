import { createClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase Client instance
 * To resolve "Multiple GoTrueClient instances" warnings, all components
 * must import the client from this file.
 */

const getEnvVar = (key: string) => {
  // Check process.env (Node.js/Express)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Check import.meta.env (Vite/Browser)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  return "";
};

let rawUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getEnvVar('SUPABASE_URL') || "https://sydcelofkzvtsfatxnka.supabase.co";
if (rawUrl && !rawUrl.match(/^https?:\/\//i)) {
  rawUrl = `https://${rawUrl}`;
}
const supabaseUrl = rawUrl;
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || getEnvVar('SUPABASE_ANON_KEY') || "sb_publishable_VW8gI2hAK_UzF8ApuoUUhA_KUmR1KYz";

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Primary Singleton Instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined', // Only persist in browser
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== 'undefined',
    flowType: 'pkce'
  }
});

