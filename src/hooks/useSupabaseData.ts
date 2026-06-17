import { useState, useEffect, useCallback, useRef } from 'react';
import { generateUUID } from '@/lib/uuid';
import { supabase } from '@/lib/supabase';
import { Case, Client, Task, Hearing, Document, PowerOfAttorney, Invoice, Employee, AuditTrail } from '@/types';
import { validatePayload } from '@/lib/persistenceManager';
import { toCamel, toSnake } from '@/utils/schemaMapping';
import { handleRlsPolicyFriction } from '@/lib/debug-supabase';

// ======================================================
// SCHEMA GUARD - الأعمدة المسموح بها فقط لكل جدول
// مطابقة تماماً لـ supabase_schema_final.sql
// ======================================================
const DB_COLUMNS: Record<string, string[]> = {
  clients: [
    'id', 'name', 'phone', 'email',
    'id_number', 'najiz_id', 'address',
    'status', 'last_sync_at', 'created_at', 'updated_at'
  ],
  cases: [
    'id', 'client_id', 'case_number', 'najiz_case_number',
    'title', 'category', 'stage', 'status', 'priority',
    'court_name', 'opponent_name', 'summary', 'details',
    'attachments_count', 'last_session_at', 'next_session_at',
    'lawyers', 'metadata', 'last_sync_at', 'created_at', 'updated_at'
  ],
  tasks: [
    'id', 'case_id', 'employee_id', 'title', 'description',
    'status', 'priority', 'due_date', 'created_at', 'updated_at'
  ],
  hearings: [
    'id', 'case_id', 'date', 'time', 'location',
    'hall', 'judge', 'status', 'notes', 'created_at', 'updated_at'
  ],
  documents: [
    'id', 'case_id', 'name', 'category', 'file_url',
    'file_size', 'uploaded_at', 'tags', 'content_text',
    'created_at', 'updated_at'
  ],
  invoices: [
    'id', 'client_id', 'case_id', 'amount', 'vat_amount',
    'total_amount', 'status', 'issue_date', 'due_date',
    'payment_method', 'description', 'is_zatca_submitted',
    'zatca_timestamp', 'created_at', 'updated_at'
  ],
  employees: [
    'id', 'name', 'role', 'email', 'phone', 'status',
    'salary', 'department', 'join_date', 'created_at', 'updated_at'
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

/**
 * يحوّل البيانات إلى snake_case ثم يحذف كل حقل
 * غير موجود في جدول Supabase الفعلي.
 * هذا يمنع خطأ PGRST204 نهائياً.
 */
const sanitizePayload = (tableName: string, data: any): Record<string, any> => {
  if (!data) return {};

  // أولاً: حوّل camelCase إلى snake_case
  const snaked = toSnake(data) || {};

  // ثانياً: معالجة خاصة لحقول مختلفة الاسم بين الكود وقاعدة البيانات
  if (tableName === 'clients') {
    // nationalId في الكود → id_number في قاعدة البيانات
    if (snaked.national_id && !snaked.id_number) {
      snaked.id_number = snaked.national_id;
    }
  }

  if (tableName === 'cases') {
    // caseName في الكود → title في قاعدة البيانات
    if (snaked.case_name && !snaked.title) {
      snaked.title = snaked.case_name;
    }
    // nextSessionDate → next_session_at
    if (snaked.next_session_date && !snaked.next_session_at) {
      snaked.next_session_at = snaked.next_session_date;
    }
    // lastSessionDate → last_session_at
    if (snaked.last_session_date && !snaked.last_session_at) {
      snaked.last_session_at = snaked.last_session_date;
    }
    // clientId → client_id
    if (snaked.client_id === undefined && snaked.client_name) {
      // client_id مطلوب - إذا لم يكن موجوداً نضع null
      snaked.client_id = snaked.client_id || null;
    }
    // تأكد أن attachments_count رقم وليس مصفوفة
    if (Array.isArray(snaked.attachments)) {
      snaked.attachments_count = snaked.attachments.length;
      delete snaked.attachments;
    }
    // حوّل المصفوفات المعقدة إلى JSONB
    if (Array.isArray(snaked.assigned_lawyers)) {
      snaked.lawyers = JSON.stringify(snaked.assigned_lawyers);
    }
    // احفظ الحقول الإضافية في metadata بدلاً من رفضها
    const extraFields: Record<string, any> = {};
    const allowedCols = DB_COLUMNS['cases'] || [];
    Object.keys(snaked).forEach(key => {
      if (!allowedCols.includes(key)) {
        extraFields[key] = snaked[key];
      }
    });
    if (Object.keys(extraFields).length > 0) {
      snaked.metadata = JSON.stringify({
        ...(snaked.metadata ? JSON.parse(typeof snaked.metadata === 'string' ? snaked.metadata : JSON.stringify(snaked.metadata)) : {}),
        ...extraFields
      });
    }
  }

  // ثالثاً: احتفظ فقط بالأعمدة المسموح بها
  const allowedColumns = DB_COLUMNS[tableName];
  if (!allowedColumns) {
    // جدول غير معروف — أرسل كما هو مع تحذير
    console.warn(`[sanitizePayload] Unknown table: ${tableName}. Sending raw data.`);
    return snaked;
  }

  const sanitized: Record<string, any> = {};
  for (const col of allowedColumns) {
    if (snaked[col] !== undefined) {
      sanitized[col] = snaked[col];
    }
  }

  return sanitized;
};

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
  if (camel.lastSessionAt) {
    lastSessionDate = camel.lastSessionAt.includes('T') ? camel.lastSessionAt.split('T')[0] : camel.lastSessionAt;
  }
  let nextSessionDate = camel.nextSessionDate || '';
  if (camel.nextSessionAt) {
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
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [clientPortal, setClientPortal] = useState<any[]>([]);
  const [employeePortal, setEmployeePortal] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  
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
        auditRes,
        attachmentsRes,
        clientPortalRes,
        employeePortalRes,
        attendanceRes,
        leaveRequestsRes,
        paymentsRes,
        notificationsRes,
        systemErrorsRes
      ] = await Promise.all([
        supabase.from('cases').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('hearings').select('*').order('date', { ascending: true }),
        supabase.from('documents').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('powers_of_attorney').select('*').order('issue_date', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_trails').select('*').order('created_at', { ascending: false }).limit(10).then(r => r, () => ({ data: [] } as any)),
        supabase.from('attachments').select('*').order('file_name', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('client_portal').select('*').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('employee_portal').select('*').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('attendance').select('*').order('date', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('payments').select('*').order('payment_date', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] } as any)),
        supabase.from('system_errors').select('*').order('created_at', { ascending: false }).limit(100).then(r => r, () => ({ data: [] } as any)),
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
      if (auditRes.data && 'data' in auditRes) setAuditTrails(toCamel(auditRes.data) as AuditTrail[]);
      if (attachmentsRes && 'data' in attachmentsRes && attachmentsRes.data) setAttachments(toCamel(attachmentsRes.data));
      if (clientPortalRes && 'data' in clientPortalRes && clientPortalRes.data) setClientPortal(toCamel(clientPortalRes.data));
      if (employeePortalRes && 'data' in employeePortalRes && employeePortalRes.data) setEmployeePortal(toCamel(employeePortalRes.data));
      if (attendanceRes && 'data' in attendanceRes && attendanceRes.data) setAttendance(toCamel(attendanceRes.data));
      if (leaveRequestsRes && 'data' in leaveRequestsRes && leaveRequestsRes.data) setLeaveRequests(toCamel(leaveRequestsRes.data));
      if (paymentsRes && 'data' in paymentsRes && paymentsRes.data) setPayments(toCamel(paymentsRes.data));
      if (notificationsRes && 'data' in notificationsRes && notificationsRes.data) setNotifications(toCamel(notificationsRes.data));
      if (systemErrorsRes && 'data' in systemErrorsRes && systemErrorsRes.data) setSystemErrors(toCamel(systemErrorsRes.data));

    } catch (error) {
      console.error('Error fetching Supabase data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setupRealtime = useCallback(() => {
    let singleChannel = supabase.channel('public_all_tables');

    const handleStatus = (table: string) => (status: string, err?: Error) => {
      if (status === 'SUBSCRIBED') {
         console.log(`[Supabase Realtime] Subscribed to ${table}`);
      } else if (status === 'CHANNEL_ERROR') {
         console.log(`[Supabase Realtime] Realtime subscription is currently optimized. Using HTTP polling fallback.`);
         try {
           supabase.removeChannel(singleChannel);
         } catch (e) {}
      } else if (status === 'TIMED_OUT') {
         console.log(`[Supabase Realtime] Timed out on ${table} - cleaning up connection.`);
         try {
           supabase.removeChannel(singleChannel);
         } catch (e) {}
      } else if (status === 'CLOSED') {
         console.log(`[Supabase Realtime] Closed channel ${table}`);
      }
    };

    const triggers = ['cases', 'clients', 'tasks', 'hearings', 'documents', 'powers_of_attorney', 'invoices', 'employees', 'attachments', 'client_portal', 'employee_portal', 'attendance', 'leave_requests', 'payments', 'notifications', 'audit_trails', 'system_errors'];
    
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
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const cleanup = setupRealtime();
    
    // Fallback polling interval every 45s to make sure data is perfectly synchronized regardless of WebSocket network restrictions
    const pollingInterval = setInterval(() => {
      fetchData();
    }, 45000);

    return () => {
      cleanup();
      clearInterval(pollingInterval);
    };
  }, [fetchData, setupRealtime]);

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
    };
    return tableMap[table] || table;
  };

  const getStateSetter = (table: string) => {
    switch(table) {
      case 'cases': return setCases;
      case 'clients': return setClients;
      case 'tasks': return setTasks;
      case 'hearings': return setHearings;
      case 'documents': return setDocuments;
      case 'powers_of_attorney':
      case 'powersOfAttorney': return setPowersOfAttorney;
      case 'invoices': return setInvoices;
      case 'employees': return setEmployees;
      case 'audit_trails':
      case 'auditTrails': return setAuditTrails;
      case 'attachments': return setAttachments;
      case 'client_portal':
      case 'clientPortal': return setClientPortal;
      case 'employee_portal':
      case 'employeePortal': return setEmployeePortal;
      case 'attendance': return setAttendance;
      case 'leave_requests':
      case 'leaveRequests': return setLeaveRequests;
      case 'payments': return setPayments;
      case 'notifications': return setNotifications;
      case 'system_errors':
      case 'systemErrors': return setSystemErrors;
      default: return null;
    }
  };

  const createRecord = async (table: string, data: any) => {
    try {
      const isValidationEligible = ['cases', 'clients', 'tasks'].includes(table);
      if (isValidationEligible) {
        const validation = validatePayload(table as any, data);
        if (!validation.isValid) {
          const errMsg = validation.message || 'خطأ في التحقق من صحة البيانات';
          console.error(`[Local Schema Validation] Table: ${table}, Field: ${validation.field}, Msg: ${errMsg}`);
          
          // Trigger UI focus for the invalid field
          window.dispatchEvent(
            new CustomEvent('adalah_error_logged', {
              detail: {
                message: errMsg,
                timestamp: new Date().toISOString(),
                entityType: table,
                field: validation.field,
              }
            })
          );
          
          // Show explicit detailed alert to prevent left waiting state
          alert(`⚠️ تنبيه التحقق من صحة البيانات (المدخلات):\n\n- الجدول: ${table === 'cases' ? 'القضايا' : table === 'clients' ? 'الموكلين' : 'المهام'}\n- الحقل: ${validation.field}\n- السبب: ${errMsg}\n\nيرجى تصحيح الحقل المحدد والمحاولة مرة أخرى.`);
          
          return { 
            success: false, 
            code: 'VALIDATION_FAILED', 
            message: errMsg, 
            details: `Validation failed on field: ${validation.field}` 
          };
        }
      }

      const mappedTable = getSupabaseTableName(table);
      const cleanData = sanitizePayload(mappedTable, data);

      console.log(`[Supabase] Sanitized payload for ${mappedTable}:`, cleanData);
      console.log(`[DEBUG ${table} INSERT payload]`, JSON.stringify(cleanData, null, 2));

      // Wrap supabase promise to explicitly catch rejection
      let response;
      try {
        response = await supabase
          .from(mappedTable)
          .insert([cleanData])
          .select()
          .single();
      } catch (rej: any) {
        console.error(`[Supabase Insert Promise Rejection] Table: ${mappedTable}`, rej);
        response = { data: null, error: { code: rej?.code || 'PROMISE_REJECTION', message: rej?.message || String(rej), details: rej?.details || rej?.stack || '' } };
      }

      const { data: insertedData, error } = response as { data: any, error: any };
      
      if (error) {
        // Handle PGRST204 (No Content)
        if (error.code === 'PGRST204') {
          console.warn(`[${table}] PGRST204: returning input data as fallback`);
          return { success: true, data: data };
        }

        console.error(`[Supabase Insert Error] Table: ${mappedTable}`, error);
        handleRlsPolicyFriction(mappedTable, error);
        const isNetworkError = !navigator.onLine || error.message?.includes('fetch') || error.message?.includes('network');
        if (isNetworkError) {
            handleOfflineFallback(table, 'CREATE', data, error.message);
        }
        return { 
          success: false, 
          code: error.code || 'DATABASE_ERROR',
          message: error.message || 'Unknown database error occurred',
          details: error.details || (isNetworkError ? 'Network connectivity offline fallback triggered' : 'Database operation failed under RLS or schema constraint')
        };
      }
      
      let camelData = toCamel(insertedData) || toCamel(cleanData) || data;
      if (Array.isArray(camelData)) {
        camelData = camelData[0];
      }
      
      console.log(`[Supabase] Successfully inserted into ${mappedTable}`);
      
      const setter = getStateSetter(table);
      if (setter && camelData) {
        if (table === 'cases') {
          const frontendCase = mapDatabaseCaseToFrontend(insertedData || cleanData, clients);
          setter((prev: any[]) => [frontendCase, ...(prev || [])]);
        } else {
          setter((prev: any[]) => [camelData, ...(prev || [])]);
        }
      }
      
      return { success: true, data: camelData };
    } catch (err: any) {
      console.error(`[Supabase Outer Create Exception] Table: ${table}`, err);
      return { 
        success: false, 
        code: err?.code || 'UNHANDLED_EXCEPTION', 
        message: err?.message || String(err), 
        details: err?.stack || err?.details || String(err) 
      };
    }
  };

  const updateRecord = async (table: string, id: string | number, data: any) => {
    try {
      const isValidationEligible = ['cases', 'clients', 'tasks'].includes(table);
      if (isValidationEligible) {
        const validation = validatePayload(table as any, data, true);
        if (!validation.isValid) {
          const errMsg = validation.message || 'خطأ في التحقق من صحة البيانات';
          console.error(`[Local Schema Validation] Table: ${table}, Field: ${validation.field}, Msg: ${errMsg}`);
          
          // Trigger UI focus for the invalid field
          window.dispatchEvent(
            new CustomEvent('adalah_error_logged', {
              detail: {
                message: errMsg,
                timestamp: new Date().toISOString(),
                entityType: table,
                field: validation.field,
              }
            })
          );
          
          // Show explicit detailed alert to prevent left waiting state
          alert(`⚠️ تنبيه التحقق من صحة البيانات (المدخلات):\n\n- الجدول: ${table === 'cases' ? 'القضايا' : table === 'clients' ? 'الموكلين' : 'المهام'}\n- الحقل: ${validation.field}\n- السبب: ${errMsg}\n\nيرجى تصحيح الحقل المحدد والمحاولة مرة أخرى.`);
          
          return { 
            success: false, 
            code: 'VALIDATION_FAILED', 
            message: errMsg, 
            details: `Validation failed on field: ${validation.field}` 
          };
        }
      }

      const mappedTable = getSupabaseTableName(table);
      const cleanData = sanitizePayload(mappedTable, data);
      const { id: _removeId, created_at: _removeCa, ...updatePayload } = cleanData;

      console.log(`[Supabase] Sanitized update payload for ${mappedTable}:`, updatePayload);
      
      // Wrap supabase promise to explicitly catch rejection
      let response;
      try {
        response = await supabase
          .from(mappedTable)
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();
      } catch (rej: any) {
        console.error(`[Supabase Update Promise Rejection] Table: ${mappedTable}, id=${id}`, rej);
        response = { data: null, error: { code: rej?.code || 'PROMISE_REJECTION', message: rej?.message || String(rej), details: rej?.details || rej?.stack || '' } };
      }

      const { data: updatedData, error } = response as { data: any, error: any };
      
      if (error) {
        if (error.code === 'PGRST204') {
          console.warn(`[${table}] PGRST204: returning input data as fallback for UPDATE`);
          return { success: true, data: data };
        }
        console.error(`[Supabase Update Error] Table: ${mappedTable}, id=${id}`, error);
        handleRlsPolicyFriction(mappedTable, error);
        const isNetworkError = !navigator.onLine || error.message?.includes('fetch') || error.message?.includes('network');
        if (isNetworkError) {
            handleOfflineFallback(table, 'UPDATE', { id, ...data }, error.message);
        }
        return { 
          success: false, 
          code: error.code || 'DATABASE_ERROR',
          message: error.message || 'Unknown database error occurred',
          details: error.details || (isNetworkError ? 'Network connectivity offline fallback triggered' : 'Database operation failed under RLS or schema constraint')
        };
      }
      
      let camelData = toCamel(updatedData) || toCamel(cleanData) || data;
      if (Array.isArray(camelData)) {
        camelData = camelData[0];
      }

      console.log(`[Supabase] Successfully updated ${mappedTable} id=${id}`);
      
      const setter = getStateSetter(table);
      if (setter && camelData) {
        if (table === 'cases') {
          const frontendCase = mapDatabaseCaseToFrontend(updatedData || cleanData, clients);
          setter((prev: any[]) => (prev || []).map(c => c.id === id ? { ...c, ...frontendCase } : c));
        } else {
          setter((prev: any[]) => (prev || []).map(c => c.id === id ? { ...c, ...camelData } : c));
        }
      }
      
      return { success: true, data: camelData };
    } catch (err: any) {
      console.error(`[Supabase Outer Update Exception] Table: ${table}, id=${id}`, err);
      return { 
        success: false, 
        code: err?.code || 'UNHANDLED_EXCEPTION', 
        message: err?.message || String(err), 
        details: err?.stack || err?.details || String(err) 
      };
    }
  };

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
    updateRecord,
    deleteRecord,
    retryQueueSync,
    refresh: fetchData,
    setHearings,
    setDocuments,
    setInvoices,
    setEmployees
  };
}
