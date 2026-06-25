import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Briefcase, Users, Bot, CheckSquare, FileText, 
  Menu, UserCheck, Settings, Scale, Gavel, Brain, Clock, Wallet, 
  MessageSquare, BookOpen, Landmark, Compass, Link2, FileSpreadsheet,
  Search, Calculator, ChevronDown, ChevronUp
} from 'lucide-react';
import { Case } from '@/types';

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
  isAdminOnly?: boolean;
  children?: { id: string; name: string }[];
}

export default function Sidebar({
  currentTab,
  onNavigate,
  selectedRole,
  onRoleChange,
  currentUser
}: SidebarProps) {
  const [officeName, setOfficeName] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('office_name') || 'العدالة' : 'العدالة';
  });
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(currentTab.startsWith('ai-') || currentTab === 'ai');

  useEffect(() => {
    const handleStorageChange = () => {
      setOfficeName(localStorage.getItem('office_name') || 'العدالة');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const allItems: SidebarItem[] = [
    { id: 'dashboard', name: 'لوحة المعلومات الرئيسية', icon: LayoutDashboard },
    { id: 'cases', name: 'إدارة القضايا', icon: Briefcase },
    { id: 'case-judgments', name: 'الأحكام وضبط الجلسات', icon: Scale },
    { id: 'executions', name: 'طلبات التنفيذ', icon: Scale },
    { id: 'calendar', name: 'تقويم مواعيد الجلسات', icon: BookOpen },
    
    { id: 'clients', name: 'سجل العملاء والموكلين', icon: Users },
    { id: 'client-portal', name: 'بوابة العملاء', icon: UserCheck },
    { id: 'agencies', name: 'الوكالات القضائية', icon: FileSpreadsheet },
    { id: 'whatsapp', name: 'إشعارات ومراسلات العملاء', icon: MessageSquare },
    
    { id: 'employees-data', name: 'بيانات الموظفين', icon: Users },
    { id: 'performance', name: 'مؤشرات الأداء KPI’s', icon: Briefcase },
    { id: 'tasks', name: 'المهام وتوزيع الأعمال', icon: CheckSquare },
    
    { id: 'saudi-hub', name: 'بوابة الخدمات الحكوميه', icon: Landmark },
    { id: 'smart-services', name: 'خدمات المسانده والتحقق', icon: Bot },
    { id: 'court-map', name: 'دليل المحاكم', icon: Compass },
    { id: 'documents', name: 'أرشيف المستندات', icon: FileText },

    { id: 'najiz', name: 'الربط مع ناجز', icon: Link2 },
    { id: 'audit-logs', name: 'سجل العمليات', icon: FileText },
    { id: 'settings', name: 'الاعدادات', icon: Settings },

    { id: 'ai', name: 'المساعد القانوني', icon: Bot, children: [
      { id: 'ai-drafting', name: 'صياغة اللوائح والمذكرات' },
      { id: 'ai-analysis', name: 'المحلل الذكي' },
      { id: 'ai-contract_audit', name: 'صياغة العقود' },
      { id: 'ai-finance-vat', name: 'إصدار الفواتير' },
      { id: 'ai-judicial-calc', name: 'الحاسبة القضائية' },
      { id: 'ai-deadlines', name: 'حاسبة المهل والمدد النظاميه' },
      { id: 'ai-swot', name: 'تحليل المخاطر SWOT' },
      { id: 'ai-finance', name: 'المحاسب القانوني AI' },
      { id: 'ai-zatca', name: 'الفواتير المعتمده ZATCA' },
      { id: 'ai-search', name: 'مكتبة الانظمه والبحث الذكي' },
    ]},
  ];

  const sections = [
    {
      title: 'المنظومة القضائية',
      itemIds: ['dashboard', 'cases', 'case-judgments', 'executions', 'calendar']
    },
    {
      title: 'العملاء والشؤون الخارجية',
      itemIds: ['clients', 'client-portal', 'agencies', 'whatsapp']
    },
    {
      title: 'فريق العمل',
      itemIds: ['employees-data', 'performance', 'tasks']
    },
    {
      title: 'الذكاء الاصطناعي',
      itemIds: ['ai']
    },
    {
      title: 'خدمات مساندة',
      itemIds: ['saudi-hub', 'smart-services', 'court-map', 'documents']
    },
    {
      title: 'الإعدادات',
      itemIds: ['najiz', 'audit-logs', 'settings']
    },
  ];

  return (
    <>
      <aside className={`
        fixed right-0 top-0 h-full w-72
        bg-gradient-to-b from-[#050e21] to-[#020c1a]
        border-l border-[#1e3a5f]
        flex flex-col
        shadow-[4px_0_30px_rgba(0,0,0,0.5)]
        z-50
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `} dir="rtl">
        
        {/* رأس الشريط الجانبي */}
        <div className="p-5 border-b border-[#1e3a5f] bg-gradient-to-l from-[rgba(201,168,76,0.05)] to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="
              w-10 h-10 rounded-xl
              bg-gradient-to-br from-[#c9a84c] to-[#a67c30]
              flex items-center justify-center
              shadow-[0_4px_12px_rgba(201,168,76,0.4)]
            ">
              <Scale className="w-5 h-5 text-[#020c1a]" />
            </div>
            <div>
              <h1 className="text-[#f5d76e] font-black text-base">{officeName || 'العدالة'}</h1>
              <p className="text-[#475569] text-xs">إدارة مكاتب المحاماة</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-6 sidebar-scrollbar">
          {sections.map((cat, index) => {
            const allowedItems = allItems.filter(item => {
              if (!cat.itemIds.includes(item.id)) return false;
              if (item.isAdminOnly && selectedRole !== 'admin') return false;
              if (currentUser?.role === 'client' && item.id !== 'client-portal') return false;
              return true;
            });

            if (allowedItems.length === 0) return null;

            return (
              <div key={cat.title}>
                {index !== 0 && <div className="mx-4 my-2 border-t border-[#1e3a5f] opacity-50" />}
                <p className="px-6 py-2 text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest">
                  {cat.title}
                </p>
                <div className="space-y-0.5">
                  {allowedItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id || (item.children && item.children.some(child => currentTab === child.id));

                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => {
                            if (item.children) {
                              setAiExpanded(!aiExpanded);
                              if (!isActive && !aiExpanded) {
                                onNavigate(item.id);
                              }
                            } else {
                              onNavigate(item.id);
                              setMobileOpen(false);
                            }
                          }}
                          className={`
                            ${isActive 
                              ? 'flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl mx-2 my-0.5 bg-gradient-to-l from-[rgba(201,168,76,0.15)] to-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.2)] text-[#f5d76e] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] w-[calc(100%-16px)]' 
                              : 'flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl mx-2 my-0.5 text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200 cursor-pointer group w-[calc(100%-16px)]'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-sm">{item.name.replace('AI', '').trim()}</span>
                          </div>
                          {item.children && (
                            <div className="shrink-0">
                              {aiExpanded && isActive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          )}
                        </button>
                        
                        {/* Render Subitems for AI */}
                        {item.children && aiExpanded && (
                          <div className="mr-6 ml-2 mt-1 mb-2 space-y-0.5 border-r border-[#1e3a5f] pr-2">
                            {item.children.map(child => {
                              const isChildActive = currentTab === child.id;
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => {
                                    onNavigate(child.id);
                                    setMobileOpen(false);
                                  }}
                                  className={`
                                    w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-right
                                    ${isChildActive 
                                      ? 'text-[#f5d76e] text-xs font-bold' 
                                      : 'text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] text-xs font-medium transition-all duration-150'
                                    }
                                  `}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChildActive ? 'bg-[#c9a84c]' : 'bg-[#1e3a5f]'}`} />
                                  <span>{child.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <button 
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-[#c9a84c] text-[#020c1a] p-3 rounded-full shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>
      
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" 
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}