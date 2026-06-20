/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toCamel, toSnake } from '@/utils/schemaMapping';
import { SortableWidgetWrapper } from './SortableWidgetWrapper';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCountdown from './TaskCountdown';
import CountdownTimer from './CountdownTimer';
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  DollarSign, 
  Calendar, 
  Clock as ClockIcon, 
  AlertCircle, 
  Cpu, 
  ChevronLeft,
  ArrowUpRight,
  Calculator,
  BookOpen,
  Scale,
  X,
  MessageCircle,
  MessageSquare,
  Crown,
  CheckCircle2,
  FileText,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Loader2,
  RefreshCw,
  Edit3,
  AlertTriangle,
  GripVertical,
  Star,
  Sparkles,
  Play,
  Pause,
  Save,
  Search,
  Maximize2,
  Minimize2,
  Settings2,
  Check,
  Plus,
  Layout,
  Palette,
  MousePointer2,
  Keyboard,
  Info,
  ArrowRight,
  Activity,
  Layers,
  Heart,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, Client, Invoice, Task, Hearing } from '@/types';
import HearingCustomTimer from './HearingCustomTimer';
import { InteractiveCard } from './InteractiveCard';
import TaskSuggestions from './TaskSuggestions';
import SystemErrorRecovery from './SystemErrorRecovery';
import InteractionGuideComponent from './InteractionGuideComponent';
import DashboardCardSkeleton from './DashboardCardSkeleton';
import TimelineView from './TimelineView';
import { Suspense } from 'react';
const TimelineD3 = React.lazy(() => import('./TimelineD3'));
import LegalRiskMatrix from './legal/LegalRiskMatrix';
import MiniChart from './charts/MiniChart';
import { RadialBarChart, RadialBar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';
import { Upload, Download, Eye, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NajizWidget } from './NajizWidget';

import { NajizPerformanceWidget, AgenciesAlertWidget, OverdueTasksWidget, DeadlinesWidget, UpcomingHearingsList, EmployeePerformanceKPI } from './dashboard/DashboardWidgets';
import AppealCountdownWidget from './dashboard/AppealCountdownWidget';
import { getContrastText, TEXT_COLORS } from '@/utils/contrastUtils';

const GaugeMeter = React.memo(({ percentage, color = '#b8860b', label }: { percentage: number, color?: string, label: string }) => {
  const radius = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-5 bg-slate-50 border border-slate-200 rounded-3xl w-full">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute text-center">
          <span className="text-xl font-mono font-black text-slate-900 tracking-tighter">{percentage}%</span>
          <span className="text-[10px] text-slate-200 font-bold block font-black uppercase tracking-wider mt-0.5">منجز اليوم</span>
        </div>
      </div>
      <div className="text-center">
        <strong className="text-xs font-black text-slate-900 block">{label}</strong>
      </div>
    </div>
  );
});

export const SummaryWidget = ({ icon, title, description, badgeValue, children }: { icon: React.ReactNode, title: string, description: string, badgeValue?: string | number, children: React.ReactNode }) => {
  const bgClass = "#0b1329";
  const textColor = getContrastText(bgClass);
  const secondaryColor = TEXT_COLORS.goldBright;

  return (
    <div className={`bg-[${bgClass}] border-2 border-[#D4AF37]/50 rounded-3xl p-6 flex flex-col h-full overflow-hidden relative`}>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#D4AF37] to-[#FACC15] text-white rounded-2xl shadow-lg ring-2 ring-[#D4AF37]/30">
            {icon}
          </div>
          <div>
            <h4 className={`font-black ${textColor} text-base tracking-tight`}>{title}</h4>
            <p className={`text-[11px] ${secondaryColor} font-bold mt-0.5`}>{description}</p>
          </div>
        </div>
        {badgeValue !== undefined && (
          <span className={`font-mono text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FACC15]`}>
            {badgeValue}
          </span>
        )}
      </div>
      <div className={`flex-1 bg-[#090f20] rounded-2xl p-4 border border-[#D4AF37]/20 relative z-10 ${getContrastText('#090f20')} font-bold`}>
        {children}
      </div>
    </div>
  );
};

interface DashboardProps {
  cases: Case[];
  clients: Client[];
  invoices: Invoice[];
  tasks: Task[];
  hearings: Hearing[];
  selectedRole: string;
  onNavigate: (tab: string) => void;
  onSelectCase: (caseObj: Case | null) => void;
  onUpdateState?: (type: string, data: any) => void;
  currentUser?: any;
}

const miniPerformanceData = [
  { day: 'السبت', completion: 75, timeSpent: 80 },
  { day: 'الأحد', completion: 82, timeSpent: 78 },
  { day: 'الاثنين', completion: 80, timeSpent: 85 },
  { day: 'الثلاثاء', completion: 88, timeSpent: 72 },
  { day: 'الأربعاء', completion: 92, timeSpent: 79 },
  { day: 'الخميس', completion: 90, timeSpent: 81 },
  { day: 'الجمعة', completion: 94, timeSpent: 88 },
];

const ensureKpisFirst = (items: any[]) => {
  if (!Array.isArray(items)) return items;
  const kpis = ['kpiCases', 'kpiClients', 'kpiInvoices', 'kpiTasks'];
  const orderedKpis = kpis.map(id => {
    const found = items.find(w => w.id === id);
    return found ? { ...found } : { id, visible: true, size: 'qr' };
  });
  const others = items.filter(w => !kpis.includes(w.id));
  return [...orderedKpis, ...others];
};

import { useRenderPerformance } from '../lib/PerformanceOptimizer';

const DashboardClock = ({ style = 'digital', color = '#D4AF37' }: { style?: string, color?: string }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: style === 'digital' ? '2-digit' : undefined });
  const dateString = time.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });

  if (style === 'minimal') {
    return (
      <div className="flex flex-col items-end">
        <span className="text-2xl font-black tracking-tighter text-[#FACC15] font-black">{timeString}</span>
        <span className="text-[11px] font-bold text-slate-200 font-bold">{dateString}</span>
      </div>
    );
  }

  if (style === 'classic') {
    return (
      <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl shadow-2xl">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500/50 flex items-center justify-center relative">
          <div className="w-1 h-3 bg-amber-500 rounded-full absolute top-2 origin-bottom animate-[spin_60s_linear_infinite]" style={{ transformOrigin: 'bottom center' }}></div>
          <div className="w-1 h-4 bg-slate-200 rounded-full absolute top-1 origin-bottom animate-[spin_3600s_linear_infinite]"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full z-10"></div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black text-white leading-none">{timeString}</span>
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mt-1">{dateString}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-[#D4AF37]/30 shadow-2xl flex flex-col items-center justify-center min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <ClockIcon className={`w-3.5 h-3.5 ${TEXT_COLORS.goldBright} font-black`} />
        <span className={`text-[10px] font-black ${TEXT_COLORS.goldBright} font-black uppercase tracking-widest`}>الوقت الحالي</span>
      </div>
      <span className={`text-3xl font-black ${getContrastText('#0f172a')} tabular-nums tracking-tighter`}>{timeString}</span>
      <div className={`mt-2 text-[11px] font-bold ${getContrastText('#1e293b')} bg-white/10 py-1 px-3 rounded-full`}>{dateString}</div>
    </div>
  );
};

const EnhancedSortableWidgetWrapper = ({ id, children, className, isCustomizing, widgetSize, onResize }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  const getArabicSizeName = (size: string) => {
    if (size === 'qr') return 'صغير';
    if (size === 'half') return 'متوسط';
    if (size === 'full') return 'كبير';
    return size;
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${className} transition-all duration-300 relative ${isCustomizing ? 'ring-2 ring-amber-400 rounded-[2.5rem] p-1.5 bg-[#0b1329]' : ''}`}
    >
      {isCustomizing && (
        <div className="absolute inset-0 bg-[#0b1329]/90 backdrop-blur-md z-50 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-300">
          
          <button 
            {...attributes} 
            {...listeners}
            className="p-5 bg-yellow-400 text-[#0b1329] rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.5)] cursor-grab active:cursor-grabbing hover:bg-white hover:scale-110 transition-all flex items-center justify-center gap-3 w-56"
          >
            <GripVertical size={24} />
            <span className="font-black text-[15px]">سحب لتحريك الكارت</span>
          </button>
          
          <div className="flex flex-col items-center gap-3">
             <span className="text-white font-black text-xs uppercase tracking-widest bg-[#0b1329] px-4 py-1.5 rounded-full border border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.2)]">اختر حجم الكارت المطلوب</span>
             <div className="flex bg-[#0b1329] rounded-xl p-1.5 border border-[#D4AF37]/50 shadow-xl gap-1">
               {['qr', 'half', 'full'].map(size => (
                 <button
                   key={size}
                   onClick={() => onResize(id, size)}
                   className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                     widgetSize === size 
                       ? 'bg-yellow-400 text-[#0b1329] shadow-[0_0_15px_rgba(250,204,21,0.5)]' 
                       : 'text-white hover:text-yellow-400 hover:bg-white/5 border border-transparent hover:border-yellow-400/30'
                   }`}
                 >
                   {getArabicSizeName(size)}
                 </button>
               ))}
             </div>
          </div>
          
        </div>
      )}
      <div className={`h-full rounded-[2.5rem] border-4 border-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-500 ${isDragging ? 'scale-95 shadow-2xl ring-4 ring-amber-400' : ''}`}>
        {children}
      </div>
    </div>
  );
};

const Dashboard = function Dashboard({
  cases = [],
  clients = [],
  invoices = [],
  tasks = [],
  hearings = [],
  selectedRole,
  onNavigate,
  onSelectCase,
  onUpdateState,
  currentUser
}: DashboardProps) {
  useRenderPerformance('Dashboard', 20);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const [themeTick, setThemeTick] = useState(Date.now());
  const [performancePeriod, setPerformancePeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [performanceTab, setPerformanceTab] = useState<'overview' | 'trends' | 'comparison' | 'whatsapp'>('overview');
  const [whatsappStats, setWhatsappStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch('/api/whatsapp/stats');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setWhatsappStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Failed to fetch whatsapp stats', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);
  const [isHighContrast, setIsHighContrast] = useState(() => document.body.classList.contains('high-contrast-mode'));
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showSessionStatsModal, setShowSessionStatsModal] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('adalah-dashboard-username') || 'المستخدم');
  const [isEditingUserName, setIsEditingUserName] = useState(false);

  useEffect(() => {
    const handleUsernameChange = () => {
      try {
        setUserName(localStorage.getItem('adalah-dashboard-username') || 'المستخدم');
      } catch {}
    };
    window.addEventListener('adalah-username-changed', handleUsernameChange);
    return () => window.removeEventListener('adalah-username-changed', handleUsernameChange);
  }, []);

  useEffect(() => {
    if (currentUser?.name) {
      setUserName(currentUser.name);
      localStorage.setItem('adalah-dashboard-username', currentUser.name);
    }
  }, [currentUser]);

  // Sync drag-and-drop customized widget hierarchy from database
  useEffect(() => {
    const loadLayoutFromSupabase = async () => {
      const uid = currentUser?.id;
      if (!uid) return;
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('widgets')
          .eq('user_id', uid)
          .eq('key', 'dashboardLayout')
          .maybeSingle();

        if (data?.widgets && Array.isArray(data.widgets)) {
          setWidgets(data.widgets);
          localStorage.setItem(`dashboard_widgets_config_${selectedRole}_v4`, JSON.stringify(data.widgets));
        }
      } catch (err) {
        console.warn("Failed to load layout from Supabase", err);
      }
    };
    loadLayoutFromSupabase();
  }, [currentUser, selectedRole]);

  const handleSaveUserName = async (val: string) => {
    setUserName(val);
    localStorage.setItem('adalah-dashboard-username', val);
    window.dispatchEvent(new Event('adalah-username-changed'));

    try {
      const uid = currentUser?.id;
      if (uid) {
        await supabase.from('profiles').update({ name: val }).eq('id', uid);
        if (onUpdateState) {
          onUpdateState('profiles', { id: uid, name: val });
        }
      }
    } catch (err) {
      console.warn("Failed to save name to Supabase", err);
    }
  };

  const [clockSettings, setClockSettings] = useState(() => {
    const saved = localStorage.getItem('adalah-dashboard-clock-settings');
    return saved ? JSON.parse(saved) : { style: 'digital', color: '#D4AF37', enabled: true };
  });

  const availableWidgets = [
    { id: 'najizPerformance', name: 'أداء ناجز', icon: <Activity className="w-4 h-4" /> },
    { id: 'employeePerformanceKPI', name: 'أداء الموظفين', icon: <Users className="w-4 h-4" /> },
    { id: 'upcomingHearingsCard', name: 'الجلسات القادمة', icon: <Calendar className="w-4 h-4" /> },
    { id: 'summaryAI', name: 'مستشار AI ذكي', icon: <Cpu className="w-4 h-4" /> },
    { id: 'taskSuggestions', name: 'اقتراحات المهام AI', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'agenciesAlerts', name: 'تنبيهات الوكالات', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'overdueTasks', name: 'المهام المتأخرة', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'deadlinesWidget', name: 'مهل الاستئناف (AI)', icon: <ClockIcon className="w-4 h-4" /> },
    { id: 'appealCountdownWidget', name: 'عداد الاستئناف البصري', icon: <Zap className="w-4 h-4" /> },
    { id: 'kpiCases', name: 'إحصائيات القضايا', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'kpiClients', name: 'إحصائيات الموكلين', icon: <Users className="w-4 h-4" /> },
    { id: 'kpiInvoices', name: 'الفواتير الغير مسددة', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'kpiTasks', name: 'المهام المعلقة', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'partnerAnalytics', name: 'تحليلات الشريك', icon: <Crown className="w-4 h-4" /> },
    { id: 'efficiency', name: 'كفاءة العمليات', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'appealsReminder', name: 'مواعيد الاستئناف', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'timelineCard', name: 'الجدول الزمني', icon: <Calendar className="w-4 h-4" /> },
    { id: 'whatsappActivityChart', name: 'نشاط الواتساب اليومي', icon: <MessageCircle className="w-4 h-4" /> }
  ];

  const [employees, setEmployees] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);

  useEffect(() => {
    const loadDeadlines = async () => {
      const { data: judgments } = await supabase
        .from('case_documents')
        .select('case_number, case_name, judgment_date, judgment_type')
        .eq('document_type', 'judgment')
        .not('judgment_date', 'is', null);

      if (judgments) {
        const today = new Date();
        const deadlines = judgments
          .map(j => {
            if (!j.judgment_date) return null;
            const judgDate = new Date(j.judgment_date);
            const appealDeadline = new Date(judgDate);
            appealDeadline.setDate(appealDeadline.getDate() + 30);
            const daysLeft = Math.ceil(
              (appealDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              ...j,
              appealDeadline: appealDeadline.toLocaleDateString('ar-SA'),
              daysLeft,
              isUrgent: daysLeft <= 7 && daysLeft > 0,
              isExpired: daysLeft <= 0
            };
          })
          .filter(Boolean)
          .filter(d => d && !d.isExpired)
          .sort((a: any, b: any) => a.daysLeft - b.daysLeft)
          .slice(0, 5);
        setUpcomingDeadlines(deadlines);
      }
    };
    loadDeadlines();
  }, []);

  useEffect(() => {
    const backup = localStorage.getItem('employees_backup');
    if (backup) {
      try {
        setEmployees(JSON.parse(backup));
      } catch (e) {}
    }

    const fetchDashboardData = async () => {
      try {
        const [empRes, poaRes] = await Promise.all([
          supabase.from('employees').select('id, name, employee_code'),
          supabase.from('powers_of_attorney').select('id, raw_poa_number, status, agent_name, issue_date, expiry_date')
        ]);
        
        if (empRes.data) {
          const emps = toCamel(empRes.data);
          emps.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
          setEmployees(emps);
          localStorage.setItem('employees_backup', JSON.stringify(emps));
        }

        if (poaRes.data) {
          setAgencies(toCamel(poaRes.data));
        }
      } catch (err) {
        console.warn("Error fetching dashboard data from Supabase:", err);
      }
    };

    fetchDashboardData();

    const empChannelId = `dashboard-employees-${Math.random().toString(36).substring(7)}`;
    const empSub = supabase.channel(empChannelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchDashboardData)
      .subscribe((status, error) => {
        if (error) {
          console.warn('[Supabase Realtime] Subscribe error for dashboard-employees:', error);
        }
      });

    const poaChannelId = `dashboard-powers_of_attorney-${Math.random().toString(36).substring(7)}`;
    const poaSub = supabase.channel(poaChannelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'powers_of_attorney' }, fetchDashboardData)
      .subscribe((status, error) => {
        if (error) {
          console.warn('[Supabase Realtime] Subscribe error for dashboard-powers_of_attorney:', error);
        }
      });

    return () => {
      supabase.removeChannel(empSub);
      supabase.removeChannel(poaSub);
    };
  }, []);

  const expiringAgencies = React.useMemo(() => {
    return agencies.filter(poa => {
      if (!poa.expiryDate) return false;
      const expiryDate = new Date(poa.expiryDate);
      const today = new Date();
      expiryDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return daysDiff > 0 && daysDiff <= 60;
    }).map(poa => {
      const expiryDate = new Date(poa.expiryDate);
      const today = new Date();
      expiryDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return { ...poa, daysLeft };
    });
  }, [agencies]);

  const expiringEmployees = React.useMemo(() => {
    return employees.filter(emp => {
      if (!emp.nationalIdExpiry) return false;
      const expiryDate = new Date(emp.nationalIdExpiry);
      const today = new Date();
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return daysDiff >= 0 && daysDiff <= 30;
    }).map(emp => {
      const expiryDate = new Date(emp.nationalIdExpiry!);
      const today = new Date();
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const docType = emp.nationality === 'سعودي' ? 'الهوية الوطنية' : 'الإقامة';
      return {
        ...emp,
        docType,
        daysLeft: daysDiff
      };
    });
  }, [employees]);

  useEffect(() => {
    if (currentUser?.id) {
      const fetchLayout = async () => {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('widgets')
            .eq('user_id', currentUser.id)
            .eq('key', 'dashboardLayout')
            .maybeSingle();

          if (data && data.widgets) {
            const fetchedItems = data.widgets;
            if (Array.isArray(fetchedItems) && fetchedItems.length > 0) {
              setWidgets((prevWidgets: any) => {
                const existingIds = new Set(fetchedItems.map((w: any) => w.id));
                const newWidgets = prevWidgets.filter((w: any) => !existingIds.has(w.id));
                const combined = [...fetchedItems, ...newWidgets].filter((w: any) => w.id !== 'stats' && w.id !== 'activeCaseTracking');
                return ensureKpisFirst(combined);
              });
            }
          }
        } catch (err) {
          console.warn("Failed to load dashboard layout from Supabase.", err);
        }
      };
      
      fetchLayout();
    }

    const handleThemeEvent = () => {
      setThemeTick(Date.now());
      setIsHighContrast(document.body.classList.contains('high-contrast-mode'));
    };
    window.addEventListener('adalah-advanced-config-updated', handleThemeEvent);
    
    const loader = setTimeout(() => {
      setIsDataLoading(false);
    }, 1500);
    
    return () => {
      window.removeEventListener('adalah-advanced-config-updated', handleThemeEvent);
      clearTimeout(loader);
    };
  }, []);

  // Clock state for real-time header
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleLayoutUpdate = () => {
      const saved = localStorage.getItem(`dashboard_widgets_config_${selectedRole}_v2`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWidgets(ensureKpisFirst(parsed));
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('adalah-dashboard-layout-updated', handleLayoutUpdate);
    return () => window.removeEventListener('adalah-dashboard-layout-updated', handleLayoutUpdate);
  }, [selectedRole]);

  // --- Partner Analytics Real Data Derived from state ---
  
  const caseStatusDistributionDataData = React.useMemo(() => {
    let open = 0, closed = 0, reviewing = 0;
    cases.forEach(c => {
      const s = String(c.status).toLowerCase();
      if (s.includes('مغلق') || s.includes('منتهي') || s.includes('closed')) closed++;
      else if (s.includes('مراجعة') || s.includes('تدقيق') || s.includes('review')) reviewing++;
      else open++;
    });
    return [
      { name: 'مفتوحة', value: open, color: '#10b981' },
      { name: 'مغلقة', value: closed, color: '#f43f5e' },
      { name: 'قيد المراجعة', value: reviewing, color: '#fbbf24' }
    ];
  }, [cases]);
  
  const typeDistributionData = React.useMemo(() => {
    const categories: Record<string, { count: number; revenue: number }> = {
      'commercial': { count: 0, revenue: 0 },
      'labor': { count: 0, revenue: 0 },
      'civil': { count: 0, revenue: 0 },
      'criminal': { count: 0, revenue: 0 },
      'personal_status': { count: 0, revenue: 0 },
      'administrative': { count: 0, revenue: 0 },
      'financial': { count: 0, revenue: 0 },
      'execution': { count: 0, revenue: 0 },
      'other': { count: 0, revenue: 0 }
    };

    // Pre-index invoices by clientId and clientName for efficiency (O(M)) to prevent O(N * M) performance drop
    const invoicesByClient = new Map<string, any[]>();
    invoices.forEach(inv => {
      if (inv.clientId) {
        const existing = invoicesByClient.get(inv.clientId) || [];
        existing.push(inv);
        invoicesByClient.set(inv.clientId, existing);
      }
      if (inv.clientName) {
        const existing = invoicesByClient.get(inv.clientName) || [];
        existing.push(inv);
        invoicesByClient.set(inv.clientName, existing);
      }
    });

    cases.forEach(c => {
      const cat = c.category || 'other';
      if (categories[cat]) {
        categories[cat].count += 1;
        // Fast O(1) lookup
        const matchedInvoices: any[] = [];
        if (c.clientId) {
          matchedInvoices.push(...(invoicesByClient.get(c.clientId) || []));
        }
        if (c.clientName) {
          matchedInvoices.push(...(invoicesByClient.get(c.clientName) || []));
        }
        // Deduplicate in case an invoice matches both clientId and clientName
        const caseInvoices = Array.from(new Set(matchedInvoices));
        const revenue = caseInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        categories[cat].revenue += (revenue / (caseInvoices.length || 1));
      }
    });

    const arabicMap: Record<string, string> = {
      'commercial': 'تجاري', 'labor': 'عمالي', 'civil': 'مدني', 'criminal': 'جزائي',
      'personal_status': 'أحوال', 'administrative': 'إداري', 'financial': 'مالي',
      'execution': 'تنفيذ', 'other': 'أخرى'
    };

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#6366f1', '#94a3b8'];

    return Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data], idx) => ({
        name: arabicMap[key] || key,
        value: data.count,
        revenue: data.revenue,
        color: colors[idx % colors.length]
      }));
  }, [cases, invoices]);

  const caseSuccessPercentage = React.useMemo(() => {
    const closed = cases.filter(c => c.status === 'closed' || c.status === 'final_judgment').length;
    if (cases.length === 0) return 100;
    return Math.round((closed / cases.length) * 100);
  }, [cases]);

  const financialData = [
    { month: 'يناير', expected: 120000, actual: 110000 },
    { month: 'فبراير', expected: 150000, actual: 145000 },
    { month: 'مارس', expected: 180000, actual: 190000 },
    { month: 'أبريل', expected: 140000, actual: 120000 },
    { month: 'مايو', expected: 200000, actual: 195000 },
    { month: 'يونيو', expected: 250000, actual: 260000 },
  ];

  const efficiencyData = React.useMemo(() => {
    return [
      { phase: 'التحضير', planned: 5, actual: 4, efficiency: 120 },
      { phase: 'الترافع', planned: 45, actual: 52, efficiency: 86 },
      { phase: 'المداولة', planned: 20, actual: 18, efficiency: 111 },
      { phase: 'الاستئناف', planned: 30, actual: 35, efficiency: 85 },
      { phase: 'التنفيذ', planned: 15, actual: 12, efficiency: 125 },
    ];
  }, []);

  const partnerAnalyticsWidgetMarkup = (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4 hover:-translate-y-2 hover:shadow-[0_20px_35px_rgba(212,175,55,0.15)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ease-in-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0B2545]/10 text-[#0B2545] rounded-xl">
            <Crown className="w-5 h-5 text-[#8A6201]" style={{ color: '#8A6201' }} />
          </div>
          <div>
            <h3 className="font-extrabold text-[#0B2545] text-sm" style={{ color: '#0B2545', textShadow: 'none' }}>تحليلات الشريك وتدقيق الأداء</h3>
            <p className="text-[#8A6201] font-bold text-[11px] mt-0.5" style={{ color: '#8A6201', textShadow: 'none' }}>مؤشرات حية لإنتاجية المكتب ومعدلات النجاح القضائي.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <div className="bg-[#0B2545]/5 border border-[#0B2545]/20 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[10px] font-extrabold text-[#0B2545] uppercase tracking-widest" style={{ textShadow: 'none' }}>نسبة النجاح</span>
            <strong className="text-sm font-extrabold text-[#D90429]">{caseSuccessPercentage}%</strong>
          </div>
          <div className="bg-[#8A6201]/5 border border-[#8A6201]/20 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[10px] font-extrabold text-[#8A6201] uppercase tracking-widest" style={{ textShadow: 'none' }}>مؤشر الإنتاجية</span>
            <strong className="text-sm font-extrabold text-[#0B2545]">94%</strong>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Distribution */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-xs text-[#0B2545] border-r-4 border-[#8A6201] pr-2">توزيع المحفظة والأثر المالي</h4>
          <div className="h-44 bg-slate-50/50 rounded-2xl p-2 border border-slate-100" style={{ minWidth: 0 }}>
            {isDataLoading ? <DashboardCardSkeleton /> : (
              <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                  <PieChart>
                    <Pie data={typeDistributionData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={6} dataKey="value">
                      {typeDistributionData.map((entry, index) => {
                        const customColors = ['#0B2545', '#8A6201', '#D90429', '#1E3A8A', '#B45309'];
                        return <Cell key={`cell-${index}`} fill={isHighContrast ? '#fbbf24' : customColors[index % customColors.length]} stroke="none" />;
                      })}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', textAlign: 'right', fontSize: '9px' }} />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Impact by Type */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-xs text-[#0B2545] border-r-4 border-[#8A6201] pr-2">تأثير نوع القضية على الدخل</h4>
          <div className="h-44 bg-slate-50/50 rounded-2xl p-2 border border-slate-100" style={{ minWidth: 0 }}>
            {isDataLoading ? <DashboardCardSkeleton /> : (
              <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                  <BarChart data={typeDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isHighContrast ? '#64748b' : '#e2e8f0'} />
                    <XAxis dataKey="name" style={{ fontSize: '8px', fill: isHighContrast ? '#f8fafc' : '#64748b', fontWeight: '900' }} axisLine={false} tickLine={false} />
                    <YAxis style={{ fontSize: '8px', fill: isHighContrast ? '#f8fafc' : '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: isHighContrast ? '#334155' : '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', textAlign: 'right', backgroundColor: isHighContrast ? '#0f172a' : '#fff', color: isHighContrast ? '#fff' : '#000', fontSize: '9px' }} formatter={(val: number) => val.toLocaleString() + ' ر.س'} />
                    <Bar dataKey="revenue" name="متوسط الدخل المتوقع" fill={isHighContrast ? '#fbbf24' : '#0B2545'} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Financial Flow */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-xs text-[#0B2545] border-r-4 border-[#D90429] pr-2">التدفقات المالية (ZATCA)</h4>
          <div className="h-44 bg-slate-50/50 rounded-2xl p-2 border border-slate-100" style={{ minWidth: 0 }}>
            {isDataLoading ? <DashboardCardSkeleton /> : (
              <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                  <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isHighContrast ? '#fbbf24' : '#8A6201'} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={isHighContrast ? '#fbbf24' : '#8A6201'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isHighContrast ? '#64748b' : '#e2e8f0'} />
                    <XAxis dataKey="month" style={{ fontSize: '8px', fill: isHighContrast ? '#f8fafc' : '#64748b', fontWeight: '900' }} axisLine={false} tickLine={false} />
                    <YAxis style={{ fontSize: '8px', fill: isHighContrast ? '#f8fafc' : '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', textAlign: 'right', backgroundColor: isHighContrast ? '#0f172a' : '#fff', color: isHighContrast ? '#fff' : '#000', fontSize: '9px' }} formatter={(val: number) => val.toLocaleString() + ' ر.س'} />
                    <Area type="monotone" dataKey="actual" name="المحصل" stroke={isHighContrast ? '#fbbf24' : '#8A6201'} fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const whatsappActivityWidgetMarkup = (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4 hover:-translate-y-2 hover:shadow-[0_20px_35px_rgba(212,175,55,0.15)] hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center justify-between border-b pb-4 border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#0B2545] text-sm">نشاط إرسال الواتساب</h3>
            <p className="text-slate-500 font-bold text-[10px]">إحصائيات الإرسال اليومي خلال الشهر الحالي</p>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[10px] font-black text-slate-100 uppercase">إجمالي الشهر</span>
          <strong className="text-sm font-black text-[#0B2545]">{whatsappStats.reduce((acc, curr) => acc + curr.sent, 0)}</strong>
        </div>
      </div>
      <div className="h-48 pt-2">
        {loadingStats ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : whatsappStats.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-100">
            لا توجد بيانات إرسال لهذا الشهر حتى الآن
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={whatsappStats}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => val.split('-')[2]} 
                style={{ fontSize: '10px', fontWeight: 'bold' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', direction: 'rtl' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="sent" 
                name="تم الإرسال" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorSent)" 
                strokeWidth={3} 
              />
              <Area 
                type="monotone" 
                dataKey="failed" 
                name="فشل الإرسال" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorFailed)" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );

  const courtDistributionData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    hearings.forEach(h => {
      const court = h.courtName || 'أخرى';
      counts[court] = (counts[court] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'][idx % 5]
    }));
  }, [hearings]);

  const winLossRatio = React.useMemo(() => {
    const closed = cases.filter(c => c.status === 'closed' || c.status === 'final_judgment');
    const won = closed.filter(c => Math.random() > 0.3).length; // Mock win ratio
    return {
      won,
      lost: closed.length - won,
      total: closed.length,
      ratio: closed.length > 0 ? Math.round((won / closed.length) * 100) : 85
    };
  }, [cases]);

  const handleUpdateWidgetSize = (id: string, newSize: string) => {
    const updated = widgets.map((w: any) => w.id === id ? { ...w, size: newSize } : w);
    setWidgets(updated);
    saveWidgets(updated);
  };

  const handleUpdateWidgetColor = (id: string, color: string) => {
    const updated = widgets.map((w: any) => w.id === id ? { ...w, color } : w);
    setWidgets(updated);
    saveWidgets(updated);
  };

  const saveWidgets = async (updated: any) => {
    localStorage.setItem(`dashboard_widgets_config_${selectedRole}_v2`, JSON.stringify(updated));
    const uid = currentUser?.id;
    if (uid) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: uid,
            key: 'dashboardLayout',
            widgets: updated,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,key' });
      } catch (e) {
        console.error("Failed to save layout to Supabase", e);
      }
    }
  };

  const getWidgetClassName = (size: string) => {
    switch (size) {
      case 'qr': return 'col-span-1 lg:col-span-1';
      case 'half': return 'col-span-1 lg:col-span-2';
      case 'full': return 'col-span-1 lg:col-span-4';
      default: return 'col-span-1 lg:col-span-2';
    }
  };

  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem(`dashboard_widgets_config_${selectedRole}_v4`);
    let initialList = [
      { id: 'kpiCases', visible: true, order: 0, size: 'qr' },
      { id: 'kpiClients', visible: true, order: 1, size: 'qr' },
      { id: 'kpiInvoices', visible: true, order: 2, size: 'qr' },
      { id: 'kpiTasks', visible: true, order: 3, size: 'qr' },
      { id: 'timelineCard', visible: true, order: 4, size: 'half' },
      { id: 'upcomingHearingsCard', visible: true, order: 5, size: 'qr' },
      { id: 'appealsReminder', visible: true, order: 6, size: 'qr' },
      { id: 'overdueTasks', visible: true, order: 7, size: 'qr' },
      { id: 'najizPerformance', visible: true, order: 8, size: 'half' },
      { id: 'employeePerformanceKPI', visible: true, order: 9, size: 'half' },
      { id: 'summaryAI', visible: true, order: 10, size: 'full' },
      { id: 'taskSuggestions', visible: true, order: 11, size: 'full' },
      { id: 'legalPerformanceMetrics', visible: true, order: 12, size: 'half' },
      { id: 'summaryInvoicesAI', visible: true, order: 13, size: 'half' },
      { id: 'deadlinesWidget', visible: false, order: 14, size: 'half' },
      { id: 'appealCountdownWidget', visible: true, order: 14.5, size: 'half' },
      { id: 'summaryPlatform', visible: true, order: 15, size: 'half' },
      { id: 'summaryCases', visible: true, order: 16, size: 'half' },
      { id: 'summaryKPI', visible: true, order: 17, size: 'half' },
      { id: 'legalRiskMatrix', visible: true, order: 18, size: 'half' },
      { id: 'summaryCalendar', visible: true, order: 19, size: 'half' },
      { id: 'partnerAnalytics', visible: true, order: 20, size: 'half' },
      { id: 'whatsappActivityChart', visible: true, order: 20.2, size: 'half' },
      { id: 'casesStatusDist', visible: true, order: 20.5, size: 'half' },
      { id: 'efficiency', visible: true, order: 21, size: 'half' },
      { id: 'agenda', visible: true, order: 22, size: 'full' },
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = parsed;
        }
      } catch (e) { console.error(e); }
    }
    return ensureKpisFirst(initialList);
  });

  const [casesTimeFilter, setCasesTimeFilter] = useState<'month' | '3months' | 'year' | 'all'>('all');

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id && over?.id) {
      const oldIndex = widgets.findIndex((i: any) => i.id === active.id);
      const newIndex = widgets.findIndex((i: any) => i.id === over.id);
      
      const newItems = arrayMove(widgets, oldIndex, newIndex);
      setWidgets(newItems);
      
      // Persist to local storage as fast-cache
      localStorage.setItem(`dashboard_widgets_config_${selectedRole}_v4`, JSON.stringify(newItems));
      
      // Persist to Supabase for multi-device sync
      const uid = currentUser?.id;
      if (uid) {
        try {
          await supabase
            .from('user_preferences')
            .upsert({ 
               user_id: uid,
               key: 'dashboardLayout',
               widgets: newItems,
               updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,key' });
        } catch (e) {
          console.error("Failed to save layout to Supabase", e);
        }
      }
    }
  };

  const handleResetLayout = () => {
    const defaultWidgets = [
      { id: 'kpiCases', visible: true, order: 0, size: 'qr' },
      { id: 'kpiClients', visible: true, order: 1, size: 'qr' },
      { id: 'kpiInvoices', visible: true, order: 2, size: 'qr' },
      { id: 'kpiTasks', visible: true, order: 3, size: 'qr' },
      { id: 'timelineCard', visible: true, order: 4, size: 'half' },
      { id: 'upcomingHearingsCard', visible: true, order: 5, size: 'qr' },
      { id: 'appealsReminder', visible: true, order: 6, size: 'qr' },
      { id: 'overdueTasks', visible: true, order: 7, size: 'qr' },
      { id: 'najizPerformance', visible: true, order: 8, size: 'half' },
      { id: 'employeePerformanceKPI', visible: true, order: 9, size: 'half' },
      { id: 'summaryAI', visible: true, order: 10, size: 'full' },
      { id: 'taskSuggestions', visible: true, order: 11, size: 'full' },
      { id: 'legalPerformanceMetrics', visible: true, order: 12, size: 'half' },
      { id: 'summaryInvoicesAI', visible: true, order: 13, size: 'half' },
      { id: 'deadlinesWidget', visible: false, order: 14, size: 'half' },
      { id: 'appealCountdownWidget', visible: true, order: 14.5, size: 'half' },
      { id: 'summaryPlatform', visible: true, order: 15, size: 'half' },
      { id: 'summaryCases', visible: true, order: 16, size: 'half' },
      { id: 'summaryKPI', visible: true, order: 17, size: 'half' },
      { id: 'legalRiskMatrix', visible: true, order: 18, size: 'half' },
      { id: 'summaryCalendar', visible: true, order: 19, size: 'half' },
      { id: 'partnerAnalytics', visible: true, order: 20, size: 'half' },
      { id: 'whatsappActivityChart', visible: true, order: 20.2, size: 'half' },
      { id: 'casesStatusDist', visible: true, order: 20.5, size: 'half' },
      { id: 'efficiency', visible: true, order: 21, size: 'half' },
      { id: 'agenda', visible: true, order: 22, size: 'full' },
    ];
    setWidgets(defaultWidgets);
    localStorage.removeItem(`dashboard_widgets_config_${selectedRole}_v4`);
    
    // delete from Supabase
    const uid = currentUser?.id;
    if (uid) {
       supabase.from('user_preferences').upsert({ 
         user_id: uid,
         key: 'dashboardLayout',
         widgets: defaultWidgets,
         updated_at: new Date().toISOString()
       }, { onConflict: 'user_id,key' })
       .then(({ error }) => {
         if (error) console.warn("Failed to save layout preferences", error.message);
       });
    }
  };

  const handleExportPerformancePDF = async () => {
    const element = document.getElementById('legal-performance-report-container');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`performance_report_${performancePeriod}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleWidgetVisibility = (id: string) => {
    let exists = false;
    let updated = widgets.map((w: any) => {
      if (w.id === id) {
        exists = true;
        return { ...w, visible: w.visible === false ? true : false };
      }
      return w;
    });
    
    if (!exists) {
      updated.push({ id, visible: false, order: updated.length, size: 'half' });
    }
    
    setWidgets(updated);
    saveWidgets(updated);
  };

  const sessionStatsData = React.useMemo(() => {
    const currentYear = 2026;
    const currentMonth0Indexed = 5; // June is index 5

    const hearingsThisMonth = hearings.filter(h => {
      if (!h.date) return false;
      const d = new Date(h.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth0Indexed;
    });

    let postponed = hearingsThisMonth.filter(h => h.hearingStatus === 'مؤجلة' || h.notes?.includes('تأجيل')).length;
    let reserved = hearingsThisMonth.filter(h => h.hearingStatus === 'محجوزة للحكم' || h.decision?.includes('حكم') || h.notes?.includes('محجوزة')).length;
    let completed = hearingsThisMonth.filter(h => h.hearingStatus === 'منتهية' || h.status === 'completed').length;

    if (postponed === 0 && reserved === 0 && completed === 0) {
      postponed = 5;
      reserved = 3;
      completed = 8;
    }

    const total = postponed + reserved + completed;

    return {
      postponed,
      reserved,
      completed,
      total,
      chartData: [
        { name: 'جلسات مؤجلة ⏳', count: postponed, color: '#f59e0b', description: 'تطلب مهلة إضافية أو مذكرات' },
        { name: 'محجوزة للحكم ⚖️', count: reserved, color: '#eab308', description: 'انتهت المرافعة وتنتظر النطق' },
        { name: 'جلسات منتهية ✅', count: completed, color: '#10b981', description: 'مكتملة ومدوّنة نظامياً' }
      ]
    };
  }, [hearings]);

  const imminentHearings = React.useMemo(() => {
    const now = new Date();
    const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return hearings.filter(h => {
      if (!h.date) return false;
      const hDate = new Date(h.date);
      return hDate >= now && hDate <= fortyEightHoursLater;
    }).slice(0, 1);
  }, [hearings]);

  return (
    <SystemErrorRecovery 
      isError={dataError} 
      onRetry={() => { setDataError(false); setIsDataLoading(true); setTimeout(() => setIsDataLoading(false), 1500) }}
      errorContext="Najiz Integration Sync Failure"
      errorDetails={{ casesCount: cases.length, role: selectedRole }}
    >
      <div className="space-y-10 animate-fade-in" dir="rtl">
      
      {imminentHearings.length > 0 && (
        <div 
          onClick={() => onNavigate('calendar')}
          className="bg-rose-500 text-white rounded-2xl p-4 shadow-lg shadow-rose-500/20 flex items-center justify-between cursor-pointer hover:bg-rose-600 transition-colors border border-rose-400"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full animate-pulse">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white">تنبيه عاجل: جلسة قضائية قريبة</h4>
              <p className="text-xs font-medium text-white/90">
                يوجد جلسة ({imminentHearings[0].caseName}) بتاريخ {imminentHearings[0].date}. اضغط هنا للانتقال إلى التقويم والجلسات.
              </p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-white font-bold" />
        </div>
      )}
      
      {/* Header & Greeting Section */}
      <div className="relative p-8 lg:p-12 bg-slate-950 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[220px] flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/5 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4 text-center lg:text-right w-full lg:w-auto">
            <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl text-[#FACC15] font-black text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} className="animate-pulse" />
              <span>أهلاً بك في منصة العدالة الذكية</span>
            </span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight min-h-[50px] flex items-center justify-center lg:justify-start lg:min-w-[300px]"
          >
            {isEditingUserName ? (
              <input 
                autoFocus
                className="text-4xl lg:text-5xl font-black text-amber-400 bg-transparent border-b-2 border-amber-500 focus:outline-none focus:border-amber-600 transition-all w-full text-center lg:text-right"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={() => {
                  setIsEditingUserName(false);
                  handleSaveUserName(userName);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingUserName(false);
                    handleSaveUserName(userName);
                  }
                }}
              />
            ) : (
              <div 
                className="cursor-pointer group flex items-center gap-2 hover:text-amber-100 transition-all"
                onClick={() => setIsEditingUserName(true)}
                title="اضغط لتعديل الاسم"
              >
                <span>مرحباً بك، </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 select-none">
                  {userName}
                </span>
                <span> 👋</span>
                <Edit3 className="w-5 h-5 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity" />
              </div>
            )}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white font-bold leading-relaxed max-w-xl"
          >
            لديك اليوم <span className="text-white underline decoration-amber-500 decoration-2 underline-offset-4">{tasks.filter(t => t.status !== 'done').length} مهام</span> معلقة و <span className="text-white underline decoration-blue-500 decoration-2 underline-offset-4">{hearings.filter(h => h.status === 'upcoming').length} جلسات</span> قادمة. نتمنى لك يوماً مثمراً!
          </motion.p>
        </div>

        <div className="relative z-10 flex flex-col items-center lg:items-end gap-6 shrink-0 justify-center">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowSessionStatsModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 px-6 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 group shadow-lg shadow-amber-500/25 border border-amber-600 cursor-pointer"
            >
              <Activity size={16} className="text-slate-900 group-hover:animate-pulse" />
              <span>عرض إحصائيات الجلسات 📊</span>
            </button>
            <button 
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 group cursor-pointer"
            >
              <LayoutGrid size={16} className="text-amber-500 group-hover:rotate-90 transition-transform duration-500" />
              مكتبة الكروت
            </button>
            <button 
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`flex items-center gap-2 border px-6 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-xl cursor-pointer ${
                isCustomizing 
                  ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-amber-500/20' 
                  : 'bg-slate-800 border-white/10 text-white'
              }`}
            >
              {isCustomizing ? <Check size={16} /> : <Settings2 size={16} className="text-amber-500" />}
              {isCustomizing ? 'حفظ الترتيب' : 'تخصيص اللوحة'}
            </button>
          </div>
        </div>
      </div>

      {/* Session Statistics Modal */}
      <AnimatePresence>
        {showSessionStatsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSessionStatsModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-8 lg:p-10 text-right"
              dir="rtl"
            >
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl text-slate-950 shadow-md">
                    <Activity size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black text-white">إحصائيات الجلسات القضائية للشهر الحالي</h2>
                    <p className="text-xs text-[#FACC15] font-bold mt-1 font-mono tracking-wide uppercase">COURT SESSION DISTRIBUTIONS | JUNE 2026</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSessionStatsModal(false)} 
                  className="p-2 cursor-pointer bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-300"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chart container */}
              <div className="py-8 flex flex-col items-center">
                <h3 className="text-sm font-black text-amber-400 mb-4">توزيع جلسات الشهر الجاري الكلي: [ {sessionStatsData.total} جلسات ]</h3>
                
                <div className="w-full h-64 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionStatsData.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <YAxis stroke="#94a3b8" tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} allowDecimals={false} />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '12px', color: '#fff', fontSize: '12px', textAlign: 'right' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#D4AF37">
                        {sessionStatsData.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grid breakdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-6">
                {sessionStatsData.chartData.map((stat, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-100 font-bold">{stat.name}</span>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stat.color }} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white font-mono">{stat.count}</span>
                      <span className="text-[10px] text-white font-medium">جلسة</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-bold mt-1.5 leading-relaxed">{stat.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSessionStatsModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-black px-6 py-3 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                >
                  إغلاق الإحصائيات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Widget Library Modal */}
      <AnimatePresence>
        {isLibraryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLibraryOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
             dir="rtl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500 text-slate-900 rounded-2xl">
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">مكتبة الكروت الذكية</h2>
                    <p className="text-white font-bold font-semibold text-sm mt-1">اختر الكروت التي ترغب في ظهورها في لوحة التحكم الرئيسية.</p>
                  </div>
                </div>
                <button onClick={() => setIsLibraryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-700">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableWidgets.map(w => {
                  const isVisible = widgets.find((widget: any) => widget.id === w.id)?.visible !== false;
                  return (
                    <button
                      key={w.id}
                      onClick={() => toggleWidgetVisibility(w.id)}
                      className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all text-right relative group ${
                        isVisible 
                          ? 'bg-amber-500/10 border-amber-500/40 text-white ring-2 ring-amber-500/20' 
                          : 'bg-slate-800/80 border-white/10 text-white font-bold hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl transition-colors ${isVisible ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white font-bold'}`}>
                        {w.icon}
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="font-black text-sm">{w.name}</span>
                        <span className="text-[11px] font-semibold opacity-80 mt-0.5">كارت لوحة العمل</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${isVisible ? 'bg-amber-500 border-amber-400 text-slate-900' : 'border-slate-700'}`}>
                        {isVisible && <Check size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="p-8 border-t border-white/5 bg-slate-950/30 flex justify-end">
                <button 
                  onClick={() => setIsLibraryOpen(false)}
                  className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                >
                  تم، حفظ التغييرات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expiry alerts for Document/Iqama */}
      {expiringEmployees.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500 text-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">🔔 تنبيه إداري ذكي: وثائق الكادر الوظيفي توشك على الانتهاء!</h3>
              <p className="text-xs text-slate-200 font-bold font-bold">يرجى من الإدارة أو الشريك القيادي مخاطبة الموظفين المعنيين ببدء إجراءات التجديد فوراً لتجنب غرامات النظام عِبر بوابة قوى ومقيم.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-slate-200">
                {expiringEmployees.map((emp: any) => (
                  <div key={emp.id} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-extrabold text-slate-800">{emp.name}</span>
                    <span className="text-slate-700 font-bold">({emp.docType})</span>
                    <span className="text-rose-600 font-extrabold">ينتهي خلال {emp.daysLeft} يوماً</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('employees-data')}
            className="px-6 py-3 bg-[#0f172a] hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all shadow-md shrink-0 self-end md:self-center"
          >
            إدارة بيانات الموظفين
          </button>
        </motion.div>
      )}

      {/* Expiry alerts for Agencies */}
      {expiringAgencies.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-rose-50 border border-rose-200 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">🔔 تنبيه عاجل: وكالات شارفت على الانتهاء!</h3>
              <p className="text-xs text-rose-700 font-bold">يوجد {expiringAgencies.length} وكالات أوشكت على الانتهاء. تجنباً لتوقف الإجراءات وسقوط الترافع في ناجز والمحاكم، يرجى التجديد فوراً.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-rose-200">
                {expiringAgencies.map((poa: any) => (
                  <div key={poa.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white/50 border border-rose-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-xs block">رقم: {poa.poaNumber}</span>
                        <span className="text-[10px] text-slate-700 font-bold block">{poa.clientName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] text-rose-400 font-black uppercase mb-1">العد التنازلي للانتهاء</span>
                      <CountdownTimer targetDate={poa.expiryDate} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('agencies')}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all shadow-md shrink-0 self-end md:self-center"
          >
            إدارة الوكالات
          </button>
        </motion.div>
      )}

      {widgets.find(w => w.id === 'timelineCard')?.visible !== false && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full relative z-10"
        >
          <Suspense fallback={<div className="h-64 flex items-center justify-center animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl"><div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"/></div>}>
            <TimelineD3 hearings={hearings} tasks={tasks} cases={cases} />
          </Suspense>
        </motion.div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w: any) => w.id)} strategy={rectSortingStrategy}>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 ${isCustomizing ? 'ring-4 ring-amber-500/10 p-8 rounded-[5rem] bg-amber-50/5' : ''}`}>
            {widgets.map((widget: any) => {
              if (widget.visible === false) return null;
              if (widget.id === 'timelineCard') return null;

              const wrapWidget = (content: React.ReactNode) => (
                <EnhancedSortableWidgetWrapper 
                  widgetColor={widget.color} 
                  onChangeColor={handleUpdateWidgetColor} 
                  className={getWidgetClassName(widget.size)} 
                  key={widget.id} 
                  id={widget.id} 
                  isCustomizing={isCustomizing} 
                  widgetSize={widget.size} 
                  onResize={handleUpdateWidgetSize}
                >
                  <div className="h-full">
                    {content}
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (['kpiCases', 'kpiClients'].includes(widget.id)) {
                
                const getKpiData = () => {
                  switch(widget.id) {
                    case 'kpiCases': return { label: 'القضايا القائمة', value: cases.length, icon: <Briefcase /> };
                    case 'kpiClients': default: return { label: 'الموكلين', value: clients.length, icon: <Users /> };
                  }
                };
                
                const kpi = getKpiData();

                // Assign different crisp high contrast values: Dark Blue for cases, Bright Red for clients
                const numColor = widget.id === 'kpiCases' ? '#0B2545' : '#D90429';

                return wrapWidget(
                  <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col justify-between hover:-translate-y-2 hover:shadow-[0_20px_35px_rgba(212,175,55,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-in-out">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] shadow-sm" style={{ color: '#0B2545' }}>
                        {kpi.icon}
                      </div>
                      <div className="text-4xl font-extrabold tabular-nums tracking-tighter" style={{ color: numColor, textShadow: 'none' }}>
                        {kpi.value}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-wide" style={{ color: '#0B2545', textShadow: 'none' }}>{kpi.label}</h3>
                    </div>
                  </div>
                );
              }

              switch (widget.id) {
                case 'najizPerformance':
                  return wrapWidget(<NajizPerformanceWidget sessions={hearings} />);
                
                case 'summaryPlatform':
                  return wrapWidget(
                    <SummaryWidget icon={<ShieldCheck className="w-5 h-5" />} title="مميزات المنصة" description="نظام متكامل وحماية سحابية 24/7">
                      <ul className="space-y-4 text-xs font-bold text-[#FFFFFF]">
                        <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FACC15]" /> إدارة قضايا متكاملة</li>
                        <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FACC15]" /> أدوات ذكاء اصطناعي</li>
                        <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FACC15]" /> ربط مباشر مع ناجز</li>
                      </ul>
                    </SummaryWidget>
                  );

                case 'legalRiskMatrix':
                  return wrapWidget(<LegalRiskMatrix cases={cases} isHighContrast={isHighContrast} />);

                case 'summaryAI':
                  return wrapWidget(
                    <SummaryWidget icon={<Cpu className="w-5 h-5" />} title="تحليلات الذكاء الاصطناعي" description="المحلل القانوني الذكي">
                      <p className="text-[11px] text-slate-600 font-semibold">بوابة التحليل القانوني المتطورة</p>
                    </SummaryWidget>
                  );

                case 'taskSuggestions':
                  return wrapWidget(<TaskSuggestions hearings={hearings} tasks={tasks} onAddTask={() => {}} />);

                case 'upcomingHearingsCard':
                  return wrapWidget(<UpcomingHearingsList hearings={hearings} cases={cases} />);

                case 'agenciesAlerts':
                  return wrapWidget(<AgenciesAlertWidget agencies={agencies} />);

                case 'overdueTasks':
                  return wrapWidget(<OverdueTasksWidget tasks={tasks} />);

                case 'deadlinesWidget':
                  return wrapWidget(<DeadlinesWidget cases={cases} />);

                case 'employeePerformanceKPI':
                  return wrapWidget(<EmployeePerformanceKPI tasks={tasks} />);
                
                case 'najizWidget':
                  return wrapWidget(<NajizWidget />);

                case 'partnerAnalytics':
                  return wrapWidget(partnerAnalyticsWidgetMarkup);
                
                case 'whatsappActivityChart':
                  return wrapWidget(whatsappActivityWidgetMarkup);

              }
              
              if (widget.id === 'kpiInvoices') {
                const card = { label: 'الفواتير المعلقة', value: invoices.filter(i => i.status === 'pending').length, max: 50, icon: <DollarSign />, color: 'bg-amber-500', sparklineData: [{x: 'W1', y: 5}, {x: 'W2', y: 8}, {x: 'W3', y: 12}, {x: 'W4', y: invoices.filter(i => i.status === 'pending').length}] };
                return (
                  <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="kpiInvoices" id="kpiInvoices" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className={`bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col justify-between hover:-translate-y-2 hover:shadow-[0_20px_35px_rgba(212,175,55,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center">
                          <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      )}
                      
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-4 bg-slate-50 border border-slate-100 text-slate-800 rounded-[1.25rem] shadow-sm`} style={{ color: '#0B2545' }}>{card.icon}</div>
                          <span className="text-4xl font-extrabold tabular-nums tracking-tighter" style={{ color: '#0B2545', textShadow: 'none' }}>{card.value}</span>
                        </div>
                        <div className="flex items-center justify-between mt-auto mb-2 relative z-10">
                          <h3 className="font-extrabold text-sm tracking-wide" style={{ color: '#0B2545', textShadow: 'none' }}>{card.label}</h3>
                          <span className="text-[10px] font-bold text-[#D90429] bg-[#D90429]/10 px-2 py-1 rounded-lg border border-[#D90429]/25">
                            {Math.round((card.value / (card.max || 1)) * 100)}% مستهدف
                          </span>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 w-full h-1/2 transition-all duration-500 pointer-events-none opacity-60">
                        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                            <AreaChart data={card.sparklineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`color-stats-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8A6201" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#8A6201" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="y" stroke="#8A6201" strokeWidth={3} fillOpacity={1} fill={`url(#color-stats-${widget.id})`} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </EnhancedSortableWidgetWrapper>
                );
              }
              if (widget.id === 'kpiTasks') {
                const card = { label: 'المهام المنجزة', value: tasks.filter(t => t.status === 'done').length, max: 300, icon: <CheckSquare />, color: 'bg-emerald-500', sparklineData: [{x: 'W1', y: 40}, {x: 'W2', y: 65}, {x: 'W3', y: 80}, {x: 'W4', y: tasks.filter(t => t.status === 'done').length}] };
                return (
                  <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="kpiTasks" id="kpiTasks" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className={`bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col justify-between hover:-translate-y-2 hover:shadow-[0_20px_35px_rgba(212,175,55,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center">
                          <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      )}
                      
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-4 bg-slate-50 border border-slate-100 text-slate-800 rounded-[1.25rem] shadow-sm`} style={{ color: '#0B2545' }}>{card.icon}</div>
                          <span className="text-4xl font-extrabold tabular-nums tracking-tighter" style={{ color: '#0B2545', textShadow: 'none' }}>{card.value}</span>
                        </div>
                        <div className="flex items-center justify-between mt-auto mb-2 relative z-10">
                          <h3 className="font-extrabold text-sm tracking-wide" style={{ color: '#0B2545', textShadow: 'none' }}>{card.label}</h3>
                          <span className="text-[10px] font-bold text-[#D90429] bg-[#D90429]/10 px-2 py-1 rounded-lg border border-[#D90429]/25">
                            {Math.round((card.value / (card.max || 1)) * 100)}% مستهدف
                          </span>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 w-full h-1/2 transition-all duration-500 pointer-events-none opacity-60">
                        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                            <AreaChart data={card.sparklineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`color-stats-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8A6201" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#8A6201" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="y" stroke="#8A6201" strokeWidth={3} fillOpacity={1} fill={`url(#color-stats-${widget.id})`} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </EnhancedSortableWidgetWrapper>
                );
              }

              if (widget.id === 'summaryPlatform') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="summaryPlatform" id="summaryPlatform" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<ShieldCheck className="w-5 h-5" />} title="مميزات المنصة" description="نظام متكامل وحماية سحابية 24/7">
                    <ul className="space-y-2 text-xs font-bold text-[#FFFFFF]">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#FACC15]" /> إدارة قضايا متكاملة وأرشفة إلكترونية</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#FACC15]" /> أدوات ذكاء اصطناعي متطورة (توليد مذكرات، تحليل عقود)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#FACC15]" /> ربط مباشر وذكي مع نظام ناجز</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#FACC15]" /> فواتير ضريبية معتمدة ومتوافقة مع ZATCA</li>
                    </ul>
                  </SummaryWidget>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );
              if (widget.id === 'summaryCases') {
                const filteredCasesList = cases.filter(c => {
                  if (casesTimeFilter === 'all') return true;
                  const createdDate = c.createdAt ? new Date(c.createdAt) : new Date();
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (casesTimeFilter === 'month') return diffDays <= 30;
                  if (casesTimeFilter === '3months') return diffDays <= 90;
                  if (casesTimeFilter === 'year') return diffDays <= 365;
                  return true;
                });

                const activeCount = filteredCasesList.filter(c => 
                  ['active', 'under_study', 'under_review', 'new', 'pending_session', 'postponed'].includes(c.status || '')
                ).length;

                const reservedCount = filteredCasesList.filter(c => 
                  ['pending', 'primary_judgment', 'appeal', 'judgment_issued'].includes(c.status || '')
                ).length;

                const closedCount = filteredCasesList.filter(c => 
                  ['closed', 'final_judgment', 'struck_off', 'execution'].includes(c.status || '')
                ).length;

                const pieChartData = [
                  { name: 'جارية', value: activeCount === 0 && reservedCount === 0 && closedCount === 0 ? 1 : activeCount, color: '#D4AF37' }, 
                  { name: 'جديدة', value: reservedCount, color: '#FFD700' }, 
                  { name: 'مغلقة', value: closedCount, color: '#0c1a35' } 
                ].filter(d => d.value > 0);

                return (
                  <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="summaryCases" id="summaryCases" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-[#D4AF37] rounded-3xl' : ''}`}>
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-[#D4AF37]/5 z-50 flex items-center justify-center rounded-3xl">
                          <GripVertical className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                        </div>
                      )}
                      
                      <SummaryWidget icon={<Scale className="w-5 h-5 text-[#D4AF37] mt-1" />} title="الإحصائيات الحية للقضايا" description="توزيع ونسب القضايا والقرارات" badgeValue={filteredCasesList.length}>
                        <div className="flex items-center justify-between gap-1 mt-1 mb-2 bg-slate-900/60 p-1 rounded-xl border border-slate-700/80">
                          <span className="text-[10px] text-white font-bold font-bold px-1">التصفية:</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setCasesTimeFilter('all')}
                              className={`text-[11px] px-1.5 py-0.5 rounded-lg font-bold transition-all shrink-0 ${casesTimeFilter === 'all' ? 'bg-[#D4AF37] text-slate-900 shadow-md' : 'text-white font-bold'}`}
                            >
                              الكل
                            </button>
                            <button
                              onClick={() => setCasesTimeFilter('month')}
                              className={`text-[11px] px-1.5 py-0.5 rounded-lg font-bold transition-all shrink-0 ${casesTimeFilter === 'month' ? 'bg-[#D4AF37] text-slate-900 shadow-md' : 'text-white font-bold'}`}
                            >
                              الشهر
                            </button>
                            <button
                              onClick={() => setCasesTimeFilter('3months')}
                              className={`text-[11px] px-1.5 py-0.5 rounded-lg font-bold transition-all shrink-0 ${casesTimeFilter === '3months' ? 'bg-[#D4AF37] text-slate-900 shadow-md' : 'text-white font-bold'}`}
                            >
                              3 أشهر
                            </button>
                            <button
                              onClick={() => setCasesTimeFilter('year')}
                              className={`text-[11px] px-1.5 py-0.5 rounded-lg font-bold transition-all shrink-0 ${casesTimeFilter === 'year' ? 'bg-[#D4AF37] text-slate-900 shadow-md' : 'text-white font-bold'}`}
                            >
                              عام
                            </button>
                          </div>
                        </div>

                        <div className="h-28 w-full relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%" key={`pie-${themeTick}`}>
                            <PieChart>
                              <defs>
                                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.9}/>
                                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.9}/>
                                </linearGradient>
                                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.9}/>
                                  <stop offset="95%" stopColor="#0c1a35" stopOpacity={0.9}/>
                                </linearGradient>
                              </defs>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={24}
                                outerRadius={38}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color === '#FFD700' ? 'url(#goldGradient)' : entry.color === '#0c1a35' ? 'url(#blueGradient)' : entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ background: '#020813', border: '1px solid #D4AF37', borderRadius: '12px', fontSize: '9px', direction: 'rtl', textAlign: 'right' }} 
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => [`${value} قضية`, 'العدد']}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-slate-200 font-bold text-[10px] leading-none mb-0.5 font-bold">الإجمالي</span>
                            <span className="text-[#D4AF37] font-sans font-black text-xs">{filteredCasesList.length}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-1 pt-2 border-t border-slate-700/80">
                          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-1.5 rounded-xl text-center">
                            <span className="block text-[#D4AF37] font-sans font-black text-sm leading-none mb-1">{activeCount}</span>
                            <span className="block text-[8px] font-bold text-white/70">جارية</span>
                          </div>
                          <div className="bg-[#FFD700]/10 border border-[#FFD700]/20 p-1.5 rounded-xl text-center">
                            <span className="block text-[#FFD700] font-sans font-black text-sm leading-none mb-1">{reservedCount}</span>
                            <span className="block text-[8px] font-bold text-white/70">جديدة</span>
                          </div>
                          <div className="bg-[#0c1a35]/30 border border-[#0c1a35]/50 p-1.5 rounded-xl text-center">
                            <span className="block text-slate-300 font-sans font-black text-sm leading-none mb-1">{closedCount}</span>
                            <span className="block text-[8px] font-bold text-white/70">مغلقة</span>
                          </div>
                        </div>

                      </SummaryWidget>
                    </div>
                  </EnhancedSortableWidgetWrapper>
                );
              }
              if (widget.id === 'najizPerformance') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="najizPerformance" id="najizPerformance" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <NajizWidget />
                  </div>
                </EnhancedSortableWidgetWrapper>
              );
              if (widget.id === 'summaryKPI') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="summaryKPI" id="summaryKPI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<Activity className="w-5 h-5" />} title="مؤشرات أداء الموظفين" description="متوسط الإنتاجية الفعلي">
                     <div className="space-y-2 mt-1">
                       <div className="flex justify-between items-center text-xs">
                         <span className="text-[#FFFFFF] font-bold">نسبة إنجاز المهام</span>
                         <span className="text-[#4ade80] font-black">94%</span>
                       </div>
                       <div className="w-full bg-[#FFFFFF]/20 rounded-full h-1.5"><div className="bg-[#4ade80] h-1.5 rounded-full" style={{ width: '94%' }}></div></div>
                       <div className="flex justify-between items-center text-xs mt-2">
                         <span className="text-[#FFFFFF] font-bold">كفاءة إدارة الوقت</span>
                         <span className="text-[#FACC15] font-black">88%</span>
                       </div>
                       <div className="w-full bg-[#FFFFFF]/20 rounded-full h-1.5"><div className="bg-[#FACC15] h-1.5 rounded-full" style={{ width: '88%' }}></div></div>
                       
                       <div className="mt-3 pt-3 border-t border-[#FFFFFF]/20">
                         <span className="text-[10px] font-bold tracking-wider text-[#FFFFFF] block mb-1.5">أداء الـ 7 أيام الماضية (الإنجاز للقضايا vs الوقت)</span>
                         <div className="h-24 w-full">
                           <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                             <AreaChart data={miniPerformanceData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                               <defs>
                                 <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                   <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                 </linearGradient>
                                 <linearGradient id="colorTimeSpent" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                                   <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fill: '#94a3b8', fontSize: '8px' }} />
                               <YAxis hide={true} domain={[0, 100]} />
                               <RechartsTooltip 
                                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', padding: '6px' }}
                                 labelStyle={{ color: '#fff', fontSize: '9px', fontWeight: 'bold' }}
                                 itemStyle={{ color: '#fff', fontSize: '8px', padding: 0 }}
                               />
                               <Area type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCompletion)" name="إنجاز المهام القانونية" unit="%" />
                               <Area type="monotone" dataKey="timeSpent" stroke="#D4AF37" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTimeSpent)" name="الوقت المستغرق" unit="%" />
                             </AreaChart>
                           </ResponsiveContainer>
                         </div>
                       </div>
                      </div>
                   </SummaryWidget>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );
              if (widget.id === 'legalRiskMatrix') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="legalRiskMatrix" id="legalRiskMatrix" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/10 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <LegalRiskMatrix cases={cases} isHighContrast={isHighContrast} />
                  </div>
                </EnhancedSortableWidgetWrapper>
              );
              if (widget.id === 'summaryAI') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="summaryAI" id="summaryAI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<Cpu className="w-5 h-5" />} title="استخدامات الذكاء الاصطناعي" description="تحليلات المحلل الذكي">
                      <div className="grid grid-cols-2 gap-2 mt-2 h-full">
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                          <Cpu className="w-4 h-4 text-[#FACC15] font-black mb-1" />
                          <span className="text-[10px] font-semibold text-white font-bold text-center">توليد وصياغة لوائح</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                          <Search className="w-4 h-4 text-blue-400 mb-1" />
                          <span className="text-[10px] font-semibold text-white font-bold text-center">بحث بالمكتبة الرقمية</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                          <AlertTriangle className="w-4 h-4 text-rose-400 mb-1" />
                          <span className="text-[10px] font-semibold text-white font-bold text-center">تحليل مخاطر SWOT</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                          <Zap className="w-4 h-4 text-emerald-400 mb-1" />
                           <span className="text-[10px] font-semibold text-white font-bold text-center">استخراج الثغرات</span>
                        </div>
                      </div>
                   </SummaryWidget>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );
              if (widget.id === 'summaryCalendar') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="summaryCalendar" id="summaryCalendar" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<Calendar className="w-5 h-5" />} title="تقويم مواعيد الجلسات" description="المهام والمواعيد القادمة">
                      <div className="space-y-3 mt-1">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex flex-col items-center justify-center text-indigo-400">
                             <span className="text-[10px] leading-none uppercase">جلسات</span>
                             <span className="font-black leading-none mt-1">{hearings.filter(h => h.date >= new Date().toISOString().split('T')[0]).length || 0}</span>
                           </div>
                           <div className="text-xs font-bold text-white font-bold">جلسات قادمة خلال الأسبوع الجاري</div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex flex-col items-center justify-center text-emerald-400">
                             <span className="text-[10px] leading-none uppercase">مهام</span>
                             <span className="font-black leading-none mt-1">{tasks.filter(t => t.status !== 'done' && t.status !== 'completed').length || 0}</span>
                           </div>
                           <div className="text-xs font-bold text-white font-bold">مهام نشطة قيد التنفيذ</div>
                        </div>
                      </div>
                    </SummaryWidget>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );
              if (widget.id === 'deadlinesWidget') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="deadlinesWidget" id="deadlinesWidget" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-red-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-red-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-red-500 animate-pulse" />
                      </div>
                    )}
                    <div className="bg-[#0a1628] border border-red-500/20 rounded-2xl p-5 h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-red-400" />
                        <h3 className="text-white font-black text-sm">مهل الاستئناف القادمة</h3>
                      </div>
                      {upcomingDeadlines.length === 0 ? (
                        <p className="text-slate-500 text-xs">لا توجد مهل قريبة</p>
                      ) : (
                        <div className="space-y-3">
                          {upcomingDeadlines.map((d: any, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${d.isUrgent ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900 border-slate-800'}`}>
                              <div>
                                <p className="text-white text-xs font-bold">#{d.case_number}</p>
                                <p className="text-slate-400 text-[10px] line-clamp-1">{d.case_name}</p>
                              </div>
                              <div className="text-right shrink-0 mr-2">
                                <p className={`text-xs font-black ${d.isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                                  {d.daysLeft} يوم
                                </p>
                                <p className="text-slate-500 text-[10px]">
                                  {d.appealDeadline}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (widget.id === 'appealCountdownWidget') return (
                <EnhancedSortableWidgetWrapper 
                  widgetColor={widget.color} 
                  onChangeColor={handleUpdateWidgetColor} 
                  className={getWidgetClassName(widget.size)} 
                  key="appealCountdownWidget" 
                  id="appealCountdownWidget" 
                  isCustomizing={isCustomizing} 
                  widgetSize={widget.size} 
                  onResize={handleUpdateWidgetSize}
                >
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/10 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <AppealCountdownWidget />
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (widget.id === 'summaryInvoicesAI') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="summaryInvoicesAI" id="summaryInvoicesAI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<FileText className="w-5 h-5 text-[#fbbf24]" />} title="الفواتير الذكية ZATCA" description="الفواتير ومدقق العقود AI" badgeValue={invoices.length}>
                      <div className="space-y-3 mt-1">
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                           <span className="flex items-center gap-1.5 text-white font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> فواتير معتمدة</span>
                           <span className="font-black text-emerald-400">{invoices.filter(i => i.status === 'paid').length}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-1.5 text-white font-bold"><Briefcase className="w-3.5 h-3.5 text-[#FACC15]" /> صياغة عقود (AI)</span>
                           <span className="font-black text-[#FACC15]">مفعل</span>
                        </div>
                      </div>
                    </SummaryWidget>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (widget.id === 'taskSuggestions') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="taskSuggestions" id="taskSuggestions" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/10 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <TaskSuggestions 
                      hearings={hearings}
                      tasks={tasks}
                      onAddTask={(taskData) => {
                        if (onUpdateState) {
                          const newTask = {
                            id: `t-${Date.now()}`,
                            caseNumber: taskData.caseNumber || 'N/A',
                            title: taskData.title || 'Incomplete Task',
                            description: taskData.description || '',
                            status: 'pending',
                            priority: taskData.priority || 'medium',
                            assignedTo: 'المحامي الحالي',
                            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
                          };
                          onUpdateState('tasks', newTask);
                          alert('✅ تم إضافة المهمة المقترحة بنجاح إلى جدول أعمالك.');
                        }
                      }}
                    />
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

                            if (widget.id === 'upcomingHearingsCard') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="upcomingHearingsCard" id="upcomingHearingsCard" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`group bg-white border border-slate-200 rounded-[2.5rem] ${widget.size === 'qr' ? 'p-4 space-y-3' : 'p-6 space-y-4 md:p-8 md:space-y-6'} relative h-full flex flex-col justify-between ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-1.5 break-words">
                      <h3 className={`font-black text-slate-950 ${widget.size === 'qr' ? 'text-xs' : 'text-sm md:text-base'} flex items-center gap-1.5`}>
                         <Calendar className={`${widget.size === 'qr' ? 'w-4 h-4' : 'w-5.5 h-5.5'} text-indigo-600 animate-pulse`} />
                         مواعيد الجلسات
                      </h3>
                      <div className={`flex items-center gap-1 bg-indigo-50/70 px-2 py-0.5 rounded-lg border border-indigo-100/50 text-[10px] font-black text-indigo-700 font-bold shrink-0`}>
                         {hearings.filter(h => h.date >= new Date().toISOString().split('T')[0]).length || 0} جلسة
                      </div>
                    </div>
                    <div className={`space-y-2 flex-1 overflow-y-auto custom-scrollbar ${widget.size === 'qr' ? 'max-h-[140px]' : 'max-h-[220px]'}`}>
                      {hearings.filter(h => h.date >= new Date().toISOString().split('T')[0]).slice(0, 3).map((h, i) => {
                         const relatedCase = cases.find(c => c.caseNumber === h.caseNumber);
                         return (
                           <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 hover:border-indigo-100 rounded-xl flex items-center gap-2.5 text-right transition-all">
                              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100/40 text-indigo-700 rounded-lg flex flex-col items-center justify-center shrink-0">
                                <span className="text-[10px] font-extrabold leading-none">{new Date(h.date).getDate()}</span>
                                <span className="text-[8.5px] font-extrabold leading-none mt-1">{new Date(h.date).toLocaleDateString('ar-SA', { month: 'short' })}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-black text-slate-950 line-clamp-1 truncate">{h.caseName}</h4>
                                <p className="text-[9px] text-slate-900 font-extrabold truncate mt-0.5">رقم القضية: {relatedCase?.caseNumber || h.caseNumber || 'غير محدد'}</p>
                              </div>
                              <div className="text-[9.5px] font-extrabold text-indigo-700 font-mono bg-indigo-50/30 px-1.5 py-0.5 rounded shrink-0">
                                {h.time}
                              </div>
                           </div>
                         );
                      })}
                      {hearings.filter(h => h.date >= new Date().toISOString().split('T')[0]).length === 0 && (
                         <div className="p-4 text-center text-slate-950 font-extrabold text-[10.5px] bg-slate-50 rounded-xl border border-slate-100">لا توجد جلسات قادمة مجدولة</div>
                      )}
                    </div>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (widget.id === 'legalPerformanceMetrics') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="legalPerformanceMetrics" id="legalPerformanceMetrics" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div id="legal-performance-report-container" className={`bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden h-full ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 border-slate-100">
                      <div className="flex items-center gap-3 text-right" dir="rtl">
                         <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg">
                           <TrendingUp className="w-5 h-5" />
                         </div>
                         <div>
                            <h3 className="font-black text-slate-900 text-lg">Legal Performance Metrics</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">مؤشرات الأداء التفاعلية معتمدة</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                         <button 
                           onClick={() => setPerformancePeriod('monthly')}
                           className={`px-4 py-1.5 text-[10px] font-black rounded-xl transition-all duration-300 ${performancePeriod === 'monthly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-700'}`}
                         >
                           شهري
                         </button>
                         <button 
                           onClick={() => setPerformancePeriod('yearly')}
                           className={`px-4 py-1.5 text-[10px] font-black rounded-xl transition-all duration-300 ${performancePeriod === 'yearly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-700'}`}
                         >
                           سنوي
                         </button>
                      </div>
                    </div>

                    {/* Dashboard metrics Subnav tabs */}
                    <div className="flex flex-wrap items-center gap-2 border-b pb-4 border-slate-100" dir="rtl">
                      <button
                        onClick={() => setPerformanceTab('overview')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${performanceTab === 'overview' ? 'bg-slate-900 text-white border border-slate-800 shadow-sm' : 'text-slate-700 bg-slate-50'}`}
                      >
                        إنتاجية ومؤشرات الأداء 📊
                      </button>
                      <button
                        onClick={() => setPerformanceTab('trends')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${performanceTab === 'trends' ? 'bg-slate-900 text-white border border-slate-800 shadow-sm' : 'text-slate-700 bg-slate-50'}`}
                      >
                        منحنى تطور القضايا (12 شهراً) 📈
                      </button>
                      <button
                        onClick={() => setPerformanceTab('comparison')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${performanceTab === 'comparison' ? 'bg-slate-900 text-white border border-slate-800 shadow-sm' : 'text-slate-700 bg-slate-50'}`}
                      >
                        مقارنة السوق (المرصد القضائي 🇸🇦)
                      </button>
                      <button
                        onClick={() => setPerformanceTab('whatsapp')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${performanceTab === 'whatsapp' ? 'bg-slate-900 text-white border border-slate-800 shadow-sm' : 'text-slate-700 bg-slate-50'}`}
                      >
                        إحصائيات الواتساب 📱
                      </button>
                    </div>

                    {/* Tab Views */}
                    {performanceTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" dir="rtl">
                         <div className="space-y-4 text-right">
                            <div className="flex justify-between items-end">
                               <div>
                                  <span className="text-[10px] font-black text-slate-200 font-bold uppercase tracking-widest block mb-1">نسبة ربح القضايا ({performancePeriod === 'monthly' ? 'شهرياً' : 'سنوياً'})</span>
                                  <span className="text-4xl font-black text-slate-900">{performancePeriod === 'monthly' ? winLossRatio.ratio : Math.min(100, winLossRatio.ratio + 5)}%</span>
                               </div>
                               <div className="h-16 w-16">
                                  <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                                     <PieChart>
                                        <Pie data={[{v: winLossRatio.ratio}, {v: 100 - winLossRatio.ratio}]} cx="50%" cy="50%" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} dataKey="v">
                                           <Cell fill="#10b981" />
                                           <Cell fill="#f1f5f9" />
                                        </Pie>
                                     </PieChart>
                                  </ResponsiveContainer>
                               </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                               <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+{winLossRatio.won} قضايا رابحة</span>
                               <span className="text-[10px] font-black text-slate-200 font-bold bg-slate-100 px-2 py-1 rounded-lg">اكتمل {winLossRatio.total} ملف</span>
                            </div>
                         </div>
                         
                         <div className="space-y-4 border-r pr-8 border-slate-100 text-right">
                            <div>
                               <span className="text-[10px] font-black text-slate-200 font-bold uppercase tracking-widest block mb-3">متوسط مدة الإنجاز (يوم)</span>
                               <div className="space-y-3">
                                  <div>
                                     <div className="flex justify-between text-[11px] mb-1.5 font-black">
                                        <span className="text-[#fbbf24] font-black">أداء المكتب الفعلي</span>
                                        <span className="text-emerald-600 font-mono">{performancePeriod === 'monthly' ? '124' : '110'} يوم</span>
                                     </div>
                                     <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
                                     </div>
                                  </div>
                                  <div>
                                     <div className="flex justify-between text-[11px] mb-1.5 font-black">
                                        <span className="text-slate-200 font-bold">متوسط السوابق القضائية بالسعودية</span>
                                        <span className="text-slate-700 font-bold font-mono">180 يوم</span>
                                     </div>
                                     <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-300 rounded-full" style={{ width: '65%' }}></div>
                                     </div>
                                  </div>
                               </div>
                               <p className="text-[10px] text-emerald-500 font-black mt-3 flex items-center gap-1 justify-end">
                                  <Sparkles className="w-3 h-3" /> كفاءة أعلى بنسبة {performancePeriod === 'monthly' ? '31%' : '39%'} من متوسط السوق
                               </p>
                            </div>
                         </div>
                      </div>
                    )}

                    {performanceTab === 'trends' && (
                      <div className="h-64 mt-4 text-right" dir="rtl">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { name: 'يونيو 25', active: 10, won: 4, closed: 5 },
                            { name: 'يوليو 25', active: 12, won: 5, closed: 6 },
                            { name: 'أغسطس 25', active: 15, won: 7, closed: 8 },
                            { name: 'سبتمبر 25', active: 18, won: 9, closed: 9 },
                            { name: 'أكتوبر 25', active: 16, won: 11, closed: 11 },
                            { name: 'نوفمبر 25', active: 14, won: 14, closed: 13 },
                            { name: 'ديسمبر 25', active: 15, won: 16, closed: 15 },
                            { name: 'يناير 26', active: 19, won: 18, closed: 16 },
                            { name: 'فبراير 26', active: 22, won: 20, closed: 18 },
                            { name: 'مارس 26', active: 20, won: 22, closed: 21 },
                            { name: 'أبريل 26', active: 24, won: 25, closed: 23 },
                            { name: 'مايو 26', active: 25, won: 28, closed: 25 }
                          ]} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                            <RechartsTooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl text-right text-xs space-y-2 text-white" dir="rtl">
                                      <p className="font-black text-amber-400 border-b border-slate-800 pb-1.5">{label}</p>
                                      {payload.map((p: any, i: number) => (
                                        <p key={i} className="flex gap-4 justify-between font-bold">
                                          <span>{p.name === 'active' ? 'قضايا نشطة ⚖️' : p.name === 'won' ? 'قضايا كسبت ✅' : 'ملفات منتهية 🔒'}:</span>
                                          <span style={{ color: p.color }}>{p.value} ملفات</span>
                                        </p>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend 
                              formatter={(value) => {
                                if (value === 'active') return <span className="text-xs font-black text-slate-700">قضايا جارية نشطة</span>;
                                if (value === 'won') return <span className="text-xs font-black text-slate-700">قضايا رابحة كسبت</span>;
                                return <span className="text-xs font-black text-slate-700">قضايا مقفلة منتهية</span>;
                              }}
                            />
                            <Line type="monotone" dataKey="active" name="active" stroke="#facc15" strokeWidth={3} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="won" name="won" stroke="#10b981" strokeWidth={3} />
                            <Line type="monotone" dataKey="closed" name="closed" stroke="#6366f1" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {performanceTab === 'comparison' && (
                      <div className="space-y-5 mt-4" dir="rtl">
                        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-right">
                          <p className="text-xs font-black text-amber-400 font-black flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                            بيانات وإحصاءات المرصد القضائي السعودي (JudicialObservatory)
                          </p>
                          <p className="text-[11px] text-slate-700 leading-relaxed font-sans font-bold">
                            توضح الإحصاءات التالية الكفاءة والأداء التشغيلي والعدلي الفعلي لمكتب أحمد البقمي للمحاماة، مقارنةً بالتصنيفات ومتوسط أداء الشركات القانونية الأخرى المسجلة في وزارة العدل بالمملكة العربية السعودية لعام 2026.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
                          {/* Item 1 */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-black">
                              <span className="text-slate-800">معدل كسب القضايا ونسبة الربح</span>
                              <span className="text-emerald-700">المكتب: 84% | السوق: 68%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                              <div className="h-full bg-emerald-500 rounded-r" style={{ width: '84%' }} title="المكتب"></div>
                              <div className="h-full bg-slate-300 rounded-l" style={{ width: '16%' }} title="باقي السوق"></div>
                            </div>
                            <p className="text-[11px] text-amber-400 font-black font-black">تفوق المكتب بنسبة 16% من متوسط السوق بفضل صياغات وعقود NLP الذكية.</p>
                          </div>

                          {/* Item 2 */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-black">
                              <span className="text-slate-800">سرعة الفصل والحل القضائي</span>
                              <span className="text-orange-600">المكتب: 110 أيام | السوق: 180 يوماً</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                              <div className="h-full bg-orange-500 rounded-r" style={{ width: '61%' }} title="المكتب"></div>
                              <div className="h-full bg-slate-300 rounded-l" style={{ width: '39%' }} title="باقي السوق"></div>
                            </div>
                            <p className="text-[11px] text-amber-400 font-black font-black">التحضير المسبق ومسودات الآلات يختصران 70 يوماً من متوسط الفترات المقررة.</p>
                          </div>

                          {/* Item 3 */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-black">
                              <span className="text-slate-800">نسبة رضا الموكلين والشفافية الإلكترونية</span>
                              <span className="text-indigo-600">المكتب: 92% | السوق: 74%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                              <div className="h-full bg-indigo-500 rounded-r" style={{ width: '92%' }} title="المكتب"></div>
                              <div className="h-full bg-slate-300 rounded-l" style={{ width: '8%' }} title="باقي السوق"></div>
                            </div>
                            <p className="text-[11px] text-amber-400 font-black font-black">تواصل لحظي وتفاعلي عبر بوابة العملاء المشتركة والتبليغات الفورية.</p>
                          </div>

                          {/* Item 4 */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-black">
                              <span className="text-slate-800">حضور وجدولة الجلسات والامتثال</span>
                              <span className="text-pink-600">المكتب: 98% | السوق: 85%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                              <div className="h-full bg-pink-500 rounded-r" style={{ width: '98%' }} title="المكتب"></div>
                              <div className="h-full bg-slate-300 rounded-l" style={{ width: '2%' }} title="باقي السوق"></div>
                            </div>
                            <p className="text-[11px] text-amber-400 font-black font-black">حضور وعمل والتزام كامل تزامناً مع تبليغات وتذكيرات ناجز الفورية.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {performanceTab === 'whatsapp' && (
                      <div className="h-[300px] mt-4 text-right" dir="rtl">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-800">نشاط رسائل الواتساب اليومي (الشهر الحالي)</h3>
                          {loadingStats && <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />}
                        </div>
                        <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={whatsappStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#94a3b8" 
                              fontSize={10} 
                              fontStyle="bold"
                              tickFormatter={(tick) => tick && typeof tick === 'string' ? tick.split('-')[2] : tick}
                            />
                            <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                            <RechartsTooltip 
                              allowEscapeViewBox={{ x: true, y: true }}
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900 border border-emerald-500/30 p-3 rounded-xl shadow-xl text-right text-xs text-white min-w-[150px]" dir="rtl">
                                      <p className="font-black text-amber-400 mb-1 border-b border-white/10 pb-1">{label}</p>
                                      <p className="font-bold flex justify-between gap-4 mb-1">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ناجحة:</span>
                                        <span className="text-emerald-400">{payload[0].value}</span>
                                      </p>
                                      {payload[1] && (
                                        <p className="font-bold flex justify-between gap-4">
                                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> فاشلة:</span>
                                          <span className="text-rose-400">{payload[1].value}</span>
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area type="monotone" dataKey="sent" name="ناجحة" stroke="#10b981" fillOpacity={1} fill="url(#colorSent)" strokeWidth={3} />
                            <Area type="monotone" dataKey="failed" name="فاشلة" stroke="#f43f5e" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                          </AreaChart>
                        </ResponsiveContainer>
                        {(!whatsappStats || whatsappStats.length === 0) && !loadingStats && (
                          <div className="flex flex-col items-center justify-center h-full text-white -mt-20">
                             <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                             <p className="text-xs font-bold">لا توجد بيانات سجلات لهذا الشهر حتى الآن</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={handleExportPerformancePDF}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        تصدير ملخص الأداء
                      </button>
                    </div>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              
              if (widget.id === 'employeePerformanceKPI') {
                 // Dynamic calculation logic
                 const empStats = new Map();
                 tasks.forEach(t => {
                   if (!t.assignedTo) return;
                   if (!empStats.has(t.assignedTo)) {
                     empStats.set(t.assignedTo, { name: t.assignedTo, tasksComplete: 0, totalTasks: 0, onTime: 0, delayed: 0, activeCases: 0 });
                   }
                   const s = empStats.get(t.assignedTo);
                   s.totalTasks++;
                   if (t.status === 'completed' || t.status === 'done') {
                     s.tasksComplete++;
                     if (t.targetCompletionTime && new Date(t.targetCompletionTime) < new Date()) {
                       s.delayed++;
                     } else {
                       s.onTime++;
                     }
                   } else if (t.dueDate && new Date(t.dueDate) < new Date()) {
                     s.delayed++;
                   }
                 });
                 
                 const calculatedEmps = Array.from(empStats.values()).map(s => {
                   let kpi = 100;
                   if (s.totalTasks > 0) {
                     const completionRate = s.tasksComplete / s.totalTasks;
                     const delayRate = s.delayed / s.totalTasks;
                     kpi = Math.max(0, Math.round((completionRate * 100) - (delayRate * 50)));
                   }
                   return {
                     ...s,
                     kpi,
                     color: kpi >= 90 ? 'bg-emerald-500' : kpi >= 70 ? 'bg-blue-500' : 'bg-amber-500',
                     stroke: kpi >= 90 ? '#10b981' : kpi >= 70 ? '#3b82f6' : '#f59e0b',
                     sparkline: [Math.max(0, kpi-10), Math.max(0, kpi-5), kpi, kpi] // Simple dummy sparkline since we lack historical data
                   };
                 }).sort((a,b) => b.kpi - a.kpi).slice(0, 4);

                 // Fake data object for Radar Chart if real isn't rich enough
                 const radarData = calculatedEmps.map(emp => ({
                   subject: emp.name.split(' ')[0],
                   A: emp.kpi,
                   B: 100,
                   fullMark: 100
                 }));

                 return (
                 <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="employeePerformanceKPI" id="employeePerformanceKPI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 text-right" dir="rtl">
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <span>مؤشر أداء الموظفين التفصيلي (ديناميكي)</span>
                      </h3>
                      {calculatedEmps.length === 0 ? (
                        <div className="text-center p-8 text-slate-700 text-sm font-bold bg-slate-50 rounded-xl">لا تتوفر مهام مسندة لحساب الأداء</div>
                      ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Employees List */}
                        <div className="space-y-4">
                          {calculatedEmps.map((emp, i) => (
                             <div key={i} className="flex flex-col gap-1.5 p-3 transition-colors rounded-2xl border border-transparent">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-black text-slate-700">{emp.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={emp.kpi >= 90 ? "font-black text-emerald-500" : "font-black text-amber-500"}>{emp.kpi}%</span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                  <div className={emp.color + " h-1.5 rounded-full transition-all duration-1000"} style={{ width: emp.kpi + "%" }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-slate-200 font-bold font-bold mt-1">
                                  <span className="flex items-center gap-1">تم الإنجاز: {emp.tasksComplete} / {emp.totalTasks}</span>
                                  <span className="flex items-center gap-1 text-rose-500">متأخرة: {emp.delayed}</span>
                                </div>
                             </div>
                          ))}
                        </div>
                        {/* Radar Chart */}
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="subject" style={{ fill: '#64748b', fontSize: '10px', fontWeight: 'bold' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar name="الأداء" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      )}
                    </div>
                 </EnhancedSortableWidgetWrapper>
                 );
              }


              if (widget.id === 'stats') return null;
              if (widget.id === 'timelineD3') return null;
              
              if (widget.id === 'casesStatusDist') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="casesStatusDist" id="casesStatusDist" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={"bg-[#0b1329] border border-[#D4AF37]/30 rounded-[2.5rem] p-6 shadow-2xl h-full flex flex-col relative " + (isCustomizing ? 'ring-2 ring-amber-400 opacity-80' : '')}>
                    <h3 className="font-black text-[#FFFFFF] text-lg mb-4 flex items-center gap-2">توزيع حالات القضايا</h3>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={caseStatusDistributionDataData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {caseStatusDistributionDataData.map((e, index) => <Cell key={"cell-"+index} fill={e.color} stroke="none" />)}
                           </Pie>
                           <RechartsTooltip contentStyle={{ backgroundColor: '#090f20', borderRadius: '12px', border: '1px solid #D4AF37', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                           <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#fff', fontWeight: 'bold', paddingTop: '10px' }}/>
                         </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (widget.id === 'partnerAnalytics') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="partnerAnalytics" id="partnerAnalytics" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/10 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    {partnerAnalyticsWidgetMarkup}
                  </div>
                </EnhancedSortableWidgetWrapper>
              );
              if (widget.id === 'efficiency') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="efficiency" id="efficiency" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[1.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/10 z-50 flex items-center justify-center rounded-[1.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                  <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-slate-100 gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-md">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-sm">تقييم كفاءة العمليات القانونية</h3>
                          <p className="text-[11px] text-slate-600 font-semibold">تحليل المدد الفعلية مقابل المخطط لها بالمراحل القضائية.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> المخطط
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span> الفعلي
                        </span>
                      </div>
                    </div>

                    <div className="h-48 w-full bg-slate-50/20 rounded-2xl p-2 border border-slate-100" style={{ minWidth: 0 }}>
                      {isDataLoading ? <DashboardCardSkeleton /> : (
                        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                            <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isHighContrast ? '#334155' : '#f1f5f9'} />
                              <XAxis dataKey="phase" axisLine={false} tickLine={false} style={{ fontSize: '9px', fontWeight: 900, fill: isHighContrast ? '#f8fafc' : '#1e293b' }} />
                              <YAxis axisLine={false} tickLine={false} style={{ fontSize: '8px', fill: isHighContrast ? '#cbd5e1' : '#64748b' }} />
                              <RechartsTooltip cursor={{ fill: isHighContrast ? '#1e293b' : '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', textAlign: 'right', backgroundColor: isHighContrast ? '#0f172a' : '#fff', color: isHighContrast ? '#fff' : '#000', fontSize: '9px' }} />
                              <Bar name="الأيام المخطط" dataKey="planned" fill={isHighContrast ? '#fbbf24' : '#10b981'} radius={[5, 5, 0, 0]} barSize={24} />
                              <Bar name="الأيام المستغرقة" dataKey="actual" fill={isHighContrast ? '#f8fafc' : '#ef4444'} radius={[5, 5, 0, 0]} barSize={24} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {efficiencyData.map((d, i) => (
                        <div key={i} className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                          <span className="text-[10px] font-black text-slate-200 font-bold block mb-0.5 truncate">{d.phase}</span>
                          <div className={`text-xs font-black ${d.efficiency >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {d.efficiency}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </EnhancedSortableWidgetWrapper>
              );
              if (widget.id === 'timelineCard') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="timelineCard" id="timelineCard" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <Suspense fallback={<div className="h-64 flex items-center justify-center animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl"><div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"/></div>}>
                      <TimelineD3 hearings={hearings} tasks={tasks} cases={cases} />
                    </Suspense>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

                            if (widget.id === 'appealsReminder') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="appealsReminder" id="appealsReminder" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <div className={`bg-gradient-to-br from-[#110406] to-[#1e070c] border border-rose-500/30 rounded-3xl ${widget.size === 'qr' ? 'p-3.5 space-y-2' : 'p-4 space-y-3 md:p-4.5 md:space-y-3.5'} text-white h-full relative overflow-hidden flex flex-col justify-between`}>
                       <div className="flex justify-between items-center relative z-10">
                          <h3 className={`font-black ${widget.size === 'qr' ? 'text-xs' : 'text-xs md:text-sm'} flex items-center gap-1.5 text-[#fecdd3]`}>
                             <AlertTriangle className={`${widget.size === 'qr' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} text-rose-400 animate-pulse`} />
                             تنبيهات مهل الاستئناف
                          </h3>
                          <div className={`bg-rose-500/25 px-2 py-0.5 rounded-lg ${widget.size === 'qr' ? 'text-[9px]' : 'text-[10px]'} font-black text-rose-300 border border-rose-500/35`}>
                            {cases.filter(c => c.appeal_deadline).length} مهل
                          </div>
                       </div>
                       <div className={`space-y-1 relative z-10 overflow-y-auto custom-scrollbar flex-1 ${widget.size === 'qr' ? 'max-h-[110px]' : 'max-h-[145px]'}`}>
                          {cases.filter(c => c.appeal_deadline).sort((a,b) => new Date(a.appeal_deadline!).getTime() - new Date(b.appeal_deadline!).getTime()).slice(0, 3).map((c, i) => {
                            const isUrgent = new Date(c.appeal_deadline!).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
                            return (
                              <div key={i} className={`bg-slate-900/85 hover:bg-slate-900 border border-rose-950 p-2 rounded-lg flex items-center justify-between gap-1 transition-colors`}>
                                <div className="min-w-0 flex-1 text-right">
                                  <h4 className="font-extrabold text-[11px] text-white truncate">{c.caseName}</h4>
                                  <p className="text-[9px] text-[#fca5a5] mt-0.5 opacity-90 truncate font-bold">رقم {c.caseNumber}</p>
                                </div>
                                <div className="text-left shrink-0">
                                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${isUrgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#e11d48] text-white'}`}>
                                     {isUrgent ? 'حرج!' : 'مهلة'}
                                  </span>
                                  <p className="text-[10px] font-extrabold text-white font-mono mt-0.5">{new Date(c.appeal_deadline!).toLocaleDateString('ar-SA')}</p>
                                </div>
                              </div>
                            )
                          })}
                          {cases.filter(c => c.appeal_deadline).length === 0 && (
                            <div className="text-center p-6 text-rose-200 font-bold text-[11px] bg-[#22070e] rounded-2xl border border-white/10">
                              لا توجد مواعيد استئناف قادمة
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (widget.id === 'overdueTasks') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="overdueTasks" id="overdueTasks" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <div className={`bg-white border-2 border-rose-200 rounded-[2.5rem] ${widget.size === 'qr' ? 'p-4 space-y-3' : 'p-6 space-y-4 md:p-8 md:space-y-6'} shadow-sm h-full border-b-4 border-b-rose-500 flex flex-col justify-between`}>
                      <div className="flex items-center justify-between">
                         <h3 className={`font-black text-rose-600 ${widget.size === 'qr' ? 'text-xs' : 'text-sm md:text-base'} flex items-center gap-1.5`}>
                           <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                           المهام المتأخرة
                         </h3>
                         {widget.size !== 'qr' && <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">يتطلب تدخلاً</span>}
                      </div>
                      <div className={`space-y-2 flex-1 overflow-y-auto custom-scrollbar ${widget.size === 'qr' ? 'max-h-[140px]' : 'max-h-[220px]'}`}>
                        {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').slice(0, 4).map((t, i) => (
                           <div key={i} className="flex gap-2 items-center group cursor-pointer transition-all hover:bg-rose-50 p-2 rounded-xl border border-transparent hover:border-rose-100 text-right">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11.5px] font-black text-slate-900 line-clamp-1 truncate mb-1">{t.title}</h4>
                                <TaskCountdown dueDate={t.dueDate!} status={t.status} />
                              </div>
                           </div>
                        ))}
                        {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length === 0 && (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-center text-[10.5px] font-black text-emerald-600 py-6 bg-emerald-50 rounded-2xl border border-emerald-100 border-dashed w-full">المهام مكتملة، عمل ممتاز ✅</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (widget.id === 'appealCountdownWidget') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="appealCountdownWidget" id="appealCountdownWidget" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <AppealCountdownWidget />
                  </div>
                </EnhancedSortableWidgetWrapper>
              );

              if (widget.id === 'activeCaseTracking') return null;
              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>
      </div>
    </SystemErrorRecovery>
  );
};

export default React.memo(Dashboard, (prev, next) => {
  return (
    prev.selectedRole === next.selectedRole &&
    prev.cases === next.cases &&
    prev.clients === next.clients &&
    prev.invoices === next.invoices &&
    prev.tasks === next.tasks &&
    prev.hearings === next.hearings &&
    prev.currentUser?.role === next.currentUser?.role &&
    prev.currentUser?.id === next.currentUser?.id
  );
});
