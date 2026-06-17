import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Case, Client, Task, Hearing, Document, PowerOfAttorney, Invoice, Employee, AuditTrail } from '@/types';
import { validatePayload } from '@/lib/persistenceManager';
import { toCamel, toSnake } from '@/utils/schemaMapping';

// الأعمدة المسموح بها فقط لكل جدول - مطابقة تماماً لـ Supabase schema
const ALLOWED_COLUMNS: Record<string, string[]> = {
  clients: [
    'id', 'name', 'phone', 'email', 'id_number', 'najiz_id',
    'address', 'status', 'last_sync_at', 'created_at', 'updated_at'
  ],
  cases: [
    'id', 'client_id', 'case_number', 'najiz_case_number', 'title',
    'category', 'stage', 'status', 'priority', 'court_name',
    'opponent_name', 'summary', 'details', 'attachments_count',
    'last_session_at', 'next_session_at', 'lawyers', 'metadata',
    'last_sync_at', 'created_at', 'updated_at'
  ],
  tasks: [
    'id', 'case_id', 'employee_id', 'title', 'description',
    'status', 'priority', 'due_date', 'created_at', 'updated_at'
  ],
  hearings: [
    'id', 'case_id', 'date', 'time', 'location', 'hall',
    'judge', 'status', 'notes', 'created_at', 'updated_at'
  ],
  employees: [
    'id', 'name', 'role', 'email', 'phone', 'status',
    'salary', 'department', 'join_date', 'created_at', 'updated_at'
  ],
  invoices: [
    'id', 'client_id', 'case_id', 'amount', 'vat_amount', 'total_amount',
    'status', 'issue_date', 'due_date', 'payment_method', 'description',
    'is_zatca_submitted', 'zatca_timestamp', 'created_at', 'updated_at'
  ],
  powers_of_attorney: [
    'id', 'client_id', 'poa_number', 'issue_date', 'expiry_date',
    'type', 'status', 'file_url', 'created_at', 'updated_at'
  ],
  documents: [
    'id', 'case_id', 'name', 'category', 'file_url', 'file_size',
    'uploaded_at', 'tags', 'content_text', 'created_at', 'updated_at'
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
    'id', 'user_id', 'title', 'message', 'type', 'is_read',
    'entity_type', 'entity_id', 'created_at'
  ],
  audit_trails: [
    'id', 'user_id', 'user_name', 'action', 'entity_type',
    'entity_id', 'old_data', 'new_data', 'ip_address', 'created_at'
  ],
  system_errors: [
    'id', 'message', 'stack', 'component', 'user_id', 'severity', 'created_at'
  ],
};

// دالة تنقية البيانات: تحذف أي حقل غير موجود في الجدول
const sanitizeForTable = (table: string, snakeData: Record<string, any>): Record<string, any> => {
  const allowed = ALLOWED_COLUMNS[table];
  if (!allowed) return snakeData; // إذا لم يكن الجدول معرفاً، أرسل كما هو
  
  const sanitized: Record<string, any> = {};
  for (const key of allowed) {
    if (snakeData[key] !== undefined && snakeData[key] !== null) {
      sanitized[key] = snakeData[key];
    }
  }
  return sanitized;
};

// دالة تحويل خاصة للعملاء (clients) لمعالجة اختلاف أسماء الحقول
const mapClientToDb = (data: any): Record<string, any> => {
  const snaked = toSnake(data);
  return {
    id: snaked.id,
    name: snaked.name,
    phone: snaked.phone,
    email: snaked.email,
    id_number: snaked.national_id || snaked.id_number, // camelCase: nationalId → national_id → id_number في DB
    najiz_id: snaked.najiz_id,
    address: snaked.address,
    status: snaked.status || 'active',
    last_sync_at: snaked.last_sync_at,
    created_at: snaked.created_at,
    updated_at: snaked.updated_at || new Date().toISOString(),
  };
};

// دالة تحويل خاصة للقضايا (cases) لمعالجة اختلاف أسماء الحقول
const mapCaseToDb = (data: any): Record<string, any> => {
  const snaked = toSnake(data);
  return {
    id: snaked.id,
    client_id: snaked.client_id,
    case_number: snaked.case_number,
    najiz_case_number: snaked.najiz_case_number || snaked.court_case_number,
    title: snaked.case_name || snaked.title,
    category: snaked.category,
    stage: snaked.stage,
    status: snaked.status,
    priority: snaked.priority || 'medium',
    court_name: snaked.court_name,
    opponent_name: snaked.opponent_name || (snaked as any).opponent_names?.[0], // Fallback if opponent_name missing
    summary: snaked.summary,
    details: snaked.details,
    attachments_count: snaked.attachments_count || 0,
    last_session_at: snaked.last_session_date || snaked.last_session_at,
    next_session_at: snaked.next_session_date || snaked.next_session_at,
    lawyers: snaked.assigned_lawyers ? JSON.stringify(snaked.assigned_lawyers) : '[]',
    metadata: JSON.stringify({
      isNajizSync: snaked.is_najiz_sync,
      isConfidential: snaked.is_confidential,
      judgeName: snaked.judge_name,
      executionNumber: snaked.execution_number,
    }),
    last_sync_at: snaked.last_sync_at,
    created_at: snaked.created_at,
    updated_at: new Date().toISOString(),
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
      const err = event.reason;
      console.warn("[Supabase] Unhandled Promise Rejection Caught and Gracefully Handled:", err);
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

      if (casesRes.data) setCases(toCamel(casesRes.data) as Case[]);
      if (clientsRes.data) setClients(toCamel(clientsRes.data) as Client[]);
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
    const handleStatus = (table: string) => (status: string, err?: Error) => {
      if (status === 'SUBSCRIBED') {
         console.log(`[Supabase Realtime] Subscribed to ${table}`);
      } else if (status === 'CHANNEL_ERROR') {
         console.warn(`[Supabase Realtime] Channel Error on ${table} - Realtime may be disabled or credentials invalid.`);
      } else if (status === 'TIMED_OUT') {
         console.warn(`[Supabase Realtime] Timed out on ${table} - stopping reconnect.`);
      } else if (status === 'CLOSED') {
         console.log(`[Supabase Realtime] Closed channel ${table}`);
      }
    };

    const triggers = ['cases', 'clients', 'tasks', 'hearings', 'documents', 'powers_of_attorney', 'invoices', 'employees', 'attachments', 'client_portal', 'employee_portal', 'attendance', 'leave_requests', 'payments', 'notifications', 'audit_trails', 'system_errors'];
    const channels = triggers.map(tbl => {
      return supabase.channel(`public:${tbl}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tbl }, fetchData)
        .subscribe(handleStatus(tbl));
    });

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const cleanup = setupRealtime();
    return () => cleanup();
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
        const targetTable = table || type;
        const mappedTable = getSupabaseTableName(targetTable);
        
        let errorObj = null;
        if (data?.id) {
          const { id, ...payload } = data;
          const { error } = await supabase.from(mappedTable).update(toSnake(payload)).eq('id', id);
          if (error) errorObj = error;
        } else {
          const { error } = await supabase.from(mappedTable).insert([toSnake(data)]);
          if (error) errorObj = error;
        }
        
        if (errorObj) {
          console.error(`[Background Sync Error] table: ${mappedTable}`, errorObj);
          remainingLogs.push(log);
        } else {
          console.log(`[Background Sync] successfully processed ${mappedTable}`);
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
          const errMsg = validation.message || 'Validation error';
          console.error(`[Local Schema Validation] Table: ${table}, Field: ${validation.field}, Msg: ${errMsg}`);
          return { success: false, errorType: 'validation', message: errMsg, field: validation.field };
        }
      }

      const mappedTable = getSupabaseTableName(table);
      let dbData: Record<string, any>;
      if (mappedTable === 'clients') {
        dbData = mapClientToDb(data);
      } else if (mappedTable === 'cases') {
        dbData = mapCaseToDb(data);
      } else {
        dbData = sanitizeForTable(mappedTable, toSnake(data));
      }

      console.log(`[Supabase] Sanitized payload for ${mappedTable}:`, dbData);
      console.log(`[DEBUG ${table} INSERT payload]`, JSON.stringify(dbData, null, 2));

      const { data: insertedData, error } = await supabase
        .from(mappedTable)
        .insert([dbData])
        .select()
        .single();

      
      if (error) {
        // Handle PGRST204 (No Content)
        if (error.code === 'PGRST204') {
          console.warn(`[${table}] PGRST204: returning input data as fallback`);
          return { success: true, data: data };
        }

        console.error(`[Supabase Insert Error] Table: ${mappedTable}`, error);
        const isNetworkError = !navigator.onLine || error.message?.includes('fetch') || error.message?.includes('network');
        if (isNetworkError) {
           handleOfflineFallback(table, 'CREATE', data, error.message);
        }
        return { 
          success: false, 
          errorType: isNetworkError ? 'network' : 'database',
          message: error.message,
          error
        };
      }
      
      const camelData = toCamel(insertedData);
      console.log(`[Supabase] Successfully inserted into ${mappedTable}`);
      
      const setter = getStateSetter(table);
      if (setter) {
        setter((prev: any[]) => [camelData, ...prev]);
      }
      
      return { success: true, data: camelData };
    } catch (err: any) {
      console.error(`[Supabase Outer Create Exception] Table: ${table}`, err);
      return { success: false, errorType: 'exception', message: err?.message, error: err };
    }
  };

  const updateRecord = async (table: string, id: string | number, data: any) => {
    try {
      const isValidationEligible = ['cases', 'clients', 'tasks'].includes(table);
      if (isValidationEligible) {
        const validation = validatePayload(table as any, data, true);
        if (!validation.isValid) {
          const errMsg = validation.message || 'Validation error';
          console.error(`[Local Schema Validation] Table: ${table}, Field: ${validation.field}, Msg: ${errMsg}`);
          return { success: false, errorType: 'validation', message: errMsg, field: validation.field };
        }
      }

      const mappedTable = getSupabaseTableName(table);
      let dbData: Record<string, any>;
      if (mappedTable === 'clients') {
        dbData = mapClientToDb(data);
      } else if (mappedTable === 'cases') {
        dbData = mapCaseToDb(data);
      } else {
        dbData = sanitizeForTable(mappedTable, toSnake(data));
      }

      // احذف id من بيانات التحديث (لا يجب تحديث المفتاح الأساسي)
      const { id: _id, created_at: _ca, ...updateData } = dbData;

      console.log(`[Supabase] Sanitized update payload for ${mappedTable}:`, updateData);
      const { data: updatedData, error } = await supabase
        .from(mappedTable)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST204') {
          console.warn(`[${table}] PGRST204: returning input data as fallback for UPDATE`);
          return { success: true, data: data };
        }
        console.error(`[Supabase Update Error] Table: ${mappedTable}, id=${id}`, error);
        const isNetworkError = !navigator.onLine || error.message?.includes('fetch') || error.message?.includes('network');
        if (isNetworkError) {
           handleOfflineFallback(table, 'UPDATE', { id, ...data }, error.message);
        }
        return { 
          success: false, 
          errorType: isNetworkError ? 'network' : 'database',
          message: error.message,
          error
        };
      }
      
      const camelData = toCamel(updatedData);
      console.log(`[Supabase] Successfully updated ${mappedTable} id=${id}`);
      
      const setter = getStateSetter(table);
      if (setter) {
        setter((prev: any[]) => prev.map(c => c.id === id ? { ...c, ...camelData } : c));
      }
      
      return { success: true, data: camelData };
    } catch (err: any) {
      console.error(`[Supabase Outer Update Exception] Table: ${table}, id=${id}`, err);
      return { success: false, errorType: 'exception', message: err?.message, error: err };
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
        setter((prev: any[]) => prev.filter(c => c.id !== id));
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
