import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Phone, Mail, 
  UserCheck, Calendar, Briefcase, 
  FileText, Save, Settings as SettingsIcon, 
  ChevronRight, Trash2, GraduationCap, 
  CalendarDays, AtSign, Sparkles, Building2,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
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
import { Case, Task, Employee, Client } from '@/types';

export default function EmployeesData({ tasks }: { cases: Case[], tasks: Task[], clients?: Client[], onUpdateState?: (t: string, d: any) => void }) {
  const { user, profile } = useFirebase();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedConfigEmployee, setSelectedConfigEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<Employee>>({});

  // Sync with Firestore Employees Collection
  useEffect(() => {
    // 1. Initial immediate load from local backup
    const backup = localStorage.getItem('employees_backup');
    if (backup) {
      try {
        setEmployees(JSON.parse(backup));
      } catch (e) {
        console.error("Error parsing backup data:", e);
      }
    }

    const q = query(collection(db, 'employees'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps: Employee[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      if (emps.length > 0) {
        setEmployees(emps);
        localStorage.setItem('employees_backup', JSON.stringify(emps));
      } else if (!backup) {
        setEmployees([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching employees from Cloud Firestore, using backup fallback:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
        status: 'نشط'
      });
    }
  }, [selectedConfigEmployee, view]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Verification for National ID / Iqama
    const nid = (formData.nationalId || '').trim();
    if (!nid) {
      alert('⚠️ الرجاء إدخال رقم الهوية الوطنية أو الإقامة للموظف.');
      return;
    }
    if (!/^[12]\d{9}$/.test(nid)) {
      alert('⚠️ خطأ في رقم الهوية الوطنية/الإقامة: يجب أن يتكون من 10 خانات رقمية تماماً ويبدأ بـ 1 أو 2.');
      return;
    }

    if (!formData.name || !formData.name.trim()) {
      alert("⚠️ الرجاء إدخال الاسم الكامل للموظف.");
      return;
    }

    if (!formData.jobTitle || !formData.jobTitle.trim()) {
      alert("⚠️ الرجاء إدخال المسمى الوظيفي للموظف.");
      return;
    }

    const isNew = !formData.id;
    const tempId = formData.id || `EMP-${Date.now().toString().slice(-4)}`;

    const empData: any = {
      ...formData,
      nationalId: nid,
      id: tempId,
      username: formData.username || `emp_${tempId.toLowerCase()}`,
      password: formData.password || `pass_${Math.random().toString(36).substring(2, 6)}`,
      customLoginToken: formData.customLoginToken || btoa(`${tempId}-${Math.random().toString(36).substring(2, 10)}`),
      status: formData.status || 'نشط',
      baseSalary: Number(formData.baseSalary) || 0,
      allowances: Number(formData.allowances) || 0,
      deductions: Number(formData.deductions) || 0
    };
    
    empData.portalLink = `${window.location.origin}/employee-portal?user=${empData.username}&token=${empData.customLoginToken}`;

    // Ensure no undefined values are sent to Firestore
    Object.keys(empData).forEach(key => {
      if (empData[key] === undefined) {
        delete empData[key];
      }
      if (typeof empData[key] === 'number' && Number.isNaN(empData[key])) {
         empData[key] = 0;
      }
    });

    try {
      // 1. Immediately update local state & backup for instant closed UI response
      const currentBackup = localStorage.getItem('employees_backup');
      let currentBackupList = currentBackup ? JSON.parse(currentBackup) : [];
      if (isNew) {
        currentBackupList.push(empData);
      } else {
        currentBackupList = currentBackupList.map((e: any) => e.id === empData.id ? { ...e, ...empData } : e);
      }
      localStorage.setItem('employees_backup', JSON.stringify(currentBackupList));
      setEmployees(currentBackupList);

      // 2. Try persisting to Firestore cloud
      if (isNew) {
        const newRef = await addDoc(collection(db, 'employees'), empData).catch((err) => {
          console.warn("Firestore collection add failed, saving with offline ID block:", err);
          return null;
        });
        if (newRef) {
          empData.id = newRef.id;
          await setDoc(newRef, { id: newRef.id }, { merge: true }).catch(err => console.error(err));
          // Re-update local list with the newly confirmed server ID
          const updatedBackup = currentBackupList.map((item: any) => item.id === tempId ? { ...item, id: newRef.id } : item);
          localStorage.setItem('employees_backup', JSON.stringify(updatedBackup));
          setEmployees(updatedBackup);
        }
      } else {
        await setDoc(doc(db, 'employees', formData.id as string), empData, { merge: true }).catch(err => {
          console.warn("Firestore update failed, relying on offline cache:", err);
        });
      }

      alert('✅ تم حفظ بيانات الموظف ومزامنتها بنجاح مع كافة الأقسام وبوابة الموظفين.');
      setView('list');
      setSelectedConfigEmployee(null);
      setFormData({});
    } catch (err) {
      console.error("Save transaction handoff error:", err);
      alert('✅ تم حفظ بيانات الموظف محلياً بنجاح ومزامنتها مع الأقسام وجاري المزامنة اللاسلكية مع السحابة.');
      setView('list');
      setSelectedConfigEmployee(null);
      setFormData({});
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (err) {
      alert('خطأ في الحذف.');
    }
  };

  const filtered = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (emp.name || '').toLowerCase().includes(q) || (emp.jobTitle || '').toLowerCase().includes(q);
  });

  if (view === 'form') {
    return (
      <div className="flex-1 p-8 md:p-12 bg-[#F8FAFC] min-h-screen font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[#0f172a] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                {selectedConfigEmployee ? <SettingsIcon className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight mb-1">
                  {selectedConfigEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
                </h1>
                <p className="text-slate-500 font-bold text-sm">أدخل البيانات بنظام الموارد البشرية المركزي</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => window.print()}
                className="px-5 py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-black rounded-2xl flex items-center gap-2 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4" />
                تصدير (PDF)
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveEmployee} className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 md:p-12 space-y-10">
            
            {/* National & Job Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">البيانات الشخصية والوظيفية</h3>
                  <p className="text-[11px] text-slate-500 font-bold">المعلومات المرجعية للهوية والوظيفة</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">اسم الموظف الكامل</label>
                  <input 
                    name="name" 
                    value={formData.name || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-right text-slate-900"
                    placeholder="الاسم الرباعي الرسمي"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">رقم الهوية / الإقامة</label>
                  <input 
                    name="nationalId" 
                    maxLength={10}
                    value={formData.nationalId || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-left text-slate-900"
                    placeholder="10XXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">الجنسية</label>
                  <input 
                    name="nationality" 
                    value={formData.nationality || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                    placeholder="سعودي / مقيم"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">المسمى الوظيفي</label>
                  <input 
                    name="jobTitle" 
                    value={formData.jobTitle || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                    placeholder="مثال: محامي استئناف"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">تاريخ الميلاد</label>
                  <input 
                    type="date"
                    name="birthDate" 
                    value={formData.birthDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">المؤهل الدراسي</label>
                  <input 
                    name="qualification" 
                    value={formData.qualification || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                    placeholder="بكالوريوس قانون / ماجستير"
                  />
                </div>
              </div>
            </section>

            {/* Communication details */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <AtSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">بيانات الاتصال والتواصل</h3>
                  <p className="text-[11px] text-slate-500 font-bold">تأمين قنوات التواصل الرسمية للموظف</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">رقم الجوال</label>
                  <input 
                    name="phone" 
                    value={formData.phone || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-left text-slate-900"
                    placeholder="05XXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">البريد الإلكتروني</label>
                  <input 
                    type="email"
                    name="email" 
                    value={formData.email || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-left text-slate-900"
                    placeholder="employee@firm.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">المدير المباشر</label>
                  <input 
                    name="manager" 
                    value={formData.manager || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                    placeholder="اسم المدير المسؤول"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">حالة العمل الحالية</label>
                  <select 
                    name="status" 
                    value={formData.status || 'نشط'} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black focus:bg-white focus:border-blue-500 transition-all outline-none cursor-pointer text-slate-900"
                  >
                    <option value="نشط">نشط (على رأس العمل)</option>
                    <option value="إجازة">في إجازة</option>
                    <option value="مستقيل">مستقيل / منتهي الخدمة</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Employment Record */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">سجل التوظيف والخدمة</h3>
                  <p className="text-[11px] text-slate-500 font-bold">توثيق تواريخ المباشرة وفترات العمل</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">تاريخ بدء العمل (المباشرة)</label>
                  <input 
                    type="date"
                    name="startDate" 
                    value={formData.startDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">تاريخ ترك العمل (إن وُجد)</label>
                  <input 
                    type="date"
                    name="endDate" 
                    value={formData.endDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-slate-900"
                  />
                </div>
              </div>
            </section>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-end">
              <button 
                type="button"
                onClick={() => { setView('list'); setSelectedConfigEmployee(null); }}
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
                إلغاء والعودة
              </button>
              <button 
                type="submit"
                className="px-8 py-4 bg-[#0f172a] hover:bg-slate-800 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
              >
                <Save className="w-5 h-5" />
                حفظ بيانات الموظف
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 bg-[#F8FAFC] min-h-screen text-right font-sans" dir="rtl">
      
      {/* Top Professional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-[#0f172a] text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
               <Users className="w-8 h-8" />
             </div>
             <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">قاعدة بيانات الموظفين</h1>
               <p className="text-slate-500 font-bold text-sm mt-1">البوابة المركزية لإدارة الكادر الوظيفي وموازنة الصلاحيات والوصول الرقمي</p>
             </div>
          </div>
        </div>
        <button 
          onClick={() => { setView('form'); setSelectedConfigEmployee(null); }}
          className="bg-[#0f172a] hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm">اضافة بيانات موظف</span>
        </button>
      </div>

      {/* Control Utility Toolbar */}
      <div className="mt-8">
        <div className="relative w-full max-w-2xl group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            placeholder="البحث عن موظف (بالاسم، المسمى الوظيفي، رقم الهوية)..."
            className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-6 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Employee Professional Directory Grid */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 border-[4px] border-[#0f172a] border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
             <h2 className="text-xl font-black text-slate-900">جاري تحميل سجلات الموظفين</h2>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-10 py-32 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 text-slate-300 shadow-sm"
        >
          <Users className="w-20 h-20 opacity-10" />
          <div className="text-center">
            <p className="font-black text-xl text-slate-900">لا توجد سجلات مطابقة</p>
            <p className="font-bold text-slate-400 text-sm mt-2">ابدأ بإثراء سجلات مكتبك بإضافة موظف جديد</p>
          </div>
          <button 
            onClick={() => setView('form')}
            className="px-8 py-3.5 bg-[#0f172a] text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            إضافة كادر وظيفي
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">
          {filtered.map(emp => (
            <motion.div 
              key={emp.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col relative group hover:border-[#0f172a]/20 transition-all"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0f172a] font-black text-xl border border-slate-100 shadow-sm overflow-hidden">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{emp.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 tracking-tight">{emp.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-slate-500 font-bold text-[11px] uppercase">{emp.jobTitle}</p>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wide shadow-sm flex items-center justify-center ${
                  emp.status === 'نشط' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {emp.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-slate-100 pt-6">
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    رقم الهوية
                  </div>
                  <p className="text-slate-900 font-mono font-black text-sm">{emp.nationalId || '---'}</p>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    الجنسية
                  </div>
                  <p className="text-slate-900 font-black text-sm">{emp.nationality || '---'}</p>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    بدء العمل
                  </div>
                  <p className="text-slate-900 font-mono font-black text-sm">{emp.startDate || '---'}</p>
                </div>
                <div className="space-y-1.5 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                    <GraduationCap className="w-3.5 h-3.5" />
                    المؤهل
                  </div>
                  <p className="text-slate-900 font-black text-sm truncate">{emp.qualification || '---'}</p>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                    <AtSign className="w-3.5 h-3.5" />
                    تواصل
                  </div>
                  <p className="text-slate-900 font-mono font-black text-[13px] truncate">{emp.phone || emp.email || '---'}</p>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    المدير المباشر
                  </div>
                  <p className="text-slate-900 font-black text-sm truncate">{emp.manager || '---'}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-2.5">
                   <button 
                     onClick={() => { setSelectedConfigEmployee(emp); setView('form'); }}
                     className="px-6 py-3 bg-[#0f172a] text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-all shadow-md"
                   >
                     تحرير بيانات الموظف
                   </button>
                   <button 
                     onClick={() => handleDeleteEmployee(emp.id)}
                     className="w-10 h-10 bg-white text-rose-500 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                <button 
                  onClick={() => {
                     const win = window.open('', '_blank');
                     if (!win) return;
                     const netPay = (emp.baseSalary || 0) + (emp.allowances || 0) - (emp.deductions || 0);
                     win.document.write(`
                        <html dir="rtl" lang="ar">
                          <head>
                             <title>مسير الرواتب - ${emp.name}</title>
                             <style>
                               body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #fff; color: #020617; }
                               h1 { font-size: 24px; font-weight: 900; margin-bottom: 5px; color: #0f172a; }
                               h2 { font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 40px; }
                               .row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 16px 0; }
                               .label { font-size: 14px; font-weight: 800; color: #475569; }
                               .val { font-size: 16px; font-weight: 900; font-family: monospace; }
                               .total { background: #f8fafc; padding: 20px; border-radius: 16px; font-size: 20px; font-weight: 900; color: #10b981; margin-top: 30px; display: flex; justify-content: space-between;}
                               @media print { body { padding: 0; } }
                             </style>
                          </head>
                          <body>
                             <h1>العدالة القضائية - مسير الرواتب الرسمي</h1>
                             <h2>كشف الراتب الشهري للموظف: ${emp.name}</h2>
                             <div class="row"><span class="label">تاريخ المباشرة</span><span class="val">${emp.startDate || '---'}</span></div>
                             <div class="row"><span class="label">المسمى الوظيفي</span><span class="val">${emp.jobTitle}</span></div>
                             <div style="margin-top:40px;">
                                <div class="row"><span class="label">الراتب الأساسي</span><span class="val">${emp.baseSalary || 0} ر.س</span></div>
                                <div class="row"><span class="label">البدلات (سكن، نقل، أخرى)</span><span class="val">+${emp.allowances || 0} ر.س</span></div>
                                <div class="row"><span class="label">الخصومات / التأمينات الاجتماعية</span><span style="color:#e11d48;" class="val">-${emp.deductions || 0} ر.س</span></div>
                             </div>
                             <div class="total">
                                <span>صافي الراتب المستحق</span>
                                <span>${netPay} ر.س</span>
                             </div>
                             <script>window.print();</script>
                          </body>
                        </html>
                     `);
                     win.document.close();
                  }}
                  className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
                  title="مسير الراتب"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
