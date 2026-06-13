import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, MapPin, Phone, Mail, Award, CheckCircle2, 
  UserCheck, ShieldAlert, Calendar, Flag, Hash, Shield, Briefcase, 
  FileText, Save, Settings as SettingsIcon, Link as LinkIcon, 
  ChevronRight, Lock, Eye, EyeOff, MessageSquare, Send, Database, Globe,
  Trash2, User, GraduationCap, CalendarDays, AtSign, Sparkles, Building2,
  Bookmark, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Case, Task, Employee, Client } from '@/types';

// Static High-Contrast Employee Card with deep dark blue typography and deactivated mouse 3D hover animations
function EmployeeCard3D({ 
  emp, 
  kpi, 
  onEdit, 
  onDelete, 
  onWhatsApp, 
  onCopyLink 
}: { 
  emp: Employee, 
  kpi: any, 
  onEdit: () => void, 
  onDelete: () => void, 
  onWhatsApp: () => void, 
  onCopyLink: () => void 
}) {
  return (
    <div
      className="relative bg-white border-2 border-blue-100 rounded-[2.5rem] overflow-hidden shadow-md p-6 text-blue-950 text-right font-sans flex flex-col justify-between h-[520px] transition-colors duration-200 hover:border-blue-300 hover:shadow-lg"
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-80" />

      {/* Main card section */}
      <div className="space-y-4 relative z-10 flex-1">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Profile Avatar Container */}
            <div className="relative w-14 h-14 shrink-0">
              {emp.avatarUrl ? (
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md">
                  <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-900 to-indigo-850 text-white font-black text-2xl rounded-2xl flex items-center justify-center border border-blue-700 shadow-md">
                  {emp.name ? emp.name.charAt(0) : '?'}
                </div>
              )}
              {/* Status indicator */}
              <span className="absolute -bottom-1 -left-1 flex h-3.5 w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  emp.status === 'إجازة' ? 'bg-amber-400' : emp.status === 'مستقيل' ? 'bg-rose-450' : 'bg-emerald-450'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border border-white ${
                  emp.status === 'إجازة' ? 'bg-amber-550' : emp.status === 'مستقيل' ? 'bg-rose-550' : 'bg-emerald-550'
                }`}></span>
              </span>
            </div>
            <div>
              <h3 className="font-black text-blue-950 text-base tracking-tight leading-snug">{emp.name}</h3>
              <p className="text-blue-900 font-extrabold text-xs flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-700 stroke-[2.5px]" />
                {emp.jobTitle || 'المسمى الوظيفي غير محدد'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-900 rounded-xl transition-all border border-blue-100 active:scale-95 cursor-pointer"
              title="تعديل الموظف وصلاحياته"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-xl transition-all border border-rose-100 active:scale-95 cursor-pointer"
              title="حذف هذا الموظف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Badges Block */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status Badge */}
          <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg border ${
            emp.status === 'إجازة' 
              ? 'bg-amber-50 text-amber-900 border-amber-200' 
              : emp.status === 'مستقيل' 
                ? 'bg-rose-50 text-rose-900 border-rose-200' 
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}>
            {emp.status || 'نشط'}
          </span>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 text-[10px] font-black rounded-lg border border-blue-100">
            {emp.branch || 'كل الفروع'}
          </span>
          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-900 text-[10px] font-black rounded-lg border border-indigo-100">
            {emp.nationality || 'سعودي'}
          </span>
          {emp.username && (
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-900 text-[10px] font-mono rounded-lg border border-purple-100">
              @{emp.username}
            </span>
          )}
        </div>

        {/* Core details mapping exact requested fields */}
        <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 pt-4 border-t border-blue-100 text-[11px] font-bold text-blue-950">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-900 flex items-center gap-1">
              <Hash className="w-3 h-3 text-blue-700" /> رقم الهوية الوطنية
            </p>
            <p className="text-blue-950 font-mono tracking-wider font-extrabold">{emp.nationalId || '—'}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-900 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-blue-700" /> المؤهل الدراسي
            </p>
            <p className="text-blue-950 truncate font-extrabold">{emp.qualification || '—'}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-900 flex items-center gap-1">
              <Phone className="w-3 h-3 text-blue-700" /> رقم الجوال
            </p>
            <p className="text-blue-950 font-mono font-extrabold">{emp.phone || '—'}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-900 flex items-center gap-1">
              <AtSign className="w-3 h-3 text-blue-700" /> الإيميل المباشر
            </p>
            <p className="text-blue-950 truncate font-mono font-extrabold" title={emp.email}>{emp.email || '—'}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-900 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-blue-700" /> تاريخ الميلاد
            </p>
            <p className="text-blue-950 font-mono font-extrabold">{emp.birthDate || '—'}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-900 flex items-center gap-1">
              <User className="w-3 h-3 text-blue-700" /> المدير المباشر
            </p>
            <p className="text-blue-950 truncate font-extrabold">{emp.manager || 'الشريك الإداري'}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-900 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-emerald-600" /> تاريخ بدء العمل
            </p>
            <p className="text-emerald-900 font-mono font-extrabold">{emp.startDate || '—'}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-900 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-rose-600" /> ترك العمل
            </p>
            <p className={`${emp.endDate ? 'text-rose-900 font-black' : 'text-blue-900/60'} font-mono font-extrabold`}>
              {emp.endDate || 'مستمر بالخدمة'}
            </p>
          </div>
        </div>

        {/* Notes Preview */}
        {emp.notes && (
          <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-[10px] text-blue-900 max-h-[48px] overflow-hidden truncate">
            <span className="font-black text-blue-950">ملاحظات: </span>
            {emp.notes}
          </div>
        )}

        {/* Dynamic Performance KPI */}
        <div className="space-y-1.5 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 mt-2">
          <div className="flex justify-between items-center text-[10px] font-black text-blue-900">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-700" /> كفاءة الأداء المكتبي
            </span>
            <span className="text-blue-950 font-mono font-black">{kpi.score}%</span>
          </div>
          <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${kpi.score}%` }}
              className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Primary Actions Area */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-blue-100 relative z-10 shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
          className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 font-black py-3 rounded-xl text-[10px] border border-emerald-200 hover:border-emerald-600 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" /> بوابة واتساب
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onCopyLink(); }}
          className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-800 hover:text-white text-blue-900 font-black py-3 rounded-xl text-[10px] border border-blue-200 hover:border-blue-600 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <LinkIcon className="w-3.5 h-3.5" /> نسخ رابط الدخول
        </button>
      </div>
    </div>
  );
}

export default function EmployeesData({ cases, tasks, clients = [], onUpdateState }: { cases: Case[], tasks: Task[], clients?: Client[], onUpdateState?: (t: string, d: any) => void }) {
  const { user, profile } = useFirebase();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync with Firestore Employees Collection
  useEffect(() => {
    const q = query(collection(db, 'employees'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps: Employee[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(emps);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching employees:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedConfigEmployee, setSelectedConfigEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'portal'>('info');
  
  // Dynamic Form Data state
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (selectedConfigEmployee) {
      setFormData(selectedConfigEmployee);
    } else {
      setFormData({
        name: '',
        nationality: 'سعودي',
        nationalId: '',
        phone: '',
        jobTitle: '',
        birthDate: '',
        qualification: '',
        email: '',
        manager: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        branch: 'الفرع الرئيسي',
        notes: '',
        username: '',
        password: '',
        najizApiKey: '',
        permissions: ['مشاهدة القضايا', 'إضافة مهام', 'إدارة الوثائق'],
        sidebarConfig: ['dashboard', 'cases', 'tasks'],
        assignedCases: [],
        assignedClients: [],
        status: 'نشط',
        avatarUrl: ''
      });
    }
  }, [selectedConfigEmployee, showAddModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getEmployeeKPI = (empName: string) => {
    const empTasks = tasks.filter(t => t.assignedTo?.includes(empName));
    const doneCount = empTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const total = empTasks.length;
    const score = total === 0 ? 0 : Math.round((doneCount / total) * 100);
    return { score, total, done: doneCount };
  };

  const writeAuditLog = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'auditlogs'), {
        action,
        details,
        userId: user?.uid || 'anonymous',
        userName: profile?.name || user?.email || 'نظام العدالة',
        timestamp: new Date().toISOString(),
        type: 'employee_update'
      });
    } catch (e) {
      console.warn("Failed to write audit log:", e);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = formData.id || `EMP-${Date.now().toString().slice(-4)}`;
    
    // 1. National ID validation (exactly 10 digits, starts with 1 or 2)
    const nid = (formData.nationalId || '').trim();
    const isSaudiNidPattern = /^[12]\d{9}$/.test(nid);
    if (!isSaudiNidPattern) {
      alert('⚠️ فشلت عملية الحفظ: رقم الهوية الوطنية/الإقامة غير صحيح. يجب أن يتكون من 10 خانات رقمية ويبدأ بـ 1 للسعوديين أو 2 للمقيمين.');
      return;
    }

    // 2. Email duplication check (unique email required)
    const emailVal = (formData.email || '').trim().toLowerCase();
    const isDuplicateEmail = employees.some(ex => ex.email?.trim().toLowerCase() === emailVal && ex.id !== id);
    if (isDuplicateEmail) {
      alert(`⚠️ فشلت عملية الحفظ: البريد الإلكتروني "${formData.email}" مسجل بالفعل لموظف آخر في قاعدة البيانات. الرجاء إدخال بريد فريد.`);
      return;
    }

    const currentEmp = employees.find(ex => ex.id === id);

    const empData: Partial<Employee> = {
      ...formData,
      id: id,
      name: formData.name || '',
      nationality: formData.nationality || 'سعودي',
      nationalId: nid,
      phone: formData.phone || '',
      jobTitle: formData.jobTitle || '',
      birthDate: formData.birthDate || '',
      qualification: formData.qualification || '',
      email: formData.email || '',
      manager: formData.manager || '',
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      branch: formData.branch || 'الفرع الرئيسي',
      notes: formData.notes || '',
      status: formData.status || 'نشط',
      avatarUrl: formData.avatarUrl || '',
      username: formData.username || `emp_${id.toLowerCase()}`,
      password: formData.password || `pass_${Math.random().toString(36).substring(2, 6)}`,
      najizApiKey: formData.najizApiKey || '',
      customLoginToken: currentEmp?.customLoginToken || btoa(`${id}-${Math.random().toString(36).substring(2, 10)}`),
      permissions: formData.permissions || currentEmp?.permissions || ['مشاهدة القضايا', 'إضافة مهام', 'إدارة الوثائق'],
      sidebarConfig: formData.sidebarConfig || currentEmp?.sidebarConfig || ['dashboard', 'cases', 'tasks'],
      assignedCases: formData.assignedCases || currentEmp?.assignedCases || [],
      assignedClients: formData.assignedClients || currentEmp?.assignedClients || []
    };

    // Auto-generate portal link bound to security token
    empData.portalLink = `${window.location.origin}/employee-portal?user=${empData.username}&token=${empData.customLoginToken}`;

    try {
      await setDoc(doc(db, 'employees', id), empData, { merge: true });
      await writeAuditLog(formData.id ? 'تحديث موظف' : 'إضافة موظف', `تم تحديث الموظف ${empData.name} ومزامنة بياناته مع البوابات التعليمية والقانونية.`);
      setShowAddModal(false);
      setSelectedConfigEmployee(null);
      alert('تم حفظ وتحديث بيانات الموظف بنجاح والربط مع بوابة الموظفين الفرعية.');
    } catch (err) {
      alert('خطأ في الاتصال بقاعدة البيانات. تأكد من تفعيل قواعد الحماية لقاعدتك.');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟ سيتم إلغاء وصوله للبوابات ومندوبيته على القضايا.')) return;
    try {
      await deleteDoc(doc(db, 'employees', id));
      await writeAuditLog('حذف موظف', `تم حذف ملف الموظف نهائياً من قاعدة البيانات.`);
      alert('تم حذف الموظف بنجاح.');
    } catch (err) {
      alert('خطأ في حذف بيانات الموظف.');
    }
  };

  const sendWhatsAppLink = (emp: Employee) => {
    const link = emp.portalLink || `${window.location.origin}/employee-portal?user=${emp.username}&token=${emp.customLoginToken}`;
    const txt = `أهلاً بك أ. ${emp.name}،\n\nتم تفعيل بوابتك الخاصة بمشروع محاماة العدالة.\n\nرابط الدخول المؤمن لمتابعة قضاياك وجلساتك وعملائك:\n${link}\n\nاسم المستخدم: ${emp.username}\nكلمة السر: ${emp.password}`;
    window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(emp.phone || '')}&text=${encodeURIComponent(txt)}`, '_blank');
  };

  const filtered = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.jobTitle || '').toLowerCase().includes(q) ||
      (emp.nationalId || '').includes(q) ||
      (emp.branch || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 h-full flex flex-col p-8 space-y-6 overflow-y-auto bg-slate-50 text-slate-900" dir="rtl">
      {/* Visual Identity Title area */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-200 pb-6 relative">
        <div className="absolute -top-10 -left-10 w-[30%] h-[150px] bg-amber-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-[1.25rem] border border-amber-300 text-slate-950 shadow-md">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950 flex items-center gap-2">
                إستوديو شؤون الموظفين الذكي
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              </h1>
              <p className="text-slate-600 font-bold text-sm">
                مزامنة ثلاثية الأبعاد لبيانات وعقود الموظفين مع القضايا، بوابات الواتساب، والتحقق الحكومي.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            setSelectedConfigEmployee(null);
            setShowAddModal(true);
            setActiveModalTab('info');
          }}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 active:scale-95"
        >
          <Plus className="w-5 h-5 text-slate-950 stroke-[3px]" />
          <span>تسجيل موظف جديد بالبوابة</span>
        </button>
      </div>

      {/* Cyber Realtime Statistics Cards (3D grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'إجمالي الكادر والمناديب', value: employees.length, sub: 'موظف نشط وموثق', icon: Users, color: 'border-l-amber-505' },
          { title: 'متوسط مستويات الأداء', value: employees.length ? `${Math.round(employees.reduce((acc, e) => acc + getEmployeeKPI(e.name).score, 0) / employees.length)}%` : '100%', sub: 'معدل إنجاز المهام المسندة', icon: Award, color: 'border-l-emerald-505' },
          { title: 'بوابات الوصول الفردية', value: employees.filter(e => e.username).length, sub: 'بوابة موظفين نشطة', icon: Shield, color: 'border-l-indigo-505' },
          { title: 'الفروع الرقمية المغطاة', value: new Set(employees.map(e => e.branch || 'الرئيسي')).size, sub: 'مكاتب ربط حكومي', icon: Building2, color: 'border-l-purple-505' }
        ].map((stat, idx) => (
          <div 
            key={idx}
            className={`bg-white border border-slate-200/80 p-5 rounded-[1.75rem] flex items-center justify-between border-l-4 ${stat.color} hover:shadow-md transition-all shadow-sm`}
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.title}</p>
              <h4 className="text-2xl font-black text-slate-950">{stat.value}</h4>
              <p className="text-[10px] text-slate-600 font-bold">{stat.sub}</p>
            </div>
            <div className="p-3.5 bg-slate-100 rounded-2xl text-slate-600">
              <stat.icon className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Control Search tools */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="البحث السريع بالاسم، المسمى الوظيفي، رقم الهوية أو الفرع..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl pr-12 pl-4 py-3.5 focus:outline-none focus:border-amber-500 font-bold text-sm shadow-sm"
          />
        </div>

        {/* Edit select option dropdown */}
        <div className="relative w-full md:w-80">
           <select 
             onChange={(e) => {
               const emp = employees.find(ex => e.target.value === ex.id);
               if (emp) {
                 setSelectedConfigEmployee(emp);
                 setActiveModalTab('info');
               }
             }}
             value={selectedConfigEmployee?.id || ''}
             className="w-full bg-white text-slate-800 rounded-2xl px-6 py-3.5 font-black text-xs appearance-none outline-none border border-slate-200 focus:border-amber-550 cursor-pointer text-right shadow-sm"
           >
              <option value="">تعديل وتحديث موظف سريع...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id} className="text-slate-800 bg-white">{e.name} — {e.jobTitle}</option>
              ))}
           </select>
           <ChevronRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 rotate-90 pointer-events-none" />
        </div>
      </div>

      {/* 3D Interactive Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          <p className="text-slate-500 font-bold text-xs">جاري جلب ومزامنة الموظفين من الخادم...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white shadow-sm">
          <Users className="w-16 h-16 text-slate-300 mb-4 animate-pulse" />
          <h3 className="font-extrabold text-slate-800 text-base">لا يوجد موظفون يطابقون بحثك</h3>
          <p className="text-slate-500 font-bold text-xs mt-1">قم بإضافة موظف أولاً لتجربة التأثيرات ثلاثية الأبعاد الفائقة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(emp => {
            const kpi = getEmployeeKPI(emp.name);
            return (
              <EmployeeCard3D 
                key={emp.id}
                emp={emp}
                kpi={kpi}
                onEdit={() => {
                  setSelectedConfigEmployee(emp);
                  setShowAddModal(false);
                  setActiveModalTab('info');
                }}
                onDelete={() => handleDeleteEmployee(emp.id)}
                onWhatsApp={() => sendWhatsAppLink(emp)}
                onCopyLink={() => {
                  const link = emp.portalLink || `${window.location.origin}/employee-portal?user=${emp.username}&token=${emp.customLoginToken}`;
                  navigator.clipboard.writeText(link);
                  alert('تم نسخ رابط الدخول المباشر المؤمن للموظف بنجاح.');
                }}
              />
            );
          })}
        </div>
      )}

      {/* Rebuilt, High-Tier Multi-tab 3D Form and Config Modal */}
      {(showAddModal || selectedConfigEmployee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col border border-slate-205 text-slate-800 my-8"
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-amber-500 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {showAddModal ? 'تسجيل كادر وظيفي بملف متكامل' : `تعديل ملف الموظف: ${selectedConfigEmployee?.name}`}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">تعبئة البيانات يضمن مزامنتها التلقائية مع جميع الأقسام وبوابة الموظفين.</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setSelectedConfigEmployee(null); }}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 border border-slate-200 hover:border-amber-500 rounded-full transition-all text-slate-600 hover:text-amber-600"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>

            {/* Modal Form Container */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-10 bg-slate-50/50">
              <form onSubmit={handleSaveEmployee} className="space-y-8 text-right">
                <input type="hidden" name="id" value={formData.id || ''} />
                
                {/* Advanced Header Info */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 mb-6">
                  <p className="text-xs text-amber-700 font-black">📝 تعبئة البيانات الوظيفية والوطنية الأساسية:</p>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                    ملاحظة: الصلاحيات المتقدمة، تعيين القضايا والعملاء المسندين، وحساب كلمة مرور البوابة يتم ضبطهم بشكل متكامل وبسهولة من قسم "بوابة الموظفين" بعد حفظ الملف التعريفي الأساسي هنا.
                  </p>
                </div>

                {/* Profile & Professional Data */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                    
                    {/* Part 1: Legal & Identity Info */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-md">
                      <h3 className="text-sm font-black text-amber-700 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2.5">
                         <FileText className="w-5 h-5 text-amber-600" />
                         <span className="text-slate-900">البيانات القانونية والتحقق الشخصي</span>
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-700 block pr-1 leading-none">إسم الموظف الكامل (الرباعي) <span className="text-rose-500">*</span></label>
                          <input 
                            type="text"
                            name="name" 
                            required 
                            className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-550 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 transition-all shadow-sm" 
                            placeholder="مثال: أحمد بن علي التميمي"
                            value={formData.name || ''} 
                            onChange={handleInputChange} 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-700 block pr-1 leading-none">رقم الهوية الوطنية أو الإقامة (١٠ أرقام) <span className="text-rose-500">*</span></label>
                          <input 
                            type="text"
                            name="nationalId" 
                            required 
                            maxLength={10}
                            className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-550 placeholder:text-slate-400 tracking-wider transition-all shadow-sm" 
                            placeholder="مثال: 1098472849"
                            value={formData.nationalId || ''} 
                            onChange={handleInputChange} 
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 block pr-1 leading-none">الجنسية <span className="text-rose-500">*</span></label>
                            <input 
                              type="text"
                              name="nationality" 
                              required
                              className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-550 placeholder:text-slate-400 transition-all shadow-sm" 
                              placeholder="مثال: سعودي"
                              value={formData.nationality || 'سعودي'} 
                              onChange={handleInputChange} 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 block pr-1 leading-none">المسمى الوظيفي <span className="text-rose-500">*</span></label>
                            <input 
                              type="text"
                              name="jobTitle" 
                              required 
                              className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-550 placeholder:text-slate-400 transition-all shadow-sm" 
                              placeholder="مثال: محامي شريك"
                              value={formData.jobTitle || ''} 
                              onChange={handleInputChange} 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 block pr-1 leading-none">تاريخ الميلاد <span className="text-rose-500">*</span></label>
                            <input 
                              type="date"
                              name="birthDate" 
                              required
                              className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-550 transition-all shadow-sm" 
                              value={formData.birthDate || ''} 
                              onChange={handleInputChange} 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 block pr-1 leading-none">المؤهل الدراسي <span className="text-rose-505">*</span></label>
                            <input 
                              type="text"
                              name="qualification" 
                              required
                              className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-550 placeholder:text-slate-400 transition-all shadow-sm" 
                              placeholder="بكالوريوس شريعة وقانون"
                              value={formData.qualification || ''} 
                              onChange={handleInputChange} 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 block pr-1 leading-none">حالة الموظف الحالية</label>
                            <select 
                              name="status" 
                              className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-extrabold text-slate-900 focus:outline-none focus:border-amber-550 cursor-pointer shadow-sm"
                              value={formData.status || 'نشط'}
                              onChange={handleInputChange}
                            >
                              <option value="نشط">🟢 نشط (Active)</option>
                              <option value="إجازة">🟡 في إجازة (On Leave)</option>
                              <option value="مستقيل">🔴 مستقيل (Resigned)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 block pr-1 leading-none">الفرع والربط الحكومي</label>
                            <select 
                              name="branch" 
                              className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-extrabold text-slate-900 focus:outline-none focus:border-amber-550 cursor-pointer shadow-sm"
                              value={formData.branch || 'الفرع الرئيسي - الرياض'}
                              onChange={handleInputChange}
                            >
                              <option value="الفرع الرئيسي - الرياض">الفرع الرئيسي - الرياض</option>
                              <option value="فرع مكة المكرمة">فرع مكة المكرمة</option>
                              <option value="فرع المنطقة الشرقية">فرع المنطقة الشرقية</option>
                              <option value="الاستشارات الدولية">الاستشارات الدولية</option>
                            </select>
                          </div>
                        </div>

                        {/* Image/Avatar Configuration area */}
                        <div className="space-y-3 pt-2">
                          <label className="text-xs font-black text-slate-700 block pr-1 leading-none">صورة الموظف الرمزية (محترفة ثنائية الأبعاد)</label>
                          <input 
                            type="url"
                            name="avatarUrl" 
                            className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-550 placeholder:text-slate-400 transition-all shadow-sm" 
                            placeholder="https://example.com/photo.jpg"
                            value={formData.avatarUrl || ''} 
                            onChange={handleInputChange} 
                          />
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                            <p className="text-[10px] font-black text-amber-700 pr-1">أو حدد صورة رمزية جاهزة ومهنية بنقرة سريعة:</p>
                            <div className="flex gap-3 overflow-x-auto py-1">
                              {[
                                { name: 'رجل أعمال وقار', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80' },
                                { name: 'سيدة أعمال محترفة', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
                                { name: 'محامي ذكي', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
                                { name: 'مستشارة قانونية', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
                                { name: 'قائد إداري مبادر', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }
                              ].map((av, avIdx) => (
                                <button
                                  key={avIdx}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, avatarUrl: av.url })}
                                  className={`w-11 h-11 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                                    formData.avatarUrl === av.url ? 'border-amber-500 scale-110 shadow-md shadow-amber-500/10' : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
                                  }`}
                                  title={av.name}
                                >
                                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Contact & Dates details */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-md">
                      <h3 className="text-sm font-black text-amber-700 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2.5">
                         <Mail className="w-5 h-5 text-amber-600" />
                         <span className="text-slate-900">بيانات الاتصال وخطة العمل بالمنصة</span>
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-700 block pr-1 leading-none">رقم الجوال النشط (مع رمز الدولة) <span className="text-rose-500">*</span></label>
                          <input 
                            type="tel"
                            name="phone" 
                            required 
                            className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-550 placeholder:text-slate-400 font-mono tracking-wider transition-all shadow-sm" 
                            placeholder="مثال: 9665xxxxxxxx"
                            value={formData.phone || ''} 
                            onChange={handleInputChange} 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-700 block pr-1 leading-none">البريد الإلكتروني المباشر للموظف <span className="text-rose-500">*</span></label>
                          <input 
                            type="email"
                            name="email" 
                            required 
                            className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-550 placeholder:text-slate-400 transition-all shadow-sm" 
                            placeholder="lawyer@firm.com"
                            value={formData.email || ''} 
                            onChange={handleInputChange} 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-700 block pr-1 leading-none">المدير المباشر المسؤول عن الاعتماد</label>
                          <input 
                            type="text"
                            name="manager" 
                            className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-550 placeholder:text-slate-400 transition-all shadow-sm" 
                            placeholder="مثال: د. عبد الله الغامدي"
                            value={formData.manager || ''} 
                            onChange={handleInputChange} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Footer Controls & Submit Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200 items-center">
                      <div className="space-y-2 text-right">
                         <h4 className="text-xs font-black text-amber-700 flex items-center gap-1.5 justify-start">
                           <Terminal className="w-4 h-4 text-amber-600" />
                           <span>مزامنة تلقائية وآمنة مع قاعدة البيانات</span>
                         </h4>
                         <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                           جميع البيانات والتعديلات التي يتم حفظها الآن يتم ترحيلها بشكل متزامن لسحابة (Justice Platform Cloud) لمركز المزامنة الموحد.
                         </p>
                      </div>

                      <div className="flex gap-4 items-center justify-end">
                        <button 
                          type="button"
                          onClick={() => { setShowAddModal(false); setSelectedConfigEmployee(null); }}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-black px-8 py-4 rounded-xl text-xs active:scale-95 transition-all shadow-sm"
                        >
                          <span>إلغاء وتراجع</span>
                        </button>
                        <button 
                          type="submit"
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-12 py-4 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-500/10"
                        >
                          <Save className="w-4 h-4 stroke-[3px]" />
                          <span>حفظ وتوثيق بيانات الموظف</span>
                        </button>
                      </div>
                    </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
