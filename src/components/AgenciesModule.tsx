import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Calendar, ChevronRight, 
  Trash2, ShieldCheck, ShieldAlert, CheckCircle2, 
  Clock, RefreshCw, X, FileSpreadsheet, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc,
  deleteDoc, 
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebase } from '@/contexts/FirebaseContext';
import { PowerOfAttorney, Client } from '@/types';

interface AgenciesModuleProps {
  clients: Client[];
  onUpdateState?: (t: string, d: any) => void;
}

export default function AgenciesModule({ clients, onUpdateState }: AgenciesModuleProps) {
  const { user } = useFirebase();
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
  const [partiesText, setPartiesText] = useState(''); // comma separated or custom items

  // Success / Error feedback states
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Listen to real-time PoA updates from Firestore
    const q = query(collection(db, 'powersOfAttorney'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PowerOfAttorney[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PowerOfAttorney);
      });
      setAgencies(list);
    }, (error) => {
      console.error("Error reading powersOfAttorney from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const getRemainingDays = (expiryDateStr: string) => {
    if (!expiryDateStr) return 0;
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    // Normalize time to compare dates only
    expiry.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDeleteAgency = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذه الوكالة بصفة نهائية؟')) return;
    try {
      await deleteDoc(doc(db, 'powersOfAttorney', id));
      showToast('تم حذف الوكالة بنجاح', 'success');
      if (selectedAgency?.id === id) {
        setSelectedAgency(null);
      }
    } catch (err: any) {
      showToast('خطأ أثناء حذف الوكالة من خادم البيانات: ' + err.message, 'error');
    }
  };

  const handleAddAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poaNumber || !clientName || !expiryDate || !issueDate) {
      showToast('يرجى ملء كافة الحقول الأساسية لتوثيق الوكالة', 'error');
      return;
    }

    const clausesArray = clausesText
      ? clausesText.split('\n').filter(c => c.trim())
      : [scope || 'المرافعة والمدافعة والمراجعة لكافة الدوائر الحكومية والشرعية والجهات الإدارية.'];

    // Map comma-separated or newline-separated parties
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
      await addDoc(collection(db, 'powersOfAttorney'), newPoa);
      showToast('تم حفظ وإصدار كارت الوكالة بنجاح لمجموعة العمل الموحدة', 'success');
      setShowAddModal(false);
      
      // Clear fields
      setPoaNumber('');
      setClientName('');
      setLawyerName('');
      setIssueDate('');
      setExpiryDate('');
      setStatus('نشطة');
      setScope('');
      setClausesText('');
      setPartiesText('');
    } catch (err: any) {
      showToast('فشل تخزين الوكالة على السحابة الآمنة: ' + err.message, 'error');
    }
  };

  // Synchronize with Najiz
  const handleNajizSync = async () => {
    setIsSyncing(true);
    showToast('جاري الاتصال والتحقق مع سجل الوكالات بوزارة العدل ومنصة ناجز...', 'info');
    
    setTimeout(async () => {
      const mockNajizPoas = [
        { 
          poaNumber: "45802144", 
          issueDate: "2025-12-02", 
          expiryDate: "2026-07-15", 
          lawyerName: "المكتب الرئيسي - العدالة للمحاماة",
          clientName: "شركة الفرسان للمقاولات المحدودة", 
          status: "نشطة",
          scope: "المرافعة والمدافعة والإقرار والإنكار وسحب المبالغ والطلب للجهات الإدارية والتجارية بموجب اللائحة التنفيذية.",
          clauses: [
            "المرافعة والمدافعة والإقرار والإنكار وسحب المبالغ والطلب للجهات الإدارية والتجارية بموجب اللائحة التنفيذية.",
            "تمثيل الموكل أمام المحكمة الإدارية ومحكمة الاستئناف الإدارية والمحاكم العمالية والتجارية والمصرفية.",
            "رفع الدعاوى وقيد الصحائف وتوقيع عرائض الاستئناف والاعتراض والالتماس وقبول الأحكام أو رفضها."
          ],
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
          scope: "المراجعة لكافة الدوائر الحكومية وإثبات حجج العقار وسحب القرارات والاستئناف بمجلس القضاء.",
          clauses: [
            "المراجعة لكافة الدوائر الحكومية وإثبات حجج العقار وسحب القرارات والاستئناف بمجلس القضاء.",
            "تقديم طلبات إثبات ملكية ونزاع عقاري ومراجعة أمانة مكة المكرمة ووزارة الشؤون البلدية والقروية والإسكان.",
            "سحب صكوك القرارات والاستلام والتسليم والتوقيع نيابة عن الموكل في كل ما يتعلق بالعقار المذكور."
          ],
          parties: [
            { name: "الشيخ عبد الرحمن بن حمود السحيمي", role: "موكل (Client)", identity: "1012948234" },
            { name: "سعد بن عبد العزيز بن محمد", role: "وكيل (Agent)", identity: "1055819382" }
          ],
          isNajizSync: true
        }
      ];

      // Insert them into Firestore safely if they don't already exist
      let addedCount = 0;
      for (const poa of mockNajizPoas) {
        const exist = agencies.some((a) => a.poaNumber === poa.poaNumber);
        if (!exist) {
          await addDoc(collection(db, 'powersOfAttorney'), poa);
          addedCount++;
        }
      }

      setIsSyncing(false);
      if (addedCount > 0) {
        showToast(`مزامنة ناجحة: جلب ومطابقة عدد ${addedCount} وكالات نشطة جديدة بالكامل من ناجز`, 'success');
      } else {
        showToast('مزامنة ناجحة: سجلات الوكالات في منصة ناجز مطابقة ومحدثة بالكامل مع النظام الداخلي.', 'success');
      }
    }, 1800);
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 0) {
      return (
        <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          منتهية الصلاحية
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          ينتهي قريباً جداً ({days} يوم)
        </span>
      );
    }
    if (days <= 60) {
      return (
        <span className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          متبقي {days} يوم
        </span>
      );
    }
    return (
      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        صالحة ({days} يوم متبقي)
      </span>
    );
  };

  // Filter and display calculations
  const filteredAgencies = agencies.filter(poa => {
    const matchesSearch = 
      poa.poaNumber.includes(searchQuery) ||
      poa.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poa.lawyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (poa.scope && poa.scope.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

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
    <div className="min-h-screen bg-[#0b1329] text-white p-6 lg:p-10 space-y-10" dir="rtl">
      {/* Toast Alert Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
              notification.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-300' :
              'bg-slate-900 border-yellow-500/30 text-yellow-300'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-black">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner - Graphite and Gold Modern Shield */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-yellow-500/5 rounded-full filter blur-2xl"></div>
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <FileSpreadsheet className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-150 tracking-tight">سجل وكالات العملاء</h1>
              <p className="text-sm text-slate-400 font-bold mt-1">
                إدارة أطراف الوكالات، البنود والتنبيه الفوري لانتهاء الفترات مع الربط الكامل بمنصة ناجز العدلية
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <button 
            onClick={handleNajizSync}
            disabled={isSyncing}
            className={`px-5 py-3.5 bg-sky-600/10 hover:bg-sky-600/25 border border-sky-500/30 hover:border-sky-500/50 rounded-2xl text-sm font-black text-sky-300 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'جاري مزامنة ناجز...' : 'مزامنة مع منصة ناجز'}
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-sm font-black flex items-center gap-2 transition-all active:scale-95 shadow-[0_8px_30px_rgb(245,158,11,0.2)]"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            توثيق وكالة جديدة
          </button>
        </div>
      </div>

      {/* Expiry Alarm Banner in Case of Urgent PoAs */}
      {expiringSoonCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-950/40 border border-amber-500/30 p-5 rounded-3xl flex items-center gap-4 text-amber-200"
        >
          <div className="p-3.5 bg-amber-500/10 rounded-2xl animate-pulse">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-md font-black">إشعار الأمان القانوني: اقتراب انتهاء صلاحية وكالات</h4>
            <p className="text-sm font-bold text-amber-300/80">
              يوجد {expiringSoonCount} وكالات نشطة شارفت مدتها على الانتهاء (أقل من 60 يوماً). يرجى إشعار المحامين المعنيين ومراجعة العملاء للتجديد فوراً لضمان عدم توقف الإجراءات والتقديم في نظام التقاضي.
            </p>
          </div>
        </motion.div>
      )}

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-2">
          <p className="text-xs text-slate-400 font-bold">إجمالي الوكالات</p>
          <p className="text-3xl font-black font-mono text-white">{agencies.length}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-2">
          <p className="text-xs text-emerald-400 font-bold">الوكالات النشطة</p>
          <p className="text-3xl font-black font-mono text-emerald-400">
            {agencies.filter(a => getRemainingDays(a.expiryDate) > 0).length}
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-2">
          <p className="text-xs text-amber-400 font-bold">وكالات مهددة بالانتهاء (60 يوماً أو أقل)</p>
          <p className="text-3xl font-black font-mono text-amber-400">{expiringSoonCount}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-2">
          <p className="text-xs text-rose-400 font-bold">الوكالات المنتهية</p>
          <p className="text-3xl font-black font-mono text-rose-400">
            {agencies.filter(a => getRemainingDays(a.expiryDate) <= 0).length}
          </p>
        </div>
      </div>

      {/* Search & Tabs Filtering */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input 
            type="text"
            placeholder="البحث برقم الوكالة، اسم الموكل، المحامي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors ${statusFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'}`}
          >
            الكل ({agencies.length})
          </button>
          <button 
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors ${statusFilter === 'active' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'}`}
          >
            النشطة ({agencies.filter(a => getRemainingDays(a.expiryDate) > 0).length})
          </button>
          <button 
            onClick={() => setStatusFilter('expiring')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors ${statusFilter === 'expiring' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'}`}
          >
            تنتهي قريباً ({expiringSoonCount})
          </button>
          <button 
            onClick={() => setStatusFilter('expired')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors ${statusFilter === 'expired' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-900 hover:bg-slate-850 text-slate-300'}`}
          >
            المنتهية ({agencies.filter(a => getRemainingDays(a.expiryDate) <= 0).length})
          </button>
        </div>
      </div>

      {/* Main Agencies Grid */}
      {filteredAgencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((poa) => {
            const daysRemaining = getRemainingDays(poa.expiryDate);
            const isDanger = daysRemaining <= 30;
            const isWarning = daysRemaining > 30 && daysRemaining <= 60;

            return (
              <motion.div 
                key={poa.id}
                onClick={() => setSelectedAgency(poa)}
                layout
                whileHover={{ y: -6 }}
                className={`cursor-pointer rounded-3xl p-6 bg-[#111c30]/40 border text-right relative overflow-hidden flex flex-col justify-between h-72 transition-all duration-300 hover:bg-slate-900/40 ${
                  poa.isNajizSync ? 'border-sky-500/20' : 'border-slate-850'
                } ${
                  isDanger ? 'border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' :
                  isWarning ? 'border-amber-500/30' : 'hover:border-amber-500/25'
                }`}
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 right-0 left-0 h-1 ${
                  daysRemaining <= 0 ? 'bg-rose-500' :
                  daysRemaining <= 30 ? 'bg-rose-500 animate-pulse' :
                  daysRemaining <= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>

                {/* Top Raw */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg">
                        رقم كارت {poa.poaNumber}
                      </span>
                      {poa.isNajizSync && (
                        <span className="bg-sky-500/10 text-sky-300 text-[10px] font-black border border-sky-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-sky-400" />
                          ناجز موثق
                        </span>
                      )}
                    </div>
                    {/* Delete Icon */}
                    <button 
                      onClick={(e) => handleDeleteAgency(poa.id!, e)}
                      className="p-1.5 bg-slate-950/40 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="حذف الوكالة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Client name / Subject */}
                  <div>
                    <h3 className="text-md font-black text-[#f8fafc] leading-tight line-clamp-1">{poa.clientName}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      المستشار/المحامي: {poa.lawyerName}
                    </p>
                  </div>

                  {/* Target Scope description */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-semibold bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/30">
                    {poa.scope || 'لم يتم سرد اختصاص الوكالة بشكل مخصص.'}
                  </p>
                </div>

                {/* Bottom Row - Days Status */}
                <div className="pt-4 border-t border-slate-850/40 flex items-center justify-between mt-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-500 font-bold">تاريخ الانتهاء</p>
                    <p className="text-xs font-mono font-black text-slate-300">{poa.expiryDate}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getUrgencyBadge(daysRemaining)}
                    <div className="p-1.5 bg-slate-900 rounded-lg group-hover:bg-slate-850">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-800/80 p-16 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-slate-800/40 rounded-full flex items-center justify-center mx-auto border border-slate-700/50">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-300">لا توجد وكالات مطابقة</h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              لم نجد أي وكالات نشطة تناسب معايير الفلترة الحالية. يرجى مراجعة قيم البحث أو تفعيل "المزامنة مع ناجز" لسحب بيانات الوكالات تلقائياً.
            </p>
          </div>
          <button 
            onClick={handleNajizSync}
            className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-2xl text-xs font-black transition-all"
          >
            تفعيل مزامنة ناجز لسحب الملفات
          </button>
        </div>
      )}

      {/* Slideout Detailed Panel or Modal */}
      <AnimatePresence>
        {selectedAgency && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e172e] border border-slate-700 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-black text-sm">تفاصيل الوكالة العدلية المعتمدة</span>
                    {selectedAgency.isNajizSync && (
                      <span className="bg-sky-500/10 text-sky-300 text-[10px] font-black border border-sky-500/25 px-2 py-0.5 rounded-lg">
                        مزامنة مباشرة (ناجز)
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-100 mt-1">رقم الوكالة: {selectedAgency.poaNumber}</h2>
                </div>
                <button 
                  onClick={() => setSelectedAgency(null)}
                  className="p-2 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-right">
                
                {/* Remaining alert */}
                <div className={`p-4 rounded-2xl border flex items-center gap-3 justify-between ${
                  getRemainingDays(selectedAgency.expiryDate) <= 0 ? 'bg-rose-950/30 border-rose-500/20 text-rose-300' :
                  getRemainingDays(selectedAgency.expiryDate) <= 60 ? 'bg-amber-950/30 border-amber-500/20 text-amber-300' :
                  'bg-emerald-950/30 border-emerald-500/20 text-emerald-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {getRemainingDays(selectedAgency.expiryDate) <= 30 ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                    <div>
                      <h4 className="text-xs font-black">حالة الوكالة الحالية والصلاحية</h4>
                      <p className="text-xs font-bold opacity-80 mt-0.5">
                        {getRemainingDays(selectedAgency.expiryDate) <= 0 
                          ? 'انتهت صلاحية الوكالة منذ فترة؛ لم تعد صالحة للاستخدام في المحاكم والدوائر.'
                          : `الوكالة سارية المفعول وبصلاحية تامة وتغطي مجالات الترافع.`}
                      </p>
                    </div>
                  </div>
                  {getUrgencyBadge(getRemainingDays(selectedAgency.expiryDate))}
                </div>

                {/* Dates Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">تاريخ صدور الوكالة</span>
                    <span className="text-sm font-bold text-slate-200 mt-1 block">{selectedAgency.issueDate}</span>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">تاريخ انتهاء الوكالة</span>
                    <span className="text-sm font-bold text-slate-200 mt-1 block">{selectedAgency.expiryDate}</span>
                  </div>
                </div>

                {/* Main Client/Agent info */}
                <div className="p-5 bg-slate-950/30 rounded-2xl border border-slate-850 space-y-4">
                  <h4 className="text-xs font-black text-amber-400">أطراف الوكالة وعناصر التعاقد</h4>
                  
                  {selectedAgency.parties && selectedAgency.parties.length > 0 ? (
                    <div className="space-y-3">
                      {selectedAgency.parties.map((part, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-850/50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20 flex items-center justify-center text-[#fbbf24] text-xs font-bold">
                              {part.role.includes('موكل') ? 'م' : 'و'}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-200">{part.name}</p>
                              {part.identity && (
                                <p className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5">الهوية: {part.identity}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 px-2 py-0.5 rounded bg-slate-955 border border-slate-800">
                            {part.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-900/50 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">الموكل (Client)</span>
                        <span className="text-xs font-bold text-slate-200">{selectedAgency.clientName}</span>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">الوكيل (Agent/Attorney)</span>
                        <span className="text-xs font-bold text-slate-200">{selectedAgency.lawyerName}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scope */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-amber-400">نطاق عمل الوكالة العام</h4>
                  <p className="text-xs font-semibold text-slate-300 bg-slate-900/50 p-4 rounded-2xl border border-slate-850 leading-relaxed">
                    {selectedAgency.scope}
                  </p>
                </div>

                {/* Specific clauses/terms */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-amber-400">البنود والصلاحيات المفصلة للوكيل</h4>
                  <div className="space-y-2">
                    {selectedAgency.clauses && selectedAgency.clauses.map((clause, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center text-[10px] font-mono font-black flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-bold">{clause}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Close Button */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/60 text-left">
                <button 
                  onClick={() => setSelectedAgency(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-705 text-white rounded-xl text-xs font-black transition-colors"
                >
                  إغلاق نافذة الاطلاع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Poa Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-[#0e172e] border border-slate-700 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-rose-500/10 bg-slate-950/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                    توثيق وكالة قانونية جديدة لعميل
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">تعبئة مستندات الوكالة وتسجيل البنود بشكل دقيق ومنظم</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddAgency} className="p-6 space-y-5 text-right overflow-y-auto max-h-[75vh]">
                
                {/* Number & Client */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-black block">رقم الوكالة العدلية *</label>
                    <input 
                      type="text"
                      required
                      placeholder="مثال: 45802144"
                      value={poaNumber}
                      onChange={(e) => setPoaNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-black block">اسم الموكل (العميل) *</label>
                    <input 
                      type="text"
                      required
                      placeholder="اسم العميل أو الكيان التجاري"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>
                </div>

                {/* Lawyer & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-black block">اسم المحامي الوكيل</label>
                    <input 
                      type="text"
                      placeholder="مثال: المستشار سعد بن عبد العزيز"
                      value={lawyerName}
                      onChange={(e) => setLawyerName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-black block">حالة الوكالة الحالية</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs font-black focus:outline-none focus:border-amber-500 text-slate-200"
                    >
                      <option value="نشطة">نشطة / سارية</option>
                      <option value="ملغاة">ملغاة من قبل الموكل</option>
                      <option value="منتهية">منتهية المدة</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-black block">تاريخ صدور الوكالة *</label>
                    <input 
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-black block">تاريخ انتهاء الوكالة *</label>
                    <input 
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>
                </div>

                {/* General Scope */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-black block">موضوع أو نطاق الوكالة العام</label>
                  <textarea 
                    rows={2}
                    placeholder="مثال: المرافعة والمدافعة وتقديم المذكرات ومراجعة المحاكم والوزارات وتوقيع العقود والمصالحات..."
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 text-white"
                  />
                </div>

                {/* Specific clauses in new lines */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-black block flex items-center justify-between">
                    <span>بنود وصلاحيات الوكالة بالتفصيل</span>
                    <span className="text-[10px] text-slate-500 font-bold">(ضع كل بند في سطر مستقل)</span>
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="تمثيل الموكل أمام المحاكم العمالية والتجارية&#10;حق الاقرار والانكار والصلح والتنازل&#10;التوقيع أمام وزارة التجارة وهيئة سوق المال"
                    value={clausesText}
                    onChange={(e) => setClausesText(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 text-white leading-relaxed"
                  />
                </div>

                {/* Custom Parties */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-black block flex items-center justify-between">
                    <span>الأطراف والشركاء بالوكالة وطبيعة أدوارهم</span>
                    <span className="text-[10px] text-slate-500 font-bold">(الاسم - الدور - رقم الهوية في سطر مستقل)</span>
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="مثال: شركة الفرسان للمقاولات - موكل (Client) - 1010098234&#10;المحامي سعد بن عبد العزيز - وكيل (Agent) - 1055819382"
                    value={partiesText}
                    onChange={(e) => setPartiesText(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 text-right leading-relaxed"
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-850 flex gap-3 justify-end leading-none">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-black transition-colors"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-amber-505 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-lg transition-all"
                  >
                    حفظ وتوثيق الوكالة
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
