import { supabase } from '@/lib/supabase';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  SYNC = 'SYNC'
}

export interface AuditLog {
  id?: string;
  timestamp?: string;
  user_id: string;
  user_name: string;
  role: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
}

export const auditLogger = {
  async log(entry: Omit<AuditLog, 'timestamp'>) {
    try {
      const { error } = await supabase.from('audit_trails').insert([{
        ...entry,
        timestamp: new Date().toISOString()
      }]);
      
      if (error) {
        console.error('Failed to save audit log:', error);
      }
    } catch (e) {
      console.error('Audit logger error:', e);
    }
  },

  async getLogs(limit = 100) {
    const { data, error } = await supabase
      .from('audit_trails')
      .select('id, user_id, user_name, action, entity_type, entity_id, details, metadata, created_at, timestamp')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
};
