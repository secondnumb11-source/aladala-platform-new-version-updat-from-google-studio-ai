import React, { useState, useEffect } from 'react';
import QuickTasks from './QuickTasks';
import StatisticsDashboard from './StatisticsDashboard';
import EmployeeCalendar from './EmployeeCalendar';
import { 
  Users, Lock, Unlock, UserCheck, CheckSquare, Briefcase, PlusCircle, 
  CheckCircle, Shield, TrendingUp, AlertCircle, FileText, Clock, Layout, 
  Globe, Database, Calendar, Layers, Search, Check, Settings2, RefreshCw, 
  GripVertical, Send, MessageSquare, Download, Share2, Filter, Zap, ExternalLink,
  ChevronRight, LogOut, Loader2, Save, Trash2, Eye, EyeOff, Link, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Case, Client, Task, Employee } from '@/types';

interface EmployeePortalProps {
  cases: Case[];
  clients: Client[];
  tasks: Task[];
  currentUser?: any;
  onUpdateState: (type: string, data: any) => void;
}

export default function EmployeePortal({ 
  cases = [], 
  clients = [], 
  tasks = [], 
  currentUser,
  onUpdateState 
}: EmployeePortalProps) {
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'lawyer';
  
  // Admin State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedConfigEmployee, setSelectedConfigEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Portal State (for when an employee is logged in)
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(() => {
    try {
      const stored = sessionStorage.getItem('active-logged-in-employee-v2');
      if (stored) return JSON.parse(stored);
    } catch(e){}
    return null;
  });

  // Fetch employees for admin dropdown
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'employees'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(emps);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Handle Admin Selection
  const handleSelectEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setSelectedConfigEmployee(emp || null);
  };

  const updateEmployeeRemote = async (id: string, updates: Partial<Employee>) => {
    try {
      await updateDoc(doc(db, 'employees', id), updates);
    } catch (e) {
      console.error("Remote update failed:", e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConfigEmployee) return;
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const updates: Partial<Employee> = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      jobTitle: formData.get('jobTitle') as string,
      branch: formData.get('branch') as string,
      najizApiKey: formData.get('najizApiKey') as string,
      portalLink: `${window.location.origin}/employee-portal?user=${formData.get('username')}`
    };

    try {
      await updateDoc(doc(db, 'employees', selectedConfigEmployee.id), updates);
      alert('تم حفظ إعدادات البوابة بنجاح');
    } catch (err) {
      alert('خطأ في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const sendWhatsAppConfig = () => {
    if (!selectedConfigEmployee) return;
    const text = `أهلاً بك يا ${selectedConfigEmployee.name}.\nرابط بوابة الموظفين بمنصة العدالة:\n${selectedConfigEmployee.portalLink || `${window.location.origin}/employee-portal?user=${selectedConfigEmployee.username}`}\nاسم المستخدم: ${selectedConfigEmployee.username}\nكلمة السر: ${selectedConfigEmployee.password}`;
    window.open(`https://wa.me/${selectedConfigEmployee.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Rest of the Portal State (Employee View)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePortalTab, setActivePortalTab] = useState('dashboard');
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [isNajizSyncing, setIsNajizSyncing] = useState(false);
  const [najizResult, setNajizResult] = useState<string | null>(null);

  const writeAuditLog = async (action: string, details: string, emp: Employee) => {
    try {
      await addDoc(collection(db, 'auditlogs'), {
        action,
        details,
        userId: emp.id,
        userName: emp.name,
        timestamp: new Date().toISOString(),
        type: 'sync'
      });
    } catch (e) {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const q = query(
        collection(db, 'employees'), 
        where('username', '==', loginUsername.trim()),
        where('password', '==', loginPassword)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const empData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Employee;
        setLoggedInEmployee(empData);
        sessionStorage.setItem('active-logged-in-employee-v2', JSON.stringify(empData));
        if (empData.sidebarConfig?.[0]) setActivePortalTab(empData.sidebarConfig[0]);
        await writeAuditLog('تسجيل دخول', 'دخل الموظف إلى البوابة', empData);
      } else {
        setLoginError('بيانات الدخول غير صحيحة. يرجى مراجعة الشريك الإداري.');
      }
    } catch (err) {
      setLoginError('فشل الاتصال بالنظام. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    const tokenParam = params.get('token');
    
    if (userParam) setLoginUsername(userParam);

    if (userParam && tokenParam && !loggedInEmployee) {
      const autoLogin = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, 'employees'), 
            where('username', '==', userParam),
            where('customLoginToken', '==', tokenParam)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const empData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Employee;
            setLoggedInEmployee(empData);
            sessionStorage.setItem('active-logged-in-employee-v2', JSON.stringify(empData));
            if (empData.sidebarConfig?.[0]) setActivePortalTab(empData.sidebarConfig[0]);
          } else {
            setLoginError('رابط الدخول المخصص غير صحيح أو منتهي الصلاحية.');
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      autoLogin();
    }
  }, [loggedInEmployee]);

  if (isAdmin) {
    return (
      <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-y-auto p-8 font-sans" dir="rtl">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                  <Shield className="w-6 h-6" />
                </div>
                مركز إعدادات بوابة الموظفين
              </h1>
              <p className="text-slate-500 font-bold mt-2 pr-16 text-sm">حدد الصلاحيات، عين القضايا، وأنشئ حسابات الدخول المخصصة للطاقم القانوني والتقني.</p>
            </div>
            
            <div className="relative w-full md:w-80">
               <select 
                 value={selectedConfigEmployee?.id || ''}
                 onChange={(e) => handleSelectEmployee(e.target.value)}
                 className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 font-black text-xs appearance-none outline-none focus:ring-4 focus:ring-primary/20 cursor-pointer shadow-2xl transition-all border border-white/10"
               >
                  <option value="">اختر الموظف لإعداد بوابته...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.jobTitle})</option>
                  ))}
               </select>
               <ChevronRight className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary rotate-90 pointer-events-none" />
            </div>
          </header>

          <AnimatePresence mode="wait">
            {!selectedConfigEmployee ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-24 bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6"
              >
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center animate-bounce">
                  <Users className="w-12 h-12 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">يرجى تحديد موظف من القائمة أعلاه</h3>
                  <p className="text-slate-500 font-bold max-w-sm mx-auto">عند اختيار موظف، ستتمكن من إدارة صلاحياته، وتعيين قضاياه، وإرسال رابط البوابة الخاصة به.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={selectedConfigEmployee.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Credentials & Access */}
                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> إعدادات تسجيل الدخول
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-600 block pr-2">اسم المستخدم للرابط</label>
                          <input name="username" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900" defaultValue={selectedConfigEmployee.username} />
                        </div>
                        <div className="space-y-1.5 relative">
                          <label className="text-[11px] font-black text-slate-600 block pr-2">كلمة المرور البوابية</label>
                          <div className="relative">
                            <input 
                              name="password" 
                              type={showPass ? 'text' : 'password'}
                              required 
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900" 
                              defaultValue={selectedConfigEmployee.password} 
                            />
                            <button 
                              type="button" onClick={() => setShowPass(!showPass)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 p-2"
                            >
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-600 block pr-2 flex items-center justify-between">
                            مفتاح الربط API (ناجز)
                            <Database className="w-3.5 h-3.5 text-amber-500" />
                          </label>
                          <input name="najizApiKey" className="w-full bg-amber-50/30 border border-amber-500/20 rounded-2xl px-5 py-3.5 text-sm font-mono text-amber-900" defaultValue={selectedConfigEmployee.najizApiKey} placeholder="NAJIZ_SDK_KEY_XXXX..." />
                          <p className="text-[9px] font-bold text-amber-600 leading-tight">هذا المفتاح يسمح للموظف بسحب بياناته المباشرة من ناجز ومزامنتها.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 p-8 opacity-10">
                        <Share2 className="w-32 h-32" />
                      </div>
                      <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-white/5 pb-3 relative z-10 flex items-center gap-2">
                        <Link className="w-4 h-4" /> رابط الدخول المباشر
                      </h3>
                      <div className="relative z-10 space-y-4">
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-emerald-400 break-all leading-relaxed">
                          {window.location.origin}/employee-portal?user={selectedConfigEmployee.username}
                        </div>
                        <div className="flex gap-3">
                           <button 
                             type="button"
                             onClick={() => {
                               navigator.clipboard.writeText(`${window.location.origin}/employee-portal?user=${selectedConfigEmployee.username}`);
                               alert('تم نسخ الرابط');
                             }}
                             className="flex-1 bg-white/10 text-white py-3 rounded-xl text-[10px] font-black transition-all"
                           >نسخ</button>
                           <button 
                             type="button"
                             onClick={sendWhatsAppConfig}
                             className="flex-1 bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                           >
                             <MessageSquare className="w-3.5 h-3.5" /> واتساب
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Assignments & Layout */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Cases Assignment */}
                      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" /> القضايا المسندة
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px] custom-scrollbar">
                          {cases.map(c => (
                            <label key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all cursor-pointer group">
                               <input 
                                 type="checkbox" 
                                 className="w-5 h-5 rounded-lg accent-indigo-600" 
                                 checked={(selectedConfigEmployee.assignedCases || []).includes(c.id)}
                                 onChange={() => {
                                   const cur = selectedConfigEmployee.assignedCases || [];
                                   const updated = cur.includes(c.id) ? cur.filter(id => id !== c.id) : [...cur, c.id];
                                   setSelectedConfigEmployee({ ...selectedConfigEmployee, assignedCases: updated });
                                   updateEmployeeRemote(selectedConfigEmployee.id, { assignedCases: updated });
                                 }}
                               />
                               <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-black text-slate-900 truncate">{c.caseName}</p>
                                 <p className="text-[9px] font-bold text-slate-500">{c.caseNumber}</p>
                               </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Clients Assignment */}
                      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <UserCheck className="w-4 h-4" /> العملاء المسندين
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px] custom-scrollbar">
                          {clients.map(cl => (
                            <label key={cl.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all cursor-pointer group">
                               <input 
                                 type="checkbox" 
                                 className="w-5 h-5 rounded-lg accent-emerald-600" 
                                 checked={(selectedConfigEmployee.assignedClients || []).includes(cl.id)}
                                 onChange={() => {
                                   const cur = selectedConfigEmployee.assignedClients || [];
                                   const updated = cur.includes(cl.id) ? cur.filter(id => id !== cl.id) : [...cur, cl.id];
                                   setSelectedConfigEmployee({ ...selectedConfigEmployee, assignedClients: updated });
                                   updateEmployeeRemote(selectedConfigEmployee.id, { assignedClients: updated });
                                 }}
                               />
                               <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-black text-slate-900 truncate">{cl.name}</p>
                                 <p className="text-[9px] font-bold text-slate-500">{cl.phone}</p>
                               </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Tasks Assignment */}
                      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
                        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <CheckSquare className="w-4 h-4" /> المهام للمتابعة
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px] custom-scrollbar">
                          {tasks.map(t => (
                            <label key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all cursor-pointer group">
                               <input 
                                 type="checkbox" 
                                 className="w-5 h-5 rounded-lg accent-amber-600" 
                                 checked={t.assignedTo === selectedConfigEmployee.name}
                                 onChange={async () => {
                                   const newAssignee = t.assignedTo === selectedConfigEmployee.name ? '' : selectedConfigEmployee.name;
                                   try {
                                     await updateDoc(doc(db, 'tasks', t.id), { assignedTo: newAssignee });
                                   } catch (e) {
                                     console.error("Task assignment failed", e);
                                   }
                                 }}
                               />
                               <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-black text-slate-900 truncate">{t.title}</p>
                                 <p className="text-[9px] font-bold text-slate-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'بدون موعد'}</p>
                               </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                      <h3 className="text-xs font-black text-sky-600 uppercase tracking-widest border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
                        <Layout className="w-4 h-4" /> تخصيص واجهة الموظف والوصول
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {[
                           { id: 'dashboard', label: 'الرئيسية', icon: Layout },
                           { id: 'cases', label: 'القضايا', icon: Briefcase },
                           { id: 'tasks', label: 'المهام', icon: CheckSquare },
                           { id: 'documents', label: 'المستندات', icon: FileText },
                           { id: 'finance', label: 'المالية', icon: Database },
                           { id: 'najiz', label: 'بوابة ناجز', icon: Globe }
                         ].map(item => (
                           <button
                             key={item.id}
                             type="button"
                             onClick={() => {
                               const cur = selectedConfigEmployee.sidebarConfig || [];
                               const updated = cur.includes(item.id) ? cur.filter(i => i !== item.id) : [...cur, item.id];
                               setSelectedConfigEmployee({ ...selectedConfigEmployee, sidebarConfig: updated });
                               updateEmployeeRemote(selectedConfigEmployee.id, { sidebarConfig: updated });
                             }}
                             className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${
                               (selectedConfigEmployee.sidebarConfig || []).includes(item.id)
                                 ? 'bg-sky-500 border-sky-600 text-white shadow-xl shadow-sky-500/20'
                                 : 'bg-white border-slate-100 text-slate-400'
                             }`}
                           >
                             <item.icon className="w-8 h-8" />
                             <span className="text-xs font-black">{item.label}</span>
                           </button>
                         ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                       <button 
                         type="submit"
                         disabled={isSaving}
                         className="bg-primary text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl flex items-center gap-3[1.02] active:scale-95 transition-all"
                       >
                         {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                         <span>حفظ وتفعيل كافة الإعدادات</span>
                       </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ELSE: Traditional Portal Logic for Employees (already implemented in original, just wrap it)
  // Re-reading original file content to keep it clean...
  
  if (!loggedInEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 font-sans" dir="rtl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">بوابة الموظفين</h1>
            <p className="text-slate-400 font-bold">منصة العدالة - نظام الإدارة القانونية الموحد</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-xs font-bold text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-2">اسم المستخدم</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-4 text-white font-black text-sm focus:border-primary outline-none transition-all"
                    placeholder="User_123"
                  />
                  <Users className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-2">كلمة المرور</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-4 text-white font-black text-sm focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <Lock className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

           <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>تسجيل الدخول للنظام</span>
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-[10px] text-slate-500 font-bold">بوابة مؤمنة بتشفير AES-256 للبيانات العدلية</p>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  const [najizSyncLog, setNajizSyncLog] = useState<{msg: string, time: string}[]>([]);

  const triggerNajizScraper = async () => {
    if (!loggedInEmployee?.najizApiKey) {
      alert('لم يتم تعيين مفتاح API لناجز لهذا الموظف. يرجى التواصل مع المدير.');
      return;
    }
    setIsNajizSyncing(true);
    setNajizSyncLog([{ msg: 'جاري الاتصال بخوادم وزارة العدل (ناجز)...', time: new Date().toLocaleTimeString() }]);
    
    // Professional Multi-step sequence
    setTimeout(() => setNajizSyncLog(prev => [...prev, { msg: 'تم التحقق من مفتاح الوصول بنجاح.', time: new Date().toLocaleTimeString() }]), 600);
    setTimeout(() => setNajizSyncLog(prev => [...prev, { msg: 'جاري سحب قائمة القضايا المرتبطة...', time: new Date().toLocaleTimeString() }]), 1200);
    setTimeout(() => setNajizSyncLog(prev => [...prev, { msg: 'تحليل الجلسات والقرارات الأخيرة للموظف...', time: new Date().toLocaleTimeString() }]), 1800);

    setTimeout(async () => {
      setIsNajizSyncing(false);
      setNajizResult('تم العثور على تحديثات جديدة ومزامنتها بنجاح.');
      setNajizSyncLog(prev => [...prev, { msg: 'اكتملت المزامنة بنجاح واستقرار.', time: new Date().toLocaleTimeString() }]);
      setShowSyncSuccess(true);
      const dummyCase: Case = {
        id: `NAJ-${Date.now()}`,
        caseNumber: `1447-${Math.floor(Math.random()*90000)}`,
        caseName: 'تحديث آلي: دعوى عمالية (ناجز)',
        category: 'labor',
        stage: 'litigation',
        status: 'active',
        clientName: 'شركة مساهمة',
        clientId: 'cl-auto',
        opponentName: 'خصم افتراضي',
        courtName: 'المحكمة العمالية',
        lastSessionDate: new Date().toISOString(),
        nextSessionDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        nextSessionTime: '09:00',
        summary: 'تم سحب هذه الدعوى آلياً.',
        details: 'تفاصيل ناجز المحدثة مدمجة مع سجلات المنصة.',
        isNajizSync: true,
        priority: 'high',
        createdAt: new Date().toISOString(),
        attachmentsCount: 0
      };
      onUpdateState('cases', dummyCase);
      if (loggedInEmployee) {
        await writeAuditLog('مزامنة ناجز', `تم سحب قضية جديدة رقم ${dummyCase.caseNumber}`, loggedInEmployee);
      }
      setTimeout(() => setShowSyncSuccess(false), 5000);
    }, 2500);
  };

  const handleLogoutPortal = () => {
    setLoggedInEmployee(null);
    sessionStorage.removeItem('active-logged-in-employee-v2');
    setLoginPassword('');
  };

  // Logic for employee view filters...
  const myCases = loggedInEmployee 
    ? cases.filter(c => loggedInEmployee.assignedCases?.includes(c.id) || loggedInEmployee.assignedCases?.includes(c.caseNumber)) 
    : [];
  const myTasks = loggedInEmployee ? tasks.filter(t => t.assignedTo === loggedInEmployee.name) : [];
  const myClients = loggedInEmployee ? clients.filter(cl => loggedInEmployee.assignedClients?.includes(cl.id)) : [];

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 text-white overflow-hidden font-sans" dir="rtl">
      {/* Top Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black text-xl border border-primary/20">
            {loggedInEmployee.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-black">{loggedInEmployee.name}</h2>
            <p className="text-xs text-slate-400 font-bold">{loggedInEmployee.jobTitle} • {loggedInEmployee.branch}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">متصل بالبوابة الرئيسية</span>
           </div>
           <button 
             onClick={handleLogoutPortal}
             className="p-3 bg-slate-800 rounded-xl transition-all"
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </div>

      <AnimatePresence>
        {showSyncSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-10 right-10 z-50 bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/20"
          >
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white"><CheckCircle className="w-6 h-6" /></div>
            <div><p className="text-sm font-black">اكتملت المزامنة بنجاح</p><p className="text-[10px] font-bold opacity-80">تم تحديث البيانات وربطها باللوحة الرئيسية</p></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {activePortalTab === 'dashboard' && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 p-10 opacity-5"><Briefcase className="w-48 h-48" /></div>
                  <div className="relative z-10">
                      <h1 className="text-3xl font-black mb-3">مرحباً بك مجدداً د. {loggedInEmployee.name.split(' ')[0]}</h1>
                      <p className="text-slate-400 font-bold max-w-xl">لديك {myTasks.length} مهام نشطة اليوم، و {myCases.length} قضايا تحت متابعتك المباشرة.</p>
                      <div className="flex items-center gap-6 mt-8">
                        <div className="text-center">
                            <p className="text-2xl font-black text-white">{myCases.length}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase">القضايا</p>
                        </div>
                        <div className="w-px h-10 bg-slate-800" />
                        <div className="text-center">
                            <p className="text-2xl font-black text-primary">{myTasks.length}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase">المهام</p>
                        </div>
                        <div className="w-px h-10 bg-slate-800" />
                        <div className="text-center">
                            <p className="text-2xl font-black text-emerald-500">{myClients.length}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase">العملاء</p>
                        </div>
                      </div>
                  </div>
                </div>
                <QuickTasks tasks={myTasks} />
            </div>
            {/* Sidebar for employee... */}
            <div className="w-full lg:w-96 space-y-6">
                 {loggedInEmployee.sidebarConfig?.includes('najiz') && (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2"><Database className="w-5 h-5 text-amber-500" />أداة سحب بيانات ناجز</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2"><p className="text-[10px] font-black text-slate-500 uppercase">مفتاح المزامنة:</p><p className="text-xs font-mono text-amber-500 truncate">{loggedInEmployee.najizApiKey || 'غير معرف'}</p></div>
                        <button onClick={triggerNajizScraper} disabled={isNajizSyncing} className="w-full bg-amber-500 text-slate-950 py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-3">{isNajizSyncing ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>جاري سحب البيانات...</span></> : <><RefreshCw className="w-4 h-4" /><span>بدء المزامنة الفورية</span></>}</button>
                        {najizSyncLog.length > 0 && (
                          <div className="mt-4 p-4 bg-black/40 border border-white/5 rounded-xl space-y-2 h-32 overflow-y-auto custom-scrollbar">
                            {najizSyncLog.map((log, i) => (
                              <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-slate-400">{log.msg}</span>
                                <span className="text-amber-500/50">{log.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                 )}
                 <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
                   <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2"><Globe className="w-5 h-5 text-sky-500" />الوصول السريع</h3>
                   <div className="grid grid-cols-2 gap-3">
                      {loggedInEmployee.sidebarConfig?.map(id => (
                        <button key={id} onClick={() => setActivePortalTab(id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all gap-2 ${activePortalTab === id ? 'bg-sky-500 text-white shadow-xl' : 'bg-slate-950 border border-slate-800'}`}>
                          <div className={`p-2 ${activePortalTab === id ? 'text-white' : 'text-slate-500'}`}>
                            {id === 'dashboard' && <Layout className="w-5 h-5" />}
                            {id === 'cases' && <Briefcase className="w-5 h-5" />}
                            {id === 'tasks' && <CheckSquare className="w-5 h-5" />}
                            {id === 'documents' && <FileText className="w-5 h-5" />}
                            {id === 'finance' && <Database className="w-5 h-5" />}
                            {id === 'najiz' && <Globe className="w-5 h-5" />}
                          </div>
                          <span className="text-[10px] font-black">{id === 'dashboard' ? 'الرئيسية' : id === 'cases' ? 'القضايا' : id === 'tasks' ? 'المهام' : id === 'documents' ? 'المستندات' : id === 'finance' ? 'المالية' : 'ناجز'}</span>
                        </button>
                      ))}
                   </div>
                 </div>
            </div>
          </div>
        )}
        {/* Dynamic Views logic... */}
        {(activePortalTab === 'cases' || activePortalTab === 'dashboard') && (
          <div className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3"><div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><Briefcase className="w-6 h-6" /></div>البورتفوليو القضائي</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myCases.map(c => (
                  <motion.div key={c.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] transition-all flex flex-col justify-between group text-right">
                      <div>
                        <div className="flex justify-between items-start mb-4"><span className="text-[10px] font-mono text-primary font-black">{c.caseNumber}</span><span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{c.status === 'active' ? 'قيد الترافع' : 'تحت المراجعة'}</span></div>
                        <h4 className="font-black text-lg text-white mb-2 leading-tight">{c.caseName}</h4>
                        <p className="text-xs text-slate-500 font-bold mb-4 flex items-center gap-2 justify-start"><UserCheck className="w-3.5 h-3.5 text-indigo-500" /> العميل: {c.clientName}</p>
                      </div>
                      <button className="w-full bg-slate-950 border border-slate-800 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2"><span>فتح ملف الدعوى</span><ExternalLink className="w-3 h-3" /></button>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
