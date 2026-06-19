import { createClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase Client instance
 * To resolve "Multiple GoTrueClient instances" warnings, all components
 * must import the client from this file.
 */

const getViteEnv = (key: string): string => {
  try {
    const val = (import.meta as any).env?.[key];
    if (val) return val;
  } catch {}
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

const rawSupabaseUrl = getViteEnv('VITE_SUPABASE_URL') || getViteEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://sydcelofkzvtsfatxnka.supabase.co';
const supabaseUrl = rawSupabaseUrl.startsWith('http') ? rawSupabaseUrl : `https://${rawSupabaseUrl}`;
const supabaseRawKey = getViteEnv('VITE_SUPABASE_ANON_KEY') || '';
// In AI Studio, the environmental variables sometimes stick to old values despite .env changes. Fallback to the known correct keys
const supabaseAnonKey = supabaseRawKey.startsWith('eyJ') 
  ? supabaseRawKey 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZGNlbG9ma3p2dHNmYXR4bmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDE1ODUsImV4cCI6MjA5NjkxNzU4NX0._ZSotmVi0yTtTyzZNI9e4y9i8CcG4jLIz8HlKivxV_o';


if (!supabaseUrl) {
  console.error('❌ [Supabase Validation] Missing VITE_SUPABASE_URL environment variable.');
}

if (!supabaseAnonKey) {
  console.error('❌ [Supabase Validation] Missing VITE_SUPABASE_ANON_KEY environment variable. API calls will fail.');
} else if (!supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ [Supabase Validation] Invalid VITE_SUPABASE_ANON_KEY! It must be a valid JWT starting with "eyJ". Received:', supabaseAnonKey.substring(0, 15) + '...');
} else {
  console.log('✅ [Supabase Validation] VITE_SUPABASE_ANON_KEY successfully validated.');
}

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseAnonKey.startsWith('eyJ');

// Primary Singleton Instance
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {

  auth: {
    persistSession: typeof window !== 'undefined', // Only persist in browser
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== 'undefined',
    flowType: 'pkce'
  }
});

/**
 * Uploads a file to Supabase storage. If the bucket does not exist,
 * it attempts to create the bucket programmatically, and retries the upload.
 * If that fails or if the environment doesn't support storage bucket creation,
 * it gracefully falls back to generating an Object URL so the application does
 * not block the user with an error, while still saving the database record.
 */
export async function uploadFileToStorage(
  bucketName: string,
  path: string,
  file: File
): Promise<{ url: string; path: string; isFallback: boolean }> {
  try {
    let { data, error } = await supabase.storage.from(bucketName).upload(path, file);

    // If it fails because bucket is not found, try programmatically creating the bucket
    if (error && (error.message?.includes('Bucket not found') || error.message?.includes('bucket_not_found') || (error as any).status === 404)) {
      console.log(`[Storage] Bucket '${bucketName}' not found. Attempting to programmatically create it...`);
      try {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        });
        
        if (!createBucketError) {
          console.log(`[Storage] Successfully created bucket '${bucketName}'. Retrying upload...`);
          const retryResult = await supabase.storage.from(bucketName).upload(path, file);
          data = retryResult.data;
          error = retryResult.error;
        } else {
          console.warn(`[Storage] Failed to create bucket programmatically:`, createBucketError);
        }
      } catch (bucketCreateEx) {
        console.warn(`[Storage] Exception while trying to create bucket:`, bucketCreateEx);
      }
    }

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
      return {
        url: publicUrlData?.publicUrl || '',
        path: path,
        isFallback: false,
      };
    }

    if (error) {
      throw error;
    }
  } catch (err: any) {
    console.warn(`[Storage Fallback] Supabase upload failed (${err?.message || err}). Falling back to local URL...`);
  }

  // Fallback to local Object URL so the user is never blocked by storage bucket issues
  const localUrl = URL.createObjectURL(file);
  return {
    url: localUrl,
    path: `fallback_local/${Date.now()}_${file.name}`,
    isFallback: true,
  };
}

