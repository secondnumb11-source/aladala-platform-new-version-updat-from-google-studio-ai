import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gavel, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  User, 
  CreditCard, 
  FileText, 
  ChevronLeft,
  ArrowUpRight,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { Execution } from '../types';

interface ExecutionsModuleProps {
  executions: Execution[];
  onCreateExecution?: (e: Partial<Execution>) => void;
  onUpdateExecution?: (id: string, updates: Partial<Execution>) => void;
}

const ExecutionsModule: React.FC<ExecutionsModuleProps> = ({ 
  executions = [], 
  onCreateExecution 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = executions.filter(ex => {
    const matchesSearch = 
      ex.execution_number?.includes(searchTerm) || 
      ex.requester_name?.includes(searchTerm) ||
      ex.opponent_name?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || ex.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/50 p-8 rounded-[2rem] border border-slate-700/50 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <Scale className="w-10 h-10 text-amber-500" />
            طلبات التنفيذ
          </h1>
          <p className="text-slate-400 font-bold text-sm">متابعة طلبات التنفيذ ومستجداتها المستوردة آلياً من منصة ناجز.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text"
              placeholder="البحث برقم الطلب أو اسم الطرف..."
              className="bg-slate-800/80 border-2 border-slate-700 rounded-2xl py-3 pr-12 pl-6 text-white text-sm font-black w-full md:w-80 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-900/20 active:scale-95">
            <Plus className="w-5 h-5" />
            إضافة طلب يدوي
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الطلبات', value: executions.length, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'قيد التنفيذ', value: executions.filter(e => e.status?.includes('قيد')).length, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'طلبات مكتملة', value: executions.filter(e => e.status?.includes('منتهي') || e.status?.includes('مكتمل')).length, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'طلبات متعثرة', value: executions.filter(e => e.status?.includes('متعثر')).length, color: 'text-rose-400', bg: 'bg-rose-400/10' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white/5`}>
            <p className="text-slate-400 text-xs font-black mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Grid of Execution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {filtered.map((ex, idx) => (
            <motion.div
              layout
              key={ex.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900 border border-slate-700/50 rounded-[2.5rem] p-7 group hover:border-amber-500/30 transition-all hover:shadow-2xl hover:shadow-amber-900/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-slate-800 rounded-2xl group-hover:bg-amber-500/10 transition-colors">
                  <Gavel className="w-6 h-6 text-amber-500" />
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  ex.status?.includes('مكتمل') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  ex.status?.includes('قيد') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {ex.status || 'حالة غير معروفة'}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-amber-500/80 text-[10px] font-black mb-1 uppercase">رقم طلب التنفيذ</p>
                  <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">{ex.execution_number}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/50">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black mb-1">طالب التنفيذ (الموكل)</p>
                    <div className="flex items-center gap-2">
                       <User className="w-3 h-3 text-amber-500" />
                       <span className="text-xs font-black text-slate-200">{ex.requester_name || 'غير محدد'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] font-black mb-1">المنفذ ضده</p>
                    <div className="flex items-center gap-2">
                       <User className="w-3 h-3 text-rose-500" />
                       <span className="text-xs font-black text-slate-200">{ex.opponent_name || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4 text-xs font-black">
                     <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px]">المبلغ الإجمالي</span>
                        <span className="text-amber-400">{ex.amount?.toLocaleString() || '0'} ر.س</span>
                     </div>
                     <div className="w-px h-6 bg-slate-800"></div>
                     <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px]">تاريخ المزامنة</span>
                        <span className="text-slate-300">{ex.issue_date || 'N/A'}</span>
                     </div>
                  </div>
                  <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-white">
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
                
                {ex.court_name && (
                   <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-400 line-clamp-1">{ex.court_name}</span>
                   </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
             <div className="bg-slate-800 p-8 rounded-full mb-6">
                <FileText className="w-16 h-16 text-slate-600" />
             </div>
             <h3 className="text-xl font-black text-slate-400 mb-2">لا توجد طلبات تنفيذ مطابقة</h3>
             <p className="text-slate-500 font-bold max-w-sm">يرجى التأكد من تشغيل أداة المزامنة من بوابة ناجز أو المحاولة بكلمات بحث مختلفة.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionsModule;
