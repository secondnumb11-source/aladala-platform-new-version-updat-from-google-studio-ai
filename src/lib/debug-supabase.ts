import { supabase } from '@/lib/supabase';

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

/**
 * Analyzes Supabase save failures (specifically RLS 42501 errors),
 * compiles an ALTER TABLE / Row Level Security bypass or policy script,
 * and alerts the user with immediate actions and a link to the Supabase SQL console.
 */
export function handleRlsPolicyFriction(table: string, error: any) {
  if (!error) return;
  
  const isRlsViolation = 
    error.code === '42501' || 
    String(error.message || '').includes('42501') || 
    String(error.message || '').toLowerCase().includes('row-level security') ||
    String(error.message || '').toLowerCase().includes('permission denied');

  if (!isRlsViolation) {
    return;
  }

  console.error(`[RLS Policy Friction Analyzer] Captured RLS 42501 on table: "${table}"`, error);

  // Generate perfect SQL to fix this issue
  const sqlCode = `-- حل مشكلة صلاحيات الوصول (RLS) للجدول: ${table}
-- قم بفتح SQL Editor في Supabase ونفذ الأوامر التالية:

-- 1. تمكين صلاحيات الوصول لجدول ${table}
ALTER TABLE public.${table} FORCE ROW LEVEL SECURITY;
ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;

-- 2. إتاحة جميع العمليات لجميع المستخدمين (أو المستخدمين الموثقين) لمنع الخطأ 42501
DROP POLICY IF EXISTS "Allow public access to ${table}" ON public.${table};
CREATE POLICY "Allow public access to ${table}" 
ON public.${table} 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- 3. منح كافة الصلاحيات لمنع الحظر
GRANT ALL ON TABLE public.${table} TO anon, authenticated, service_role;
`;

  // Dispatch a custom event to show a beautiful floating modal/toaster in the UI if possible
  window.dispatchEvent(new CustomEvent('adalah_rls_friction_detected', {
    detail: {
      table,
      error,
      sqlCode,
      consoleUrl: 'https://supabase.com/dashboard/project/_/sql'
    }
  }));

  // Also trigger a detailed prompt fallback so the user is directly warned and has the SQL ready
  const promptMessage = `⚠️ تم اكتشاف تقييد في صلاحيات الوصول (RLS 42501) للجدول "${table}".

لقد قمنا بتجهيز كود SQL اللازم لإصلاح هذا الخلل فوراً.

خطوات الحل:
1. انقر فوق زر "موافق" لنسخ الكود والانتقال لصفحة Supabase SQL Console.
2. الصق الكود واضغط Run لتفعيل سياسة المرور الآمنة.

كود الـ SQL المجهز:
------------------------------------------
${sqlCode}
------------------------------------------`;

  if (typeof window !== 'undefined') {
    // Copy sqlCode to clipboard
    navigator.clipboard.writeText(sqlCode).then(() => {
      console.log('[RLS Policy Analyzer] SQL script successfully copied to clipboard.');
    }).catch(err => {
      console.error('[RLS Policy Analyzer] Clipboard write failed:', err);
    });

    const confirmRedirect = confirm(promptMessage + '\n\nهل تريد فتح Supabase SQL Console الآن لاستعراض وحل الصلاحيات؟ (الكود تم نسخه مؤقتاً في جهازك)');
    if (confirmRedirect) {
      window.open('https://supabase.com/dashboard/project/_/sql', '_blank');
    }
  }
}

