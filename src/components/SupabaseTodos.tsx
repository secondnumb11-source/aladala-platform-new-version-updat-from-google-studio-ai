import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { ListTodo, Loader2, AlertCircle } from 'lucide-react';

interface Todo {
  id: string;
  name: string;
  created_at: string;
}

export const SupabaseTodos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const { data, error } = await supabase.from('todos').select();
        
        if (error) throw error;
        setTodos(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 font-medium">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Error fetching todos: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-slate-900 font-sans">Supabase Todos</h2>
      </div>

      {todos.length === 0 ? (
        <p className="text-slate-700 italic text-sm py-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
          No todos found. Add some in your Supabase dashboard!
        </p>
      ) : (
        <ul className="grid gap-2">
          {todos.map((todo) => (
            <motion.li
              key={todo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between transition-colors"
            >
              <span className="text-slate-700 font-medium">{todo.name}</span>
              <span className="text-[10px] text-slate-200 font-bold font-mono">ID: {todo.id.slice(0, 8)}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
};
