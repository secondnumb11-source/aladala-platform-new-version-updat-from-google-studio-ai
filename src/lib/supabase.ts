import { createClient } from "@supabase/supabase-js";

// @ts-ignore
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) : "") || "https://sydcelofkzvtsfatxnka.supabase.co";
// @ts-ignore
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) : "") || "sb_publishable_VW8gI2hAK_UzF8ApuoUUhA_KUmR1KYz";

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
