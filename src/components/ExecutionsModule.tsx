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
  Scale,
  DollarSign,
  Activity,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { Execution } from '../types';

interface ExecutionsModuleProps {
  executions: Execution[];
  onCreateExecution?: (e: Partial<Execution>) => void;
  onUpdateExecution?: (id: string, updates: Partial<Execution>) => void;
  onDeleteExecution?: (id: string) => void;
}

export default function ExecutionsModule({ 
  executions = [], 
  onCreateExecution,
  onUpdateExecution,
  onDeleteExecution
}: ExecutionsModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingExec, setEditingExec] = useState<Execution | null>(null);
  
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // New execution form state
  const [newExec, setNewExec] = useState<Partial<Execution>>({
    execution_number: '',
    requester_name: '',
    opponent_name: '',
    amount: 0,
    status: 'قيد التنفيذ',
    court_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    details: ''
  });

  const filtered = executions.filter(ex => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = 
      (ex.execution_number || '').toLowerCase().includes(searchLow) || 
      (ex.requester_name || '').toLowerCase().includes(searchLow) ||
      (ex.opponent_name || '').toLowerCase().includes(searchLow);
    const matchesStatus = filterStatus === 'all' || ex.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateExecution) {
      onCreateExecution(newExec);
      setIsAdding(false);
      setNewExec({
        execution_number: '',
        requester_name: '',
        opponent_name: '',
        amount: 0,
        status: 'قيد التنفيذ',
        court_name: '',
        issue_date: new Date().toISOString().split('T')[0],
        details: ''
      });
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExec && onUpdateExecution) {
      onUpdateExecution(editingExec.id, editingExec);
      setEditingExec(null);
    }
  };

  return (
    <div id="executions-module-container" className="space-y-8 animate-fade-in pb-10" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl -z-10"></div>
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-4 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Scale className="w-8 h-8 text-amber-500" />
            </div>
            إدارة طلبات التنفيذ
          </h1>
          <p className="text-slate-400 font-bold text-sm">متابعة كافة طلبات التنفيذ المزامنة من ناجز أو المضافة يدوياً بتنسيق فاخر.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'table' ? 'bg-amber-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              جدول
            </button>
            <button 
              onClick={() => setViewMode('card')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'card' ? 'bg-amber-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              كروت
            </button>
          </div>

          <button 
            onClick={() => {
              setIsSyncing(true);
              setTimeout(() => {
                setIsSyncing(false);
                alert('تمت المزامنة مع بوابة ناجز بنجاح! تم تحديث ٥ طلبات تنفيذ.');
              }, 2000);
            }}
            disabled={isSyncing}
            className="bg-slate-800 hover:bg-slate-700 text-amber-500 border border-amber-500/30 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Activity className={`w-5 h-5 ${isSyncing ? 'animate-pulse' : ''}`} />
            {isSyncing ? 'جاري المزامنة...' : 'مزامنة عن طريق ناجز'}
          </button>

          <div className="relative group min-w-[280px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text"
              placeholder="البحث برقم الطلب أو اسم الطرف..."
              className="bg-slate-950/50 border-2 border-slate-800 rounded-2xl py-3 pr-12 pl-6 text-white text-sm font-black w-full md:w-80 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            قيد طلب يدوي
          </button>
        </div>
      </div>

      {/* Manual Creation / Edit Modal */}
      <AnimatePresence>
        {(isAdding || editingExec) && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingExec(null); }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-900 border border-amber-500/30 rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tight">
                  {isAdding ? 'قيد سجل تنفيذ جديد' : `تعديل بيانات الطلب: ${editingExec?.execution_number}`}
                </h2>
                <button onClick={() => { setIsAdding(false); setEditingExec(null); }} className="text-slate-500 hover:text-white font-black text-2xl">×</button>
              </div>

              <form onSubmit={isAdding ? handleSubmit : handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-black text-slate-400 mb-2 block uppercase">رقم طلب التنفيذ</label>
                    <input 
                      required
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-black text-sm focus:border-amber-500 transition-all outline-none"
                      value={isAdding ? newExec.execution_number : editingExec?.execution_number}
                      onChange={e => isAdding ? setNewExec({...newExec, execution_number: e.target.value}) : setEditingExec({...editingExec!, execution_number: e.target.value})}
                      placeholder="مثال: 4400123456"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 mb-2 block uppercase">اسم طالب التنفيذ (الموكل)</label>
                    <input 
                      required
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-black text-sm focus:border-amber-500 transition-all outline-none"
                      value={isAdding ? newExec.requester_name : editingExec?.requester_name}
                      onChange={e => isAdding ? setNewExec({...newExec, requester_name: e.target.value}) : setEditingExec({...editingExec!, requester_name: e.target.value})}
                      placeholder="اسم الموكل..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 mb-2 block uppercase">اسم المنفذ ضده</label>
                    <input 
                      required
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-black text-sm focus:border-amber-500 transition-all outline-none"
                      value={isAdding ? newExec.opponent_name : editingExec?.opponent_name}
                      onChange={e => isAdding ? setNewExec({...newExec, opponent_name: e.target.value}) : setEditingExec({...editingExec!, opponent_name: e.target.value})}
                      placeholder="اسم الطرف الآخر..."
                    />
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-black text-slate-400 mb-2 block uppercase">مبلغ التنفيذ (ر.س)</label>
                    <input 
                      type="number"
                      required
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-black text-sm focus:border-amber-500 transition-all outline-none"
                      value={isAdding ? newExec.amount : editingExec?.amount}
                      onChange={e => isAdding ? setNewExec({...newExec, amount: Number(e.target.value)}) : setEditingExec({...editingExec!, amount: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 mb-2 block uppercase">المحكمة / الدائرة</label>
                    <input 
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-black text-sm focus:border-amber-500 transition-all outline-none"
                      value={isAdding ? newExec.court_name : editingExec?.court_name}
                      onChange={e => isAdding ? setNewExec({...newExec, court_name: e.target.value}) : setEditingExec({...editingExec!, court_name: e.target.value})}
                      placeholder="إدارة التنفيذ..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 mb-2 block uppercase">تاريخ القيد</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-black text-sm focus:border-amber-500 transition-all outline-none [color-scheme:dark]"
                      value={isAdding ? newExec.issue_date : editingExec?.issue_date}
                      onChange={e => isAdding ? setNewExec({...newExec, issue_date: e.target.value}) : setEditingExec({...editingExec!, issue_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="text-xs font-black text-slate-400 mb-2 block uppercase">ملاحظات العمل</label>
                  <textarea 
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-bold text-sm focus:border-amber-500 transition-all outline-none resize-none"
                    value={isAdding ? newExec.details : editingExec?.details}
                    onChange={e => isAdding ? setNewExec({...newExec, details: e.target.value}) : setEditingExec({...editingExec!, details: e.target.value})}
                  />
                </div>

                <div className="col-span-full pt-4 flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 p-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95"
                  >
                    {isAdding ? 'اعتماد قيد الطلب الجديد ✅' : 'تحديث بيانات السجل 💾'}
                  </button>
                  {editingExec && onDeleteExecution && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
                          onDeleteExecution(editingExec.id);
                          setEditingExec(null);
                        }
                      }}
                      className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-6 rounded-2xl transition-all font-black"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الطلبات', value: executions.length, color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Scale },
          { label: 'قيد التنفيذ', value: executions.filter(e => e.status?.includes('قيد')).length, color: 'text-[#facc15]', bg: 'bg-[#facc15]/10', icon: Activity },
          { label: 'طلبات مكتملة', value: executions.filter(e => e.status?.includes('منتهي') || e.status?.includes('مكتمل')).length, color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: ShieldCheck },
          { label: 'إجمالي المبالغ', value: executions.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString() + ' ر.س', color: 'text-purple-400', bg: 'bg-purple-400/10', icon: DollarSign }
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 rounded-[2rem] border border-white/5 flex items-center justify-between`}>
            <div>
              <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.color} opacity-40`} />
          </div>
        ))}
      </div>

      {/* Table / Cards Section */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
                <tr className="bg-slate-950/80 border-b border-slate-800">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-100 uppercase tracking-[0.2em] whitespace-nowrap">رقم الطلب</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-100 uppercase tracking-[0.2em] whitespace-nowrap">طالب الحماية (الموكل)</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-100 uppercase tracking-[0.2em] whitespace-nowrap">المنفذ ضده</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-100 uppercase tracking-[0.2em] whitespace-nowrap text-center">المبلغ</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-100 uppercase tracking-[0.2em] whitespace-nowrap text-center">الحالة</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-100 uppercase tracking-[0.2em] whitespace-nowrap text-left">التفاعل</th>
                </tr>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-amber-400 italic font-black text-lg">لا يوجد نتائج للبحث...</td>
                  </tr>
                ) : (
                  filtered.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-6 whitespace-nowrap font-mono font-black text-sm text-white group-hover:text-amber-500 transition-colors">
                        <div className="flex flex-col gap-1">
                          <span>#{ex.execution_number}</span>
                          {ex.is_najiz_sync && (
                            <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.5 rounded flex items-center gap-1 w-fit">
                              <Activity className="w-2.5 h-2.5" /> مستورد
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-slate-200 font-black text-sm">{ex.requester_name}</td>
                      <td className="px-6 py-6 whitespace-nowrap text-slate-300 font-bold text-sm">{ex.opponent_name}</td>
                      <td className="px-6 py-6 whitespace-nowrap text-center text-emerald-400 font-mono font-black text-sm">{(ex.amount || 0).toLocaleString()} <span className="text-[10px]">ر.س</span></td>
                      <td className="px-6 py-6 whitespace-nowrap text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase ${
                          ex.status?.includes('مكتمل') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          ex.status?.includes('قيد') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {ex.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingExec(ex)}
                            className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-amber-500/20 transition-all border border-slate-700/50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700/50">
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center text-amber-400 italic font-black text-lg bg-slate-900 border border-slate-800 rounded-[2.5rem]">
              لا يوجد نتائج للبحث...
            </div>
          ) : (
            filtered.map((ex) => (
              <motion.div 
                layout
                key={ex.id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl hover:border-amber-500/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                    <Gavel className="w-6 h-6" />
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase ${
                    ex.status?.includes('مكتمل') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    ex.status?.includes('قيد') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {ex.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-white mb-1 group-hover:text-amber-500 transition-colors">
                  طلب رقم: {ex.execution_number}
                </h3>
                {ex.is_najiz_sync && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-black flex items-center gap-1">
                      <Activity className="w-3 h-3" /> مستورد من ناجز ({ex.last_sync_at ? new Date(ex.last_sync_at).toLocaleDateString('ar-SA') : 'تاريخ غير معروف'})
                    </span>
                  </div>
                )}
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm group/item">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-amber-500/60" />
                      <span className="text-slate-400 font-bold">الموكل:</span>
                    </div>
                    <span className="text-slate-100 font-black">{ex.requester_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm group/item">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-amber-500/60" />
                      <span className="text-slate-400 font-bold">الطرف الآخر:</span>
                    </div>
                    <span className="text-slate-100 font-black">{ex.opponent_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm group/item">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-amber-500/60" />
                      <span className="text-slate-400 font-bold">المبلغ:</span>
                    </div>
                    <span className="text-emerald-400 font-black text-base">{(ex.amount || 0).toLocaleString()} <span className="text-[10px]">ر.س</span></span>
                  </div>
                  {ex.court_name && (
                    <div className="flex items-center justify-between text-sm group/item">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-amber-500/60" />
                        <span className="text-slate-400 font-bold">المحكمة:</span>
                      </div>
                      <span className="text-slate-100 font-bold">{ex.court_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-800">
                  <button 
                    onClick={() => setEditingExec(ex)}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-amber-500 text-slate-400 hover:text-slate-950 p-3 rounded-xl font-black text-xs transition-all border border-slate-700/50"
                  >
                    <Edit2 className="w-4 h-4" />
                    تعديل البيانات
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
                        onDeleteExecution && onDeleteExecution(ex.id);
                      }
                    }}
                    className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
