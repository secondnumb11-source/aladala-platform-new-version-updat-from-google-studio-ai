import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://sydcelofkzvtsfatxnka.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_VW8gI2hAK_UzF8ApuoUUhA_KUmR1KYz";

export const supabase = createClient(supabaseUrl, supabaseKey);
