import React, { useState, useEffect, useRef } from 'react';
import TaskCountdown from './TaskCountdown';
import { 
  Users, Lock, Shield, CheckSquare, Briefcase, PlusCircle, 
  CheckCircle, TrendingUp, AlertCircle, FileText, Clock, Layout, 
  Globe, Database, Calendar, Search, Check, Settings2, RefreshCw, 
  Send, MessageSquare, Download, Share2, Filter, Zap, ExternalLink, Sparkles, UserCheck,
  ChevronRight, LogOut, Loader2, Save, Trash2, Eye, EyeOff, Link, UserPlus, HelpCircle,
  Bell, ChevronLeft, Activity, Award, QrCode, MapPin, Coffee, Sun, Moon, LogIn, BarChart2,
  Phone, Mail, Plane, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Area, AreaChart 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { generateUUID } from '@/lib/uuid';
import { auditLogger, AuditAction } from '@/lib/AuditLogger';
import { Case, Client, Task, Employee, LeaveRequest, AttendanceRecord } from '@/types';

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
      <label className="text-[11px] font-black text-slate-200 font-bold block pr-2 flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 text-${themeColor}-600`} />
        {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900 cursor-pointer hover:border-slate-300 transition-all flex items-center justify-between select-none shadow-sm"
      >
        <div className="flex flex-wrap gap-1.5 max-w-[90%] overflow-hidden truncate">
          {selectedNames.length === 0 ? (
            <span className="text-slate-200 font-bold font-bold">{placeholder}</span>
          ) : (
            selectedNames.map((name, i) => (
              <span key={i} className={`text-[10px] px-2.5 py-1 rounded-lg bg-${themeColor}-50 text-${themeColor}-700 border border-${themeColor}-100 font-black`}>
                {name}
              </span>
            ))
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-200 font-bold transform transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 flex flex-col"
          >
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-200 font-bold shrink-0" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="ابحث هنا..."
                className="w-full bg-transparent text-xs text-slate-900 border-none outline-none font-black"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="py-6 text-center text-slate-200 font-bold font-bold text-xs">لا يوجد نتائج تطابق بحثك</div>
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
                          ? `bg-${themeColor}-50 text-${themeColor}-700 font-black` 
                          : 'hover:bg-slate-50 text-slate-200 font-bold'
                      }`}
                    >
                      <div className="min-w-0 pr-1 text-right">
                        <p className="text-xs font-black truncate">{item.name}</p>
                        {item.info && <p className="text-[11px] font-bold text-slate-200 font-bold">{item.info}</p>}
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked 
                          ? `bg-${themeColor}-600 border-${themeColor}-600 text-white` 
                          : 'border-slate-200'
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
  hearings?: any[];
  currentUser?: any;
  selectedRole?: string;
  onUpdateState: (type: string, data: any) => void;
}

export default function EmployeePortal({ 
  cases = [], 
  clients = [], 
  tasks = [],
  hearings = [], 
  currentUser,
  selectedRole,
  onUpdateState 
}: EmployeePortalProps) {
  
  const isAdmin = selectedRole === 'admin' || selectedRole === 'lawyer' || currentUser?.role === 'admin' || currentUser?.role === 'lawyer';
  
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
    
    // 1. Immediately load from shared local backup
    const normalizeEmployee = (emp: any): Employee => {
      if (!emp) return {} as Employee;
      return {
        ...emp,
        id: emp.id,
        name: emp.name || '',
        role: emp.role || '',
        email: emp.email || '',
        phone: emp.phone || '',
        status: emp.status || 'نشط',
        department: emp.department || '',
        joinDate: emp.joinDate || emp.join_date || '',
        nationalId: emp.nationalId || emp.national_id || '',
        nationalIdExpiry: emp.nationalIdExpiry || emp.national_id_expiry || '',
        username: emp.username || '',
        password: emp.password || '',
        customLoginToken: emp.customLoginToken || emp.custom_login_token || '',
        portalLink: emp.portalLink || emp.portal_link || '',
        qualification: emp.qualification || '',
        birthDate: emp.birthDate || emp.birth_date || '',
        manager: emp.manager || '',
        nationality: emp.nationality || '',
        startDate: emp.startDate || emp.start_date || '',
        endDate: emp.endDate || emp.end_date || '',
        branch: emp.branch || '',
        allowances: Number(emp.allowances || 0),
        deductions: Number(emp.deductions || 0),
        baseSalary: emp.baseSalary !== undefined ? Number(emp.baseSalary) : (emp.base_salary !== undefined ? Number(emp.base_salary) : 0),
        salary: emp.salary !== undefined ? Number(emp.salary) : (emp.baseSalary !== undefined ? Number(emp.baseSalary) : (emp.base_salary !== undefined ? Number(emp.base_salary) : 0))
      };
    };

    const backup = localStorage.getItem('employees_backup');
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEmployees(parsed.map(normalizeEmployee));
        }
      } catch (e) {
        console.error("Error reading shared backup:", e);
      }
    }

    const fetchEmployees = async () => {
      const { data, error } = await supabase.from('employees').select('id, name, nationality, national_id, phone, job_title, manager, qualification, start_date, email, branch, notes, avatar_url, employee_code, role, department, salary, created_at');
      if (data) {
        const emps = (data as any[]).map(normalizeEmployee);
        emps.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setEmployees(emps);
        localStorage.setItem('employees_backup', JSON.stringify(emps));
      }
    };

    fetchEmployees();

    const channelId = `portal-employees-changes-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchEmployees)
      .subscribe((status, error) => {
        if (error) {
          console.warn('[Supabase Realtime] Subscribe error for portal employees:', error);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleSelectEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setSelectedConfigEmployee(emp || null);
  };

  const handleSaveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConfigEmployee) return;
    setIsSaving(true);
    
    // Fallback selectors to parse form inputs securely
    const form = e.currentTarget;
    const usernameInput = form.querySelector('[name="username"]') as HTMLInputElement;
    const passwordInput = form.querySelector('[name="password"]') as HTMLInputElement;
    const employeeCodeInput = form.querySelector('[name="employeeCode"]') as HTMLInputElement;
    const jobTitleInput = form.querySelector('[name="jobTitle"]') as HTMLInputElement;
    const branchInput = form.querySelector('[name="branch"]') as HTMLInputElement;
    const startDateInput = form.querySelector('[name="startDate"]') as HTMLInputElement;
    const statusInput = form.querySelector('[name="status"]') as HTMLSelectElement;
    const najizApiKeyInput = form.querySelector('[name="najizApiKey"]') as HTMLInputElement;

    const username = (usernameInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();
    const employeeCode = (employeeCodeInput?.value || '').trim();
    const jobTitle = (jobTitleInput?.value || '').trim();
    const branch = (branchInput?.value || '').trim();
    const startDate = (startDateInput?.value || '').trim();
    const status = (statusInput?.value || 'نشط').trim();
    const najizApiKey = (najizApiKeyInput?.value || '').trim();

    if (!username) {
      alert('⚠️ الرجاء تحديد اسم المستخدم الموحد للموظف.');
      setIsSaving(false);
      return;
    }

    if (!password) {
      alert('⚠️ الرجاء تعيين كلمة مرور أمنية لبوابة الموظف.');
      setIsSaving(false);
      return;
    }

    const customLoginToken = selectedConfigEmployee.customLoginToken || btoa(`${selectedConfigEmployee.id}-${Math.random().toString(36).substring(2, 10)}`);
    const portalLink = `${window.location.origin}/employee-portal?user=${username}&token=${customLoginToken}`;

    const updates: any = {
      ...selectedConfigEmployee, // Maximize synchronization: preserve name, nationalId, phone, etc.
      username,
      password,
      jobTitle,
      branch,
      startDate,
      employeeCode,
      status,
      najizApiKey,
      portalLink,
      customLoginToken,
      assignedCases: selectedConfigEmployee.assignedCases || [],
      assignedClients: selectedConfigEmployee.assignedClients || [],
      sidebarConfig: selectedConfigEmployee.sidebarConfig || [],
      permissions: selectedConfigEmployee.permissions || [],
      featureAccess: selectedConfigEmployee.featureAccess || []
    };

    // Ensure no undefined values are sent to Firestore
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    try {
      console.log('Attempting to save employee config:', selectedConfigEmployee.id, updates);
      await supabase.from('employees').upsert({ id: selectedConfigEmployee.id, ...updates });
      
      // Update the local list to ensure immediate responsiveness
      setEmployees(prev => prev.map(e => e.id === selectedConfigEmployee.id ? { ...e, ...updates } : e));
      
      alert('تم حفظ البيانات ومزامنة الصلاحيات لبوابة الموظف بنجاح ✅');
      setTimeout(() => setSelectedConfigEmployee(null), 100);
      
    } catch (err: any) {
      console.error('Error saving employee config:', err);
      alert('حدث خطأ أثناء حفظ الإعدادات لقاعدة البيانات: ' + err.message);
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
  
  // ---------------- NEW INTERACTIVE CALENDAR STATES ----------------
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  
  // Scraper Simulation states
  const [isNajizSyncing, setIsNajizSyncing] = useState(false);
  const [najizResult, setNajizResult] = useState<string | null>(null);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [najizSyncLog, setNajizSyncLog] = useState<{msg: string, time: string}[]>([]);
  const [simulatedNajizKey, setSimulatedNajizKey] = useState('');

  // HR & Attendance states
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [hrCalendarDate, setHrCalendarDate] = useState(new Date());
  const [selectedHRDateStr, setSelectedHRDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);

  // Performance metrics
  const performanceData = [
    { name: 'الأسبوع 1', tasks: 5, accuracy: 95, punctuality: 100 },
    { name: 'الأسبوع 2', tasks: 8, accuracy: 92, punctuality: 88 },
    { name: 'الأسبوع 3', tasks: 12, accuracy: 98, punctuality: 95 },
    { name: 'الأسبوع 4', tasks: 10, accuracy: 94, punctuality: 92 },
  ];

  // Fetch HR data
  useEffect(() => {
    if (!loggedInEmployee) return;
    
    // Attendance
    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from('attendance').select('*')
        .eq('employeeId', loggedInEmployee.id)
        .order('date', { ascending: false });
      
      if (data) setAttendance(data as any as AttendanceRecord[]);
    };

    fetchAttendance();
    const attChannelId = `attendance-${loggedInEmployee.id}-${Math.random().toString(36).substring(7)}`;
    const attChannel = supabase.channel(attChannelId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance', 
        filter: `employeeId=eq.${loggedInEmployee.id}` 
      }, fetchAttendance)
      .subscribe((status, error) => {
        if (error) {
          console.warn('[Supabase Realtime] Subscribe error for attendance:', error);
        }
      });

    // Leave Requests
    const fetchLeave = async () => {
      const { data, error } = await supabase
        .from('leave_requests').select('*')
        .eq('employeeId', loggedInEmployee.id)
        .order('requestedAt', { ascending: false });
      
      if (data) setLeaveRequests(data as any as LeaveRequest[]);
    };

    fetchLeave();
    const leaveChannelId = `leave-${loggedInEmployee.id}-${Math.random().toString(36).substring(7)}`;
    const leaveChannel = supabase.channel(leaveChannelId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leave_requests', 
        filter: `employeeId=eq.${loggedInEmployee.id}` 
      }, fetchLeave)
      .subscribe((status, error) => {
        if (error) {
          console.warn('[Supabase Realtime] Subscribe error for leave requests:', error);
        }
      });

    return () => {
      supabase.removeChannel(attChannel);
      supabase.removeChannel(leaveChannel);
    };
  }, [loggedInEmployee]);

  // Comprehensive Vacation Balance Calculation
  const vacationBalance = React.useMemo(() => {
    if (!loggedInEmployee?.startDate) return { earned: 0, used: 0, remaining: 0 };
    
    // 1. Calculate Earned Days (30 days per year standard for premium portal)
    const startDate = new Date(loggedInEmployee.startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDaysTotal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Earned = (days worked / 365) * 30
    const earned = Math.floor((diffDaysTotal / 365) * 30);
    
    // 2. Calculate Used Days from approved leave requests
    const used = leaveRequests
      .filter(r => r.status === 'approved' && r.type === 'vacation')
      .reduce((total, req) => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return total + diff;
      }, 0);
      
    const remaining = Math.max(0, earned - used);
    return { earned, used, remaining };
  }, [loggedInEmployee, leaveRequests]);

  // HR Calendar Data Memo
  const hrCalendarData = React.useMemo(() => {
    const year = hrCalendarDate.getFullYear();
    const month = hrCalendarDate.getMonth();
    const startDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [hrCalendarDate]);

  const handleCheckIn = async (method: 'qr' | 'location') => {
    if (!loggedInEmployee) return;

    if (method === 'qr') {
      setQrCodeData(`adalah-checkin-${loggedInEmployee.id}-${Date.now()}`);
      setShowCheckInModal(true);
      return;
    }

    if (method === 'location') {
      setGeoLocating(true);
      setShowCheckInModal(true);
      if (!navigator.geolocation) {
        alert("الموقع الجغرافي غير مدعوم في هذا المتصفح.");
        setGeoLocating(false);
        setShowCheckInModal(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setIsCheckingIn(true);
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = now.toLocaleTimeString('ar-SA');
          
          const newRecord: Partial<AttendanceRecord> = {
            employeeId: loggedInEmployee.id,
            date: dateStr,
            checkIn: timeStr,
            method: method as any,
            status: now.getHours() > 9 ? 'late' : 'present', 
            location: { lat: position.coords.latitude, lng: position.coords.longitude }
          };

          try {
            await supabase.from('attendance').insert(newRecord);
            alert(`✅ تم إثبات الحضور والموقع الجغرافي بنجاح.`);
            setShowCheckInModal(false);
          } catch (e) {
            alert('فشل تسجيل الحضور، يرجى المحاولة لاحقاً.');
          } finally {
            setIsCheckingIn(false);
            setGeoLocating(false);
          }
        },
        (error) => {
          console.error(error);
          alert("تعذر الوصول إلى الموقع الجغرافي. يرجى تفعيل الصلاحيات والمحاولة مجدداً.");
          setGeoLocating(false);
          setShowCheckInModal(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const handleApplyLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loggedInEmployee) return;

    const formData = new FormData(e.currentTarget);
    const newLeave: Partial<LeaveRequest> = {
      employeeId: loggedInEmployee.id,
      employeeName: loggedInEmployee.name,
      type: formData.get('type') as any,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      reason: formData.get('reason') as string,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    try {
      await supabase.from('leave_requests').insert(newLeave);
      alert('✅ تم إرسال طلب الإجازة للمدير المباشر بنجاح. سيصلك إشعار فور اتخاذ قرار.');
      setShowLeaveForm(false);
    } catch (e) {
      alert('فشل تقديم الطلب.');
    }
  };

  // AI Assistant States
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiTab, setAiTab] = useState<'consult' | 'memo' | 'notes'>('consult');
  
  // Multi-step Scraper simulator
  const handleRunNajizSync = async () => {
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
      const clientNameSim = `شركة ${['النهدي التجارية', 'المراعي القابضة', 'الرياض الفندقية', 'الخليج الرقمية'][Math.floor(Math.random() * 4)]}`;
      const caseIdSim = generateUUID();
      
      const sqlSimCase = {
        id: caseIdSim,
        case_number: `1447-${randomId}`,
        title: `قضية ناجز: منازعة تجارية متعلقة بعقد ${['توريد', 'مقاولة وشراكة', 'امتياز تجاري', 'خدمات استشارية'][Math.floor(Math.random() * 4)]}`,
        category: 'commercial',
        stage: 'litigation',
        status: 'active',
        court_name: 'المحكمة التجارية بالرياض - الدائرة الخامسة',
        opponent_name: 'مؤسسة مساندة الأعمال للتجارة والمقاولات',
        summary: 'طلب إلزام بسداد المستحقات المالية عن الدفعة الختامية المبرمة طبقاً للنظام التجاري الجديد.',
        details: 'تم جمع البيانات ومزامنتها بنجاح عن طريق أداة السحب من بوابة ناجز للموظف.',
        attachments_count: 1,
        priority: 'high',
        metadata: JSON.stringify({
          clientName: clientNameSim,
          lastSessionDate: new Date().toISOString().split('T')[0],
          nextSessionDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
          nextSessionTime: '10:15 صباحاً',
          isNajizSync: true
        })
      };

      // Add to cases using SQL schema compliant model
      const { data: caseDoc, error: caseErr } = await supabase.from('cases').insert(sqlSimCase).select().single();
      
      if (caseErr) throw caseErr;

      // Update employee assigned cases
      if (loggedInEmployee && caseDoc) {
        const updatedCases = [...(loggedInEmployee.assignedCases || []), caseDoc.id];
        const { error: empUpdateErr } = await supabase.from('employees').update({
          assignedCases: updatedCases,
          najizApiKey: activeKey
        }).eq('id', loggedInEmployee.id);

        if (empUpdateErr) throw empUpdateErr;

        // Sync local storage state too
        const freshEmp = { ...loggedInEmployee, assignedCases: updatedCases, najizApiKey: activeKey };
        setLoggedInEmployee(freshEmp);
        sessionStorage.setItem('active-logged-in-employee-v2', JSON.stringify(freshEmp));
      }

      const simCaseNumber = `1447-${randomId}`;

      // Add task to follow up on this new synchronized case
      const testTask: Partial<Task> = {
        title: `دراسة المذكرات والمستندات المسحوبة لقضية ${simCaseNumber}`,
        description: 'مراجعة الملحقات المستلمة من ناجز وكتابة التقرير الأولي للمدير العام.',
        status: 'todo',
        priority: 'high',
        assignedTo: loggedInEmployee?.name || 'محامي البوابة',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        caseNumber: simCaseNumber
      };
      await supabase.from('tasks').insert(testTask);

      // Audit logs
      await writeAuditLog('مزامنة ناجز', `تم سحب الدعوى التجارية رقم ${simCaseNumber} وتعيينها للموظف بنجاح`, loggedInEmployee!);

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
      await auditLogger.log({
        action: action as any,
        details,
        user_id: emp.id,
        user_name: emp.name,
        entity_type: 'sync',
        role: 'employee'
      });
    } catch (e) {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/employee-portal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setLoginError(resData.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
        return;
      }

      const { token, employee } = resData;
      
      // حفظ التوكن في sessionStorage
      sessionStorage.setItem('employee-portal-token', token);
      
      // جلب تفاصيل الموظف والجلسة الكاملة
      const sessionResponse = await fetch('/api/employee-portal/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const sessionData = await sessionResponse.json();
      const empData = sessionData.success ? sessionData.employee : employee;

      const currentLoginCount = (empData as any).loginCount || 0;
      // تحديث عدد تسجيلات الدخول بمرونة
      try {
        await supabase.from('employees').update({
          loginCount: currentLoginCount + 1,
          lastLoginAt: new Date().toISOString()
        }).eq('id', empData.id);
      } catch (dbErr) {}

      (empData as any).loginCount = currentLoginCount + 1;

      setLoggedInEmployee(empData);
      setSimulatedNajizKey(empData.najizApiKey || '');
      sessionStorage.setItem('active-logged-in-employee-v2', JSON.stringify(empData));
      
      if (empData.sidebarConfig && empData.sidebarConfig.length > 0) {
        setActivePortalTab(empData.sidebarConfig[0]);
      } else {
        setActivePortalTab('dashboard');
      }
      await writeAuditLog('تسجيل دخول', 'دخل الموظف إلى البوابة الفرعية المخصصة بمصادقة آمنة', empData);
    } catch (err: any) {
      console.error('[EmployeePortal Login Exception]', err);
      setLoginError('فشل الاتصال الآمن بالخادم الموحد للعدالة. يرجى إعادة المحاولة.');
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
    sessionStorage.removeItem('employee-portal-token');
    setLoginPassword('');
  };

  // Safe task status switcher that updates Firestore live & alerts master
  const handleToggleTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const taskObj = tasks.find((t: any) => t.id === taskId);
      if (taskObj) {
         onUpdateState('tasks', { ...taskObj, status: newStatus });
      }
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
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
    // Elegant Light-Themed Admin Setup & Configuration Panel
    return (
      <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-y-auto p-10 font-sans" dir="rtl">
        <div className="max-w-6xl mx-auto w-full space-y-10">
          
          {/* Top Header Card */}
          <header className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-[0_10px_40px_-15px_rgba(30,58,138,0.06)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-500" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 group-hover:rotate-6 transition-transform">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 leading-tight">إدارة تفويض وصلاحيات الكادر المهني</h1>
                    <p className="text-slate-700 font-bold text-lg">تحكم كامل في بوابات الوصول المخصصة وتعيين المهام المركزية</p>
                  </div>
                </div>
              </div>
              
              <div className="relative w-full md:w-80">
                 <label className="text-[10px] font-black tracking-widest text-blue-600 block mb-2 pr-1">تحديد الموظف المراد تهيئته:</label>
                 <select 
                   value={selectedConfigEmployee?.id || ''}
                   onChange={(e) => handleSelectEmployee(e.target.value)}
                   className="w-full bg-slate-50 text-slate-900 rounded-2xl px-6 py-5 font-black text-sm appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 cursor-pointer shadow-sm transition-all border border-slate-200 focus:border-blue-500"
                 >
                    <option value="">-- اختر موظف من النظام المركزي --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} • {e.jobTitle || 'محامي'}</option>
                    ))}
                 </select>
                 <ChevronRight className="absolute left-6 bottom-5 w-5 h-5 text-blue-600 rotate-90 pointer-events-none" />
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {!selectedConfigEmployee ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {employees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(e => {
                      const hasAccount = !!e.username;
                      return (
                        <div key={e.id} className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all duration-300">
                          <div className={`absolute top-0 right-0 w-1.5 h-full ${hasAccount ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <div className="flex justify-between items-start">
                             <div>
                               <h4 className="font-black text-slate-900 text-lg mb-1 flex items-center flex-wrap gap-2">
                                 {e.name}
                                 {hasAccount ? (
                                   <span className="text-[11px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">الدخول مفعّل ✅</span>
                                 ) : (
                                   <span className="text-[11px] font-black bg-amber-50 text-amber-400 font-black px-2 py-0.5 rounded-full border border-amber-200">بانتظار التهيئة ⚠️</span>
                                 )}
                               </h4>
                               <p className="text-[10px] text-slate-200 font-bold font-bold">{e.jobTitle || 'محامي / مستشار بالتمرين'}</p>
                             </div>
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${hasAccount ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-400 font-black'}`}>
                               <Users className="w-4 h-4" />
                             </div>
                          </div>
                          
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 mt-auto">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-200 font-bold">اسم المستخدم:</span>
                              {hasAccount ? (
                                <span className="text-blue-600 font-mono text-left" dir="ltr">{e.username}</span>
                              ) : (
                                <span className="text-amber-400 font-black italic">مؤقت: emp_{e.id.toLowerCase()}</span>
                              )}
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-200 font-bold">أقسام البوابة الفعّالة:</span>
                              <span className="text-emerald-600">{(e.sidebarConfig && e.sidebarConfig.length) || 0} أقسام مفوضة</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-200 font-bold">رقم الهاتف الجوال:</span>
                              <span className="text-slate-700 font-mono">{e.phone || '---'}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => setSelectedConfigEmployee(e)}
                            className={`w-full py-3.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
                              hasAccount 
                                ? 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700' 
                                : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-100'
                            }`}
                          >
                            {hasAccount ? 'تعديل الصلاحيات والمزايا ⚖️' : 'تهيئة البوابة وإصدار الصلاحيات 🔑'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-32 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center gap-8 shadow-sm">
                    <div className="w-28 h-28 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Users className="w-14 h-14" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">لا يوجد موظفين مسجلين في النظام</h3>
                      <p className="text-slate-700 font-bold max-w-sm mt-2 mx-auto">عند إضافة كادر وظيفي جديد من شاشة "شؤون الموظفين"، سيتم عرضهم هنا تلقائياً لتهيئتهم وضبط بواباتهم الخاصة.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key={selectedConfigEmployee.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* Left Column: Credentials & Access */}
                  <div className="lg:col-span-4 space-y-8">
                    
                    {/* Credentials Card */}
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-[0_20px_50px_-15px_rgba(30,58,138,0.06)] space-y-8 relative overflow-hidden group hover:border-blue-200 transition-all duration-500">
                      <div className="absolute top-0 right-0 w-3 h-full bg-gradient-to-b from-blue-600 to-indigo-600" />
                      
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900">إعداد المصادقة والدخول</h3>
                          <p className="text-[10px] font-bold text-slate-200 font-bold uppercase tracking-widest mt-0.5">Authentication Engine</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-700 block pr-2">اسم المستخدم الموحد</label>
                          <input 
                            name="username" 
                            type="text"
                            required 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" 
                            defaultValue={selectedConfigEmployee.username || selectedConfigEmployee.name.split(' ')[0] + '_law'} 
                          />
                        </div>
                        
                        <div className="space-y-2 relative">
                          <label className="text-[11px] font-black text-slate-700 block pr-2">كلمة المرور الأمنية</label>
                          <div className="relative">
                            <input 
                              name="password" 
                              type={showPass ? 'text' : 'password'}
                              required 
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all pl-14" 
                              defaultValue={selectedConfigEmployee.password || 'LawyerPass2026!'} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPass(!showPass)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200 font-bold p-2 hover:text-blue-600 transition-all"
                            >
                              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-700 block pr-2">الكود الوظيفي (ID)</label>
                          <input 
                            name="employeeCode" 
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" 
                            defaultValue={selectedConfigEmployee.employeeCode || `EMP-${selectedConfigEmployee.id.slice(-4)}`} 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-700 block pr-2">المسمى الوظيفي</label>
                          <input 
                            name="jobTitle" 
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" 
                            defaultValue={selectedConfigEmployee.jobTitle || ''} 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-700 block pr-2">فرع العمل الجغرافي</label>
                          <input 
                            name="branch" 
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" 
                            defaultValue={selectedConfigEmployee.branch || ''} 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-700 block pr-2">تاريخ المباشرة (بداية العمل)</label>
                          <input 
                            name="startDate" 
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" 
                            defaultValue={selectedConfigEmployee.startDate || new Date().toISOString().split('T')[0]} 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-700 block pr-2">حالة الحساب</label>
                          <select 
                            name="status"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all cursor-pointer appearance-none"
                            defaultValue={selectedConfigEmployee.status || 'نشط'}
                          >
                            <option value="نشط">نشط (فعّال بالكامل)</option>
                            <option value="موقوف">موقوف (مجمد مؤقتاً)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Najiz custom key Card */}
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-6">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                         <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-400 font-black">
                           <Database className="w-6 h-6" />
                         </div>
                         <div>
                           <h3 className="text-lg font-black text-slate-900 text-right">مفتاح وزارة العدل</h3>
                           <p className="text-[10px] font-bold text-slate-200 font-bold uppercase tracking-widest mt-0.5">Najiz API Integration</p>
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-[11px] font-bold text-slate-700 leading-relaxed text-right">
                          يتيح هذا الرمز سحب كافة التحديثات المباشرة من بوابة ناجز (القضايا، المواعيد، القرارات) وإسقاطها فوراً في ملف الموظف.
                        </p>
                        <input 
                          name="najizApiKey" 
                          type="text"
                          placeholder="مثال: NAJIZ_EMPLOYEE_KEY_SA..."
                          className="w-full bg-slate-50 border border-slate-200 text-amber-400 font-black font-mono text-xs rounded-2xl px-6 py-4 focus:bg-white focus:border-amber-500 outline-none transition-all text-left"
                          defaultValue={selectedConfigEmployee.najizApiKey || ''}
                        />
                      </div>
                    </div>

                    {/* Unified Link Card */}
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 text-slate-900 space-y-8 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all duration-500">
                      <div className="absolute top-0 right-0 w-3 h-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                      
                      <div className="flex items-center gap-4 relative z-10 border-b border-slate-100 pb-6">
                         <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                           <Link className="w-6 h-6" />
                         </div>
                         <div className="text-right">
                           <h3 className="text-lg font-black text-slate-900">رابط الدخول الموحد</h3>
                           <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Employee Single Sign-On</p>
                         </div>
                      </div>
                      
                      <div className="relative z-10 space-y-6 text-right">
                        <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                          يمكن للموظف الدخول للبوابة عن طريق الرابط التالي باستخدام بيانات الاعتماد التي قمت بتعيينها أعلاه:
                        </p>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-mono text-[10px] text-blue-600 break-all leading-relaxed ltr text-left">
                          {window.location.origin}/employee-portal?user={selectedConfigEmployee.username || selectedConfigEmployee.name.split(' ')[0] + '_law'}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                             type="button"
                             onClick={() => {
                               const sharedLink = `${window.location.origin}/employee-portal?user=${selectedConfigEmployee.username || selectedConfigEmployee.name.split(' ')[0] + '_law'}`;
                               navigator.clipboard.writeText(sharedLink);
                               alert('تم نسخ رابط الدخول المباشر بنجاح 📋');
                             }}
                             className="bg-slate-50 text-slate-900 border border-slate-200 hover:bg-blue-600 hover:text-white py-4 rounded-2xl text-[11px] font-black transition-all"
                           >
                             نسخ الرابط
                           </button>
                           
                           <button 
                             type="button"
                             onClick={sendWhatsAppConfig}
                             className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-[11px] font-black shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
                           >
                             <MessageSquare className="w-4 h-4" />
                             مشاركة واتساب
                           </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Custom Interactive Dropdowns inside a 3D grid layout */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                          <Settings2 className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <h3 className="text-lg font-black text-slate-900">تفويض الصلاحيات والوصول للبيانات</h3>
                          <p className="text-[10px] font-bold text-slate-200 font-bold uppercase tracking-widest mt-0.5">Permissions & Data Delegation</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* 1. Sidebar Config Multi-Select */}
                        <CustomMultiSelectDropdown 
                          label="أقسام لوحة التحكم الجانبية المتاحة بالبوابة"
                          placeholder="تحديد الأقسام التي تظهر للموظف..."
                          icon={Layout}
                          themeColor="sky"
                          selectedIds={selectedConfigEmployee.sidebarConfig || []}
                          items={[
                            { id: 'dashboard', name: 'لوحة القيادة الرئيسية والملخص' },
                            { id: 'cases', name: 'بوابة القضايا وعقود الترافع' },
                            { id: 'tasks', name: 'بوابة تتبع وتنفيذ المهام العدلية' },
                            { id: 'documents', name: 'أرشيف وحقيبة المستندات والملفات' },
                            { id: 'ai', name: 'مساعد ومستشار الذكاء الاصطناعي (AI)' },
                            { id: 'ai-search', name: 'مرصد الأنظمة والبحث الذكي' },
                            { id: 'clients', name: 'سجل العملاء والموكلون' },
                            { id: 'najiz', name: 'مركز مكاملة وسحب بيانات ناجز' }
                          ]}
                          onChange={(ids) => {
                            const updatedEmp = { ...selectedConfigEmployee, sidebarConfig: ids };
                            setSelectedConfigEmployee(updatedEmp);
                          }}
                        />

                        {/* 2. Custom Multi-Select Dropdown for view/edit Permissions */}
                        <CustomMultiSelectDropdown 
                          label="صلاحيات إدارة البيانات والتعديل"
                          placeholder="تحديد الصلاحيات الإجرائية..."
                          icon={Shield}
                          themeColor="rose"
                          selectedIds={selectedConfigEmployee.permissions || []}
                          items={[
                            { id: 'view_all', name: 'الاطلاع على كافة بيانات المكتب (مدير عام)' },
                            { id: 'edit_all', name: 'تعديل وحذف كافة ملفات النظام' },
                            { id: 'add_cases', name: 'إمكانية إدخال وإضافة قضايا جديدة' },
                            { id: 'edit_cases', name: 'تعديل وتحديث لائحة القضايا المسندة' },
                            { id: 'add_clients', name: 'إضافة عملاء جدد للمكتب' },
                            { id: 'edit_clients', name: 'تعديل وحذف بيانات العملاء' },
                            { id: 'task_management', name: 'إسناد وتغيير حالة مهام زملائه' },
                            { id: 'access_financials', name: 'الاطلاع على التقارير المالية والفواتير' },
                            { id: 'najiz_sync', name: 'تفعيل المزامنة المباشرة مع ناجز' }
                          ]}
                          onChange={(ids) => {
                            const updatedEmp = { ...selectedConfigEmployee, permissions: ids };
                            setSelectedConfigEmployee(updatedEmp);
                          }}
                        />

                        {/* 3. Custom Multi-Select Dropdown for Assigned Cases */}
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
                          }}
                        />

                        {/* 4. Custom Multi-Select Dropdown for Assigned Clients */}
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
                          }}
                        />

                      </div>
                    </div>

                    {/* Submit Form Button Container */}
                    <div className="flex items-center justify-between gap-6 pt-10 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => setSelectedConfigEmployee(null)}
                        className="px-10 py-5 rounded-[2rem] bg-slate-100 hover:bg-slate-200 text-slate-200 font-bold font-black text-sm transition-all flex items-center gap-2"
                      >
                         <ChevronRight className="w-5 h-5 rotate-180" />
                         <span>رجوع للقائمة</span>
                      </button>

                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(37,99,235,0.2)] hover:shadow-[0_25px_60px_rgba(37,99,235,0.4)] transform hover:-translate-y-1 active:scale-95 transition-all text-sm flex items-center justify-center gap-3"
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-6 h-6" />
                        )}
                        <span>حفظ وتوثيق كافة الصلاحيات المحدثة</span>
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
    // Elegant Light-Themed Login Screen
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#F8FAFC] font-sans relative overflow-hidden" dir="rtl">
        
        {/* Soft Background Accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-200/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg relative z-10"
        >
          <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-2 bg-[#0f172a]" />
            
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-[#0f172a] text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-slate-900/10 mb-8">
                <Shield className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">بوابة الموظف الموحدة</h2>
              <p className="text-slate-700 font-bold text-sm bg-slate-50 border border-slate-100 px-4 py-2 rounded-full inline-block mx-auto">مركز العمل القضائي المتكامل</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-700 pr-2">اسم المستخدم</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none pl-12"
                      placeholder="أدخل اسم المستخدم..."
                    />
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white font-bold" />
                  </div>
                </div>

                <div className="space-y-3 relative">
                  <label className="text-xs font-black text-slate-700 pr-2">كلمة المرور والأمان</label>
                  <div className="relative">
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none pl-14"
                      placeholder="••••••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200 font-bold hover:text-blue-600 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white font-bold hidden" />
                  </div>
                </div>
              </div>

              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold leading-relaxed"
                >
                  {loginError}
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-slate-900 text-white font-black py-6 rounded-2xl text-lg shadow-2xl shadow-blue-600/10 active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
                تسجيل الدخول الآمن
              </button>

              <div className="text-center pt-2">
                <p className="text-[10px] text-slate-200 font-bold font-bold leading-relaxed">
                  نظام مشفر ومحمي. يرجى التواصل مع الإدارة الفنية لمكتب العدالة في حال واجهت صعوبات في الدخول.
                </p>
              </div>
            </form>
          </div>
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
    t.assignedTo === loggedInEmployee?.name ||
    t.assignedTo === loggedInEmployee?.username ||
    t.assignedTo === loggedInEmployee?.id ||
    (t.assignedTo && loggedInEmployee?.name && t.assignedTo.includes(loggedInEmployee.name))
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
      <div className="flex-1 h-full flex flex-row bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
        
        {/* Modern Employee Portal Navigation / Sidebar */}
        <aside className="w-72 border-l border-slate-200 bg-white hidden lg:flex flex-col p-6 space-y-8 overflow-y-auto shadow-sm">
          <div className="flex flex-col items-center gap-4 pb-8 border-b border-slate-100">
            <div className="w-20 h-20 bg-[#0f172a] rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">
              {loggedInEmployee.name.charAt(0)}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{loggedInEmployee.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-200 font-bold px-2.5 py-1 rounded-full font-black border border-slate-200 uppercase">
                  {loggedInEmployee.employeeCode || `EMP-${loggedInEmployee.id.slice(-4).toUpperCase()}`}
                </span>
                <span className="text-[11px] text-slate-700 font-bold">{loggedInEmployee.jobTitle}</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="text-[10px] font-black text-slate-200 font-bold uppercase tracking-widest px-3 mb-3 text-right">قائمة الوصول السريع</div>
            {[
              { id: 'dashboard', name: 'لوحة التحكم والمتابعة', icon: Layout },
              { id: 'cases', name: 'ملفات القضايا المسندة', icon: Briefcase },
              { id: 'tasks', name: 'التكاليف والمهام', icon: CheckSquare },
              { id: 'clients', name: 'الموكلين والجهات', icon: Users },
              { id: 'ai', name: 'المساعد القانوني AI', icon: Sparkles },
              { id: 'ai-search', name: 'البحث والاستعلام الذكي', icon: Search },
              { id: 'najiz', name: 'مزامنة بوابة ناجز', icon: RefreshCw },
              { id: 'hr', name: 'الشؤون الإدارية (HR)', icon: UserCheck },
            ].filter(item => {
              // 1. التحقق من أقسام لوحة القيادة الجانبية المفوضة للموظف
              const inSidebar = !loggedInEmployee.sidebarConfig || 
                                loggedInEmployee.sidebarConfig.length === 0 || 
                                loggedInEmployee.sidebarConfig.includes(item.id) ||
                                item.id === 'hr'; // الشؤون الإدارية دائماً متاحة
              
              if (!inSidebar) return false;

              // 2. التحقق من الصلاحيات الإجرائية المحددة للموظف
              const userPerms = loggedInEmployee.permissions || [];
              const isManagerial = userPerms.includes('view_all') || userPerms.includes('edit_all');

              if (item.id === 'najiz') {
                return isManagerial || userPerms.includes('najiz_sync');
              }
              if (item.id === 'clients') {
                // قسم الموكلين يتطلب صلاحية الاطلاع على بيانات المكتب أو الصلاحية الإدارية الشاملة
                return isManagerial || userPerms.includes('view_all');
              }
              
              return true;
            }).map(item => (
              <button
                key={item.id}
                onClick={() => setActivePortalTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black transition-all ${
                  activePortalTab === item.id 
                    ? 'bg-[#0f172a] text-white shadow-md' 
                    : 'text-slate-200 font-bold hover:bg-slate-50 hover:text-[#0f172a]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button 
              onClick={handleLogoutPortal}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل خروج آمن</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] relative">
          {/* Header / Welcome Section */}
          <header className="p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white relative overflow-hidden">
            <div className="z-10 flex items-center gap-5">
              <div className="hidden md:flex flex-col gap-1 pr-6 border-r border-slate-200 py-1 text-right" dir="rtl">
                 <h1 className="text-2xl font-black text-slate-900 tracking-tight">أهلاً بك، الأستاذ {loggedInEmployee.name.split(' ')[0]} 👋</h1>
                 <p className="text-slate-700 font-bold text-xs mt-0.5">مركز العمل القضائي المتكامل • بيئة سحابية آمنة</p>
              </div>
            </div>

            <div className="z-10 flex items-center gap-3 md:gap-4">
              <div className="bg-[#F8FAFC] px-5 py-3 rounded-[1rem] border border-slate-100 flex items-center gap-4 shadow-sm">
                 <div className="text-right">
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">رصيد الإجازات</p>
                   <p className="text-lg font-black text-slate-900 mt-1 leading-none">{vacationBalance.remaining} يوماً</p>
                 </div>
                 <div className="w-10 h-10 bg-white rounded-[0.75rem] shadow-sm border border-slate-100 flex items-center justify-center text-[#0f172a]">
                   <Calendar className="w-5 h-5" />
                 </div>
              </div>

              <div className="bg-[#F8FAFC] p-1.5 rounded-[1.25rem] border border-slate-100 flex items-center gap-2 shadow-sm">
                 <button 
                   onClick={() => handleCheckIn('qr')}
                   disabled={isCheckingIn}
                   className="bg-[#0f172a] hover:bg-slate-800 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                 >
                   <QrCode className="w-4 h-4" />
                   <span>إثبات (QR)</span>
                 </button>
                 <button 
                   onClick={() => handleCheckIn('location')}
                   disabled={isCheckingIn}
                   className="bg-white hover:bg-slate-50 text-slate-700 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 border border-slate-200 shadow-sm"
                 >
                   <MapPin className="w-4 h-4 text-emerald-600" />
                   <span>إثبات (موقع)</span>
                 </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                  className={`p-3 rounded-xl border transition-all relative cursor-pointer shadow-sm ${
                    urgentTasks.length > 0 
                      ? 'bg-rose-50 text-rose-600 border-rose-200' 
                      : 'bg-white text-slate-200 font-bold border-slate-200 hover:text-slate-200 font-bold hover:border-slate-300'
                  }`}
                >
                  <Bell className={`w-5 h-5 ${urgentTasks.length > 0 ? 'animate-bounce' : ''}`} />
                  {urgentTasks.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {urgentTasks.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
            
            {/* Urgent Task Warnings (< 24 Hours) */}
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
                    className="bg-white border border-rose-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-2 h-full bg-rose-600" />
                    <div className="flex items-center gap-5 text-right w-full">
                      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-black shrink-0 border border-rose-100 shadow-sm shadow-rose-600/5">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                          <span>إجراء عاجل مطلوب: اقتراب الموعد النهائي ⚠️</span>
                          <span className="text-[10px] bg-rose-600 text-white px-2.5 py-1 rounded-full font-black animate-pulse">هام جداً</span>
                        </h4>
                        <p className="text-xs text-slate-700 mt-1 font-bold leading-relaxed max-w-2xl">
                          المهمة المسندة <span className="text-rose-600 font-black underline underline-offset-4 decoration-rose-200">"{task.title}"</span> على وشك انتهاء صلاحيتها. يرجى توثيق المنجز فوراً.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                      <div className="bg-rose-50 border border-rose-100 px-6 py-3 rounded-2xl flex items-center gap-3 font-mono text-xs text-rose-600 shadow-sm">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span className="font-black">{diffHours}س و {leftMins}د</span>
                      </div>
                      
                      <button 
                        onClick={() => setDismissedAlerts(prev => [...prev, task.id])}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-200 font-bold border border-slate-200 px-6 py-3 rounded-2xl font-black transition-all"
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Employee Electronic Identity Card & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-1 bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-900/50 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
                  <div>
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-900/50">
                        {loggedInEmployee?.name?.substring(0, 2) || 'م'}
                      </div>
                      <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black rounded-lg border border-blue-500/30 uppercase tracking-widest">
                        مسجل النشاط
                      </div>
                    </div>
                    <div className="relative z-10 space-y-1 block">
                      <h3 className="text-2xl font-black text-white">{loggedInEmployee?.name}</h3>
                      <p className="text-xs font-bold text-blue-200/60 uppercase tracking-widest">{loggedInEmployee?.jobTitle}</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10 mt-8">
                     <div className="flex items-center justify-between text-xs p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <span className="font-bold text-slate-200 font-bold">اسم المستخدم (بوابة)</span>
                        <span className="font-mono text-white font-black">{loggedInEmployee?.username}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <span className="font-bold text-slate-200 font-bold">كلمة المرور</span>
                        <span className="font-mono text-white font-black">••••••••</span>
                     </div>
                     <div className="flex items-center justify-between text-xs p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                        <span className="font-bold text-blue-300">مرات تسجيل الدخول</span>
                        <span className="font-mono text-blue-400 font-black flex items-center gap-2">
                           <LogIn className="w-4 h-4" />
                           {(loggedInEmployee as any)?.loginCount || 1} مرة
                        </span>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'إجمالي المهام المسندة', value: myTasks.length, color: 'text-slate-900', bg: 'bg-white', accent: 'bg-slate-100', icon: Briefcase },
                    { label: 'المهام المنجزة بنجاح', value: myTasks.filter(t => t.status === 'completed' || t.status === 'done').length, color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-900', accent: 'bg-emerald-100', icon: CheckCircle },
                    { label: 'المهام المعلقة / قيد العمل', value: myTasks.filter(t => t.status === 'todo' || t.status === 'in_progress' || t.status === 'review').length, color: 'text-blue-600', bg: 'bg-blue-50 text-blue-900', accent: 'bg-blue-100', icon: Clock },
                    { label: 'المهام المتأخرة / قريبة', value: myTasks.filter(t => (t.status === 'todo' || t.status === 'in_progress') && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]).length, color: 'text-rose-600', bg: 'bg-rose-50 text-rose-900', accent: 'bg-rose-100', icon: AlertTriangle }
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} border border-[#e2e8f0] p-6 rounded-[2.5rem] flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[160px] group  transition-all`}>
                       <stat.icon className={`w-8 h-8 ${stat.color} mb-4 relative z-10 transition-transform `} />
                       <div className="relative z-10">
                          <div className={`text-4xl font-black ${stat.color} mb-1 tracking-tight`}>{stat.value}</div>
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{stat.label}</span>
                       </div>
                    </div>
                  ))}

                  <div className="col-span-2 md:col-span-4 bg-white border border-slate-200 p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
                     <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                           <Award className="w-5 h-5 text-indigo-500" />
                           نسبة الإنجاز ونجاح المهام
                        </h4>
                        <p className="text-[10px] text-slate-200 font-bold font-bold">بناءً على المهام المنجزة مقارنة بالمهام الكلية المسندة لك.</p>
                     </div>
                     <div className="flex items-center gap-4 w-1/2">
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex-1 shadow-inner">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${myTasks.length > 0 ? Math.round((myTasks.filter(t => t.status === 'completed' || t.status === 'done').length / myTasks.length) * 100) : 0}%` }}
                             className="h-full bg-indigo-500 rounded-full"
                           />
                        </div>
                        <span className="text-xl font-black text-slate-900 w-12 left-0 text-left">
                           {myTasks.length > 0 ? Math.round((myTasks.filter(t => t.status === 'completed' || t.status === 'done').length / myTasks.length) * 100) : 0}%
                        </span>
                     </div>
                  </div>


            {/* Interactive Professional Monthly Calendar Integration Widget */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className="space-y-1 text-right">
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    التقويم القضائي الذكي والجدولة المدمجة
                  </h3>
                  <p className="text-xs text-slate-200 font-bold font-bold">باقة ذكية تدمج جلسات المحاكم المسندة إليك مع الإجازات (المعتمدة والمعلقة) والمهام</p>
                </div>
                
                {/* Year/Month switcher */}
                <div className="flex items-center gap-2" dir="ltr">
                  <button 
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all font-black text-xs cursor-pointer"
                  >
                    السابق ◀
                  </button>
                  <span className="font-black text-sm text-slate-800 px-4 min-w-[140px] text-center">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
                      }
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all font-black text-xs cursor-pointer"
                  >
                    ▶ التالي
                  </button>
                </div>
              </div>

              {/* Grid Header Month Structure */}
              {(() => {
                const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // Sunday=0, Monday=1, ...
                
                const weekdayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                const cells = [];
                
                // Empty padding cells for start of month
                for (let i = 0; i < firstDayIndex; i++) {
                  cells.push(<div key={`empty-${i}`} className="min-h-[110px] bg-slate-50/20 border border-slate-100 rounded-2xl" />);
                }
                
                // Days list
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  
                  // 1. Filtrate hearings for logged-in employee matching this date query
                  const dayHearings = (hearings || []).filter(h => {
                    const isCaseAssigned = loggedInEmployee?.assignedCases?.includes(h.caseId || h.caseNumber);
                    return isCaseAssigned && h.date === dateStr;
                  });
                  
                  // 2. Filtrate approved/pending leaves matching this date query
                  const dayLeaves = (leaveRequests || []).filter(r => {
                    return r.employeeId === loggedInEmployee?.id && dateStr >= r.startDate && dateStr <= r.endDate;
                  });
                  
                  // 3. Filtrate tasks due on this date query
                  const dayTasks = (myTasks || []).filter(t => t.dueDate === dateStr);
                  
                  const hasActivity = dayHearings.length > 0 || dayLeaves.length > 0 || dayTasks.length > 0;
                  const isTodayStr = new Date().toISOString().split('T')[0] === dateStr;
                  
                  cells.push(
                    <div 
                      key={`day-${day}`} 
                      onClick={() => {
                        if (hasActivity) setSelectedCalendarDate(selectedCalendarDate === dateStr ? null : dateStr);
                      }}
                      className={`min-h-[115px] p-2.5 border rounded-[1.5rem] flex flex-col justify-between transition-all relative group cursor-pointer ${
                        isTodayStr 
                          ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-55' 
                          : hasActivity 
                            ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md' 
                            : 'bg-white border-slate-100 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center ${isTodayStr ? 'bg-indigo-600 text-white font-black' : 'text-slate-700'}`}>
                          {day}
                        </span>
                        
                        {/* Summary Badges counting activities */}
                        <div className="flex items-center gap-1">
                          {dayHearings.length > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" title="جلسات قضائية" />}
                          {dayLeaves.some(l => l.status === 'approved') && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="إجازة معتمدة" />}
                          {dayLeaves.some(l => l.status === 'pending') && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="طلب إجازة معلق" />}
                          {dayTasks.length > 0 && <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" title="تسليم مهام" />}
                        </div>
                      </div>

                      {/* Display text in cell if space permits */}
                      <div className="mt-2 space-y-1 overflow-hidden">
                        {dayHearings.map((h, hIdx) => (
                          <div key={hIdx} className="bg-rose-50 border border-rose-100 text-rose-700 p-1 rounded-lg text-[11px] font-extrabold truncate" title={h.caseName}>
                             ⚖️ {h.time} {h.caseName}
                          </div>
                        ))}
                        {dayLeaves.map((l, lIdx) => (
                          <div key={lIdx} className={`p-1 rounded-lg text-[11px] font-extrabold truncate ${l.status === 'approved' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-amber-50 border border-amber-100 text-amber-400 font-black'}`}>
                            🌴 {l.status === 'approved' ? 'إجازة معتمدة' : 'إجازة معلقة'}
                          </div>
                        ))}
                        {dayTasks.map((t, tIdx) => (
                          <div key={tIdx} className="bg-sky-50 border border-sky-100 text-sky-700 p-1 rounded-lg text-[11px] font-extrabold truncate" title={t.title}>
                            📋 {t.title}
                          </div>
                        ))}
                      </div>

                      {/* Expanded detailed popover on click */}
                      {selectedCalendarDate === dateStr && (
                        <div className="absolute top-[105%] right-0 left-0 bg-slate-900 text-white border border-slate-800 p-4 rounded-2xl shadow-2xl z-40 space-y-3 cursor-default" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-xs font-black text-white font-bold">أجندة يوم {day} ({dateStr})</span>
                            <button onClick={() => setSelectedCalendarDate(null)} className="text-[11px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer">إغلاق</button>
                          </div>
                          
                          {dayHearings.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-black text-rose-400 flex items-center gap-1">⚖️ جلسات المرافعة ومواعيد الدوائر:</p>
                              {dayHearings.map((h, hIdx) => (
                                <div key={hIdx} className="bg-white/5 border border-white/5 p-2 rounded-xl text-[10px]">
                                  <div className="font-extrabold text-white">{h.caseName}</div>
                                  <div className="text-slate-200 font-bold text-[11px] mt-1 text-right">الساعة {h.time} | الدائرة {h.court || 'غير محدد'} | قضية رقم: {h.caseNumber}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {dayLeaves.length > 0 && (
                            <div className="space-y-1.5 border-t border-white/5 pt-2">
                              <p className="text-[10px] font-black text-emerald-400 flex items-center gap-1">🌴 الإجازات والغياب الإداري:</p>
                              {dayLeaves.map((l, lIdx) => (
                                <div key={lIdx} className="bg-white/5 border border-white/5 p-2 rounded-xl text-[10px] flex justify-between items-center bg-slate-800/20">
                                  <span className="text-white font-bold">
                                    {l.type === 'vacation' ? 'إجازة اعتيادية' : l.type === 'sick' ? 'إجازة مرضية' : l.type === 'emergency' ? 'إجازة اضطرارية' : 'إجازة بدون راتب'} (من {l.startDate} إلى {l.endDate})
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${l.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {l.status === 'approved' ? 'مقبولة ومعتمدة' : 'طلب معلق'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {dayTasks.length > 0 && (
                            <div className="space-y-1.5 border-t border-white/5 pt-2">
                              <p className="text-[10px] font-black text-sky-400 flex items-center gap-1">📋 تسليمات المهام اليومية:</p>
                              {dayTasks.map((t, tIdx) => (
                                <div key={tIdx} className="bg-white/5 border border-white/5 p-2 rounded-xl text-[10px]">
                                  <div className="font-extrabold text-white font-bold">{t.title}</div>
                                  <div className="text-slate-200 font-bold text-[11px] mt-0.5">الحالة: {t.status === 'completed' ? 'مكتملة ✅' : 'قيد المتابعة ⏳'}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <div>
                    <div className="grid grid-cols-7 gap-3 mb-3 text-center">
                      {weekdayNames.map(name => (
                        <div key={name} className="text-[10px] font-black text-slate-200 font-bold bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                          {name}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                      {cells}
                    </div>
                  </div>
                );
              })()}
            </div>

               </div>
            </div>

            {/* Quick Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 p-8 rounded-[3rem] hover:border-blue-300 transition-all group relative overflow-hidden shadow-sm">
                 <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-50 rounded-full blur-3xl opacity-50" />
                 <div className="flex items-center justify-between mb-6">
                   <span className="text-[10px] font-black text-slate-200 font-bold uppercase tracking-widest">إجمالي ملفات القضايا</span>
                   <Briefcase className="w-5 h-5 text-blue-600" />
                 </div>
                 <div className="flex items-baseline gap-2">
                   <h4 className="text-4xl font-black text-slate-900">{myCases.length}</h4>
                   <span className="text-[10px] text-slate-700 font-bold">ملف نشط</span>
                 </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[3rem] hover:border-emerald-300 transition-all group relative overflow-hidden shadow-sm">
                 <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-50 rounded-full blur-3xl opacity-50" />
                 <div className="flex items-center justify-between mb-6">
                   <span className="text-[10px] font-black text-slate-200 font-bold uppercase tracking-widest">إجمالي الموكلين</span>
                   <Users className="w-5 h-5 text-emerald-600" />
                 </div>
                 <div className="flex items-baseline gap-2">
                   <h4 className="text-4xl font-black text-slate-900">{myClients.length}</h4>
                   <span className="text-[10px] text-slate-700 font-bold">موكل مسند</span>
                 </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[3rem] hover:border-amber-300 transition-all group relative overflow-hidden shadow-sm">
                 <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-50 rounded-full blur-3xl opacity-50" />
                 <div className="flex items-center justify-between mb-6">
                   <span className="text-[10px] font-black text-slate-200 font-bold uppercase tracking-widest">المهام العدلية العالقة</span>
                   <CheckSquare className="w-5 h-5 text-amber-400 font-black" />
                 </div>
                 <div className="flex items-baseline gap-2">
                   <h4 className="text-4xl font-black text-slate-900">{myTasks.filter(t => t.status !== 'completed' && t.status !== 'done').length}</h4>
                   <span className="text-[10px] text-slate-700 font-bold">مهمة جارية</span>
                 </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[3rem] hover:border-purple-300 transition-all group relative overflow-hidden shadow-sm">
                 <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-50 rounded-full blur-3xl opacity-50" />
                 <div className="flex items-center justify-between mb-6">
                   <span className="text-[10px] font-black text-slate-200 font-bold uppercase tracking-widest">كفاءة الأداء التشغيلي</span>
                   <Activity className="w-5 h-5 text-purple-600" />
                 </div>
                 <div className="flex items-baseline gap-2">
                   <h4 className="text-4xl font-black text-slate-900">{personalKPIs.caseCompletionRate}%</h4>
                   <span className="text-[10px] text-slate-700 font-bold">تقدير ممتاز</span>
                 </div>
              </div>
            </div>

            {/* Middle Row: Judicial Calendar & Agenda */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              {/* Calendar Section */}
              <div className="xl:col-span-8 bg-white border border-slate-200 rounded-[3.5rem] p-10 space-y-10 relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                      <Calendar className="w-6 h-6 text-blue-600" />
                      <span>خارطة المواعيد والتحاضر القضائي ⚖️</span>
                    </h3>
                    <p className="text-[11px] text-slate-700 font-bold mt-1.5 uppercase tracking-wider">مزامنة فاعلة مع أرشيف ناجز الوطني</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                    <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                    <span className="text-[12px] font-black text-blue-600 min-w-[120px] text-center">
                      {calendarDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-4">
                  {DAYS_OF_WEEK_AR.map(day => (
                    <span key={day} className="text-[10px] text-slate-200 font-bold font-black text-center uppercase tracking-tighter">{day}</span>
                  ))}
                  {daysInGrid.map((dayNum, i) => {
                    if (dayNum === null) return <div key={`empty-${i}`} className="aspect-square" />;
                    const dStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const hasSess = mySessions.some(s => s.date === dStr);
                    const isSelected = selectedCalendarDateStr === dStr;
                    return (
                      <button
                        key={`day-${dayNum}`}
                        onClick={() => setSelectedCalendarDateStr(dStr)}
                        className={`aspect-square rounded-[1.5rem] text-sm font-black flex flex-col items-center justify-center relative transition-all group ${
                          isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/40 scale-105' : 
                          hasSess ? 'bg-blue-50 border border-blue-200 text-blue-600 shadow-sm' : 'bg-slate-50 text-slate-200 font-bold hover:bg-slate-100 hover:text-slate-200 font-bold border border-transparent'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {hasSess && !isSelected && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full absolute bottom-2.5 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Agenda Section */}
              <div className="xl:col-span-4 bg-white border border-slate-200 rounded-[3.5rem] p-8 flex flex-col relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-blue-600/50 to-transparent" />
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-6">أجندة اليوم المختار</h4>
                {selectedDaySessions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white font-bold gap-4 opacity-60">
                    <Clock className="w-12 h-12" />
                    <p className="text-[10px] font-black">لا توجد جلسات مجدولة</p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                    {selectedDaySessions.map(s => (
                      <div key={s.id} className="p-6 bg-slate-50 shadow-sm rounded-[2.5rem] space-y-4 border border-slate-100 group/item transition-all hover:border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl text-[11px] font-black">{s.sessionType}</span>
                          <span className="text-[11px] text-slate-200 font-bold font-bold">{s.time}</span>
                        </div>
                        <h5 className="text-sm font-black text-slate-900 leading-snug">{s.caseName}</h5>
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                          <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-200 font-bold shadow-sm">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-200 font-bold font-black">الموقع</p>
                            <p className="text-[10px] text-slate-900 font-bold">{s.courtName}</p>
                          </div>
                        </div>
                        <a href={s.najizLink} target="_blank" rel="noreferrer" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
                          دخول ناجز 🔗
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Leave Overview Context & HR */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mt-10">
              {/* Overall Progress & Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 flex flex-col justify-between shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-40 h-40 bg-amber-50 rounded-br-[5rem] -ml-8 -mt-8 pointer-events-none transition-colors" />
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                       <div>
                         <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                           <Coffee className="w-6 h-6 text-amber-500" />
                           <span>لوحة بيانات الإجازات</span>
                         </h3>
                         <p className="text-[11px] text-slate-700 font-bold mt-1.5 uppercase tracking-wider">نظرة عامة على الرصيد المستحق والمستهلك</p>
                       </div>
                       <button 
                         onClick={() => setShowLeaveForm(true)}
                         className="px-6 py-3 bg-blue-950 text-white rounded-2xl font-black text-xs hover:bg-blue-900 transition-all shadow-xl shadow-blue-950/20 active:scale-95"
                       >
                         تقديم طلب إجازة
                       </button>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6">
                       <div className="flex justify-between items-end">
                          <span className="text-4xl font-black text-amber-500">{vacationBalance.remaining} <span className="text-sm text-slate-700">يوماً</span></span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 font-bold">إجمالي الرصيد السنوي: {vacationBalance.earned}</span>
                       </div>
                       
                       <div className="relative w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${vacationBalance.earned === 0 ? 0 : (vacationBalance.remaining / vacationBalance.earned) * 100}%` }}
                            className="absolute top-0 bottom-0 left-0 bg-amber-500 rounded-full"
                          />
                       </div>

                       <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>طُلبت وعُلقت: {leaveRequests.filter(r => r.status === 'pending').length}</span>
                          <span>مُعتمدة (مستهلكة): {leaveRequests.filter(r => r.status === 'approved').length}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Leave Requests HR Interactive Calendar */}
              <div className="bg-white border border-slate-200 rounded-[3.5rem] p-8 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                     <Calendar className="w-5 h-5 text-blue-600" />
                     جدول الإجازات الزمني
                   </h3>
                   <div className="flex gap-2">
                     <button onClick={() => setHrCalendarDate(new Date(hrCalendarDate.getFullYear(), hrCalendarDate.getMonth() - 1, 1))} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                     <span className="text-xs font-black min-w-[100px] text-center pt-2">{hrCalendarDate.toLocaleString('ar-EG', { month: 'short', year: 'numeric' })}</span>
                     <button onClick={() => setHrCalendarDate(new Date(hrCalendarDate.getFullYear(), hrCalendarDate.getMonth() + 1, 1))} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
                   </div>
                 </div>
                 <div className="grid grid-cols-7 gap-3 text-center">
                    {DAYS_OF_WEEK_AR.map(d => <span key={d} className="text-[11px] font-black text-slate-200 font-bold p-2">{d}</span>)}
                    {hrCalendarData.map((dNum, i) => {
                       if (!dNum) return <div key={i} />
                       const dStr = `${hrCalendarDate.getFullYear()}-${String(hrCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                       const dayLeaves = leaveRequests.filter(r => dStr >= r.startDate && dStr <= r.endDate);
                       const isPending = dayLeaves.some(r => r.status === 'pending');
                       const isApproved = dayLeaves.some(r => r.status === 'approved');
                       return (
                         <div 
                           key={`hr-${dNum}`} 
                           title={dayLeaves.length > 0 ? `حالة الطلب: ${isApproved ? 'معتمد' : 'معلق'}` : undefined}
                           className={`aspect-square text-xs font-black flex items-center justify-center rounded-2xl border transition-all cursor-pointer ${
                             isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 
                             isPending ? 'bg-amber-50 text-amber-400 font-black border-amber-200 shadow-sm' : 
                             'bg-slate-50/50 text-slate-700 border-transparent hover:border-slate-200'
                           }`}
                         >
                           {dNum}
                         </div>
                       )
                    })}
                 </div>
              </div>
            </div>

            {/* Bottom Row: Active Cases & Operational Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Assigned Cases Brief */}
              <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 space-y-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-4">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    <span>ملفات الترافع المسندة للمتابعة</span>
                  </h3>
                  <button onClick={() => setActivePortalTab('cases')} className="text-[10px] font-black text-blue-600 hover:underline">عرض الكل</button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {myCases.length === 0 ? (
                     <div className="py-20 text-center text-slate-200 font-bold text-xs font-bold">لا يوجد قضايا نشطة مسندة حالياً.</div>
                  ) : (
                    myCases.slice(0, 5).map(c => (
                      <div key={c.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center justify-between hover:bg-white hover:border-blue-200 transition-all shadow-sm">
                        <div className="flex items-center gap-5 text-right w-full">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-colors shrink-0 ${c.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm font-black text-slate-900 truncate">{c.caseName}</h5>
                            <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                               <span className="text-[10px] font-black text-slate-200 font-bold font-mono tracking-tighter shrink-0">{c.caseNumber}</span>
                               <span className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                               <span className="text-[10px] font-black text-blue-600 truncate">{c.courtName}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActivePortalTab('cases')}
                          className="w-10 h-10 bg-white border border-slate-200 text-slate-200 font-bold rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0 shadow-sm"
                        >
                          <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Operational Tasks Brief */}
              <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 space-y-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-4">
                    <CheckSquare className="w-6 h-6 text-amber-400 font-black" />
                    <span>سجل المهام التشغيلية المجدولة</span>
                  </h3>
                  <button onClick={() => setActivePortalTab('tasks')} className="text-[10px] font-black text-amber-400 font-black hover:underline">إدارة المهام</button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {myTasks.length === 0 ? (
                    <div className="py-20 text-center text-slate-200 font-bold text-xs font-bold">لا يوجد مهام مجدولة حالياً.</div>
                  ) : (
                    myTasks.slice(0, 5).map(t => (
                      <div key={t.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-4 hover:bg-white hover:border-amber-200 transition-all shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-black text-slate-900 flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${t.priority === 'high' ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.3)]' : 'bg-slate-300'}`} />
                              <span className="truncate">{t.title}</span>
                            </h5>
                            <div className="mt-2">
                               <TaskCountdown dueDate={t.dueDate} />
                            </div>
                          </div>
                          <span className={`text-[11px] font-black px-3 py-1 rounded-full shrink-0 ${t.status === 'completed' || t.status === 'done' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-400 font-black border border-amber-200'}`}>
                            {t.status === 'completed' || t.status === 'done' ? 'موثقة ومنجزة ✅' : 'جارية للمتابعة ⏳'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-200 font-bold font-black">المده المتبقية:</span>
                            <TaskCountdown dueDate={t.dueDate} />
                          </div>
                          <select 
                            value={t.status} 
                            onChange={(e) => handleToggleTaskStatus(t.id, e.target.value)} 
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black text-slate-700 outline-none cursor-pointer focus:border-blue-500 hover:border-slate-300 transition-all shadow-sm"
                          >
                            <option value="todo">تحت التنفيذ</option>
                            <option value="completed">تم الإنجاز</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* HR & LEAVES TAB */}
        {activePortalTab === 'hr' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm gap-6">
              <div>
                <h2 className="text-2xl font-black text-blue-950 flex items-center gap-3">
                  <Coffee className="w-6 h-6 text-amber-500" />
                  الشؤون الوظيفية والإجازات
                </h2>
                <p className="text-xs text-blue-900 font-bold mt-1">تتبع الحضور، تقديم طلبات الإجازة، والمستندات الشخصية.</p>
              </div>
              <div className="flex gap-3">
                 <div className="hidden sm:flex bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl items-center gap-4">
                    <div className="text-right">
                       <span className="text-[11px] text-blue-400 font-black block uppercase">رصيد الإجازات المتبقي</span>
                       <span className="text-lg font-black text-blue-900">18 / 30 يوم</span>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                       <span className="font-black text-sm">60%</span>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowLeaveForm(true)}
                   className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-all"
                 >
                   <PlusCircle className="w-4 h-4" />
                   طلب إجازة جديدة
                 </button>
              </div>
            </div>

            {/* Leave Progress Visualizer */}
            <div className="bg-white border border-blue-100 rounded-[2.5rem] p-8 shadow-sm">
               <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="w-full md:w-1/3">
                     <h3 className="text-sm font-black text-blue-950 mb-4">استهلاك الرصيد السنوي</h3>
                     <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '40%' }}
                          className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-600 to-indigo-400"
                        />
                     </div>
                     <div className="flex justify-between mt-3 text-[10px] font-black text-slate-200 font-bold uppercase">
                        <span>تم استهلاك 12 يوماً</span>
                        <span>متبقي 18 يوماً</span>
                     </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                     {[
                       { label: 'إجازات معتمدة', val: '3', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                       { label: 'طلبات معلقة', val: '1', color: 'text-amber-400 font-black', bg: 'bg-amber-50' },
                       { label: 'إجازات مرضية', val: '2', color: 'text-rose-600', bg: 'bg-rose-50' },
                       { label: 'أيام الغياب', val: '0', color: 'text-slate-200 font-bold', bg: 'bg-slate-50' }
                     ].map((stat, i) => (
                       <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white/50 text-center flex flex-col items-center justify-center`}>
                          <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
                          <span className="text-[11px] font-black text-slate-700 mt-1 uppercase">{stat.label}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Attendance Log - 4 cols */}
              <div className="lg:col-span-4 bg-white border border-blue-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
                <h3 className="text-sm font-black text-blue-950 border-b border-blue-50 pb-4 mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  سجل الحضور الأخير
                </h3>
                <div className="flex-1 space-y-4">
                  {attendance.length === 0 ? (
                    <div className="py-20 text-center text-slate-200 font-bold text-xs font-bold">لا يوجد سجلات حضور مسجلة لهذا الشهر.</div>
                  ) : (
                    attendance.slice(0, 5).map(record => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${record.status === 'late' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                            {record.status === 'late' ? <Clock className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">{record.date}</p>
                            <p className="text-[10px] text-slate-700 font-bold">{record.method === 'qr' ? 'بصمة QR' : 'الموقع الموقع'}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-mono font-black text-slate-900">{record.checkIn}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Leave Calendar - 4 cols */}
              <div className="lg:col-span-4 bg-white border border-blue-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
                 <div className="flex items-center justify-between mb-6 border-b border-blue-50 pb-4">
                    <h3 className="text-sm font-black text-blue-950 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      تقويم الإجازات
                    </h3>
                    <div className="flex gap-1">
                       <button onClick={() => setHrCalendarDate(new Date(hrCalendarDate.getFullYear(), hrCalendarDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-200 font-bold"><ChevronRight className="w-4 h-4" /></button>
                       <button onClick={() => setHrCalendarDate(new Date(hrCalendarDate.getFullYear(), hrCalendarDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-200 font-bold"><ChevronLeft className="w-4 h-4" /></button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                    {DAYS_OF_WEEK_AR.map(d => (
                       <span key={d} className="text-[11px] font-black text-slate-200 font-bold uppercase">{d}</span>
                    ))}
                 </div>
                 
                 <div className="grid grid-cols-7 gap-1">
                    {hrCalendarData.map((day, i) => {
                       if (!day) return <div key={i} className="h-10" />;
                       const dateStr = `${hrCalendarDate.getFullYear()}-${(hrCalendarDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                       const hasLeave = leaveRequests.some(r => r.startDate <= dateStr && r.endDate >= dateStr && r.status === 'approved');
                       const isPending = leaveRequests.some(r => r.startDate <= dateStr && r.endDate >= dateStr && r.status === 'pending');
                       
                       return (
                          <div 
                             key={i} 
                             className={`h-10 flex items-center justify-center rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                               hasLeave 
                                 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                                 : isPending 
                                    ? 'bg-amber-100 text-amber-400 font-black border border-amber-200' 
                                    : 'hover:bg-slate-50 text-slate-200 font-bold'
                             }`}
                          >
                             {day}
                             {hasLeave && <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full"></div>}
                          </div>
                       );
                    })}
                 </div>

                 <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                       <span className="text-[10px] font-bold text-slate-700">إجازة معتمدة</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded-full"></div>
                       <span className="text-[10px] font-bold text-slate-700">طلب قيد المراجعة</span>
                    </div>
                 </div>
              </div>

              {/* Leave Requests List - 4 cols */}
              <div className="lg:col-span-4 bg-white border border-blue-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col h-full">
                <h3 className="text-sm font-black text-blue-950 border-b border-blue-50 pb-4 mb-6 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  قائمة الطلبات الجارية
                </h3>
                <div className="space-y-4 h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {leaveRequests.length === 0 ? (
                    <div className="py-20 text-center text-slate-200 font-bold text-xs font-bold">لم تتقدم بأی طلبات إجازة حتى الآن.</div>
                  ) : (
                    leaveRequests.map(req => (
                      <div key={req.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                           <h4 className="text-xs font-black text-slate-900">إجازة {req.type === 'vacation' ? 'اعتيادية' : 'مرضية'}</h4>
                           <span className={`text-[10px] px-2 py-1 rounded-full font-black ${
                             req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-400 font-black border border-amber-100'
                           }`}>
                             {req.status === 'approved' ? 'مقبولة' : 'معلقة'}
                           </span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700">
                           <span>{req.startDate}</span>
                           <span>إلى</span>
                           <span>{req.endDate}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activePortalTab === 'performance' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-10 rounded-[2.5rem] border border-blue-100 shadow-sm relative overflow-hidden text-slate-900">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-400"></div>
               <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black flex items-center gap-4 text-slate-900">
                       <Activity className="w-8 h-8 text-blue-600" />
                       مؤشر الأداء المهني (KPI)
                    </h2>
                    <p className="text-slate-700 font-bold mt-2 text-sm">تحليلات الأداء الشهري بناءً على المهام، الدقة، والالتزام بالمواعيد.</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest block mb-1">التقييم العام</span>
                    <span className="text-3xl font-black text-slate-900">94.2%</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white border border-blue-100 rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-sm font-black text-blue-950 mb-8 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    تتبع حجم العمل والدقة الأسبوعية
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="tasks" name="المهام" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                        <Area type="monotone" dataKey="accuracy" name="الدقة %" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAccuracy)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white border border-blue-100 rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-sm font-black text-blue-950 mb-8 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    الالتزام بالمواعيد (تسليم المهام)
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Bar dataKey="punctuality" name="الالتزام %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* NAJIZ SYNC ADAPTER TAB */}
        {activePortalTab === 'najiz' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="bg-white border-2 border-cyan-100 rounded-[2.5rem] p-10 space-y-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-cyan-600/10 text-cyan-700 rounded-3xl flex items-center justify-center">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-blue-950">محرك مزامنة بوابة ناجز المباشر</h3>
                    <p className="text-xs text-blue-900 font-bold mt-1">يُرجى تشغيل المحرك لبدء الربط مع بوابة وزارة العدل.</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                  <p className="text-[10px] text-slate-700 font-black mb-3 leading-relaxed">
                    يستخدم هذا الموديول "بوابة النفاذ الوطني" (IAM) بشكل آلي لسحب ملفات القضايا والقرارات لعام {new Date().getFullYear()}. تظهر النتائج في لوحة التحكم الرئيسية فور انتهاء السجل.
                  </p>
                  <button 
                    onClick={handleRunNajizSync}
                    disabled={isNajizSyncing}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-lg shadow-cyan-600/10"
                  >
                    {isNajizSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
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
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-200 font-bold uppercase tracking-wide">سجل معالجة خادم سحب البيانات:</h4>
                  <div className="h-44 overflow-y-auto space-y-2 border border-slate-100 p-4 rounded-xl font-mono text-[11px] text-emerald-600 bg-slate-50 custom-scrollbar">
                    {najizSyncLog.length === 0 ? (
                      <span className="text-slate-200 font-bold font-bold block text-center py-12">مستعد لبدء الربط التلقائي...</span>
                    ) : (
                      najizSyncLog.map((log, i) => (
                        <div key={i} className="flex justify-between items-start gap-3">
                          <span className="text-right leading-normal font-bold">{log.msg}</span>
                          <span className="text-slate-200 font-bold shrink-0 select-none">[{log.time}]</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI SERVICES AND ASSISTANT TAB */}
        {activePortalTab === 'ai' && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-slate-900">مساعد المحاماة الذكي بـ Gemini</h3>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  مستشارك السحابي لصياغة مذكرات الدفاع، العقود والمذكرات الجوابية، والبحث في الأنظمة القضائية واللوائح التنفيذية.
                </p>
              </div>
            </div>

            <div className="flex border-b border-slate-100 mb-4 gap-2">
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
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-200 font-bold hover:text-blue-600 hover:bg-blue-50'
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
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all h-36 resize-none custom-scrollbar"
               />

               <div className="flex justify-end">
                  <button 
                    onClick={handleRunAIProcess}
                    disabled={isAILoading || !aiPrompt.trim()}
                    className="bg-blue-600 hover:bg-slate-900 text-white font-black px-8 py-3.5 rounded-xl text-xs flex items-center gap-2 transform active:scale-95 transition-all shadow-lg shadow-blue-600/10"
                  >
                    {isAILoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
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
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-blue-600">النتيجة والجواب القانوني الصادر:</h4>
                <div className="text-slate-900 font-bold text-xs leading-relaxed whitespace-pre-wrap break-words text-right">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSIGNED CASES PANEL TAB */}
        {activePortalTab === 'cases' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
                  <Briefcase className="w-6 h-6" />
                </div>
                الأروقة القضائية ومذكرات الترافع المسندة إليك
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myCases.length === 0 ? (
                  <div className="col-span-full py-20 bg-white rounded-[2.5rem] text-center border border-slate-200 text-slate-200 font-bold font-bold text-xs shadow-sm">
                    لا توجد قضايا حالية مسندة إلى اسمك. يمكنك مزامنتها من ناجز أو طلب تعيينها من لوحة المدير.
                  </div>
                ) : (
                  myCases.map(c => (
                    <motion.div 
                      key={c.id} 
                      className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex flex-col justify-between group text-right hover:border-blue-400 transition-all duration-300 relative overflow-hidden shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600/10" />
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-[10px] font-black text-slate-200 font-bold font-mono tracking-wide">{c.caseNumber}</span>
                          <span className={`text-[11px] px-3 py-1 rounded-full font-black ${
                            c.status === 'active' || c.status === 'pending_session'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}>
                            {c.status === 'active' ? 'قيد الترافع النشط' : c.status === 'pending_session' ? 'جلسة مقبلة جارية' : 'مغلق'}
                          </span>
                        </div>
                        
                        <h4 className="font-black text-lg text-slate-900 mb-4 leading-tight">{c.caseName}</h4>
                        <div className="space-y-3 text-[11px] text-slate-700 font-bold mb-6 pr-1">
                          <p className="flex items-center gap-2.5"><Users className="w-4 h-4 text-blue-600" /> الموكل/العميل: {c.clientName}</p>
                          <p className="flex items-center gap-2.5"><Globe className="w-4 h-4 text-emerald-600" /> المحكمة: {c.courtName || 'المحكمة العامة'}</p>
                          {c.nextSessionDate && (
                            <p className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-amber-500" /> الجلسة القادمة: {c.nextSessionDate}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-5 border-t border-slate-100">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] text-slate-200 font-bold font-black mb-1">ملخص الخصم:</p>
                          <p className="text-xs font-black text-slate-900">{c.opponentName || 'غير مسجل'}</p>
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
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-400 font-black border border-amber-100">
                <CheckSquare className="w-6 h-6" />
              </div>
              تتبع وتنفيذ المهام العدلية المسندة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {myTasks.length === 0 ? (
                <div className="col-span-full py-20 bg-white rounded-[2.5rem] text-center border border-slate-200 text-slate-200 font-bold font-bold text-xs shadow-sm">
                  ليس لديك مهام جارية حالياً.
                </div>
              ) : (
                myTasks.map(t => (
                  <div key={t.id} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6 hover:border-amber-400 transition-all duration-300 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-black text-slate-900">{t.title}</p>
                      
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black ${
                        t.priority === 'high' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {t.priority === 'high' ? 'عالية ومستعجلة' : 'اعتيادية'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-bold leading-relaxed">{t.description || 'لم تدرج تفاصيل إضافية مسبقاً.'}</p>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <TaskCountdown dueDate={t.dueDate} />
                        
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-200 font-bold font-black">الحالة:</span>
                          <select 
                            value={t.status}
                            onChange={(e) => handleToggleTaskStatus(t.id, e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 font-black outline-none focus:border-blue-600"
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

        {/* CLIENTS TAB */}
        {activePortalTab === 'clients' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                <Users className="w-6 h-6" />
              </div>
              سجل الموكلين المسندين للمتابعة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myClients.length === 0 ? (
                <div className="col-span-full py-20 bg-white rounded-[2.5rem] text-center border border-slate-200 text-slate-200 font-bold font-bold text-xs shadow-sm">
                  لا يوجد موكلين مسندين حالياً.
                </div>
              ) : (
                myClients.map(client => (
                  <div key={client.id} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between hover:border-emerald-400 transition-all duration-300 relative">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-600/10" />
                    <div>
                      <h4 className="font-black text-lg text-slate-900 mb-2 leading-tight">{client.name}</h4>
                      <p className="text-[10px] text-slate-200 font-bold font-black mb-6">الرقم الضريبي/الهوية: {client.nationalId || 'غير متوفر'}</p>
                      
                      <div className="space-y-3 text-[11px] text-slate-700 font-bold mb-6 pr-1">
                        <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-emerald-600" /> {client.phone}</p>
                        <p className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-blue-600" /> {client.email}</p>
                        <p className="flex items-center gap-2.5"><Briefcase className="w-4 h-4 text-amber-500" /> نوع العميل: {client.isCompany ? 'شركة / مؤسسة' : 'فرد'}</p>
                      </div>
                    </div>
                    
                    <button className="w-full py-3.5 bg-slate-50 hover:bg-emerald-50 text-slate-200 font-bold hover:text-emerald-700 rounded-2xl font-black text-xs transition-all border border-slate-100 hover:border-emerald-200">
                      استعراض ملف العميل الكامل
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* AI SEARCH TAB */}
        {activePortalTab === 'ai-search' && (
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h3 className="text-3xl font-black text-slate-900">مرصد الأنظمة والبحث القضائي الذكي 🔍</h3>
              <p className="text-slate-700 font-bold max-w-2xl mx-auto">
                ابحث في كافة الأنظمة واللوائح والتعاميم الصادرة من وزارة العدل والمحاكم السعودية باستخدام تقنيات الذكاء الاصطناعي.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-blue-100 shadow-xl shadow-blue-600/5 space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ابحث عن نظام، مادة قانونية، أو مبدأ قضائي..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-10 py-6 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none pr-16"
                />
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['نظام العمل', 'نظام المرافعات', 'نظام الشركات', 'الأنظمة التجارية'].map(sys => (
                  <button key={sys} className="px-6 py-4 bg-slate-50 hover:bg-blue-50 text-slate-200 font-bold hover:text-blue-600 rounded-2xl text-xs font-black border border-slate-100 hover:border-blue-200 transition-all">
                    {sys}
                  </button>
                ))}
              </div>
            </div>

            <div className="py-12 text-center text-white font-bold font-black opacity-60">
               <Globe className="w-20 h-20 mx-auto mb-6 animate-pulse" />
               <p>أدخل استعلامك للبحث في المراجعة القضائية الفورية</p>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activePortalTab === 'documents' && (
          <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                <FileText className="w-6 h-6" />
              </div>
              أوليات ومستندات ملف القضية المجمعة
            </h3>
            
            <p className="text-xs text-slate-700 font-bold leading-relaxed">
              قم بتحميل الأقراص الصكوك وتفويض التوكيل المرتبط بـ {loggedInEmployee.name}. الملفات ترفع تلقائياً على خزانة الحساب المدير للحفاظ على المزامنة.
            </p>

            <div className="dropzone border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-white rounded-3xl p-12 text-center cursor-pointer transition-all hover:border-blue-400 flex flex-col items-center gap-4">
              <FileText className="w-12 h-12 text-blue-400 animate-bounce" />
              <span className="text-sm font-black text-slate-900">اسحب ملفات أو مذكرات للتوريد هنا</span>
              <span className="text-[11px] text-slate-200 font-bold font-bold">صيغ مدعومة: PDF, DOC, PNG, JPEG حتى حجم 30 ميغابايت</span>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Leave Request Modal */}
      <AnimatePresence>
        {showLeaveForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-100/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden overflow-y-auto max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-black text-blue-950 flex items-center gap-3">
                  <Coffee className="w-6 h-6 text-amber-500" />
                  تقديم طلب إجازة جديد
                </h3>
                <button onClick={() => setShowLeaveForm(false)} className="text-slate-200 font-bold hover:text-rose-600 transition-all">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block pr-2">نوع الإجازة</label>
                    <select name="type" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-950 font-bold text-sm focus:border-blue-600 outline-none">
                      <option value="vacation">إجازة اعتيادية (رصيد سنوي)</option>
                      <option value="sick">إجازة مرضية (بتقرير طبي)</option>
                      <option value="emergency">إجازة اضطرارية</option>
                      <option value="unpaid">إجازة بدون راتب</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block pr-2">بداية الإجازة</label>
                    <input type="date" name="startDate" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-950 font-bold text-sm outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block pr-2">نهاية الإجازة</label>
                    <input type="date" name="endDate" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-950 font-bold text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block pr-2">سبب الطلب / ملاحظات إضافية</label>
                  <textarea name="reason" rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-950 font-bold text-sm outline-none resize-none" placeholder="اكتب تفاصيل الطلب هنا..."></textarea>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95">
                    إرسال الطلب للمدير المباشر
                  </button>
                  <button type="button" onClick={() => setShowLeaveForm(false)} className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-200 font-bold py-4 rounded-2xl font-black text-xs transition-all">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check In Modal */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-10"
            >
              {geoLocating ? (
                <>
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-6 animate-pulse">
                    <Loader2 className="w-10 h-10 animate-spin" />
                  </div>
                  <h3 className="text-xl font-black text-blue-950 mb-2">جاري تحديد الموقع</h3>
                  <p className="text-sm font-bold text-slate-700 mb-8 max-w-[250px]">
                    يرجى الانتظار بينما نقوم بالتحقق من إحداثياتك للمطابقة مع النطاق المسموح.
                  </p>
                  <button onClick={() => { setGeoLocating(false); setShowCheckInModal(false); }} className="text-slate-200 font-bold font-bold hover:text-slate-200 font-bold">
                    إلغاء العملية
                  </button>
                </>
              ) : qrCodeData ? (
                <>
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-6">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-blue-950 mb-2">رمز التوثيق الخاص بك</h3>
                  <p className="text-xs font-bold text-slate-700 mb-6">
                    قم بمسح هذا الرمز باستخدام جهاز البصمة أو بوابة التحقق لإثبات حضورك.
                  </p>
                  <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl mb-8">
                    <QRCodeSVG value={qrCodeData} size={180} />
                  </div>
                  <button onClick={() => { setShowCheckInModal(false); setQrCodeData(null); }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-xs transition-all">
                    إغلاق
                  </button>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
