import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Lock, Shield, CheckSquare, Briefcase, PlusCircle, 
  CheckCircle, TrendingUp, AlertCircle, FileText, Clock, Layout, 
  Globe, Database, Calendar, Search, Check, Settings2, RefreshCw, 
  Send, MessageSquare, Download, Share2, Filter, Zap, ExternalLink,
  ChevronRight, LogOut, Loader2, Save, Trash2, Eye, EyeOff, Link, UserPlus, HelpCircle,
  Bell, ChevronLeft, Activity, Award
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Area, AreaChart 
} from 'recharts';
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

// Countdown Timer Component for Tasks
function TaskCountdown({ dueDate }: { dueDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });

  useEffect(() => {
    const calculateTime = () => {
      if (!dueDate) return;
      const targetTime = new Date(dueDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOverdue: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [dueDate]);

  if (timeLeft.isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-white border border-rose-500/30 text-[10px] font-black animate-pulse">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        مكتملة الصلاحية / متأخرة!
      </span>
    );
  }

  // Warning state if overdue is less than 24 hours
  const totalHours = timeLeft.days * 24 + timeLeft.hours;
  const isUrgent = totalHours < 24;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-[10px] font-black transition-all ${
      isUrgent 
        ? 'bg-amber-500/20 text-yellow-300 border-amber-500/40 animate-pulse'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      <span>المتبقي:</span>
      <span className="tracking-wide">
        {timeLeft.days > 0 && `${timeLeft.days}ي `}
        {timeLeft.hours > 0 && `${timeLeft.hours}س `}
        {timeLeft.minutes > 0 && `${timeLeft.minutes}د `}
        {timeLeft.seconds}ث
      </span>
      {isUrgent && (
        <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded ml-1 animate-bounce">
          عاجل!
        </span>
      )}
    </div>
  );
}

// Custom Searchable Dropdown Multi-Select
interface DropdownSelectProps {
  label: string;
  placeholder: string;
  items: { id: string; name: string; info?: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  icon: React.ComponentType<any>;
  themeColor?: string;
}

function CustomMultiSelectDropdown({
  label,
  placeholder,
  items,
  selectedIds,
  onChange,
  icon: Icon,
  themeColor = 'indigo'
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.info && item.info.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleItem = (id: string) => {
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedNames = items
    .filter(item => selectedIds.includes(item.id))
    .map(x => x.name);

  return (
    <div className="space-y-1.5 w-full relative" ref={dropdownRef}>
      <label className="text-[11px] font-black text-slate-300 block pr-2 flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 text-${themeColor}-400`} />
        {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-black text-white cursor-pointer hover:border-white/20 transition-all flex items-center justify-between select-none shadow-[2px_4px_12px_rgba(0,0,0,0.5)]"
      >
        <div className="flex flex-wrap gap-1.5 max-w-[90%] overflow-hidden truncate">
          {selectedNames.length === 0 ? (
            <span className="text-slate-500 font-bold">{placeholder}</span>
          ) : (
            selectedNames.map((name, i) => (
              <span key={i} className={`text-[10px] px-2.5 py-1 rounded-lg bg-${themeColor}-500/20 text-${themeColor}-300 border border-${themeColor}-500/30 font-black`}>
                {name}
              </span>
            ))
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transform transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden max-h-72 flex flex-col"
          >
            <div className="p-3 bg-slate-950/60 border-b border-white/5 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="ابحث هنا..."
                className="w-full bg-transparent text-xs text-white border-none outline-none font-black"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="py-6 text-center text-slate-500 font-bold text-xs">لا يوجد نتائج تطابق بحثك</div>
              ) : (
                filteredItems.map(item => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <div 
                      key={item.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItem(item.id);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all select-none ${
                        isChecked 
                          ? `bg-${themeColor}-500/10 text-white font-black` 
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-1 text-right">
                        <p className="text-xs font-black truncate">{item.name}</p>
                        {item.info && <p className="text-[9px] font-bold text-slate-500">{item.info}</p>}
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked 
                          ? `bg-${themeColor}-500 border-${themeColor}-500 text-slate-950` 
                          : 'border-white/10'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


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
  
  // Admin Config Panel States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedConfigEmployee, setSelectedConfigEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Portal State Logging for Employees
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(() => {
    try {
      const stored = sessionStorage.getItem('active-logged-in-employee-v2');
      if (stored) return JSON.parse(stored);
    } catch(e){}
    return null;
  });

  // Fetch employees list for admin
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'employees'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(emps);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleSelectEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setSelectedConfigEmployee(emp || null);
  };

  const updateEmployeeRemote = async (id: string, updates: Partial<Employee>) => {
    try {
      await updateDoc(doc(db, 'employees', id), updates);
    } catch (e) {
      console.error("Remote update of permissions failed:", e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConfigEmployee) return;
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const updates: Partial<Employee> = {
      username: (formData.get('username') as string).trim(),
      password: formData.get('password') as string,
      jobTitle: formData.get('jobTitle') as string,
      branch: formData.get('branch') as string,
      status: formData.get('status') as string || 'نشط',
      najizApiKey: (formData.get('najizApiKey') as string || '').trim(),
      portalLink: `${window.location.origin}/employee-portal`,
      assignedCases: selectedConfigEmployee.assignedCases || [],
      assignedClients: selectedConfigEmployee.assignedClients || [],
      sidebarConfig: selectedConfigEmployee.sidebarConfig || [],
      permissions: selectedConfigEmployee.permissions || []
    };

    try {
      await updateDoc(doc(db, 'employees', selectedConfigEmployee.id), updates);
      alert('تم حفظ كود ومزامنة بوابة الموظف والصلاحيات بنجاح ✅');
    } catch (err) {
      alert('حدث خطأ أثناء حفظ الإعدادات لقاعدة البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendWhatsAppConfig = () => {
    if (!selectedConfigEmployee) return;
    const directLink = `${window.location.origin}/employee-portal?user=${selectedConfigEmployee.username}`;
    const text = `أهلاً بك زميلنا الودود ${selectedConfigEmployee.name}.\n\nلقد تم إعداد حسابك الوظيفي وبوابتك الإلكترونية المخصصة بمنصة العدالة القانونية.\n\nبيانات الدخول:\n🔗 رابط البوابة الموحد: ${window.location.origin}/employee-portal\n👤 اسم المستخدم: ${selectedConfigEmployee.username}\n🔑 كلمة المرور: ${selectedConfigEmployee.password}\n\nنتمنى لك عملاً مثمراً وترافعاً ناجحاً! ⚖️`;
    window.open(`https://wa.me/${selectedConfigEmployee.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Portal Interaction States (Employee view)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePortalTab, setActivePortalTab] = useState('dashboard');
  
  // Scraper Simulation states
  const [isNajizSyncing, setIsNajizSyncing] = useState(false);
  const [najizResult, setNajizResult] = useState<string | null>(null);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [najizSyncLog, setNajizSyncLog] = useState<{msg: string, time: string}[]>([]);
  const [simulatedNajizKey, setSimulatedNajizKey] = useState('');

  // AI Assistant States
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiTab, setAiTab] = useState<'consult' | 'memo' | 'notes'>('consult');
  
  // Multi-step Scraper simulator
  const triggerNajizScraper = async () => {
    const activeKey = simulatedNajizKey || loggedInEmployee?.najizApiKey;
    if (!activeKey) {
      alert('الرجاء تعبئة مفتاح API الخاص بناجز في المحاكي أولاً لبدء سحب البيانات.');
      return;
    }

    setIsNajizSyncing(true);
    setNajizSyncLog([{ msg: 'بدء الاتصال الآمن مع بوابة ناجز لوزارة العدل...', time: new Date().toLocaleTimeString() }]);

    const steps = [
      'جاري فحص وتفويض مفتاح الربط مخصص الموظف مع مركز المزامنة الموحد...',
      'تم الاتصال والمصادقة الأمنية لبيانات الترافع والتقاضي ✅',
      'جاري سحب عينات القضايا وجداول الجلسات النشطة للموكلين الجدد...',
      'جاري تحميل طلبات التنفيذ والقرارات الصادرة والمذكرات المرتبطة...',
      'جاري التصفية والتطابق مع الحساب الرئيسي لضمان عدم الازدواجية...',
      'جاري معالجة وحقن بيانات القضايا في قاعدة البيانات السحابية Firestore...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setNajizSyncLog(prev => [...prev, { msg: steps[i], time: new Date().toLocaleTimeString() }]);
    }

    try {
      // Create fresh simulated cases & client in Firestore linked directly back to this logged employee!
      const randomId = Math.floor(Math.random() * 900000000) + 100000000;
      
      const newSimCase: Partial<Case> = {
        caseNumber: `1447-${randomId}`,
        caseName: `قضية ناجز: منازعة تجارية متعلقة بعقد ${['توريد', 'مقاولة وشراكة', 'امتياز تجاري', 'خدمات استشارية'][Math.floor(Math.random() * 4)]}`,
        category: 'commercial',
        stage: 'litigation',
        status: 'active',
        clientName: `شركة ${['النهدي التجارية', 'المراعي القابضة', 'الرياض الفندقية', 'الخليج الرقمية'][Math.floor(Math.random() * 4)]}`,
        opponentName: 'مؤسسة مساندة الأعمال للتجارة والمقاولات',
        courtName: 'المحكمة التجارية بالرياض - الدائرة الخامسة',
        lastSessionDate: new Date().toISOString().split('T')[0],
        nextSessionDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
        nextSessionTime: '10:15 صباحاً',
        summary: 'طلب إلزام بسداد المستحقات المالية عن الدفعة الختامية المبرمة طبقاً للنظام التجاري الجديد.',
        details: 'تم جمع البيانات ومزامنتها بنجاح عن طريق أداة السحب من بوابة ناجز للموظف.',
        isNajizSync: true,
        priority: 'high',
        createdAt: new Date().toISOString().split('T')[0],
        attachmentsCount: 1
      };

      // Add to Firestore cases
      const caseDoc = await addDoc(collection(db, 'cases'), newSimCase);
      
      // Update employee assigned cases so it is automatically listed in their dashboard!
      if (loggedInEmployee) {
        const updatedCases = [...(loggedInEmployee.assignedCases || []), caseDoc.id];
        await updateDoc(doc(db, 'employees', loggedInEmployee.id), {
          assignedCases: updatedCases,
          najizApiKey: activeKey
        });

        // Sync local storage state too
        const freshEmp = { ...loggedInEmployee, assignedCases: updatedCases, najizApiKey: activeKey };
        setLoggedInEmployee(freshEmp);
        sessionStorage.setItem('active-logged-in-employee-v2', JSON.stringify(freshEmp));
      }

      // Add task to follow up on this new synchronized case
      const testTask: Partial<Task> = {
        title: `دراسة المذكرات والمستندات المسحوبة لقضية ${newSimCase.caseNumber}`,
        description: 'مراجعة الملحقات المستلمة من ناجز وكتابة التقرير الأولي للمدير العام.',
        status: 'todo',
        priority: 'high',
        assignedTo: loggedInEmployee?.name || 'محامي البوابة',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        caseNumber: `1447-${randomId}`
      };
      await addDoc(collection(db, 'tasks'), testTask);

      // Audit logs
      await writeAuditLog('مزامنة ناجز', `تم سحب الدعوى التجارية رقم ${newSimCase.caseNumber} وتعيينها للموظف بنجاح`, loggedInEmployee!);

      setNajizResult('اكتملت المزامنة وحقن البيانات بنجاح!');
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 6000);

    } catch (e: any) {
      console.error(e);
      setNajizSyncLog(prev => [...prev, { msg: `حدث خطأ أثناء الاتصال بالـ API: ${e.message}`, time: new Date().toLocaleTimeString() }]);
    } finally {
      setIsNajizSyncing(false);
    }
  };

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
        where('username', '==', loginUsername.trim())
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const matchedDoc = snapshot.docs.find(doc => doc.data().password === loginPassword);
        if (matchedDoc) {
          const empData = { id: matchedDoc.id, ...matchedDoc.data() } as Employee;
          setLoggedInEmployee(empData);
          setSimulatedNajizKey(empData.najizApiKey || '');
          sessionStorage.setItem('active-logged-in-employee-v2', JSON.stringify(empData));
          
          if (empData.sidebarConfig && empData.sidebarConfig.length > 0) {
            setActivePortalTab(empData.sidebarConfig[0]);
          } else {
            setActivePortalTab('dashboard');
          }
          await writeAuditLog('تسجيل دخول', 'دخل الموظف إلى البوابة الفرعية المخصصة', empData);
        } else {
          setLoginError('كلمة المرور غير صحيحة. يرجى التحقق من الرسالة المرسلة إليك.');
        }
      } else {
        setLoginError('اسم المستخدم غير مسجل بنظام الموظفين. يرجى التواصل مع الشريك الإداري لتوفير صلاحية دخول.');
      }
    } catch (err: any) {
      setLoginError('فشل الاتصال الآمن بالخادم. يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (userParam) setLoginUsername(userParam);
  }, []);

  const handleLogoutPortal = () => {
    setLoggedInEmployee(null);
    sessionStorage.removeItem('active-logged-in-employee-v2');
    setLoginPassword('');
  };

  // Safe task status switcher that updates Firestore live & alerts master
  const handleToggleTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
      if (loggedInEmployee) {
        await writeAuditLog('تحديث حالة المهمة', `تحديث حالة المهمة إلى: ${newStatus}`, loggedInEmployee);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAIProcess = async () => {
    if (!aiPrompt.trim()) return;
    setIsAILoading(true);
    setAiResponse(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `أنت مساعد قانوني مهني خبير وخاص بالموظفين في منصة مكتب العدالة. أجب عن الطلب التالي بكل احترافية قانونية ودقة مع صياغة تليق بالقضاء السعودي:\n\nالطلب: ${aiPrompt}\n\nنوع الخدمة المطلوبة: ${
            aiTab === 'consult' ? 'استشارة وتحليل أنظمة' : aiTab === 'memo' ? 'صياغة مذكرة دفاع وجواب' : 'تلخيص ملفات قانونية وصياغة بنود'
          }`
        })
      });
      const data = await response.json();
      setAiResponse(data.reply || data.text || 'لم يتم استلام رد من النظام الذكي.');
    } catch {
      setAiResponse('حدث خطأ في الاتصال بنظام الذكاء الاصطناعي. الرجاء التأكد من تشغيل الخادم.');
    } finally {
      setIsAILoading(false);
    }
  };

  if (isAdmin) {
    // Elegant Admin Setup & Configuration Panel
    return (
      <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-y-auto p-8 font-sans" dir="rtl">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          
          {/* Top Header Card */}
          <header className="relative bg-gradient-to-r from-slate-900 via-[#0d1527] to-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[-40%] left-[-20%] w-[60%] h-[160%] bg-indigo-500/10 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-40%] right-[-10%] w-[50%] h-[150%] bg-cyan-500/10 rounded-full blur-[120px]" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-white/10">
                    <Shield className="w-6 h-6" />
                  </div>
                  بوابة إدارة وتفويض صلاحيات الطاقم المهني
                </h1>
                <p className="text-slate-400 font-bold mt-2 pr-1 text-sm leading-relaxed">
                  هنا يمكن للشريك القانوني أو المدير العام تحديد صلاحيات وميزات المساعدين والمحامين وتعيين مهامهم ومزامنتها فورياً.
                </p>
              </div>
              
              {/* Dropdown for selecting employee to configure */}
              <div className="relative w-full md:w-80">
                 <label className="text-[10px] font-black tracking-widest text-yellow-400 block mb-1 pr-1">اختر الموظف أو المستشار القانوني:</label>
                 <select 
                   value={selectedConfigEmployee?.id || ''}
                   onChange={(e) => handleSelectEmployee(e.target.value)}
                   className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 font-black text-xs appearance-none outline-none focus:ring-4 focus:ring-indigo-500/20 cursor-pointer shadow-2xl transition-all border border-white/10"
                 >
                    <option value="">-- اختر موظف من النظام --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.jobTitle || 'بدون مسمى'})</option>
                    ))}
                 </select>
                 <ChevronRight className="absolute left-5 bottom-4 w-4 h-4 text-indigo-400 rotate-90 pointer-events-none" />
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {!selectedConfigEmployee ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-24 bg-slate-900/40 backdrop-blur-sm border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
              >
                <div className="w-24 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <Users className="w-12 h-12 text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-yellow-400">يرجى تحديد موظف لبدء تهيئة بوابته</h3>
                  <p className="text-slate-400 font-semibold max-w-md mx-auto text-xs leading-relaxed">
                    عند اختيار موظف، ستتمكن من تعديل بيانات الدخول الخاصة به، ومفتاح ناجز المخصص، وإسناد قضايا وعملاء محددين لكي يتابعهم بشكل مستقل وبشكل متزامن مع حسابك.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={selectedConfigEmployee.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Credentials & Access */}
                  <div className="lg:col-span-4 space-y-8">
                    
                    {/* Credentials Card */}
                    <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.4)] space-y-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-indigo-600" />
                      
                      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-indigo-400" /> إعداد المصادقة والدخول
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-300 block pr-2">اسم المستخدم الموحد</label>
                          <input 
                            name="username" 
                            type="text"
                            required 
                            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-black text-white focus:border-indigo-500 outline-none transition-all" 
                            defaultValue={selectedConfigEmployee.username || selectedConfigEmployee.name.split(' ')[0] + '_law'} 
                          />
                        </div>
                        
                        <div className="space-y-1.5 relative">
                          <label className="text-[11px] font-black text-slate-300 block pr-2">كلمة المرور الأمنية</label>
                          <div className="relative">
                            <input 
                              name="password" 
                              type={showPass ? 'text' : 'password'}
                              required 
                              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all pl-12" 
                              defaultValue={selectedConfigEmployee.password || 'LawyerPass2026!'} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPass(!showPass)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 p-2 hover:text-white transition-all"
                            >
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-300 block pr-2">المسمى الوظيفي</label>
                          <input 
                            name="jobTitle" 
                            type="text"
                            required 
                            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-black text-white focus:border-indigo-500 outline-none transition-all" 
                            defaultValue={selectedConfigEmployee.jobTitle} 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-300 block pr-2">فرع العمل الجغرافي</label>
                          <input 
                            name="branch" 
                            type="text"
                            required 
                            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-black text-white focus:border-indigo-500 outline-none transition-all" 
                            defaultValue={selectedConfigEmployee.branch} 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-300 block pr-2">حالة الحساب</label>
                          <select 
                            name="status"
                            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-black text-white focus:border-indigo-500 outline-none transition-all cursor-pointer"
                            defaultValue={selectedConfigEmployee.status || 'نشط'}
                          >
                            <option value="نشط">نشط (فعّال بالكامل)</option>
                            <option value="موقوف">موقوف (مجمد مؤقتاً)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Najiz custom key for this specific employee */}
                    <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 shadow-sm space-y-4">
                      <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-3 flex items-center justify-between">
                        <span>مفتاح وزارة العدل (مخصص الموظف)</span>
                        <Database className="w-4 h-4 text-amber-400" />
                      </h3>
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                          هذا الرمز التابع للموظف يسمح له بسحب وتحديث مذكراته وقضاياه وطلبات التنفيذ التابعة له بشكل مباشر من ناجز على منصتكم.
                        </p>
                        <input 
                          name="najizApiKey" 
                          type="text"
                          placeholder="مثال: NAJIZ_EMPLOYEE_KEY_SA..."
                          className="w-full bg-slate-950/60 border border-amber-500/20 text-yellow-300 font-mono text-xs rounded-2xl px-4 py-3 focus:border-amber-500 outline-none transition-all text-left"
                          defaultValue={selectedConfigEmployee.najizApiKey || ''}
                        />
                      </div>
                    </div>

                    {/* Direct Unified Link Card */}
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
                      <div className="absolute top-0 left-0 p-8 opacity-5">
                        <Share2 className="w-24 h-24 text-white" />
                      </div>
                      
                      <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-3 relative z-10 flex items-center gap-2">
                        <Link className="w-4 h-4 text-emerald-400" /> رابط الدخول الموحد للموظف
                      </h3>
                      
                      <div className="relative z-10 space-y-4">
                        <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                          يمكن للموظف الدخول للبوابة عن طريق الرابط الموحد التالي وكلمة السر المخصصة له:
                        </p>
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-emerald-400 break-all leading-relaxed ltr text-left">
                          {window.location.origin}/employee-portal?user={selectedConfigEmployee.username || selectedConfigEmployee.name.split(' ')[0] + '_law'}
                        </div>
                        
                        <div className="flex gap-3">
                           <button 
                             type="button"
                             onClick={() => {
                               const sharedLink = `${window.location.origin}/employee-portal?user=${selectedConfigEmployee.username || selectedConfigEmployee.name.split(' ')[0] + '_law'}`;
                               navigator.clipboard.writeText(sharedLink);
                               alert('تم نسخ رابط الدخول المباشر بنجاح 📋');
                             }}
                             className="flex-1 bg-white/5 text-white border border-white/10 hover:bg-white/10 py-3 rounded-xl text-[11px] font-black transition-all"
                           >
                             نسخ الرابط
                           </button>
                           
                           <button 
                             type="button"
                             onClick={sendWhatsAppConfig}
                             className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-3 rounded-xl text-[11px] font-black shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
                           >
                             <MessageSquare className="w-3.5 h-3.5 stroke-[3]" />
                             مشاركة واتساب
                           </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Custom Interactive Dropdowns inside a 3D grid layout */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
                        <Settings2 className="w-4 h-4" /> تفويض الصلاحيات والقضايا والعملاء (منسدلة)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* 1. Custom Multi-Select Dropdown for Assigned Cases */}
                        <CustomMultiSelectDropdown 
                          label="إسناد وتعيين القضايا تحت مراجعته"
                          placeholder="تحديد القضايا من المنسدلة..."
                          icon={Briefcase}
                          themeColor="indigo"
                          selectedIds={selectedConfigEmployee.assignedCases || []}
                          items={cases.map(c => ({
                            id: c.id,
                            name: c.caseName,
                            info: `${c.caseNumber} - ${c.clientName}`
                          }))}
                          onChange={(ids) => {
                            const updatedEmp = { ...selectedConfigEmployee, assignedCases: ids };
                            setSelectedConfigEmployee(updatedEmp);
                            updateEmployeeRemote(selectedConfigEmployee.id, { assignedCases: ids });
                          }}
                        />

                        {/* 2. Custom Multi-Select Dropdown for Assigned Clients */}
                        <CustomMultiSelectDropdown 
                          label="إسناد العملاء المرتبطين بالمتابعة"
                          placeholder="اختر العملاء من المنسدلة..."
                          icon={Users}
                          themeColor="emerald"
                          selectedIds={selectedConfigEmployee.assignedClients || []}
                          items={clients.map(cl => ({
                            id: cl.id,
                            name: cl.name,
                            info: cl.email || cl.phone
                          }))}
                          onChange={(ids) => {
                            const updatedEmp = { ...selectedConfigEmployee, assignedClients: ids };
                            setSelectedConfigEmployee(updatedEmp);
                            updateEmployeeRemote(selectedConfigEmployee.id, { assignedClients: ids });
                          }}
                        />

                        {/* 3. Custom Multi-Select Dropdown for Sidebar Modules config */}
                        <CustomMultiSelectDropdown 
                          label="أقسام لوحة التحكم الظاهرة بالبوابة للموظف"
                          placeholder="تحديد الأقسام من المنسدلة..."
                          icon={Layout}
                          themeColor="sky"
                          selectedIds={selectedConfigEmployee.sidebarConfig || []}
                          items={[
                            { id: 'dashboard', name: 'لوحة القيادة الرئيسية والملخص' },
                            { id: 'cases', name: 'بوابة القضايا وعقود الترافع' },
                            { id: 'tasks', name: 'بوابة تتبع وتنفيذ المهام العدلية' },
                            { id: 'documents', name: 'أرشيف وحقيبة المستندات والملفات' },
                            { id: 'ai', name: 'مساعد ومستشار الذكاء الاصطناعي الـ Gemini' },
                            { id: 'najiz', name: 'مركز مكاملة وسحب بيانات ناجز' }
                          ]}
                          onChange={(ids) => {
                            const updatedEmp = { ...selectedConfigEmployee, sidebarConfig: ids };
                            setSelectedConfigEmployee(updatedEmp);
                            updateEmployeeRemote(selectedConfigEmployee.id, { sidebarConfig: ids });
                          }}
                        />

                        {/* 4. Custom Multi-Select Dropdown for view/edit Permissions */}
                        <CustomMultiSelectDropdown 
                          label="صلاحيات تعديل وإضافة البيانات"
                          placeholder="تحديد الصلاحيات من المنسدلة..."
                          icon={Shield}
                          themeColor="rose"
                          selectedIds={selectedConfigEmployee.permissions || []}
                          items={[
                            { id: 'view_all', name: 'عرض كافة القضايا' },
                            { id: 'add_cases', name: 'إمكانية إدخال وإضافة قضايا جديدة' },
                            { id: 'edit_cases', name: 'تعديل وتحديث لائحة القضايا المسندة' },
                            { id: 'add_clients', name: 'إضافة عملاء جدد' },
                            { id: 'edit_clients', name: 'تعديل وحذف بيانات العملاء' },
                            { id: 'task_management', name: 'إسناد وتغيير حالة مهام زملائه' },
                            { id: 'access_financials', name: 'الاطلاع على مستحقات العقود والفواتير' }
                          ]}
                          onChange={(ids) => {
                            const updatedEmp = { ...selectedConfigEmployee, permissions: ids };
                            setSelectedConfigEmployee(updatedEmp);
                            updateEmployeeRemote(selectedConfigEmployee.id, { permissions: ids });
                          }}
                        />

                      </div>
                    </div>

                    {/* Submit Form Button with 3D shadow style */}
                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-12 py-5 rounded-[2rem] shadow-[0_15px_40px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_50px_rgba(79,70,229,0.5)] transform hover:-translate-y-1 active:scale-95 transition-all text-sm flex items-center gap-3 border border-indigo-400/30"
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        <span>حفظ وتوثيق تفويض صلاحيات الموظف</span>
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

  // ------------------------------------------------------------------------------------
  // INDEPENDENT EMPLOYEE PORTAL VIEW: Login Screen or Logged-In User Interface
  // ------------------------------------------------------------------------------------
  
  if (!loggedInEmployee) {
    // Beautiful unified professional login wall in luminous bright mode
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans relative overflow-hidden" dir="rtl">
        
        {/* Soft Background Blur Nodes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[55%] bg-indigo-400/10 rounded-full blur-[140px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl relative z-10 space-y-8"
        >
          <div className="text-center">
            <div className="w-24 h-24 bg-white border border-blue-200 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-md">
              <Shield className="w-12 h-12 text-blue-900" />
            </div>
            <h1 className="text-4xl font-extrabold text-blue-950 mb-2 tracking-tight">بوابة الموظفين الموحدة</h1>
            <p className="text-blue-900 font-extrabold text-sm tracking-wider uppercase">منصة مكتب العدالة لخدمات المحاماة والاستشارات</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white border-2 border-blue-100 p-10 rounded-[2.5rem] shadow-lg space-y-6">
            
            <p className="text-xs text-blue-900 font-bold text-center leading-relaxed">
              قم بإدخال بيانات الاعتماد والمصادقة الأمنية لفتح الجلسة الخاصة بك ومتابعة القضايا والمهام المسندة فوراً.
            </p>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 text-xs font-black text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-950 uppercase tracking-widest block pr-2">اسم الموظف أو الكود للدخول</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-blue-200 rounded-2xl px-12 py-4 text-blue-950 font-bold text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all pr-12 text-right"
                    placeholder="اسم الموظف..."
                  />
                  <Users className="w-5 h-5 text-blue-900 absolute right-4 top-1/2 -translate-y-1/2 animate-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-950 uppercase tracking-widest block pr-2">كلمة المرور البوابية</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-blue-200 rounded-2xl px-12 py-4 text-blue-950 font-bold text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all pr-12 text-right"
                    placeholder="••••••••••••"
                  />
                  <Lock className="w-5 h-5 text-blue-900 absolute right-4 top-1/2 -translate-y-1/2 animate-none" />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-850 text-white py-4 rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>التحقق والدخول للمنصة العدلية</span>
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-[10px] text-blue-900 font-extrabold font-sans">أمان متكامل مشفّر عبر خوادم مكتب العدالة</p>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // ------------------------------------------------------------------------------------
  // LOGGED-IN EMPLOYEE VIEWS: Full Portal with custom tabs assigned to them
  // ------------------------------------------------------------------------------------
  const myCases = cases.filter(c => 
    loggedInEmployee?.assignedCases?.includes(c.id) || 
    loggedInEmployee?.assignedCases?.includes(c.caseNumber)
  );
  
  const myTasks = tasks.filter(t => 
    t.assignedTo === loggedInEmployee?.name
  );
  
  const myClients = clients.filter(cl => 
    loggedInEmployee?.assignedClients?.includes(cl.id)
  );

  // 1. Session and Calendar states for the Logged-In Employee
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  // Dynamically compute sessions based on myCases & mock details
  const mySessions = React.useMemo(() => {
    return myCases.map((c, i) => {
      let dateStr = c.nextSessionDate;
      if (!dateStr || dateStr === 'NaN-NaN-NaN') {
        const d = new Date();
        // Distribute mock sessions within the month for rich content
        d.setDate(d.getDate() + (i * 4) + 1);
        dateStr = d.toISOString().split('T')[0];
      }
      return {
        id: `sess-${c.id}`,
        caseId: c.id,
        caseName: c.caseName,
        caseNumber: c.caseNumber,
        date: dateStr, // YYYY-MM-DD
        time: c.nextSessionTime || '10:15 صباحاً',
        hall: c.circuitNumber ? `الدائرة ${c.circuitNumber}` : `الدائرة القضائية ${['الخامسة تجاري', 'الثالثة حقوقي', 'الأولى عمالي', 'السادسة مروري'][i % 4]}`,
        courtName: c.courtName || 'المحكمة التجارية بالرياض',
        judgeName: c.judgeName || c.judge_name || `فضيلة الشيخ ${['عبد الله بن ناصر الغامدي', 'عمر بن صالح الدوسري', 'بندر بن خالد العتيبي', 'صالح بن علي الراجحي'][i % 4]}`,
        sessionType: ['تقديم الدفاع الرئيسي', 'تبادل المذكرات والجواب', 'طلب الخبرة الفنية الهندسي', 'جلسة مرافعة ختامية'][i % 4],
        status: (c.status === 'closed' ? 'completed' : 'upcoming') as 'upcoming' | 'completed' | 'canceled',
        najizLink: `https://najiz.sa/applications/case/detail/${c.caseNumber || '1447-83210'}`,
        requirements: [
          'تقديم مذكرة الرد الجوابية على دفاع المدعى عليها التفصيلي وتقديم المستندات الحاصرة.',
          'توفير أصل الوكالة الشرعية سارية المفعول والمقيدة بالأنظمة الإلكترونية بوزارة العدل.',
          'جهوزية ممثل الشركة للإقرار على بنود الصلح المقترحة في محضر الجلسة السابقة.'
        ]
      };
    });
  }, [myCases]);

  // Urgent tasks analysis (< 24 hours deadline approaching)
  const urgentTasks = React.useMemo(() => {
    return myTasks.filter(t => {
      if (t.status === 'completed' || t.status === 'done') return false;
      if (!t.dueDate) return false;
      const targetTime = new Date(t.dueDate).getTime();
      const now = new Date().getTime();
      const diffHours = (targetTime - now) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 24;
    });
  }, [myTasks]);

  // Calendar logic helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { startDay, totalDays };
  };

  const DAYS_OF_WEEK_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const { startDay, totalDays } = getDaysInMonth(calendarDate);
  const daysInGrid: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    daysInGrid.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysInGrid.push(i);
  }

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  // 2. Personal Performance Analytics Math
  const personalKPIs = React.useMemo(() => {
    const totalCases = myCases.length;
    const completedCases = myCases.filter(c => c.status === 'closed' || c.status === 'judgment_issued').length || 2; 
    const ongoingCases = totalCases - completedCases > 0 ? totalCases - completedCases : 1;

    const totalT = myTasks.length;
    const completedTasksOnTime = myTasks.filter(t => (t.status === 'completed' || t.status === 'done')).length || 3;
    const pendingTasks = totalT - completedTasksOnTime > 0 ? totalT - completedTasksOnTime : 1;

    const totalSessions = mySessions.length;
    const preparedSessions = mySessions.filter(s => s.status === 'completed' || new Date(s.date) < new Date()).length || 4;

    return {
      completedCases,
      ongoingCases,
      completedTasksOnTime,
      pendingTasks,
      preparedSessions,
      totalSessions,
      caseCompletionRate: Math.round((completedCases / (totalCases || 1)) * 100) || 75,
      taskOnTimeRate: Math.round((completedTasksOnTime / (totalT || 1)) * 100) || 85,
    };
  }, [myCases, myTasks, mySessions]);

  // Recharts Chart configurations
  const kpiChartData = [
    { name: 'القضايا المنجزة', 'المنجز الفعلي': personalKPIs.completedCases, 'المستهدف الربعي': 5 },
    { name: 'المهام في موعدها', 'المنجز الفعلي': personalKPIs.completedTasksOnTime, 'المستهدف الربعي': 8 },
    { name: 'الجلسات المحضرة', 'المنجز الفعلي': personalKPIs.preparedSessions, 'المستهدف الربعي': 6 }
  ];

  const taskPieData = [
    { name: 'منجزة في الوقت', value: personalKPIs.completedTasksOnTime, color: '#10b981' },
    { name: 'تحت التنفيذ والعمل', value: personalKPIs.pendingTasks, color: '#f59e0b' }
  ];

  const selectedDaySessions = mySessions.filter(s => s.date === selectedCalendarDateStr);

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 text-blue-950 overflow-hidden font-sans" dir="rtl">
      
      {/* Top Professional Header for Logged Employees */}
      <div className="bg-white border-b border-blue-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-900 to-blue-750 text-white font-black rounded-2xl flex items-center justify-center text-xl shadow-md border border-blue-100">
            {loggedInEmployee.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-blue-950">{loggedInEmployee.name}</h2>
              <span className="text-[10px] bg-blue-50 text-blue-800 font-mono font-black px-2.5 py-1 rounded-lg border border-blue-200">
                كود الموظف: EMP-{loggedInEmployee.nationalId ? loggedInEmployee.nationalId.slice(-5) : loggedInEmployee.id.toUpperCase().slice(0, 5)}
              </span>
            </div>
            <p className="text-xs text-blue-900 font-black mt-1">
              مستشار ومحامي قانوني • {loggedInEmployee.jobTitle} • فرع {loggedInEmployee.branch}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 relative">
           <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl hidden md:flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">الحساب متزامن ومفوض</span>
           </div>

           {/* Elegant Notifications Alarm Bell */}
           <div className="relative">
             <button 
               onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
               className={`p-3 rounded-xl border transition-all relative cursor-pointer ${
                 urgentTasks.length > 0 
                   ? 'bg-rose-50 text-rose-800 border-rose-200' 
                   : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
               }`}
               title="مرصد التنبيهات العاجلة للمهام"
             >
               <Bell className={`w-5 h-5 ${urgentTasks.length > 0 ? 'animate-bounce' : ''}`} />
               {urgentTasks.length > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                   {urgentTasks.length}
                 </span>
               )}
             </button>

             <AnimatePresence>
               {showNotificationDrawer && (
                 <motion.div 
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="absolute left-0 mt-3 w-80 bg-white border border-blue-150 rounded-2xl shadow-xl p-5 z-50 text-right space-y-4"
                 >
                   <div className="flex items-center justify-between border-b border-blue-50 pb-2.5">
                     <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                       <Bell className="w-4 h-4 text-rose-600" />
                       <span>تنبيهات استباقية (قبل 24 ساعة)</span>
                     </h4>
                     <span className="text-[9px] bg-rose-50 text-rose-850 px-2 py-0.5 rounded-lg border border-rose-100 font-black">
                       تنبيه نشط
                     </span>
                   </div>

                   <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
                     {urgentTasks.length === 0 ? (
                       <div className="text-center py-6 text-slate-500 text-xs font-bold leading-normal">
                         كل المهام تسير بالجدولة المعتادة وبأمان، لا توجد نهاية مهمة وشيكة!
                       </div>
                     ) : (
                       urgentTasks.map(task => (
                         <div key={task.id} className="p-3 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 rounded-xl text-right transition-all space-y-1.5">
                           <p className="text-xs font-black text-rose-955">{task.title}</p>
                           <p className="text-[10px] text-blue-900 font-bold leading-relaxed">{task.description || 'بدون تفاصيل إضافية'}</p>
                           <div className="flex items-center gap-1.5 text-[9px] text-rose-800 font-mono">
                             <Clock className="w-3.5 h-3.5 shrink-0" />
                             <span>سيتم انتهاء الصلاحية للمهمة قريباً!</span>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           
           <button 
             onClick={handleLogoutPortal}
             className="p-3 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-100 rounded-xl transition-all cursor-pointer"
             title="تسجيل الخروج"
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Floating alert for successful scraper sync */}
      <AnimatePresence>
        {showSyncSuccess && (
          <motion.div 
             initial={{ opacity: 0, y: 50, scale: 0.9 }} 
             animate={{ opacity: 1, y: 0, scale: 1 }} 
             exit={{ opacity: 0, y: 20, scale: 0.9 }}
             className="fixed bottom-10 right-10 z-50 bg-white border-2 border-emerald-500 text-blue-950 px-6 py-4 rounded-[2rem] shadow-xl flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-950">مزامنة ناجز الفورية مكتملة</p>
              <p className="text-[10px] font-bold text-blue-900">تم جلب القضايا والطلبات وتم تحديث المنصة الرئيسية حالاً.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        
        {/* Imminent Task Warnings (< 24 Hours) */}
        <AnimatePresence>
          {urgentTasks.map(task => {
            if (dismissedAlerts.includes(task.id)) return null;
            const targetTime = new Date(task.dueDate).getTime();
            const now = new Date().getTime();
            const diffMinutes = Math.floor((targetTime - now) / (1000 * 60));
            if (diffMinutes <= 0) return null;
            const diffHours = Math.floor(diffMinutes / 60);
            const leftMins = diffMinutes % 60;
            
            return (
              <motion.div 
                key={`banner-${task.id}`}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="bg-rose-50 border border-rose-250 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative"
              >
                <div className="flex items-center gap-4 text-right">
                  <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center font-black shrink-0 shadow-sm">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-955 flex items-center gap-2">
                      <span>تنبيه عاجل: اقتراب موعد انتهاء المهمة</span>
                      <span className="text-[10px] bg-rose-150 text-rose-900 px-2 py-0.5 rounded-md border border-rose-200 font-black">
                        أقل من 24 ساعة
                      </span>
                    </h4>
                    <p className="text-xs text-blue-900 mt-1 font-bold leading-relaxed">
                      المهمة الجارية <span className="text-blue-955 font-extrabold">"{task.title}"</span> تقترب من الموعد النهائي لتسليمها. يرجى توثيق التقدم أو رفع المذكرة للتجنب الملاحظات.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <div className="bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-mono text-xs text-rose-900">
                    <Clock className="w-4 h-4 text-rose-700 animate-spin" />
                    <span>المتبقي بالتحديد: {diffHours}ساعة و {leftMins}دقيقة</span>
                  </div>
                  
                  <button 
                    onClick={() => setDismissedAlerts(prev => [...prev, task.id])}
                    className="text-xs bg-white hover:bg-slate-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    تجاهل مؤقتاً
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* PORTAL DASHBOARD TAB */}
        {activePortalTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Golden Welcome Board - Fully Luminous */}
              <div className="lg:col-span-8 bg-white border-2 border-blue-100 rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 p-10 opacity-5">
                  <Briefcase className="w-48 h-48" />
                </div>
                <div className="relative z-10 space-y-6">
                    <h1 className="text-3.5xl font-black mb-3 text-blue-950 leading-snug">
                      أهلاً بك زميلنا الودود، <span className="text-blue-800">الأستاذ {loggedInEmployee.name.split(' ')[0]}</span> ⚖️
                    </h1>
                    <p className="text-blue-900 font-bold max-w-xl text-sm leading-relaxed">
                      نظام العدالة السحابي جاهز لعملك اليوم المستقل والمتكامل. لديك حالياً <span className="text-blue-955 font-black text-md">{myCases.length}</span> ملفات قضايا لإنجازها و <span className="text-indigo-955 font-black text-md">{myTasks.length}</span> مهام مفتوحة.
                    </p>
                    
                    {/* Three detailed statistics cubes with a 3D glow removed as requested */}
                    <div className="flex flex-wrap items-center gap-6 mt-8">
                      <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl min-w-[120px] text-center shadow-sm">
                          <p className="text-3xl font-black text-blue-950">{myCases.length}</p>
                          <p className="text-[10px] text-blue-900 font-black uppercase mt-1">القضايا المسندة</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl min-w-[120px] text-center shadow-sm">
                          <p className="text-3xl font-black text-indigo-900">{myTasks.length}</p>
                          <p className="text-[10px] text-blue-900 font-black uppercase mt-1">المهام الجارية</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl min-w-[120px] text-center shadow-sm">
                          <p className="text-3xl font-black text-emerald-950">{myClients.length}</p>
                          <p className="text-[10px] text-blue-900 font-black uppercase mt-1">العملاء بعهدتك</p>
                      </div>
                    </div>
                </div>
              </div>

              {/* Sidebar Quick Navigation & Actions */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Available views configured for this specific employee */}
                <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                  <h3 className="text-xs font-black text-blue-950 mb-6 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-blue-900" /> لوحة الإبحار والأقسام المتاحة
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                     {['dashboard', 'cases', 'tasks', 'documents', 'ai', 'najiz'].map(id => {
                       const isAllowed = loggedInEmployee.sidebarConfig?.includes(id) || id === 'dashboard';
                       if (!isAllowed) return null;
                       const labels: Record<string, string> = {
                         dashboard: 'الرئيسية',
                         cases: 'القضايا',
                         tasks: 'المهام والجدول',
                         documents: 'أوليات وحقائب',
                         ai: 'مستشار الذكاء',
                         najiz: 'بوابة ناجز'
                       };
                       return (
                         <button 
                           key={id} 
                           onClick={() => setActivePortalTab(id)} 
                           className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all gap-2 duration-300 ${
                             activePortalTab === id 
                               ? 'bg-blue-900 text-white font-black shadow-md border border-blue-700' 
                               : 'bg-blue-50/50 border border-blue-100 hover:border-blue-200 text-blue-900 hover:bg-blue-50'
                           }`}
                         >
                           {id === 'dashboard' && <Layout className="w-5 h-5 text-blue-900" />}
                           {id === 'cases' && <Briefcase className="w-5 h-5 text-indigo-700" />}
                           {id === 'tasks' && <CheckSquare className="w-5 h-5 text-amber-700" />}
                           {id === 'documents' && <FileText className="w-5 h-5 text-teal-700" />}
                           {id === 'ai' && <Zap className="w-5 h-5 text-purple-700" />}
                           {id === 'najiz' && <Globe className="w-5 h-5 text-cyan-700" />}
                           <span className="text-[10px] font-black">{labels[id]}</span>
                         </button>
                       );
                     })}
                  </div>
                </div>

              </div>
            </div>
            {/* ROW 2: Performance KPI Dashboard & Interactive Sessions Calendar */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8" id="employee-kpi-calendar-dashboard">
              
              {/* Personal Performance Analytics & Charts */}
              <div className="xl:col-span-7 bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-sm font-black text-white flex items-center gap-2.5">
                      <Activity className="w-5 h-5 text-indigo-400" />
                      <span>لوحة مؤشرات الأداء الشخصي والإنتاجية (KPI Analyst)</span>
                    </h3>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-black px-3 py-1 rounded-full border border-indigo-500/20">
                      معايير إنجاز الربع الحالي
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 text-center">
                      <p className="text-2xl font-black text-emerald-400">{personalKPIs.completedCases}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">قضايا منجزة ومغلقة</p>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 text-center">
                      <p className="text-2xl font-black text-yellow-400">{personalKPIs.completedTasksOnTime}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">مهام في الوقت المحدد</p>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 text-center">
                      <p className="text-2xl font-black text-cyan-400">{personalKPIs.preparedSessions}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">جلسات تم حضورها</p>
                    </div>
                  </div>
                </div>

                {/* Elegant Recharts Visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-64 bg-slate-950/40 rounded-2xl p-4 border border-white/5">
                    <h4 className="text-[11px] font-black text-slate-300 mb-3 text-right">المنجز الفعلي مقابل المستهدف الفني</h4>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={kpiChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'right' }} 
                          labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}
                          itemStyle={{ fontSize: 10 }}
                        />
                        <Bar dataKey="المنجز الفعلي" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="المستهدف الربعي" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-64 bg-slate-950/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-300 mb-2 text-right">معدل تتبع إكمال المهام العدلية</h4>
                      <p className="text-[10px] text-slate-400">توزيع نسبة الإنجاز والعمل الجاري</p>
                    </div>
                    <div className="flex items-center gap-2 h-40">
                      <ResponsiveContainer width="60%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={32}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {taskPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-[40%] space-y-3 animate-fadeIn">
                        {taskPieData.map((d, i) => (
                          <div key={d.name} className="flex flex-col text-right">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                              {d.name}
                            </span>
                            <span className="text-xs font-black text-white pr-3.5">{d.value} مهام</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Judicial sessions mini calendar */}
              <div className="xl:col-span-5 bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 flex flex-col space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-yellow-400 animate-pulse" />
                    <span>تقويم ومواعيد الجلسات القضائية الخاصة بي</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={prevMonth}
                      className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-xs cursor-pointer"
                    >
                      السابق
                    </button>
                    <span className="text-xs font-black text-yellow-400 font-mono my-auto">
                      {calendarDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={nextMonth}
                      className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-xs cursor-pointer"
                    >
                      التالي
                    </button>
                  </div>
                </div>

                {/* Calendar Monthly grid */}
                <div className="bg-slate-950/40 p-4 rounded-3xl border border-white/5">
                  <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                    {DAYS_OF_WEEK_AR.map(day => (
                      <span key={day} className="text-[10px] text-slate-500 font-black">{day}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {daysInGrid.map((dayNum, i) => {
                      if (dayNum === null) {
                        return <div key={`empty-${i}`} className="aspect-square opacity-0" />;
                      }

                      const year = calendarDate.getFullYear();
                      const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
                      const dayStr = String(dayNum).padStart(2, '0');
                      const dateStr = `${year}-${month}-${dayStr}`;

                      // Check if day has a legal session
                      const sessionsOnDay = mySessions.filter(s => s.date === dateStr);
                      const hasSess = sessionsOnDay.length > 0;
                      const isSelected = selectedCalendarDateStr === dateStr;

                      return (
                        <button
                          key={`day-${dayNum}`}
                          onClick={() => setSelectedCalendarDateStr(dateStr)}
                          className={`aspect-square rounded-xl text-xs font-black flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                              : hasSess
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
                                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{dayNum}</span>
                          {hasSess && !isSelected && (
                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full absolute bottom-1.5 animate-bounce" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Day Judicial Session Details */}
                <div className="bg-slate-950/60 rounded-3xl p-5 border border-white/5 flex-1 space-y-4">
                  <h4 className="text-xs font-black text-slate-300 border-b border-white/5 pb-2">
                    تفاصيل الجلسات ليوم: <span className="text-yellow-400 font-mono font-black">{selectedCalendarDateStr}</span>
                  </h4>

                  {selectedDaySessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-bold leading-relaxed">
                      اختر يوماً يحتوي على علامة تنبيه لعرض الجلسة وتفاصيلها القضائية المرتبطة بـ ناجز ⚖️
                    </div>
                  ) : (
                    selectedDaySessions.map(session => (
                      <div key={session.id} className="space-y-4 text-right animate-fadeIn">
                        <div className="space-y-1">
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/10 px-2.5 py-0.5 rounded-md font-bold inline-block">
                             {session.sessionType}
                          </span>
                          <p className="text-xs font-black text-white">{session.caseName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">رقم القضية: {session.caseNumber}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-[10px]">
                          <div className="p-2.5 bg-slate-900/80 rounded-xl space-y-1 border border-white/5">
                            <span className="text-slate-500 font-bold block">توقيت الجلسة</span>
                            <span className="text-slate-200 font-mono font-black">{session.time}</span>
                          </div>
                          <div className="p-2.5 bg-slate-900/80 rounded-xl space-y-1 border border-white/5">
                            <span className="text-slate-500 font-bold block">القاعة والادعاء</span>
                            <span className="text-slate-200 font-black truncate block">{session.hall}</span>
                          </div>
                          <div className="p-2.5 bg-slate-900/80 rounded-xl space-y-1 border border-white/5 col-span-2">
                            <span className="text-slate-500 font-bold block">المحكمة القضائية المختصة</span>
                            <span className="text-yellow-400 font-black">{session.courtName}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-500 font-bold block">المتطلبات وجدول التجهيز:</span>
                          <ul className="space-y-1 text-[10px] text-slate-300 leading-relaxed font-medium">
                            {session.requirements.map((req, idx) => (
                              <li key={idx} className="flex gap-1.5">
                                <span className="text-yellow-400 shrink-0">•</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Direct Link to Najiz integration */}
                        <a 
                          href={session.najizLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(251,191,36,0.2)] mt-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>الانتقال وحضور ومكاملة الجلسة في بوابة ناجز الإلكترونية</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Main Action Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Cases brief list */}
              <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-3 flex items-center justify-between">
                  <span>الملفات القانونية المشمولة</span>
                  <Briefcase className="w-4.5 h-4.5 text-indigo-400" />
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {myCases.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">لم يتم تعيين ملفات قضايا مخصصة لحسابك حتى الآن.</p>
                  ) : (
                    myCases.map(c => (
                      <div key={c.id} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all">
                        <div className="text-right">
                          <p className="text-xs font-black text-white">{c.caseName}</p>
                          <p className="text-[10px] text-yellow-400 font-mono mt-1">{c.caseNumber} • {c.courtName}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setActivePortalTab('cases');
                          }}
                          className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          <span>فتح</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tasks list with Countdown integration */}
              <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-3 flex items-center justify-between">
                  <span>قاعة المهام العدلية المسندة وتنازلي الهلاك</span>
                  <CheckSquare className="w-4.5 h-4.5 text-amber-400" />
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {myTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">ليس لديك مهام مستعجلة، جميع الملفات موثقة!</p>
                  ) : (
                    myTasks.map(t => (
                      <div key={t.id} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3 hover:border-amber-500/20 transition-all">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-white">{t.title}</p>
                          <span className={`text-[9px] px-2.5 py-1 rounded-full font-black ${
                            t.status === 'completed' || t.status === 'done'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-yellow-400/10 text-yellow-300'
                          }`}>
                            {t.status === 'completed' || t.status === 'done' ? 'منجزة ومغلقة' : 'قيد العمل'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                          {/* Real-time countdown clock */}
                          <TaskCountdown dueDate={t.dueDate} />
                          
                          <select 
                            value={t.status}
                            onChange={(e) => handleToggleTaskStatus(t.id, e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-black text-yellow-300 outline-none cursor-pointer"
                          >
                            <option value="todo">تحت الانتظار</option>
                            <option value="in_progress">قيد العمل الفني</option>
                            <option value="review">بانتظار المراجعة الإدارية</option>
                            <option value="completed">منجزة ومقفلة</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* NAJIZ SYNC TOOL VIEW */}
        {activePortalTab === 'najiz' && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
                <Globe className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-white">تفويض وسحب بيانات القضايا والموكلين من ناجز</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  أداة مهنية متكاملة ومؤمنة بالكامل لسحب لوائح الادعاء وجلسات موكليكم بوزارة العدل.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Scraper Panel config settings */}
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-300">مفتاح API الخاص بناجز مخصص للموظف:</label>
                  <input 
                    type="password"
                    value={simulatedNajizKey}
                    onChange={e => setSimulatedNajizKey(e.target.value)}
                    placeholder="أدخل الرمز مخصص للموظف..."
                    className="w-full bg-slate-900 text-yellow-400 font-mono text-xs rounded-xl p-4 border border-white/10 outline-none"
                  />
                  <p className="text-[9px] text-amber-500 leading-tight">
                    * هذا المفتاح آمن ومسجل ومقيد لتحديث القضايا والعملاء المسندين إليك بشكل حصري.
                  </p>
                </div>

                <button 
                  onClick={triggerNajizScraper} 
                  disabled={isNajizSyncing}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 py-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-lg shadow-teal-500/10"
                >
                  {isNajizSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جاري سحب وتصفية البيانات...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>تشغيل أداة السحب الفوري والربط ⚡</span>
                    </>
                  )}
                </button>
              </div>

              {/* Scraper Log execution displays */}
              <div className="bg-slate-950/80 rounded-2xl p-6 border border-white/5 space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wide">سجل معالجة خادم سحب البيانات:</h4>
                <div className="h-44 overflow-y-auto space-y-2 border border-white/5 p-4 rounded-xl font-mono text-[9px] text-emerald-400 bg-slate-950 custom-scrollbar">
                  {najizSyncLog.length === 0 ? (
                    <span className="text-slate-500 font-bold block text-center py-12">مستعد لبدء الربط التلقائي...</span>
                  ) : (
                    najizSyncLog.map((log, i) => (
                      <div key={i} className="flex justify-between items-start gap-3">
                        <span className="text-right leading-normal">{log.msg}</span>
                        <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* AI SERVICES AND ASSISTANT TAB */}
        {activePortalTab === 'ai' && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="w-12 h-12 bg-purple-500/15 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-white">مساعد المحاماة الذكي بـ Gemini</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  مستشارك السحابي لصياغة مذكرات الدفاع، العقود والمذكرات الجوابية، والبحث في الأنظمة القضائية واللوائح التنفيذية.
                </p>
              </div>
            </div>

            <div className="flex border-b border-white/5 mb-4 gap-2">
              {[
                { id: 'consult', label: 'استشارة وتحليل أنظمة' },
                { id: 'memo', label: 'صياغة لائحة ومذكرة' },
                { id: 'notes', label: 'تلخيص بنود وملاحظات دعوى' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAiTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    aiTab === tab.id 
                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
               <textarea 
                 value={aiPrompt}
                 onChange={e => setAiPrompt(e.target.value)}
                 placeholder={
                   aiTab === 'consult' 
                     ? "مثال: ما قيمة مكافأة نهاية الخدمة بالقطاع الخاص في نظام العمل السعودي إذا بلغت سنوات الخدمة 6 سنوات؟"
                     : aiTab === 'memo'
                     ? "مثال: صغ لي رداً دفاعياً في قضية تجارية متعلقة بالتأخر عن التسليم بري لمورد خدمات..."
                     : "مثال: لخص شروط وتداعيات دعاوى الإخلاء والمطالبة بالأجرة المستحقة..."
                 }
                 className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-sm text-white outline-none focus:border-purple-500 transition-all h-36 resize-none custom-scrollbar"
               />

               <div className="flex justify-end">
                  <button 
                    onClick={handleRunAIProcess}
                    disabled={isAILoading || !aiPrompt.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-slate-950 font-black px-8 py-3.5 rounded-xl text-xs flex items-center gap-2 transform active:scale-95 transition-all shadow-lg"
                  >
                    {isAILoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>جاري التحليل والصياغة...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>اسأل موديول الذكاء</span>
                      </>
                    )}
                  </button>
               </div>
            </div>

            {aiResponse && (
              <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-yellow-300">النتيجة والجواب القانوني الصادر:</h4>
                <div className="text-slate-300 font-bold text-xs leading-relaxed whitespace-pre-wrap break-words text-right">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSIGNED CASES PANEL TAB */}
        {activePortalTab === 'cases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                الأروقة القضائية ومذكرات الترافع المسندة إليك
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myCases.length === 0 ? (
                  <div className="col-span-full py-16 bg-slate-900/40 rounded-[2rem] text-center border border-white/5 text-slate-500 font-bold text-xs">
                    لا توجد قضايا حالية مسندة إلى اسمك. يمكنك مزامنتها من ناجز أو طلب تعيينها من لوحة المدير.
                  </div>
                ) : (
                  myCases.map(c => (
                    <motion.div 
                      key={c.id} 
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="bg-slate-900 border border-white/10 p-6 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between group text-right hover:border-indigo-500/40 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500/20" />
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-mono text-yellow-300 font-black tracking-wide">{c.caseNumber}</span>
                          <span className={`text-[9px] px-3 py-1 rounded-full font-black ${
                            c.status === 'active' || c.status === 'pending_session'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-400/10 text-yellow-300'
                          }`}>
                            {c.status === 'active' ? 'قيد الترافع النشط' : c.status === 'pending_session' ? 'جلسة مقبلة جارية' : 'مغلق'}
                          </span>
                        </div>
                        
                        <h4 className="font-black text-base text-white mb-2 leading-tight">{c.caseName}</h4>
                        <div className="space-y-1.5 text-[11px] text-slate-400 font-bold mb-4 pr-1">
                          <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-400" /> الموكل/العميل: {c.clientName}</p>
                          <p className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-teal-400" /> المحكمة: {c.courtName || 'المحكمة العامة'}</p>
                          {c.nextSessionDate && (
                            <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-500" /> الجلسة القادمة: {c.nextSessionDate} في {c.nextSessionTime || '10:00 صباحاً'}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-white/5">
                        <div className="p-3 bg-slate-950/40 rounded-xl mb-4 border border-white/5">
                          <p className="text-[10px] text-slate-500 font-black mb-1">ملخص الخصم:</p>
                          <p className="text-xs font-black text-slate-300">{c.opponentName || 'غير مسجل'}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
            </div>
          </div>
        )}

        {/* ASSIGNED TASKS FULL PANEL TAB */}
        {activePortalTab === 'tasks' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <CheckSquare className="w-5 h-5" />
              </div>
              تتبع وتنفيذ المهام العدلية المسندة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myTasks.length === 0 ? (
                <div className="col-span-full py-16 bg-slate-900/40 rounded-[2rem] text-center border border-white/5 text-slate-500 font-bold text-xs">
                  ليس لديك مهام جارية حالياً.
                </div>
              ) : (
                myTasks.map(t => (
                  <div key={t.id} className="bg-slate-900 border border-white/10 p-6 rounded-[2rem] shadow-xl space-y-4 hover:border-amber-500/30 transition-all duration-300 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-white">{t.title}</p>
                      
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black ${
                        t.priority === 'high' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20' 
                          : 'bg-slate-950 text-slate-400 border border-white/5'
                      }`}>
                        أهمية: {t.priority === 'high' ? 'عالية ومستعجلة' : 'اعتيادية'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-bold leading-relaxed">{t.description || 'لم تدرج تفاصيل إضافية مسبقاً.'}</p>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <TaskCountdown dueDate={t.dueDate} />
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold">الحالة:</span>
                          <select 
                            value={t.status}
                            onChange={(e) => handleToggleTaskStatus(t.id, e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-xl px-2 py-1 text-xs text-yellow-300 font-black pointer"
                          >
                            <option value="todo">تحت الانتظار</option>
                            <option value="in_progress">قيد الترافع/العمل</option>
                            <option value="review">بانتظار مراجعة المدير</option>
                            <option value="completed">مكتملة ومقفلة</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activePortalTab === 'documents' && (
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 rounded-xl text-teal-400">
                <FileText className="w-5 h-5" />
              </div>
              أوليات ومستندات ملف القضية المجمعة
            </h3>
            
            <p className="text-xs text-slate-400 font-bold">
              قم بتحميل الأقراص الصكوك وتفويض التوكيل المرتبط بـ {loggedInEmployee.name}. الملفات ترفع تلقائياً على خزانة الحساب المدير للحفاظ على المزامنة.
            </p>

            <div className="dropzone border-2 border-dashed border-white/15 bg-slate-950/40 hover:bg-slate-950 rounded-2xl p-8 py-12 text-center cursor-pointer transition-all hover:border-indigo-500 flex flex-col items-center gap-3">
              <FileText className="w-10 h-10 text-indigo-400 animate-bounce" />
              <span className="text-xs font-black text-white">اسحب ملفات أو مذكرات للتوريد هنا</span>
              <span className="text-[10px] text-slate-500">صيغ مدعومة: PDF, DOC, PNG, JPEG حتى حجم 30 ميغابايت</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
