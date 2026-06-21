import { useState, useEffect, useCallback, useRef } from 'react';
import { generateUUID } from '@/lib/uuid';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { saveToSupabase } from '@/lib/dbSave';
import { Case, Client, Task, Hearing, Document, PowerOfAttorney, Invoice, Employee, AuditTrail, Execution } from '@/types';
import { validatePayload } from '@/lib/persistenceManager';
import { toCamel, toSnake } from '@/utils/schemaMapping';
import { handleRlsPolicyFriction } from '@/lib/debug-supabase';

// ======================================================
// SCHEMA GUARD - الأعمدة المسموح بها فقط لكل جدول
// مطابقة تماماً لـ supabase_schema_final.sql
// ======================================================
const DB_COLUMNS: Record<string, string[]> = {
  messages: [
    'id', 'sender', 'sender_name', 'text', 'timestamp', 'case_number', 'created_at'
  ],
  contracts: [
    'id', 'client_name', 'client_id', 'title', 'content', 'status', 'otp_code', 'otp_status', 'signed_at', 'signer_name', 'phone', 'created_at'
  ],
  clients: [
    'id', 'name', 'phone', 'email',
    'id_number', 'national_id', 'najiz_id',
    'address', 'is_company', 'status',
    'portal_token', 'portal_link',
    'portal_username', 'portal_password',
    'active_portal', 'permitted_cases',
    'permitted_case_permissions',
    'last_sync_at', 'created_at', 'updated_at'
  ],
  cases: [
    'id', 'client_id', 'case_number', 'najiz_case_number',
    'title', 'category', 'stage', 'status', 'priority',
    'court_name', 'opponent_name', 'summary', 'details',
    'attachments_count', 'last_session_at', 'next_session_at',
    'lawyers', 'metadata', 'last_sync_at', 'created_at', 'updated_at',
    'najiz_case_id', 'subject', 'case_classification', 'case_status',
    'opponent_id', 'opponent_national_id', 'circuit_number',
    'power_of_attorney_number', 'next_session_time', 'is_najiz_sync',
    'is_confidential', 'confidentiality', 'archived', 'last_activity_at',
    'start_date', 'lead_lawyer_id', 'judge_name', 'judgment_summary',
    'judgment_date', 'appeal_deadline', 'execution_number',
    'execution_status', 'execution_amount', 'agreed_fees',
    'collected_fees', 'expenses'
  ],
  tasks: [
    'id', 'case_id', 'employee_id', 'title', 'description',
    'status', 'priority', 'due_date', 'created_at', 'updated_at',
    'assigned_to', 'case_number', 'timer_active', 'timer_duration',
    'target_completion_time'
  ],
  hearings: [
    'id', 'case_id', 'date', 'time', 'location',
    'hall', 'judge', 'status', 'notes', 'created_at', 'updated_at'
  ],
  documents: [
    'id', 'case_id', 'client_id', 'name', 'category', 'file_url',
    'file_size', 'size', 'storage_path', 'uploaded_at', 'tags',
    'content_text', 'versions', 'current_version', 'color_code',
    'ai_classification', 'created_at', 'updated_at'
  ],
  invoices: [
    'id', 'client_id', 'case_id', 'amount', 'vat_amount',
    'total_amount', 'status', 'issue_date', 'due_date',
    'payment_method', 'description', 'is_zatca_submitted',
    'zatca_timestamp', 'created_at', 'updated_at',
    'client_name', 'invoice_number'
  ],
  executions: [
    'id', 'execution_number', 'case_number', 'requester_name', 'opponent_name', 
    'status', 'amount', 'court_name', 'issue_date', 'last_update', 
    'details', 'created_at', 'updated_at'
  ],
  employees: [
    'id', 'name', 'role', 'job_title', 'email', 'phone',
    'status', 'salary', 'base_salary', 'allowances',
    'deductions', 'department', 'branch', 'join_date',
    'start_date', 'end_date', 'national_id', 'username',
    'password', 'custom_login_token', 'portal_link',
    'qualification', 'birth_date', 'manager', 'nationality',
    'national_id_expiry', 'notes', 'permissions',
    'feature_access', 'sidebar_config', 'avatar_url',
    'employee_code', 'najiz_api_key', 'assigned_cases',
    'assigned_clients', 'active_portal', 'created_at',
    'updated_at'
  ],
  powers_of_attorney: [
    'id', 'client_id', 'poa_number', 'issue_date', 'expiry_date',
    'type', 'status', 'file_url', 'created_at', 'updated_at'
  ],
  attachments: [
    'id', 'case_id', 'file_name', 'file_size', 'file_url',
    'category', 'uploaded_at', 'created_at'
  ],
  payments: [
    'id', 'invoice_id', 'client_id', 'amount', 'payment_date',
    'payment_method', 'transaction_id', 'status', 'created_at'
  ],
  notifications: [
    'id', 'user_id', 'title', 'message', 'type',
    'is_read', 'entity_type', 'entity_id', 'created_at'
  ],
  audit_trails: [
    'id', 'user_id', 'user_name', 'action', 'entity_type',
    'entity_id', 'old_data', 'new_data', 'ip_address', 'created_at'
  ],
  system_errors: [
    'id', 'message', 'stack', 'component',
    'user_id', 'severity', 'created_at'
  ],
};

function convertToSnakeCase(tableName: string, data: any): any {
  const payload: any = {};
  Object.keys(data).forEach(key => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    payload[snakeKey] = data[key];
  });
  if (tableName === 'cases') {
    // دمج التاريخ والوقت بشكل آمن
    if (data.nextSessionDate) {
      try {
        const dateStr = data.nextSessionDate; // "2026-06-15"
        let timeStr = (data.nextSessionTime || '09:00')
          // إزالة النص العربي
          .replace('صباحاً', 'AM')
          .replace('مساءً', 'PM')
          .replace('ص', 'AM')
          .replace('م', 'PM')
          .trim();

        // استخراج الوقت بالأرقام فقط
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
        let hours = timeMatch ? parseInt(timeMatch[1]) : 9;
        const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;

        // تحويل AM/PM
        if (timeStr.includes('PM') && hours < 12) hours += 12;
        if (timeStr.includes('AM') && hours === 12) hours = 0;

        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');

        payload.next_session_at = new Date(
          `${dateStr}T${h}:${m}:00`
        ).toISOString();

      } catch(e) {
        // إذا فشل التحويل — احفظ التاريخ فقط
        try {
          payload.next_session_at = new Date(
            data.nextSessionDate
          ).toISOString();
        } catch {
          payload.next_session_at = null;
        }
      }
    }

    // client_id — تحقق قبل الإرسال (هذا يتطلب تعديل الدالة لتكون async أو إسناد المهمة لمكان آخر)
    // نظراً لأن الدالة الحالية متزامنة (synchronous) ولا يمكن استخدام await، سنؤجل التحقق إلى onUpdateState
    payload.client_id = data.clientId || null;

    // الحقول الأساسية
    payload.case_number = data.caseNumber || '';
    payload.title = data.caseName || data.title || '';
    payload.client_name = data.clientName || '';
    payload.opponent_name = data.opponentName || '';
    payload.court_name = data.courtName || '';
    payload.category = data.category || 'civil';
    payload.stage = data.stage || 'litigation';
    payload.status = data.status || 'new';
    payload.priority = data.priority || 'medium';
    payload.summary = data.summary || null;
    payload.details = data.details || null;
    payload.circuit_number = data.circuitNumber || null;
    payload.power_of_attorney_number = data.poaNumber || null;
    payload.najiz_case_number = data.najizCaseNumber || null;
    payload.is_najiz_sync = data.isNajizSync || false;
    payload.is_confidential = data.isConfidential || false;
    payload.archived = data.archived || false;

    // احذف الحقول الزائدة
    const validCaseFields = [
      'id','case_number','title','client_name','client_id',
      'opponent_name','opponent_national_id','court_name',
      'category','stage','status','priority','summary',
      'details','circuit_number','power_of_attorney_number',
      'next_session_at','last_session_at','is_najiz_sync',
      'najiz_case_number','is_confidential','archived',
      'agreed_fees','collected_fees','judge_name',
      'case_classification','created_at','updated_at',
      'last_activity_at','metadata'
    ];

    Object.keys(payload).forEach(key => {
      if (!validCaseFields.includes(key)) {
        delete payload[key];
      }
    });
  }
  if (tableName === 'clients') {
    if (data.nationalId !== undefined) payload.national_id = data.nationalId;
    if (data.idNumber !== undefined) payload.id_number = data.idNumber;
    if (data.isCompany !== undefined) payload.is_company = data.isCompany;
    if (data.portalUsername !== undefined) payload.portal_username = data.portalUsername;
    if (data.portalPassword !== undefined) payload.portal_password = data.portalPassword;
    if (data.activePortal !== undefined) payload.active_portal = data.activePortal;
    if (data.permittedCases !== undefined) payload.permitted_cases = data.permittedCases;
    if (!payload.status) payload.status = 'active';
  }
  if (tableName === 'employees') {
    if (data.jobTitle !== undefined) payload.job_title = data.jobTitle;
    if (data.nationalId !== undefined) payload.national_id = data.nationalId;
    if (data.joinDate !== undefined) payload.join_date = data.joinDate;
    if (data.employeeCode !== undefined) payload.employee_code = data.employeeCode;
    if (data.activePortal !== undefined) payload.active_portal = data.activePortal;
    if (!payload.status) payload.status = 'active';
  }
  if (tableName === 'tasks') {
    if (data.dueDate !== undefined) {
      try { payload.due_date = data.dueDate ? new Date(data.dueDate).toISOString() : null; } catch { payload.due_date = null; }
    }
    if (data.employeeId !== undefined) payload.employee_id = data.employeeId;
    if (data.assignedTo !== undefined) payload.assigned_to = data.assignedTo;
    if (data.caseId !== undefined) payload.case_id = data.caseId;
    if (data.caseNumber !== undefined) payload.case_number = data.caseNumber;
  }
  if (tableName === 'hearings') {
    if (data.caseId !== undefined) payload.case_id = data.caseId;
    if (data.caseNumber !== undefined) payload.case_number = data.caseNumber;
    if (data.courtName !== undefined) payload.court_name = data.courtName;
    if (data.isNajizSync !== undefined) payload.is_najiz_sync = data.isNajizSync;
  }
  Object.keys(payload).forEach(key => { if (payload[key] === undefined) delete payload[key]; });
  return payload;
}
function saveToLocalStorage(tableName: string, data: any) {
  try {
    const key = `${tableName}_local`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = existing.findIndex((r: any) => r.id === data.id);
    if (idx >= 0) existing[idx] = { ...existing[idx], ...data };
    else existing.push(data);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 500)));
  } catch(e) {}
}

const mapCaseFromDB = (db: any) => ({
  id: db.id, caseNumber: db.case_number || '', caseName: db.title || db.client_name || `قضية ${db.case_number}`, title: db.title || '',
  clientName: db.client_name || '', clientId: db.client_id || null, opponentName: db.opponent_name || '', courtName: db.court_name || '',
  category: db.category || 'civil', stage: db.stage || 'litigation', status: db.status || 'new', priority: db.priority || 'medium',
  summary: db.summary || '', details: db.details || '', circuitNumber: db.circuit_number || '', poaNumber: db.power_of_attorney_number || '',
  nextSessionDate: db.next_session_at ? new Date(db.next_session_at).toLocaleDateString('ar-SA') : '', nextSessionAt: db.next_session_at || null,
  agreedFees: db.agreed_fees || 0, collectedFees: db.collected_fees || 0, isNajizSync: db.is_najiz_sync || false, isConfidential: db.is_confidential || false,
  archived: db.archived || false, createdAt: db.created_at || new Date().toISOString()
});
const mapClientFromDB = (db: any) => ({
  id: db.id, name: db.name || '', phone: db.phone || '', email: db.email || '', nationalId: db.national_id || db.id_number || '',
  address: db.address || '', isCompany: db.is_company || false, status: db.status || 'active', portalUsername: db.portal_username || '',
  portalPassword: db.portal_password || '', activePortal: db.active_portal || false, permittedCases: db.permitted_cases || [], createdAt: db.created_at || new Date().toISOString()
});
const mapEmployeeFromDB = (db: any) => ({
  id: db.id, name: db.name || '', role: db.role || '', jobTitle: db.job_title || db.role || '', email: db.email || '',
  phone: db.phone || '', status: db.status || 'active', salary: db.salary || 0, nationalId: db.national_id || '', username: db.username || '',
  password: db.password || '', employeeCode: db.employee_code || '', permissions: db.permissions || [], activePortal: db.active_portal || false,
  portalConfigured: db.portal_configured || false, createdAt: db.created_at || new Date().toISOString()
});
const mapTaskFromDB = (db: any) => ({
  id: db.id, title: db.title || '', description: db.description || '', status: db.status || 'todo',
  priority: db.priority || 'medium', dueDate: db.due_date || '', employeeId: db.employee_id || null, assignedTo: db.assigned_to || '',
  caseId: db.case_id || null, caseNumber: db.case_number || '', createdAt: db.created_at || new Date().toISOString()
});
const mapHearingFromDB = (db: any) => ({
  id: db.id, caseId: db.case_id || null, caseNumber: db.case_number || '', caseName: db.case_name || '',
  date: db.date || '', time: db.time || '09:00', courtName: db.court_name || '', hall: db.hall || '', status: db.status || 'upcoming',
  isNajizSync: db.is_najiz_sync || false, createdAt: db.created_at || new Date().toISOString()
});
const mapPOAFromDB = (db: any) => ({
  id: db.id, poaNumber: db.poa_number || '', type: db.type || 'general', status: db.status || 'active',
  issueDate: db.issue_date || '', expiryDate: db.expiry_date || '', principalName: db.principal_name || '', isNajizSync: db.is_najiz_sync || false, createdAt: db.created_at || new Date().toISOString()
});
const mapExecutionFromDB = (db: any) => ({
  id: db.id, executionNumber: db.execution_number || '', status: db.status || 'pending', amount: db.amount || 0,
  courtName: db.court_name || '', requesterName: db.requester_name || '', isNajizSync: db.is_najiz_sync || false, createdAt: db.created_at || new Date().toISOString()
});
const mapInvoiceFromDB = (db: any) => ({
  id: db.id, invoiceNumber: db.invoice_number || '', clientId: db.client_id || null, clientName: db.client_name || '',
  caseId: db.case_id || null, caseNumber: db.case_number || '', amount: db.amount || 0, totalAmount: db.total_amount || 0,
  status: db.status || 'pending', issueDate: db.issue_date || '', createdAt: db.created_at || new Date().toISOString()
});


export const mapDatabaseCaseToFrontend = (dbCase: any, clientsList: Client[]): Case => {
  const camel = toCamel(dbCase);
  
  // 1. caseName comes from title (fallback to case_name if title is missing)
  const caseName = camel.title || camel.caseName || 'قضية بدون اسم';
  
  // 2. client_id / clientId -> find clientName from clientsList
  let clientName = camel.clientName;
  if (camel.clientId) {
    const client = clientsList.find(c => c.id === camel.clientId);
    if (client) {
      clientName = client.name;
    }
  }
  
  // 3. sessionDates: last_session_at and next_session_at in DB
  // need to convert back to YYYY-MM-DD strings for lastSessionDate and nextSessionDate
  let lastSessionDate = camel.lastSessionDate || '';
  if (camel.lastSessionAt && typeof camel.lastSessionAt === 'string') {
    lastSessionDate = camel.lastSessionAt.includes('T') ? camel.lastSessionAt.split('T')[0] : camel.lastSessionAt;
  }
  let nextSessionDate = camel.nextSessionDate || '';
  if (camel.nextSessionAt && typeof camel.nextSessionAt === 'string') {
    nextSessionDate = camel.nextSessionAt.includes('T') ? camel.nextSessionAt.split('T')[0] : camel.nextSessionAt;
  }

  // 4. unpack metadata
  let unpackedMeta: Record<string, any> = {};
  if (camel.metadata) {
    try {
      unpackedMeta = typeof camel.metadata === 'string' ? JSON.parse(camel.metadata) : camel.metadata;
    } catch {
      unpackedMeta = {};
    }
  }

  // Unpack common keys from metadata to camel format
  const nextSessionTime = camel.nextSessionTime || unpackedMeta.next_session_time || unpackedMeta.nextSessionTime || '';
  const circuitNumber = camel.circuitNumber || unpackedMeta.circuit_number || unpackedMeta.circuitNumber || '';
  const powerOfAttorneyNumber = camel.powerOfAttorneyNumber || unpackedMeta.power_of_attorney_number || unpackedMeta.powerOfAttorneyNumber || '';
  const opponentNationalId = camel.opponentNationalId || unpackedMeta.opponent_national_id || unpackedMeta.opponentNationalId || '';
  const isConfidential = camel.isConfidential !== undefined ? camel.isConfidential : (unpackedMeta.is_confidential !== undefined ? unpackedMeta.is_confidential : unpackedMeta.isConfidential);
  const isNajizSync = camel.isNajizSync !== undefined ? camel.isNajizSync : (unpackedMeta.is_najiz_sync !== undefined ? unpackedMeta.is_najiz_sync : unpackedMeta.isNajizSync);

  return {
    ...camel,
    caseName,
    clientName: clientName || camel.clientName || 'عميل مجهول',
    lastSessionDate,
    nextSessionDate,
    nextSessionTime,
    circuitNumber,
    powerOfAttorneyNumber,
    opponentNationalId,
    isConfidential,
    isNajizSync,
  };
};

export function useSupabaseData() {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [powersOfAttorney, setPowersOfAttorney] = useState<PowerOfAttorney[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [clientPortal, setClientPortal] = useState<any[]>([]);
  const [employeePortal, setEmployeePortal] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  
  const getStateSetter = (tableName: string): any => {
    const tableMap: Record<string, Function> = {
      'cases': setCases,                
      'clients': setClients,
      'employees': setEmployees,
      'tasks': setTasks,
      'hearings': setHearings,
      'invoices': setInvoices,
      'powers_of_attorney': setPowersOfAttorney,
      'executions': setExecutions,
      'documents': setDocuments
    };
    return tableMap[tableName];
  };

  const sanitizePayload = (tableName: string, data: any): any => {
    const allowed = DB_COLUMNS[tableName] || [];
    const payload: any = {};
    
    // استخدم convertToSnakeCase المتاحة في نفس الملف
    const snakeData = convertToSnakeCase(tableName, data);
    
    Object.keys(snakeData).forEach(key => {
      if (allowed.includes(key)) {
        payload[key] = snakeData[key];
      }
    });                
    
    return payload;
  };
  
  const [loading, setLoading] = useState(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event) {
        event.preventDefault();
      }
      const errStr = String(event.reason || "").toLowerCase();
      if (!errStr.includes("websocket") && !errStr.includes("wss://")) {
        console.warn("[Supabase] Unhandled Promise Rejection Caught and Gracefully Handled:", event.reason);
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [
        casesRes, 
        clientsRes, 
        tasksRes, 
        hearingsRes, 
        docsRes, 
        poasRes, 
        invoicesRes, 
        employeesRes,
        executionsRes,
        auditRes,
        attachmentsRes,
        clientPortalRes,
        employeePortalRes,
        attendanceRes,
        leaveRequestsRes,
        paymentsRes,
        notificationsRes,
        systemErrorsRes,
        expensesRes,
        messagesRes,
        contractsRes
      ] = await Promise.all([
        supabase.from('cases').select('id, case_number, title, case_name, client_id, court_name, status, category, stage, last_session_at, last_session_date, next_session_at, next_session_date, opponent_name, priority, summary, details, attachments_count, created_at, assigned_lawyers, metadata, is_confidential, is_najiz_sync, lead_lawyer_id, judgment_summary, judgment_date, appeal_deadline, execution_status').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name, phone, email, type, is_company, national_id, id_number, address, notes, portal_token, portal_link, created_at').order('created_at', { ascending: false }),
        supabase.from('tasks').select('id, title, description, status, priority, assigned_to, due_date, case_number, timer_active, timer_duration, target_completion_time, created_at').order('created_at', { ascending: false }),
        supabase.from('hearings').select('id, case_number, case_name, date, time, court_name, status, judge_name, notes, hall_number, decision, created_at').order('date', { ascending: true }),
        supabase.from('documents').select('id, name, category, uploaded_at, size, content_text, tags, color_code, file_url, storage_path, created_at').order('uploaded_at', { ascending: false }),
        supabase.from('powers_of_attorney').select('id, raw_poa_number, case_number, issue_date, expiry_date, status, agent_name, created_at').order('issue_date', { ascending: false }),
        supabase.from('invoices').select('id, client_id, client_name, amount, vat_amount, total_amount, status, issue_date, due_date, payment_method, description, client_vat, is_zatca_submitted, zatca_timestamp, created_at').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, name, nationality, national_id, phone, job_title, manager, qualification, start_date, end_date, email, branch, notes, avatar_url, employee_code, role, department, salary, created_at, username, permissions').order('created_at', { ascending: false }),
        supabase.from('expenses').select('id, description, amount, category, date, case_number, created_at').order('created_at', { ascending: false }),
        supabase.from('messages').select('id, sender, sender_name, text, timestamp, case_number, created_at').order('created_at', { ascending: false }),
        supabase.from('contracts').select('id, description, amount, date, created_at').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('executions').select('id, execution_number, case_number, requester_name, opponent_name, status, amount, court_name, issue_date, last_update, details, created_at').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('audit_trails').select('id, user_id, user_name, action, entity_type, entity_id, details, metadata, created_at').order('created_at', { ascending: false }).limit(10).then(r => r, () => ({ data: [] } as any)),
        supabase.from('attachments').select('id, record_id, record_type, file_name, file_url, file_size, storage_path, created_at').order('file_name', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('client_portal').select('id, client_id, last_login, created_at').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('employee_portal').select('id, employee_id, last_login, created_at').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('attendance').select('id, employee_id, date, status, check_in, check_out, created_at').order('date', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('leave_requests').select('id, employee_id, type, start_date, end_date, status, reason, created_at').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('payments').select('id, client_id, amount, date, status, payment_method, created_at').order('payment_date', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('notifications').select('id, user_id, title, message, type, is_read, metadata, created_at').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('system_errors').select('id, error_code, component, details, created_at').order('created_at', { ascending: false }).limit(100).then(r => r, () => ({ data: [] } as any)),
      ]);

      let mappedClients: Client[] = [];
      if (clientsRes.data) {
        mappedClients = toCamel(clientsRes.data) as Client[];
        setClients(mappedClients);
      }
      if (casesRes.data) {
        const mappedCases = (casesRes.data || []).map((c: any) => mapDatabaseCaseToFrontend(c, mappedClients));
        setCases(mappedCases);
      }
      if (tasksRes.data) setTasks(toCamel(tasksRes.data) as Task[]);
      if (hearingsRes.data) setHearings(toCamel(hearingsRes.data) as Hearing[]);
      if (docsRes.data) setDocuments(toCamel(docsRes.data) as Document[]);
      if (poasRes.data) setPowersOfAttorney(toCamel(poasRes.data) as PowerOfAttorney[]);
      if (invoicesRes.data) setInvoices(toCamel(invoicesRes.data) as Invoice[]);
      if (employeesRes.data) setEmployees(toCamel(employeesRes.data) as Employee[]);
      if (executionsRes && 'data' in executionsRes && executionsRes.data) setExecutions(toCamel(executionsRes.data) as Execution[]);
      if (auditRes.data && 'data' in auditRes) setAuditTrails(toCamel(auditRes.data) as AuditTrail[]);
      if (attachmentsRes && 'data' in attachmentsRes && attachmentsRes.data) setAttachments(toCamel(attachmentsRes.data));
      if (clientPortalRes && 'data' in clientPortalRes && clientPortalRes.data) setClientPortal(toCamel(clientPortalRes.data));
      if (employeePortalRes && 'data' in employeePortalRes && employeePortalRes.data) setEmployeePortal(toCamel(employeePortalRes.data));
      if (attendanceRes && 'data' in attendanceRes && attendanceRes.data) setAttendance(toCamel(attendanceRes.data));
      if (leaveRequestsRes && 'data' in leaveRequestsRes && leaveRequestsRes.data) setLeaveRequests(toCamel(leaveRequestsRes.data));
      if (paymentsRes && 'data' in paymentsRes && paymentsRes.data) setPayments(toCamel(paymentsRes.data));
      if (notificationsRes && 'data' in notificationsRes && notificationsRes.data) setNotifications(toCamel(notificationsRes.data));
      if (systemErrorsRes && 'data' in systemErrorsRes && systemErrorsRes.data) setSystemErrors(toCamel(systemErrorsRes.data));
      if (expensesRes && 'data' in expensesRes && expensesRes.data) setExpenses(toCamel(expensesRes.data));
      if (messagesRes && 'data' in messagesRes && messagesRes.data) setMessages(toCamel(messagesRes.data));
      if (contractsRes && 'data' in contractsRes && contractsRes.data) setContracts(toCamel(contractsRes.data));

    } catch (error) {
      console.error('Error fetching Supabase data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setupRealtime = useCallback(() => {
    // Add protection to skip if default key or missing
    if (!isSupabaseConfigured) {
      console.warn('[Realtime] Supabase not properly configured. Skipping Realtime to avoid errors.');
      return () => {};
    }

    try {
      let singleChannel = supabase.channel('public_all_tables');

      const handleStatus = (table: string) => (status: string, err?: Error) => {
        if (status === 'SUBSCRIBED') {
           console.log(`[Supabase Realtime] Subscribed to ${table}`);
        } else if (status === 'CHANNEL_ERROR') {
           console.warn(`[Supabase Realtime] Subscribe error for ${table}`);
           try {
             supabase.removeChannel(singleChannel);
           } catch (e) {}
        } else if (status === 'TIMED_OUT') {
           console.log(`[Supabase Realtime] Timed out on ${table}`);
           try {
             supabase.removeChannel(singleChannel);
           } catch (e) {}
        }
      };

      const triggers = ['cases', 'clients', 'tasks', 'hearings', 'documents', 'powers_of_attorney', 'invoices', 'employees', 'attachments', 'client_portal', 'employee_portal', 'attendance', 'leave_requests', 'payments', 'notifications', 'audit_trails', 'system_errors', 'expenses', 'messages', 'contracts', 'executions'];
      
      triggers.forEach(tbl => {
        singleChannel = singleChannel.on('postgres_changes', { event: '*', schema: 'public', table: tbl }, fetchData);
      });

      singleChannel.subscribe(handleStatus('all_tables'));

      return () => {
        try {
          supabase.removeChannel(singleChannel);
        } catch (e) {}
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      };
    } catch (err: any) {
      console.warn('[Realtime] Failed to setup:', err.message);
      return () => {};
    }
  }, [fetchData]);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [casesRes, clientsRes, employeesRes, tasksRes, hearingsRes, poaRes, executionsRes, invoicesRes] = await Promise.all([
          supabase.from('cases').select('*').eq('archived', false).order('created_at', { ascending: false }),
          supabase.from('clients').select('*').order('name'),
          supabase.from('employees').select('*').order('name'),
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('hearings').select('*').order('date'),
          supabase.from('powers_of_attorney').select('*').order('created_at', { ascending: false }),
          supabase.from('executions').select('*').order('created_at', { ascending: false }),
          supabase.from('invoices').select('*').order('created_at', { ascending: false })
        ]);
        
        if (casesRes.data) setCases(casesRes.data.map(mapCaseFromDB));
        if (clientsRes.data) setClients(toCamel(clientsRes.data) as Client[]);
        if (employeesRes.data) setEmployees(toCamel(employeesRes.data) as Employee[]);
        if (tasksRes.data) setTasks(toCamel(tasksRes.data) as Task[]);
        if (hearingsRes.data) setHearings(toCamel(hearingsRes.data) as Hearing[]);
        if (poaRes.data) setPowersOfAttorney(toCamel(poaRes.data) as PowerOfAttorney[]);
        if (executionsRes.data) setExecutions(toCamel(executionsRes.data) as Execution[]);
        if (invoicesRes.data) setInvoices(toCamel(invoicesRes.data) as Invoice[]);
        
      } catch(err: any) {
        console.error('[Init Error]', err.message);
      } finally { setLoading(false); }
    };
    initData();
  }, []);

  const syncFailedLogs = useCallback(async () => {
    const logs = JSON.parse(localStorage.getItem('failed_persistence_logs') || '[]');
    if (!logs.length) return { processed: 0, failed: 0 };

    const remainingLogs = [];
    let processed = 0;
    let anySuccess = false;

    for (const log of logs) {
      try {
        const { table, type, action, data } = log;
        
        // Drop diagnostic connectivity logs
        if (type === 'init_test' || table === 'init_test') {
          // Do not push to remainingLogs so they get deleted
          continue;
        }
        
        const targetTable = table || type;
        const mappedTable = getSupabaseTableName(targetTable);

        // تجاهل أي سجل يحتوي على ID تالف (غير UUID)
        if (data?.id && typeof data.id === 'string' && 
            !data.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.warn(`[Background Sync] Skipping record with invalid UUID: ${data.id}`);
          // لا تضفه لـ remainingLogs — تجاهله نهائياً
          continue;
        }

        // ✅ الإصلاح الجوهري: نقّ البيانات قبل الإرسال
        const cleanPayload = sanitizePayload(mappedTable, data);

        let errorObj = null;
        if (data?.id) {
          // عملية UPDATE: احذف id و created_at من الـ payload
          const { id, created_at, ...updatePayload } = cleanPayload;
          const { error } = await supabase
            .from(mappedTable)
            .update(updatePayload)
            .eq('id', data.id);
          if (error) errorObj = error;
        } else {
          // عملية INSERT
          const { error } = await supabase
            .from(mappedTable)
            .insert([cleanPayload]);
          if (error) errorObj = error;
        }

        if (errorObj) {
          // If error is 22P02 (invalid uuid) or 400 (bad request), do NOT retry
          if (errorObj.code === '22P02' || errorObj.code === 'PGRST204' || (errorObj.status && errorObj.status >= 400 && errorObj.status < 500)) {
            console.error(`[Background Sync Discarding Invalid Payload] table: ${mappedTable}`, errorObj);
            // Do not push to remainingLogs, effectively dropping this invalid record
          } else {
            console.error(`[Background Sync Error - Retrying] table: ${mappedTable}`, errorObj);
            remainingLogs.push(log);
          }
        } else {
          console.log(`[Background Sync] ✅ successfully processed ${mappedTable}`);
          anySuccess = true;
          processed++;
        }
      } catch (e) {
        console.error(`[Background Sync Exception]`, e);
        remainingLogs.push(log);
      }
    }

    if (remainingLogs.length !== logs.length) {
      localStorage.setItem('failed_persistence_logs', JSON.stringify(remainingLogs));
      if (anySuccess) fetchData();
    }

    return { processed, failed: remainingLogs.length };
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(syncFailedLogs, 30000);
    return () => clearInterval(interval);
  }, [syncFailedLogs]);

  const handleOfflineFallback = (table: string, action: 'CREATE' | 'UPDATE', data: any, errorMsg?: string) => {
    try {
      const failedLogs = JSON.parse(localStorage.getItem('failed_persistence_logs') || '[]');
      failedLogs.push({
        timestamp: new Date().toISOString(),
        table,
        action,
        data,
        error: { message: errorMsg || 'Lost connection or network error' }
      });
      localStorage.setItem('failed_persistence_logs', JSON.stringify(failedLogs));
    } catch(e) {
      console.error("Failed to append to failed_persistence_logs offline queue", e);
    }
  };

  const getSupabaseTableName = (table: string): string => {
    const tableMap: Record<string, string> = {
      'cases': 'cases',
      'clients': 'clients',
      'tasks': 'tasks',
      'hearings': 'hearings',
      'documents': 'documents',
      'powersOfAttorney': 'powers_of_attorney',
      'powers_of_attorney': 'powers_of_attorney',
      'invoices': 'invoices',
      'employees': 'employees',
      'attachments': 'attachments',
      'clientPortal': 'client_portal',
      'client_portal': 'client_portal',
      'employeePortal': 'employee_portal',
      'employee_portal': 'employee_portal',
      'attendance': 'attendance',
      'leaveRequests': 'leave_requests',
      'leave_requests': 'leave_requests',
      'payments': 'payments',
      'vouchers': 'payments',
      'notifications': 'notifications',
      'auditTrails': 'audit_trails',
      'audit_trails': 'audit_trails',
      'systemErrors': 'system_errors',
      'system_errors': 'system_errors',
      'executions': 'executions',
      'archive_items': 'archive_items',
    };
    return tableMap[table] || table;
  };

  const onUpdateState = useCallback(async (section: string, newData: any) => {
    const updateLocalState = (prev: any[]) => {
      const idx = prev.findIndex(item => item.id === newData.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...newData };
        return updated;
      }
      return [newData, ...prev];
    };
    switch(section) {
      case 'cases': setCases(updateLocalState); break;
      case 'clients': setClients(updateLocalState); break;
      case 'employees': setEmployees(updateLocalState); break;
      case 'tasks': setTasks(updateLocalState); break;
      case 'hearings': setHearings(updateLocalState); break;
      case 'invoices': setInvoices(updateLocalState); break;
      case 'powers_of_attorney': setPowersOfAttorney(updateLocalState); break;
      case 'executions': setExecutions(updateLocalState); break;
      case 'documents': setDocuments(updateLocalState); break;
      default: break;
    }
    const tableMap: Record<string, string> = { cases: 'cases', clients: 'clients', employees: 'employees', tasks: 'tasks', hearings: 'hearings', invoices: 'invoices', powers_of_attorney: 'powers_of_attorney', executions: 'executions', documents: 'documents' };
    const tableName = tableMap[section];
    if (tableName && newData?.id) {
      const result = await saveToSupabase(tableName, newData);
      if (!result.success) {
        console.warn(`[State] حفظ محلي فقط: ${tableName}`, result.error);
      }
    }
  }, []);

  // ======================================================
  // LOCAL PERSISTENCE HELPERS
  // ======================================================
  const saveLocalBackup = (tableName: string, data: any) => {
    try {
      const key = `${tableName}_backup`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = existing.findIndex((r: any) => r.id === data.id);
      if (idx >= 0) existing[idx] = { ...existing[idx], ...data };
      else existing.push(data);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch(e) {}
  };

  const updateLocalBackup = (tableName: string, id: string, data: any) => {
    try {
      const key = `${tableName}_backup`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = existing.findIndex((r: any) => r.id === id);
      if (idx >= 0) existing[idx] = { ...existing[idx], ...data };
      localStorage.setItem(key, JSON.stringify(existing));
    } catch(e) {}
  };
    
  const upsertRecord = useCallback(async (table: string, data: any, onConflict: string) => {
    try {
      const mappedTable = getSupabaseTableName(table);
      const cleanData = sanitizePayload(mappedTable, data);
      
      console.log(`[Supabase] Upserting into ${mappedTable} on conflict ${onConflict}:`, cleanData);
      
      const { data: upsertedData, error } = await supabase
        .from(mappedTable)
        .upsert(cleanData, { onConflict })
        .select()
        .single();
        
      if (error) {
        console.error(`[Supabase Upsert Error] Table: ${mappedTable}`, error);
        return { success: false, code: error.code, message: error.message };
      }
      
      await fetchData();
      return { success: true, data: upsertedData ? toCamel(upsertedData) : null };
    } catch (err: any) {
      console.error(`[Supabase Upsert Exception] Table: ${table}`, err);
      return { success: false, message: err.message };
    }
  }, [fetchData]);

  const createRecord = useCallback(async (table: string, data: any) => {
    try {
      const mappedTable = getSupabaseTableName(table);
      const cleanData = sanitizePayload(mappedTable, data);
      
      // Ensure ID and timestamps
      const payload = { ...cleanData };
      if (!payload.id) payload.id = crypto.randomUUID();
      if (!payload.created_at) payload.created_at = new Date().toISOString();
      payload.updated_at = new Date().toISOString();

      console.log(`[Supabase] Creating ${mappedTable}:`, payload);

      const { data: result, error } = await supabase
        .from(mappedTable)
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error(`[createRecord] Error in ${mappedTable}:`, error.message);
        saveLocalBackup(mappedTable, payload);
        return { success: false, error: error.message, data: payload };
      }

      saveLocalBackup(mappedTable, result || payload);
      
      // Update State
      const camelData = toCamel(result || payload);
      const setter = getStateSetter(table);
      if (setter) {
        setter((prev: any[]) => [camelData, ...(prev || [])]);
      }
      
      return { success: true, data: camelData };
    } catch (err: any) {
      console.error(`[Supabase Outer Create Exception] Table: ${table}`, err);
      return { success: false, message: err.message };
    }
  }, [clients]);

  const updateRecord = useCallback(async (table: string, id: string | number, data: any) => {
    try {
      const mappedTable = getSupabaseTableName(table);
      const cleanData = sanitizePayload(mappedTable, data);
      const updatePayload = {
        ...cleanData,
        updated_at: new Date().toISOString()
      };
      // remove id and created_at from update
      delete updatePayload.id;
      delete updatePayload.created_at;

      console.log(`[Supabase] Updating ${mappedTable} id=${id}:`, updatePayload);
      
      const { data: result, error } = await supabase
        .from(mappedTable)
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error(`[updateRecord] Error in ${mappedTable}:`, error.message);
        updateLocalBackup(mappedTable, String(id), { ...cleanData, id });
        return { success: false, error: error.message };
      }

      updateLocalBackup(mappedTable, String(id), result || { ...cleanData, id });
      
      // Update State
      const camelData = toCamel(result || { ...cleanData, id });
      const setter = getStateSetter(table);
      if (setter) {
        setter((prev: any[]) => (prev || []).map(r => r.id === id ? { ...r, ...camelData } : r));
      }
      
      return { success: true, data: camelData };
    } catch (err: any) {
      console.error(`[Supabase Outer Update Exception] Table: ${table}, id=${id}`, err);
      return { success: false, message: err.message };
    }
  }, [clients]);

  const deleteRecord = async (table: string, id: string | number) => {
    try {
      const mappedTable = getSupabaseTableName(table);
      console.log(`[Supabase] Deleting ${mappedTable} id=${id}`);
      const { error } = await supabase.from(mappedTable).delete().eq('id', id);
      if (error) {
        console.error(`[Supabase Delete Error] Table: ${mappedTable}, id=${id}`, error);
        return { success: false, errorType: 'database', message: error.message, error };
      }
      
      const setter = getStateSetter(table);
      if (setter) {
        setter((prev: any[]) => (prev || []).filter(c => c.id !== id));
      }
      
      return { success: true };
    } catch (err: any) {
      console.error(`[Supabase Delete Exception] Table: ${table}, id=${id}`, err);
      return { success: false, errorType: 'exception', message: err?.message };
    }
  };

  const retryQueueSync = async () => {
     return await syncFailedLogs();
  };

  return {
    cases,
    clients,
    tasks,
    hearings,
    documents,
    powersOfAttorney,
    invoices,
    employees,
    executions,
    expenses,
    messages,
    contracts,
    auditTrails,
    attachments,
    clientPortal,
    employeePortal,
    attendance,
    leaveRequests,
    payments,
    notifications,
    systemErrors,
    loading,
    createRecord,
    upsertRecord,
    updateRecord,
    deleteRecord,
    retryQueueSync,
    refresh: fetchData,
    onUpdateState,
    setHearings,
    setDocuments,
    setInvoices,
    setEmployees,
    setCases,
    setPowersOfAttorney,
    setExecutions,
    setClients,
    setTasks
  };
}
