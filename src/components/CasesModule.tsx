/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { List } from 'react-window';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Cpu, 
  FileText, 
  DollarSign, 
  Clock, 
  Share2,
  Trash2,
  Eye,
  Check,
  ChevronLeft,
  Paperclip,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Download,
  Users,
  User,
  Edit2,
  Calendar,
  Briefcase,
  Layers,
  X,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Building2,
  Scale,
  Zap,
  Bot,
  Gavel,
  Sparkles,
  Settings,
  History,
  Archive,
  MoreVertical,
  BellRing,
  Mail,
  FileDown,
  LayoutDashboard,
  Minimize2,
  Maximize2,
  Send, 
  Printer,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveCard } from './InteractiveCard';
import { Case, Client, Attachment } from '@/types';
import { useAdaptiveContrast } from '../utils/themeUtils';

export const getCaseDocumentTags = (c: Case): string[] => {
  const tags: string[] = ['مفهرس_آلياً'];
  
  if (c.powerOfAttorneyNumber) {
    tags.push('وكالة_شرعية');
  }
  if (c.category === 'commercial') {
    tags.push('عقد_تأسيس', 'مستند_تجاري');
  } else if (c.category === 'labor') {
    tags.push('عقد_عمل');
  } else if (c.category === 'personal_status') {
    tags.push('صك_ورثة');
  } else if (c.category === 'civil') {
    tags.push('عقد_مدني');
  }

  if (c.stage === 'appeals') {
    tags.push('لائحة_اعتراضية');
  } else if (c.stage === 'execution') {
    tags.push('سند_تنفيذي');
  } else if (c.stage === 'litigation') {
    tags.push('مذكرة_دعوى');
  }

  if (c.status === 'final_judgment' || c.status === 'judgment_issued' || c.status === 'primary_judgment') {
    tags.push('قرار_حكم');
  }

  if (c.attachments && c.attachments.length > 0) {
    tags.push('مستند_رسمي');
    c.attachments.forEach(att => {
      const name = att.fileName ? att.fileName.toLowerCase() : '';
      if (name.includes('حكم') || name.includes('قرار') || name.includes('judgment')) {
        tags.push('قرار_حكم');
      }
      if (name.includes('مذكرة') || name.includes('لائحة') || name.includes('brief') || name.includes('pleading')) {
        tags.push('مذكرة_دعوى');
      }
      if (name.includes('وكالة') || name.includes('poa')) {
        tags.push('وكالة_شرعية');
      }
      if (name.includes('تقرير') || name.includes('report')) {
        tags.push('تقرير_خبير');
      }
    });
  }

  if (c.courtName) {
    tags.push(`محكمة_${c.courtName.replace(/\s+/g, '_')}`);
    if (c.courtName.includes('التجارية')) tags.push('قضاء_تجاري');
    if (c.courtName.includes('العامة')) tags.push('قضاء_عام');
    if (c.courtName.includes('الأحوال')) tags.push('قضاء_أحوال');
    if (c.courtName.includes('العمالية')) tags.push('قضاء_عمالي');
    if (c.courtName.includes('التنفيذ')) tags.push('تنفيذ_عدلي');
  }

  return Array.from(new Set(tags));
};

interface CaseClassificationTagsProps {
  category: string;
  status: string;
  isHighContrast?: boolean;
}

export const CaseClassificationTags: React.FC<CaseClassificationTagsProps> = ({ category, status, isHighContrast }) => {
  let categoryLabel = 'استشارات عامة';
  let categoryColor = 'bg-slate-100 border-slate-900 text-slate-950 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold';
  
  if (category === 'commercial') {
    categoryLabel = 'تجاري';
    categoryColor = 'bg-blue-100 border-blue-400 text-blue-950';
  } else if (category === 'labor') {
    categoryLabel = 'عمالي';
    categoryColor = 'bg-purple-100 border-purple-400 text-purple-950';
  } else if (category === 'civil') {
    categoryLabel = 'مدني';
    categoryColor = 'bg-sky-100 border-sky-400 text-sky-950';
  } else if (category === 'criminal') {
    categoryLabel = 'جنائي';
    categoryColor = 'bg-rose-100 border-rose-400 text-rose-950';
  } else if (category === 'personal_status') {
    categoryLabel = 'أحوال شخصية';
    categoryColor = 'bg-violet-100 border-violet-400 text-violet-950';
  } else if (category === 'administrative') {
    categoryLabel = 'إداري';
    categoryColor = 'bg-teal-100 border-teal-400 text-teal-950';
  } else if (category === 'execution') {
    categoryLabel = 'تنفيذ قضائي';
    categoryColor = 'bg-cyan-100 border-cyan-400 text-cyan-950';
  }

  // Emerald for Active, Amber for Review
  let statusLabel = 'تحت الدراسة';
  let statusColor = 'bg-slate-100 border-slate-900 text-slate-950 dark:bg-slate-800/80';
  
  if (status === 'active' || status === 'judgment_issued') {
    statusLabel = 'نشط جاري';
    statusColor = 'bg-emerald-150 border-emerald-500 text-emerald-950 font-black shadow-sm';
  } else if (status === 'under_review' || status === 'under_study' || status === 'appeal') {
    statusLabel = 'قيد المراجعة';
    statusColor = 'bg-amber-100 border-amber-500 text-amber-950 font-black shadow-sm';
  } else if (status === 'closed' || status === 'archived') {
    statusLabel = 'مؤرشف ومغلق';
    statusColor = 'bg-gray-100 border-gray-400 text-gray-900';
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1.5 font-sans" dir="rtl">
      <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border transition-all inline-flex items-center gap-1 shrink-0 ${categoryColor}`}>
        🏷️ {categoryLabel}
      </span>
      <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border transition-all inline-flex items-center gap-1 shrink-0 ${statusColor}`}>
        ⚖️ {statusLabel}
      </span>
    </div>
  );
};

export const getLeadLawyerName = (c: Case): string => {
  if (c.lead_lawyer_id) {
    if (c.lead_lawyer_id.includes('البقمي') || c.lead_lawyer_id === 'baqami') return 'المحامي أحمد البقمي';
    if (c.lead_lawyer_id.includes('القحطاني') || c.lead_lawyer_id === 'qahtani') return 'د. عادل القحطاني';
    if (c.lead_lawyer_id.includes('الغامدي') || c.lead_lawyer_id === 'ghamdi') return 'أ. خالد الغامدي';
    return c.lead_lawyer_id;
  }
  const hash = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lawyers = ['المحامي أحمد البقمي', 'د. عادل القحطاني', 'أ. خالد الغامدي'];
  return lawyers[hash % lawyers.length];
};

interface CasesModuleProps {
  cases: Case[];
  clients: Client[];
  selectedRole: string;
  onUpdateState: (type: string, data: any) => void;
  onSelectCase: (caseObj: Case | null) => void;
  selectedCase: Case | null;
  archivedNotice?: { count: number; onRestore: () => void; onClose: () => void };
}

import { useRenderPerformance } from '../lib/PerformanceOptimizer';

export default React.memo(function CasesModule({
  cases,
  clients,
  selectedRole,
  onUpdateState,
  onSelectCase,
  selectedCase,
  archivedNotice
}: CasesModuleProps) {
  useRenderPerformance('CasesModule', 25);

  
  const [themeTick, setThemeTick] = useState(Date.now());
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('high-contrast-mode');
    }
    return false;
  });

  useEffect(() => {
    const handleThemeEvent = () => {
      setThemeTick(Date.now());
      setIsHighContrast(document.documentElement.classList.contains('high-contrast-mode'));
    };
    window.addEventListener('adalah-advanced-config-updated', handleThemeEvent);
    return () => window.removeEventListener('adalah-advanced-config-updated', handleThemeEvent);
  }, []);

  const getInteractiveCaseStyles = (category: string, status: string) => {
    let arabicCategoryName = 'أخرى / عامة';
    switch (category) {
      case 'commercial': arabicCategoryName = 'تجاري مالية ومصرفية 🏛️'; break;
      case 'labor': arabicCategoryName = 'عمالية وتأمين واحتساب 💼'; break;
      case 'civil': arabicCategoryName = 'مدنية حقوقية 📜'; break;
      case 'criminal': arabicCategoryName = 'جزائية جنائية 🛡️'; break;
      case 'personal_status': arabicCategoryName = 'أحوال شخصية وإرث ⚖️'; break;
      case 'administrative': arabicCategoryName = 'إدارية وديوان مظالم 🏛️'; break;
      case 'financial': arabicCategoryName = 'مالية وضريبية 🪙'; break;
      case 'execution': arabicCategoryName = 'محكمة التنفيذ مادة ٣٤ ⚡'; break;
      default: arabicCategoryName = 'عامة واستشارات 📁'; break;
    }

    let arabicStatusName = 'قيد الدراسة';
    let statusColorClass = 'text-yellow-400 bg-slate-900 border-yellow-500/40'; // Default Golden
    let IconComponent = FileText;
    let iconAnimation = '';

    switch (status) {
      case 'under_study':
        arabicStatusName = 'قيد الدراسة 🖋️';
        statusColorClass = 'text-white font-black font-bold border-slate-500/20 bg-slate-600/5';
        IconComponent = FileText;
        break;
      case 'under_review':
        arabicStatusName = 'قيد النظر ⚖️';
        statusColorClass = 'text-[#facc15] border-[#facc15]/20 bg-[#facc15]/5';
        IconComponent = Scale;
        break;
      case 'struck_off':
        arabicStatusName = 'شطبت 🗑️';
        statusColorClass = 'text-gray-100 font-bold border-gray-500/20 bg-gray-500/5';
        IconComponent = Trash2;
        break;
      case 'appeal':
        arabicStatusName = 'استئناف ⤴️';
        statusColorClass = 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5';
        IconComponent = ArrowUpRight;
        break;
      case 'execution':
        arabicStatusName = 'تنفيذ ⚡';
        statusColorClass = 'text-orange-400 border-orange-500/20 bg-orange-500/5';
        IconComponent = Zap;
        break;
      case 'primary_judgment':
        arabicStatusName = 'حكم ابتدائي 📜';
        statusColorClass = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
        IconComponent = CheckCircle2;
        break;
      case 'final_judgment':
        arabicStatusName = 'حكم قطعي ✅';
        statusColorClass = 'text-emerald-600 border-emerald-600/20 bg-emerald-600/10';
        IconComponent = ShieldCheck;
        break;
      case 'postponed':
        arabicStatusName = 'مؤجلة ⏳';
        statusColorClass = 'text-rose-400 border-rose-500/20 bg-rose-500/5';
        IconComponent = Clock;
        break;
      case 'closed':
        arabicStatusName = 'ملف مقفل منتهي 🔒';
        statusColorClass = 'text-white font-black font-bold border-slate-500/20 bg-slate-500/5';
        IconComponent = Archive;
        break;
      case 'active':
        arabicStatusName = 'نشطة جارية ⚖️';
        statusColorClass = 'text-[#facc15] border-[#facc15]/20 bg-[#facc15]/5';
        IconComponent = Briefcase;
        break;
      default:
        arabicStatusName = 'قيد المراجعة';
        statusColorClass = 'text-[#facc15] bg-slate-900 border-[#facc15]/40';
        IconComponent = FileText;
    }

    let categoryBadgeColor = 'bg-slate-900 border-slate-800 text-white font-black font-bold';
    let hoverBorderAccent = 'group-hover/card:border-[#facc15]/50 duration-500';
    let gradientBg = 'from-[#facc15]/5 to-transparent';
    let sidebarColor = 'bg-[#facc15]'; // Default sidebar color
    let CategoryIcon = FileText;

    if (status === 'active' || status === 'new') {
      sidebarColor = 'bg-[#facc15] shadow-[0_0_10px_rgba(250,204,21,0.5)]'; // Gold
    } else if (status === 'closed') {
      sidebarColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'; // Red
    } else if (status === 'judgment_issued') {
      sidebarColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'; // Green
    }

    if (category === 'commercial') {
      CategoryIcon = Building2;
      categoryBadgeColor = 'bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold border-amber-500/20';
      gradientBg = 'from-amber-600/10 via-transparent to-transparent';
    } else if (category === 'criminal') {
      CategoryIcon = ShieldAlert;
      categoryBadgeColor = 'bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold border-rose-500/20';
      gradientBg = 'from-rose-600/10 via-transparent to-transparent';
    } else if (category === 'labor') {
      CategoryIcon = Users;
      categoryBadgeColor = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      gradientBg = 'from-teal-600/10 via-transparent to-transparent';
    } else if (category === 'administrative') {
      CategoryIcon = Scale;
      categoryBadgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      gradientBg = 'from-indigo-600/10 via-transparent to-transparent';
    } else if (category === 'personal_status') {
      CategoryIcon = Heart;
      categoryBadgeColor = 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      gradientBg = 'from-pink-600/10 via-transparent to-transparent';
    } else if (category === 'execution') {
      CategoryIcon = Zap;
      categoryBadgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      gradientBg = 'from-orange-600/10 via-transparent to-transparent';
    }

    return { 
      arabicCategoryName, 
      arabicStatusName, 
      statusColorClass, 
      IconComponent, 
      iconAnimation, 
      categoryBadgeColor,
      hoverBorderAccent,
      gradientBg,
      sidebarColor,
      CategoryIcon
    };
  };

  const getCaseActivityTimeline = (c: Case) => {
    const timeline: any[] = [];
    
    // 1. Filing
    timeline.push({
      date: c.createdAt || '2026-05-15',
      time: '08:30 ص',
      title: 'قيد الدعوى بنظام منصة العدالة 🆕',
      desc: `تم تسجيل القضية برقم ${c.caseNumber} وإسنادها إلى الدائرة القضائية المختصة بـ ${c.courtName || 'المحكمة التجارية بالرياض'}.`,
      badge: 'النظام الآلي',
      color: 'border-blue-500/30 text-blue-400 bg-blue-500/10'
    });

    // Add Real History Entries
    if (c.history && c.history.length > 0) {
      c.history.forEach(entry => {
        timeline.push({
          date: entry.timestamp.split('T')[0],
          time: new Date(entry.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          title: entry.field === 'status' ? `تحديث حالة القضية: ${entry.newValue}` : entry.field === 'nextSessionDate' ? 'تعديل موعد الجلسة' : entry.notes || 'تعديل في ملف القضية',
          desc: `${entry.notes || ''} (بواسطة: ${entry.userName})${entry.isAiAssisted ? ' [تم بمساعدة الذكاء الاصطناعي] 🧠' : ''}`,
          badge: entry.isAiAssisted ? 'ذكاء اصطناعي' : 'تحديث بشري',
          color: entry.isAiAssisted ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
        });
      });
    }

    // 2. Attorney approval
    timeline.push({
      date: c.createdAt ? new Date(new Date(c.createdAt).getTime() + 86400000).toISOString().split('T')[0] : '2026-05-16',
      time: '11:15 ص',
      title: 'إيداع الوكالة القانونية والتمثيل ⚖️',
      desc: `تم توثيق الرقم الموحد للقرارات والوكالات واستكمال مطابقة الهيئة العامة للمنافسة. الوكيل الممارس: مكتب المحاسبة والاستشارات.`,
      badge: 'التحقق العدلي',
      color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
    });

    // 3. Status changes
    if (c.status === 'active' || c.status === 'pending_session' || c.status === 'judgment_issued' || c.status === 'closed') {
      timeline.push({
        date: '2026-05-24',
        time: '14:20 م',
        title: 'تفعيل الترافع المكتوب وإخطار الخصوم 🔍',
        desc: `توجيه إشعار رسمي آلي عبر بوابة أبشر للرمز الثاني: ${c.opponentName || 'طرف الخصومة المتجاوز'}.`,
        badge: 'مستوى الترافع',
        color: 'border-amber-500/30 text-[#fbbf24] bg-amber-500/10'
      });
    }

    // 4. Attachments logs if any
    if (c.attachmentsCount && c.attachmentsCount > 0) {
      timeline.push({
        date: '2026-05-28',
        time: '16:05 م',
        title: 'تنظيم المستندات وإيداع مذكرات المراجعة 📁',
        desc: `تم إلحاق ملفات دفاع بمجلد الأرشيف لضمان أسبقية الدفوع ومصنفات المستوعب.`,
        badge: 'الملفات المرفقة',
        color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
      });
    }

    // 5. Current active session or next session preparation
    if (c.nextSessionDate) {
      timeline.push({
        date: '2026-06-01',
        time: '09:00 ص',
        title: 'جدولة موعد الجلسة الاستباقية 🏛️',
        desc: `تثبيت الجلسة القادمة بتاريخ ${c.nextSessionDate} الساعة ${c.nextSessionTime || '09:00 ص'} للمرافعة والاعتراض.`,
        badge: 'الجلسات',
        color: 'border-purple-500/30 text-purple-400 bg-purple-500/10'
      });
    }

    // 6. If Closed / Judgment Issued
    if (c.status === 'judgment_issued') {
      timeline.push({
        date: c.judgment_date || '2026-06-05',
        time: '13:00 م',
        title: 'صدور الحكم القضائي الابتدائي 📜',
        desc: `نطقت الدائرة بفض الخصومة لصالح الموكل: ${c.clientName}. منطوق الحكم: "${c.judgment_summary || 'ثبوت الإخلال بالعقد والتعويض المالي العادل'}". تم فتح مهلة الاستئناف لـ 30 يوماً.`,
        badge: 'منطوق الحكم',
        color: 'border-rose-500/30 text-rose-400 bg-rose-500/10'
      });
    } else if (c.status === 'closed') {
      timeline.push({
        date: '2026-06-06',
        time: '12:00 م',
        title: 'أرشفة الملف وإغلاق القضية نهائياً 🔒',
        desc: 'اكتملت جميع الدفعات وتحديثات بوابة ناجز وتصفية الحسابات والاتعاب بنجاح تام والمباشرة بإقفال وسجل الأثر المالي.',
        badge: 'الأرشفة والإنهاء',
        color: 'border-slate-500/30 text-white font-black font-bold bg-slate-500/10'
      });
    }

    return timeline;
  };

  const [summaryVisibleIds, setSummaryVisibleIds] = useState<string[]>([]);
  const toggleSummary = (caseId: string) => {
    setSummaryVisibleIds(prev => 
      prev.includes(caseId) ? prev.filter(id => id !== caseId) : [...prev, caseId]
    );
  };

  const getStatusKineticStyles = (status: string) => {
    switch (status) {
      case 'active': return { glow: 'status-active-glow', text: 'progress-status-text-green' };
      case 'closed': return { glow: 'status-closed-glow', text: 'progress-status-text-red' };
      case 'new': return { glow: 'status-new-glow', text: 'progress-status-text-blue' };
      case 'judgment_issued': return { glow: 'status-judgment-glow', text: 'progress-status-text-teal' };
      case 'pending_session': return { glow: 'status-pending-glow', text: 'progress-status-text-amber' };
      case 'appeals': return { glow: 'status-appeals-glow', text: 'progress-status-text-indigo' };
      case 'execution': return { glow: 'status-execution-glow', text: 'progress-status-text-orange' };
      default: return { glow: 'status-review-glow', text: 'progress-status-text-purple' };
    }
  };

  // Electronic Archive and Document Vault States
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSessionFilter, setLastSessionFilter] = useState('');
  const [nextAppointmentFilter, setNextAppointmentFilter] = useState('');
  const [selectedDocTag, setSelectedDocTag] = useState('all');
  const [activityLogCaseId, setActivityLogCaseId] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [archiveTypeFilter, setArchiveTypeFilter] = useState('all');

  const allDocuments = React.useMemo(() => {
    const docs: any[] = [];
    cases.forEach(c => {
      if (c.attachments) {
        c.attachments.forEach((a: Attachment) => {
          docs.push({
            ...a,
            caseNumber: c.caseNumber,
            caseName: c.caseName,
            category: c.category
          });
        });
      }
    });
    return docs;
  }, [cases]);

  const filteredArchiveDocuments = allDocuments.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(archiveSearchTerm.toLowerCase()) || 
                      doc.caseNumber.includes(archiveSearchTerm) ||
                      doc.caseName.toLowerCase().includes(archiveSearchTerm.toLowerCase());
    const matchType = archiveTypeFilter === 'all' || doc.type === archiveTypeFilter;
    return matchSearch && matchType;
  });

  const DocumentVaultModal = () => (
    <AnimatePresence>
      {isArchiveModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsArchiveModalOpen(false)}></div>
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl h-full max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-amber-500 rounded-2xl shadow-lg">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">الأرشيف السحابي والأرشفة الإلكترونية</h2>
                  <p className="text-xs text-slate-700 font-bold mt-1">إدارة مركزية لكافة المذكرات، اللوائح، والأحكام القضائية الصادرة.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-3 text-white font-black font-bold rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="p-6 bg-white border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white font-black font-bold" />
                <input 
                  type="text" 
                  placeholder="البحث في الأرشيف (برقم القضية، اسم الموكل، أو مسمى المستند)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={archiveSearchTerm}
                  onChange={(e) => setArchiveSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                value={archiveTypeFilter}
                onChange={(e) => setArchiveTypeFilter(e.target.value)}
              >
                <option value="all">كافة أنواع المستندات</option>
                <option value="pdf">لوائح ومذكرات (PDF)</option>
                <option value="docx">مسودات (DOCX)</option>
                <option value="image">صور وأدلة (Image)</option>
              </select>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              {filteredArchiveDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-white font-bold" />
                  </div>
                  <p className="text-slate-700 font-bold">لا توجد نتائج مطابقة لبحثك في الأرشيف.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArchiveDocuments.map((doc, idx) => (
                    <div key={idx} className="group bg-white border border-slate-200 p-5 rounded-3xl transition-all duration-300 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full -mr-12 -mt-12 transition-colors"></div>
                      
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className={`p-3 rounded-2xl ${
                          doc.type === 'pdf' ? 'bg-rose-50 text-rose-500' : 
                          doc.type === 'docx' ? 'bg-blue-50 text-blue-500' : 
                          'bg-emerald-50 text-emerald-500'
                        }`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <button className="p-2 text-white font-bold transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2 relative z-10">
                        <h4 className="font-black text-slate-900 text-sm line-clamp-2 leading-relaxed">{doc.name}</h4>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.size}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-400 font-black border border-amber-100">
                            #{doc.caseNumber}
                          </span>
                        </div>
                        <p className="text-[10px] text-white font-black font-bold font-bold mt-2 truncate">القضية: {doc.caseName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-700 font-bold">إجمالي المستندات المكتشفة: {filteredArchiveDocuments.length} مستند</span>
              <button 
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black transition-opacity flex items-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                طباعة تقرير الفهرسة
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [expandedCaseModal, setExpandedCaseModal] = useState<Case | null>(null);
  const [isLegalReviewMode, setIsLegalReviewMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [reportModalCase, setReportModalCase] = useState<Case | null>(null);
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lawyerFilter, setLawyerFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    return (localStorage.getItem('adalah-cases-view-mode') as 'grid' | 'table') || 'grid';
  });

  const [cardScale, setCardScale] = useState(() => {
    return parseFloat(localStorage.getItem('adalah-card-scale') || '1');
  });

  const [gridDensity, setGridDensity] = useState<'compact' | 'relaxed'>(() => {
    return (localStorage.getItem('adalah-grid-density') as 'compact' | 'relaxed') || 'relaxed';
  });

  const [cardTransitionSpeed, setCardTransitionSpeed] = useState(() => {
    return parseFloat(typeof window !== 'undefined' ? (localStorage.getItem('adalah-card-transition-duration') || '0.4') : '0.4');
  });

  useEffect(() => {
    const handleTransitionUpdate = () => {
      setCardTransitionSpeed(parseFloat(localStorage.getItem('adalah-card-transition-duration') || '0.4'));
    };
    window.addEventListener('adalah-card-transition-updated', handleTransitionUpdate);
    return () => {
      window.removeEventListener('adalah-card-transition-updated', handleTransitionUpdate);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('adalah-cases-view-mode', viewMode);
    localStorage.setItem('adalah-card-scale', cardScale.toString());
    localStorage.setItem('adalah-grid-density', gridDensity);
  }, [viewMode, cardScale, gridDensity]);

  const categories = [
    { id: 'all', label: 'الكل', icon: Layers },
    { id: 'criminal', label: 'جزائية', icon: ShieldAlert },
    { id: 'commercial', label: 'تجارية', icon: Building2 },
    { id: 'labor', label: 'عمالية', icon: Briefcase },
    { id: 'personal_status', label: 'أحوال شخصية', icon: Users },
    { id: 'administrative', label: 'إدارية', icon: Gavel },
    { id: 'financial', label: 'مالية', icon: DollarSign },
    { id: 'archived', label: 'الأرشيف', icon: Archive },
  ];

  const SummaryCharts = ({ cases }: { cases: Case[] }) => {
    // Control States for customized layout, sizes, positions and shapes
    const [chartSize, setChartSize] = useState<'tiny' | 'shrunk' | 'regular'>(() => {
      return (localStorage.getItem('adalah-charts-card-size') as any) || 'shrunk';
    });
    const [chartOrder, setChartOrder] = useState<'donut-first' | 'bar-first'>(() => {
      return (localStorage.getItem('adalah-charts-order') as any) || 'donut-first';
    });
    const [chartColorTheme, setChartColorTheme] = useState<'gold' | 'cyber' | 'emerald'>(() => {
      return (localStorage.getItem('adalah-charts-theme') as any) || 'gold';
    });
    const [chartVizType, setChartVizType] = useState<'bar' | 'area' | 'line'>(() => {
      return (localStorage.getItem('adalah-charts-viz-type') as any) || 'bar';
    });

    useEffect(() => {
      localStorage.setItem('adalah-charts-card-size', chartSize);
      localStorage.setItem('adalah-charts-order', chartOrder);
      localStorage.setItem('adalah-charts-theme', chartColorTheme);
      localStorage.setItem('adalah-charts-viz-type', chartVizType);
    }, [chartSize, chartOrder, chartColorTheme, chartVizType]);

    // Stable memoized data to prevent any dynamic automatic dynamic reloading
    const data = React.useMemo(() => {
      const categoriesList = ['commercial', 'labor', 'civil', 'criminal', 'personal_status', 'administrative', 'financial', 'execution', 'other'];
      return categoriesList.map(cat => {
        const catCases = cases.filter(c => c.category === cat && !c.archived);
        const catClosed = cases.filter(c => c.category === cat && (c.status === 'closed' || c.archived)).length;
        return {
          name: cat,
          active: catCases.filter(c => c.status !== 'closed' && !c.archived).length,
          closed: catClosed,
          total: catCases.length + catClosed
        };
      }).filter(d => d.total > 0);
    }, [cases]);

    const activeTotal = React.useMemo(() => cases.filter(c => c.status !== 'closed' && !c.archived).length, [cases]);
    const closedTotal = React.useMemo(() => cases.filter(c => c.status === 'closed' || c.archived).length, [cases]);

    // Style colors based on Selected Theme to guarantee high contrast and vivid beauty
    const colors = React.useMemo(() => {
      if (chartColorTheme === 'cyber') {
        return {
          active: '#38bdf8', // Neon cyan
          closed: '#f43f5e', // Neon pink/red
          bgGlow: 'from-cyan-500/10 to-rose-500/10',
          border: 'border-cyan-500/30'
        };
      } else if (chartColorTheme === 'emerald') {
        return {
          active: '#10b981', // Neon Emerald
          closed: '#a78bfa', // Bright Violet
          bgGlow: 'from-emerald-500/10 to-purple-500/10',
          border: 'border-emerald-500/30'
        };
      } else { // 'gold'
        return {
          active: '#ffff00', // Sizzling bright yellow
          closed: '#ff9f1c', // Vivid safety orange
          bgGlow: 'from-amber-500/10 to-orange-500/10',
          border: 'border-amber-500/30'
        };
      }
    }, [chartColorTheme]);

    const donutData = React.useMemo(() => [
      { name: 'نشطة', value: activeTotal, color: colors.active },
      { name: 'مغلقة/مؤرشفة', value: closedTotal, color: colors.closed }
    ], [activeTotal, closedTotal, colors]);

    if (activeTotal === 0 && closedTotal === 0) return null;

    // Responsive container height map
    const vizHeight = chartSize === 'tiny' ? 75 : chartSize === 'shrunk' ? 110 : 180;

    const renderDonutCard = () => (
      <div key="donut" className="bg-[#050e21]/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300">
        <h3 className="text-xs font-black text-white mb-2 uppercase tracking-widest relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          توزيع النزاعات
        </h3>
        <div style={{ height: `${vizHeight}px`, width: '100%', minWidth: 0 }} className="relative z-10 transition-all duration-300">
          <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" key={themeTick}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartSize === 'tiny' ? 20 : chartSize === 'shrunk' ? 32 : 55}
                  outerRadius={chartSize === 'tiny' ? 32 : chartSize === 'shrunk' ? 50 : 75}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={false} // Prevents repeated dynamic reloads
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1.5}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: '900', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex gap-4 mt-2 relative z-10 p-1.5 px-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-white">نشطة</span>
            <span className="text-sm font-extrabold" style={{ color: colors.active }}>{activeTotal}</span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-white">مؤرشفة</span>
            <span className="text-sm font-extrabold" style={{ color: colors.closed }}>{closedTotal}</span>
          </div>
        </div>
      </div>
    );

    const lawyerPerformanceData = [
      { name: 'أحمد البقمي', cases: 14, win: 12 },
      { name: 'سارة العتيبي', cases: 10, win: 8 },
      { name: 'فهد القحطاني', cases: 8, win: 7 },
      { name: 'ليلى الحربي', cases: 12, win: 10 }
    ];



    const financialData = [
      { month: 'يناير', income: 45000 },
      { month: 'فبراير', income: 52000 },
      { month: 'مارس', income: 49000 },
      { month: 'أبريل', income: 68000 },
      { month: 'مايو', income: 72000 }
    ];

    const renderFinancialChart = () => (
      <div key="finance" className="lg:col-span-1 bg-[#050e21]/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden transition-all duration-300">
        <h3 className="text-xs font-black text-white mb-2 uppercase tracking-widest relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          التدفق النقدي والنمو المالي
        </h3>
        <div style={{ height: `${vizHeight}px`, width: '100%', minWidth: 0 }} className="relative z-10 transition-all duration-300">
          <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" key={themeTick}>
              <AreaChart data={financialData} margin={{ left: -30, right: 10 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#fff" fontSize={8} fontWeight="900" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );

    const renderBarCard = () => (
      <div key="bar" className="lg:col-span-2 bg-[#050e21]/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden transition-all duration-300">
        <h3 className="text-xs font-black text-white mb-2 uppercase tracking-widest relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <Layers className="w-4 h-4 text-indigo-400" />
          تحليل النزاعات حسب التصنيف
        </h3>
        <div style={{ height: `${vizHeight}px`, width: '100%', minWidth: 0 }} className="relative z-10 transition-all duration-300">
          <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" key={themeTick}>
              {chartVizType === 'area' ? (
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.active} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={colors.active} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.closed} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={colors.closed} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff" 
                    fontSize={10} 
                    fontWeight="900"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      const map: any = { commercial: 'تجاري', labor: 'عمالي', civil: 'مدني', criminal: 'جنائي', personal_status: 'أحوال', administrative: 'إداري', financial: 'مالي', execution: 'تنفيذ', other: 'آخر' };
                      return map[val] || val;
                    }}
                  />
                  <YAxis stroke="#ffffff" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickCount={3} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area name="نشطة" type="monotone" dataKey="active" stroke={colors.active} fillOpacity={1} fill="url(#colorActive)" isAnimationActive={false} />
                  <Area name="مغلق" type="monotone" dataKey="closed" stroke={colors.closed} fillOpacity={1} fill="url(#colorClosed)" isAnimationActive={false} />
                </AreaChart>
              ) : chartVizType === 'line' ? (
                <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff" 
                    fontSize={10} 
                    fontWeight="900"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      const map: any = { commercial: 'تجاري', labor: 'عمالي', civil: 'مدني', criminal: 'جنائي', personal_status: 'أحوال', administrative: 'إداري', financial: 'مالي', execution: 'تنفيذ', other: 'آخر' };
                      return map[val] || val;
                    }}
                  />
                  <YAxis stroke="#ffffff" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickCount={3} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Line name="نشطة" type="monotone" dataKey="active" stroke={colors.active} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line name="مغلق" type="monotone" dataKey="closed" stroke={colors.closed} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              ) : (
                <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff" 
                    fontSize={10} 
                    fontWeight="900"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      const map: any = { commercial: 'تجاري', labor: 'عمالي', civil: 'مدني', criminal: 'جنائي', personal_status: 'أحوال', administrative: 'إداري', financial: 'مالي', execution: 'تنفيذ', other: 'آخر' };
                      return map[val] || val;
                    }}
                  />
                  <YAxis stroke="#ffffff" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickCount={3} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    height={18} 
                    iconType="circle" 
                    iconSize={6}
                    wrapperStyle={{ fontSize: '10px', fontWeight: '900', color: '#fff' }} 
                  />
                  <Bar name="نشطة" dataKey="active" fill={colors.active} radius={[3, 3, 0, 0]} barSize={chartSize === 'tiny' ? 10 : chartSize === 'shrunk' ? 16 : 26} isAnimationActive={false} />
                  <Bar name="مغلق" dataKey="closed" fill={colors.closed} radius={[3, 3, 0, 0]} barSize={chartSize === 'tiny' ? 10 : chartSize === 'shrunk' ? 16 : 26} isAnimationActive={false} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );

    const orderedCards = chartOrder === 'donut-first' 
      ? [renderDonutCard(), renderBarCard(), renderFinancialChart()]
      : [renderBarCard(), renderDonutCard(), renderFinancialChart()];

    const handleExportPDF = () => {
       const printWindow = window.open('', '_blank');
       if (!printWindow) return;
       const htmlContent = `
         <!DOCTYPE html>
         <html lang="ar" dir="rtl">
         <head>
           <meta charset="UTF-8">
           <title>تقرير مؤشرات الأداء والتحليل القضائي للمكتب</title>
           <style>
             @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
             body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
             .header { text-align: center; border-bottom: 2px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
             .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
             .card { border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; background: #f8fafc; }
             .val { font-size: 24px; font-weight: 900; color: #b8860b; }
             table { width: 100%; border-collapse: collapse; margin-top: 30px; }
             th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; font-size: 13px; }
             th { background: #f1f5f9; font-weight: 900; }
             @media print { .no-print { display: none; } }
           </style>
         </head>
         <body>
           <div class="no-print">
             <button onclick="window.print()" style="background:#b8860b; color:white; border:none; padding:12px 25px; border-radius:10px; cursor:pointer; font-weight:900; font-family:'Cairo';">طـباعة التقرير الفني الشامل (PDF) 🏛️</button>
           </div>
           <div class="header">
             <h1 style="color:#b8860b; margin:0;">تقرير مؤشرات الأداء والتحليل القضائي</h1>
             <p>مركز ذكاء الأعمال بمكتب العدالة - تاريخ السحب: ${new Date().toLocaleDateString('ar-SA')}</p>
           </div>
           <div class="grid">
             <div class="card">
               <h4>إجمالي النزاعات النشطة</h4>
               <div class="val">${activeTotal} قضية جارية</div>
             </div>
             <div class="card">
               <h4>إجمالي النزاعات المغلـقة</h4>
               <div class="val">${closedTotal} ملف مؤرشف</div>
             </div>
           </div>
           
           <h3>تحليل النزاعات حسب التصنيف النظامي</h3>
           <table>
             <thead>
               <tr>
                 <th>مسمى التصنيف القضائي</th>
                 <th>نشطة</th>
                 <th>مغلـقة</th>
                 <th>الإجمالي</th>
               </tr>
             </thead>
             <tbody>
               ${data.map(d => `
                 <tr>
                   <td>${d.name}</td>
                   <td>${d.active}</td>
                   <td>${d.closed}</td>
                   <td>${d.total}</td>
                 </tr>
               `).join('')}
             </tbody>
           </table>

           <div style="margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
             تم توليد هذا التقرير آلياً وفق معايير الحوكمة والتحول الرقمي القضائي لعام 2026.
           </div>
         </body>
         </html>
       `;
       printWindow.document.write(htmlContent);
       printWindow.document.close();
    };

    return (
      <div className="space-y-4 mb-8">
        {/* Customized User Control Bar to change sizes, positions, themes and shapes dynamically */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-[#050e21]/90 rounded-2xl border border-slate-800 text-xs text-white font-bold shadow-xl relative z-25">
          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-white text-[10px]">مظهر ولون البيانات:</span>
              <div className="flex gap-1 bg-black/40 p-0.5 rounded border border-slate-750">
                <button type="button" onClick={() => setChartColorTheme('gold')} className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartColorTheme === 'gold' ? 'bg-[#ffff00] text-slate-950' : 'text-white font-bold'}`}>ذهبي</button>
                <button type="button" onClick={() => setChartColorTheme('cyber')} className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartColorTheme === 'cyber' ? 'bg-cyan-500 text-slate-950' : 'text-white font-bold'}`}>نيون</button>
                <button type="button" onClick={() => setChartColorTheme('emerald')} className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartColorTheme === 'emerald' ? 'bg-emerald-500 text-slate-950' : 'text-white font-bold'}`}>زمردي</button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-white text-[10px]">شكل المخطط:</span>
              <div className="flex gap-1 bg-black/40 p-0.5 rounded border border-slate-750">
                <button type="button" onClick={() => setChartVizType('bar')} className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartVizType === 'bar' ? 'bg-indigo-600 text-white' : 'text-white font-bold'}`}>شريطي</button>
                <button type="button" onClick={() => setChartVizType('area')} className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartVizType === 'area' ? 'bg-purple-600 text-white' : 'text-white font-bold'}`}>مساحي</button>
                <button type="button" onClick={() => setChartVizType('line')} className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartVizType === 'line' ? 'bg-rose-600 text-white' : 'text-white font-bold'}`}>خطي</button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setChartOrder(prev => prev === 'donut-first' ? 'bar-first' : 'donut-first')}
              className="px-2 py-1 bg-amber-500/10 text-[#ffff00] border border-amber-500/20 rounded text-[9.5px] font-black flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>⇆</span>
              <span>تبديل الموضع</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-white text-[10px]">حجم الكارت:</span>
              <div className="flex gap-1 bg-black/40 p-0.5 rounded border border-slate-750">
                <button type="button" onClick={() => setChartSize('tiny')} className={`px-1.5 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartSize === 'tiny' ? 'bg-slate-700 text-white' : 'text-white font-black font-bold'}`}>صغير جداً</button>
                <button type="button" onClick={() => setChartSize('shrunk')} className={`px-1.5 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartSize === 'shrunk' ? 'bg-slate-700 text-white' : 'text-white font-black font-bold'}`}>صغير</button>
                <button type="button" onClick={() => setChartSize('regular')} className={`px-1.5 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartSize === 'regular' ? 'bg-slate-700 text-white' : 'text-white font-black font-bold'}`}>افتراضي</button>
              </div>
            </div>

            <button 
              onClick={handleExportPDF}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px] transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <FileDown className="w-3 h-3" />
              <span>تصدير PDF 🖨️</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {orderedCards}
        </div>
      </div>
    );
  };

  // Virtual scrolling / Infinite scroll loading state with skeletal loading indicator
  const [visibleCount, setVisibleCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem('adalah-visible-cases-count') || '6', 10);
    } catch (e) {
      return 6;
    }
  });
  const [isVirtualLoading, setIsVirtualLoading] = useState(false);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const [courtFilter, setCourtFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Trigger new case modal from Command Palette or shortcuts
  useEffect(() => {
    const handleTriggerNewCase = () => {
      setIsCreateOpen(true);
    };
    window.addEventListener('adalah-trigger-new-case', handleTriggerNewCase);
    return () => window.removeEventListener('adalah-trigger-new-case', handleTriggerNewCase);
  }, []);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const getDaysLeft = (dueDateStr?: string): number => {
    if (!dueDateStr) return 999;
    try {
      const today = new Date('2026-06-04');
      const dueDate = new Date(dueDateStr);
      const diffTime = dueDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  };

  const handleNajizSync = async (c: Case) => {
    setIsSyncing(c.id);
    
    // Simulate API call to Najiz
    setTimeout(() => {
      setIsSyncing(null);
      
      const randomOutcome = Math.random();
      let updatedCase = { ...c, isNajizSync: true, lastActivityAt: new Date().toISOString() };
      let message = '';

      if (randomOutcome > 0.7) {
        // New Session
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 15);
        updatedCase.nextSessionDate = nextDate.toISOString().split('T')[0];
        updatedCase.nextSessionTime = '09:00 ص';
        message = 'تم رصد تحديث من ناجز: تم تحديد موعد جلسة جديدة بتاريخ ' + updatedCase.nextSessionDate;
      } else if (randomOutcome > 0.4) {
        // Status Change to Judgment
        updatedCase.status = 'judgment_issued';
        updatedCase.judgment_date = new Date().toISOString().split('T')[0];
        const appealDeadline = new Date();
        appealDeadline.setDate(appealDeadline.getDate() + 30);
        updatedCase.appeal_deadline = appealDeadline.toISOString().split('T')[0];
        message = 'تنبيه عاجل من ناجز: صدر صك حكم ابتدائي في القضية. بدأت مهلة الاستئناف (30 يوماً).';
      } else {
        message = 'تمت المزامنة مع ناجز؛ لا توجد تحديثات جديدة حالياً.';
      }

      onUpdateState('cases', updatedCase);
      if (selectedCase?.id === c.id) onSelectCase(updatedCase);

      alert(`[محاكي مزامنة ناجز]\n${message}`);
    }, 2000);
  };

  const countByCategory = (cat: string) => {
    if (cat === 'archived') {
      return cases.filter(c => c.archived === true || c.status === 'closed').length;
    }
    return cases.filter(c => c.category === cat && !c.archived).length;
  };

  const calculateDaysLeft = (judgmentDate: string) => {
    const deadline = new Date(judgmentDate);
    deadline.setDate(deadline.getDate() + 30);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // States to handle document/transcript summarizing inside case details
  const [caseDocumentText, setCaseDocumentText] = useState('');
  const [caseDocumentMemo, setCaseDocumentMemo] = useState('');
  const [isCaseSummarizing, setIsCaseSummarizing] = useState(false);
  const [caseSummarizeError, setCaseSummarizeError] = useState('');

  // Reload saved summary when selectedCase shifts
  React.useEffect(() => {
    if (selectedCase) {
      setCaseDocumentMemo(localStorage.getItem(`adalah-case-summary-${selectedCase.id}`) || '');
      setCaseDocumentText('');
      setCaseSummarizeError('');
    }
  }, [selectedCase?.id]);

  const handleCaseSummarize = async () => {
    if (!caseDocumentText.trim() || !selectedCase) return;
    setIsCaseSummarizing(true);
    setCaseSummarizeError('');
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentText: caseDocumentText,
          documentName: `ملخص مذكرات القضية رقم ${selectedCase.caseNumber}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setCaseDocumentMemo(data.summary);
        localStorage.setItem(`adalah-case-summary-${selectedCase.id}`, data.summary);
      } else {
        setCaseSummarizeError(data.error || 'عذراً، فشلت عملية التحليل.');
      }
    } catch {
      setCaseSummarizeError('فشل الاتصال بالخادم، يرجى التثبت من سلامة الاتصال ونشاط النظام.');
    } finally {
      setIsCaseSummarizing(false);
    }
  };

  // Scanned Document Attachments States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingState, setUploadingState] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [attachFileName, setAttachFileName] = useState('');
  const [attachFileType, setAttachFileType] = useState<'pdf' | 'docx'>('pdf');
  const [attachFileSize, setAttachFileSize] = useState('1.5 MB');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Interactive Recharts Expense summary panel toggle
  const [isGraphsOpen, setIsGraphsOpen] = useState(true);

  // Courtroom Stopwatch Tracker States for selectedCase
  const [casesModuleTimerSeconds, setCasesModuleTimerSeconds] = useState(0);
  const [casesModuleTimerIsRunning, setCasesModuleTimerIsRunning] = useState(false);
  const [casesModuleTimerLogged, setCasesModuleTimerLogged] = useState(false);

  React.useEffect(() => {
    let interval: any = null;
    if (casesModuleTimerIsRunning) {
      interval = setInterval(() => {
        setCasesModuleTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [casesModuleTimerIsRunning]);

  // Reset stopwatch when selectedCase shifts
  React.useEffect(() => {
    setCasesModuleTimerSeconds(0);
    setCasesModuleTimerIsRunning(false);
    setCasesModuleTimerLogged(false);
  }, [selectedCase?.id]);

  // Automated WhatsApp logs & status transition
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppLogs, setWhatsAppLogs] = useState<{
    id: string;
    caseNumber: string;
    status: 'success' | 'failed';
    type: string;
    message: string;
    phone: string;
    timestamp: string;
  }[]>([
    {
      id: 'log-1',
      caseNumber: '420391823',
      status: 'success',
      type: 'قيد الدعوى القضائية بنجاح',
      message: '✓ تم تفعيل بوابة العميل (العدالة) وإرسال بيانات النفاذ عبر خطوط واتساب الآمنة بنجاح.',
      phone: '+966504499122',
      timestamp: '2026-06-01 10:14'
    }
  ]);

  const handleStatusTransition = async (c: Case, newStatus: any, options?: { isAiAssisted?: boolean, notes?: string }) => {
    // Determine if the toggle allows sending alerts
    const isNotificationsEnabled = (c as any).whatsappNotificationsEnabled !== false;

    // Create history entry
    const historyEntry: any = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'system',
      userName: 'نظام العدالة',
      type: options?.isAiAssisted ? 'ai_update' : 'status_change',
      field: 'status',
      oldValue: c.status,
      newValue: newStatus,
      isAiAssisted: options?.isAiAssisted || false,
      notes: options?.notes || `تم تغيير حالة القضية من ${c.status} إلى ${newStatus}`
    };

    // Update case status in global state
    const isJudgment = newStatus === 'judgment_issued';
    const updatedCase: Case = {
      ...c,
      status: newStatus,
      history: [historyEntry, ...(c.history || [])],
      ...(isJudgment ? { judgment_date: new Date().toISOString().split('T')[0] } : {})
    };
    onUpdateState('cases', updatedCase);
    onSelectCase(updatedCase);

    // If notifications are enabled, and the status changed to closed or judgment_issued, trigger Twilio!
    if (isNotificationsEnabled && (newStatus === 'closed' || newStatus === 'judgment_issued')) {
      setIsSendingWhatsApp(true);
      
      const clientObj = clients.find(cl => cl.id === c.clientId || cl.name === c.clientName);
      const phone = clientObj?.phone || '+966504499122';

      let messageText = '';
      if (newStatus === 'closed') {
        messageText = `إشعار عدلي تلقائي من موكل ⚖️: سعادة العميل / ${c.clientName} المحترم، نحيط سعادتكم علماً بصدور قرار إغلاق ملف الدعوى القضائية رقم ${c.caseNumber} وتصفية الحسابات بنجاح. شاكرين ثقتكم بنا.`;
      } else if (newStatus === 'judgment_issued') {
        messageText = `إشعار عدلي عاجل من موكل ⚖️: سعادة العميل / ${c.clientName} المحترم، نود إعلامكم بصدور حكم قضائي قطعي رسمي لصالح دعواكم المقيدة برقم ${c.caseNumber}. جاري تدقيق منطوق الحكم وصياغة لائحة التنفيذ (مادة ٣٤).`;
      }

      try {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: phone, message: messageText })
        });
        const result = await res.json();

        if (result.success) {
          setWhatsAppLogs(prev => [
            {
              id: `log-${Date.now()}`,
              caseNumber: c.caseNumber,
              status: 'success',
              type: newStatus === 'closed' ? 'تنبيه إغلاق ملف' : 'تنبيه حكم قضائي صادر',
              message: messageText,
              phone: phone,
              timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-SA')
            },
            ...prev
          ]);
        } else {
          setWhatsAppLogs(prev => [
            {
              id: `log-${Date.now()}`,
              caseNumber: c.caseNumber,
              status: 'failed',
              type: newStatus === 'closed' ? 'فشل إغلاق' : 'فشل حكم صادر',
              message: `تعذر الإرسال: ${result.error || 'خطأ اتصال من Twilio'}`,
              phone: phone,
              timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-SA')
            },
            ...prev
          ]);
        }
      } catch (err: any) {
        setWhatsAppLogs(prev => [
          {
            id: `log-${Date.now()}`,
            caseNumber: c.caseNumber,
            status: 'failed',
            type: 'خطأ اتصال بالشبكة',
            message: `فشل الاتصال بالخادم: ${err.message}`,
            phone: phone,
            timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-SA')
          },
          ...prev
        ]);
      } finally {
        setIsSendingWhatsApp(false);
      }
    }
  };

  // Form Fields
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newCaseName, setNewCaseName] = useState('');
  const [newCategory, setNewCategory] = useState('commercial');
  const [newStage, setNewStage] = useState('litigation');
  const [newClientName, setNewClientName] = useState('');
  const [newOpponent, setNewOpponent] = useState('');
  const [newCourt, setNewCourt] = useState('المحكمة التجارية بالرياض');
  const [newNextDate, setNewNextDate] = useState('2026-06-15');
  const [newNextTime, setNewNextTime] = useState('09:30 صباحاً');
  const [newDetails, setNewDetails] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCircuitNumber, setNewCircuitNumber] = useState('');
  const [newOpponentNationalId, setNewOpponentNationalId] = useState('');
  const [newPoANumber, setNewPoANumber] = useState('');
  const [newPlaintiffNationalId, setNewPlaintiffNationalId] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [newClientType, setNewClientType] = useState('individual');
  const [newPlaintiffPhone, setNewPlaintiffPhone] = useState('');
  const [newNajizNumber, setNewNajizNumber] = useState('');
  const [newCompanyCR, setNewCompanyCR] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [hasContract, setHasContract] = useState(false);

  // Expense Fields for active case file
  const [expDesc, setExpDesc] = useState('');
  const [expAmt, setExpAmt] = useState('');

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newCaseName || !newClientName) return;

    // Create a new client if does not exist to sync properly
    let linkedClient = clients.find(cl => cl.name === newClientName);
    if (!linkedClient) {
      linkedClient = {
        id: `client-${Date.now()}`,
        name: newClientName,
        isCompany: newClientType === 'company',
        nationalId: newClientType === 'company' ? newCompanyCR : (newPlaintiffNationalId || "100" + Math.floor(Math.random() * 10000000)),
        phone: newPlaintiffPhone || "+9665" + Math.floor(Math.random() * 100000000),
        email: "contact@domain.sa",
        casesCount: 1,
        billingTotal: 0,
        activePortal: true,
        portalToken: `portal-${Date.now()}`,
        portalLink: `/portal?token=portal-${Date.now()}`
      };
      onUpdateState('clients', linkedClient);
    } else {
      // Update the client casesCount in case it's an existing client
      const updatedClient = { ...linkedClient, casesCount: (linkedClient.casesCount || 0) + 1 };
      
      if (newClientType === 'company') {
        updatedClient.isCompany = true;
        if (newCompanyCR) updatedClient.nationalId = newCompanyCR;
      } else {
        updatedClient.isCompany = false;
        if (newPlaintiffNationalId) updatedClient.nationalId = newPlaintiffNationalId;
        if (newPlaintiffPhone) updatedClient.phone = newPlaintiffPhone;
      }

      onUpdateState('clients', updatedClient);
    }

    const newCaseObj: Case = {
      id: `case-${Date.now()}`,
      caseNumber: newCaseNumber,
      caseName: newCaseName,
      category: newCategory as any,
      stage: newStage as any,
      status: 'new',
      clientName: newClientName,
      clientId: linkedClient.id,
      opponentName: newOpponent || 'طرف مجهول (خصم)',
      opponentNationalId: newOpponentNationalId,
      courtName: newCourt,
      circuitNumber: newCircuitNumber,
      powerOfAttorneyNumber: newPoANumber,
      lastSessionDate: new Date().toISOString().split('T')[0],
      nextSessionDate: newNextDate,
      nextSessionTime: newNextTime,
      summary: (newNajizNumber ? `[رقم الدعوى على ناجز: ${newNajizNumber}]\n` : '') + (newSummary || 'دعوى قضائية جديدة مضافة يدوياً عبر لوحة الإدارة.'),
      details: newDetails || 'لا يوجد تفاصيل نظامية مدونة حالياً.',
      isNajizSync: !!newNajizNumber,
      priority: newPriority,
      isConfidential: isConfidential,
      createdAt: new Date().toISOString().split('T')[0],
      attachmentsCount: hasContract ? 2 : 1,
      attachments: hasContract ? [
        { id: 'contract-init', fileName: 'عقد_المحاماة_الموقع_رقمياً.pdf', fileSize: '2.4 MB', uploadDate: new Date().toISOString().split('T')[0], category: 'contract' }
      ] : []
    };

    onUpdateState('cases', newCaseObj);
    setIsCreateOpen(false);

    // Explicit Credential Generation & Automated Notification
    const clientForSms = linkedClient || clients.find(cl => cl.id === newCaseObj.clientId);
    if (clientForSms) {
      // Generate credentials if not existing
      const generatedUsername = clientForSms.portalUsername || `asil-${clientForSms.nationalId.slice(-4)}`;
      const generatedPassword = clientForSms.portalPassword || `P@ss${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Update client with credentials if needed
      if (!clientForSms.portalUsername) {
        onUpdateState('clients', {
          ...clientForSms,
          portalUsername: generatedUsername,
          portalPassword: generatedPassword,
          activePortal: true
        });
      }

      const accessTemplate = "سعادة العميل الأستاذ / {clientName} المحترم،\n\nتم ربط دعواكم الجديدة رقم {caseNumber} بنظام موكل بنجاح.\n\nبيانات دخول بوابتكم التفاعلية (عميل وموكل):\nاسم المستخدم: {username}\nكلمة المرور: {password}\n\nرابط الدخول الموحد:\n{portalLink}\n\nموكل للعملاء والعملاء والمحاميين والمستشاريين القانونيين ⚖️.";
      
      const logMsg = accessTemplate
        .replace(/{clientName}/g, clientForSms.name)
        .replace(/{caseNumber}/g, newCaseNumber)
        .replace(/{username}/g, generatedUsername)
        .replace(/{password}/g, generatedPassword)
        .replace(/{portalLink}/g, `${window.location.origin}/portal/login`);
      
      // Trigger Twilio Notification (Simulated through state update and alert)
      setIsSendingWhatsApp(true);
      setTimeout(() => {
        setWhatsAppLogs(prev => [{
          id: `wa-link-${Date.now()}`,
          caseNumber: newCaseNumber,
          status: 'success',
          type: 'ربط دعوى وإنشاء بيانات نفاذ',
          phone: clientForSms.phone,
          message: logMsg,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-SA')
        }, ...prev]);
        setIsSendingWhatsApp(false);
        alert(`✅ تم ربط الدعوى وتوليد بيانات النفاذ للموكل: \nاسم المستخدم: ${generatedUsername}\nكلمة المرور: ${generatedPassword}\n\nتم إرسال إشعار آلي عبر Twilio/WhatsApp للرقم: ${clientForSms.phone}`);
      }, 800);
    }

    // Clear form inputs
    setNewCaseNumber('');
    setNewCaseName('');
    setNewOpponent('');
    setNewDetails('');
    onSelectCase(newCaseObj);
  };

  const handleTriggerAiAnalysis = async (c: Case) => {
    setIsAiLoading(true);
    setAiAnalysis('');
    
    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'summary',
          context: {
            caseNumber: c.caseNumber,
            clientName: c.clientName,
            opponentName: c.opponentName
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.text);
      }
    } catch {
      setAiAnalysis('حدث خطأ بمسح الذكاء الاصطناعي السحابي، جاري الارتداد للملفات المحلية.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddExpense = (e: React.FormEvent, c: Case) => {
    e.preventDefault();
    if (!expDesc || !expAmt) return;

    onUpdateState('stateOfPlatform', {
      type: 'expenses',
      data: {
        id: `exp-${Date.now()}`,
        description: expDesc,
        amount: parseFloat(expAmt),
        category: 'court_fees',
        date: new Date().toISOString().split('T')[0],
        caseNumber: c.caseNumber
      }
    });

    setExpDesc('');
    setExpAmt('');
    alert('تم تقييد المصروفات بنجاح إلى ملف الدعوى المالي الموحد!');
  };

  const handleFileDropInCases = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0] as any;
      const nameWithoutExt = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
      const ext = file.name.split('.').pop()?.toLowerCase() as any;
      setAttachFileName(nameWithoutExt);
      if (ext === 'pdf' || ext === 'docx') {
        setAttachFileType(ext);
      }
      const sizeMb = file.size / (1024 * 1024);
      const sizeStr = sizeMb > 0.1 ? `${sizeMb.toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
      setAttachFileSize(sizeStr);
    }
  };

  const handleFileChangeInCases = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const nameWithoutExt = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
      const ext = file.name.split('.').pop()?.toLowerCase() as any;
      setAttachFileName(nameWithoutExt);
      if (ext === 'pdf' || ext === 'docx') {
        setAttachFileType(ext);
      }
      const sizeMb = file.size / (1024 * 1024);
      const sizeStr = sizeMb > 0.1 ? `${sizeMb.toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
      setAttachFileSize(sizeStr);
    }
  };

  const handleAttachFileSubmit = (e: React.FormEvent, c: Case) => {
    e.preventDefault();
    if (!attachFileName) return;

    setUploadingState('uploading');
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          
          const newDoc: Attachment = {
            id: `doc-${Date.now()}`,
            fileName: attachFileName.endsWith('.pdf') || attachFileName.endsWith('.docx') ? attachFileName : `${attachFileName}.${attachFileType}`,
            fileSize: attachFileSize || '1.5 MB',
            uploadDate: new Date().toISOString().split('T')[0],
            category: 'other'
          };

          const oldDocs: Attachment[] = c.attachments || [
            { id: '1', fileName: 'لائحة_الادعاء_الافتتاحية_الموثقة.pdf', fileSize: '1.8 MB', uploadDate: '2026-05-18', category: 'litigation' },
            { id: '2', fileName: 'عقد_تأسيس_الشركة_منصة_أعمال.docx', fileSize: '840 KB', uploadDate: '2026-05-22', category: 'corporate' }
          ];

          const updatedCase: Case = {
            ...c,
            attachmentsCount: oldDocs.length + 1,
            attachments: [...oldDocs, newDoc]
          };

          onUpdateState('cases', updatedCase);
          onSelectCase(updatedCase);

          setUploadingState('completed');
          setUploadProgress(100);
          setTimeout(() => {
            setIsUploadOpen(false);
            setUploadingState('idle');
            setAttachFileName('');
            setUploadProgress(0);
          }, 1500);

          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Filters
  const filteredCases = cases.filter(c => {
    const matchesSearch = c.caseName.includes(searchTerm) || 
                          c.caseNumber.includes(searchTerm) || 
                          c.clientName.includes(searchTerm) ||
                          c.courtName.includes(searchTerm);
    
    // Auto-archive filter logic:
    // If 'archived' category is selected, show only archived cases.
    // Otherwise, show only non-archived cases matching other filters.
    const isArchivedRequested = categoryFilter.includes('archived');
    const isArchived = c.archived === true || c.status === 'closed' && isArchivedRequested; 
    
    if (isArchivedRequested && categoryFilter.length === 1) {
      if (!c.archived && c.status !== 'closed') return false;
    } else if (!isArchivedRequested) {
      if (c.archived) return false;
    }

    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(c.category) || (isArchivedRequested && categoryFilter.length === 1);
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    const matchesCourt = courtFilter === 'all' || c.courtName.includes(courtFilter);
    
    // Automated Document Tags Filter
    const matchesDocTag = selectedDocTag === 'all' || getCaseDocumentTags(c).includes(selectedDocTag);
    
    const matchesLastSession = !lastSessionFilter || (c.lastSessionDate && c.lastSessionDate.includes(lastSessionFilter));
    const matchesNextAppointment = !nextAppointmentFilter || (c.nextSessionDate && c.nextSessionDate.includes(nextAppointmentFilter));

    // Support filtering by Status: (active, closed, under_review)
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        matchesStatus = c.status === 'active';
      } else if (statusFilter === 'closed') {
        matchesStatus = c.status === 'closed';
      } else if (statusFilter === 'under_review') {
        matchesStatus = c.status === 'under_review' || c.status === 'under_study' || c.status === 'appeal';
      }
    }

    // Support filtering by Legal Officer / Lawyer
    let matchesLawyer = true;
    if (lawyerFilter !== 'all') {
      const respLawyerName = getLeadLawyerName(c);
      if (lawyerFilter === 'baqami') {
        matchesLawyer = respLawyerName.includes('البقمي');
      } else if (lawyerFilter === 'qahtani') {
        matchesLawyer = respLawyerName.includes('القحطاني');
      } else if (lawyerFilter === 'ghamdi') {
        matchesLawyer = respLawyerName.includes('الغامدي');
      }
    }

    return matchesSearch && matchesCategory && matchesStage && matchesCourt && matchesDocTag && matchesLastSession && matchesNextAppointment && matchesStatus && matchesLawyer;
  });

  const isCaseOverdue = (c: Case) => {
    // Statutory deadline logic: e.g. more than 30 days since last session with no next appointment
    if (c.status === 'closed' || c.archived) return false;
    
    const now = new Date();
    if (c.nextSessionDate) {
      const nextDate = new Date(c.nextSessionDate);
      if (nextDate < now) return true; // Passed appointment
    }

    if (c.lastSessionDate) {
      const lastDate = new Date(c.lastSessionDate);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays > 30 && !c.nextSessionDate) return true; // Stale case
    }

    return false;
  };

  // Reset pagination on filter change
  React.useEffect(() => {
    setVisibleCount(6);
  }, [categoryFilter, stageFilter, courtFilter, searchTerm, selectedDocTag, statusFilter, lawyerFilter]);

  // Load more sentinel trigger observer
  React.useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVirtualLoading && visibleCount < filteredCases.length) {
          setIsVirtualLoading(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + 6);
            setIsVirtualLoading(false);
          }, 600);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMoreRef.current, isVirtualLoading, visibleCount, filteredCases.length]);

  const handleQuickCopySummary = () => {
    const summary = `📊 ملخص الدعاوى القضائية الحالي:
🔹 عدد الدعاوى: ${filteredCases.length}
💰 القيمة التقديرية (تحت الإجراء): ${filteredCases.reduce((acc, c) => acc + (c.financialRecords?.reduce((s, r) => s + (r.amount ? parseFloat(r.amount) : 0), 0) || 0), 0).toLocaleString()} ر.س
📅 تم الإنشاء في: ${new Date().toLocaleDateString('ar-SA')}
`;
    navigator.clipboard.writeText(summary).catch(err => console.error(err));
    alert('تم نسخ الملخص السريع إلى الحافظة بنجاح!');
  };

  const handleExportCSV = () => {
    const headers = ['رقم الدعوى', 'اسم الدعوى', 'العميل', 'الحالة', 'نوع الدعوى', 'المرحلة المقيدة', 'تاريخ الجلسة القادمة'].join(',');
    const rows = cases.map(c => {
      const stageMap: any = { litigation: 'المرافعة والتقاضي', appeals: 'الاستئناف والتمييز', execution: 'محكمة التنفيذ' };
      const stageName = stageMap[c.stage] || c.stage;
      return [c.caseNumber, c.caseName, c.clientName, c.status, c.category, stageName, c.nextSessionDate || 'لا يوجد'].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "office_cases_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

      {/* Case Stage Progress Bar Component */}
      const CaseProgressBar = ({ caseObj }: { caseObj: Case }) => {
        const stages = [
          { id: 'litigation', label: 'التحضير' },
          { id: 'active', label: 'الترافع' },
          { id: 'judgment_issued', label: 'الحكم' },
          { id: 'execution', label: 'التنفيذ' }
        ];
        
        const currentIdx = stages.findIndex(s => s.id === caseObj.stage || s.id === caseObj.status);
        const progress = Math.max(0, (currentIdx + 1) * (100 / stages.length));

        return (
          <div className="space-y-2 mt-4 px-2">
            <div className="flex justify-between items-center text-[11px] font-extrabold uppercase tracking-widest text-slate-100 transition-colors">
              <span>المرحلة الحالية: {stages[currentIdx]?.label || 'قيد المراجعة'}</span>
              <span className="text-yellow-300 font-black">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 w-full bg-slate-900 border border-slate-700 rounded-full overflow-hidden border border-slate-700/30 transition-all shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500 transition-all"
              />
            </div>
          </div>
        );
      };

      const filterBarMarkup = (
        <div className="bg-[#050e21] p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl mb-10 relative z-20 space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1 min-w-[320px] relative w-full">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
              <input 
                type="text" 
                placeholder="البحث في القضايا، الموكلين، أو أرقام الصكوك..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0c1a35] border border-slate-700/50 rounded-2xl py-4 pr-14 pl-6 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all shadow-inner"
              />
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative">
                <span className="absolute -top-2 right-4 bg-[#050e21] px-2 text-[10px] font-black text-amber-500/80 uppercase">آخر جلسة</span>
                <input 
                  type="date"
                  value={lastSessionFilter}
                  onChange={(e) => setLastSessionFilter(e.target.value)}
                  className="bg-[#0c1a35] border border-slate-700/50 rounded-xl py-2.5 px-4 text-[10px] font-black text-white outline-none focus:border-amber-500/50 transition-all"
                />
              </div>
              <div className="relative">
                <span className="absolute -top-2 right-4 bg-[#050e21] px-2 text-[10px] font-black text-indigo-500/80 uppercase">الموعد القادم</span>
                <input 
                  type="date"
                  value={nextAppointmentFilter}
                  onChange={(e) => setNextAppointmentFilter(e.target.value)}
                  className="bg-[#0c1a35] border border-slate-700/50 rounded-xl py-2.5 px-4 text-[10px] font-black text-white outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'grid' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-700'}`}
                >
                  <Layers className="w-4 h-4" />
                  <span>عرض المربعات</span>
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'table' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-700'}`}
                >
                  <FileText className="w-4 h-4" />
                  <span>عرض القائمة</span>
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3">
                <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">إجمالي القضايا:</span>
                <span className="text-lg font-mono text-amber-500 font-black leading-none">{cases.length}</span>
              </div>
              <button 
                onClick={() => setIsGraphsOpen(!isGraphsOpen)}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white font-black font-bold transition-all cursor-pointer"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === 'all' ? categoryFilter.length === 0 : categoryFilter.includes(cat.id);
              const count = cat.id === 'all' ? cases.filter(c => !c.archived).length : countByCategory(cat.id);
              
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'all') {
                      setCategoryFilter([]);
                    } else {
                      setCategoryFilter(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]);
                    }
                  }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-black transition-all border shrink-0 relative group ${
                    isActive 
                      ? 'bg-amber-600 text-white border-amber-500 shadow-xl shadow-amber-600/20' 
                      : 'bg-[#0c1a35] text-white font-black font-bold border-slate-800[#0e2145]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-500'}`} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${isActive ? 'bg-white/20' : 'bg-slate-800 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Advanced Document Tag Filter Bar */}
          <div className="pt-4 border-t border-slate-800/60 mt-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded">وسوم المستندات الذكية</span>
                <p className="text-[11px] text-white font-black font-bold font-bold">فلترة سريعة للقضايا بواسطة وسوم المستندات التلقائية المكتشفة بالذكاء الاصطناعي (AI):</p>
              </div>
              {selectedDocTag !== 'all' && (
                <button 
                  onClick={() => setSelectedDocTag('all')}
                  className="text-[10px] text-rose-400 font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  إلغاء التصفية بالوسم
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'الكل 📁' },
                { id: 'مفهرس_آلياً', label: 'مفهرس آليا 🤖' },
                { id: 'عقد_تأسيس', label: 'عقود تأسيس 💼' },
                { id: 'عقد_عمل', label: 'عقود عمل 👔' },
                { id: 'عقد_مدني', label: 'عقود مدنية 📜' },
                { id: 'قضاء_تجاري', label: 'القضاء التجاري 🏛️' },
                { id: 'قضاء_عام', label: 'القضاء العام 🏛️' },
                { id: 'قرار_حكم', label: 'قرارات الأحكام 📜' },
                { id: 'مذكرة_دعوى', label: 'مذكرات الدعوى 📝' },
                { id: 'وكالة_شرعية', label: 'الوكالات الشرعية 🔑' },
                { id: 'سند_تنفيذي', label: 'السندات التنفيذية ⚡' },
                { id: 'تقرير_خبير', label: 'تقارير الخبراء 🔍' }
              ].map((tagItem) => {
                const isActive = selectedDocTag === tagItem.id;
                return (
                  <button
                    key={tagItem.id}
                    onClick={() => setSelectedDocTag(tagItem.id)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-600/25 text-amber-400 border-amber-500/60 shadow-lg shadow-amber-500/5'
                        : 'bg-[#0c1a35] text-white font-black font-bold border-slate-800/80'
                    }`}
                  >
                    <span>{tagItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );

      return (
        <div className="space-y-10 text-right animate-fade-in" dir="rtl">
          
          {/* Summary Dashboard Panels (Recharts Donuts & Bars) */}
          {!selectedCase && !isFocusMode && (
            <>
              {/* Headline + Add Button */}
              <div className="mb-4 animate-fade-in">
             
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-amber-500/5 mix-blend-overlay"></div>
                  <div className="space-y-4 relative z-10 w-full lg:w-auto">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 shadow-lg">
                        <Scale className="w-8 h-8" />
                      </div>
                      <div>
                        <h1 className="text-3xl md:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-450 to-amber-200 tracking-tighter uppercase leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.85)]">
                          إدارة القضايا
                        </h1>
                        <p className="text-[10px] font-black text-amber-500 tracking-[0.4em] mt-2 opacity-95 uppercase font-sans drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                          Supreme Litigations & Case Vault
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative z-10">
                    <button 
                      onClick={() => setIsArchiveModalOpen(true)}
                      className="bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 text-indigo-300 font-black py-4 px-8 rounded-2xl text-[11px] flex items-center gap-3 shadow-xl transition-all cursor-pointer group active:scale-95"
                    >
                      <Archive className="w-5 h-5 transition-transform" />
                      <span>الأرشيف الإلكتروني</span>
                    </button>

                    <button 
                      onClick={() => setIsCreateOpen(true)}
                      className="bg-[#0f172a][#1e293b] text-[#b8860b] font-black py-3.5 px-6 rounded-2xl text-[11px] flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(184,134,11,0.4)][0_0_25px_rgba(184,134,11,0.7)] transition-all w-full md:w-auto group border border-[#b8860b]/40 cursor-pointer"
                    >
                      <Plus className="w-5 h-5 stroke-[3px] text-[#b8860b]" />
                      <span className="uppercase tracking-widest font-extrabold text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.9)]">إضافة بيانات القضية يدوياً</span>
                    </button>
                    <button
                      onClick={() => setIsGraphsOpen(!isGraphsOpen)}
                      className="bg-[#050e21] text-white font-bold font-black py-3.5 px-5 rounded-2xl text-[11px] flex items-center justify-center gap-3 border border-slate-700 transition-all w-full md:w-auto shadow-md cursor-pointer"
                    >
                      {isGraphsOpen ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 text-amber-400" />}
                      <span>{isGraphsOpen ? 'إخفاء الإحصائيات' : 'عرض الإحصائيات'}</span>
                    </button>
                    <button
                      onClick={() => setIsFocusMode(!isFocusMode)}
                      className={`bg-[#050e21] text-white font-bold font-black py-3.5 px-5 rounded-2xl text-[11px] flex items-center justify-center gap-3 border transition-all w-full md:w-auto shadow-md cursor-pointer ${isFocusMode ? 'border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-700'}`}
                    >
                      {isFocusMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4 text-emerald-500" />}
                      <span>{isFocusMode ? 'إيقاف وضع التركيز' : 'وضع التركيز (Focus Mode)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isGraphsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-10"
                  >
                    <SummaryCharts cases={cases} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Auto-Archive Notification */}
          {!isFocusMode && (
            <AnimatePresence>
              {archivedNotice && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-6 mb-8 flex items-center justify-between group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 transition-opacity"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-blue-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Archive className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm">تم أرشفة {archivedNotice.count} قضايا تلقائياً</h4>
                    <p className="text-amber-500/70 text-xs font-bold mt-0.5">بسبب عدم النشاط لأكثر من 30 يوماً وتصنيف القضايا كمغلقة.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <button 
                    onClick={archivedNotice.onRestore}
                    className="bg-amber-500 text-blue-950 px-6 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    استعادة القضايا
                  </button>
                  <button 
                    onClick={archivedNotice.onClose}
                    className="p-2.5 text-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}

          {/* Detail Layout */}
          {selectedCase ? (
        <div className="space-y-10">
          {/* Back button */}
          <button 
            onClick={() => {
              onSelectCase(null);
              setAiAnalysis('');
            }}
            className="flex items-center gap-3 text-xs text-primary font-black uppercase tracking-widest transition-all group"
          >
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 transition-all">
              <ChevronLeft className="w-5 h-5 rotate-180 transition-transform" />
            </div>
            <span>العودة لقائمة جميع الدعاوى والنزاعات الشرعية المقيدة</span>
          </button>

          <div className="card-professional border-2 border-slate-800 rounded-[2.5rem] p-12 shadow-[0_30px_60px_rgba(0,0,0,0.4)] bg-[#050e21] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#0c1a35] blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0c1a35] blur-[80px] pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border shadow-lg ${
                    selectedCase.priority === 'high' 
                    ? 'bg-rose-500 text-rose-500 border-rose-500' 
                    : selectedCase.priority === 'medium' 
                    ? 'bg-amber-500 text-amber-500 border-amber-500' 
                    : 'bg-slate-100  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  border-slate-800'
                  }`}>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    أولوية {selectedCase.priority === 'high' ? 'قصوى عاجلة' : selectedCase.priority === 'medium' ? 'متوسطة' : 'عادية'}
                  </div>
                  <span className="text-sm text-slate-950 font-mono font-black border-r border-slate-400 pr-4">ملف نظام رقم: {selectedCase.caseNumber}</span>
                  {selectedCase.isNajizSync && (
                    <span className="text-xs bg-emerald-600 text-emerald-800 border border-emerald-600 font-black px-4 py-1.5 rounded-full inline-flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      مزامنة ناجز النشطة
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-4xl md:text-5xl font-display font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] tracking-tighter leading-tight drop-shadow-md">
                    {selectedCase.caseName}
                  </h1>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivityLogCaseId(selectedCase.id);
                    }}
                    className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[#fbbf24] transition-all cursor-pointer shrink-0 mt-2"
                    title="سجل النشاط والتعديلات"
                  >
                    <Clock className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-2">
                   <div className="flex items-center gap-3  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  font-bold text-sm bg-[#0c1a35] px-4 py-2 rounded-xl border border-slate-800">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>المحكمة المختصة: {selectedCase.courtName}</span>
                  </div>
                  <div className="flex items-center gap-3  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  font-bold text-sm bg-[#0c1a35] px-4 py-2 rounded-xl border border-slate-800">
                    <Eye className="w-4 h-4 text-primary" />
                    <span>آخر تحديث: {selectedCase.lastSessionDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 shrink-0 w-full md:w-auto">
                <button 
                  onClick={() => handleTriggerAiAnalysis(selectedCase)}
                  className="bg-primary text-white font-black px-10 py-5 rounded-[1.5rem] text-xs flex items-center justify-center gap-4 transition-all shadow-[0_20px_40px_rgba(184,134,11,0.3)] active:scale-95 group border border-primary-light/30"
                >
                  <Cpu className="w-6 h-6 transition-transform" />
                  <span>تحليل قانوني معمق (موكل AI) 💎</span>
                </button>

                <button 
                  onClick={() => {
                    const clientObj = clients.find(cl => cl.id === selectedCase.clientId);
                    if (!clientObj) {
                      alert("خطأ: لم يتم العثور على بيانات العميل المرتبطة بهذه الدعوى.");
                      return;
                    }
                    
                    const username = clientObj.portalUsername || clientObj.nationalId;
                    const password = clientObj.portalPassword || "JST-ALPHA";
                    const generatedLink = `${window.location.origin}/portal/login`;
                    
                    const msg = `أهلاً بك سعادة العميل / ${clientObj.name}\nلقد تم تفعيل حسابكم في بوابتكم القضائية (العدالة) لمتابعة مستجدات الدعوى رقم (${selectedCase.caseNumber}).\n\nرابط البوابة: ${generatedLink}\nاسم المستخدم: ${username}\nكلمة المرور: ${password}\n\nنأمل الحفاظ على سرية البيانات.`;
                    
                    const phone = clientObj.phone.replace(/[^0-9]/g, '');
                    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                    
                    window.open(waUrl, '_blank');
                    alert('تم تجهيز وإرسال بيانات النفاذ للموكل عبر الواتساب بنجاح.');
                  }}
                  className="bg-sky-50 text-white border border-slate-700 px-10 py-5 rounded-[1.5rem] text-xs font-black flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl"
                >
                  <Share2 className="w-6 h-6 text-primary" />
                  <span>إرسال بيانات بوابة العميل (WhatsApp)</span>
                </button>
              </div>
            </div>
            
            {/* Progress Bar of litigation stage */}
            <div className="relative mt-16 bg-[#0c1a35] p-12 rounded-[2.5rem] border border-slate-800 shadow-inner overflow-hidden">
              <div className="absolute inset-0 flex items-center pointer-events-none" aria-hidden="true">
                <div className="w-[85%] mx-auto border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-between px-6 gap-2 overflow-x-auto min-w-max">
                {[
                  { id: 'litigation', label: 'تجهيز اللائحة وقيدها' },
                  { id: 'sessions', label: 'المرافعات والتبادل' },
                  { id: 'appeals', label: 'تدقيق واستئناف الحكم' },
                  { id: 'execution', label: 'طلب تنفيذ مادة ٣٤/٤٦' },
                  { id: 'done', label: 'الحكم القطعي وتحصيل الحق' }
                ].map((st, idx) => {
                  const stages = ['litigation', 'appeals', 'execution', 'archived'];
                  const currentIdx = stages.indexOf(selectedCase.stage);
                  const isPassed = idx <= (currentIdx === -1 ? 1 : currentIdx);
                  
                  return (
                    <div key={idx} className="flex flex-col items-center group relative z-10 space-y-4">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-700 shadow-2xl relative ${
                        isPassed 
                        ? 'bg-primary text-white shadow-primary/40 scale-110' 
                        : 'bg-[#050e21]  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  border border-slate-400'
                      } `}>
                         {isPassed && <div className="absolute inset-0 rounded-2xl bg-[#050e21] animate-pulse"></div>}
                        <span className="relative z-10">{idx + 1}</span>
                      </div>
                      <span className={`text-xs font-black uppercase tracking-widest text-center max-w-[100px] leading-relaxed transition-all ${isPassed ? 'text-slate-950' : ' text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] '} `}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Main File Contents */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Electronic Archiving Section (Professional & Elegant) */}
              <div className="card-professional bg-[#050e21] border-2 border-slate-705 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none"></div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-[#FACC15] rounded-2xl border border-primary/20">
                      <Archive className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-[#FACC15] tracking-tight uppercase" style={{ textShadow: 'none' }}>الأرشفة الإلكترونية المنظمة</h3>
                      <p className="text-xs text-[#FFFFFF] font-black uppercase tracking-widest mt-1" style={{ textShadow: 'none' }}>Structured Electronic Legal Archive</p>
                    </div>
                  </div>
                  <button className="bg-primary/10 text-[#FACC15] px-4 py-2 rounded-xl text-[10px] font-black border border-primary/20">
                    + إيداع مستند جديد
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'pleadings', label: 'اللوائح الجوابية والاعتبارية', icon: FileText, count: 3, color: 'text-amber-400' },
                    { id: 'documents', label: 'المستندات الثبوتية والأسانيد', icon: Paperclip, count: 8, color: 'text-blue-400' },
                    { id: 'judgments', label: 'الأحكام والصكوك القضائية', icon: Gavel, count: 1, color: 'text-emerald-400' },
                    { id: 'execution', label: 'قرارات التنفيذ (مادة ٣٤/٤٦)', icon: Zap, count: 2, color: 'text-orange-400' },
                  ].map((cat) => (
                    <div key={cat.id} className="p-5 bg-[#0c1a35] border-2 border-slate-700 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${cat.color}`}>
                          <cat.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black text-[#FACC15] uppercase" style={{ textShadow: 'none' }}>{cat.count} ملفات</span>
                      </div>
                      <h4 className="text-sm font-black text-[#FFFFFF]" style={{ textShadow: 'none' }}>{cat.label}</h4>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-black text-[#FFFFFF]/80 border-t border-slate-800 pt-3">
                        <span style={{ textShadow: 'none' }}>آخر تحديث: قبل يومين</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-professional border-2 bg-[#050e21] border-slate-800 p-8 space-y-6 shadow-md">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                  <div className="p-3.5 bg-primary/10 text-[#FACC15] rounded-2xl border border-primary/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-[#FACC15] tracking-tight uppercase" style={{ textShadow: 'none' }}>مذكرات الدعوى والصكوك الثبوتية</h3>
                    <p className="text-xs text-[#FFFFFF] font-black uppercase tracking-widest mt-1" style={{ textShadow: 'none' }}>Foundational Legal Memoranda & Deeds</p>
                  </div>
                </div>
                
                <div className="bg-[#0c1a35] p-8 rounded-[2rem] border-2 border-slate-700">
                  <p className="text-sm md:text-base text-[#FFFFFF] leading-loose font-black text-justify" style={{ textShadow: 'none' }}>
                    {selectedCase.details}
                  </p>
                </div>

                <div className="bg-primary/5 p-6 rounded-2xl border-2 border-slate-700 flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col gap-1 min-w-[140px]">
                    <span className="text-xs text-[#FACC15] font-black uppercase tracking-[0.2em] mb-1" style={{ textShadow: 'none' }}>ملخص النزاع السريع:</span>
                    <div className="w-10 h-1 bg-amber-500 rounded-full"></div>
                  </div>
                  <p className="text-xs text-[#FFFFFF] font-black leading-relaxed" style={{ textShadow: 'none' }}>{selectedCase.summary}</p>
                </div>
              </div>

              {/* AI Assistant Output Box */}
              {(isAiLoading || aiAnalysis) && (
                <div className="card-professional border-2 bg-[#0c1a35] border-primary/40 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                  
                  <div className="flex items-center justify-between border-b border-primary/10 pb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-display font-black text-[#FACC15] text-lg tracking-tight" style={{ textShadow: 'none' }}>الدراسة اللغوية والتقنية (موكل AI)</h4>
                        <p className="text-xs text-[#FFFFFF] font-black uppercase tracking-widest mt-1" style={{ textShadow: 'none' }}>Deep Inference Sovereign Model</p>
                      </div>
                    </div>
                    <span className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-lg">V5.0 LEGAL CORE</span>
                  </div>

                  {isAiLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-6 relative z-10">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Cpu className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <p className="text-xs text-[#FFFFFF] font-black tracking-widest" style={{ textShadow: 'none' }}>جاري استنباط الأسانيد وفحص اللوائح التنفيذية...</p>
                    </div>
                  ) : (
                    <div className="bg-[#050e21] p-8 rounded-3xl border-2 border-slate-700 text-sm text-[#FFFFFF] space-y-6 leading-loose font-black text-justify relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
                        <span className="text-xs text-[#FACC15] uppercase font-black tracking-widest" style={{ textShadow: 'none' }}>توجيه فني مخصص للمرافع الشرعي</span>
                      </div>
                      <div className="text-[#FFFFFF] font-black" style={{ textShadow: 'none' }}>
                        {aiAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="card-professional border-2 bg-[#050e21] border-slate-800 p-8 space-y-8">
                <h3 className="font-display font-black text-lg text-[#FFFFFF] border-b border-slate-800 pb-5 tracking-tight uppercase" style={{ textShadow: 'none' }}>أطراف النزاع والعملاء المعنيين</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-[#0c1a35] rounded-3xl border-2 border-slate-700 space-y-4">
                    <div className="w-12 h-12 bg-primary/10 text-[#FACC15] rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-[#FACC15] font-black uppercase tracking-widest block mb-1" style={{ textShadow: 'none' }}>العميل المدعي (نظامي)</span>
                      <p className="font-black text-base text-[#FFFFFF]" style={{ textShadow: 'none' }}>{selectedCase.clientName}</p>
                    </div>
                  </div>

                  <div className="p-8 bg-[#0c1a35] rounded-3xl border-2 border-slate-700 space-y-4">
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-rose-400 font-black uppercase tracking-widest block mb-1" style={{ textShadow: 'none' }}>الخصم المدعى عليه</span>
                      <p className="font-black text-base text-[#FFFFFF]" style={{ textShadow: 'none' }}>{selectedCase.opponentName}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Details and Expenses */}
            <div className="lg:col-span-4 space-y-8">

        {/* DYNAMIC TRANSLATION & SUMMARIZER ENGINE CARD (GEMINI API) */}
        <div className="card-professional border-2 border-amber-500/20 bg-[#050e21] p-6 space-y-6 shadow-xl rounded-2xl text-right">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-amber-500/10 text-[#FACC15] rounded-xl border border-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-[#FACC15]" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs text-[#FACC15] uppercase tracking-wider" style={{ textShadow: 'none' }}>موجّز المستندات والجلسات المتقدم (Gemini RAG) 🧠</h3>
              <p className="text-[10px] text-[#FFFFFF] font-black block mt-0.5" style={{ textShadow: 'none' }}>صياغة ملخصات ذكية بنقاط مركزة لمطابقة الدفوع </p>
            </div>
          </div>

          <div className="space-y-4">
            {caseDocumentMemo ? (
              <div className="space-y-3">
                <div className="text-[10px] font-black text-[#FACC15] uppercase tracking-widest bg-amber-500/10 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span style={{ textShadow: 'none' }}>الموجز القانوني النشط للجلسة</span>
                </div>
                <div className="bg-[#0c1a35] p-4 rounded-xl border-2 border-slate-700 text-[11.5px] text-[#FFFFFF] leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-line font-sans scrollbar-thin">
                  {caseDocumentMemo}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من رغبتك في إزالة الموجز الحالي وإعادة التحليل؟')) {
                        setCaseDocumentMemo('');
                        localStorage.removeItem(`adalah-case-summary-${selectedCase.id}`);
                      }
                    }}
                    className="w-full bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-black py-2 rounded-xl text-center"
                  >
                     تحديث / مسح الموجز 🗑️
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-[#FFFFFF] font-black leading-relaxed" style={{ textShadow: 'none' }}>
                  ألصق هنا محضر مرافعة طويل، أو نص المذكرة، أو وثائق القضية لاستخراج ملخص قانوني فوري في نقاط مبيّنة للأسانيد والتوجيه الفني المقترح:
                </p>
                <textarea
                  rows={4}
                  value={caseDocumentText}
                  onChange={(e) => setCaseDocumentText(e.target.value)}
                  placeholder="ألصق نصوص المرافعة أو عقود الخصوم هنا..."
                  className="w-full bg-[#0c1a35] border-2 border-slate-700 p-3 rounded-xl text-xs font-semibold text-[#FFFFFF] outline-none focus:border-amber-500/50 transition-all font-sans"
                />
                
                {caseSummarizeError && (
                  <p className="text-[10px] text-rose-400 font-black">{caseSummarizeError}</p>
                )}

                <button
                  type="button"
                  onClick={handleCaseSummarize}
                  disabled={isCaseSummarizing || !caseDocumentText.trim()}
                  className={`w-full font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isCaseSummarizing 
                      ? 'bg-slate-800 text-slate-700 cursor-wait'
                      : !caseDocumentText.trim()
                        ? 'bg-slate-900 border border-slate-800 text-white font-black font-bold cursor-not-allowed'
                        : 'bg-[#FACC15] text-slate-950 font-extrabold cursor-pointer'
                  }`}
                >
                  {isCaseSummarizing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                      <span>جاري الصياغة الفنية للموجز عبر Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>تلخيص وتدقيق المستند بـ Gemini 🧠</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      {/* AUTOMATED WHATSAPP ALERTS & TWILIO ENGINE PANEL */}
      <div className="card-professional border-2 bg-[#050e21] border-primary/20 p-6 space-y-6 shadow-xl rounded-3xl relative overflow-hidden text-right leading-relaxed">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 bg-primary/10 text-[#FACC15] rounded-xl border border-primary/20 shrink-0">
            <Zap className="w-5 h-5 text-[#FACC15]" />
          </div>
          <div>
            <h3 className="font-display font-black text-xs text-[#FACC15] uppercase tracking-wider" style={{ textShadow: 'none' }}>بروتوكول الإشعارات التلقائية (نظام موكل)</h3>
            <p className="text-xs text-[#FFFFFF] font-black" style={{ textShadow: 'none' }}>بث وتوجيه التنبيهات مع تغيرات ملف المرافعة الشرعية</p>
          </div>
        </div>

        {/* Toggle switch for automated WhatsApp alerts */}
        <div className="bg-[#0c1a35] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="text-xs text-[#FFFFFF] font-black block" style={{ textShadow: 'none' }}>إرسال تلقائي للموكل</span>
            <span className="text-xs text-[#FACC15] font-black block" style={{ textShadow: 'none' }}>إرسال رسائل واتساب عبر Twilio فوراً</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const currentVal = (selectedCase as any).whatsappNotificationsEnabled !== false;
              const updatedCaseField = {
                ...selectedCase,
                whatsappNotificationsEnabled: !currentVal
              };
              onUpdateState('cases', updatedCaseField);
              onSelectCase(updatedCaseField);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              (selectedCase as any).whatsappNotificationsEnabled !== false ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#050e21] shadow ring-0 transition duration-200 ease-in-out ${
                (selectedCase as any).whatsappNotificationsEnabled !== false ? '-translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Case status transition trigger buttons */}
        <div className="space-y-3">
          <span className="text-xs text-[#FFFFFF] uppercase tracking-widest font-black block" style={{ textShadow: 'none' }}>تحديث حالة الدعوى الفوري وتحفيز البث:</span>
          
          <div className="grid grid-cols-1 gap-2">
            {/* Active Status Button */}
            <button
              type="button"
              onClick={() => handleStatusTransition(selectedCase, 'active')}
              className={`w-full py-2.5 px-4 rounded-xl text-[10.5px] font-black flex items-center justify-between border-2 cursor-pointer ${
                selectedCase.status === 'active'
                  ? 'bg-blue-600/30 text-[#FACC15] border-blue-500'
                  : 'bg-[#0c1a35] text-[#FFFFFF] border-slate-700'
              } `}
              style={{ textShadow: 'none' }}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedCase.status === 'active' ? 'bg-blue-400 animate-ping' : 'bg-blue-600'}`} />
                <span>نشطة وقائمة (Active File)</span>
              </span>
              {selectedCase.status === 'active' && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* Judgment Issued Button */}
            <button
              type="button"
              onClick={() => handleStatusTransition(selectedCase, 'judgment_issued')}
              className={`w-full py-2.5 px-4 rounded-xl text-[10.5px] font-black flex items-center justify-between border-2 cursor-pointer shadow-sm ${
                selectedCase.status === 'judgment_issued'
                  ? 'bg-amber-500/30 text-[#FACC15] border-amber-500'
                  : 'bg-[#0c1a35] text-[#FFFFFF] border-slate-700'
              } `}
              style={{ textShadow: 'none' }}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedCase.status === 'judgment_issued' ? 'bg-[#FACC15]' : 'bg-[#FFFFFF]'}`} />
                <span>📜 حكم قضائي صادر (Notify client)</span>
              </span>
              {selectedCase.status === 'judgment_issued' && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* Closed Status Button */}
            <button
              type="button"
              onClick={() => handleStatusTransition(selectedCase, 'closed')}
              className={`w-full py-2.5 px-4 rounded-xl text-[10.5px] font-black flex items-center justify-between border-2 cursor-pointer shadow-sm ${
                selectedCase.status === 'closed'
                  ? 'bg-rose-950/40 text-[#FACC15] border-rose-500'
                  : 'bg-[#0c1a35] text-[#FFFFFF] border-slate-700'
              } `}
              style={{ textShadow: 'none' }}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedCase.status === 'closed' ? 'bg-rose-400' : 'bg-[#FFFFFF]'}`} />
                <span>🔒 إغلاق وتصفية الملف (Notify client)</span>
              </span>
              {selectedCase.status === 'closed' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Real-time preview indicator */}
        {((selectedCase as any).whatsappNotificationsEnabled !== false) && (
          <div className="bg-[#0c1a35] p-4 rounded-2xl border-2 border-slate-700 space-y-3 shadow-inner">
            <span className="text-[11px] text-[#FACC15] font-black inline-block" style={{ textShadow: 'none' }}>💬 معاينة رسالة العميل الفورية:</span>
            <p className="text-xs text-[#FFFFFF] leading-relaxed font-black bg-[#050e21] p-3 rounded-xl border-2 border-slate-700 relative" style={{ textShadow: 'none' }}>
              {selectedCase.status === 'closed' ? (
                `إشعار عدلي تلقائي من مكتب المستشارين والمحاميين والمستشاريين القانونيين (العدالة) ⚖️: عميلنا المحترم ${selectedCase.clientName}، نحيط سعادتكم علماً بصدور قرار إغلاق ملف الدعوى رقم ${selectedCase.caseNumber} وتصفية الحسابات بنجاح.`
              ) : selectedCase.status === 'judgment_issued' ? (
                `إشعار عدلي عاجل من مكتب المستشارين والمحاميين والمستشاريين القانونيين (العدالة) ⚖️: عميلنا المحترم ${selectedCase.clientName}، نود إعلامكم بصدور حكم قضائي رسمي لصالح دعواكم المقيدة برقم ${selectedCase.caseNumber}.`
              ) : (
                `(سيتم تلقائياً تفعيل وإرسال التنبيه الفوري بهاتف ${clients.find(cl => cl.id === selectedCase.clientId || cl.name === selectedCase.clientName)?.phone || '+966...'} بمجرد تعديل الحالة إلى 'مغلقة' أو 'حكم قضائي صادر')`
              )}
            </p>
          </div>
        )}

        {/* Delivery Logs Stream */}
        <div className="space-y-3">
          <span className="text-xs text-[#FFFFFF] font-black uppercase tracking-wider block" style={{ textShadow: 'none' }}>سجل البث لقنوات الواتساب (TWILIO DELIVERY HISTORY)</span>
          
          <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
            {whatsAppLogs.filter(log => log.caseNumber === selectedCase.caseNumber).length === 0 ? (
              <p className="text-xs text-[#FFFFFF] text-center py-4 font-black border-2 border-dashed border-slate-700 rounded-xl bg-[#0c1a35]" style={{ textShadow: 'none' }}>لا توجد سجلات تسليم سابقة لهذه الدعوى.</p>
            ) : (
              whatsAppLogs.filter(log => log.caseNumber === selectedCase.caseNumber).map((log) => (
                <div key={log.id} className="bg-[#050e21] p-3 rounded-xl border-2 border-slate-700 space-y-1.5 text-[9.5px] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className={`font-black ${log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.type}
                    </span>
                    <span className="text-[#FFFFFF] font-mono font-black" style={{ textShadow: 'none' }}>{log.timestamp}</span>
                  </div>
                  <p className="text-[#FFFFFF] font-black" style={{ textShadow: 'none' }}>{log.message}</p>
                  <div className="text-[10px] text-[#FFFFFF] flex justify-between font-mono font-black border-t border-slate-800 pt-1.5" style={{ textShadow: 'none' }}>
                    <span>الهاتف: {log.phone}</span>
                    <span className="text-[#FACC15]">الناقل: Twilio Live Gateway</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

              <div className="card-professional border-2 bg-[#050e21] border-slate-700 p-8 space-y-8 shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-black text-sm text-[#FACC15] uppercase tracking-widest" style={{ textShadow: 'none' }}>توقيتات العدالة والآجال</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-end cursor-help">
                    <span className="text-xs text-[#FFFFFF] font-black uppercase tracking-widest" style={{ textShadow: 'none' }}>الجلسة القادمة</span>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-[#FFFFFF] text-base font-mono tracking-tighter" style={{ textShadow: 'none' }}>{selectedCase.nextSessionDate}</span>
                      <span className="text-xs text-[#FACC15] font-black uppercase" style={{ textShadow: 'none' }}>{selectedCase.nextSessionTime}</span>
                    </div>
                  </div>

                  {/* Interactive Courtroom Stopwatch Timer */}
                  <div className="mt-4 p-4 rounded-2xl bg-[#0c1a35] border-2 border-slate-700 text-right font-sans space-y-3" dir="rtl">
                    <div className="flex justify-between items-center font-sans">
                      <span className="text-[10px] font-black text-[#FACC15]" style={{ textShadow: 'none' }}>عداد جلسات المحكمة الفعلي ⏱️</span>
                      {casesModuleTimerLogged && (
                        <span className="bg-emerald-950/40 text-emerald-400 text-[11px] font-black px-2 py-0.5 rounded-full border border-emerald-500">
                          ✓ تم الحفظ بالملف الكلي
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#050e21] px-3 py-2.5 rounded-xl border-2 border-slate-700 shadow-sm">
                      <div className="text-xs font-mono font-black text-emerald-400 tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850 min-w-[85px] text-center direction-ltr">
                        {(() => {
                          const hrs = Math.floor(casesModuleTimerSeconds / 3600);
                          const mins = Math.floor((casesModuleTimerSeconds % 3600) / 60);
                          const secs = casesModuleTimerSeconds % 60;
                          return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                        })()}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCasesModuleTimerIsRunning(!casesModuleTimerIsRunning)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                            casesModuleTimerIsRunning 
                              ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold" 
                              : "bg-[#0c1a35] text-[#FFFFFF] border-slate-700 font-semibold"
                          }`}
                          style={{ textShadow: 'none' }}
                        >
                          {casesModuleTimerIsRunning ? "إيقاف مؤقت" : "بدء الجلسة"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCasesModuleTimerIsRunning(false);
                            setCasesModuleTimerSeconds(0);
                            setCasesModuleTimerLogged(false);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#0c1a35] text-[#FFFFFF] border border-slate-700 font-black text-[11px] cursor-pointer"
                          style={{ textShadow: 'none' }}
                        >
                          تصفير
                        </button>

                        <button
                          type="button"
                          disabled={casesModuleTimerSeconds === 0}
                          onClick={() => {
                            if (casesModuleTimerSeconds === 0) return;
                            const hrs = Math.floor(casesModuleTimerSeconds / 3600);
                            const mins = Math.floor((casesModuleTimerSeconds % 3600) / 60);
                            const secs = casesModuleTimerSeconds % 60;
                            const timeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                            
                            const newEventText = `⏱️ [رصد مدة الجلسة بالتوقيت الفعلي]: تم حضور مرافعة الدائرة القضائية ورصد مدتها الفعلية بشكل حي: ${timeStr}.`;
                            
                            const updatedCase = {
                              ...selectedCase,
                              details: `${selectedCase.details}\n\n[توثيق حضور جلسة مرافعة]: تم تدويل مدة المرافعة الفعلية لجسلة تاريخ ${selectedCase.nextSessionDate || 'الجلسة'} عبر ساعة الرصد بلغت: ${timeStr}.`,
                              notes: [
                                ...((selectedCase as any).notes || []),
                                {
                                  id: "note-" + Date.now(),
                                  author: "عداد جلسات المحكمة",
                                  content: newEventText,
                                  createdAt: new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA')
                                }
                              ]
                            };
                            onUpdateState('cases', updatedCase);
                            onSelectCase(updatedCase);
                            setCasesModuleTimerLogged(true);
                            setCasesModuleTimerIsRunning(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black border cursor-pointer ${
                            casesModuleTimerSeconds === 0
                              ? "bg-slate-850 text-slate-500 border-slate-800 cursor-not-allowed"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                          }`}
                          style={{ textShadow: 'none' }}
                        >
                          توثيق بالدعوى ⚖️
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#FFFFFF] font-black uppercase tracking-widest" style={{ textShadow: 'none' }}>الخطوة الإجرائية</span>
                    <span className="text-xs text-white font-black bg-indigo-500 px-4 py-1.5 rounded-full" style={{ textShadow: 'none' }}>إيداع اللائحة</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#FFFFFF] font-black uppercase tracking-widest" style={{ textShadow: 'none' }}>معدل الإنجاز</span>
                    <div className="flex items-center gap-3">
                       <span className="text-xs text-emerald-400 font-black font-mono" style={{ textShadow: 'none' }}>68%</span>
                       <div className="w-20 bg-[#0c1a35] h-1.5 rounded-full overflow-hidden border border-slate-800">
                         <div className="bg-emerald-450 h-full w-[68%]"></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

                      {/* AI CONTRACT VISUALIZER TRIGGER - Facilitating client explanation */}
                      <button
                        type="button"
                        onClick={() => {
                          const caseData = encodeURIComponent(JSON.stringify({
                            type: selectedCase.category,
                            client: selectedCase.clientName,
                            opponent: selectedCase.opponentName,
                            details: selectedCase.details || selectedCase.summary
                          }));
                          onUpdateState('activeTab', 'ai');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('adalah-ai-visualize-request', { detail: caseData }));
                          }, 100);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl font-black text-xs mb-4"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>توليد مسودة تصور بصري لعقد القضية (شرح للعملاء بـ AI) 🖼️</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsUploadOpen(true)}
                        className="w-full bg-primary text-white text-sm py-4 px-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-primary/20 relative z-10"
                      >
                        <Plus className="w-4 h-4" />
                        <span>أرشفة وثيقة ممسوحة ضوئياً</span>
                      </button>

                    {/* Add expenses on case form */}
                    <div className="card-professional border-2 bg-[#050e21] border-slate-700 p-8 space-y-8 shadow-md">
                      <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-5">
                        <h3 className="font-display font-black text-sm text-[#FACC15] uppercase tracking-widest" style={{ textShadow: 'none' }}>القيود المالية للملف</h3>
                        <p className="text-xs text-[#FFFFFF] font-black leading-relaxed" style={{ textShadow: 'none' }}>تسجيل تكاليف النشر، الإعلانات، أو اتعاب الخبراء.</p>
                      </div>

                      <form onSubmit={(e) => handleAddExpense(e, selectedCase)} className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-xs text-[#FFFFFF] font-black uppercase tracking-[0.2em] block" style={{ textShadow: 'none' }}>بيان المصروف والرسوم</label>
                          <input 
                            type="text"
                            placeholder="مثال: رسوم نشر إعلان مادة ٣٤"
                            value={expDesc}
                            onChange={(e) => setExpDesc(e.target.value)}
                            className="w-full bg-[#0c1a35] border-2 border-slate-700 rounded-2xl py-4 px-6 text-sm font-black text-[#FFFFFF] focus:outline-none focus:border-amber-500 font-sans"
                            style={{ textShadow: 'none' }}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs text-[#FFFFFF] font-black uppercase tracking-[0.2em] block" style={{ textShadow: 'none' }}>المبلغ المقيد (ر.س)</label>
                          <div className="relative">
                            <input 
                              type="number"
                              placeholder="0.00"
                              value={expAmt}
                              onChange={(e) => setExpAmt(e.target.value)}
                              className="w-full bg-[#0c1a35] border-2 border-slate-700 rounded-2xl py-4 pr-14 pl-6 text-xl font-black text-[#FFFFFF] focus:outline-none focus:border-amber-500 font-mono text-right shadow-inner"
                              style={{ textShadow: 'none' }}
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-[#FACC15] font-black tracking-widest" style={{ textShadow: 'none' }}>SAR</span>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-indigo-650 text-white font-black text-xs py-5 rounded-2xl border-2 border-indigo-500 cursor-pointer"
                        >
                          اعتماد القيد المالي للمصروفات +
                        </button>
                      </form>
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              <div className="space-y-8 animate-fade-in duration-700">
                {/* List View of all cases */}
                  
                {!isFocusMode && filterBarMarkup}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.1 }} 
                    className="border-2 p-10 bg-gradient-to-br from-[#0b1329] to-[#050e21] border-[#d4af37] shadow-2xl relative overflow-hidden rounded-[2rem] group"
                    style={{ background: 'linear-gradient(135deg, #0b1329 0%, #050e21 100%)', borderColor: '#d4af37', borderWidth: '2px' }}
                  >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 blur-3xl rounded-full transition-all"></div>
                     <div className="relative z-10 flex flex-col gap-8">
                       <div className="flex items-center justify-between">
                          <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-inner transition-transform duration-500" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: '#d4af37' }}>
                            <Clock className="w-8 h-8 text-[#facc15]" />
                          </div>
                          <div className="text-right">
                             <h4 className="text-sm font-black mb-2 px-2 border-r-4 border-[#d4af37]" style={{ color: '#ffd700', textShadow: '0 0 10px rgba(212, 175, 55, 0.4)' }}>قضايا نشطة</h4>
                             <span className="text-4xl font-display font-black tracking-tighter tabular-nums" style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(255, 255, 255, 0.3)' }}>{cases.filter(c => c.status === 'active' || c.status === 'new').length}</span>
                          </div>
                       </div>
                       <div className="w-full bg-[#030712] h-3 rounded-full overflow-hidden border border-amber-500/30 shadow-inner">
                         <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} className="bg-gradient-to-r from-[#ffd700] via-[#facc15] to-[#b8860b] h-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                       </div>
                       <div className="flex items-center justify-between">
                          <div className="text-xs font-black flex items-center gap-2" style={{ color: '#facc15' }}>
                             <div className="w-1.5 h-1.5 bg-[#facc15] rounded-full animate-ping"></div>
                             System Response: Strategic
                          </div>
                          <span className="text-xs font-mono font-black animate-pulse" style={{ color: '#ffffff', textShadow: '0 0 8px rgba(255, 255, 255, 0.8)' }}>70.2%</span>
                       </div>
                     </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className="border-2 p-10 bg-white shadow-2xl relative overflow-hidden rounded-[2rem] cursor-default group"
                    style={{ backgroundColor: '#ffffff', borderColor: '#d4af37', borderWidth: '2px' }}
                  >
                     <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                     <div className="relative flex flex-col gap-8">
                       <div className="flex items-center justify-between">
                          <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-inner transition-transform duration-500" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                            <Check className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div className="text-right">
                             <h4 className="text-sm font-black mb-2 px-2 border-r-4 border-emerald-500" style={{ color: '#0f172a' }}>منتهية نهائياً</h4>
                             <span className="text-4xl font-display font-black tracking-tighter tabular-nums" style={{ color: '#0f172a' }}>{cases.filter(c => c.status === 'closed').length}</span>
                          </div>
                       </div>
                       <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner border border-slate-200">
                         <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }} className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-xs font-black flex items-center gap-2" style={{ color: '#059669' }}>Legal Outcome: Positive</p>
                          <span className="text-xs font-mono font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200">45.8%</span>
                       </div>
                     </div>
                  </motion.div>

             <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               transition={{ delay: 0.3 }} 
               className="border-2 p-10 bg-white shadow-2xl relative overflow-hidden rounded-[2rem] cursor-default group"
               style={{ backgroundColor: '#ffffff', borderColor: '#d4af37', borderWidth: '2px' }}
             >
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 blur-3xl rounded-full"></div>
                <div className="relative flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                     <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-inner transition-transform" style={{ backgroundColor: 'rgba(217, 119, 6, 0.08)', borderColor: 'rgba(217, 119, 6, 0.3)' }}>
                       <div className="flex items-center justify-center font-black text-amber-600 font-bold text-lg leading-none" style={{ color: '#d97706' }}>ر.س</div>
                     </div>
                     <div className="text-right">
                        <h4 className="text-xs font-black mb-2 px-2 border-r-4 border-amber-600" style={{ color: '#0f172a' }}>حصيلة التنفيذ</h4>
                        <span className="text-3xl font-display font-black tracking-tighter tabular-nums" style={{ color: '#0f172a' }}>485,000 <span className="text-xs uppercase opacity-60">ريال سعودي</span></span>
                     </div>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner border border-slate-200">
                    <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.7 }} className="bg-gradient-to-r from-amber-500 to-amber-600 h-full shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
                  </div>
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-black flex items-center gap-2" style={{ color: '#b45309' }}>Recovery: Phase 5 Optimized</p>
                     <span className="text-xs font-mono font-black bg-amber-50 text-amber-700 px-3 py-1 rounded-lg border border-amber-200">85.0%</span>
                  </div>
                </div>
             </motion.div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl mb-10 relative z-20">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col space-y-3">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mr-1">Litigation Stage</label>
                <select 
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 rounded-2xl text-[11px] font-black focus:border-amber-500 outline-none transition-all cursor-pointer min-w-[180px] appearance-none shadow-sm hover:border-slate-300"
                >
                  <option value="all">كافة المراحل</option>
                  <option value="primary">الدرجة الاولى</option>
                  <option value="appeal">الاستئناف</option>
                  <option value="supreme">المحكمة العليا</option>
                  <option value="execution">التنفيذ</option>
                </select>
              </div>

              <div className="flex flex-col space-y-3 font-sans">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mr-1">Court Venue</label>
                <select 
                  value={courtFilter}
                  onChange={(e) => setCourtFilter(e.target.value)}
                  className="bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 rounded-2xl text-[11px] font-black focus:border-amber-500 outline-none transition-all cursor-pointer min-w-[180px] appearance-none shadow-sm hover:border-slate-300"
                >
                  <option value="all">كافة المحاكم</option>
                  <option value="التجارية">المحكمة التجارية</option>
                  <option value="العمالية">المحكمة العمالية</option>
                  <option value="الجزائية">المحكمة الجزائية</option>
                  <option value="الأحوال الشخصية">محكمة الأحوال الشخصية</option>
                  <option value="العامة">المحكمة العامة</option>
                  <option value="التنفيذ">محكمة التنفيذ</option>
                  <option value="ديوان المظالم">ديوان المظالم</option>
                </select>
              </div>

              <div className="flex flex-col space-y-3 font-sans">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mr-1">Document Tag (AI)</label>
                <select 
                  value={selectedDocTag}
                  onChange={(e) => setSelectedDocTag(e.target.value)}
                  className="bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 rounded-2xl text-[11px] font-black focus:border-amber-500 outline-none transition-all cursor-pointer min-w-[200px] appearance-none shadow-sm hover:border-slate-300"
                >
                  <option value="all">كافة التصنيفات الآلية</option>
                  <option value="مفهرس_آلياً">مفهرس آلياً</option>
                  <option value="عقد_عمل">عقد عمل</option>
                  <option value="عقد_تأسيس">عقد تأسيس</option>
                  <option value="عقد_مدني">عقد مدني</option>
                  <option value="مذكرة_دعوى">مذكرة دعوى</option>
                  <option value="لائحة_اعتراضية">لائحة اعتراضية</option>
                  <option value="سند_تنفيذي">سند تنفيذي</option>
                  <option value="قرار_حكم">قرار حكم</option>
                  <option value="وكالة_شرعية">وكالة شرعية</option>
                  <option value="تقرير_خبير">تقرير خبير</option>
                </select>
              </div>

              <div className="flex flex-col space-y-3 font-sans">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mr-1">حالة القضية (Status)</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 rounded-2xl text-[11px] font-black focus:border-amber-500 outline-none transition-all cursor-pointer min-w-[160px] appearance-none shadow-sm hover:border-slate-300"
                >
                  <option value="all">كافة الحالات</option>
                  <option value="active">نشطة جارية</option>
                  <option value="closed">مغلقة مؤرشفة</option>
                  <option value="under_review">قيد النظر والمراجعة</option>
                </select>
              </div>

              <div className="flex flex-col space-y-3 font-sans">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mr-1">المسؤول القانوني (Counsel)</label>
                <select 
                  value={lawyerFilter}
                  onChange={(e) => setLawyerFilter(e.target.value)}
                  className="bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 rounded-2xl text-[11px] font-black focus:border-amber-500 outline-none transition-all cursor-pointer min-w-[200px] appearance-none shadow-sm hover:border-slate-300"
                >
                  <option value="all">كافة المستشارين</option>
                  <option value="baqami">المحامي أحمد البقمي</option>
                  <option value="qahtani">د. عادل القحطاني</option>
                  <option value="ghamdi">أ. خالد الغامدي</option>
                </select>
              </div>

            </div>
          </div>

          {/* Filtering Tags for classifications */}
          <div className="flex flex-wrap items-center gap-3 mb-6 w-full text-right animate-in fade-in slide-in-from-top-4 duration-500" dir="rtl">
            <span className="text-[11px] font-black text-slate-700 ml-2">تصفية القضايا حسب النوع:</span>
            {[
              { key: 'civil', label: 'شرعية' },
              { key: 'commercial', label: 'تجارية' },
              { key: 'labor', label: 'عمالية' },
              { key: 'personal_status', label: 'أحوال شخصية' }
            ].map((item) => {
              const isActive = categoryFilter.includes(item.key);
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setCategoryFilter(prev => prev.includes(item.key) ? prev.filter(k => k !== item.key) : [...prev, item.key])}
                  className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-sm border ${
                    isActive 
                      ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-amber-500/20' 
                      : 'bg-[#050e21] border-slate-700 text-white font-bold hover:border-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-[#050e21] p-6 rounded-[2rem] border border-slate-800/85">
            <div className="text-right">
              <h3 className="text-xs font-black text-white font-black font-bold uppercase tracking-widest mb-1">نتائج الفرز والبحث</h3>
              <p className="text-xs text-slate-700">تم العثور على {filteredCases.length} قضية نشطة ومؤرشفة.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => window.print()}
                className="p-6 bg-[#b8860b] text-white border border-transparent rounded-2xl transition-all shadow-sm cursor-pointer active:scale-95 group relative flex items-center justify-center gap-1.5"
                title="طباعة سجل القضايا"
              >
                <span>🖨️</span>
                <span className="text-xs font-black font-sans">طباعة التقرير</span>
              </button>

              <button 
                onClick={handleExportCSV}
                className="p-6 bg-[#050e21] border border-slate-800 rounded-2xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all shadow-sm cursor-pointer[#0c1a35] active:scale-95 group relative"
                title="تصدير CSV"
              >
                <Download className="w-7 h-7 transition-transform" />
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-black px-1.5 py-0.5 rounded-md shadow-lg">CSV</span>
              </button>

              <button 
                type="button"
                onClick={() => setIsLegalReviewMode(!isLegalReviewMode)}
                className={`p-6 border rounded-2xl transition-all shadow-sm cursor-pointer active:scale-95 group relative flex items-center justify-center gap-2 font-sans ${
                  isLegalReviewMode 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20' 
                    : 'bg-[#050e21] border-slate-800 text-white[#fbbf24]'
                }`}
                title="نمط المراجعة القانونية لتقليل إجهاد العين"
              >
                <span className="text-sm">👁️⚙️</span>
                <span className="text-xs font-black">
                  {isLegalReviewMode ? 'تعطيل نمط المراجعة' : 'تفعيل نمط المراجعة'}
                </span>
              </button>
            </div>
          </div>

          {filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#050e21] border-2 border-dashed border-slate-800 rounded-[2.5rem] space-y-4">
              <span className="text-5xl opacity-40">📂</span>
              <p className="text-white font-black font-bold font-black text-xs uppercase tracking-widest">لا توجد ملفات قضايا تتطابق مع المرشحات الحالية</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className={`overflow-hidden shadow-2xl transition-all duration-300 border rounded-[2.5rem] w-full ${
              isHighContrast 
                ? 'bg-white border-slate-900 border-2 shadow-slate-200' 
                : 'bg-[#050e21] border-slate-700/50 shadow-black/80'
            }`}>
              <div className={`flex items-center text-right border-b ${isHighContrast ? 'bg-slate-200 border-slate-900' : 'bg-slate-900/80 border-slate-800'}`} dir="rtl">
                <div className={`flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] ${isHighContrast ? 'text-slate-900' : 'text-white font-bold'} drop-shadow-sm`}>رقم الدعوى</div>
                <div className={`flex-[2] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] ${isHighContrast ? 'text-slate-900' : 'text-white font-bold'} drop-shadow-sm`}>اسم الدعوى</div>
                <div className={`flex-[1.5] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] ${isHighContrast ? 'text-slate-900' : 'text-white font-bold'} drop-shadow-sm`}>العميل</div>
                <div className={`flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] ${isHighContrast ? 'text-slate-900' : 'text-white font-bold'} drop-shadow-sm`}>التصنيف</div>
                <div className={`flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] ${isHighContrast ? 'text-slate-900' : 'text-white font-bold'} drop-shadow-sm`}>الحالة</div>
                <div className={`flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] ${isHighContrast ? 'text-slate-900' : 'text-white font-bold'} drop-shadow-sm`}>تحليل AI</div>
                <div className={`flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] ${isHighContrast ? 'text-slate-900' : 'text-white font-bold'} drop-shadow-sm`}>الجلسة القادمة</div>
                <div className="flex-[0.5] px-4 py-4"></div>
              </div>
              <List
                style={{ height: 600, width: "100%", direction: "rtl" }}
                rowCount={filteredCases.length}
                rowHeight={100}
                rowProps={{}}
                className={`divide-y-4 ${isHighContrast ? 'divide-slate-200' : 'divide-slate-900'}`}
                rowComponent={({ index, style }) => {
                  const c = filteredCases[index];
                  const { arabicStatusName, statusColorClass, arabicCategoryName, CategoryIcon } = getInteractiveCaseStyles(c.category, c.status);
                  const cTags = getCaseDocumentTags(c);
                  return (
                    <div 
                      key={c.id} 
                      style={style}
                      className={`flex items-center text-right transition-all group cursor-pointer ${
                        isHighContrast 
                          ? (index % 2 === 0 ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white hover:bg-slate-100') 
                          : (index % 2 === 0 ? 'bg-[#0a182f]/40 hover:bg-amber-500/10' : 'bg-transparent hover:bg-amber-500/10')
                      } ${c.archived ? 'opacity-50 grayscale-[0.5]' : ''}`} 
                      onClick={() => onSelectCase(c)}
                      dir="rtl"
                    >
                      <div className={`flex-[1] px-4 py-3 text-xs font-mono font-black tracking-tight ${isHighContrast ? 'text-amber-800' : 'text-amber-400'} transition-colors`}>#{c.caseNumber}</div>
                      <div className={`flex-[2] px-4 py-3 text-xs font-black tracking-tight transition-colors ${isHighContrast ? 'text-slate-950 font-black' : 'text-white'}`}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{c.caseName}</span>
                          {isCaseOverdue(c) && (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse relative group" title="تجاوزت المهلة النظامية">
                              <span className="absolute -top-8 right-0 bg-rose-900 text-white text-[10px] px-2 py-1 rounded opacity-0 transition-opacity whitespace-nowrap z-[60]">تجاوزت المهلة النظامية</span>
                            </span>
                          )}
                        </div>
                        <CaseClassificationTags category={c.category} status={c.status} isHighContrast={isHighContrast} />
                      </div>
                      <div className={`flex-[1.5] px-4 py-3 text-[11px] font-black tracking-tight truncate ${isHighContrast ? 'text-slate-800' : 'text-indigo-300'} transition-colors`}>{c.clientName}</div>
                      <div className="flex-[1] px-4 py-3">
                        <span className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl border-2 transition-all inline-flex items-center gap-1 shrink-0 ${
                          isHighContrast 
                            ? 'bg-slate-100 border-slate-900 text-slate-950 shadow-sm' 
                            : 'bg-slate-900 border-slate-700 text-white font-bold'
                        }`}>
                          <CategoryIcon className="w-3 h-3" />
                          <span className="truncate">{arabicCategoryName}</span>
                        </span>
                      </div>
                      <div className="flex-[1] px-4 py-3">
                        <span className={`text-[11px] font-black px-2 py-1.5 rounded-xl border-2 transition-all shrink-0 ${
                          isHighContrast 
                            ? 'bg-slate-950 text-white border-slate-950 shadow-md' 
                            : `${statusColorClass.replace('bg-opacity-10', 'bg-opacity-30')} text-white border-white/10`
                        }`}>
                          <span className="truncate block">{arabicStatusName}</span>
                        </span>
                      </div>
                      <div className="flex-[1] px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
                          {cTags.slice(0, 2).map((tag, tIdx) => (
                            <span key={tIdx} className={`text-[10px] truncate font-black px-1.5 py-0.5 border-2 rounded-md transition-all ${
                              isHighContrast 
                                ? 'bg-slate-200 border-slate-900 text-slate-950' 
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`flex-[1] px-4 py-3 text-[10px] font-black font-mono tracking-widest truncate ${isHighContrast ? 'text-emerald-900' : 'text-emerald-400'} transition-colors`}>{c.nextSessionDate || '---'}</div>
                      <div className="flex-[0.5] px-4 py-3 text-right">
                        <ChevronLeft className={`w-4 h-4 transition-all rotate-180 inline-block drop-shadow-sm ${isHighContrast ? 'text-white font-black font-bold' : 'text-slate-700'}`} />
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${gridDensity === 'relaxed' ? 'md:grid-cols-2 lg:grid-cols-3 gap-10' : 'md:grid-cols-3 lg:grid-cols-4 gap-6'}`}>
              {filteredCases.slice(0, visibleCount).map((c, idx) => {
                const { 
                  arabicCategoryName, 
                  arabicStatusName, 
                  statusColorClass, 
                  IconComponent, 
                  categoryBadgeColor,
                  hoverBorderAccent,
                  gradientBg,
                  sidebarColor,
                  CategoryIcon
                } = getInteractiveCaseStyles(c.category, c.status);

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectCase(c)}
                    className={`card-professional-case relative cursor-default rounded-[2rem] border-2 p-[3px] overflow-hidden ${
                      isHighContrast 
                        ? 'border-slate-900 bg-white shadow-xl' 
                        : 'border-[#fbbf24]/55 bg-[#050e21] shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    {/* Main Content Area - Dynamic theme support */}
                    <div className={`relative z-10 w-full h-full p-6 md:p-8 rounded-[calc(2rem-3px)] flex flex-col justify-between shadow-inner ${
                      isHighContrast ? 'bg-slate-50' : 'theme-card-bg'
                    }`}>
                      
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivityLogCaseId(c.id);
                              }}
                              className={`p-2.5 border rounded-xl transition-all cursor-pointer shrink-0 z-30 ${
                                isHighContrast 
                                  ? 'bg-slate-200 border-slate-400 text-slate-800' 
                                  : 'bg-amber-500/10 border-amber-500/30 text-[#fbbf24]'
                              }`}
                              title="سجل النشاط والتعديلات"
                            >
                              <Clock className="w-4 h-4 case-icon-svg" />
                            </button>

                            <div className={`case-icon-element rounded-xl border shadow-inner flex items-center justify-center shrink-0 ${
                                 isHighContrast 
                                   ? 'bg-slate-900 border-slate-950 text-white' 
                                   : 'bg-[#B8860B]/25 border-amber-500/30 text-[#fbbf24]'
                                 }`}
                                 style={{ width: `${38}px`, height: `${38}px` }}>
                              <IconComponent className={`case-icon-svg ${isHighContrast ? 'text-white' : 'text-amber-300'}`} style={{ width: `${18}px`, height: `${18}px` }} />
                            </div>
                            <div className="flex flex-col text-right font-sans">
                              <span className={`case-header-title text-[11px] uppercase tracking-[0.1em] mt-0.5 font-extrabold ${isHighContrast ? 'text-slate-900' : 'text-[#ffff00] drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]'}`}>نظام التقاضي الذكي</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleNajizSync(c);
                               }}
                               disabled={isSyncing === c.id}
                               className={`p-2.5 rounded-xl border transition-all cursor-pointer z-35 flex items-center gap-2 ${
                                 isSyncing === c.id 
                                   ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400 animate-pulse'
                                   : isHighContrast 
                                      ? 'bg-white border-slate-900 text-slate-900'
                                      : 'bg-slate-900 border-slate-700 text-amber-400'
                               }`}
                               title="مزامنة بيانات ناجز"
                             >
                               <Bot className={`w-4 h-4 ${isSyncing === c.id ? 'animate-spin' : ''}`} />
                               <span className="text-[10px] font-black">{isSyncing === c.id ? 'جاري السحب...' : 'مزامنة ناجز'}</span>
                             </button>
                             {c.isNajizSync ? (
                               <span className={`text-[11px] font-black px-2 py-1 rounded-lg border-2 flex items-center gap-1 transition-colors font-sans shadow-md ${
                                   isHighContrast ? 'bg-[#adff2f] text-black border-black/10' : 'bg-[#adff2f] text-black border-[#adff2f]/50 drop-shadow-[0_0_8px_rgba(173,255,47,0.4)]'
                                 }`}>
                                  <Bot className="w-3.5 h-3.5 text-black" />
                                  <span className="text-black">من ناجز</span>
                               </span>
                             ) : (
                               <span className={`text-[11px] font-black px-2 py-1 rounded-lg border-2 flex items-center gap-1 transition-colors font-sans shadow-md ${
                                   isHighContrast ? 'bg-orange-100 text-orange-900 border-orange-200' : 'bg-[#ffb067] text-[#4a2600] border-[#ffb067]/50 drop-shadow-[0_0_8px_rgba(255,176,103,0.3)]'
                                 }`}>
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>يدويا</span>
                               </span>
                             )}
                             {(() => {
                               const styles = getStatusKineticStyles(c.status);
                               return (
                                 <span className={`status-badge-kinetic ${styles.glow} text-[11px] font-extrabold px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-colors font-sans shadow-sm ${
                                   isHighContrast ? 'bg-slate-950 text-white border-slate-950' : 'text-white'
                                 }`} data-contrast-ignore="true">
                                    <span className="w-2.5 h-2.5 rounded-full bg-white opacity-80"></span>
                                    <span className="drop-shadow-sm font-black text-white">{arabicStatusName}</span>
                                 </span>
                               );
                             })()}
                          </div>
                        </div>

                        <h3 className={`case-name-text font-display font-black text-2xl leading-tight text-right drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex items-start justify-between gap-4 ${
                          isHighContrast ? 'text-slate-900' : 'text-white'
                        }`}>
                          <span>{c.caseName}</span>
                          <CaseClassificationTags category={c.category} status={c.status} isHighContrast={isHighContrast} />
                          {isCaseOverdue(c) && (
                            <span className="bg-rose-600/20 border border-rose-500/50 text-rose-400 text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-2 animate-bounce-subtle shrink-0">
                               <AlertCircle className="w-3 h-3" />
                               <span>متأخرة نظامياً</span>
                            </span>
                          )}
                        </h3>

                        {(c.status === 'judgment_issued' || c.status === 'primary_judgment') && c.judgment_date && (
                          <div className={`mt-4 p-3.5 border rounded-2xl flex items-center justify-between animate-pulse ${
                            isHighContrast ? 'bg-rose-50 border-rose-900' : 'bg-rose-500/10 border-rose-500/30'
                          }`}>
                            <div className="flex items-center gap-2">
                              <BellRing className={`w-4 h-4 ${isHighContrast ? 'text-rose-900' : 'text-rose-500'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isHighContrast ? 'text-rose-950' : 'text-rose-500'}`}>مهلة الاستئناف</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className={`text-sm font-black ${isHighContrast ? 'text-slate-950' : 'text-white'}`}>{calculateDaysLeft(c.judgment_date)}</span>
                              <span className={`text-[10px] font-bold ${isHighContrast ? 'text-slate-700' : 'text-white font-black font-bold'}`}>أيـام متبقية</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusTransition(c, 'closed');
                                }}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black border border-[#ffff00] text-[#ffff00] bg-transparent transition-colors cursor-pointer z-35 shadow-sm"
                              >
                                أرشفة
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`تم تعيين تنبيه لهذه القضية (${c.caseNumber}). لتذكير المهام والجلسات قبل 24 ساعة عبر الإشعارات.`);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 transition-colors cursor-pointer z-[35] shadow-sm flex items-center gap-1"
                                title="تفعيل التنبيه المسبق (24 ساعة)"
                              >
                                🔔
                                <span className="text-[10px] font-black">تذكير 24س</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReportModalCase(c);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 transition-colors cursor-pointer z-[35] shadow-sm flex items-center gap-1"
                                title="توليد تقرير سريع"
                              >
                                <Printer className="w-3 h-3" />
                                <span className="text-[10px] font-black">تقرير سريع</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 relative z-10">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[#ffff00] font-extrabold text-[11px] uppercase tracking-[0.1em] font-sans flex items-center gap-1.5">
                            <CategoryIcon className="w-4 h-4 text-amber-300" />
                            {arabicCategoryName}
                          </span>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSummary(c.id);
                              }}
                              className="text-[10.5px] font-black px-3 py-1.5 rounded-lg border border-[#cfa036] bg-[#cfa036] text-[#012a5e] transition-all cursor-pointer z-35 font-sans shadow-lg shadow-amber-500/10"
                            >
                              {summaryVisibleIds.includes(c.id) ? 'إخفاء ملخص القضية ▲' : 'ملخص عن القضية 🔍 ▼'}
                            </button>

                            <div className="flex items-center gap-2 text-[11px] font-black text-white">
                              <span className="underline decoration-slate-600 underline-offset-4 text-shadow-sm text-white">المحكمة</span>
                              <span className="court-name-text text-amber-300 bg-white/10 p-1 px-3 rounded-lg border border-white/10 transition-all shadow-sm font-black text-[10px]">{c.courtName || 'المحكمة'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div ref={loadMoreRef} className="h-6 w-full mt-4 bg-transparent" />

          {isVirtualLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-6 animate-pulse">
              {[1, 2, 3].map((sIdx) => (
                <div key={sIdx} className="bg-[#020D1F]/90 border border-slate-800/80 p-10 flex flex-col justify-between rounded-3xl min-h-[350px] space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-800 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-slate-800 rounded w-1/4" />
                      <div className="h-2 bg-slate-800 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-5 bg-slate-800 rounded w-2/3" />
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-800 rounded" />
                    <div className="h-2 bg-slate-800 rounded w-5/6" />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="w-16 h-4 bg-slate-800 rounded animate-pulse" />
                    <div className="w-24 h-8 bg-slate-800 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050e21]/80 backdrop-blur-md p-6 animate-in fade-in duration-500">
          <div className="bg-[#050e21] border border-slate-800 rounded-[2.5rem] w-full max-w-5xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
            
            <div className="bg-gradient-to-br from-[#050e21] to-[#0c1a35] p-10 flex items-center justify-between text-white border-b border-primary/20">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="font-display font-black text-2xl tracking-tight uppercase text-white" style={{ color: '#ffffff' }}>منصة العدالة لإدارة مكاتب المحاماة</h2>
                  <p className="text-primary text-xs font-black mt-2 uppercase tracking-[0.2em] opacity-80">عميل جديد</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="w-12 h-12 bg-[#050e21] text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-8 pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                {/* Fieldset 1: الأساسيات */}
                <fieldset className="border border-[#D4AF37]/40 rounded-3xl p-6 space-y-6 bg-[#0a1e3f]/50 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                  <legend className="text-sm font-black text-[#FFD700] px-4 py-1.5 bg-[#050e21] border-2 border-[#D4AF37]/70 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">البيانات الأساسية</legend>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#FFD700] uppercase tracking-wider block">رقم الدعوى</label>
                    <input type="text" value={newCaseNumber} onChange={(e) => setNewCaseNumber(e.target.value)} placeholder="00000" required
                      className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#FFD700] uppercase tracking-wider block">مسمى الخصومة</label>
                    <input type="text" value={newCaseName} onChange={(e) => setNewCaseName(e.target.value)} placeholder="اسم الدعوى بالكامل" required
                      className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#FFD700] uppercase tracking-wider block">المحكمة</label>
                      <input type="text" value={newCourt} onChange={(e) => setNewCourt(e.target.value)} placeholder="اسم المحكمة"
                        className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#FFD700] uppercase tracking-wider block">التصنيف</label>
                      <select value={newCategory} onChange={(e) => { setNewCategory(e.target.value); }}
                        className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]"
                      >
                        <option value="criminal" className="bg-[#050e21] text-[#FF7F00]">جزائية 🛡️</option>
                        <option value="labor" className="bg-[#050e21] text-[#FF7F00]">عمالية 💼</option>
                        <option value="commercial" className="bg-[#050e21] text-[#FF7F00]">تجارية 🏛️</option>
                        <option value="personal_status" className="bg-[#050e21] text-[#FF7F00]">أحوال شخصية ⚖️</option>
                        <option value="administrative" className="bg-[#050e21] text-[#FF7F00]">إدارية 🏛️</option>
                        <option value="execution" className="bg-[#050e21] text-[#FF7F00]">منازعة تنفيذ ⚡</option>
                        <option value="consultation" className="bg-[#050e21] text-[#FF7F00]">استشارة قانونية 💡</option>
                        <option value="other" className="bg-[#050e21] text-[#FF7F00]">أخرى 📌</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                {/* Fieldset 2: الأطراف */}
                <fieldset className="border border-[#D4AF37]/40 rounded-3xl p-6 space-y-6 bg-[#0a1e3f]/50 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                  <legend className="text-sm font-black text-[#FFD700] px-4 py-1.5 bg-[#050e21] border-2 border-[#D4AF37]/70 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">بيانات الأطراف</legend>
                  
                  <div className="flex gap-6 mb-3">
                    <label className="flex items-center gap-2 text-base font-black text-white hover:text-[#FF7F00] transition-colors cursor-pointer">
                      <input type="radio" name="clientType" value="individual" checked={newClientType === 'individual'} onChange={() => setNewClientType('individual')} className="accent-[#FF7F00] h-5 w-5" />
                      فرد
                    </label>
                    <label className="flex items-center gap-2 text-base font-black text-white hover:text-[#FF7F00] transition-colors cursor-pointer">
                      <input type="radio" name="clientType" value="company" checked={newClientType === 'company'} onChange={() => setNewClientType('company')} className="accent-[#FF7F00] h-5 w-5" />
                      شركة تجارية
                    </label>
                  </div>

                  {newClientType === 'individual' ? (
                    <div className="space-y-4 transition-all duration-300">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-[#FFD700] uppercase block">العميل / المدعي (فرد)</label>
                        <div className="flex flex-col gap-3 relative">
                          <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="اسم المدعي بالكامل" required list="clients-list"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" 
                          />
                          <datalist id="clients-list">
                            {clients.map(cl => ( <option key={cl.id} value={cl.name} className="bg-[#050e21] text-[#FF7F00]" /> ))}
                          </datalist>
                          <input type="text" value={newPlaintiffNationalId} onChange={(e) => setNewPlaintiffNationalId(e.target.value)} placeholder="رقم هوية المدعي"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                          <input type="text" value={newPlaintiffPhone} onChange={(e) => setNewPlaintiffPhone(e.target.value)} placeholder="رقم هاتف المدعي"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-3 border-t-2 border-[#D4AF37]/20">
                        <label className="text-sm font-black text-[#FFD700] uppercase block">الخصم / المدعى عليه (فرد)</label>
                        <div className="flex flex-col gap-3">
                          <input type="text" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} placeholder="اسم المدعى عليه"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                          <input type="text" value={newOpponentNationalId} onChange={(e) => setNewOpponentNationalId(e.target.value)} placeholder="رقم هوية المدعى عليه"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                        </div>
                      </div>
 
                      <div className="space-y-2 pt-3 border-t-2 border-[#D4AF37]/20">
                         <div className="flex flex-col gap-3">
                          <input type="text" value={newPoANumber} onChange={(e) => setNewPoANumber(e.target.value)} placeholder="رقم الوكالة"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                          <input type="text" value={newNajizNumber} onChange={(e) => setNewNajizNumber(e.target.value)} placeholder="رقم الدعوى على ناجز (إن وجد)"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 transition-all duration-300">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-[#FFD700] uppercase block">بيانات الشركة (تجارية)</label>
                        <div className="flex flex-col gap-3">
                          <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="اسم الشركة" required
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                          <input type="text" value={newCompanyCR} onChange={(e) => setNewCompanyCR(e.target.value)} placeholder="رقم السجل التجاري أو الرقم الموحد"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-3 border-t-2 border-[#D4AF37]/20">
                         <div className="flex flex-col gap-3">
                          <input type="text" value={newPoANumber} onChange={(e) => setNewPoANumber(e.target.value)} placeholder="رقم الوكالة (إن وجد)"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                          <input type="text" value={newNajizNumber} onChange={(e) => setNewNajizNumber(e.target.value)} placeholder="رقم الدعوى على ناجز (إن وجد)"
                            className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                         </div>
                      </div>
                    </div>
                  )}
                </fieldset>

                {/* Fieldset 3: التفاصيل وتاريخ الجلسة */}
                <fieldset className="border border-[#D4AF37]/40 rounded-3xl p-6 space-y-6 bg-[#0a1e3f]/50 flex flex-col relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                  <legend className="text-sm font-black text-[#FFD700] px-4 py-1.5 bg-[#050e21] border-2 border-[#D4AF37]/70 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">الجدولة والملاحظات</legend>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#FFD700] uppercase block">تاريخ الجلسة القادمة</label>
                    <input type="date" value={newNextDate} onChange={(e) => setNewNextDate(e.target.value)}
                      className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00]" />
                  </div>
                  <div className="space-y-2 flex-grow flex flex-col relative">
                    <label className="text-sm font-black text-[#FFD700] uppercase block">مذكرة الملخص السريع</label>
                    <textarea value={newSummary} onChange={(e) => setNewSummary(e.target.value)} placeholder="اكتب ملخصاً هنا..."
                      className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00] resize-none flex-grow min-h-[90px]"
                    ></textarea>
                  </div>
                  <div className="space-y-2 flex-grow flex flex-col relative">
                    <label className="text-sm font-black text-[#FFD700] uppercase block">تفاصيل الدعوى</label>
                    <textarea value={newDetails} onChange={(e) => setNewDetails(e.target.value)} placeholder="اكتب التفاصيل الهامة..."
                      className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black text-[#FF7F00] placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] focus:ring-1 focus:ring-[#FF7F00] resize-none flex-grow min-h-[90px]"
                    ></textarea>
                  </div>
                </fieldset>
              </div>

              <div className="flex gap-4 pt-6 mt-4 border-t border-slate-800 w-full justify-end">
                <button type="button" onClick={() => setIsCreateOpen(false)}
                  className="bg-[#0c1a35] text-white font-bold font-black py-3 px-8 rounded-xl text-xs uppercase transition-all border border-slate-700 cursor-pointer"
                >إلغاء</button>
                <button type="submit"
                  className="bg-amber-400 text-blue-950 font-black py-3 px-12 rounded-xl text-xs uppercase transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] border border-amber-500 cursor-pointer"
                >حفظ الدعوى والمزامنة تلقائياً</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scanned Document Attachments Upload Modal */}
      {isUploadOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050e21]/90 backdrop-blur-xl p-6 animate-in fade-in duration-500">
          <div className="bg-[#050e21]  border border-slate-800  rounded-[3rem] w-full max-w-xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
            
            <div className="bg-gradient-to-br from-[#050e21] to-[#0c1a35] p-10 flex items-center justify-between text-white border-b border-primary/20">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                  <Paperclip className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="font-display font-black text-2xl tracking-tight uppercase">مركز أرشفة الوثائق السحابي</h2>
                  <p className="text-primary text-xs font-black mt-2 uppercase tracking-[0.2em] opacity-80">Secure Legal Asset Repository</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadingState('idle');
                  setAttachFileName('');
                }}
                className="w-12 h-12 bg-[#050e21][#050e21] text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => handleAttachFileSubmit(e, selectedCase)} className="p-12 space-y-10">
              {/* Virtual Drag and Drop Area */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDropInCases}
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-primary/10 transition-colors rounded-[2.5rem] p-12 bg-[#0c1a35]  text-center flex flex-col items-center justify-center space-y-6 group cursor-pointer shadow-inner"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChangeInCases} 
                  className="hidden" 
                  accept=".pdf,.docx" 
                />
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center transition-transform duration-500">
                   <Download className="w-10 h-10 text-primary animate-bounce" />
                </div>
                <div>
                  <span className="text-sm  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-black block mb-2">إسقاط وثائق الـ PDF أو الـ Word هنا أو انقر لاختيار ملف</span>
                  <span className="text-xs  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-bold uppercase tracking-[0.2em]">encrypted protocol material v4.0.1</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   uppercase tracking-widest block">مسمى الوثيقة القانونية</label>
                  <input 
                    type="text"
                    value={attachFileName}
                    onChange={(e) => setAttachFileName(e.target.value)}
                    placeholder="مذكرة_الرد_على_بينة_المدعي"
                    required
                    className="w-full bg-[#0c1a35]  border border-slate-800  rounded-2xl py-5 px-6 text-sm font-black  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   focus:outline-none focus:border-primary shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                  <div className="space-y-3">
                    <label className="text-xs font-black  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   uppercase tracking-widest block">صيغة الملف الاحترافية</label>
                    <select
                      value={attachFileType}
                      onChange={(e: any) => setAttachFileType(e.target.value)}
                      className="w-full bg-[#0c1a35]  border border-slate-800  rounded-2xl py-5 px-5 text-xs font-black  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   focus:outline-none focus:border-primary"
                    >
                      <option value="pdf">Protected PDF (Highly Secure)</option>
                      <option value="docx">Word Document (Editable)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   uppercase tracking-widest block">معيار الجودة والدقة</label>
                    <select
                      value={attachFileSize}
                      onChange={(e) => setAttachFileSize(e.target.value)}
                      className="w-full bg-[#0c1a35]  border border-slate-800  rounded-2xl py-5 px-5 text-xs font-black  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   focus:outline-none focus:border-primary"
                    >
                      <option value="1.5 MB">Optimal (1.5 MB)</option>
                      <option value="4.2 MB">High-Res Scanner (4.2 MB)</option>
                      <option value="850 KB">Monochrome Print (850 KB)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Progress Bar Simulation */}
              {uploadingState === 'uploading' && (
                <div className="space-y-3 bg-[#0c1a35]  p-6 rounded-3xl border border-slate-800  shadow-inner">
                  <div className="flex justify-between text-xs font-black  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   uppercase tracking-widest font-sans">
                    <span>{uploadProgress}% جاري التشفير والمزامنة</span>
                    <span className="text-primary">Processing Assets...</span>
                  </div>
                  <div className="w-full bg-[#050e21]  rounded-full h-2.5 overflow-hidden border border-slate-800 ">
                    <motion.div 
                      className="bg-gradient-to-r from-primary to-primary-light h-full rounded-full transition-all shadow-[0_0_15px_rgba(184,134,11,0.4)]" 
                      style={{ width: `${uploadProgress}%` }}
                    ></motion.div>
                  </div>
                </div>
              )}

              {uploadingState === 'completed' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500 border border-emerald-500 py-5 px-6 rounded-2xl text-center text-xs text-emerald-500 font-extrabold flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">✓</div>
                  <span className="uppercase tracking-widest">Protocol Success: Asset Secured and Synced</span>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setUploadingState('idle');
                    setAttachFileName('');
                  }}
                  className="flex-1 bg-slate-100   text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-black py-5 rounded-[1.5rem] text-xs uppercase tracking-widest"
                >
                  إلغاء التراجع
                </button>
                <button 
                  type="submit"
                  disabled={uploadingState === 'uploading' || uploadingState === 'completed'}
                  className="flex-[2] bg-primary text-white font-black py-5 rounded-[1.5rem] text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all border border-primary-light/20 uppercase tracking-widest disabled:opacity-50"
                >
                  بدء الرفع والترميز الاحترافي 📎
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Log / Timeline Sidebar Drawer */}
      <AnimatePresence>
        {activityLogCaseId && (() => {
          const activeC = filteredCases.find(item => item.id === activityLogCaseId) || cases.find(item => item.id === activityLogCaseId);
          if (!activeC) return null;
          const timelineData = getCaseActivityTimeline(activeC);
          return (
            <div className="fixed inset-0 z-50 overflow-hidden font-sans" dir="rtl">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setActivityLogCaseId(null)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              {/* Drawer Container */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 w-full max-w-lg bg-[#050e21] border-l border-slate-800 shadow-2xl flex flex-col justify-between"
              >
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#09101f] backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-display font-black text-white text-base">سجل النشاط والتعديلات العدلية</h3>
                        <p className="text-[10px] font-mono text-amber-500 tracking-wider">Activity History: #{activeC.caseNumber}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActivityLogCaseId(null)}
                      className="p-1.5 rounded-lg text-white font-black font-bold transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2 text-right">
                      <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest block">الدعوى المستهدفة</span>
                      <h4 className="text-sm font-black text-white leading-snug">{activeC.caseName}</h4>
                      <div className="flex justify-between items-center text-xs text-white font-black font-bold pt-3 border-t border-slate-800/65">
                        <span>العميل: <strong className="text-white font-bold">{activeC.clientName}</strong></span>
                        <span>رقم القضية: <strong className="text-white font-bold font-mono">#{activeC.caseNumber}</strong></span>
                      </div>
                    </div>

                    <div className="relative border-r-2 border-slate-800 mr-3 pr-6 space-y-8 py-3 text-right">
                      {timelineData.map((t, tIdx) => (
                        <div key={tIdx} className="relative">
                          {/* Timeline dot */}
                          <span className="absolute -right-[31px] top-1.5 w-3 h-3 rounded-full border-4 border-[#050e21] bg-amber-500 ring-4 ring-amber-500/10 shadow-lg" />
                          
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                              <span className="text-[10px] font-mono bg-slate-950 text-white font-bold border border-slate-850 px-2 py-0.5 rounded-md font-bold direction-ltr">
                                {t.date} • {t.time}
                              </span>
                              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20`}>
                                {t.badge}
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-white">{t.title}</h5>
                            <p className="text-[11px] text-white font-bold leading-relaxed font-bold">{t.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-[#09101f] text-center">
                  <button 
                    onClick={() => setActivityLogCaseId(null)}
                    className="w-full bg-[#050e21][#0c1a35] text-white border border-slate-800 text-xs font-black py-4 rounded-xl transition-all cursor-pointer"
                  >
                    إغلاق سجل النشاط عدليّاً
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      <DocumentVaultModal />
      <AnimatePresence>
        {reportModalCase && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
            dir="rtl"
          >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setReportModalCase(null)}></div>
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-900 text-lg">تقرير حالة القضية</h3>
                </div>
                <button onClick={() => setReportModalCase(null)} className="p-2 text-white font-black font-bold hover:text-white font-black font-bold cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl mb-6">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                     <FileText className="w-6 h-6 text-white font-black font-bold" />
                   </div>
                   <h4 className="text-sm font-black text-slate-800">توليد تقرير وملخص للقضية</h4>
                   <p className="text-xs text-center text-slate-700 font-bold mt-2">
                      تم تجهيز ملخص جاهز للطباعة يحتوي على رقم القضية واسم الموكل وتاريخ الجلسة القادمة.
                   </p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                        printWindow.document.write(`
                            <html dir="rtl"><head><title>تقرير القضية - ${reportModalCase.caseNumber}</title>
                            <style>
                                body { font-family: system-ui, sans-serif; padding: 40px; color: #020617; }
                                .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start; }
                                .title { margin: 0; font-size: 24px; color: #0f172a; }
                                .date { color: #64748b; font-size: 14px; }
                                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
                                .label { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
                                .value { font-size: 16px; font-weight: bold; margin: 0; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9; }
                                .summary { line-height: 1.6; font-size: 14px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9; }
                            </style>
                            </head><body>
                            <div class="header">
                                <div>
                                    <h1 class="title">تقرير حالة الدعوى</h1>
                                    <p class="date">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</p>
                                </div>
                            </div>
                            <div class="grid">
                                <div><div class="label">اسم الموكل</div><div class="value">${reportModalCase.clientName}</div></div>
                                <div><div class="label">رقم الدعوى</div><div class="value">${reportModalCase.caseNumber}</div></div>
                                <div><div class="label">الحالة الحالية</div><div class="value">${reportModalCase.status}</div></div>
                                <div><div class="label">تاريخ الجلسة القادمة</div><div class="value" style="color: #e11d48; font-weight: bold;">${reportModalCase.nextSessionDate || 'غير محدد'}</div></div>
                            </div>
                            <div class="label">ملخص البيان</div>
                            <div class="summary">${reportModalCase.summary || 'لا توجد بيانات تفصيلية مسجلة.'}</div>
                            </body></html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                    }
                    setReportModalCase(null);
                  }}
                  className="flex-[2] bg-slate-900 border border-slate-900 text-white font-black py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                >
                  صياغة وطباعة
                </button>
                <button 
                  onClick={() => setReportModalCase(null)}
                  className="flex-[1] bg-white border border-slate-200 text-slate-700 font-black py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
