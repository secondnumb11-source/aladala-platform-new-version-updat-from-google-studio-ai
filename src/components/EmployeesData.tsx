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
    
    // Validations (National ID check)
    const nid = (formData.nationalId || '').trim();
    if (!/^[12]\d{9}$/.test(nid)) {
      alert('⚠️ رقم الهوية الوطنية/الإقامة غير صحيح. يجب أن يتكون من 10 خانات رقمية.');
      return;
    }

    const isNew = !formData.id;
    const tempId = formData.id || `EMP-${Date.now().toString().slice(-4)}`;

    const empData: any = {
      ...formData,
      nationalId: nid,
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
      if (isNew) {
        const newRef = await addDoc(collection(db, 'employees'), empData);
        empData.id = newRef.id;
        await setDoc(newRef, { id: newRef.id }, { merge: true });
        setEmployees(prev => [...prev, empData as Employee]);
      } else {
        await setDoc(doc(db, 'employees', formData.id as string), empData, { merge: true });
        setEmployees(prev => prev.map(e => e.id === formData.id ? { ...e, ...empData } : e));
      }
      
      setView('list');
      setSelectedConfigEmployee(null);
      setFormData({});
      alert('تم حفظ بيانات الموظف ومزامنتها بنجاح مع كافة الأقسام وبوابة الموظفين.');
    } catch (err) {
      console.error("Save error:", err);
      alert('خطأ في الاتصال بقاعدة البيانات.');
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
      <div className="flex-1 p-8 bg-slate-50 min-h-screen font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-600/20">
                {selectedConfigEmployee ? <SettingsIcon className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 leading-none mb-2">
                  {selectedConfigEmployee ? 'تعديل بيانات موظف' : 'إضافة موظف جديد للمكتب'}
                </h1>
                <p className="text-slate-500 font-bold text-sm">أدخل المعلومات الوظيفية والوطنية المطلوبة بدقة</p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => window.print()}
              className="px-6 py-4 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-black rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <FileText className="w-5 h-5" />
              تصدير ملف الموظف (PDF)
            </button>
            <button 
              onClick={() => { setView('list'); setSelectedConfigEmployee(null); setFormData({}); }}
              className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
              إلغاء والعودة للقائمة
            </button>
          </div>

          <form onSubmit={handleSaveEmployee} className="bg-white border border-slate-200 rounded-[3rem] shadow-[0_20px_50px_-20px_rgba(30,58,138,0.08)] p-10 lg:p-14 space-y-12">
            
            {/* National & Job Info */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-blue-100">
                <div className="w-11 h-11 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-950">البيانات الشخصية والوظيفية</h3>
                  <p className="text-xs text-blue-900/40 font-bold">المعلومات المرجعية للهوية الوطنية والوظيفة</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">اسم الموظف الكامل</label>
                  <input 
                    name="name" 
                    required 
                    value={formData.name || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-right text-blue-950"
                    placeholder="الاسم الرباعي الرسمي"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">رقم الهوية / الإقامة</label>
                  <input 
                    name="nationalId" 
                    required 
                    maxLength={10}
                    value={formData.nationalId || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-left text-blue-950"
                    placeholder="10XXXXXXXX"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">الجنسية</label>
                  <input 
                    name="nationality" 
                    value={formData.nationality || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-right text-blue-950"
                    placeholder="سعودي / مقيم"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">المسمى الوظيفي</label>
                  <input 
                    name="jobTitle" 
                    required 
                    value={formData.jobTitle || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-right text-blue-950"
                    placeholder="مثال: محامي استئناف"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">تاريخ الميلاد</label>
                  <input 
                    type="date"
                    name="birthDate" 
                    value={formData.birthDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-blue-950"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">المؤهل الدراسي</label>
                  <input 
                    name="qualification" 
                    value={formData.qualification || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-right text-blue-950"
                    placeholder="بكالوريوس قانون / ماجستير"
                  />
                </div>
              </div>
            </section>

            {/* Communication details */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-blue-100">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-900 rounded-2xl flex items-center justify-center">
                  <AtSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-950">بيانات الاتصال والتواصل</h3>
                  <p className="text-xs text-blue-900/40 font-bold">تأمين قنوات التواصل الرسمية للموظف</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">رقم الجوال</label>
                  <input 
                    name="phone" 
                    value={formData.phone || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-left text-blue-950"
                    placeholder="05XXXXXXXX"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">البريد الإلكتروني</label>
                  <input 
                    type="email"
                    name="email" 
                    value={formData.email || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-left text-blue-950"
                    placeholder="example@firm.com"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">المدير المباشر</label>
                  <input 
                    name="manager" 
                    required 
                    value={formData.manager || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-right text-blue-950"
                    placeholder="اسم المدير المسؤول"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">حالة العمل الحالية</label>
                  <select 
                    name="status" 
                    value={formData.status || 'نشط'} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-black focus:bg-white focus:border-blue-600 transition-all outline-none cursor-pointer text-blue-950"
                  >
                    <option value="نشط">نشط (على رأس العمل)</option>
                    <option value="إجازة">في إجازة</option>
                    <option value="مستقيل">مستقيل / منتهي الخدمة</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Account Credentials */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-blue-100">
                <div className="w-11 h-11 bg-rose-50 text-rose-900 rounded-2xl flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-950">بيانات الحساب وواجهة برمجة التطبيقات (API)</h3>
                  <p className="text-xs text-blue-900/40 font-bold">إعدادات تسجيل الدخول والربط التقني</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">اسم المستخدم (للدخول)</label>
                  <input 
                    name="username" 
                    value={formData.username || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-left text-blue-950"
                    placeholder="user123"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">كلمة المرور</label>
                  <input 
                    name="password" 
                    type="password"
                    value={formData.password || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-left text-blue-950"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">API Key (للمزامنة الخلفية)</label>
                  <input 
                    name="najizApiKey" 
                    value={formData.najizApiKey || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-purple-600 transition-all outline-none text-left text-purple-950"
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  />
                  <p className="text-[10px] text-slate-500 font-bold px-2">يستخدم للربط مع البوابات العدلية وسحب القضايا في الخلفية</p>
                </div>
              </div>
            </section>

            {/* Payroll Data */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-blue-100">
                <div className="w-11 h-11 bg-emerald-50 text-emerald-900 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-950">بيانات الراتب والبدلات</h3>
                  <p className="text-xs text-blue-900/40 font-bold">الأساس المالي لحساب كشوف الرواتب التلقائية</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">الراتب الأساسي</label>
                  <input 
                    name="baseSalary" 
                    type="number"
                    value={formData.baseSalary || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-left text-blue-950"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">إجمالي البدلات</label>
                  <input 
                    name="allowances" 
                    type="number"
                    value={formData.allowances || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-left text-blue-950"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">إجمالي الخصومات / التأمينات</label>
                  <input 
                    name="deductions" 
                    type="number"
                    value={formData.deductions || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-mono font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-left text-blue-950"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </section>

            {/* Employment Record */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-blue-100">
                <div className="w-11 h-11 bg-emerald-50 text-emerald-900 rounded-2xl flex items-center justify-center">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-950">سجل التوظيف والخدمة</h3>
                  <p className="text-xs text-blue-900/40 font-bold">توثيق تواريخ المباشرة وفترات العمل</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">تاريخ بدء العمل</label>
                  <input 
                    type="date"
                    name="startDate" 
                    value={formData.startDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-blue-950"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-900/60 pr-2 block">تاريخ ترك العمل (إن وُجد)</label>
                  <input 
                    type="date"
                    name="endDate" 
                    value={formData.endDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-blue-600 transition-all outline-none text-blue-950"
                  />
                </div>
              </div>
            </section>

            <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                type="submit"
                className="md:col-span-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] group"
              >
                <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                حفظ البيانات
              </button>
              <button 
                type="button"
                onClick={() => { setView('list'); setSelectedConfigEmployee(null); }}
                className="bg-slate-100 text-blue-950 border border-slate-200 font-black py-5 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-[0.98]"
              >
                إلغاء والعودة
              </button>
              <button 
                type="button"
                onClick={() => { setView('list'); setSelectedConfigEmployee(null); }}
                className="bg-blue-950 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-blue-950/20 active:scale-[0.98]"
              >
                <ChevronRight className="w-6 h-6" />
                إغلاق القائمة
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-10 bg-[#f8fafc] min-h-screen text-right font-sans" dir="rtl">
      
      {/* Top Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 pb-12 border-b border-slate-200">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-600/20">
               <Users className="w-8 h-8" />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">قاعدة بيانات الموظفين</h1>
          </div>
          <p className="text-slate-500 font-bold text-xl leading-relaxed">
            البوابة المركزية لإدارة الكادر الوظيفي وموازنة الصلاحيات والوصول الرقمي.
          </p>
        </div>
        <button 
          onClick={() => { setView('form'); setSelectedConfigEmployee(null); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-5 rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-lg">تسجيل موظف جديد</span>
        </button>
      </div>

      {/* Main Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-12">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-100 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي الموظفين</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-4xl font-black text-slate-900 leading-none">{employees.length}</h4>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-emerald-100 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نشط بالخدمة</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="text-4xl font-black text-emerald-600 leading-none">{employees.filter(e => e.status === 'نشط').length}</h4>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-100 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">قضايا مسندة</span>
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-4xl font-black text-slate-900 leading-none">0</h4>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-amber-100 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معدل الانجاز</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <h4 className="text-4xl font-black text-amber-500 leading-none">96%</h4>
        </div>
      </div>

      {/* Control Utility Toolbar */}
      <div className="mt-12 flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            placeholder="البحث السريع عن موظف (بالاسم، المسمى الوظيفي، رقم الهوية)..."
            className="w-full bg-white border border-slate-200 rounded-3xl pr-16 pl-6 py-6 font-bold text-lg outline-none focus:border-blue-600 focus:ring-[12px] focus:ring-blue-600/5 transition-all shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Employee Professional Directory Grid */}
      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-8">
          <div className="w-16 h-16 border-[5px] border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-center group">
             <h2 className="text-2xl font-black text-slate-900 mb-1">جاري تحميل سجلات الكادر الموثوق</h2>
             <p className="text-slate-400 font-bold">بوابة العدالة — تأمين السحابة الرقمية</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 py-40 bg-white border-2 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center gap-8 text-slate-300"
        >
          <Users className="w-24 h-24 opacity-10" />
          <div className="text-center">
            <p className="font-black text-2xl text-slate-900">لا توجد سجلات مطابقة</p>
            <p className="font-bold text-slate-400 mt-2">ابدأ بإثراء سجلات مكتبك بإضافة موظف جديد</p>
          </div>
          <button 
            onClick={() => setView('form')}
            className="px-12 py-5 bg-blue-50 text-blue-600 rounded-[1.75rem] font-black text-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            إضافة كادر وظيفي
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mt-16">
          {filtered.map(emp => (
            <motion.div 
              key={emp.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[5rem] -mr-8 -mt-8 pointer-events-none transition-colors" />
              
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.25rem] flex items-center justify-center text-blue-950 font-black text-3xl border border-slate-100 shadow-inner duration-500 overflow-hidden">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="opacity-40">{emp.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="space-y-1 mt-1">
                    <h3 className="font-black text-2xl text-blue-950 tracking-tight">{emp.name}</h3>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      <p className="text-blue-900/60 font-black text-xs uppercase tracking-widest">{emp.jobTitle}</p>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  emp.status === 'نشط' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                }`}>
                  {emp.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-8 gap-x-6 border-t border-slate-100 pt-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-900/40 uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" />
                    رقم الهوية
                  </div>
                  <p className="text-blue-950 font-mono font-black text-sm">{emp.nationalId}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-900/40 uppercase tracking-widest">
                    <Building2 className="w-3 h-3" />
                    الجنسية
                  </div>
                  <p className="text-blue-950 font-black text-sm">{emp.nationality}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-900/40 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    بدء العمل
                  </div>
                  <p className="text-blue-950 font-mono font-black text-sm">{emp.startDate}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-900/40 uppercase tracking-widest">
                    <GraduationCap className="w-3 h-3" />
                    المؤهل
                  </div>
                  <p className="text-blue-950 font-black text-sm truncate max-w-[120px]">{emp.qualification}</p>
                </div>
                {/* Vacation Status Section */}
                <div className="col-span-2 mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-700 shadow-sm">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">رصيد الإجازات المتبقية 🏖️</p>
                      <p className="text-xs text-blue-900/50 font-bold">بناءً على تاريخ المباشرة السيادي</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-700">
                      {(() => {
                        const start = new Date(emp.startDate || new Date());
                        const today = new Date();
                        const diffTime = Math.abs(today.getTime() - start.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const accrued = Math.floor((diffDays / 365) * 30);
                        return Math.max(0, accrued);
                      })()}
                    </span>
                    <span className="text-[10px] font-black text-amber-900 mr-1">يوماً</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-4">
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
                                  h1 { font-size: 24px; font-weight: 900; margin-bottom: 5px; color: #1e3a8a; }
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
                                <div class="row"><span class="label">تاريخ المباشرة</span><span class="val">${emp.startDate}</span></div>
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
                     className="px-6 py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                   >
                     <FileText className="w-4 h-4" />
                     إصدار مسير الراتب
                   </button>
                   <a href={`tel:${emp.phone}`} className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-blue-900/40 hover:bg-white hover:shadow-md transition-all">
                     <Phone className="w-5 h-5" />
                   </a>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={() => { setSelectedConfigEmployee(emp); setView('form'); }}
                     className="px-8 py-4 bg-blue-950 text-white rounded-[1.5rem] font-black text-xs hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20"
                   >
                     تحرير
                   </button>
                   <button 
                     onClick={() => handleDeleteEmployee(emp.id)}
                     className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
