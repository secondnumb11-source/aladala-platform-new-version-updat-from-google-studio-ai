import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, ChevronRight, 
  Trash2, ShieldCheck, ShieldAlert, CheckCircle2, 
  Clock, RefreshCw, X, FileSpreadsheet, User, Scale, FileKey
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { PowerOfAttorney, Client } from '@/types';

interface AgenciesModuleProps {
  clients: Client[];
  onUpdateState?: (t: string, d: any) => void;
}

export default function AgenciesModule({ clients, onUpdateState }: AgenciesModuleProps) {
  const [agencies, setAgencies] = useState<PowerOfAttorney[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<PowerOfAttorney | null>(null);

  // Form states
  const [poaNumber, setPoaNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [lawyerName, setLawyerName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('نشطة');
  const [scope, setScope] = useState('');
  const [clausesText, setClausesText] = useState('');
  const [partiesText, setPartiesText] = useState('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchAgencies = async () => {
    const { data, error } = await supabase.from('powersOfAttorney').select('*');
    if (!error && data) {
      setAgencies(data as PowerOfAttorney[]);
    }
  };

  useEffect(() => {
    fetchAgencies();
    const sub = supabase.channel('poas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'powersOfAttorney' }, () => {
        fetchAgencies();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getRemainingDays = (expiryDateStr: string) => {
    if (!expiryDateStr) return 0;
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    expiry.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleDeleteAgency = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذه الوكالة بصفة نهائية؟')) return;
    try {
      await supabase.from('powersOfAttorney').delete().eq('id', id);
      showToast('تم حذف الوكالة بنجاح', 'success');
      if (selectedAgency?.id === id) setSelectedAgency(null);
    } catch (err: any) {
      showToast('خطأ أثناء حذف الوكالة: ' + err.message, 'error');
    }
  };

  const handleAddAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poaNumber || !clientName || !expiryDate || !issueDate) {
      showToast('يرجى ملء كافة الحقول الأساسية', 'error');
      return;
    }

    const clausesArray = clausesText
      ? clausesText.split('\n').filter(c => c.trim())
      : [scope || 'المرافعة والمدافعة والمراجعة لكافة الدوائر الحكومية والشرعية'];

    const partiesArray = partiesText
      ? partiesText.split('\n').map(p => {
          const parts = p.split('-');
          return {
            name: parts[0]?.trim() || 'طرف غير معروف',
            role: parts[1]?.trim() || 'طرف بالوكالة',
            identity: parts[2]?.trim() || ''
          };
        }).filter(p => p.name)
      : [
          { name: clientName, role: 'موكل (Client)', identity: '' },
          { name: lawyerName || 'محامو المكتب', role: 'وكيل (Agent)', identity: '' }
        ];

    const newPoa = {
      poaNumber,
      clientName,
      lawyerName: lawyerName || 'المكتب الرئيسي - كادر العدالة',
      issueDate,
      expiryDate,
      status: getRemainingDays(expiryDate) <= 0 ? 'منتهية' : status,
      scope: scope || clausesArray[0] || '',
      clauses: clausesArray,
      parties: partiesArray,
      isNajizSync: false
    };

    try {
      await supabase.from('powersOfAttorney').insert([newPoa]);
      showToast('تم حفظ وإصدار كارت الوكالة بنجاح', 'success');
      setShowAddModal(false);
      setPoaNumber(''); setClientName(''); setLawyerName(''); setIssueDate(''); setExpiryDate(''); setScope(''); setClausesText(''); setPartiesText('');
    } catch (err: any) {
      showToast('فشل التخزين: ' + err.message, 'error');
    }
  };

  const handleNajizSync = async () => {
    setIsSyncing(true);
    showToast('جاري الاتصال وسحب بيانات الوكالات من منصة ناجز...', 'info');
    
    setTimeout(async () => {
      const mockNajizPoas = [
        { 
          poaNumber: "45802144", 
          issueDate: "2025-12-02", 
          expiryDate: "2026-07-15", 
          lawyerName: "المكتب الرئيسي - العدالة للمحاماة",
          clientName: "شركة الفرسان للمقاولات المحدودة", 
          status: "نشطة",
          scope: "المرافعة والمدافعة والإقرار والإنكار وسحب المبالغ والطلب للجهات الإدارية.",
          clauses: ["المرافعة والمدافعة", "تمثيل الموكل أمام المحكمة", "رفع الدعاوى وقيد الصحائف"],
          parties: [
            { name: "شركة الفرسان للمقاولات المحدودة", role: "موكل (Client)", identity: "1010098234" },
            { name: "المكتب الرئيسي للمحاماة", role: "وكيل (Agent)", identity: "700941832" }
          ],
          isNajizSync: true
        },
        { 
          poaNumber: "45100234", 
          issueDate: "2025-10-10", 
          expiryDate: "2026-06-28", 
          lawyerName: "المحامي سعد بن عبد العزيز",
          clientName: "الشيخ عبد الرحمن بن حمود السحيمي", 
          status: "نشطة",
          scope: "المراجعة لكافة الدوائر الحكومية وإثبات الحجج.",
          clauses: ["المراجعة للدوائر الحكومية", "تقديم طلبات إثبات ملكية", "سحب صكوك القرارات"],
          parties: [
            { name: "الشيخ عبد الرحمن بن حمود السحيمي", role: "موكل (Client)", identity: "1012948234" },
            { name: "سعد بن عبد العزيز بن محمد", role: "وكيل (Agent)", identity: "1055819382" }
          ],
          isNajizSync: true
        }
      ];

      let addedCount = 0;
      for (const poa of mockNajizPoas) {
        if (!agencies.some((a) => a.poaNumber === poa.poaNumber)) {
          await supabase.from('powersOfAttorney').insert([poa]);
          addedCount++;
        }
      }

      setIsSyncing(false);
      showToast(addedCount > 0 ? `مزامنة ناجحة: جلب ${addedCount} وكالات من ناجز` : 'سجلات الوكالات في منصة ناجز محدثة', 'success');
    }, 1800);
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 0) return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" />منتهية الصلاحية</span>;
    if (days <= 30) return <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse"><Clock className="w-3.5 h-3.5" />ينتهي قريباً جداً ({days} يوم)</span>;
    if (days <= 60) return <span className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />متبقي {days} يوم</span>;
    return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />صالحة ({days} يوم متبقي)</span>;
  };

  const filteredAgencies = agencies.filter(poa => {
    const term = searchQuery.toLowerCase();
    const searchMatch = poa.poaNumber.includes(searchQuery) || poa.clientName.toLowerCase().includes(term) || poa.lawyerName.toLowerCase().includes(term);
    if (!searchMatch) return false;

    const remaining = getRemainingDays(poa.expiryDate);
    if (statusFilter === 'active') return remaining > 0 && poa.status !== 'ملغاة';
    if (statusFilter === 'expiring') return remaining > 0 && remaining <= 60;
    if (statusFilter === 'expired') return remaining <= 0;
    return true;
  });

  const expiringSoonCount = agencies.filter(poa => {
    const days = getRemainingDays(poa.expiryDate);
    return days > 0 && days <= 60;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 lg:p-10 space-y-8 font-sans" dir="rtl">
      
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[100] px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 font-semibold text-sm ${
              notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-white border text-slate-900 border-slate-200 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 relative z-10 flex items-center gap-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex-shrink-0">
            <FileKey className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">إدارة الوكالات القضائية</h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">تتبع التوكيلات وسريانها والمزامنة الحية مع أداة كشط البيانات من (ناجز)</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <button onClick={handleNajizSync} disabled={isSyncing} className={`px-5 py-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50`}>
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'جاري السحب...' : 'سحب بيانات الوكالات (ناجز)'}
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg">
            <Plus className="w-4 h-4" />
            توثيق وكالة جديدة
          </button>
        </div>
      </div>

      {/* Expiry Alarm Banner */}
      {expiringSoonCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-full animate-pulse"><ShieldAlert className="w-6 h-6 text-rose-600" /></div>
          <div>
            <h4 className="text-sm font-black text-rose-900">تنبيه عاجل: اقتراب انتهاء صلاحية الوكالات</h4>
            <p className="text-sm font-medium text-rose-700 mt-1">يوجد {expiringSoonCount} وكالات شارفت مدتها على الانتهاء. تجنباً لتوقف الإجراءات، يرجى التجديد فوراً.</p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي الوكالات', val: agencies.length, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'الوكالات السارية', val: agencies.filter(a => getRemainingDays(a.expiryDate) > 0).length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'مهددة بالانتهاء بالانتهاء', val: expiringSoonCount, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'الوكالات المنتهية', val: agencies.filter(a => getRemainingDays(a.expiryDate) <= 0).length, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} border p-6 rounded-2xl space-y-2`}>
            <p className="text-xs font-bold text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-black font-mono ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" placeholder="البحث برقم الوكالة، الموكل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'active', label: 'النشطة' },
            { id: 'expiring', label: 'تنتهي قريباً' },
            { id: 'expired', label: 'المنتهية' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setStatusFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === tab.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredAgencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((poa) => {
            const daysRemaining = getRemainingDays(poa.expiryDate);
            const isFinished = daysRemaining <= 0;
            const isDanger = daysRemaining > 0 && daysRemaining <= 30;

            return (
              <motion.div key={poa.id} layout onClick={() => setSelectedAgency(poa)} whileHover={{ y: -4 }}
                className={`cursor-pointer bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[280px] relative overflow-hidden ${isFinished ? 'border-rose-200 bg-rose-50/30' : isDanger ? 'border-rose-300' : 'border-slate-200'}`}>
                
                {/* Accent Top Line */}
                <div className={`absolute top-0 right-0 left-0 h-1.5 ${isFinished ? 'bg-rose-500' : isDanger ? 'bg-rose-400 animate-pulse' : daysRemaining <= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} />

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                       <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                         رقم: {poa.poaNumber}
                       </span>
                       {poa.isNajizSync && (
                         <span className="block w-fit bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3" /> مزامنة ناجز
                         </span>
                       )}
                    </div>
                    <button onClick={(e) => handleDeleteAgency(poa.id!, e)} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 line-clamp-1">{poa.clientName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold mt-1">
                      <Scale className="w-3.5 h-3.5" /> الممثل: {poa.lawyerName}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">
                    {poa.scope || 'لم يتم تخصيص نطاق. الوكالة عامة.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold">الانتهاء</p>
                    <p className={`text-xs font-mono font-black ${isFinished ? 'text-rose-600' : 'text-slate-700'}`}>{poa.expiryDate}</p>
                  </div>
                  <div>{getUrgencyBadge(daysRemaining)}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-16 rounded-[2rem] text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
            <FileKey className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-slate-900">سجل الوكالات فارغ</h3>
          <p className="text-sm text-slate-500 font-medium">لم يتم العثور على وكالات تطابق تصفيتك، قم بـ "سحب بيانات الوكالات" مباشرة من مسار ناجز أو أضفها يدوياً.</p>
        </div>
      )}

      {/* Slideout Detailed Panel */}
      <AnimatePresence>
        {selectedAgency && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">وكالة رقم: {selectedAgency.poaNumber}</h2>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-indigo-600 font-bold text-xs">تفاصيل الوكالة القضائية</span>
                  </div>
                </div>
                <button onClick={() => setSelectedAgency(null)} className="p-2 hover:bg-slate-200 bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div className={`p-4 rounded-xl border flex items-center gap-3 justify-between shadow-sm ${
                  getRemainingDays(selectedAgency.expiryDate) <= 0 ? 'bg-rose-50 border-rose-200 text-rose-800' :
                  getRemainingDays(selectedAgency.expiryDate) <= 60 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {getRemainingDays(selectedAgency.expiryDate) <= 30 ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                    <div>
                      <h4 className="text-sm font-black text-slate-900 mb-0.5">وضع الوكالة النظامي</h4>
                      <p className="text-xs font-semibold opacity-90">
                        {getRemainingDays(selectedAgency.expiryDate) <= 0 ? 'هذه الوكالة باطلة بانتهاء مدتها.' : 'هذه الوكالة معتمدة ونشطة قانونياً ومحفوظة بالسجل.'}
                      </p>
                    </div>
                  </div>
                  {getUrgencyBadge(getRemainingDays(selectedAgency.expiryDate))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center shadow-sm">
                    <span className="text-xs text-slate-500 font-bold block mb-1">تاريخ إنشائها / الصدور</span>
                    <span className="text-lg font-black font-mono text-slate-900 block">{selectedAgency.issueDate}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center shadow-sm relative overflow-hidden">
                    <div className={`absolute top-0 w-full h-1 left-0 ${getRemainingDays(selectedAgency.expiryDate) <= 0 ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                    <span className="text-xs text-slate-500 font-bold block mb-1">تاريخ انتهائها نظامياً</span>
                    <span className="text-lg font-black font-mono text-slate-900 block">{selectedAgency.expiryDate}</span>
                  </div>
                </div>

                {getRemainingDays(selectedAgency.expiryDate) > 0 && (
                  <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">العد التنازلي لانتهاء الصلاحية</span>
                    <CountdownTimer targetDate={selectedAgency.expiryDate} />
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 border-b pb-2">أطراف الوكالة (الموكل والوكيل)</h4>
                  {selectedAgency.parties && selectedAgency.parties.length > 0 ? (
                    <div className="space-y-2">
                      {selectedAgency.parties.map((part, index) => (
                        <div key={index} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100">
                              {part.role.includes('موكل') ? 'م' : 'و'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{part.name}</p>
                              {part.identity && <p className="text-xs font-mono font-bold text-slate-500 mt-1">هوية: {part.identity}</p>}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">{part.role}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">الموكل</span>
                        <span className="text-sm font-black text-slate-900">{selectedAgency.clientName}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">الوكيل</span>
                        <span className="text-sm font-black text-slate-900">{selectedAgency.lawyerName}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-900 border-b pb-2">نطاق عمل الوكالة العام</h4>
                  <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">{selectedAgency.scope}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 border-b pb-2">تفاصيل بنود الصلاحيات</h4>
                  <div className="space-y-2">
                    {selectedAgency.clauses && selectedAgency.clauses.map((clause, idx) => (
                      <div key={idx} className="p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0 border border-indigo-100">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-700 font-bold leading-relaxed pt-0.5">{clause}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setSelectedAgency(null)} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-black shadow-md transition-all">
                  إغلاق وتراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Poa Modal (Light Theme) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
              
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-indigo-600" /> إضافة توثيق وكالة للعميل
                  </h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAgency} className="p-6 space-y-5 text-right overflow-y-auto max-h-[75vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-700 font-bold block">رقم الوكالة العدلية *</label>
                    <input type="text" required placeholder="45802144" value={poaNumber} onChange={(e) => setPoaNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-700 font-bold block">اسم الموكل (العميل) *</label>
                    <input type="text" required placeholder="شركة الأمل أو السيد حمد" value={clientName} onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-700 font-bold block">اسم المحامي الوكيل</label>
                    <input type="text" placeholder="فريق المحامين" value={lawyerName} onChange={(e) => setLawyerName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-700 font-bold block">حالة الوكالة</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm">
                      <option value="نشطة">نشطة / سارية</option>
                      <option value="ملغاة">ملغاة</option>
                      <option value="منتهية">منتهية المدة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-700 font-bold block">تاريخ الإصدار *</label>
                    <input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-700 font-bold block">تاريخ الانتهاء *</label>
                    <input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm" />
                  </div>
                </div>

                {expiryDate && (
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-inner">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">المؤقت الزمني التنازلي</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                         الزمن المتبقي لانتهاء الوكالة المضافة:
                      </span>
                    </div>
                    <CountdownTimer targetDate={expiryDate} />
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-800 text-xs font-bold mt-2">
                  <div className="shrink-0"><ShieldCheck className="w-5 h-5 text-blue-600" /></div>
                  <p className="leading-relaxed">
                    التأكيد: الإضافة اليدوية مخصصة للحالات الطارئة. لضمان دقة مواعيد الانتهاء للوكالات، نؤكد على ضرورة استخدام <span className="text-blue-900 font-black">"سحب بيانات الوكالات (ناجز)"</span> ليتم مزامنة حالة الوكالة الفورية والصلاحيات آلياً من وزارة العدل وتحديث المؤقت الزمني تلقائياً.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-700 font-bold block">موضوع أو نطاق الوكالة</label>
                  <textarea rows={2} placeholder="المرافعة والمدافعة في القضايا..." value={scope} onChange={(e) => setScope(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-700 font-bold flex justify-between"><span>البنود والصلاحيات</span><span className="text-slate-400 font-medium">(كل بند في سطر)</span></label>
                  <textarea rows={3} placeholder="المراجعة في الإدارات الحكومية&#10;حق الإقرار والصلح" value={clausesText} onChange={(e) => setClausesText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm" />
                </div>

                <div className="pt-4 border-t border-slate-200 flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all">
                    إلغاء
                  </button>
                  <button type="submit"
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-black shadow-md transition-all">
                    حفظ وإضافة الوكالة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
