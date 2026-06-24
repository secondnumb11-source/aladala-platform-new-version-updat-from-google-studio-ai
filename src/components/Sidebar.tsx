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

  // Using a separate shield icon import inside to avoid large top level
  

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
        fixed right-0 top-0 h-screen
        w-[220px]
        bg-[#1a2744]
        flex flex-col
        overflow-y-auto
        z-50
        border-l border-[#243460]
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `} dir="rtl">
        
        {/* الشعار */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#243460] shrink-0">
          <div className="w-8 h-8 bg-[#c9a84c] rounded-lg flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-[#1a2744]" />
          </div>
          <div>
            <p className="text-white font-black text-sm">{officeName}</p>
            <p className="text-[#8899bb] text-[10px]">إدارة مكاتب المحاماة</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {sections.map((cat) => {
            const allowedItems = allItems.filter(item => {
              if (!cat.itemIds.includes(item.id)) return false;
              if (item.isAdminOnly && selectedRole !== 'admin') return false;
              if (currentUser?.role === 'client' && item.id !== 'client-portal') return false;
              return true;
            });

            if (allowedItems.length === 0) return null;

            return (
              <div key={cat.title} className="mb-4">
                <p className="px-4 pt-3 pb-1 text-[#c9a84c] text-[10px] font-bold uppercase tracking-widest">
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
                            w-full flex items-center justify-between px-4 py-2 mx-1 rounded-lg
                            ${isActive 
                              ? 'bg-[#c9a84c] text-[#1a2744] text-xs font-bold' 
                              : 'text-[#8899bb] hover:text-white hover:bg-[rgba(255,255,255,0.07)] text-xs font-medium transition-all duration-150'
                            }
                          `}
                          style={{ width: 'calc(100% - 8px)' }}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.name.replace('AI', '').trim()}</span>
                          </div>
                          {item.children && (
                            <div className="shrink-0">
                              {aiExpanded && isActive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          )}
                        </button>
                        
                        {/* Render Subitems for AI */}
                        {item.children && aiExpanded && (
                          <div className="mr-6 ml-2 mt-1 mb-2 space-y-0.5 border-r border-[#243460] pr-2">
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
                                    w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-right
                                    ${isChildActive 
                                      ? 'text-[#c9a84c] text-[11px] font-bold' 
                                      : 'text-[#8899bb] hover:text-white hover:bg-[rgba(255,255,255,0.05)] text-[11px] font-medium transition-all duration-150'
                                    }
                                  `}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] shrink-0 opacity-50" />
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
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-[#c9a84c] text-[#1a2744] p-3 rounded-full shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>
      
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
