import { supabase } from '@/lib/supabase';

export interface RlsCheckResult {
  status: 'allowed' | 'denied' | 'error' | 'skipped' | 'checking';
  code?: string;
  message?: string;
}

export interface TableRlsMatrix {
  select: RlsCheckResult;
  insert: RlsCheckResult;
  update: RlsCheckResult;
  delete: RlsCheckResult;
}

export async function runBootRlsDiagnostics() {
  console.log('[Boot RLS Diagnostic] Initiating automatic connectivity and RLS policy verification...');
  
  const tables: ('cases' | 'clients' | 'tasks')[] = ['cases', 'clients', 'tasks'];
  const results: Record<string, TableRlsMatrix> = {};
  const logs: string[] = [`[Boot Diagnostic @ ${new Date().toLocaleTimeString()}] Starting RLS analysis...`];

  const addLog = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    const userEmail = session?.user?.email || "Sessions Guest / Anonymous";
    addLog(`[Boot Diagnostic] Current user session: ${userEmail}`);
    if (sessionErr) {
      addLog(`[Warning] Auth session fetch returned: ${sessionErr.message}`);
    }

    for (const table of tables) {
      addLog(`[Boot Diagnostic] Probing table: [${table}]`);
      results[table] = {
        select: { status: 'checking', message: '' },
        insert: { status: 'checking', message: '' },
        update: { status: 'checking', message: '' },
        delete: { status: 'checking', message: '' }
      };

      // 1. SELECT Probe
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          const isRls = error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy') || error.message?.includes('permission');
          results[table].select = {
            status: isRls ? 'denied' : 'error',
            code: error.code || '42501',
            message: error.message
          };
          addLog(`[Boot Diagnostic ❌] ${table} SELECT blocked by RLS policies.`);
        } else {
          results[table].select = { status: 'allowed', message: `Allowed - Found ${data?.length || 0} rows` };
          addLog(`[Boot Diagnostic ✅] ${table} SELECT allowed.`);
        }
      } catch (e: any) {
        results[table].select = { status: 'error', message: e.message || String(e) };
      }

      // 2. INSERT Probe
      const dummyKey = table === 'cases' ? 'Boot-RLS-Test-' + Math.floor(Math.random() * 100000) : null;
      const dummyData = table === 'cases' ? { title: 'مستند فحص أمان RLS مؤقت', case_number: dummyKey } :
                        table === 'clients' ? { name: 'عميل فحص RLS مؤقت', phone: '0500000000' } :
                        { title: 'مهمة فحص RLS مؤقتة', status: 'pending', priority: 'low' };

      let insertedId: any = null;
      try {
        const { data, error } = await supabase.from(table).insert([dummyData]).select();
        if (error) {
          const isRls = error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy') || error.message?.includes('permission');
          results[table].insert = {
            status: isRls ? 'denied' : 'error',
            code: error.code || '42501',
            message: error.message
          };
          addLog(`[Boot Diagnostic ❌] ${table} INSERT blocked by RLS policies.`);
        } else {
          insertedId = data?.[0]?.id;
          results[table].insert = { status: 'allowed', message: `Allowed - Inserted ID ${insertedId}` };
          addLog(`[Boot Diagnostic ✅] ${table} INSERT allowed.`);
        }
      } catch (e: any) {
        results[table].insert = { status: 'error', message: e.message || String(e) };
      }

      // 3. UPDATE Probe
      try {
        let updateTargetId = insertedId;
        if (!updateTargetId) {
          const { data } = await supabase.from(table).select('id').limit(1);
          if (data && data.length > 0) {
            updateTargetId = data[0].id;
          }
        }

        if (updateTargetId) {
          const updatePayload = table === 'cases' ? { title: 'مستند فحص أمان RLS مؤقت - مُحدث' } :
                                table === 'clients' ? { name: 'عميل فحص RLS مؤقت - مُحدث' } :
                                { title: 'مهمة فحص RLS مؤقتة - مُحدثة' };
          
          const { error } = await supabase.from(table).update(updatePayload).eq('id', updateTargetId);
          if (error) {
            const isRls = error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy') || error.message?.includes('permission');
            results[table].update = {
              status: isRls ? 'denied' : 'error',
              code: error.code || '42501',
              message: error.message
            };
            addLog(`[Boot Diagnostic ❌] ${table} UPDATE blocked by RLS policies.`);
          } else {
            results[table].update = { status: 'allowed', message: `Allowed - Update Succeeded` };
            addLog(`[Boot Diagnostic ✅] ${table} UPDATE allowed.`);
          }
        } else {
          results[table].update = { status: 'skipped', message: 'Skipped - No Row Available' };
        }
      } catch (e: any) {
        results[table].update = { status: 'error', message: e.message || String(e) };
      }

      // 4. CLEANUP / DELETE Probe
      try {
        if (insertedId) {
          const { error } = await supabase.from(table).delete().eq('id', insertedId);
          if (error) {
            const isRls = error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy') || error.message?.includes('permission');
            results[table].delete = {
              status: isRls ? 'denied' : 'error',
              code: error.code || '42501',
              message: error.message
            };
            addLog(`[Boot Diagnostic ❌] ${table} DELETE blocked by RLS policies.`);
          } else {
            results[table].delete = { status: 'allowed', message: `Allowed - Cleaned Inserted Record` };
            addLog(`[Boot Diagnostic ✅] ${table} DELETE allowed and dummy item cleaned.`);
          }
        } else {
          results[table].delete = { status: 'skipped', message: 'Skipped - No inserted record to delete' };
        }
      } catch (e: any) {
        results[table].delete = { status: 'error', message: e.message || String(e) };
      }
    }

    const payload = {
      owner: userEmail,
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      results,
      logs
    };

        await supabase.from('audit_trails').insert({
          event_type: 'boot_rls_diagnostic',
          event_data: payload,
          created_at: new Date().toISOString()
        });
        addLog('[Boot Diagnostic ✅] Security Check Completed & logged to audit_trails.');
    
    // Dispatch custom event to notify listeners
    window.dispatchEvent(new CustomEvent('boot_rls_diagnostic_completed', { detail: payload }));
  } catch (err: any) {
    addLog(`[Boot Diagnostic ❌] Critical Systemic Error during RLS Analysis: ${err?.message || err}`);
  }
}

// Automatically trigger connectivity test & RLS check on application boot
export async function checkSupabaseConnection() {
  console.log('[Supabase Init] Running startup connectivity test...');
  
  const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  if (!rawUrl || !rawKey) {
    console.error('[Supabase Init] ❌ Critical Error: Supabase environment variables are missing! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY are set.');
    return;
  }

  try {
    const { error } = await supabase.from('cases').select('id').limit(1);
    if (error) {
      console.warn('[Supabase Init] Connection test returned database error:', error);
      const logs = JSON.parse(localStorage.getItem('failed_persistence_logs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        type: 'init_test',
        action: 'CONNECT',
        error: {
          code: error.code,
          message: error.message,
          details: error.details || 'Database-level error during startup check.'
        }
      });
      localStorage.setItem('failed_persistence_logs', JSON.stringify(logs));
    } else {
      console.log('[Supabase Init] ✅ Startup connectivity test succeeded!');
    }
  } catch (err: any) {
    console.error('[Supabase Init] ❌ Exceptional failure in connection check:', err);
    const logs = JSON.parse(localStorage.getItem('failed_persistence_logs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'init_test',
      action: 'CONNECT',
      error: {
        code: err?.code || 'NETWORK_ERROR',
        message: err?.message || 'Connection crashed during fetch.',
        details: err?.stack || String(err)
      }
    });
    localStorage.setItem('failed_persistence_logs', JSON.stringify(logs));
  }

  // Trigger RLS Check
  await runBootRlsDiagnostics();
}

checkSupabaseConnection().catch(err => {
  console.error('[Supabase Init Loader Alert]: Failed to run startup tests async:', err);
});
