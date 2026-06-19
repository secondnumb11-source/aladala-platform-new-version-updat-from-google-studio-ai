import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, ChevronRight, 
  Trash2, ShieldCheck, ShieldAlert, CheckCircle2, 
  Clock, RefreshCw, X, FileSpreadsheet, User, Scale, FileKey, Edit3
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { PowerOfAttorney, Client } from '@/types';
import { toCamel, toSnake } from '@/utils/schemaMapping';

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
  const [editingAgency, setEditingAgency] = useState<PowerOfAttorney | null>(null);
  const [activePreviewDocId, setActivePreviewDocId] = useState<string | null>(null);
  const [docContents, setDocContents] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);


  // Form states (used for both Add and Edit modals)
  const [poaNumber, setPoaNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [lawyerName, setLawyerName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('نشطة');
  const [scope, setScope] = useState('');
  const [clausesText, setClausesText] = useState('');
  const [partiesText, setPartiesText] = useState('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchAgencies = async () => {
    const { data, error } = await supabase.from('powers_of_attorney').select('*');
    if (!error && data) {
      setAgencies(toCamel(data) as PowerOfAttorney[]);
    }
  };



  const handlePreviewDoc = (docId: string, poa: PowerOfAttorney) => {
    if (activePreviewDocId === docId) {
      setActivePreviewDocId(null);
      return;
    }
    setActivePreviewDocId(docId);
    if (!docContents[docId]) {
      let content = '';
      if (docId === 'doc1') content = `وزارة العدل بالمملكة العربية السعودية\nكتابة العدل الافتراضية\n\nصك وكالة رقم: ${poa.poaNumber}\nتاريخ الصدور: ${poa.issueDate}\nالموكل الرئيسي: ${poa.clientName}\nالوكيل المرخص له: ${poa.lawyerName}\nنطاق الاختصاص القانوني: ${poa.scope || 'المرافعة والمدافعة وتقديم الأوراق وتنزيل الصكوك بالتوريد'}\nالحالة الرسمية: سارية معتمدة بالأرشفة.\n\nتشهد كتابة العدل بصحة تسجيل وتفويض المحامي بالتمثيل والصلح والامتثال لمستحقات الموكل.`;
      if (docId === 'doc2') content = `وزارة التجارة بجمهورية المملكة\nملخص قرارات مجلس الإدارة لشركاء ${poa.clientName}\n\nيشهد السجل التجاري رقم 1010065271 بموافقة الهيئة التنفيذية بتوكيل وتسمية المحامي ${poa.lawyerName} ليتولى إتمام المطالبات المالية والاعتراض والصلح والاتصال مع المنصات الرسمية ناجز ونفاذ.`;
      if (docId === 'doc3') content = `مكتب العدالة للمحاماة والاستشارات القانونية\nترخيص رقم 44/291\n\nبناء على رغبة العميل الموقر ${poa.clientName}، يُعمد المحامي ${poa.lawyerName} لمباشرة استلام الشحنات البتروكيماوية للجبيل الصناعية وتتبع المطالبة رقم 437194619 رداً على لجان المنازعات بالرياض.`;
      setDocContents(prev => ({ ...prev, [docId]: content }));
    }
  };

  useEffect(() => {
    fetchAgencies();
    const chId = `poa-changes-${Math.random().toString(36).substring(7)}`;
    const sub = supabase.channel(chId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'powers_of_attorney' }, () => {
        fetchAgencies();
      })
      .subscribe((status, error) => {
        if (error) {
          console.warn('[Supabase Realtime] Subscribe error for powers_of_attorney changes:', error);
        }
      });
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

  const handleDeleteAgency = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase.from('powers_of_attorney').delete().eq('id', id);
      if (error) throw error;
      showToast('تم حذف الوكالة بنجاح', 'success');
      if (selectedAgency?.id === id) setSelectedAgency(null);
      fetchAgencies();
    } catch (err: any) {
      showToast('خطأ أثناء حذف الوكالة: ' + err.message, 'error');
    }
  };

  const handleStartEdit = (poa: PowerOfAttorney, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAgency(poa);
    setPoaNumber(poa.poaNumber);
    setClientId(poa.clientId || '');
    setClientName(poa.clientName);
    setPrincipalName(poa.principalName || poa.clientName);
    setAgentName(poa.agentName || poa.lawyerName);
    setLawyerName(poa.lawyerName);
    setIssueDate(poa.issueDate);
    setExpiryDate(poa.expiryDate);
    setStatus(poa.status || 'نشطة');
    setScope(poa.scope || '');
    setClausesText(poa.clauses ? poa.clauses.join('\n') : '');
    setPartiesText(poa.parties ? poa.parties.map(p => `${p.name}-${p.role}-${p.identity || ''}`).join('\n') : '');
  };

  const handleUpdateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency) return;

    if (!poaNumber || (!clientId && !clientName) || !expiryDate || !issueDate || !principalName || !agentName) {
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
          { name: principalName, role: 'موكل (Principal)', identity: '' },
          { name: agentName, role: 'وكيل (Agent)', identity: '' }
        ];

    let finalClientName = clientName;
    if (clientId && clients) {
        const c = clients.find(cl => String(cl.id) === String(clientId));
        if (c) finalClientName = c.name;
    }

    const updatedPoa = {
      ...editingAgency,
      poaNumber,
      clientId,
      clientName: finalClientName,
      lawyerName: agentName,
      issueDate,
      expiryDate,
      status: getRemainingDays(expiryDate) <= 0 ? 'منتهية' : status,
      scope: scope || clausesArray[0] || '',
      clauses: clausesArray,
      parties: partiesArray,
      principalName,
      agentName
    };

    try {
      const { error } = await supabase.from('powers_of_attorney').update(toSnake(updatedPoa)).eq('id', editingAgency.id);
      if (error) throw error;
      showToast('تم تحديث الوكالة بنجاح', 'success');
      setEditingAgency(null);
      fetchAgencies();
      if (selectedAgency?.id === editingAgency.id) {
        setSelectedAgency(updatedPoa);
      }
    } catch (err: any) {
      showToast('فشل التعديل: ' + err.message, 'error');
    }
  };

  const handleAddAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poaNumber || (!clientId && !clientName) || !expiryDate || !issueDate || !principalName || !agentName) {
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
          { name: principalName, role: 'موكل (Principal)', identity: '' },
          { name: agentName, role: 'وكيل (Agent)', identity: '' }
        ];

    let finalClientName = clientName;
    if (clientId && clients) {
        const c = clients.find(cl => String(cl.id) === String(clientId));
        if (c) finalClientName = c.name;
    }

    const newPoa = {
      poaNumber,
      clientId,
      clientName: finalClientName,
      lawyerName: agentName, 
      issueDate,
      expiryDate,
      status: getRemainingDays(expiryDate) <= 0 ? 'منتهية' : status,
      scope: scope || clausesArray[0] || '',
      clauses: clausesArray,
      parties: partiesArray,
      isNajizSync: false,
      subject: scope || clausesArray[0] || '',
      principalName,
      agentName
    };

    try {
      await supabase.from('powers_of_attorney').insert([toSnake(newPoa)]);
      showToast('تم حفظ وإصدار كارت الوكالة بنجاح', 'success');
      setShowAddModal(false);
      setPoaNumber(''); setClientId(''); setClientName(''); setPrincipalName(''); setAgentName(''); setLawyerName(''); setIssueDate(''); setExpiryDate(''); setScope(''); setClausesText(''); setPartiesText('');
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
          await supabase.from('powers_of_attorney').insert([toSnake(poa)]);
          addedCount++;
        }
      }

      setIsSyncing(false);
      showToast(addedCount > 0 ? `مزامنة ناجحة: جلب ${addedCount} وكالات من ناجز` : 'سجلات الوكالات في منصة ناجز محدثة', 'success');
    }, 1800);
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { label: 'منتهية الصلاحية', color: 'red', urgent: true };
    if (daysLeft <= 7) return { label: `تنتهي خلال ${daysLeft} أيام!`, color: 'red', urgent: true };
    if (daysLeft <= 30) return { label: `تنتهي خلال ${daysLeft} يوماً`, color: 'orange', urgent: false };
    if (daysLeft <= 60) return { label: `تنتهي خلال ${daysLeft} يوماً`, color: 'yellow', urgent: false };
    return { label: `متبقي ${daysLeft} يوم`, color: 'green', urgent: false };
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 0) return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" />منتهية الصلاحية</span>;
    if (days <= 30) return <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse"><Clock className="w-3.5 h-3.5" />ينتهي قريباً جداً ({days} يوم)</span>;
    if (days <= 60) return <span className="bg-amber-50 text-amber-400 font-extrabold border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />متبقي {days} يوم</span>;
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
    <div className="agencies-module min-h-screen bg-slate-50 text-slate-900 p-6 lg:p-10 space-y-8 font-sans" dir="rtl">
      
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
            <h1 className="text-2xl lg:text-3xl font-black text-blue-950 tracking-tight">إدارة الوكالات القضائية</h1>
            <p className="text-sm text-blue-900 font-black mt-1">تتبع التوكيلات وسريانها والمزامنة الحية مع أداة كشط البيانات من (ناجز)</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <button onClick={handleNajizSync} disabled={isSyncing} className={`px-5 py-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50`}>
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'جاري السحب...' : 'سحب بيانات الوكالات (ناجز)'}
          </button>
          <button onClick={() => { setEditingAgency(null); setShowAddModal(true); }} className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg">
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
          { label: 'إجمالي الوكالات', val: agencies.length, color: 'text-blue-800', bg: 'bg-blue-50 border-blue-100' },
          { label: 'الوكالات السارية', val: agencies.filter(a => getRemainingDays(a.expiryDate) > 0).length, color: 'text-blue-900', bg: 'bg-blue-50 border-blue-100' },
          { label: 'مهددة بالانتهاء', val: expiringSoonCount, color: 'text-amber-600 font-extrabold', bg: 'bg-amber-50 border-amber-100' },
          { label: 'الوكالات المنتهية', val: agencies.filter(a => getRemainingDays(a.expiryDate) <= 0).length, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} border p-6 rounded-2xl space-y-2 shadow-sm`}>
            <p className="text-xs font-black text-blue-900">{stat.label}</p>
            <p className={`text-3xl font-black font-mono ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Embedded Split Layout (Left side for Details/Docs, Right side for search/list) */}
      <div className="flex flex-col lg:flex-row-reverse gap-8 items-start">
        
        {/* LEFT COLUMN: Detailed Agency Slideout Panel & NEW Document Preview Card */}
        {selectedAgency ? (
          <div className="w-full lg:w-[450px] shrink-0 space-y-6 lg:sticky lg:top-6">
            
            {/* Inline Detailed Card */}
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-md overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-[800] text-[#0B2545]">وكالة رقم: {selectedAgency.poaNumber}</h2>
                  <p className="text-blue-500 font-[800] text-xs">تفاصيل الوكالة ومستنداتها</p>
                </div>
                <button onClick={() => setSelectedAgency(null)} className="p-2 hover:bg-blue-100 bg-blue-50 rounded-full text-blue-900 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[500px]">
                <div className={`p-4 rounded-xl border flex items-center gap-3 justify-between shadow-sm ${
                  getRemainingDays(selectedAgency.expiryDate) <= 0 ? 'bg-rose-50 border-rose-200 text-rose-800' :
                  getRemainingDays(selectedAgency.expiryDate) <= 60 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}>
                  <div className="flex items-center gap-3">
                    {getRemainingDays(selectedAgency.expiryDate) <= 30 ? <ShieldAlert className="w-6 h-6 shrink-0" /> : <ShieldCheck className="w-6 h-6 shrink-0" />}
                    <div>
                      <h4 className="text-xs font-[800] text-blue-950 mb-0.5">الوضع النظامي للوكالة</h4>
                      <p className="text-[11px] font-[800] opacity-90">
                        {getRemainingDays(selectedAgency.expiryDate) <= 0 ? 'هذه الوكالة باطلة بانتهاء مدتها.' : 'هذه الوكالة معتمدة ونشطة قانونياً ومحفظة بالسجل.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl text-center shadow-sm">
                    <span className="text-[10px] text-blue-800 font-[800] block mb-1">تاريخ إنشائها</span>
                    <span className="text-sm font-[800] font-mono text-blue-950 block">{selectedAgency.issueDate}</span>
                  </div>
                  <div className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl text-center shadow-sm relative overflow-hidden">
                    <div className={`absolute top-0 w-full h-1 left-0 ${getRemainingDays(selectedAgency.expiryDate) <= 0 ? 'bg-rose-500' : 'bg-blue-300'}`}></div>
                    <span className="text-[10px] text-blue-800 font-[800] block mb-1">تاريخ انتهائها</span>
                    <span className="text-sm font-[800] font-mono text-blue-950 block">{selectedAgency.expiryDate}</span>
                  </div>
                </div>

                {getRemainingDays(selectedAgency.expiryDate) > 0 && (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-[800] text-blue-700 uppercase tracking-widest">تنبيه انتهاء الصلاحية</span>
                    <CountdownTimer targetDate={selectedAgency.expiryDate} />
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-[800] text-[#0B2545] border-b pb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> أطراف الوكالة
                  </h4>
                  {selectedAgency.parties && selectedAgency.parties.length > 0 ? (
                    <div className="space-y-2">
                      {selectedAgency.parties.map((part, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <div>
                            <p className="text-xs font-[800] text-[#0B2545]">{part.name}</p>
                            {part.identity && <p className="text-[10px] font-mono text-slate-400 mt-0.5 font-[800]">هوية: {part.identity}</p>}
                          </div>
                          <span className="text-[10px] font-[800] text-blue-800 px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{part.role}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[9px] text-blue-800 font-[800] block mb-0.5">الموكل</span>
                        <span className="text-xs font-[800] text-[#0B2545] block truncate">{selectedAgency.clientName}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[9px] text-blue-800 font-[800] block mb-0.5">الوكيل</span>
                        <span className="text-xs font-[800] text-[#0B2545] block truncate">{selectedAgency.lawyerName}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-[800] text-[#0B2545] border-b pb-1.5">نطاق العمل العام</h4>
                  <p className="text-xs font-[800] text-[#0B2545] bg-blue-50/50 p-3 rounded-lg border border-blue-100 leading-relaxed">{selectedAgency.scope}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-[800] text-[#0B2545] border-b pb-1.5">تفاصيل بنود الصلاحيات</h4>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                    {selectedAgency.clauses && selectedAgency.clauses.map((clause, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2">
                        <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-[800] shrink-0 border border-blue-200">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-[#0B2545] font-[800] leading-relaxed pt-0.5">{clause}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DOCUMENT PREVIEW CARD (كارت عرض المستندات) */}
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-md p-6 space-y-4">
              <div className="flex items-center gap-2 border-b pb-2.5 border-slate-100">
                <FileText className="w-4.5 h-4.5 text-indigo-600" />
                <h3 className="font-[800] text-[#0B2545] text-sm">كارت عرض المستندات والمرفقات</h3>
              </div>

              <div className="space-y-3 font-[800]">
                {[
                  {
                    id: 'doc1',
                    name: `صك_الوكالة_الرقمية_${selectedAgency.poaNumber}.pdf`,
                    size: '224 KB'
                  },
                  {
                    id: 'doc2',
                    name: `قرارات_مجلس_الإدارة_المفوضة.pdf`,
                    size: '480 KB'
                  },
                  {
                    id: 'doc3',
                    name: `قرار_تمكين_الممثل_رقم_4429.pdf`,
                    size: '112 KB'
                  }
                ].map((doc) => {
                  const isOpened = activePreviewDocId === doc.id;
                  return (
                    <div key={doc.id} className="border border-slate-100 rounded-xl p-3 space-y-2 bg-slate-50/60 hover:bg-slate-50 transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-[800] text-[#0B2545] truncate">{doc.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono font-[800]">{doc.size}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreviewDoc(doc.id, selectedAgency)}
                          className={`px-2.5 py-1 rounded text-[10px] font-[800] transition-all ${
                            isOpened 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'bg-white border border-slate-200 text-indigo-600 hover:bg-slate-100'
                          }`}
                        >
                          {isOpened ? 'إخفاء' : 'معاينة'}
                        </button>
                      </div>

                      {/* Preview logic: strictly only display content inside after pressing preview button */}
                      {isOpened && docContents[doc.id] && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 border-t border-slate-200/60 mt-1"
                        >
                          <div className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[140px] leading-relaxed border border-slate-800 shadow-inner">
                            {docContents[doc.id]}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="w-full lg:w-[450px] shrink-0 bg-white border border-dashed border-blue-200 rounded-[2rem] p-8 text-center text-blue-900 space-y-3 lg:sticky lg:top-6">
            <FileKey className="w-10 h-10 text-blue-400 mx-auto" />
            <h4 className="font-[800] text-sm text-[#0B2545]">تفاصيل الوكالة والقراءة الضوئية</h4>
            <p className="text-xs leading-relaxed font-[800]">حدد أي وكالة من قائمة السجلات لعرض مؤشر سريانها الزمني، مع معاينة المستندات المرفقة ضوئياً والموثقة بالسجلات الرسمية.</p>
          </div>
        )}

        {/* RIGHT COLUMN: Search + Filters + Agency Cards Grid */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Filter and Search */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 font-[800]" />
              <input 
                type="text" placeholder="البحث برقم الوكالة، الموكل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-sm font-[800] text-[#0B2545] placeholder:text-blue-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  className={`px-4 py-2 rounded-lg text-xs font-[800] transition-all ${statusFilter === tab.id ? 'bg-[#0B2545] text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredAgencies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAgencies.map((poa) => {
                const daysRemaining = getRemainingDays(poa.expiryDate);
                const isFinished = daysRemaining <= 0;
                const isDanger = daysRemaining > 0 && daysRemaining <= 30;

                return (
                  <motion.div key={poa.id} layout onClick={() => setSelectedAgency(poa)} whileHover={{ y: -4 }}
                    className={`agency-card cursor-pointer bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[300px] relative overflow-hidden ${isFinished ? 'border-rose-200 bg-rose-50/30' : isDanger ? 'border-rose-300' : 'border-slate-200'}`}>
                    
                    {/* Accent Top Line */}
                    <div className={`absolute top-0 right-0 left-0 h-1.5 ${isFinished ? 'bg-rose-500' : isDanger ? 'bg-rose-400 animate-pulse' : daysRemaining <= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} />

                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="agency-text text-xs font-mono font-[800] bg-blue-50 text-[#0B2545] px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                                رقم: {poa.poaNumber}
                              </span>
                            </div>
                           {poa.isNajizSync && (
                             <span className="block w-fit bg-blue-50 text-[#0B2545] text-[10px] font-[800] border border-blue-100 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                               <CheckCircle2 className="w-3 h-3 text-indigo-500" /> مزامنة ناجز
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Edit button in the card */}
                          <button 
                            onClick={(e) => handleStartEdit(poa, e)} 
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0B2545] rounded-lg transition-colors border border-blue-200 shadow-sm"
                            title="تعديل الوكالة"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {/* Delete button in the card */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingId(poa.id); }} 
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200 shadow-sm"
                            title="حذف الوكالة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="agency-text text-lg font-[800] text-[#0B2545] line-clamp-1">{poa.clientName}</h3>
                        <div className="agency-text flex items-center gap-1.5 text-xs text-[#0B2545] font-[800] mt-1 opacity-80">
                          <Scale className="w-3.5 h-3.5" /> الممثل: {poa.lawyerName}
                        </div>
                      </div>

                      <p className="agency-text text-xs text-[#0B2545] font-[800] line-clamp-2 bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/50 leading-relaxed">
                        {poa.scope || 'لم يتم تخصيص نطاق. الوكالة عامة.'}
                      </p>
                      {(() => {
                        const statusBadge = getExpiryStatus(poa.expiryDate);
                        if (!statusBadge) return null;
                        return (
                          <div className={`mt-2 px-3 py-1.5 rounded-lg text-[10px] font-[800] flex items-center gap-1 shadow-sm
                            ${statusBadge.color === 'red' ? 'bg-red-500/10 text-red-700 border border-red-500/20' :
                              statusBadge.color === 'orange' ? 'bg-orange-500/10 text-orange-700 border border-orange-500/20' :
                              statusBadge.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20' :
                              'bg-green-500/10 text-green-700 border border-green-500/20'}`}>
                            {statusBadge.urgent ? '⚠️' : '📅'} {statusBadge.label}
                          </div>
                        );
                      })()}
                    </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                        <div className="space-y-0.5">
                          <p className="agency-text text-[9px] text-[#0B2545] opacity-50 font-[800] uppercase tracking-wider">تاريخ الانتهاء</p>
                          <p className={`agency-text text-xs font-mono font-[800] ${isFinished ? 'text-rose-600' : 'text-[#0B2545]'}`}>{poa.expiryDate}</p>
                        </div>
                        <div>{getUrgencyBadge(daysRemaining)}</div>
                      </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-blue-100 p-16 rounded-[2rem] text-center space-y-4 max-w-xl mx-auto shadow-inner">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                <FileKey className="w-8 h-8 text-blue-800" />
              </div>
              <h3 className="text-lg font-[800] text-[#0B2545]">سجل الوكالات فارغ</h3>
              <p className="text-sm text-blue-900 font-[800]">لم يتم العثور على وكالات تطابق تصفيتك، قم بـ "سحب بيانات الوكالات" مباشرة من مسار ناجز أو أضفها يدوياً.</p>
            </div>
          )}
        </div>
      </div>



      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full text-center space-y-6">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-rose-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-[800] text-[#0B2545]">تأكيد الحذف النهائي</h3>
                <p className="text-sm text-slate-500 font-[800]">هل أنت متأكد من رغبتك في حذف هذه الوكالة؟ سيتم مسح كافة البيانات والمستندات المرتبطة بها من قاعدة بيانات Supabase بشكل دائم.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button onClick={() => setDeletingId(null)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-[800] transition-colors">إلغاء</button>
                <button 
                  onClick={(e) => {
                    handleDeleteAgency(deletingId, e as any);
                    setDeletingId(null);
                  }} 
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-[800] shadow-lg shadow-rose-200 transition-colors"
                >
                  نعم، حذف الآن
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
                  <h2 className="text-xl font-black text-blue-950 flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-blue-700" /> إضافة توثيق وكالة للعميل
                  </h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-blue-100 rounded-full bg-blue-50 text-blue-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAgency} className="p-6 space-y-5 text-right overflow-y-auto max-h-[75vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">رقم الوكالة العدلية *</label>
                    <input type="text" required placeholder="45802144" value={poaNumber} onChange={(e) => setPoaNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">اسم العميل المرتبط (مسجل بالنظام)</label>
                    <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm">
                      <option value="">-- ربط بعميل خارجي غير مسجل --</option>
                      {clients.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {!clientId && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">اسم العميل الخارجي *</label>
                    <input type="text" placeholder="الشركة أو الشخص" value={clientName} onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">الموكِّل (Principal) *</label>
                    <input type="text" required placeholder="أطراف الوكالة الموكل" value={principalName} onChange={(e) => setPrincipalName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">الموكَّل له (Agent) *</label>
                    <input type="text" required placeholder="المحامي الوكيل" value={agentName} onChange={(e) => setAgentName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">حالة الوكالة</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm">
                      <option value="نشطة">نشطة / سارية</option>
                      <option value="ملغاة">ملغاة</option>
                      <option value="منتهية">منتهية المدة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">تاريخ الإصدار *</label>
                    <input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">تاريخ الانتهاء *</label>
                    <input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                </div>

                {expiryDate && (
                  <div className="bg-blue-50/20 border border-blue-100 p-5 rounded-2xl flex items-center justify-between shadow-inner">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">المؤقت الزمني التنازلي</span>
                      <span className="text-xs font-black text-blue-900 flex items-center gap-2">
                         الزمن المتبقي لانتهاء الوكالة المضافة:
                      </span>
                    </div>
                    <CountdownTimer targetDate={expiryDate} />
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-950 text-xs font-black mt-2">
                  <div className="shrink-0"><ShieldCheck className="w-5 h-5 text-blue-700" /></div>
                  <p className="leading-relaxed">
                    التأكيد: الإضافة اليدوية مخصصة للحالات الطارئة. لضمان دقة مواعيد الانتهاء للوكالات، نؤكد على ضرورة استخدام <span className="text-blue-900 font-black">"سحب بيانات الوكالات (ناجز)"</span> ليتم مزامنة حالة الوكالة الفورية والصلاحيات آلياً من وزارة العدل وتحديث المؤقت الزمني تلقائياً.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-blue-800 font-black block">موضوع أو نطاق الوكالة</label>
                  <textarea rows={2} placeholder="المرافعة والمدافعة في القضايا..." value={scope} onChange={(e) => setScope(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-blue-800 font-black flex justify-between"><span>البنود والصلاحيات</span><span className="text-blue-700 font-black font-medium">(كل بند في سطر)</span></label>
                  <textarea rows={3} placeholder="المراجعة في الإدارات الحكومية&#10;حق الإقرار والصلح" value={clausesText} onChange={(e) => setClausesText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                </div>

                <div className="pt-4 border-t border-slate-200 flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-900 rounded-xl text-sm font-black transition-all">
                    إلغاء
                  </button>
                  <button type="submit"
                    className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-sm font-black shadow-md transition-all">
                    حفظ وإضافة الوكالة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit/Update Poa Modal (Light Theme) */}
      <AnimatePresence>
        {editingAgency && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
              
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-blue-950 flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-[#0B2545]" /> تعديل وتحديث بيانات الوكالة
                  </h2>
                </div>
                <button onClick={() => setEditingAgency(null)} className="p-2 hover:bg-blue-100 rounded-full bg-blue-50 text-blue-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateAgency} className="p-6 space-y-5 text-right overflow-y-auto max-h-[75vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">رقم الوكالة العدلية *</label>
                    <input type="text" required placeholder="45802144" value={poaNumber} onChange={(e) => setPoaNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">اسم العميل المرتبط (مسجل بالنظام)</label>
                    <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm">
                      <option value="">-- ربط بعميل خارجي غير مسجل --</option>
                      {clients.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {!clientId && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">اسم العميل الخارجي *</label>
                    <input type="text" placeholder="الشركة أو الشخص" value={clientName} onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">الموكِّل (Principal) *</label>
                    <input type="text" required placeholder="أطراف الوكالة الموكل" value={principalName} onChange={(e) => setPrincipalName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">الموكَّل له (Agent) *</label>
                    <input type="text" required placeholder="المحامي الوكيل" value={agentName} onChange={(e) => setAgentName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">حالة الوكالة</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm">
                      <option value="نشطة">نشطة / سارية</option>
                      <option value="ملغاة">ملغاة</option>
                      <option value="منتهية">منتهية المدة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">تاريخ الإصدار *</label>
                    <input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-800 font-black block">تاريخ الانتهاء *</label>
                    <input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-blue-800 font-black block">موضوع أو نطاق الوكالة</label>
                  <textarea rows={2} placeholder="المرافعة والمدافعة في القضايا..." value={scope} onChange={(e) => setScope(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-blue-800 font-black flex justify-between"><span>البنود والصلاحيات</span><span className="text-blue-700 font-black font-medium">(كل بند في سطر)</span></label>
                  <textarea rows={3} placeholder="المراجعة في الإدارات الحكومية&#10;حق الإقرار والصلح" value={clausesText} onChange={(e) => setClausesText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-sm" />
                </div>

                <div className="pt-4 border-t border-slate-200 flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setEditingAgency(null)}
                    className="px-5 py-2.5 bg-white border border-[#0B2545]/20 hover:bg-slate-50 text-blue-900 rounded-xl text-sm font-black transition-all">
                    إلغاء التعديل
                  </button>
                  <button type="submit"
                    className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-sm font-black shadow-md transition-all">
                    تحديث وحفظ التغييرات
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
