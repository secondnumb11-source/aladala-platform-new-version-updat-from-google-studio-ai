/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment-hijri';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Bot, 
  CheckSquare, 
  FileText, 
  DollarSign, 
  RefreshCw, 
  ShieldAlert, 
  Menu, 
  X,
  Lock,
  UserCheck,
  Settings,
  Scale,
  Gavel,
  Brain,
  Clock,
  Wallet,
  ExternalLink,
  Crown,
  MessageSquare,
  Sparkles,
  Loader2,
  Award,
  Bell,
  Upload,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  Landmark,
  Compass,
  Key,
  Zap,
  Link2,
  Database,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Edit3,
  Search,
  Calculator
} from 'lucide-react';

import ThemeToggle from './ThemeToggle';
import { Case } from '@/types';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  cases?: Case[];
  onUpdateState?: (type: string, data: any) => void;
  customRoles?: any;
  currentUser?: any;
}

interface SidebarItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  isPremium?: boolean;
  isAdminOnly?: boolean;
  children?: { id: string; name: string; icon?: React.ComponentType<any>; tooltip?: string }[];
}

import { useSupabase } from '@/contexts/SupabaseContext';
import { getContrastText, TEXT_COLORS } from '@/utils/contrastUtils';

export default function Sidebar({
  currentTab,
  onNavigate,
  selectedRole,
  onRoleChange,
  cases = [],
  onUpdateState,
  customRoles,
  currentUser
}: SidebarProps) {
  const { preferences, updatePreference } = useUserPreferences();
  const { connectionStatus } = useSupabase();

  const [logo, setLogo] = React.useState<string | null>(() => localStorage.getItem('office_logo'));
  const [officeName, setOfficeName] = React.useState<string>(() => localStorage.getItem('office_name') || 'منصة العدالة');

  React.useEffect(() => {
    const handleStorageChange = () => {
      setLogo(localStorage.getItem('office_logo'));
      setOfficeName(localStorage.getItem('office_name') || 'منصة العدالة');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isNajizConnected = preferences?.najiz_api_connected === 'true';
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarWidth, setSidebarWidth] = React.useState(395);
  const [isResizing, setIsResizing] = React.useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
    const startWidth = sidebarWidth;
    const startX = mouseDownEvent.clientX;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      // For RTL, resizing on the left side:
      const delta = startX - mouseMoveEvent.clientX; 
      const newWidth = Math.max(250, Math.min(600, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [aiExpanded, setAiExpanded] = React.useState(currentTab.startsWith('ai-') || currentTab === 'ai');
  const [aiBlurEnabled, setAiBlurEnabled] = React.useState(true);
  const [aiSearchQuery, setAiSearchQuery] = React.useState('');
  const [aiFontSize, setAiFontSize] = React.useState<'sm' | 'md' | 'lg'>('md');
  const [isGeneratingPlan, setIsGeneratingPlan] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const isHijri = preferences?.['adalah-clock-hijri'] !== false;

  const toggleCalendar = () => {
    updatePreference('adalah-clock-hijri', !isHijri);
  };

  const [showClockSettings, setShowClockSettings] = React.useState(false);

  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [userName, setUserName] = React.useState(currentUser?.name || 'المستخدم');
  const [isEditingUserName, setIsEditingUserName] = React.useState(false);

  React.useEffect(() => {
    if (currentUser?.name) {
      setUserName(currentUser.name);
    }
  }, [currentUser]);

  const handleSaveUserName = async (val: string) => {
    setUserName(val);

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

  const handleGeneratePlan = () => {
    setIsGeneratingPlan(true);
    setTimeout(() => {
      setIsGeneratingPlan(false);
      const activeChild = allItems.find(i => i.id === 'ai')?.children?.find(c => c.id === currentTab);
      alert(`تم توليد خطة العمل القانونية لـ: ${activeChild ? activeChild.name : 'المهمة الحالية'} بنجاح!`);
    }, 2000);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('تم تصدير تقرير الذكاء الاصطناعي بنجاح! جاري تحميل ملف PDF...');
    }, 1500);
  };

  // Smooth scroll active item into view
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector('.group\\/nav-item.active-nav-item');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentTab]);

  // States for Sidebar Inline Document upload for 48H hearings 
  const [isFormOpen, setIsFormOpen] = React.useState<string | null>(null);
  const [memoFileName, setMemoFileName] = React.useState('');
  const [successCaseId, setSuccessCaseId] = React.useState<string | null>(null);

  const allItems: SidebarItem[] = [
    { id: 'dashboard', name: 'لوحة المعلومات الرئيسية', icon: LayoutDashboard },
    { id: 'cases', name: 'إدارة القضايا', icon: Briefcase },
    { id: 'case-judgments', name: 'الأحكام وضبط الجلسات والمذكرات', icon: Scale },
    { id: 'executions', name: 'طلبات التنفيذ', icon: Scale },
    { id: 'calendar', name: 'تقويم مواعيد الجلسات', icon: BookOpen },
    
    { id: 'clients', name: 'سجل العملاء والموكلين', icon: Users },
    { id: 'client-portal', name: 'بوابة العملاء', icon: UserCheck },
    { id: 'agencies', name: 'الوكالات (PoA)', icon: FileSpreadsheet },
    { id: 'whatsapp', name: 'إشعارات ومراسلات العملاء', icon: MessageSquare },
    
    { id: 'employees-data', name: 'بيانات الموظفين', icon: Users },
    { id: 'employee-portal', name: 'بوابة الموظفين وإدارة الصلاحيات', icon: Award },
    { id: 'performance', name: 'مؤشرات الأداء KPI’s', icon: Briefcase },
    { id: 'tasks', name: 'المهام وتوزيع الأعمال', icon: CheckSquare },
    
    { id: 'saudi-hub', name: 'بوابة الخدمات الحكوميه', icon: Landmark },
    { id: 'smart-services', name: 'خدمات المسانده والتحقق', icon: ShieldAlert },
    { id: 'court-map', name: 'دليل المحاكم', icon: Compass },
    { id: 'documents', name: 'أرشيف المستندات', icon: FileText },

    { id: 'najiz', name: 'الربط مع ناجز', icon: Link2 },
    { id: 'audit-logs', name: 'سجل العمليات', icon: FileText },
    { id: 'settings', name: 'الاعدادات', icon: Settings },

    { id: 'ai', name: 'المساعد القانوني', icon: Bot, isPremium: true },
    { id: 'ai-drafting', name: 'صياغة اللوائح والمذكرات', icon: Gavel, isPremium: true },
    { id: 'ai-analysis', name: 'المحلل الذكي', icon: Brain, isPremium: true },
    { id: 'ai-contract_audit', name: 'صياغة العقود', icon: Gavel, isPremium: true },
    { id: 'ai-finance-vat', name: 'إصدار الفواتير', icon: Wallet, isPremium: true },
    { id: 'ai-judicial-calc', name: 'الحاسبة القضائية', icon: Calculator, isPremium: true },
    { id: 'ai-deadlines', name: 'حاسبة المهل والمدد النظاميه', icon: Clock, isPremium: true },
    { id: 'ai-swot', name: 'تحليل المخاطر SWOT', icon: Brain, isPremium: true },
    { id: 'ai-finance', name: 'المحاسب القانوني AI', icon: Wallet, isPremium: true },
    { id: 'ai-zatca', name: 'الفواتير المعتمده ZATCA', icon: CheckCircle2, isPremium: true },
    { id: 'ai-search', name: 'مكتبة الانظمه والبحث الذكي', icon: Search, isPremium: true },
  ];

  const saudiPortals = [
    { name: 'بوابة ناجز العدلية', url: 'https://najiz.sa', desc: 'المحاكم والصكوك والوكالات', icon: '⚖️', letter: 'ن', color: 'from-emerald-600 to-teal-800' },
    { name: 'ديوان المظالم (معين)', url: 'https://www.bog.gov.sa', desc: 'المستحقات والمنازعات الإدارية', icon: '🏛️', letter: 'م', color: 'from-blue-700 to-indigo-900' },
    { name: 'منصة تراضي الرقمية', url: 'https://taradhi.moj.gov.sa', desc: 'جلسات التسوية والصلح الودي', icon: '🤝', letter: 'ت', color: 'from-teal-600 to-emerald-700' },
    { name: 'منصة قوى للعمل', url: 'https://qiwa.sa', desc: 'الأجور وتوثيق لائحة التوظيف', icon: '💼', letter: 'ق', color: 'from-purple-600 to-violet-850' },
    { name: 'منصة بلدي والأمانات', url: 'https://balady.gov.sa', desc: 'النزاعات والمخالفات البلدية', icon: '🏢', letter: 'ب', color: 'from-amber-500 to-orange-700' },
    { name: 'بوابة وزارة التجارة', url: 'https://mc.gov.sa', desc: 'السجلات والإفلاس والشركات', icon: '📊', letter: 'ت', color: 'from-sky-600 to-blue-800' },
    { name: 'منصة أبشر أفراد/أعمال', url: 'https://absher.sa', desc: 'الهوية السجل والعمالة', icon: '👤', letter: 'أ', color: 'from-green-600 to-emerald-800' },
    { name: 'هيئة الزكاة والضريبة', url: 'https://zatca.gov.sa', desc: 'الفواتير والضريبة والجمارك', icon: '💰', letter: 'ز', color: 'from-yellow-600 to-amber-800' },
    { name: 'المؤسسة العامة للتأمينات', url: 'https://gosi.gov.sa', desc: 'حقوق الموظفين والاشتراكات', icon: '🛡️', letter: 'ت', color: 'from-indigo-600 to-purple-800' },
    { name: 'منصة اعتماد الحكومية', url: 'https://etimad.sa', desc: 'المنافسات والمشتريات العامة', icon: '📜', letter: 'ع', color: 'from-orange-600 to-yellow-700' },
    { name: 'نظام مقيم الإلكتروني', url: 'https://muqeem.sa', desc: 'إدارة الكفالات والتأشيرات', icon: '🛂', letter: 'م', color: 'from-cyan-500 to-sky-700' },
  ];

  const roles = [
    { id: 'admin', name: customRoles?.admin || 'شريك أول / مدير منصة العدالة 👑' },
    { id: 'lawyer', name: customRoles?.lawyer || 'محامي ⚖️' },
    { id: 'researcher', name: customRoles?.researcher || 'مستشار وباحث شرعي 🎓' },
    { id: 'secretary', name: customRoles?.secretary || 'أمين سر إداري 📅' },
    { id: 'accountant', name: customRoles?.accountant || 'مدير الشؤون المالية وقائد الامتثال 💰' },
    { id: 'client', name: customRoles?.subscriber || 'العميل (العدالة) 👤' },
  ];

  const mainBg = '#020617'; // slate-950
  const mainText = getContrastText(mainBg);
  const goldText = TEXT_COLORS.goldBright;

  return (
    <>
      {/* Sidebar Drawers - Positioned fixedly on mobile, sticky structurally on desktop */}
      <aside 
        style={{ width: `${sidebarWidth}px` }}
        className={`fixed lg:sticky top-0 right-0 lg:right-auto lg:left-auto h-screen z-40 bg-slate-950/70 backdrop-blur-2xl border-l border-white/5 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col justify-between lg:shadow-none overflow-x-hidden overflow-y-hidden shrink-0 text-right`}
        dir="rtl"
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className={`absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-50 transition-colors ${isResizing ? 'bg-amber-500/50' : ''}`}
        />

        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Logo & Platform Name */}
          <div className="p-8 border-b border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 bg-amber-500/20 border-2 border-primary rounded-2xl flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)] shrink-0 overflow-hidden">
                    {logo ? (
                      <img src={logo} alt="شعار المكتب" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Scale className="w-8 h-8 relative z-10 text-amber-400" />
                        <div className="absolute inset-0 bg-amber-500/10 blur-md rounded-2xl"></div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h2 className={`font-display font-black ${goldText} tracking-tight leading-tight text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
                      {officeName}
                    </h2>
                    <h3 className={`text-[11px] ${mainText} font-extrabold tracking-wide mt-1 leading-normal uppercase`}>
                      لإدارة مكاتب المحاماة المعتمدة
                    </h3>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-8 sidebar-scrollbar premium-sidebar-scrollbar relative w-full overflow-x-hidden">
            {/* ⏰ CUSTOMIZABLE COMPACT SIDEBAR CLOCK WITH WELCOME GREETING */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-2.5 relative overflow-visible group/clock-card">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent pointer-events-none rounded-xl"></div>
              
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex flex-col text-right select-none">
                    {isEditingUserName ? (
                      <input 
                        autoFocus
                        className="text-[11px] font-black text-amber-400 bg-slate-950 border border-slate-700/80 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500 transition-all w-[80px] text-right"
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
                        className="cursor-pointer flex flex-col items-start text-right"
                        onClick={() => setIsEditingUserName(true)}
                        title="اضغط لتعديل اسمك"
                      >
                        <span className="text-[10px] font-black leading-tight text-white">مرحباً</span>
                        <span className="text-[11px] font-black text-amber-400 truncate max-w-[80px]" title={userName}>
                          {userName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Settings Trigger Icon */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowClockSettings(!showClockSettings)}
                      className={`p-1.5 rounded-lg text-slate-700 transition-all ${showClockSettings ? 'bg-slate-800 text-amber-500 rotate-45' : ''}`}
                      title="صلاحية النظام"
                      aria-label="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    {/* dropdown options */}
                    {showClockSettings && (
                      <div className="absolute left-0 top-full mt-2 w-64 bg-slate-950 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl p-4.5 z-50 dir-rtl border-amber-500/20">
                        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-[6px] w-3 h-3 rotate-45 bg-slate-950 border-t border-r border-slate-800"></div>
                        <div className="space-y-4 relative z-10">
                          {currentUser?.role !== 'client' && currentUser?.role !== 'employee' && (
                            <div className="pt-2 border-t border-slate-850">
                              <span className="text-[10px] font-black text-white font-black mb-1 block">صلاحية النظام</span>
                              <select
                                value={selectedRole}
                                onChange={(e) => {
                                  onRoleChange(e.target.value);
                                  setMobileOpen(false);
                                }}
                                className="w-full bg-slate-900 text-[#FACC15] font-black text-[10px] py-1 px-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                              >
                                {roles.map(r => (
                                  <option key={r.id} value={r.id}>{r.name.replace('⚖️', '').replace('🎓', '').replace('👑', '').replace('📅', '').replace('💰', '').trim()}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <button 
                            onClick={() => setShowClockSettings(false)}
                            className="w-full text-center text-[10px] py-1.5 text-amber-500 hover:text-amber-400 font-black border-t border-slate-850 pt-2 block transition-colors"
                          >
                            حفظ وإغلاق التخصيص
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Time/Date & Converter */}
                <div className="flex items-start justify-between gap-2 pt-1 w-full" dir="ltr">
                  <div className="flex flex-col items-start gap-0.5 text-left">
                    <span 
                      className="tabular-nums font-black font-mono text-xl leading-none text-left" 
                      style={{ color: '#39FF14', textShadow: '0 0 14px rgba(57,255,20,1.0), 0 0 4px rgba(57,255,20,0.8)' }}
                    >
                      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                    <span 
                      className="text-[11px] font-black tabular-nums tracking-tight text-left block"
                      style={{ color: '#39FF14', textShadow: '0 0 8px rgba(57,255,20,0.8)' }}
                    >
                      {isHijri 
                        ? time.toLocaleDateString('ar-SA-u-ca-islamic-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })
                        : time.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      }
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <button 
                      onClick={toggleCalendar}
                      className="text-[11px] bg-slate-800 text-[#39FF14] px-1.5 py-0.5 rounded border border-[#39FF14]/30 font-black hover:bg-slate-700 transition-colors"
                      title="تبديل التاريخ"
                    >
                      {isHijri ? 'ميلادي' : 'هجري'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          {/* Main Navigation */}
          <div className="space-y-6 pb-6">
            {[
              {
                title: 'المنظومة القضائية وإدارة العمل',
                itemIds: ['dashboard', 'cases', 'case-judgments', 'executions', 'calendar']
              },
              {
                title: 'العملاء والشؤون الخارجية',
                itemIds: ['clients', 'client-portal', 'agencies', 'whatsapp']
              },
              {
                title: 'فريق العمل',
                itemIds: ['employees-data', 'employee-portal', 'performance', 'tasks']
              },
              {
                title: 'الذكاء الاصطناعي والأدوات',
                itemIds: ['ai', 'ai-drafting', 'ai-analysis', 'ai-contract_audit', 'ai-finance-vat', 'ai-judicial-calc', 'ai-deadlines', 'ai-swot', 'ai-finance', 'ai-zatca', 'ai-search']
              },
              {
                title: 'خدمات المسانده والتحقق الذكي',
                itemIds: ['saudi-hub', 'smart-services', 'court-map', 'documents']
              },
              {
                title: 'التكامل والإعدادات',
                itemIds: ['najiz', 'audit-logs', 'settings']
              },
            ].map((cat, catIdx) => {
              // Retrieve permitted modules for the current category based on user role
              const allowedItems = allItems.filter(item => {
                if (!cat.itemIds.includes(item.id)) return false;

                const showCases = preferences?.['adalah-show-cases-module'] !== false;
                const showFinance = preferences?.['adalah-show-finance-module'] !== false;
                const showAppointments = preferences?.['adalah-show-appointments-module'] !== false;

                if (item.id === 'cases' && !showCases) return false;
                if (item.id === 'finance' && !showFinance) return false;
                if (item.id === 'calendar' && !showAppointments) return false;
                
                if (currentUser?.role === 'client') {
                  return item.id === 'client-portal';
                }
                if (item.isAdminOnly && selectedRole !== 'admin') return false;
                if (currentUser?.role === 'employee') {
                  // If it's an employee, they strictly see what's in their sidebarConfig OR documentation/portal/settings (system defaults)
                  const config = currentUser.sidebarConfig || [];
                  const allowedByPerms = currentUser.permittedModules || [];
                  
                  // Inhibit administration and database operations logs
                  if (item.id === 'team' || item.id === 'audit-logs' || item.id === 'employees-data') return false;
                  if (item.id === 'employee-portal') return true;
                  if (item.id === 'documentation' || item.id === 'settings' || item.id === 'najiz') return true;
                  
                  return config.includes(item.id) || allowedByPerms.includes(item.id);
                }
                return true;
              });

              if (allowedItems.length === 0) return null;

              return (
                <motion.div 
                  key={cat.title} 
                  className="space-y-1 pt-1.5 border-t border-slate-900/40"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: catIdx * 0.08, ease: "easeOut" }}
                >
                  <div className="px-3 flex items-center gap-2 mb-2 group cursor-default">
                    <motion.span 
                      className="w-1.5 h-3 bg-gradient-to-b from-sky-400 to-blue-600 rounded-full"
                      whileHover={{ scale: 1.5, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    ></motion.span>
                    <h3 className={`text-[10px] font-black ${mainText} uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,1)]`}>{cat.title}</h3>
                  </div>
                  <div className="space-y-1">
                    {allowedItems.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id || (item.children && item.children.some(child => currentTab === child.id));
                      const isItemExpanded = item.id === 'ai' ? aiExpanded : false;

                      return (
                        <motion.div 
                          key={item.id} 
                          className={`relative nav-item-no-group font-bold ${isActive ? 'active-nav-item' : 'group'}`}
                          whileHover={{ scale: 1.01, x: -3 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25, delay: (catIdx * 0.08) + (itemIdx * 0.03) }}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-nav-bg"
                              className="absolute inset-0 bg-amber-500/20 border border-amber-400 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.3)] pointer-events-none"
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <button
                            onClick={(e) => {
                              if (item.children) {
                                setAiExpanded(!aiExpanded);
                                if (!isActive && !aiExpanded) {
                                  onNavigate(item.id); // Also navigate to main if clicking for first time
                                }
                              } else {
                                onNavigate(item.id);
                                setMobileOpen(false);
                              }
                              // Center the active item in the scroll container
                              if (scrollContainerRef.current) {
                                const container = scrollContainerRef.current;
                                const element = e.currentTarget;
                                const offsetTop = element.offsetTop;
                                const elementHeight = element.offsetHeight;
                                const containerHeight = container.offsetHeight;
                                container.scrollTo({
                                  top: offsetTop - (containerHeight / 2) + (elementHeight / 2),
                                  behavior: 'smooth'
                                });
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[12px] relative overflow-hidden select-none transition-all duration-300 z-10 ${
                              isActive 
                                ? 'text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' 
                                : 'text-slate-100 group-hover:text-white font-bold bg-transparent group-hover:bg-white/10 border border-transparent group-hover:border-white/20'
                            }`}
                          >
                            {/* Content */}
                            <div className="flex items-center gap-3 relative z-10 w-full overflow-hidden">
                              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-sky-400' : 'text-sky-400'}`} />
                              <div className="text-right leading-relaxed flex items-center gap-x-1.5 truncate">
                                {item.name.includes('AI') ? (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="truncate font-black text-[13px]">{item.name.replace('AI', '').trim()}</span>
                                    <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider shrink-0 ${isActive ? 'border-sky-400 bg-sky-400/20 text-white' : 'border-sky-600 bg-sky-900/40 text-white'}`}>AI</span>
                                  </div>
                                ) : (
                                  <span className="truncate font-black text-[13px]">{item.name}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 relative z-10">
                              {item.isPremium && (
                                <Crown className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-yellow-400'}`} />
                              )}
                              {item.children && (
                                <div 
                                  id="sidebar-ai-assistant-arrow"
                                  className="ml-2 select-none flex items-center justify-center shrink-0 text-white font-black"
                                >
                                  {isItemExpanded ? (
                                    <ChevronUp className="w-5 h-5" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" />
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                          
                          {/* Render Sub-items with animation */}
                          <AnimatePresence>
                            {item.children && isItemExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                className={`sidebar-ai-dropdown-menu scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent scroll-smooth overflow-y-auto max-height-[420px] dark:bg-slate-950/60 bg-white/60 mt-3 rounded-[28px] shadow-2xl border dark:border-white/10 border-slate-200 relative ${aiBlurEnabled ? 'backdrop-blur-md' : 'backdrop-blur-none'}`}
                              >
                                {/* Quick Controls Header */}
                                <div className="px-6 py-4 border-b dark:border-white/5 border-slate-200 bg-slate-500/5 space-y-4">
                                  {/* AI Settings Overlay */}
                                  <div className="flex items-center justify-between gap-3">
                                    <button
                                      onClick={() => {
                                        const activeChild = item.children?.find(c => c.id === currentTab);
                                        const taskName = activeChild ? activeChild.name : 'المهمة الحالية';
                                        alert(`تم إرسال ${taskName} للمحلل الذكي... بانتظار الخطة العمل.`);
                                      }}
                                      className="flex-1 bg-amber-500 text-slate-950 text-[11px] font-black py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      <span>تحليل AI سريع</span>
                                    </button>
                                    
                                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg dark:bg-slate-900 bg-slate-100 border dark:border-white/5 border-slate-200">
                                      <span className="text-[10px] font-black text-white font-black select-none">زجاجي:</span>
                                      <button 
                                        onClick={() => setAiBlurEnabled(!aiBlurEnabled)}
                                        className={`w-9 h-5 rounded-full relative transition-all duration-300 ${aiBlurEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}
                                      >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${aiBlurEnabled ? 'right-5' : 'right-1'}`} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Font Size & Filter Controls */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="relative flex-1">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/70" />
                                        <input 
                                          type="text"
                                          placeholder="بحث في ذكاء المنصة..."
                                          value={aiSearchQuery}
                                          onChange={(e) => setAiSearchQuery(e.target.value)}
                                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl py-2.5 pr-10 pl-3 text-[11px] text-white focus:outline-none transition-all font-black placeholder:text-white font-black"
                                        />
                                        {aiSearchQuery && (
                                          <button 
                                            onClick={() => setAiSearchQuery('')}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-700"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      
                                      <div className="flex bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 shrink-0 shadow-inner">
                                        {(['sm', 'md', 'lg'] as const).map((size) => (
                                          <button
                                            key={size}
                                            onClick={() => setAiFontSize(size)}
                                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                                              aiFontSize === size 
                                                ? 'bg-amber-500 text-slate-950 shadow-lg' 
                                                : 'text-white font-black'
                                            }`}
                                          >
                                            {size === 'sm' ? 'صـغير' : size === 'md' ? 'وسط' : 'كبير'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Legal Updates Mini-Headlines Section */}
      <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 space-y-3 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                                        <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest shadow-white/10 shadow-sm">آخر التحديثات القانونية المباشرة</h4>
                                      </div>
                                      <button className="text-[11px] text-white font-bold font-bold underline underline-offset-2">تحديث الآن</button>
                                    </div>
                                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-500/30">
                                      {[
                                        { t: 'تعديلات جديدة في نظام المرافعات الشرعية', d: 'منذ ساعتين' },
                                        { t: 'صدور لائحة التنفيذ المحدثة لعام 2026', d: 'منذ 5 ساعات' },
                                        { t: 'تعميم قضائي بشأن الوسائل الإلكترونية في التبليغ', d: 'أمس' },
                                        { t: 'إعلان وزارة العدل عن تحديثات في بوابة "ناجز" للمحامين', d: 'منذ يومين' }
                                      ].map((upd, idx) => (
                                        <div key={idx} className="group/upd bg-white/5 p-2 rounded-lg border border-white/10 transition-all cursor-pointer">
                                          <div className="text-[11px] font-black text-white group-hover/upd:text-amber-400 line-clamp-1 leading-relaxed">{upd.t}</div>
                                          <div className="text-[11px] text-amber-100/60 mt-0.5">{upd.d}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {item.children
                                  .filter(child => child.name.toLowerCase().includes(aiSearchQuery.toLowerCase()))
                                  .map(child => {
                                    const isChildActive = currentTab === child.id;
                                    const fontSizeClass = aiFontSize === 'sm' ? 'text-[11px]' : aiFontSize === 'lg' ? 'text-[15px]' : 'text-[13px]';
                                    
                                    return (
                                      <button
                                        key={child.id}
                                        onClick={() => {
                                          onNavigate(child.id);
                                          setMobileOpen(false);
                                        }}
                                        title={child.tooltip}
                                        className={`sidebar-ai-menu-item sidebar-ai-menu-item-pulse w-full flex items-center gap-5 px-5 py-4 ${fontSizeClass} font-black border-l-4 relative group/ai-child ${isChildActive ? 'ai-active-glow' : ''}`}
                                        style={{
                                          borderColor: isChildActive ? '#fb923c' : 'transparent',
                                          background: isChildActive ? 'rgba(251, 146, 60, 0.08)' : 'transparent',
                                        }}
                                      >
                                        {child.icon ? (
                                          <child.icon className="w-5 h-5 shrink-0 transition-transform group-hover/ai-child:scale-110" style={{ color: '#38bdf8' }} />
                                        ) : (
                                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#38bdf8' }} />
                                        )}
                                        <div className="flex flex-col items-start gap-0.5 text-right flex-1">
                                          <span className="font-semibold select-none leading-relaxed" style={{ color: '#38bdf8' }}>{child.name}</span>
                                          {(aiFontSize === 'md' || aiFontSize === 'lg') && (
                                            <span className="text-[11px] text-slate-700 font-bold group-hover/ai-child:text-amber-500/70 transition-colors line-clamp-1 opacity-0 group-hover/ai-child:opacity-100 transform -translate-y-1 group-hover/ai-child:translate-y-0 duration-300">
                                              {child.tooltip}
                                            </span>
                                          )}
                                        </div>

                                        {/* Status dot indicator for active selection */}
                                        {isChildActive && (
                                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(251,146,60,1)] animate-pulse"></div>
                                        )}
                                      </button>
                                    );
                                  })}

                                {/* Bottom Action Button */}
                                <div className="p-4 border-t dark:border-white/5 border-slate-200 mt-auto bg-slate-500/5 flex flex-col gap-2">
                                  <button
                                    onClick={handleGeneratePlan}
                                    disabled={isGeneratingPlan}
                                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white text-[12px] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-amber-500/10 disabled:opacity-70 disabled:pointer-events-none"
                                  >
                                    {isGeneratingPlan ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-4 h-4" />
                                    )}
                                    <span>توليد خطة عمل قانونية</span>
                                  </button>

                                  <button
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                    className="w-full bg-slate-800 text-amber-300 text-[11px] font-black py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-amber-500/10"
                                  >
                                    {isExporting ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5" />
                                    )}
                                    <span>تصدير كتقرير PDF</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}

            <div className="space-y-1">
              <div className="px-3 mt-4 mb-4">
                <a href="/najiz-extension/README-AR.md" target="_blank" className="w-full bg-[#1e40af]/40[#1e40af]/60 text-white border border-[#2563eb] text-[10px] font-black py-2 rounded-xl flex items-center justify-center gap-1 transition-all">
                  تحميل إضافة مزامنة ناجز (لتثبيتها في كروم)
                </a>
              </div>
            </div>
          </div>
        </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 relative">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between relative z-10 shadow-inner gap-2 group transition-colors">
              <div className="flex items-center gap-2.5 w-full">
                <div className="w-6 h-6 shrink-0 bg-slate-900 rounded-lg flex items-center justify-center border border-emerald-500/40 transition-colors">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] font-black text-white font-black uppercase tracking-wider leading-none mb-1">تشفير مركزي معتمد</span>
                  <span className="text-[10px] text-slate-700 font-bold leading-none">متوافق مع الأنظمة السعودية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Action Button (FAB) */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-amber-500 text-slate-950 rounded-full shadow-[0_10px_25px_rgba(251,191,36,0.4)] flex items-center justify-center border-2 border-white/20 active:scale-95 transition-all group"
        aria-label="Toggle Menu"
      >
        <AnimatePresence mode="wait">
          {mobileOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-0.5"
            >
              <Menu className="w-7 h-7" />
              <span className="text-[10px] font-black uppercase leading-none">القائمة</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-md"
          />
        )}
      </AnimatePresence>
    </>
  );
}