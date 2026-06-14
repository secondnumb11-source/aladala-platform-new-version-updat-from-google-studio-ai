/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
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
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  DollarSign, 
  Calendar, 
  Clock, 
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
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { Case, Client, Invoice, Task, Hearing } from '@/types';
import HearingCustomTimer from './HearingCustomTimer';
import { InteractiveCard } from './InteractiveCard';
import TaskSuggestions from './TaskSuggestions';
import SystemErrorRecovery from './SystemErrorRecovery';
import InteractionGuideComponent from './InteractionGuideComponent';
import DashboardCardSkeleton from './DashboardCardSkeleton';
import TimelineView from './TimelineView';
import TimelineD3 from './TimelineD3';
import LegalRiskMatrix from './legal/LegalRiskMatrix';
import MiniChart from './charts/MiniChart';
import { RadialBarChart, RadialBar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';
import { Upload, Download, Eye, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NajizWidget } from './NajizWidget';
import NajizPerformanceWidget from './NajizPerformanceWidget';

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
          <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider mt-0.5">منجز اليوم</span>
        </div>
      </div>
      <div className="text-center">
        <strong className="text-xs font-black text-slate-900 block">{label}</strong>
      </div>
    </div>
  );
});

const SummaryWidget = ({ icon, title, description, badgeValue, children }: { icon: React.ReactNode, title: string, description: string, badgeValue?: string | number, children: React.ReactNode }) => (
  <div className="bg-slate-900 border border-[#D4AF37]/30 rounded-3xl p-6 shadow-xl border-[#D4AF37]/60 flex flex-col h-full card-professional relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-0 pointer-events-none"></div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-[#D4AF37] to-[#FACC15] text-slate-900 rounded-2xl shadow-lg ring-2 ring-[#D4AF37]/30">
          {icon}
        </div>
        <div>
          <h4 className="font-black text-white text-base tracking-tight">{title}</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{description}</p>
        </div>
      </div>
      {badgeValue !== undefined && (
        <span className="font-mono text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FACC15]">
          {badgeValue}
        </span>
      )}
    </div>
    <div className="flex-1 bg-slate-950/50 rounded-2xl p-4 border border-white/5 relative z-10">
      {children}
    </div>
  </div>
);

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
  const [performanceTab, setPerformanceTab] = useState<'overview' | 'trends' | 'comparison'>('overview');
  const [isHighContrast, setIsHighContrast] = useState(() => document.body.classList.contains('high-contrast-mode'));
  const [isCustomizing, setIsCustomizing] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);

  useEffect(() => {
    const backup = localStorage.getItem('employees_backup');
    if (backup) {
      try {
        setEmployees(JSON.parse(backup));
      } catch (e) {}
    }
    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      emps.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      setEmployees(emps);
      localStorage.setItem('employees_backup', JSON.stringify(emps));
    }, (error) => {
      console.warn("Error subscribing to employees in Dashboard:", error);
    });

    const qAgencies = query(collection(db, 'powersOfAttorney'));
    const unsubAgencies = onSnapshot(qAgencies, (snapshot) => {
      const agList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgencies(agList);
    }, (error) => {
      console.warn("Error subscribing to agencies in Dashboard:", error);
    });

    return () => {
      unsubscribe();
      unsubAgencies();
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const layoutDoc = await getDoc(doc(db, 'users', user.uid, 'preferences', 'dashboardLayout'));
          if (layoutDoc.exists()) {
            const fetchedItems = layoutDoc.data().widgets;
            if (Array.isArray(fetchedItems) && fetchedItems.length > 0) {
              setWidgets((prevWidgets: any) => {
                // Filter out non-existent or deprecated widgets
                const existingIds = new Set(fetchedItems.map((w: any) => w.id));
                const newWidgets = prevWidgets.filter((w: any) => !existingIds.has(w.id));
                const combined = [...fetchedItems, ...newWidgets].filter((w: any) => w.id !== 'stats' && w.id !== 'activeCaseTracking');
                return ensureKpisFirst(combined);
              });
            }
          }
        } catch (err: any) {
          if (err?.code === 'unavailable' || String(err).includes('offline')) {
            console.warn("Failed to load dashboard layout from Firestore (offline).", err);
          } else {
            console.error("Failed to load dashboard layout from Firestore:", err);
          }
        }
      }
    });

    const handleThemeEvent = () => {
      setThemeTick(Date.now());
      setIsHighContrast(document.body.classList.contains('high-contrast-mode'));
    };
    window.addEventListener('adalah-advanced-config-updated', handleThemeEvent);
    
    const loader = setTimeout(() => {
      setIsDataLoading(false);
    }, 1500);
    
    return () => {
      unsubscribe();
      window.removeEventListener('adalah-advanced-config-updated', handleThemeEvent);
      clearTimeout(loader);
    };
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
    <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-xl">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">تحليلات الشريك وتدقيق الأداء</h3>
            <p className="text-slate-400 text-[10px] font-bold mt-0.5">مؤشرات حية لإنتاجية المكتب ومعدلات النجاح القضائي.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[8px] font-black text-emerald-600 uppercase tracking-widest">نسبة النجاح</span>
            <strong className="text-sm font-black text-emerald-700">{caseSuccessPercentage}%</strong>
          </div>
          <div className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[8px] font-black text-amber-600 uppercase tracking-widest">مؤشر الإنتاجية</span>
            <strong className="text-sm font-black text-amber-700">94%</strong>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Distribution */}
        <div className="space-y-2">
          <h4 className="font-black text-xs text-slate-900 border-r-4 border-amber-500 pr-2">توزيع المحفظة والأثر المالي</h4>
          <div className="h-44 bg-slate-50/50 rounded-2xl p-2 border border-slate-100" style={{ minWidth: 0 }}>
            {isDataLoading ? <DashboardCardSkeleton /> : (
              <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                  <PieChart>
                    <Pie data={typeDistributionData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={6} dataKey="value">
                      {typeDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={isHighContrast ? '#fbbf24' : entry.color} stroke="none" />)}
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
          <h4 className="font-black text-xs text-slate-900 border-r-4 border-indigo-500 pr-2">تأثير نوع القضية على الدخل</h4>
          <div className="h-44 bg-slate-50/50 rounded-2xl p-2 border border-slate-100" style={{ minWidth: 0 }}>
            {isDataLoading ? <DashboardCardSkeleton /> : (
              <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                  <BarChart data={typeDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isHighContrast ? '#64748b' : '#e2e8f0'} />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: isHighContrast ? '#f8fafc' : '#64748b', fontWeight: '900' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: isHighContrast ? '#f8fafc' : '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: isHighContrast ? '#334155' : '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', textAlign: 'right', backgroundColor: isHighContrast ? '#0f172a' : '#fff', color: isHighContrast ? '#fff' : '#000', fontSize: '9px' }} formatter={(val: number) => val.toLocaleString() + ' ر.س'} />
                    <Bar dataKey="revenue" name="متوسط الدخل المتوقع" fill={isHighContrast ? '#fbbf24' : '#6366f1'} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Financial Flow */}
        <div className="space-y-2">
          <h4 className="font-black text-xs text-slate-900 border-r-4 border-emerald-500 pr-2">التدفقات المالية (ZATCA)</h4>
          <div className="h-44 bg-slate-50/50 rounded-2xl p-2 border border-slate-100" style={{ minWidth: 0 }}>
            {isDataLoading ? <DashboardCardSkeleton /> : (
              <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                  <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isHighContrast ? '#fbbf24' : '#b8860b'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isHighContrast ? '#fbbf24' : '#b8860b'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isHighContrast ? '#64748b' : '#e2e8f0'} />
                    <XAxis dataKey="month" tick={{ fontSize: 8, fill: isHighContrast ? '#f8fafc' : '#64748b', fontWeight: '900' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: isHighContrast ? '#f8fafc' : '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', textAlign: 'right', backgroundColor: isHighContrast ? '#0f172a' : '#fff', color: isHighContrast ? '#fff' : '#000', fontSize: '9px' }} formatter={(val: number) => val.toLocaleString() + ' ر.س'} />
                    <Area type="monotone" dataKey="actual" name="المحصل" stroke={isHighContrast ? '#fbbf24' : '#b8860b'} fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
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
    localStorage.setItem(`dashboard_widgets_config_${selectedRole}_v2`, JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      setDoc(doc(db, 'users', uid, 'preferences', 'dashboardLayout'), { 
        widgets: updated,
        lastUpdated: new Date().toISOString()
      }, { merge: true }).catch(e => console.error(e));
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
    const saved = localStorage.getItem(`dashboard_widgets_config_${selectedRole}_v2`);
    let initialList = [
      { id: 'kpiCases', visible: true, order: 0, size: 'qr' },
      { id: 'kpiClients', visible: true, order: 1, size: 'qr' },
      { id: 'kpiInvoices', visible: true, order: 2, size: 'qr' },
      { id: 'kpiTasks', visible: true, order: 3, size: 'qr' },
      { id: 'najizPerformance', visible: true, order: 4, size: 'half' },
      { id: 'employeePerformanceKPI', visible: true, order: 5, size: 'half' },
      { id: 'upcomingHearingsCard', visible: true, order: 6, size: 'half' },
      { id: 'appealsReminder', visible: true, order: 7, size: 'half' },
      { id: 'overdueTasks', visible: true, order: 8, size: 'half' },
      { id: 'timelineCard', visible: true, order: 9, size: 'half' },
      { id: 'summaryAI', visible: true, order: 10, size: 'full' },
      { id: 'taskSuggestions', visible: true, order: 11, size: 'full' },
      { id: 'legalPerformanceMetrics', visible: true, order: 12, size: 'half' },
      { id: 'summaryInvoicesAI', visible: true, order: 13, size: 'half' },
      { id: 'deadlinesWidget', visible: true, order: 14, size: 'half' },
      { id: 'summaryPlatform', visible: true, order: 15, size: 'half' },
      { id: 'summaryCases', visible: true, order: 16, size: 'half' },
      { id: 'summaryKPI', visible: true, order: 17, size: 'half' },
      { id: 'legalRiskMatrix', visible: true, order: 18, size: 'half' },
      { id: 'summaryCalendar', visible: true, order: 19, size: 'half' },
      { id: 'partnerAnalytics', visible: true, order: 20, size: 'half' },
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
      localStorage.setItem(`dashboard_widgets_config_${selectedRole}_v2`, JSON.stringify(newItems));
      
      // Persist to Firestore for multi-device sync
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await setDoc(doc(db, 'users', uid, 'preferences', 'dashboardLayout'), { 
            widgets: newItems,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("Failed to save layout to Firestore", e);
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
      { id: 'najizPerformance', visible: true, order: 4, size: 'half' },
      { id: 'employeePerformanceKPI', visible: true, order: 5, size: 'half' },
      { id: 'upcomingHearingsCard', visible: true, order: 6, size: 'half' },
      { id: 'appealsReminder', visible: true, order: 7, size: 'half' },
      { id: 'overdueTasks', visible: true, order: 8, size: 'half' },
      { id: 'timelineCard', visible: true, order: 9, size: 'half' },
      { id: 'summaryAI', visible: true, order: 10, size: 'full' },
      { id: 'taskSuggestions', visible: true, order: 11, size: 'full' },
      { id: 'legalPerformanceMetrics', visible: true, order: 12, size: 'half' },
      { id: 'summaryInvoicesAI', visible: true, order: 13, size: 'half' },
      { id: 'deadlinesWidget', visible: true, order: 14, size: 'half' },
      { id: 'summaryPlatform', visible: true, order: 15, size: 'half' },
      { id: 'summaryCases', visible: true, order: 16, size: 'half' },
      { id: 'summaryKPI', visible: true, order: 17, size: 'half' },
      { id: 'legalRiskMatrix', visible: true, order: 18, size: 'half' },
      { id: 'summaryCalendar', visible: true, order: 19, size: 'half' },
      { id: 'partnerAnalytics', visible: true, order: 20, size: 'half' },
      { id: 'efficiency', visible: true, order: 21, size: 'half' },
      { id: 'agenda', visible: true, order: 22, size: 'full' },
    ];
    setWidgets(defaultWidgets);
    localStorage.removeItem(`dashboard_widgets_config_${selectedRole}_v2`);
    
    // delete from firestore
    const uid = auth.currentUser?.uid;
    if (uid) {
       setDoc(doc(db, 'users', uid, 'preferences', 'dashboardLayout'), { widgets: defaultWidgets }, { merge: true })
         .catch(err => console.warn("Failed to save layout preferences", err));
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

  return (
    <SystemErrorRecovery 
      isError={dataError} 
      onRetry={() => { setDataError(false); setIsDataLoading(true); setTimeout(() => setIsDataLoading(false), 1500) }}
      errorContext="Najiz Integration Sync Failure"
      errorDetails={{ casesCount: cases.length, role: selectedRole }}
    >
      <div className="space-y-10 animate-fade-in" dir="rtl">
      
      {/* InteractionGuideComponent disabled as requested */}
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">لوحة التحكم الرئيسية</h1>
          <p className="text-slate-400 font-bold mt-1">متابعة دقيقة لمؤشرات أداء المكتب والقضايا الجارية.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`flex items-center gap-2 border px-5 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 ${
              isCustomizing 
                ? 'bg-amber-500 text-white border-amber-600 shadow-lg' 
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {isCustomizing ? <Check size={16} /> : <Settings2 size={16} className="text-amber-500" />}
            {isCustomizing ? 'حفظ الترتيب' : 'تخصيص اللوحة'}
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('najiz-sync-toggle-settings'))}
            className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl text-xs font-black transition-all"
          >
            <Activity size={16} className="text-amber-500" />
            إعدادات المزامنة
          </button>
          <button onClick={() => onNavigate('cases')} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-xl transition-all">
            <Plus size={16} />
            إضافة قضية جديدة
          </button>
        </div>
      </div>

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
              <p className="text-xs text-slate-600 font-bold">يرجى من الإدارة أو الشريك القيادي مخاطبة الموظفين المعنيين ببدء إجراءات التجديد فوراً لتجنب غرامات النظام عِبر بوابة قوى ومقيم.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-slate-200">
                {expiringEmployees.map((emp: any) => (
                  <div key={emp.id} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-extrabold text-slate-800">{emp.name}</span>
                    <span className="text-slate-500 font-bold">({emp.docType})</span>
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
                  <div key={poa.id} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                    <span className="font-extrabold text-slate-800">رقم: {poa.poaNumber}</span>
                    <span className="text-slate-600 font-bold">({poa.clientName})</span>
                    <span className="font-mono bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-black border border-rose-200">⏳ متبقي {poa.daysLeft} أيام</span>
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

      {/* Widgets Content */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w: any) => w.id)} strategy={rectSortingStrategy}>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${isCustomizing ? 'ring-2 ring-amber-500/20 p-4 rounded-[2.5rem] bg-amber-50/5' : ''}`}>
            {widgets.map((widget: any) => {
              if (widget.visible === false) return null;
              // KPI Widgets
              if (widget.id === 'kpiCases') {
                const card = { label: 'القضايا النشطة', value: cases.length, max: 100, icon: <Briefcase />, color: 'bg-blue-500', sparklineData: [{x: 'W1', y: 4}, {x: 'W2', y: 7}, {x: 'W3', y: 5}, {x: 'W4', y: cases.length}] };
                return (
                  <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="kpiCases" id="kpiCases" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className={`bg-white border border-slate-200 p-6 rounded-3xl shadow-sm transition-all duration-300 relative overflow-hidden cursor-pointer h-full ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center">
                          <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-50 opacity-0 pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 ${card.color} text-white rounded-2xl shadow-lg transition-transform duration-300`}>{card.icon}</div>
                          <span className="text-3xl font-black text-slate-900 drop-shadow-sm">{card.value}</span>
                        </div>
                        <div className="flex items-center justify-between mb-8">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                          <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded transition-all duration-300">
                            {Math.round((card.value / (card.max || 1)) * 100)}% من المستهدف
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1/2 transition-all duration-500 pointer-events-none">
                        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                            <AreaChart data={card.sparklineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="color-stats-cases" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={card.color.replace('bg-', '').replace('500', '400')} stopOpacity={0.2} />
                                  <stop offset="95%" stopColor={card.color.replace('bg-', '').replace('500', '400')} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="y" stroke={card.color.replace('bg-', '').replace('500', '400')} strokeWidth={2} fillOpacity={1} fill="url(#color-stats-cases)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </SortableWidgetWrapper>
                );
              }
              if (widget.id === 'kpiClients') {
                const card = { label: 'العملاء', value: clients.length, max: 200, icon: <Users />, color: 'bg-indigo-500', sparklineData: [{x: 'W1', y: 10}, {x: 'W2', y: 15}, {x: 'W3', y: 12}, {x: 'W4', y: clients.length}] };
                return (
                  <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="kpiClients" id="kpiClients" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className={`bg-white border border-slate-200 p-6 rounded-3xl shadow-sm transition-all duration-300 relative overflow-hidden cursor-pointer h-full ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center">
                          <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-50 opacity-0 pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 ${card.color} text-white rounded-2xl shadow-lg transition-transform duration-300`}>{card.icon}</div>
                          <span className="text-3xl font-black text-slate-900 drop-shadow-sm">{card.value}</span>
                        </div>
                        <div className="flex items-center justify-between mb-8">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                          <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded transition-all duration-300">
                            {Math.round((card.value / (card.max || 1)) * 100)}% من المستهدف
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1/2 transition-all duration-500 pointer-events-none">
                        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                            <AreaChart data={card.sparklineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="color-stats-clients" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={card.color.replace('bg-', '').replace('500', '400')} stopOpacity={0.2} />
                                  <stop offset="95%" stopColor={card.color.replace('bg-', '').replace('500', '400')} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="y" stroke={card.color.replace('bg-', '').replace('500', '400')} strokeWidth={2} fillOpacity={1} fill="url(#color-stats-clients)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </SortableWidgetWrapper>
                );
              }
              if (widget.id === 'kpiInvoices') {
                const card = { label: 'الفواتير المعلقة', value: invoices.filter(i => i.status === 'pending').length, max: 50, icon: <DollarSign />, color: 'bg-amber-500', sparklineData: [{x: 'W1', y: 5}, {x: 'W2', y: 8}, {x: 'W3', y: 12}, {x: 'W4', y: invoices.filter(i => i.status === 'pending').length}] };
                return (
                  <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="kpiInvoices" id="kpiInvoices" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className={`bg-white border border-slate-200 p-6 rounded-3xl shadow-sm transition-all duration-300 relative overflow-hidden cursor-pointer h-full ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center">
                          <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-50 opacity-0 pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 ${card.color} text-white rounded-2xl shadow-lg transition-transform duration-300`}>{card.icon}</div>
                          <span className="text-3xl font-black text-slate-900 drop-shadow-sm">{card.value}</span>
                        </div>
                        <div className="flex items-center justify-between mb-8">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                          <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded transition-all duration-300">
                            {Math.round((card.value / (card.max || 1)) * 100)}% من المستهدف
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1/2 transition-all duration-500 pointer-events-none">
                        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                            <AreaChart data={card.sparklineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="color-stats-invoices" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={card.color.replace('bg-', '').replace('500', '400')} stopOpacity={0.2} />
                                  <stop offset="95%" stopColor={card.color.replace('bg-', '').replace('500', '400')} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="y" stroke={card.color.replace('bg-', '').replace('500', '400')} strokeWidth={2} fillOpacity={1} fill="url(#color-stats-invoices)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </SortableWidgetWrapper>
                );
              }
              if (widget.id === 'najizPerformance') {
                return (
                  <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="najizPerformance" id="najizPerformance" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className="h-full">
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center pointer-events-none">
                          <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      )}
                      <NajizPerformanceWidget />
                    </div>
                  </SortableWidgetWrapper>
                );
              }
              if (widget.id === 'kpiTasks') {
                const card = { label: 'المهام المنجزة', value: tasks.filter(t => t.status === 'done').length, max: 300, icon: <CheckSquare />, color: 'bg-emerald-500', sparklineData: [{x: 'W1', y: 40}, {x: 'W2', y: 65}, {x: 'W3', y: 80}, {x: 'W4', y: tasks.filter(t => t.status === 'done').length}] };
                return (
                  <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="kpiTasks" id="kpiTasks" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className={`bg-white border border-slate-200 p-6 rounded-3xl shadow-sm transition-all duration-300 relative overflow-hidden cursor-pointer h-full ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center">
                          <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-50 opacity-0 pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 ${card.color} text-white rounded-2xl shadow-lg transition-transform duration-300`}>{card.icon}</div>
                          <span className="text-3xl font-black text-slate-900 drop-shadow-sm">{card.value}</span>
                        </div>
                        <div className="flex items-center justify-between mb-8">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                          <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded transition-all duration-300">
                            {Math.round((card.value / (card.max || 1)) * 100)}% من المستهدف
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1/2 transition-all duration-500 pointer-events-none">
                        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                            <AreaChart data={card.sparklineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="color-stats-tasks" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={card.color.replace('bg-', '').replace('500', '400')} stopOpacity={0.2} />
                                  <stop offset="95%" stopColor={card.color.replace('bg-', '').replace('500', '400')} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="y" stroke={card.color.replace('bg-', '').replace('500', '400')} strokeWidth={2} fillOpacity={1} fill="url(#color-stats-tasks)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </SortableWidgetWrapper>
                );
              }

              if (widget.id === 'summaryPlatform') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="summaryPlatform" id="summaryPlatform" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<ShieldCheck className="w-5 h-5" />} title="مميزات المنصة" description="نظام متكامل وحماية سحابية 24/7">
                    <ul className="space-y-2 text-xs font-bold text-slate-300">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> إدارة قضايا متكاملة وأرشفة إلكترونية</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> أدوات ذكاء اصطناعي متطورة (توليد مذكرات، تحليل عقود)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> ربط مباشر وذكي مع نظام ناجز</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> فواتير ضريبية معتمدة ومتوافقة مع ZATCA</li>
                    </ul>
                  </SummaryWidget>
                  </div>
                </SortableWidgetWrapper>
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
                  { name: 'قيد التداول', value: activeCount === 0 && reservedCount === 0 && closedCount === 0 ? 1 : activeCount, color: '#10b981' }, 
                  { name: 'محجوزة للحكم', value: reservedCount, color: '#f59e0b' }, 
                  { name: 'منتهية', value: closedCount, color: '#64748b' } 
                ].filter(d => d.value > 0);

                return (
                  <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="summaryCases" id="summaryCases" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                      {isCustomizing && (
                        <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                          <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                      )}
                      
                      <SummaryWidget icon={<Scale className="w-5 h-5 text-amber-500 mt-1" />} title="الإحصائيات الحية للقضايا" description="توزيع ونسب القضايا والقرارات" badgeValue={filteredCasesList.length}>
                        <div className="flex items-center justify-between gap-1 mt-1 mb-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
                          <span className="text-[9px] text-slate-400 font-bold px-1">التصفية:</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setCasesTimeFilter('all')}
                              className={`text-[8px] px-1.5 py-0.5 rounded-lg font-bold transition-all shrink-0 ${casesTimeFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
                            >
                              الكل
                            </button>
                            <button
                              onClick={() => setCasesTimeFilter('month')}
                              className={`text-[8px] px-1.5 py-0.5 rounded-lg font-bold transition-all shrink-0 ${casesTimeFilter === 'month' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
                            >
                              الشهر
                            </button>
                            <button
                              onClick={() => setCasesTimeFilter('3months')}
                              className={`text-[8px] px-1.5 py-0.5 rounded-lg font-bold transition-all shrink-0 ${casesTimeFilter === '3months' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
                            >
                              3 أسهر
                            </button>
                            <button
                              onClick={() => setCasesTimeFilter('year')}
                              className={`text-[8px] px-1.5 py-0.5 rounded-lg font-bold transition-all shrink-0 ${casesTimeFilter === 'year' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
                            >
                              عام
                            </button>
                          </div>
                        </div>

                        <div className="h-28 w-full relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%" key={`pie-${themeTick}`}>
                            <PieChart>
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
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ background: '#091b30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '9px', direction: 'rtl', textAlign: 'right' }} 
                                formatter={(value) => [`${value} قضية`, 'العدد']}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-slate-400 text-[8px] leading-none mb-0.5 font-bold">الإجمالي</span>
                            <span className="text-slate-100 font-sans font-black text-xs">{filteredCasesList.length}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 mt-1 pt-1.5 border-t border-slate-800/80">
                          <div className="bg-emerald-505/10 border border-emerald-500/15 p-1 rounded-lg text-center">
                            <span className="block text-emerald-440 font-sans font-black text-[11px] leading-none">{activeCount}</span>
                            <span className="text-[8px] font-bold text-emerald-300">قيد التداول</span>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/15 p-1 rounded-lg text-center">
                            <span className="block text-amber-500 font-sans font-black text-[11px] leading-none">{reservedCount}</span>
                            <span className="text-[8px] font-bold text-amber-400">محجوزة</span>
                          </div>
                          <div className="bg-slate-500/10 border border-slate-500/15 p-1 rounded-lg text-center font-sans">
                            <span className="block text-slate-300 font-sans font-black text-[11px] leading-none">{closedCount}</span>
                            <span className="text-[8px] font-bold text-slate-400">منتهية</span>
                          </div>
                        </div>

                      </SummaryWidget>
                    </div>
                  </SortableWidgetWrapper>
                );
              }
              if (widget.id === 'najizPerformance') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="najizPerformance" id="najizPerformance" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <NajizWidget />
                  </div>
                </SortableWidgetWrapper>
              );
              if (widget.id === 'summaryKPI') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="summaryKPI" id="summaryKPI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<Activity className="w-5 h-5" />} title="مؤشرات أداء الموظفين" description="متوسط الإنتاجية الفعلي">
                     <div className="space-y-2 mt-1">
                       <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-300 font-bold">نسبة إنجاز المهام</span>
                         <span className="text-emerald-400 font-black">94%</span>
                       </div>
                       <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '94%' }}></div></div>
                       <div className="flex justify-between items-center text-xs mt-2">
                         <span className="text-slate-300 font-bold">كفاءة إدارة الوقت</span>
                         <span className="text-[#D4AF37] font-black">88%</span>
                       </div>
                       <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-[#D4AF37] h-1.5 rounded-full" style={{ width: '88%' }}></div></div>
                       
                       <div className="mt-3 pt-3 border-t border-slate-800/80">
                         <span className="text-[9px] font-black tracking-wider text-slate-400 block mb-1.5">أداء الـ 7 أيام الماضية (الإنجاز للقضايا vs الوقت)</span>
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
                               <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 8 }} />
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
                </SortableWidgetWrapper>
              );
              if (widget.id === 'legalRiskMatrix') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="legalRiskMatrix" id="legalRiskMatrix" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/10 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <LegalRiskMatrix cases={cases} isHighContrast={isHighContrast} />
                  </div>
                </SortableWidgetWrapper>
              );
              if (widget.id === 'summaryAI') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="summaryAI" id="summaryAI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<Cpu className="w-5 h-5" />} title="استخدامات الذكاء الاصطناعي" description="تحليلات المحلل الذكي">
                     <div className="grid grid-cols-2 gap-2 mt-2 h-full">
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                          <Cpu className="w-3.5 h-3.5 text-[#D4AF37] mb-1" />
                          <span className="text-[8px] font-bold text-slate-400 text-center">توليد وصياغة لوائح</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                          <Search className="w-3.5 h-3.5 text-blue-400 mb-1" />
                          <span className="text-[8px] font-bold text-slate-400 text-center">بحث بالمكتبة الرقمية</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mb-1" />
                          <span className="text-[8px] font-bold text-slate-400 text-center">تحليل مخاطر SWOT</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                          <Zap className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                           <span className="text-[8px] font-bold text-slate-400 text-center">استخراج الثغرات</span>
                        </div>
                     </div>
                  </SummaryWidget>
                  </div>
                </SortableWidgetWrapper>
              );
              if (widget.id === 'summaryCalendar') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="summaryCalendar" id="summaryCalendar" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
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
                             <span className="text-[8px] leading-none uppercase">جلسات</span>
                             <span className="font-black leading-none mt-1">{hearings.filter(h => h.date >= new Date().toISOString().split('T')[0]).length || 0}</span>
                           </div>
                           <div className="text-xs font-bold text-slate-300">جلسات قادمة خلال الأسبوع الجاري</div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex flex-col items-center justify-center text-emerald-400">
                             <span className="text-[8px] leading-none uppercase">مهام</span>
                             <span className="font-black leading-none mt-1">{tasks.filter(t => t.status !== 'done' && t.status !== 'completed').length || 0}</span>
                           </div>
                           <div className="text-xs font-bold text-slate-300">مهام نشطة قيد التنفيذ</div>
                        </div>
                      </div>
                    </SummaryWidget>
                  </div>
                </SortableWidgetWrapper>
              );
              if (widget.id === 'deadlinesWidget') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="deadlinesWidget" id="deadlinesWidget" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<Clock className="w-5 h-5 text-[#fbbf24]" />} title="تنبيهات مهل/مدد الاستئناف" description="المواعيد الزمنية النظامية للقضايا الفعالة">
                      <div className="space-y-3 mt-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                         {(() => {
                           const criticalCases = cases.filter((c: any) => 
                             c.status === 'primary_judgment' || 
                             c.status === 'final_judgment' || 
                             c.status === 'appeal' ||
                             c.status === 'active' ||
                             c.priority === 'high'
                           );

                           if (criticalCases.length === 0) {
                             return (
                               <div className="text-center py-4 text-xs text-slate-400 font-bold">
                                 ✅ لا توجد قضايا بمهل حرجة حالياً.
                               </div>
                             );
                           }

                           return criticalCases.slice(0, 3).map((c: any, index: number) => {
                             const baseDateStr = c.lastSessionDate || c.createdAt || '2026-06-01';
                             let baseDate = new Date();
                             try {
                               baseDate = new Date(baseDateStr);
                             } catch(e){}
                             const deadlineDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                             const today = new Date();
                             const diffTime = deadlineDate.getTime() - today.getTime();
                             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                             const isOverdue = diffDays < 0;

                             return (
                               <div key={c.id || index} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 shadow-sm text-right">
                                 <div className="flex items-center justify-between text-[10px]">
                                   <span className={`font-black uppercase tracking-wider ${isOverdue ? 'text-rose-450 animate-pulse' : 'text-[#fbbf24]'}`}>
                                     {isOverdue ? `منتهية منذ ${Math.abs(diffDays)} يوم!` : `تبقّى ${diffDays} يوم`}
                                   </span>
                                   <span className="text-white font-mono font-bold">رقم {c.caseNumber || 'غير محدد'}</span>
                                 </div>
                                 <h5 className="text-[11px] font-black text-[#fbbf24] line-clamp-1">{c.caseName}</h5>
                                 <p className="text-[10px] text-white font-bold leading-relaxed">
                                   قضية {c.clientName || 'العميل'}. تنتهي مهلة الاستئناف النظامية بتاريخ {deadlineDate.toISOString().split('T')[0]}
                                 </p>
                               </div>
                             );
                           });
                         })()}
                         {false && cases.filter((c: any) => c.status === 'final_judgment' || c.status === 'primary_judgment' || c.status === 'closed').slice(0, 1).map((c: any, index) => (
                           <div key={index} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 shadow-sm">
                             <div className="flex items-center justify-between text-[10px]">
                               <span className="text-rose-400 font-black animate-pulse">تبقّى 7 أيام فقط!</span>
                               <span className="text-white font-mono font-bold">رقم {c.caseNumber}</span>
                             </div>
                             <h5 className="text-[10px] font-bold text-[#fbbf24] line-clamp-1">{c.caseName}</h5>
                             <p className="text-[9px] text-white font-bold leading-relaxed">
                               صدر حكم ابتدائي، تنتهي مهلة الاستئناف النظامية (30 يوماماً) بتاريخ: 2026-06-15
                             </p>
                           </div>
                         ))}
                         {false && cases.filter(c => c.status === 'final_judgment' || c.status === 'primary_judgment' || c.status === 'closed').length === 0 && (
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 shadow-sm">
                             <div className="flex items-center justify-between text-[10px]">
                               <span className="text-rose-400 font-black animate-pulse">تبقّى 5 أيام فقط!</span>
                               <span className="text-white font-mono font-bold">رقم 5683921</span>
                             </div>
                             <h5 className="text-[10px] font-bold text-[#fbbf24] line-clamp-1">دعوى إثبات شراكة تجارية</h5>
                             <p className="text-[9px] text-white font-bold leading-relaxed">
                               صدر حكم ابتدائي، تنتهي مهلة الاستئناف النظامية (30 يوماً) بنهاية الأسبوع الجاري.
                             </p>
                           </div>
                         )}
                      </div>
                   </SummaryWidget>
                   </div>
                </SortableWidgetWrapper>
              );
              if (widget.id === 'summaryInvoicesAI') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="summaryInvoicesAI" id="summaryInvoicesAI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-3xl' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-3xl">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <SummaryWidget icon={<FileText className="w-5 h-5" />} title="الفواتير الذكية ZATCA" description="الفواتير ومدقق العقود AI" badgeValue={invoices.length}>
                      <div className="space-y-3 mt-1">
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                           <span className="flex items-center gap-1.5 text-slate-300 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> فواتير معتمدة</span>
                           <span className="font-black text-emerald-400">{invoices.filter(i => i.status === 'paid').length}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-1.5 text-slate-300 font-bold"><Briefcase className="w-3.5 h-3.5 text-[#D4AF37]" /> صياغة عقود (AI)</span>
                           <span className="font-black text-[#D4AF37]">مفعل</span>
                        </div>
                      </div>
                    </SummaryWidget>
                  </div>
                </SortableWidgetWrapper>
              );

              if (widget.id === 'taskSuggestions') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="taskSuggestions" id="taskSuggestions" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
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
                        const newTask: Task = {
                          id: `t-${Date.now()}`,
                          caseNumber: taskData.caseNumber || 'N/A',
                          title: taskData.title || 'Incomplete Task',
                          description: taskData.description || '',
                          status: 'pending',
                          priority: (taskData.priority as any) || 'medium',
                          assignedTo: 'المحامي الحالي',
                          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
                        };
                        onUpdateState('tasks', newTask);
                        alert('✅ تم إضافة المهمة المقترحة بنجاح إلى جدول أعمالك.');
                      }
                    }}
                  />
                  </div>
                </SortableWidgetWrapper>
              );
              if (widget.id === 'upcomingHearingsCard') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="upcomingHearingsCard" id="upcomingHearingsCard" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`group bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 relative h-full ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                         <Calendar className="w-5 h-5 text-indigo-500" />
                         أقرب مواعيد الجلسات القضائية
                      </h3>
                      <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                         <span className="text-[10px] font-black text-indigo-600">توزيع المحاكم</span>
                         <div className="w-8 h-8">
                            <ResponsiveContainer width="100%" height="100%" key={themeTick}>
                              <PieChart>
                                <Pie data={courtDistributionData} cx="50%" cy="50%" innerRadius={10} outerRadius={14} paddingAngle={2} dataKey="value">
                                  {courtDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {hearings.filter(h => h.date >= new Date().toISOString().split('T')[0]).slice(0, 3).map((h, i) => {
                         const relatedCase = cases.find(c => c.caseNumber === h.caseNumber);
                         return (
                           <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex flex-col items-center justify-center shrink-0">
                                <span className="text-[10px] font-black">{new Date(h.date).getDate()}</span>
                                <span className="text-[8px] font-bold">{new Date(h.date).toLocaleDateString('ar-SA', { month: 'short' })}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-slate-800 line-clamp-1">{h.caseName}</h4>
                                <p className="text-[10px] text-slate-500 font-bold truncate mt-1">قضية رقم: {relatedCase?.caseNumber || h.caseNumber || 'غير محدد'}</p>
                              </div>
                              <div className="text-[10px] font-black text-slate-400 shrink-0">
                                {h.time}
                              </div>
                           </div>
                         );
                      })}
                      {hearings.filter(h => h.date >= new Date().toISOString().split('T')[0]).length === 0 && (
                         <div className="p-6 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">لا توجد جلسات قادمة مجدولة</div>
                      )}
                    </div>
                  </div>
                </SortableWidgetWrapper>
              );

              if (widget.id === 'legalPerformanceMetrics') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="legalPerformanceMetrics" id="legalPerformanceMetrics" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
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
                           className={`px-4 py-1.5 text-[10px] font-black rounded-xl transition-all duration-300 ${performancePeriod === 'monthly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
                         >
                           شهري
                         </button>
                         <button 
                           onClick={() => setPerformancePeriod('yearly')}
                           className={`px-4 py-1.5 text-[10px] font-black rounded-xl transition-all duration-300 ${performancePeriod === 'yearly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
                         >
                           سنوي
                         </button>
                      </div>
                    </div>

                    {/* Dashboard metrics Subnav tabs */}
                    <div className="flex flex-wrap items-center gap-2 border-b pb-4 border-slate-100" dir="rtl">
                      <button
                        onClick={() => setPerformanceTab('overview')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${performanceTab === 'overview' ? 'bg-slate-900 text-white border border-slate-800 shadow-sm' : 'text-slate-500 bg-slate-50'}`}
                      >
                        إنتاجية ومؤشرات الأداء 📊
                      </button>
                      <button
                        onClick={() => setPerformanceTab('trends')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${performanceTab === 'trends' ? 'bg-slate-900 text-white border border-slate-800 shadow-sm' : 'text-slate-500 bg-slate-50'}`}
                      >
                        منحنى تطور القضايا (12 شهراً) 📈
                      </button>
                      <button
                        onClick={() => setPerformanceTab('comparison')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${performanceTab === 'comparison' ? 'bg-slate-900 text-white border border-slate-800 shadow-sm' : 'text-slate-500 bg-slate-50'}`}
                      >
                        مقارنة السوق (المرصد القضائي 🇸🇦)
                      </button>
                    </div>

                    {/* Tab Views */}
                    {performanceTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" dir="rtl">
                         <div className="space-y-4 text-right">
                            <div className="flex justify-between items-end">
                               <div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">نسبة ربح القضايا ({performancePeriod === 'monthly' ? 'شهرياً' : 'سنوياً'})</span>
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
                               <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">اكتمل {winLossRatio.total} ملف</span>
                            </div>
                         </div>
                         
                         <div className="space-y-4 border-r pr-8 border-slate-100 text-right">
                            <div>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">متوسط مدة الإنجاز (يوم)</span>
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
                                        <span className="text-slate-400">متوسط السوابق القضائية بالسعودية</span>
                                        <span className="text-slate-500 font-bold font-mono">180 يوم</span>
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
                          <p className="text-xs font-black text-[#B8860B] flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                            بيانات وإحصاءات المرصد القضائي السعودي (JudicialObservatory)
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans font-bold">
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
                            <p className="text-[9px] text-[#B8860B] font-black">تفوق المكتب بنسبة 16% من متوسط السوق بفضل صياغات وعقود NLP الذكية.</p>
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
                            <p className="text-[9px] text-[#B8860B] font-black">التحضير المسبق ومسودات الآلات يختصران 70 يوماً من متوسط الفترات المقررة.</p>
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
                            <p className="text-[9px] text-[#B8860B] font-black">تواصل لحظي وتفاعلي عبر بوابة العملاء المشتركة والتبليغات الفورية.</p>
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
                            <p className="text-[9px] text-[#B8860B] font-black">حضور وعمل والتزام كامل تزامناً مع تبليغات وتذكيرات ناجز الفورية.</p>
                          </div>
                        </div>
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
                </SortableWidgetWrapper>
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
                 <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="employeePerformanceKPI" id="employeePerformanceKPI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 text-right" dir="rtl">
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <span>مؤشر أداء الموظفين التفصيلي (ديناميكي)</span>
                      </h3>
                      {calculatedEmps.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 text-sm font-bold bg-slate-50 rounded-xl">لا تتوفر مهام مسندة لحساب الأداء</div>
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
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-1">
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
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar name="الأداء" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      )}
                    </div>
                 </SortableWidgetWrapper>
                 );
              }


              if (widget.id === 'stats') return null;
              if (widget.id === 'timelineD3') return null;
              if (widget.id === 'partnerAnalytics') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="partnerAnalytics" id="partnerAnalytics" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/10 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    {partnerAnalyticsWidgetMarkup}
                  </div>
                </SortableWidgetWrapper>
              );
              if (widget.id === 'efficiency') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="efficiency" id="efficiency" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
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
                          <p className="text-[9px] text-slate-400 font-bold">تحليل المدد الفعلية مقابل المخطط لها بالمراحل القضائية.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[8px] font-black text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> المخطط
                        </span>
                        <span className="flex items-center gap-1 text-[8px] font-black text-slate-500">
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
                              <XAxis dataKey="phase" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: isHighContrast ? '#f8fafc' : '#1e293b' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: isHighContrast ? '#cbd5e1' : '#64748b' }} />
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
                          <span className="text-[8px] font-black text-slate-400 block mb-0.5 truncate">{d.phase}</span>
                          <div className={`text-xs font-black ${d.efficiency >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {d.efficiency}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </SortableWidgetWrapper>
              );
              if (widget.id === 'timelineCard') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="timelineCard" id="timelineCard" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl space-y-4 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                         <h3 className="font-black text-slate-100 text-sm flex items-center gap-2">
                           <Activity className="w-4 h-4 text-emerald-400" />
                           التسلسل الزمني للقضايا
                         </h3>
                      </div>
                      <div className="flex-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 relative min-h-[300px]">
                        <TimelineD3 hearings={hearings} tasks={tasks} />
                      </div>
                    </div>
                  </div>
                </SortableWidgetWrapper>
              );

              if (widget.id === 'appealsReminder') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="appealsReminder" id="appealsReminder" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-rose-500 to-rose-700 border-none rounded-[2.5rem] p-8 shadow-xl space-y-6 text-white h-full relative overflow-hidden">
                       <div className="flex justify-between items-center relative z-10">
                          <h3 className="font-black text-xl flex items-center gap-2">
                             <AlertTriangle className="w-6 h-6 text-rose-200" />
                             مهل الاستئناف الحرجة
                          </h3>
                          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black">
                            {cases.filter(c => c.appeal_deadline).length} مهل
                          </div>
                       </div>
                       <div className="space-y-3 relative z-10">
                         {cases.filter(c => c.appeal_deadline).sort((a,b) => new Date(a.appeal_deadline!).getTime() - new Date(b.appeal_deadline!).getTime()).slice(0, 3).map((c, i) => {
                           const isUrgent = new Date(c.appeal_deadline!).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
                           return (
                             <div key={i} className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-2xl flex items-center justify-between">
                               <div>
                                 <h4 className="font-bold text-sm truncate max-w-[150px]">{c.caseName}</h4>
                                 <p className="text-xs text-rose-100 mt-1 opacity-90 truncate max-w-[150px]">{c.caseNumber}</p>
                               </div>
                               <div className="text-left shrink-0">
                                 <span className={`text-[10px] font-black px-2 py-1 rounded-lg inline-block ${isUrgent ? 'bg-white text-rose-600 animate-pulse' : 'bg-white/20 text-white'}`}>
                                    {isUrgent ? 'اقترب الانتهاء!' : 'متبقي وقت'}
                                 </span>
                                 <p className="text-xs font-bold mt-1.5">{new Date(c.appeal_deadline!).toLocaleDateString('ar-SA')}</p>
                               </div>
                             </div>
                           )
                         })}
                         {cases.filter(c => c.appeal_deadline).length === 0 && (
                           <div className="text-center p-8 text-rose-100 font-bold bg-white/5 rounded-2xl border border-white/10">
                             لا يوجد مواعيد استئناف قادمة
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </SortableWidgetWrapper>
              );

              if (widget.id === 'overdueTasks') return (
                <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="overdueTasks" id="overdueTasks" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={`h-full relative ${isCustomizing ? 'opacity-80 ring-2 ring-dashed ring-amber-400 rounded-[2.5rem]' : ''}`}>
                    {isCustomizing && (
                      <div className="absolute inset-0 bg-amber-500/5 z-50 flex items-center justify-center rounded-[2.5rem]">
                        <GripVertical className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                    )}
                    <div className="bg-white border border-rose-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 h-full border-b-4 border-b-rose-500 flex flex-col">
                      <div className="flex items-center justify-between">
                         <h3 className="font-black text-rose-600 text-lg flex items-center gap-2">
                           <AlertCircle className="w-5 h-5" />
                           المهام المتأخرة
                         </h3>
                         <span className="text-xs font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full">يتطلب تدخلاً فورياً</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').slice(0, 4).map((t, i) => (
                           <div key={i} className="flex gap-3 items-center group cursor-pointer transition-all hover:bg-slate-50 p-2 rounded-xl border border-transparent hover:border-slate-100">
                              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-slate-800 line-clamp-1 truncate mb-1.5">{t.title}</h4>
                                <TaskCountdown dueDate={t.dueDate!} status={t.status} />
                              </div>
                           </div>
                        ))}
                        {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length === 0 && (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-center text-xs font-bold text-slate-400 py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed w-full">المهام مكتملة، عمل ممتاز ✅</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </SortableWidgetWrapper>
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
