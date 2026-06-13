import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, MapPin, Phone, Mail, Award, CheckCircle2, 
  UserCheck, ShieldAlert, Calendar, Flag, Hash, Shield, Briefcase, 
  FileText, Save, Settings as SettingsIcon, Link as LinkIcon, 
  ChevronRight, Lock, Eye, EyeOff, MessageSquare, Send, Database, Globe,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Case, Task, Employee, Client } from '@/types';

export default function EmployeesData({ cases, tasks, clients = [], onUpdateState }: { cases: Case[], tasks: Task[], clients?: Client[], onUpdateState?: (t: string, d: any) => void }) {
  const { user, profile } = useFirebase();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Firestore sync for employees
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
  
  // Controlled form state
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (selectedConfigEmployee) {
      setFormData(selectedConfigEmployee);
    } else {
      setFormData({});
    }
  }, [selectedConfigEmployee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        userName: profile?.name || user?.email || 'System',
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
    
    const currentEmp = employees.find(ex => ex.id === id);

    const empData: Partial<Employee> = {
      ...formData,
      name: formData.name || '',
      nationality: formData.nationality || 'سعودي',
      nationalId: formData.nationalId || '',
      phone: formData.phone || '',
      jobTitle: formData.jobTitle || '',
      username: formData.username || '',
      password: formData.password || '',
      najizApiKey: formData.najizApiKey || '',
      customLoginToken: currentEmp?.customLoginToken || btoa(`${id}-${Math.random().toString(36).substring(2, 10)}`),
      permissions: currentEmp?.permissions || [],
      sidebarConfig: currentEmp?.sidebarConfig || ['dashboard', 'cases', 'tasks'],
      assignedCases: currentEmp?.assignedCases || [],
      assignedClients: currentEmp?.assignedClients || []
    };

    // Update portal link with the secure token
    empData.portalLink = `${window.location.origin}/employee-portal?user=${empData.username}&token=${empData.customLoginToken}`;

    try {
      await setDoc(doc(db, 'employees', id), empData, { merge: true });
      await writeAuditLog(formData.id ? 'تحديث موظف' : 'إضافة موظف', `تمت معالجة بيانات الموظف: ${empData.name}`);
      setShowAddModal(false);
      setSelectedConfigEmployee(null);
    } catch (err) {
      alert('خطأ في حفظ البيانات. تأكد من اتصال الإنترنت.');
    }
  };

  const updateEmployeeConfig = async (id: string, updates: Partial<Employee>) => {
    try {
      await setDoc(doc(db, 'employees', id), updates, { merge: true });
    } catch (e) {}
    
    if (selectedConfigEmployee?.id === id) {
      setSelectedConfigEmployee({ ...selectedConfigEmployee, ...updates });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟')) return;
    try {
      const emp = employees.find(e => e.id === id);
      await deleteDoc(doc(db, 'employees', id));
      await writeAuditLog('حذف موظف', `تم حذف الموظف: ${emp?.name}`);
    } catch (e) {
      alert('خطأ في حذف البيانات.');
    }
  };

  const sendWhatsAppLink = (emp: Employee) => {
    const text = `أهلاً بك يا ${emp.name}.\nرابط بوابة الموظفين بمنصة العدالة:\n${emp.portalLink}\nاسم المستخدم: ${emp.username}\nكلمة السر: ${emp.password}`;
    window.open(`https://wa.me/${emp.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filtered = employees.filter(e => e.name.includes(searchQuery) || e.jobTitle.includes(searchQuery) || (e.nationalId && e.nationalId.includes(searchQuery)));

  return (
    <div className="flex-1 h-full flex flex-col p-8 space-y-6 overflow-y-auto bg-slate-50/30" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            إدارة الموظفين والوصول
          </h1>
          <p className="text-slate-500 font-bold mt-2 text-sm">حدد الصلاحيات، عين القضايا، وأنشئ حسابات الدخول المخصصة لبوابة الموظفين.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl"
        >
          <Plus className="w-5 h-5 text-amber-500" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث بالاسم، المسمى، أو رقم الهوية..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl pr-12 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
          />
        </div>

        <div className="relative w-full md:w-72">
           <select 
             onChange={(e) => {
               const emp = employees.find(ex => ex.id === e.target.value);
               if (emp) setSelectedConfigEmployee(emp);
             }}
             className="w-full bg-slate-900 text-white rounded-2xl px-6 py-3 font-black text-xs appearance-none outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-lg"
           >
              <option value="">اختر موظفاً للتعديل السريع...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} - {e.jobTitle}</option>
              ))}
           </select>
           <ChevronRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 rotate-90 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(emp => {
          const kpi = getEmployeeKPI(emp.name);
          return (
            <motion.div 
              key={emp.id}
              layoutId={emp.id}
              className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm transition-all border-b-4 border-b-primary/10"
            >
              <div className="p-6 border-b border-slate-50 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl border-2 border-primary/20 shadow-inner">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{emp.name}</h3>
                    <p className="text-primary font-bold text-xs">{emp.jobTitle}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.username || 'قيد الانتظار'}</span>
                    </div>
                  </div>
                </div>
                  <button 
                    onClick={() => handleDeleteEmployee(emp.id)}
                    className="p-3 bg-rose-50 text-rose-400 rounded-2xl transition-all"
                    title="حذف الموظف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedConfigEmployee(emp)}
                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl transition-all group"
                    title="إعدادات الصلاحيات"
                  >
                    <SettingsIcon className="w-5 h-5 group-rotate-90 transition-transform" />
                  </button>
              </div>

              <div className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                       <MapPin className="w-3.5 h-3.5 text-primary" /> {emp.branch}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                       <Phone className="w-3.5 h-3.5 text-primary" /> {emp.phone}
                    </div>
                 </div>

                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 mb-2">
                       <span>كفاءة الموظف (KPI)</span>
                       <span className="text-emerald-600">{kpi.score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${kpi.score}%` }}
                         className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                       />
                    </div>
                 </div>

                 <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar min-h-[24px]">
                    {emp.permissions?.slice(0, 3).map(p => (
                      <span key={p} className="px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg whitespace-nowrap">
                        {p}
                      </span>
                    ))}
                    {(emp.permissions?.length || 0) > 3 && (
                      <span className="text-[9px] font-black text-slate-400">+{emp.permissions!.length - 3}</span>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => sendWhatsAppLink(emp)}
                      className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> واتساب
                    </button>
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/employee-portal?user=${emp.username}`;
                        navigator.clipboard.writeText(link);
                        alert('تم نسخ رابط بوابة الموظف بنجاح');
                      }}
                      className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl text-[10px] font-black transition-all"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> نسخ الرابط
                    </button>
                 </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Configuration & Edit Modal */}
      {(showAddModal || selectedConfigEmployee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0B172E] rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 text-slate-100"
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-950 text-amber-500 rounded-2xl">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {showAddModal ? 'إضافة موظف جديد للنظام' : `إعدادات الوصول: ${selectedConfigEmployee?.name}`}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold">قم بتخصيص الصلاحيات وبوابة الدخول لكل عضو في الفريق.</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setSelectedConfigEmployee(null); }}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10">
              <form id="employee-config-form" onSubmit={handleSaveEmployee} className="space-y-10">
                <input type="hidden" name="id" value={selectedConfigEmployee?.id || ''} />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Basic Info Column */}
                  <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 flex items-center gap-2">
                       <FileText className="w-4 h-4" /> البيانات الأساسية
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-600 block pr-2">الاسم الرباعي</label>
                        <input name="name" required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary" value={formData.name || ''} onChange={handleInputChange} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-600 block pr-2">الجنسية</label>
                          <input name="nationality" value={formData.nationality || ''} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2 text-sm font-bold text-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-600 block pr-2">المسمى الوظيفي</label>
                          <input name="jobTitle" required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2 text-sm font-bold text-white" value={formData.jobTitle || ''} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-600 block pr-2">رقم الهوية</label>
                        <input name="nationalId" required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-white" value={formData.nationalId || ''} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-600 block pr-2">رقم الجوال</label>
                        <input name="phone" required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-white" value={formData.phone || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Access & Credentials Column */}
                  <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-500/20 pb-2 flex items-center gap-2">
                       <Lock className="w-4 h-4" /> إعدادات تسجيل الدخول
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-600 block pr-2">اسم المستخدم للرابط</label>
                        <input name="username" required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-emerald-300" value={formData.username || ''} onChange={handleInputChange} placeholder="e.g. ahmed_lawyer" />
                      </div>
                      <div className="space-y-1.5 relative">
                        <label className="text-[11px] font-black text-slate-600 block pr-2">كلمة المرور البوابية</label>
                        <div className="relative">
                          <input 
                            name="password" 
                            type={showPass ? 'text' : 'password'}
                            required 
                            className="w-full bg-emerald-50/30 border border-emerald-500/20 rounded-2xl px-4 py-3 text-sm font-black text-emerald-900" 
                            defaultValue={selectedConfigEmployee?.password} 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                          >
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-600 block pr-2 flex items-center justify-between">
                          مفتاح الربط API (Najiz)
                          <Database className="w-3.5 h-3.5 text-amber-500" />
                        </label>
                        <input name="najizApiKey" className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-mono text-amber-300" value={formData.najizApiKey || ''} onChange={handleInputChange} placeholder="NAJIZ_SDK_KEY_XXXX..." />
                        <p className="text-[9px] font-bold text-amber-600 leading-tight">خاص بمزامنة البيانات لمنصة ناجز لهذا الموظف فقط.</p>
                      </div>
                    </div>
                  </div>

                  {/* Permissions & Assignment Column */}
                  <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest border-b border-purple-500/20 pb-2 flex items-center gap-2">
                       <Award className="w-4 h-4" /> الصلاحيات والمهام
                    </h3>
                    
                    {/* Permissions MultiBox */}
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-black text-slate-600 block pr-2">الصلاحيات الممنوحة</label>
                       <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-4 flex flex-wrap gap-2 min-h-[100px]">
                          {['مشاهدة القضايا', 'تعديل البيانات', 'إضافة مهام', 'التقارير المالية', 'التحليل الذكي', 'إدارة الوثائق'].map(perm => (
                            <button
                              key={perm}
                              type="button"
                              onClick={() => {
                                const current = selectedConfigEmployee?.permissions || [];
                                const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
                                updateEmployeeConfig(selectedConfigEmployee?.id || '', { permissions: updated });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                                (selectedConfigEmployee?.permissions || []).includes(perm)
                                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                  : 'bg-white text-slate-400 border border-slate-200'
                              }`}
                            >
                              {perm}
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Assigned Cases MultiBox */}
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-black text-slate-600 block pr-2">القضايا المسموحة</label>
                       <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-4 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                          {cases.map(c => (
                            <label key={c.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100 transition-all cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 className="accent-primary" 
                                 checked={(selectedConfigEmployee?.assignedCases || []).includes(c.id)}
                                 onChange={() => {
                                   const cur = selectedConfigEmployee?.assignedCases || [];
                                   const updated = cur.includes(c.id) ? cur.filter(id => id !== c.id) : [...cur, c.id];
                                   updateEmployeeConfig(selectedConfigEmployee?.id!, { assignedCases: updated });
                                 }}
                               />
                               <div className="flex-1 min-w-0">
                                 <p className="text-[10px] font-black text-slate-900 truncate">{c.caseName}</p>
                                 <p className="text-[8px] font-bold text-slate-400">{c.caseNumber}</p>
                               </div>
                            </label>
                          ))}
                       </div>
                    </div>

                    {/* Assigned Clients MultiBox */}
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-black text-slate-600 block pr-2">العملاء المسموحون</label>
                       <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-4 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                          {clients.map(cl => (
                            <label key={cl.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100 transition-all cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 className="accent-primary" 
                                 checked={(selectedConfigEmployee?.assignedClients || []).includes(cl.id)}
                                 onChange={() => {
                                   const cur = selectedConfigEmployee?.assignedClients || [];
                                   const updated = cur.includes(cl.id) ? cur.filter(id => id !== cl.id) : [...cur, cl.id];
                                   updateEmployeeConfig(selectedConfigEmployee?.id!, { assignedClients: updated });
                                 }}
                               />
                               <div className="flex-1 min-w-0">
                                 <p className="text-[10px] font-black text-slate-900 truncate">{cl.name}</p>
                                 <p className="text-[8px] font-bold text-slate-400">{cl.phone}</p>
                               </div>
                            </label>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                   {/* Sidebar Configuration */}
                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-sky-600 uppercase tracking-widest border-b border-sky-500/20 pb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> واجهة لوحة التحكم للموظف
                      </h3>
                      <div className="flex flex-wrap gap-3">
                         {[
                           { id: 'dashboard', label: 'الرئيسية' },
                           { id: 'cases', label: 'القضايا' },
                           { id: 'tasks', label: 'المهام' },
                           { id: 'documents', label: 'المستندات' },
                           { id: 'finance', label: 'المالية' },
                           { id: 'najiz', label: 'بوابة ناجز' }
                         ].map(item => (
                           <button
                             key={item.id}
                             type="button"
                             onClick={() => {
                               const cur = selectedConfigEmployee?.sidebarConfig || [];
                               const updated = cur.includes(item.id) ? cur.filter(i => i !== item.id) : [...cur, item.id];
                               updateEmployeeConfig(selectedConfigEmployee?.id!, { sidebarConfig: updated });
                             }}
                             className={`flex-1 min-w-[100px] py-3 rounded-2xl text-[10px] font-black border-2 transition-all ${
                               (selectedConfigEmployee?.sidebarConfig || []).includes(item.id)
                                 ? 'bg-sky-500 border-sky-600 text-white shadow-xl shadow-sky-500/20'
                                 : 'bg-white border-slate-100 text-slate-400'
                             }`}
                           >
                             {item.label}
                           </button>
                         ))}
                      </div>
                   </div>

                   {/* Final Summary & Actions */}
                   <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <Shield className="w-32 h-32" />
                      </div>
                      <div className="relative z-10 space-y-6">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black text-xl">
                                {selectedConfigEmployee?.name?.charAt(0) || '?'}
                             </div>
                             <div>
                                <h4 className="font-black text-lg">بوابة الموظف جاهزة</h4>
                                <p className="text-xs text-slate-400 font-bold">يمكن للموظف الآن الدخول بكامل صلاحياته المختارة.</p>
                             </div>
                         </div>

                         <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رابط الدخول المباشر:</span>
                            <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-nowrap">
                               {window.location.origin}/employee-portal?user={selectedConfigEmployee?.username || 'user'}
                            </div>
                         </div>

                     <div className="flex gap-4">
                            <button 
                              type="submit" 
                              className="flex-1 bg-amber-500 text-slate-950 py-4 rounded-[1.5rem] font-black text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Save className="w-5 h-5" /> حفظ جميع الإعدادات
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Simple verification check
                                const username = (document.getElementsByName('username')[0] as HTMLInputElement).value;
                                const password = (document.getElementsByName('password')[0] as HTMLInputElement).value;
                                if (selectedConfigEmployee?.username === username && selectedConfigEmployee?.password === password) {
                                  sendWhatsAppLink(selectedConfigEmployee);
                                } else {
                                  alert('بيانات الاعتماد غير مطابقة، تعذر توليد الرابط.');
                                }
                              }}
                              className="flex-1 bg-emerald-600 text-white py-4 rounded-[1.5rem] font-black text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                               <MessageSquare className="w-5 h-5" /> تحقق وتوليد رابط الواتساب
                            </button>
                         </div>
                      </div>
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
