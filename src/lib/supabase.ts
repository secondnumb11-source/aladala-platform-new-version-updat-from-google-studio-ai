import { createClient } from "@supabase/supabase-js";

// @ts-ignore
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : "") || "https://placeholder.supabase.co";
// @ts-ignore
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : "") || "placeholder";

export const isSupabaseConfigured = supabaseUrl !== "https://placeholder.supabase.co" && supabaseUrl !== "";

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
