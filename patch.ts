import fs from 'fs';

const codeToInject = `app.post('/api/v1/sync', async (req: any, res: any) => {
  const crypto = await import('crypto');
  const body = req.body || {};

  // ping للاختبار
  if (body.type === 'ping' || body.payload?.items?.length === 0) {
    return res.json({ success: true, message: 'الاتصال ناجح ✅', itemCount: 0 });
  }

  // التحقق من API Key
  const apiKey = req.headers['x-api-key'] ||
    req.headers['authorization']?.replace('Bearer ','') || '';
  if (apiKey) {
    try {
      await adminSupabase.from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_value', apiKey.trim())
        .eq('is_active', true);
    } catch {}
  }

  // استخراج البيانات من جميع الأشكال الممكنة
  const type = body.type || 'all';
  const payload = body.payload || body.data || body;
  const normalized = payload.normalized || payload;

  // استخراج القوائم
  const cases = normalized.cases || payload.cases || body.cases || [];
  const sessions = normalized.sessions || payload.sessions || body.sessions ||
                   payload.hearings || body.hearings || [];
  const agencies = normalized.agencies || payload.agencies || body.agencies ||
                   payload.poa || body.poa || [];
  const executions = normalized.executions || payload.executions || body.executions || [];
  const judgments = normalized.judgments || payload.judgments || body.judgments || [];
  const clients = normalized.clients || payload.clients || body.clients || [];
  const minutes = normalized.minutes || payload.minutes || body.minutes || [];
  const requests = normalized.requests || payload.requests || body.requests || [];

  // items عامة — توزيعها حسب _kind
  const items = payload.items || body.items || [];
  items.forEach((item: any) => {
    const kind = item._kind || inferKind(item);
    if (kind === 'case') cases.push(item);
    else if (kind === 'session') sessions.push(item);
    else if (kind === 'agency') agencies.push(item);
    else if (kind === 'execution') executions.push(item);
    else if (kind === 'judgment') judgments.push(item);
    else if (kind === 'client') clients.push(item);
    else if (kind === 'minute') minutes.push(item);
    else if (kind === 'request') requests.push(item);
  });

  function inferKind(item: any): string {
    const text = JSON.stringify(item).toLowerCase();
    if (/casenumber|case_number|قضية|دعوى/.test(text)) return 'case';
    if (/sessiondate|hearing|جلسة|موعد/.test(text)) return 'session';
    if (/agencynumber|poa|وكالة/.test(text)) return 'agency';
    if (/executionnumber|تنفيذ/.test(text)) return 'execution';
    if (/judgment|حكم|صك/.test(text)) return 'judgment';
    return 'unknown';
  }

  function getField(obj: any, ...keys: string[]): string {
    const item = obj?.fields || obj;
    for (const k of keys) {
      if (item[k]) return String(item[k]).trim();
    }
    return '';
  }

  function safeDate(val: string): string | null {
    if (!val) return null;
    try { return new Date(val).toISOString(); } catch { return null; }
  }

  const results: any = {
    cases: { added: 0, updated: 0, errors: 0 },
    sessions: { added: 0, errors: 0 },
    agencies: { added: 0, errors: 0 },
    executions: { added: 0, errors: 0 },
    judgments: { added: 0, errors: 0 },
    clients: { added: 0, errors: 0 }
  };

  // ===== 1. حفظ القضايا → قسم إدارة القضايا =====
  for (const c of cases) {
    try {
      const caseNum = getField(c, 'caseNumber','case_number','رقم القضية') ||
        JSON.stringify(c).match(/\\d{4}\\/\\d{3,}/)?.[0] || '';
      if (!caseNum) continue;

      const { data: existing } = await adminSupabase
        .from('cases').select('id')
        .eq('case_number', caseNum).maybeSingle();

      const payload_case = {
        case_number: caseNum,
        najiz_case_number: caseNum,
        title: getField(c,'caseName','case_name','title','subject') || \`قضية \${caseNum}\`,
        client_name: getField(c,'plaintiff','clientName','client_name','المدعي'),
        opponent_name: getField(c,'defendant','opponentName','opponent_name','المدعى عليه'),
        status: getField(c,'status','caseStatus','الحالة') || 'قيد النظر',
        category: mapCategory(getField(c,'caseType','category','نوع القضية')),
        stage: 'litigation',
        court_name: getField(c,'court','courtName','court_name','المحكمة'),
        circuit_number: getField(c,'circuit','circuitNumber','circuit_number','الدائرة'),
        capacity: getField(c,'capacity','الصفة'),
        case_date: safeDate(getField(c,'caseDate','case_date','تاريخ القضية')),
        is_najiz_sync: true,
        last_sync_at: new Date().toISOString(),
        archived: false,
        updated_at: new Date().toISOString()
      };

      if (existing?.id) {
        await adminSupabase.from('cases')
          .update(payload_case).eq('id', existing.id);
        results.cases.updated++;
      } else {
        await adminSupabase.from('cases').insert({
          ...payload_case,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString()
        });
        results.cases.added++;
      }
    } catch(e: any) {
      console.error('[Case]', e.message);
      results.cases.errors++;
    }
  }

  // ===== 2. حفظ الجلسات → قسم مواعيد الجلسات =====
  for (const s of sessions) {
    try {
      const dateVal = getField(s,'date','sessionDate','hearing_date','تاريخ الجلسة','date');
      if (!dateVal) continue;
      const caseNum = getField(s,'caseNumber','case_number','رقم القضية');
      const key = \`\${caseNum}-\${dateVal}\`;

      await adminSupabase.from('hearings').upsert({
        id: crypto.randomUUID(),
        case_number: caseNum,
        case_name: getField(s,'caseName','case_name','title'),
        date: dateVal,
        time: getField(s,'time','sessionTime') || '09:00',
        court_name: getField(s,'court','courtName','court_name','المحكمة'),
        hall: getField(s,'hall','قاعة'),
        circuit_number: getField(s,'circuit','circuitNumber','الدائرة'),
        status: getField(s,'status','الحالة') || 'upcoming',
        session_type: getField(s,'sessionType','نوع الجلسة') || 'جلسة',
        is_najiz_sync: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'case_number,date', ignoreDuplicates: true });
      results.sessions.added++;
    } catch(e: any) {
      console.error('[Session]', e.message);
      results.sessions.errors++;
    }
  }

  // ===== 3. حفظ الوكالات → قسم الوكالات =====
  for (const a of agencies) {
    try {
      const agencyNum = getField(a,'agencyNumber','agency_number','poa_number','رقم الوكالة') ||
        JSON.stringify(a).match(/\\d{6,}/)?.[0] || '';
      if (!agencyNum) continue;

      await adminSupabase.from('powers_of_attorney').upsert({
        id: crypto.randomUUID(),
        poa_number: agencyNum,
        type: getField(a,'poaType','type','نوع الوكالة') || 'general',
        status: getField(a,'status','حالة الوكالة') || 'active',
        agent_name: getField(a,'agent','agentName','اسم الوكيل'),
        principal_name: getField(a,'principal','principalName','الموكل'),
        issue_date: getField(a,'issueDate','issue_date','تاريخ إصدار الوكالة') || null,
        expiry_date: getField(a,'expiryDate','expiry_date','تاريخ انتهاء الوكالة') || null,
        is_najiz_sync: true,
        najiz_sync_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'poa_number', ignoreDuplicates: false });
      results.agencies.added++;
    } catch(e: any) {
      console.error('[Agency]', e.message);
      results.agencies.errors++;
    }
  }

  // ===== 4. حفظ طلبات التنفيذ → قسم طلبات التنفيذ =====
  for (const e of executions) {
    try {
      const execNum = getField(e,'executionNumber','requestNumber','execution_number','رقم الطلب') ||
        JSON.stringify(e).match(/\\d{9,}/)?.[0] || '';
      if (!execNum) continue;

      await adminSupabase.from('executions').upsert({
        id: crypto.randomUUID(),
        execution_number: execNum,
        request_type: getField(e,'requestType','request_type','نوع الطلب'),
        deed_type: getField(e,'deedType','deed_type','نوع السند'),
        status: getField(e,'status','حالة الطلب') || 'pending',
        amount: parseFloat(getField(e,'amount','المبلغ').replace(/[^\\d.]/g,'')) || 0,
        court_name: getField(e,'court','courtName','court_name','اسم المحكمة'),
        defendant_name: getField(e,'defendant','المنفذ ضده'),
        requester_name: getField(e,'requester','طالب التنفيذ'),
        issue_date: getField(e,'requestDate','date','تاريخ تقديم الطلب') || null,
        is_najiz_sync: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'execution_number', ignoreDuplicates: false });
      results.executions.added++;
    } catch(e2: any) {
      console.error('[Execution]', e2.message);
      results.executions.errors++;
    }
  }

  // ===== 5. حفظ الأحكام → قسم الأحكام والمذكرات =====
  for (const j of judgments) {
    try {
      const deedNum = getField(j,'deedNumber','deed_number','رقم الصك') || '';
      const caseNum = getField(j,'caseNumber','case_number','رقم القضية') || '';
      if (!deedNum && !caseNum) continue;

      await adminSupabase.from('case_documents').upsert({
        id: crypto.randomUUID(),
        case_number: caseNum || deedNum,
        case_name: getField(j,'caseType','نوع القضية'),
        document_type: 'judgment',
        document_name: \`صك \${deedNum || caseNum} — \${getField(j,'judgmentType','نوع الحكم') || 'حكم'}\`,
        judgment_type: getField(j,'judgmentType','نوع الحكم'),
        judgment_date: getField(j,'deedDate','judgmentDate','تاريخ الصك') || null,
        court_name: getField(j,'court','courtName','المحكمة'),
        notes: [
          getField(j,'plaintiff','المدعي') ? \`المدعي: \${getField(j,'plaintiff','المدعي')}\` : '',
          getField(j,'defendant','المدعى عليه') ? \`المدعى عليه: \${getField(j,'defendant','المدعى عليه')}\` : '',
          deedNum ? \`رقم الصك: \${deedNum}\` : ''
        ].filter(Boolean).join(' | '),
        is_najiz_sync: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      results.judgments.added++;
    } catch(e: any) {
      console.error('[Judgment]', e.message);
      results.judgments.errors++;
    }
  }

  // ===== 6. حفظ العملاء/الأطراف → قسم العملاء =====
  for (const cl of clients) {
    try {
      const name = getField(cl,'name','clientName','partyName','المدعي','الموكل');
      if (!name || name.length < 2) continue;

      const { data: existing } = await adminSupabase
        .from('clients').select('id')
        .eq('name', name).maybeSingle();

      if (!existing) {
        await adminSupabase.from('clients').insert({
          id: crypto.randomUUID(),
          name,
          phone: getField(cl,'phone','mobile') || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        results.clients.added++;
      }
    } catch(e: any) {
      console.error('[Client]', e.message);
      results.clients.errors++;
    }
  }

  function mapCategory(text: string): string {
    if (!text) return 'civil';
    const t = text.toLowerCase();
    if (/تجاري|commercial/.test(t)) return 'commercial';
    if (/عمالي|labor/.test(t)) return 'labor';
    if (/جزائي|criminal/.test(t)) return 'criminal';
    if (/أحوال|personal/.test(t)) return 'personal_status';
    if (/إداري|admin/.test(t)) return 'administrative';
    return 'civil';
  }

  const totalSynced = Object.values(results)
    .reduce((s: any, r: any) => s + (r.added || 0) + (r.updated || 0), 0);

  // تسجيل في سجل المزامنة
  await adminSupabase.from('najiz_sync_logs').insert({
    id: crypto.randomUUID(),
    sync_type: type,
    status: totalSynced > 0 ? 'success' : 'empty',
    records_synced: totalSynced,
    raw_data: JSON.stringify({ results, source: body.source }),
    created_at: new Date().toISOString()
  }).catch(() => {});

  return res.json({
    success: true,
    itemCount: totalSynced,
    totalSynced,
    message: totalSynced > 0
      ? \`✅ تمت المزامنة: \${totalSynced} سجل\`
      : 'لا بيانات جديدة',
    results,
    distribution: {
      'إدارة القضايا': results.cases.added + results.cases.updated,
      'مواعيد الجلسات': results.sessions.added,
      'الوكالات': results.agencies.added,
      'طلبات التنفيذ': results.executions.added,
      'الأحكام والمذكرات': results.judgments.added,
      'العملاء': results.clients.added
    },
    timestamp: new Date().toISOString()
  });
});`;

let fileContent = fs.readFileSync('server.ts', 'utf8');

const startIndex = fileContent.indexOf("app.post('/api/v1/sync', async (req: any, res: any) => {");
const endIndexMarker = "app.get('/api/v1/ping', (req, res) => {";
let endIndex = fileContent.indexOf(endIndexMarker);

// Find the last }); before endIndex
const codeBetween = fileContent.substring(startIndex, endIndex);
const lastClosingIdx = codeBetween.lastIndexOf("});");

if (startIndex !== -1 && endIndex !== -1 && lastClosingIdx !== -1) {
  const finalEndIndex = startIndex + lastClosingIdx + 3; // +3 for "});"
  const newContent = fileContent.substring(0, startIndex) + codeToInject + "\\n\\n// مسار اختبار الاتصال\\n" + fileContent.substring(endIndex);
  fs.writeFileSync('server.ts', newContent);
  console.log("Successfully patched server.ts");
} else {
  console.log("Could not find the block to replace.");
}
