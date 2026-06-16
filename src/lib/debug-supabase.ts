import { supabase } from './supabase';

export async function runSupabaseDiagnostics(): Promise<{
  success: boolean;
  session: any;
  testedTables: Record<string, { readable: boolean; error: any }>;
}> {
  console.log('[Supabase Diagnostic] Initiating connectivity and RLS permissions checks on critical tables...');
  
  const results: Record<string, { readable: boolean; error: any }> = {
    cases: { readable: false, error: null },
    clients: { readable: false, error: null },
    tasks: { readable: false, error: null }
  };

  let sessionData: any = null;
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('[Supabase Diagnostic] Failed to fetch session:', sessionError.message);
    } else {
      sessionData = session;
      console.log('[Supabase Diagnostic] Current Session User Metadata:', session?.user ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      } : 'No Authenticated User found (Anonymous request mode)');
    }
  } catch (err: any) {
    console.error('[Supabase Diagnostic] Session fetch exception caught:', err.message);
  }

  const tables = ['cases', 'clients', 'tasks'] as const;
  for (const table of tables) {
    try {
      console.log(`[Supabase Diagnostic] Testing query access to table "${table}"...`);
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        results[table].error = {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        };
        const isRls = error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy');
        console.warn(`[Supabase Diagnostic] ❌ Table "${table}" READ is BLOCKED. RLS Violation (42501): ${isRls}. Details:`, error);
      } else {
        results[table].readable = true;
        console.log(`[Supabase Diagnostic] ✅ Table "${table}" READ is ALLOWED. Found ${data?.length || 0} sample rows.`);
      }
    } catch (err: any) {
      results[table].error = { code: 'UNEXPECTED_CRASH', message: err.message || 'Exception' };
      console.error(`[Supabase Diagnostic] ❌ Table "${table}" crashed during query:`, err);
    }
  }

  const overallSuccess = Object.values(results).every(r => r.readable);
  console.log('[Supabase Diagnostic] Diagnostic complete. Run Summary:', {
    authenticated: !!sessionData,
    successfulTables: Object.keys(results).filter(k => results[k].readable),
    failedTables: Object.keys(results).filter(k => !results[k].readable),
    overallSuccess
  });

  return {
    success: overallSuccess,
    session: sessionData,
    testedTables: results
  };
}
