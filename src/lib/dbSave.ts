import { supabase } from './supabase';

// =====================================================
// طبقة الحفظ المركزية — تحول وتحفظ أي بيانات
// =====================================================

// تعريف حقول كل جدول المسموح بها
const TABLE_FIELDS: Record<string, string[]> = {
  cases: [
    'id','case_number','title','client_name','client_id',
    'opponent_name','opponent_national_id','court_name',
    'category','stage','status','priority','summary',
    'details','circuit_number','power_of_attorney_number',
    'next_session_at','last_session_at','judge_name',
    'is_najiz_sync','najiz_case_number','is_confidential',
    'archived','agreed_fees','collected_fees',
    'last_activity_at','metadata','created_at','updated_at'
  ],
  clients: [
    'id','name','phone','email','national_id','id_number',
    'address','is_company','status','portal_username',
    'portal_password','active_portal','permitted_cases',
    'portal_configured','portal_config_date',
    'created_at','updated_at'
  ],
  employees: [
    'id','name','role','job_title','email','phone',
    'status','salary','national_id','username','password',
    'employee_code','permissions','active_portal',
    'portal_configured','portal_config_date',
    'assigned_case_ids','assigned_client_ids',
    'sidebar_modules','department','branch',
    'join_date','notes','created_at','updated_at'
  ],
  tasks: [
    'id','title','description','status','priority',
    'due_date','employee_id','assigned_to',
    'case_id','case_number','created_at','updated_at'
  ],
  hearings: [
    'id','case_id','case_number','case_name','date',
    'time','court_name','hall','status','type',
    'is_najiz_sync','created_at','updated_at'
  ],
  powers_of_attorney: [
    'id','poa_number','type','status','issue_date',
    'expiry_date','principal_name','agent_name',
    'is_najiz_sync','najiz_sync_date','created_at','updated_at'
  ],
  executions: [
    'id','execution_number','status','amount','court_name',
    'requester_name','issue_date','created_at','updated_at'
  ],
  invoices: [
    'id','invoice_number','client_id','client_name',
    'case_id','case_number','amount','vat_amount',
    'total_amount','status','issue_date','due_date',
    'description','services','created_at','updated_at'
  ]
};

// تحويل camelCase → snake_case
function toSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// تحويل وقت بصيغ مختلفة لـ 24 ساعة
function parseArabicTime(timeStr: string): string {
  if (!timeStr) return '09:00';
  const clean = timeStr
    .replace('صباحاً', ' AM').replace('مساءً', ' PM')
    .replace('ص', ' AM').replace('م', ' PM').trim();
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return '09:00';
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (clean.includes('PM') && h < 12) h += 12;
  if (clean.includes('AM') && h === 12) h = 0;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

// دمج التاريخ والوقت لـ ISO
function toISODateTime(
  dateStr?: string, timeStr?: string
): string | null {
  if (!dateStr) return null;
  try {
    const time = timeStr ? parseArabicTime(timeStr) : '09:00';
    return new Date(`${dateStr}T${time}:00`).toISOString();
  } catch {
    try { return new Date(dateStr).toISOString(); }
    catch { return null; }
  }
}

// التحويل الرئيسي لكل جدول
export function mapToDBPayload(
  tableName: string,
  data: any
): Record<string, any> {

  const payload: Record<string, any> = {};

  // أولاً: تحويل جميع المفاتيح لـ snake_case تلقائياً
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      payload[toSnake(key)] = value;
    }
  });

  // ثانياً: تعيينات خاصة لكل جدول
  switch(tableName) {

    case 'cases':
      // التسميات الخاصة
      if (data.caseName) payload.title = data.caseName;
      if (data.caseNumber) payload.case_number = data.caseNumber;
      if (data.clientName) payload.client_name = data.clientName;
      if (data.clientId) payload.client_id = data.clientId;
      if (data.opponentName) payload.opponent_name = data.opponentName;
      if (data.courtName) payload.court_name = data.courtName;
      if (data.circuitNumber) payload.circuit_number = data.circuitNumber;
      if (data.poaNumber) payload.power_of_attorney_number = data.poaNumber;
      if (data.najizCaseNumber !== undefined) payload.najiz_case_number = data.najizCaseNumber;
      if (data.isNajizSync !== undefined) payload.is_najiz_sync = data.isNajizSync;
      if (data.isConfidential !== undefined) payload.is_confidential = data.isConfidential;
      if (data.agreedFees !== undefined) payload.agreed_fees = data.agreedFees;
      if (data.collectedFees !== undefined) payload.collected_fees = data.collectedFees;

      // دمج التاريخ والوقت
      if (data.nextSessionDate) {
        payload.next_session_at = toISODateTime(
          data.nextSessionDate,
          data.nextSessionTime
        );
      }

      // القيم الافتراضية
      if (!payload.category) payload.category = 'civil';
      if (!payload.stage) payload.stage = 'litigation';
      if (!payload.status) payload.status = 'new';
      if (!payload.priority) payload.priority = 'medium';
      payload.archived = data.archived ?? false;

      // احذف الحقول المؤقتة
      delete payload.case_name;
      delete payload.next_session_date;
      delete payload.next_session_time;
      delete payload.court_name_name;
      delete payload.opponent_name_name;
      delete payload.is_confidential_al;
      break;

    case 'clients':
      if (data.nationalId) payload.national_id = data.nationalId;
      if (data.idNumber) payload.id_number = data.idNumber;
      if (data.isCompany !== undefined) payload.is_company = data.isCompany;
      if (data.portalUsername) payload.portal_username = data.portalUsername;
      if (data.portalPassword) payload.portal_password = data.portalPassword;
      if (data.activePortal !== undefined) payload.active_portal = data.activePortal;
      if (data.permittedCases) payload.permitted_cases = data.permittedCases;
      if (!payload.status) payload.status = 'active';
      break;

    case 'employees':
      if (data.jobTitle) payload.job_title = data.jobTitle;
      if (data.nationalId) payload.national_id = data.nationalId;
      if (data.joinDate) payload.join_date = data.joinDate;
      if (data.employeeCode) payload.employee_code = data.employeeCode;
      if (data.activePortal !== undefined) payload.active_portal = data.activePortal;
      if (data.portalConfigured !== undefined) payload.portal_configured = data.portalConfigured;
      if (data.assignedCaseIds) payload.assigned_case_ids = data.assignedCaseIds;
      if (data.assignedClientIds) payload.assigned_client_ids = data.assignedClientIds;
      if (!payload.status) payload.status = 'active';
      break;

    case 'tasks':
      if (data.employeeId) payload.employee_id = data.employeeId;
      if (data.assignedTo) payload.assigned_to = data.assignedTo;
      if (data.caseId) payload.case_id = data.caseId;
      if (data.caseNumber) payload.case_number = data.caseNumber;
      if (data.dueDate) {
        try {
          payload.due_date = new Date(data.dueDate).toISOString();
        } catch { payload.due_date = null; }
      }
      if (!payload.status) payload.status = 'todo';
      if (!payload.priority) payload.priority = 'medium';
      break;

    case 'hearings':
      if (data.caseId) payload.case_id = data.caseId;
      if (data.caseNumber) payload.case_number = data.caseNumber;
      if (data.caseName) payload.case_name = data.caseName;
      if (data.courtName) payload.court_name = data.courtName;
      if (data.isNajizSync !== undefined) payload.is_najiz_sync = data.isNajizSync;
      break;

    case 'powers_of_attorney':
      if (data.poaNumber) payload.poa_number = data.poaNumber;
      if (data.issueDate) payload.issue_date = data.issueDate;
      if (data.expiryDate) payload.expiry_date = data.expiryDate;
      if (data.principalName) payload.principal_name = data.principalName;
      if (data.agentName) payload.agent_name = data.agentName;
      if (data.isNajizSync !== undefined) payload.is_najiz_sync = data.isNajizSync;
      break;

    case 'executions':
      if (data.executionNumber) payload.execution_number = data.executionNumber;
      if (data.courtName) payload.court_name = data.courtName;
      if (data.requesterName) payload.requester_name = data.requesterName;
      if (data.issueDate) payload.issue_date = data.issueDate;
      if (data.amount !== undefined) payload.amount = Number(data.amount) || 0;
      break;
  }

  // ثالثاً: الحقول الأساسية
  payload.id = data.id;
  payload.updated_at = new Date().toISOString();
  if (!payload.created_at) payload.created_at = new Date().toISOString();

  // رابعاً: احذف الحقول غير المسموح بها
  const allowedFields = TABLE_FIELDS[tableName];
  if (allowedFields) {
    Object.keys(payload).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete payload[key];
      }
    });
  }

  // خامساً: احذف undefined وNull غير مقصود
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
}

// الدالة الرئيسية للحفظ
export async function saveToSupabase(
  tableName: string,
  data: any
): Promise<{ success: boolean; data?: any; error?: string }> {

  if (!data?.id) {
    return { success: false, error: 'id مطلوب' };
  }

  try {
    const payload = mapToDBPayload(tableName, data);

    console.log(`[DB Save] ${tableName}:`, {
      id: payload.id,
      fields: Object.keys(payload).length
    });

    const { data: result, error } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error(`[DB Save Error] ${tableName}:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // إذا فشل بسبب حقل غير موجود — احذفه وأعد
      if (error.message?.includes('column')) {
        const badCol = error.message.match(/column "([^"]+)"/)?.[1];
        if (badCol && payload[badCol] !== undefined) {
          delete payload[badCol];
          const { data: r2, error: e2 } = await supabase
            .from(tableName)
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();
          if (!e2) {
            saveLocalBackup(tableName, payload);
            return { success: true, data: r2 || payload };
          }
        }
      }

      // حفظ محلي كـ fallback
      saveLocalBackup(tableName, payload);
      return { success: false, error: error.message, data: payload };
    }

    saveLocalBackup(tableName, result || payload);
    console.log(`[DB Save] ✅ ${tableName} saved:`, payload.id);
    return { success: true, data: result || payload };

  } catch(err: any) {
    console.error(`[DB Save Exception] ${tableName}:`, err.message);
    saveLocalBackup(tableName, data);
    return { success: false, error: err.message, data };
  }
}

function saveLocalBackup(tableName: string, data: any) {
  try {
    const key = `${tableName}_local`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = existing.findIndex((r: any) => r.id === data.id);
    if (idx >= 0) existing[idx] = { ...existing[idx], ...data };
    else existing.unshift(data);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)));
  } catch(e) {}
}
