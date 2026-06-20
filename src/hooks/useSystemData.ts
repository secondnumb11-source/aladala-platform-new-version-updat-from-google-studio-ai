import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useSystemData = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = async () => {
    try {
      const [
        casesRes, clientsRes, employeesRes,
        invoicesRes, hearingsRes
      ] = await Promise.all([
        supabase.from('cases')
          .select('id, case_number, title, client_name, client_id, status, category, stage, court_name, opponent_name, summary, agreed_fees, collected_fees')
          .eq('archived', false)
          .order('created_at', { ascending: false }),

        supabase.from('clients')
          .select('id, name, phone, email, national_id, status')
          .eq('status', 'active')
          .order('name'),

        supabase.from('employees')
          .select('id, name, role, job_title, status')
          .in('status', ['active','نشط','فعال'])
          .order('name'),

        supabase.from('invoices')
          .select('id, invoice_number, client_name, client_id, case_id, amount, status, issue_date')
          .order('created_at', { ascending: false })
          .limit(50),

        supabase.from('hearings')
          .select('id, case_id, case_number, date, time, court_name, status')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date')
          .limit(20)
      ]);

      if (casesRes.data) setCases(casesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (hearingsRes.data) setHearings(hearingsRes.data);

    } catch (err: any) {
      console.error('[useSystemData]', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  return {
    cases, clients, employees,
    invoices, hearings, isLoading,
    refresh: loadAllData
  };
};
