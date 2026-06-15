import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Case, Client, Task } from '@/types';

export function useSupabaseData() {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [casesRes, clientsRes, tasksRes] = await Promise.all([
        supabase.from('cases').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      ]);

      if (casesRes.data) setCases(casesRes.data as Case[]);
      if (clientsRes.data) setClients(clientsRes.data as Client[]);
      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    } catch (error) {
      console.error('Error fetching Supabase data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const casesSub = supabase.channel('public:cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchData)
      .subscribe();

    const clientsSub = supabase.channel('public:clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, fetchData)
      .subscribe();

    const tasksSub = supabase.channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(casesSub);
      supabase.removeChannel(clientsSub);
      supabase.removeChannel(tasksSub);
    };
  }, [fetchData]);

  const createRecord = async (table: 'cases' | 'clients' | 'tasks', data: any) => {
    const { error } = await supabase.from(table).insert([data]);
    if (error) throw error;
  };

  const updateRecord = async (table: 'cases' | 'clients' | 'tasks', id: string | number, data: any) => {
    const { error } = await supabase.from(table).update(data).eq('id', id);
    if (error) throw error;
  };

  const deleteRecord = async (table: 'cases' | 'clients' | 'tasks', id: string | number) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  };

  return {
    cases,
    clients,
    tasks,
    loading,
    createRecord,
    updateRecord,
    deleteRecord,
    refresh: fetchData
  };
}
