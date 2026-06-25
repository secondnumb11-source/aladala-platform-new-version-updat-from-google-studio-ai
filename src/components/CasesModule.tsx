/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppState } from '@/hooks/useAppState';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Cpu, 
  FileText, 
  DollarSign, 
  Clock, 
  Loader2,
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
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveCard } from './InteractiveCard';
import { Case, Client, Attachment } from '@/types';
import { useAdaptiveContrast } from '../utils/themeUtils';
import CasesList from './cases/CasesList';
import CaseStatisticsBar from './cases/CaseStatisticsBar';
import CaseFilters from './cases/CaseFilters';
import AddCaseModal from './cases/AddCaseModal';
import EnhancedCaseDetail from './cases/EnhancedCaseDetail';
import DashboardStatistics from './cases/DashboardStatistics';
import { jsPDF } from 'jspdf';

const CaseAnalyticsDashboard = React.lazy(() => import('./cases/CaseAnalyticsDashboard'));
const TimelineD3 = React.lazy(() => import('./TimelineD3'));
import { Suspense } from 'react';

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
    tags.push(`محكمة_${c.courtName.split(' ').join('_')}`);
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
  let statusColor = 'bg-slate-100 border-slate-900 text-slate-950 dark:bg-slate-800 dark:bg-opacity-80';
  
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
  const hash = (c.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lawyers = ['المحامي أحمد البقمي', 'د. عادل القحطاني', 'أ. خالد الغامدي'];
  return lawyers[hash % lawyers.length];
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
            <div className="h-3 w-full bg-slate-900 border border-slate-700 rounded-full overflow-hidden transition-all shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500 transition-all"
              />
            </div>
          </div>
        );
      };

  const SummaryCharts = ({ cases, preferences, updatePreference, themeTick }: { cases: Case[], preferences: any, updatePreference: any, themeTick: number }) => {
    // Control States
    const [chartSize, setChartSize] = useState<'tiny' | 'shrunk' | 'regular'>(preferences.charts_card_size || 'shrunk');
    const [chartOrder, setChartOrder] = useState<'donut-first' | 'bar-first'>(preferences.charts_order || 'donut-first');
    const [chartColorTheme, setChartColorTheme] = useState<'classic' | 'ocean' | 'emerald' | 'gold'>(preferences.charts_theme || 'gold');
    const [chartVizType, setChartVizType] = useState<'bar' | 'area' | 'line'>(preferences.charts_viz_type || 'bar');

    useEffect(() => {
      updatePreference('charts_card_size', chartSize);
      updatePreference('charts_order', chartOrder);
      updatePreference('charts_theme', chartColorTheme);
      updatePreference('charts_viz_type', chartVizType);
    }, [chartSize, chartOrder, chartColorTheme, chartVizType]);

    const data = React.useMemo(() => {
      const categoriesList = ['commercial', 'labor', 'civil', 'criminal', 'personal_status', 'administrative', 'financial', 'execution', 'other'];
      return categoriesList.map(cat => {
        const catCases = (cases || []).filter(c => c && c.category === cat && !c.archived);
        const catClosed = (cases || []).filter(c => c && c.category === cat && (c.status === 'closed' || c.archived)).length;
        return {
          name: cat,
          active: catCases.filter(c => c && c.status !== 'closed' && !c.archived).length,
          closed: catClosed,
          total: catCases.length + catClosed
        };
      }).filter(d => d.total > 0);
    }, [cases]);

    const activeTotal = React.useMemo(() => (cases || []).filter(c => c && c.status !== 'closed' && !c.archived).length, [cases]);
    const closedTotal = React.useMemo(() => (cases || []).filter(c => c && (c.status === 'closed' || c.archived)).length, [cases]);

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
        {/* User Control Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-800 font-bold shadow-xl relative z-25">
          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-white text-[10px]">مظهر ولون البيانات:</span>
              <div className="flex gap-1 bg-black/40 p-0.5 rounded border border-slate-750">
                <button type="button" onClick={() => setChartColorTheme('gold')} className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartColorTheme === 'gold' ? 'bg-[#ffff00] text-slate-950' : 'text-white font-bold'}`}>ذهبي</button>
                <button type="button" onClick={() => setChartColorTheme('classic')} className={`px-2 py-0.5 rounded text-[9.5px] font-black cursor-pointer transition-all ${chartColorTheme === 'classic' ? 'bg-[#b8860b] text-white' : 'text-white font-bold'}`}>كلاسيك</button>
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

        <React.Suspense fallback={<div className="p-10 text-center text-white font-black text-xs animate-pulse">جاري تحليل البيانات واستعراض المخططات...</div>}>
          <CaseAnalyticsDashboard 
            data={data}
            activeTotal={activeTotal}
            closedTotal={closedTotal}
            chartSize={chartSize}
            chartVizType={chartVizType}
            chartOrder={chartOrder}
            chartColorTheme={chartColorTheme}
            themeTick={themeTick}
          />
        </React.Suspense>
      </div>
    );
  };
interface CasesModuleProps {
  cases: Case[];
  clients: Client[];
  selectedRole: string;
  onUpdateState: (type: string, data: any) => any;
  onSelectCase: (caseObj: Case | null) => void;
  selectedCase: Case | null;
  archivedNotice?: { count: number; onRestore: () => void; onClose: () => void };
  onDeleteCase?: (id: string | number) => void;
  externalCategoryFilter?: string; // استقبال قيم التصنيفات (مدنية، تجارية، عمالية، شخصية)
  onCategoryFilterChange?: (category: string) => void;
}

import { useRenderPerformance } from '../lib/PerformanceOptimizer';
import { generateUUID } from '@/lib/uuid';

export default React.memo(function CasesModule({
  cases,
  clients,
  selectedRole,
  onUpdateState,
  onSelectCase,
  selectedCase,
  archivedNotice,
  onDeleteCase,
  externalCategoryFilter,
  onCategoryFilterChange
}: CasesModuleProps) {
  const { state, setStateData } = useAppState();
  const draft = state.case_form_draft;
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

  // إضافة جلب البيانات المباشر من قاعدة البيانات لضمان ظهور قضايا ناجز والقضايا الجديدة
  useEffect(() => {
    const loadCasesFromDB = async () => {
      try {
        const officeId = typeof window !== 'undefined' ? localStorage.getItem('adala_office_id') : null;
        if (!officeId) return;

        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('office_id', officeId)
          .eq('archived', false)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('[Cases Load Error]', error);
          return;
        }
        
        if (data && data.length > 0) {
          // تحويل البيانات من snake_case إلى camelCase
          const mappedCases = data.map(c => ({
            id: c.id,
            caseNumber: c.case_number || '',
            caseName: c.title || c.case_name || 'قضية ناجز',
            category: c.category || 'other',
            stage: c.stage || 'litigation',
            status: c.status || 'active',
            clientName: c.client_name || 'عميل ناجز',
            clientId: c.client_id,
            opponentName: c.opponent_name || '',
            courtName: c.court_name || '',
            nextSessionDate: c.next_session_at ? c.next_session_at.split('T')[0] : '',
            nextSessionTime: c.next_session_time || '',
            summary: c.summary || '',
            details: c.details || '',
            isNajizSync: c.is_najiz_sync || false,
            najizCaseNumber: c.najiz_case_number,
            priority: c.priority || 'medium',
            isConfidential: c.is_confidential || false,
            archived: c.archived || false,
            createdAt: c.created_at
          }));
          
          // دمج مع القضايا الموجودة في الـ State (لتجنب التكرار)
          // القضايا من DB لها أولوية. handleUpdateGlobalState سيتولى التحديث الآمن
          for (const mc of mappedCases) {
            const alreadyExists = (cases || []).some(x => x && (x.id === mc.id || (x.caseNumber === mc.caseNumber && x.caseNumber)));
            if (!alreadyExists) {
              onUpdateState('cases', mc);
            }
          }
          
          console.log(`[Cases] تم تحميل ${mappedCases.length} قضية من قاعدة البيانات`);
        }
      } catch (err) {
        console.error('[Cases DB Load Exception]', err);
      }
    };
    
    loadCasesFromDB();
    
    const handleSyncComplete = () => {
      console.log('[CasesModule] Najiz sync detected, reloading cases...');
      loadCasesFromDB();
    };
    window.addEventListener('najiz_sync_complete', handleSyncComplete);
    return () => {
      window.removeEventListener('najiz_sync_complete', handleSyncComplete);
    };
  }, [cases.length]); // إعادة التحميل عند تغير الطول لضمان المزامنة

  const getInteractiveCaseStyles = (category: string, status: string) => {
    let arabicCategoryName = 'أخرى أو عامة';
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
    if (c.attachments_count && c.attachments_count > 0) {
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
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isMetaDropdownOpen, setIsMetaDropdownOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState({ opponent: '', circuit: '', judgmentCategory: '' });

  const uniqueOpponents = React.useMemo(() => {
    const names = (cases || [])
      .map(c => c.opponentName?.trim())
      .filter((name): name is string => typeof name === 'string' && name.length > 0);
    return Array.from(new Set(names));
  }, [cases]);

  const uniqueCircuits = React.useMemo(() => {
    const circuits = (cases || [])
      .map(c => c.circuitNumber?.trim())
      .filter((num): num is string => typeof num === 'string' && num.length > 0);
    return Array.from(new Set(circuits));
  }, [cases]);

  // Computed real-time statistics counters from Supabase sync
  const statsSummary = React.useMemo(() => {
    const safeCases = cases || [];
    const activeCount = safeCases.filter(c => !c.archived && (c.status === 'active' || c.status === 'under_study' || c.status === 'pending_session')).length;
    
    const adjudicatedCount = safeCases.filter(c => !c.archived && (
      c.status === 'judgment_issued' || 
      c.status === 'final_judgment' || 
      c.status === 'primary_judgment' ||
      c.status === 'appeal'
    )).length;
    
    const closedCount = safeCases.filter(c => c.archived || c.status === 'closed').length;
    
    return {
      active: activeCount,
      adjudicated: adjudicatedCount,
      closed: closedCount,
      total: safeCases.length
    };
  }, [cases]);
  const [lastSessionFilter, setLastSessionFilter] = useState('');
  const [nextAppointmentFilter, setNextAppointmentFilter] = useState('');
  const [nextAppointmentFilterType, setNextAppointmentFilterType] = useState<'all' | 'all_scheduled' | 'today' | 'soon' | 'month' | 'custom'>('all');
  const [isNextSessionDropdownOpen, setIsNextSessionDropdownOpen] = useState(false);
  const [selectedDocTag, setSelectedDocTag] = useState('all');
  const [activityLogCaseId, setActivityLogCaseId] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [archiveTypeFilter, setArchiveTypeFilter] = useState('all');

  // Real-time live query to Supabase whenever Next Session Date filter changes
  useEffect(() => {
    const fetchFilteredNextSessionFromSupabase = async () => {
      if (nextAppointmentFilterType === 'all') return;
      
      try {
        console.log(`[Supabase Filter] Fetching cases from Supabase where next appointment is filtered by: ${nextAppointmentFilterType}`);
        const officeId = typeof window !== 'undefined' ? localStorage.getItem('adala_office_id') : null;
        let query = supabase.from('cases').select('*').eq('archived', false);
        if (officeId) {
          query = query.eq('office_id', officeId);
        }
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (nextAppointmentFilterType === 'today') {
          query = query.eq('next_session_at', todayStr);
        } else if (nextAppointmentFilterType === 'soon') {
          const today = new Date();
          const sevenDaysLater = new Date();
          sevenDaysLater.setDate(today.getDate() + 7);
          const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];
          query = query.gte('next_session_at', todayStr).lte('next_session_at', sevenDaysStr);
        } else if (nextAppointmentFilterType === 'month') {
          const today = new Date();
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(today.getDate() + 30);
          const thirtyDaysStr = thirtyDaysLater.toISOString().split('T')[0];
          query = query.gte('next_session_at', todayStr).lte('next_session_at', thirtyDaysStr);
        } else if (nextAppointmentFilterType === 'custom' && nextAppointmentFilter) {
          query = query.eq('next_session_at', nextAppointmentFilter);
        } else if (nextAppointmentFilterType === 'all_scheduled') {
          query = query.not('next_session_at', 'is', null);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
          console.error('[Supabase Next Session Filter Error]', error);
          return;
        }
        
        if (data) {
          const mappedCases = data.map(c => ({
            id: c.id,
            caseNumber: c.case_number || '',
            caseName: c.title || c.case_name || 'قضية ناجز',
            category: c.category || 'other',
            stage: c.stage || 'litigation',
            status: c.status || 'active',
            clientName: c.client_name || 'عميل ناجز',
            clientId: c.client_id,
            opponentName: c.opponent_name || '',
            courtName: c.court_name || '',
            nextSessionDate: c.next_session_at ? c.next_session_at.split('T')[0] : '',
            nextSessionTime: c.next_session_time || '',
            summary: c.summary || '',
            details: c.details || '',
            isNajizSync: c.is_najiz_sync || false,
            najizCaseNumber: c.najiz_case_number,
            priority: c.priority || 'medium',
            isConfidential: c.is_confidential || false,
            archived: c.archived || false,
            createdAt: c.created_at
          }));
          
          // Upsert into active state via onUpdateState
          for (const mc of mappedCases) {
            onUpdateState('cases', mc);
          }
          console.log(`[Supabase Filter] Loaded ${mappedCases.length} cases matching next session filter: ${nextAppointmentFilterType}`);
        }
      } catch (err) {
        console.error('[Supabase Next Session Filter Exception]', err);
      }
    };
    
    fetchFilteredNextSessionFromSupabase();
  }, [nextAppointmentFilterType, nextAppointmentFilter]);

  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  const allDocuments = React.useMemo(() => {
    const docs: any[] = [];
    (cases || []).forEach(c => {
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
    const matchSearch = (doc.name || '').toLowerCase().includes(archiveSearchTerm.toLowerCase()) || 
                      (doc.caseNumber || '').includes(archiveSearchTerm) ||
                      (doc.caseName || '').toLowerCase().includes(archiveSearchTerm.toLowerCase());
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
                  <h2 className="text-xl font-black text-white tracking-tight">الأرشيف السحابي والأرشفة الإلكترونية</h2>
                  <p className="text-xs text-slate-300 font-bold mt-1">إدارة مركزية لكافة المذكرات، اللوائح، والأحكام القضائية الصادرة.</p>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={archiveSearchTerm}
                  onChange={(e) => setArchiveSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 outline-none"
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
                  <p className="text-slate-300 font-bold">لا توجد نتائج مطابقة لبحثك في الأرشيف.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArchiveDocuments.map((doc, idx) => (
                    <div key={idx} className="group bg-slate-50 border border-slate-300 p-6 rounded-3xl transition-all duration-300 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full -mr-12 -mt-12 transition-colors"></div>
                      
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className={`p-3 rounded-2xl ${
                          doc.type === 'pdf' ? 'bg-rose-100 text-rose-950 border border-rose-300' : 
                          doc.type === 'docx' ? 'bg-blue-100 text-blue-950 border border-blue-300' : 
                          'bg-emerald-100 text-emerald-950 border border-emerald-300'
                        }`}>
                          <FileText className="w-6 h-6 stroke-[2.5px]" />
                        </div>
                        <button className="p-2 text-slate-800 hover:text-slate-950 font-black transition-colors">
                          <Download className="w-5 h-5 stroke-[2.5px]" />
                        </button>
                      </div>

                      <div className="space-y-2.5 relative z-10">
                        <h4 className="font-extrabold text-slate-950 text-sm leading-relaxed">{doc.name}</h4>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-slate-200 text-slate-950 border border-slate-400">
                            {doc.size}
                          </span>
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 shadow-sm">
                            #{doc.caseNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-900 font-extrabold mt-2.5 truncate">القضية: {doc.caseName}</p>
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
  const { preferences, updatePreference, loading } = useUserPreferences();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isSwitchingView, setIsSwitchingView] = useState(false);
  const [cardScale, setCardScale] = useState(1);
  const [gridDensity, setGridDensity] = useState<'compact' | 'relaxed'>('relaxed');

  const cleanupViewSwitch = async () => {
    try {
      // 1. Cancel Supabase Realtime subscriptions to prevent memory leaks during view switch
      await supabase.removeAllChannels();
      console.log('[CasesModule] Supabase channels cleaned up on view switch');
      
      // 2. Clear state cache
      setExpandedCaseModal(null);
      setReportModalCase(null);
      setActiveDropdownId(null);
      setAiAnalysis('');
    } catch (error) {
      console.error('[CasesModule] Error during view switch cleanup:', error);
    }
  };

  // Unified reload function to reload case cards, ensuring memory cleanup and forcing component re-render when switching views
  const reloadCaseCardsWithCleanup = async (newMode: 'grid' | 'table') => {
    setIsSwitchingView(true);
    
    // 1. Perform exhaustive memory cleanup
    await cleanupViewSwitch();
    
    // 2. Trigger a light memory release signal in window if in browser environment
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adalah-cases-memory-cleanup'));
    }
    
    // 3. Force DOM detach to completely unmount current state before switching with a safety timeout
    setTimeout(() => {
      setViewMode(newMode);
      
      // 4. Force garbage collection if available
      if (typeof window !== 'undefined' && (window as any).gc) {
        try { (window as any).gc(); } catch (e) {}
      }
      
      // 5. Restore view state with safety delays to allow React to paint the blank state
      setTimeout(() => {
        setIsSwitchingView(false);
        console.log(`[CasesModule] Unified reload successfully completed for mode: ${newMode}`);
      }, 100);
    }, 20);
  };

  const handleViewModeSwitch = async (newMode: 'grid' | 'table') => {
    if (viewMode === newMode) return;
    await reloadCaseCardsWithCleanup(newMode);
  };

  // useEffect to monitor changes in viewMode (conceptual currentView) to clean up abortController and active Supabase subscriptions
  useEffect(() => {
    const abortController = new AbortController();
    
    const cleanupCentralized = () => {
      console.log('[CasesModule] Running centralized cleanup for viewMode switch...');
      
      // Cancel pending async and fetch operations using AbortController
      abortController.abort();
      
      // Clear event listeners
      window.removeEventListener('resize', () => {});
      document.removeEventListener('keydown', () => {});
      
      // Unsubscribe all active Supabase Realtime channels/subscriptions to prevent memory leaks and locks
      try {
        supabase.removeAllChannels()
          .then(() => {
            console.log('[CasesModule] Supabase Realtime channels successfully unsubscribed via centralized cleanup');
          })
          .catch(err => {
            console.error('[CasesModule] Error removing Supabase Realtime channels:', err);
          });
      } catch (err) {
        console.error('[CasesModule] Error executing removeAllChannels:', err);
      }
      
      // Free/empty cache memory, temporary states, and unregister active observers/listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('adalah-cases-memory-cleanup'));
        
        // Force garbage collection attempt if running in environment supporting it
        if ((window as any).gc) {
          try { (window as any).gc(); } catch (e) {}
        }
      }
      
      // Nullify heavy state or caches to free memory reference chain
      setExpandedCaseModal(null);
      setReportModalCase(null);
      setActiveDropdownId(null);
    };

    return () => {
      cleanupCentralized();
    };
  }, [viewMode]);

  useEffect(() => {
    if (!loading && preferences) {
      if (preferences.cases_view_mode) setViewMode(preferences.cases_view_mode);
      if (preferences.card_scale !== undefined) setCardScale(preferences.card_scale);
      if (preferences.grid_density) setGridDensity(preferences.grid_density);
    }
  }, [loading, preferences]);

  const [cardTransitionSpeed, setCardTransitionSpeed] = useState(0.4);

  useEffect(() => {
    if (!loading && preferences?.card_transition_duration !== undefined) {
      setCardTransitionSpeed(preferences.card_transition_duration);
    }
  }, [loading, preferences?.card_transition_duration]);

  useEffect(() => {
    if (!loading) {
      updatePreference('cases_view_mode', viewMode);
      updatePreference('card_scale', cardScale);
      updatePreference('grid_density', gridDensity);
    }
  }, [viewMode, cardScale, gridDensity, loading]);

  const [showScheduledOnly, setShowScheduledOnly] = useState(false);

  const categories = [
    { id: 'all', label: 'كافة التصنيفات 📋', icon: Layers },
    { id: 'civil', label: 'حقوقية / مدنية 📜', icon: Scale },
    { id: 'commercial', label: 'تجارية 🏛️', icon: Building2 },
    { id: 'labor', label: 'عمالية 💼', icon: Briefcase },
    { id: 'personal_status', label: 'أحوال شخصية ⚖️', icon: Users },
    { id: 'criminal', label: 'جنائية / جزائية 🛡️', icon: ShieldAlert },
    { id: 'administrative', label: 'إدارية 🏛️', icon: Gavel },
    { id: 'financial', label: 'مالية 🪙', icon: DollarSign },
    { id: 'archived', label: 'الأرشيف 📦', icon: Archive },
  ];

  // Virtual scrolling / Infinite scroll loading state with skeletal loading indicator
  const [visibleCount, setVisibleCount] = useState(6);
  useEffect(() => {
    if (!loading && preferences?.visible_cases_count !== undefined) {
      setVisibleCount(preferences.visible_cases_count);
    }
  }, [loading, preferences?.visible_cases_count]);
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

  const handleExportToPdf = (c: Case) => {
    if (!c) return;
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Drawing elegant gold / navy border & branding
      doc.setDrawColor(184, 134, 11); // Gold tint
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287); // Page Frame

      doc.setFillColor(15, 23, 42); // Navy Slate 900
      doc.rect(5, 5, 200, 30, 'F');

      // Title & Subtitle
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("AL-ADALAH LAW FIRM", 105, 17, { align: 'center' });
      doc.setFontSize(10);
      doc.text("CASE SUMMARY FILE  |  OFFICIAL JUSTICE HQ INTEGRATION", 105, 26, { align: 'center' });

      // Body Metadata Details
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text(`CASE NUMBER REFERENCE: [ ${c.caseNumber || 'N/A'} ]`, 15, 48);
      
      doc.setDrawColor(226, 232, 240); // slate-200 line
      doc.setLineWidth(0.5);
      doc.line(15, 53, 195, 53);

      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85); // Slate 600

      doc.text(`File Registry ID: ${c.id || 'N/A'}`, 15, 62);
      doc.text(`System Category / Branch: ${c.category || 'N/A'}`, 15, 70);
      doc.text(`Active Court Status Code: ${c.status || 'N/A'}`, 15, 78);
      doc.text(`Lead Registered Client: ${c.clientName || 'N/A'}`, 15, 86);
      doc.text(`Designated Opponent party: ${c.opponentName || 'N/A'}`, 15, 94);
      doc.text(`Subject Jurisdiction Court: ${c.courtName || 'N/A'}`, 15, 102);
      doc.text(`Next Recorded Session Date: ${c.nextSessionDate || 'N/A'} (${c.nextSessionTime || 'N/A'})`, 15, 110);
      doc.text(`Assigned Lead Attorney: ${c.lead_lawyer_id || 'AL-ADALAH SENIOR COUNSEL'}`, 15, 118);

      doc.line(15, 125, 195, 125);

      // Plain English / Transliterated text fallback mapping to ensure zero rendering issues with standard PDF layout:
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text("CASE DETAILS & DIRECTORY CONTEXTS:", 15, 134);
      doc.rect(15, 139, 180, 52);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      const detailsCleanText = c.details || "No secondary notes provided yet on this directory record file.";
      const splitDetails = doc.splitTextToSize(detailsCleanText, 170);
      doc.text(splitDetails, 18, 145);

      // AI Summary Section
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text("INTELLIGENT AI SYSTEM SUMMARY MEMO:", 15, 203);
      doc.rect(15, 208, 180, 52);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      const summaryCleanText = c.summary || "No active smart analysis summarized yet on this case directory file. Run 'AI Legal Assistant' to populate summary.";
      const splitSummary = doc.splitTextToSize(summaryCleanText, 170);
      doc.text(splitSummary, 18, 214);

      // Footer brand marks
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 268, 195, 268);
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text("Official Case Document Generated Automatically through Al-Adalah Justice Suite Cloud.", 105, 276, { align: 'center' });
      doc.text(`Secure Local Print Timestamp: ${new Date().toLocaleString('en-US')}`, 105, 281, { align: 'center' });

      doc.save(`AlAdalah_Summary_CaseRef_${c.caseNumber || c.id}.pdf`);
    } catch (e: any) {
      alert("حدث خطأ أثناء صياغة ملف PDF: " + e.message);
    }
  };

  const countByCategory = (cat: string) => {
    const safeCases = cases || [];
    if (cat === 'archived') {
      return safeCases.filter(c => c && (c.archived === true || c.status === 'closed')).length;
    }
    return safeCases.filter(c => c && c.category === cat && !c.archived).length;
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
      setCaseDocumentMemo(selectedCase.summary || '');
      setCaseDocumentText('');
      setCaseSummarizeError('');
    }
  }, [selectedCase?.id, selectedCase?.summary]);

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
        onUpdateState('cases', { ...selectedCase, summary: data.summary });
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
      id: generateUUID(),
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
              id: generateUUID(),
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
              id: generateUUID(),
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
            id: generateUUID(),
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

  // Validation & Undo mechanism
  const [caseNumberError, setCaseNumberError] = useState('');
  const [serverValidationError, setServerValidationError] = useState<{field: string, message: string} | null>(null);
  const [lastActionState, setLastActionState] = useState<{field: string, value: string} | null>(() => {
    return state.last_form_action || null;
  });

  const handleLastAction = (action: {field: string, value: string} | null) => {
    setLastActionState(action);
    setStateData('last_form_action', action);
  };

  const handleCaseNumberChange = (val: string) => {
    const action = { field: 'newCaseNumber', value: newCaseNumber };
    setLastActionState(action);
    handleLastAction(action);
    setNewCaseNumber(val);
    
    // Validation: Case number should strictly match 10 digits as requested.
    if (val.length > 0) {
      if (!/^\d{10}$/.test(val)) {
        setCaseNumberError('يجب أن يتكون رقم القضية من 10 أرقام صحيحة لتطابق التنسيق المطلوب');
      } else {
        setCaseNumberError('');
      }
    } else {
      setCaseNumberError('');
    }
  };

  const handleUndo = () => {
    if (lastActionState) {
      if (lastActionState.field === 'newCaseNumber') {
        setNewCaseNumber(lastActionState.value);
        setCaseNumberError('');
      }
      setLastActionState(null);
      handleLastAction(null);
    }
  };

  // Expense Fields for active case file
  const [expDesc, setExpDesc] = useState('');
  const [expAmt, setExpAmt] = useState('');

  // Auto-Save Effect
  useEffect(() => {
    if (!isCreateOpen) return;
    
    // Load from Supabase draft when modal opens
    if (draft) {
      try {
        if (draft.newCaseNumber && !newCaseNumber) setNewCaseNumber(draft.newCaseNumber);
        if (draft.newCaseName && !newCaseName) setNewCaseName(draft.newCaseName);
        if (draft.newClientName && !newClientName) setNewClientName(draft.newClientName);
        if (draft.newOpponent && !newOpponent) setNewOpponent(draft.newOpponent);
        if (draft.newDetails && !newDetails) setNewDetails(draft.newDetails);
      } catch(e) {}
    }
  }, [isCreateOpen]);

  useEffect(() => {
    if (!isCreateOpen) return;
    const dataToSave = {
      newCaseNumber, newCaseName, newClientName, newOpponent, newDetails
    };
    
    const interval = setInterval(() => {
      if (newCaseNumber || newCaseName || newClientName || newOpponent || newDetails) {
        setStateData('case_form_draft', dataToSave);
        
        // Dispatch toast notification
        window.dispatchEvent(
          new CustomEvent('adalah_error_logged', {
            detail: {
              message: `تم حفظ المسودة للموكل ${newClientName || 'غير محدد'} في قاعدة البيانات بنجاح`,
              timestamp: new Date().toISOString()
            }
          })
        );
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isCreateOpen, newCaseNumber, newCaseName, newClientName, newOpponent, newDetails]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newCaseName || !newClientName) {
      setServerValidationError({ field: 'required', message: 'يرجى ملء جميع الحقول الإلزامية' });
      return;
    }

    try {
      // التحقق من الاتصال أولاً (Ping database)
      const { error: pingError } = await supabase.from('cases').select('id').limit(1);
      if (pingError) {
        alert('تعذر الاتصال بقاعدة البيانات الخاصة بك. يرجى التحقق من المفاتيح: ' + pingError.message);
        return;
      }

      // Create a new client if does not exist to sync properly
      let linkedClient = clients.find(cl => cl.name === newClientName);
      if (!linkedClient) {
        linkedClient = {
          id: generateUUID(),
          name: newClientName,
          isCompany: newClientType === 'company',
          nationalId: newClientType === 'company' ? newCompanyCR : (newPlaintiffNationalId || "100" + Math.floor(Math.random() * 10000000)),
          phone: newPlaintiffPhone || "+9665" + Math.floor(Math.random() * 100000000),
          email: "contact@domain.sa",
          portalToken: generateUUID(),
          portalLink: `/portal?token=${generateUUID()}`
        };
        await onUpdateState('clients', linkedClient);
      } else {
        // Update the client information
        const updatedClient = { ...linkedClient };
        
        if (newClientType === 'company') {
          updatedClient.isCompany = true;
          if (newCompanyCR) updatedClient.nationalId = newCompanyCR;
        } else {
          updatedClient.isCompany = false;
          if (newPlaintiffNationalId) updatedClient.nationalId = newPlaintiffNationalId;
          if (newPlaintiffPhone) updatedClient.phone = newPlaintiffPhone;
        }

        await onUpdateState('clients', updatedClient);
      }

      const newCaseObj: Case = {
        id: generateUUID(),
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
        attachments_count: hasContract ? 1 : 0
      };

      setServerValidationError(null);
      const result = await onUpdateState('cases', newCaseObj);
      if (!result || result.success === false) {
        if (result && result.errorType === 'validation') {
           setServerValidationError({ field: result.field, message: result.message });
        }
        alert('حدث خطأ في حفظ القضية: ' + (result?.message || 'خطأ غير معروف'));
        return;
      }

      setIsCreateOpen(false);

      // Explicit Credential Generation & Automated Notification
      const clientForSms = linkedClient || clients.find(cl => cl.id === newCaseObj.clientId);
      if (clientForSms) {
        // Generate credentials if not existing
        const generatedUsername = clientForSms.portalUsername || `asil-${(clientForSms.nationalId || "1234").slice(-4)}`;
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
            id: generateUUID(),
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
      setStateData('case_form_draft', null);
      onSelectCase(newCaseObj);

    } catch (err: any) {
      console.error('[Add Case Exception]', err);
      alert('حدث خطأ غير متوقع: ' + err.message);
    }
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
        id: generateUUID(),
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
            id: generateUUID(),
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
        attachments_count: oldDocs.length + 1,
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
  const filteredCases = (cases || []).filter(c => {
    if (!c) return false;
    const caseNameSafe = (c.caseName || '').toLowerCase();
    const caseNumberSafe = (c.caseNumber || '').toLowerCase();
    const clientNameSafe = (c.clientName || '').toLowerCase();
    const courtNameSafe = (c.courtName || '').toLowerCase();
    const opponentNameSafe = (c.opponentName || '').toLowerCase();
    const circuitNumberSafe = (c.circuitNumber || '').toLowerCase();
    const caseCategorySafe = (c.category || '').toLowerCase();
    
    // Skip/exclude temporary RLS security check cases from appearing in the UI
    if (
      caseNameSafe.includes('فحص أمان rls') ||
      caseNameSafe.includes('rls_test') ||
      caseNumberSafe.includes('boot-rls-test-') ||
      caseNameSafe.includes('rls مؤقت')
    ) {
      return false;
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesGlobalSearch = searchLower === '' || 
                          caseNameSafe.includes(searchLower) || 
                          caseNumberSafe.includes(searchLower) || 
                          clientNameSafe.includes(searchLower) ||
                          courtNameSafe.includes(searchLower) ||
                          opponentNameSafe.includes(searchLower);

    const matchesAdvOpponent = advFilters.opponent === '' || opponentNameSafe.includes(advFilters.opponent.toLowerCase());
    const matchesAdvCircuit = advFilters.circuit === '' || circuitNumberSafe.includes(advFilters.circuit.toLowerCase());
    const matchesAdvCategory = advFilters.judgmentCategory === '' || 
      caseCategorySafe === advFilters.judgmentCategory.toLowerCase() ||
      (c.status || '').toLowerCase() === advFilters.judgmentCategory.toLowerCase();

    const matchesSearch = matchesGlobalSearch && matchesAdvOpponent && matchesAdvCircuit && matchesAdvCategory;
    
    // Auto-archive filter logic:
    // If 'archived' category is selected, show only archived cases.
    // Otherwise, show only non-archived cases matching other filters.
    const isArchivedRequested = categoryFilter.includes('archived');
    const isArchived = c.archived === true || c.status === 'closed' && isArchivedRequested; 
    
    if (isArchivedRequested && categoryFilter.length === 1 && !externalCategoryFilter) {
      if (!c.archived && c.status !== 'closed') return false;
    } else if (!isArchivedRequested || externalCategoryFilter) {
      if (c.archived) return false;
    }

    const matchesCategory = externalCategoryFilter
      ? (c.category === externalCategoryFilter)
      : (categoryFilter.length === 0 || categoryFilter.includes(c.category) || (isArchivedRequested && categoryFilter.length === 1));
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    const matchesCourt = courtFilter === 'all' || courtNameSafe.includes(courtFilter);
    
    // Automated Document Tags Filter
    const matchesDocTag = selectedDocTag === 'all' || getCaseDocumentTags(c).includes(selectedDocTag);
    
    const matchesLastSession = !lastSessionFilter || (c.lastSessionDate && c.lastSessionDate.includes(lastSessionFilter));
    
    let matchesNextAppointment = true;
    if (nextAppointmentFilterType === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      matchesNextAppointment = !!c.nextSessionDate && c.nextSessionDate === todayStr;
    } else if (nextAppointmentFilterType === 'soon') {
      if (!c.nextSessionDate) {
        matchesNextAppointment = false;
      } else {
        try {
          const parsedDate = new Date(c.nextSessionDate);
          if (isNaN(parsedDate.getTime())) {
            matchesNextAppointment = false;
          } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            parsedDate.setHours(0, 0, 0, 0);
            const diffTime = parsedDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            matchesNextAppointment = diffDays >= 0 && diffDays <= 7;
          }
        } catch {
          matchesNextAppointment = false;
        }
      }
    } else if (nextAppointmentFilterType === 'month') {
      if (!c.nextSessionDate) {
        matchesNextAppointment = false;
      } else {
        try {
          const parsedDate = new Date(c.nextSessionDate);
          if (isNaN(parsedDate.getTime())) {
            matchesNextAppointment = false;
          } else {
            const today = new Date();
            const nextMonth = new Date(today);
            nextMonth.setDate(today.getDate() + 30);
            today.setHours(0, 0, 0, 0);
            parsedDate.setHours(0, 0, 0, 0);
            matchesNextAppointment = parsedDate >= today && parsedDate <= nextMonth;
          }
        } catch {
          matchesNextAppointment = false;
        }
      }
    } else if (nextAppointmentFilterType === 'custom') {
      matchesNextAppointment = !nextAppointmentFilter || (c.nextSessionDate && c.nextSessionDate.includes(nextAppointmentFilter));
    } else if (nextAppointmentFilterType === 'all_scheduled') {
      matchesNextAppointment = !!c.nextSessionDate;
    }

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

    // Support filtering by Scheduled status
    const matchesScheduled = !showScheduledOnly || !!c.nextSessionDate;

    return matchesSearch && matchesCategory && matchesStage && matchesCourt && matchesDocTag && matchesLastSession && matchesNextAppointment && matchesStatus && matchesLawyer && matchesScheduled;
  });

  // Keyboard navigation listener at the page/module-level (CasesModule)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting keyboard typing inside interactive input controls
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx((prev) => {
          if (prev === null) return 0;
          return Math.min(prev + 1, filteredCases.length - 1);
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx((prev) => {
          if (prev === null) return 0;
          return Math.max(prev - 1, 0);
        });
      } else if (e.key === 'Enter') {
        if (focusedIdx !== null && filteredCases[focusedIdx]) {
          e.preventDefault();
          onSelectCase(filteredCases[focusedIdx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusedIdx, filteredCases, onSelectCase]);

  // Smooth scroll focused element into browser viewing layout
  useEffect(() => {
    if (focusedIdx !== null && filteredCases[focusedIdx]) {
      const activeCase = filteredCases[focusedIdx];
      const el = document.getElementById(`case-card-${activeCase.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIdx, filteredCases]);

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
    setVisibleCount(12);
  }, [categoryFilter, stageFilter, courtFilter, searchTerm, selectedDocTag, statusFilter, lawyerFilter]);

  // Load more sentinel trigger observer
  React.useEffect(() => {
    if (!loadMoreRef.current) return;
    const element = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVirtualLoading && visibleCount < filteredCases.length) {
          setIsVirtualLoading(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + 12);
            setIsVirtualLoading(false);
          }, 600);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isVirtualLoading, visibleCount, filteredCases.length]);

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
    const rows = (cases || []).map(c => {
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

  const memoizedView = React.useMemo(() => {
    return (
      <CasesList
        filteredCases={filteredCases}
        viewMode={viewMode}
        isHighContrast={isHighContrast}
        onSelectCase={onSelectCase}
        isSyncing={isSyncing}
        onNajizSync={handleNajizSync}
        setActivityLogCaseId={setActivityLogCaseId}
        isCaseOverdue={isCaseOverdue}
        getInteractiveCaseStyles={getInteractiveCaseStyles}
        getStatusKineticStyles={getStatusKineticStyles}
        getCaseDocumentTags={getCaseDocumentTags}
        gridDensity={gridDensity}
        visibleCount={visibleCount}
        onArchiveToggle={(c) => {
          if (c.archived) {
            onUpdateState('cases', { ...c, archived: false });
          } else {
            onUpdateState('cases', { ...c, archived: true });
          }
        }}
        selectedRole={selectedRole}
        onUpdateCaseStatus={(c, newStatus) => {
          onUpdateState('cases', { ...c, status: newStatus });
        }}
        onDeleteCase={onDeleteCase}
        searchActive={searchTerm !== '' || advFilters.opponent !== '' || advFilters.circuit !== '' || advFilters.judgmentCategory !== ''}
        focusedIdx={focusedIdx}
        setFocusedIdx={setFocusedIdx}
      />
    );
  }, [
    filteredCases,
    viewMode,
    isHighContrast,
    onSelectCase,
    isSyncing,
    handleNajizSync,
    setActivityLogCaseId,
    isCaseOverdue,
    getInteractiveCaseStyles,
    getStatusKineticStyles,
    getCaseDocumentTags,
    gridDensity,
    visibleCount,
    onUpdateState,
    selectedRole,
    onDeleteCase,
    searchTerm,
    advFilters,
    focusedIdx,
    setFocusedIdx
  ]);

      const filterBarMarkup = (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث عن قضية، عميل، أو رقم..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pr-11 pl-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600/30 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => handleViewModeSwitch('grid')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleViewModeSwitch('table')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold text-xs transition-all ${isAdvancedSearchOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Filter className="w-4 h-4" />
                <span>فلترة متقدمة</span>
              </button>

              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>تصدير CSV</span>
              </button>
            </div>
          </div>
        </div>
      );

      return (
        <div className="space-y-10 text-right animate-fade-in high-contrast-card-wrapper" dir="rtl">
          
          {/* Summary Dashboard Panels (Recharts Donuts & Bars) */}
          {!selectedCase && !isFocusMode && (
            <>
              {/* Headline + Add Button */}
              <div className="mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                      <Scale className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة القضايا</h1>
                      <p className="text-sm text-slate-500 font-bold mt-1">تتبع وإدارة كافة ملفات القضايا والنزاعات القانونية</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => setIsCreateOpen(true)}
                      className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5 stroke-[3px]" />
                      <span>إضافة قضية</span>
                    </button>
                    
                    <button 
                      onClick={() => setIsArchiveModalOpen(true)}
                      className="p-4 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-2xl transition-all shadow-sm"
                      title="الأرشيف"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Statistics Counters Bar */}
              <CaseStatisticsBar casesTrigger={cases} />

              <AnimatePresence>
                {isGraphsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-10"
                  >
                    <SummaryCharts cases={cases || []} preferences={preferences} updatePreference={updatePreference} themeTick={themeTick} />
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
                    <h4 className="text-slate-900 font-black text-sm">تم أرشفة {archivedNotice.count} قضايا تلقائياً</h4>
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
                    className="p-2.5 text-slate-500 transition-colors"
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
            <EnhancedCaseDetail
              selectedCase={selectedCase}
              clients={clients}
              isHighContrast={isHighContrast}
              onSelectCase={onSelectCase}
              onUpdateState={onUpdateState}
              handleTriggerAiAnalysis={handleTriggerAiAnalysis}
              handleExportToPdf={handleExportToPdf}
              handleStatusTransition={handleStatusTransition}
              handleCaseSummarize={handleCaseSummarize}
              isAiLoading={isAiLoading}
              aiAnalysis={aiAnalysis}
              setAiAnalysis={setAiAnalysis}
              caseDocumentText={caseDocumentText}
              setCaseDocumentText={setCaseDocumentText}
              caseDocumentMemo={caseDocumentMemo}
              setCaseDocumentMemo={setCaseDocumentMemo}
              isCaseSummarizing={isCaseSummarizing}
              caseSummarizeError={caseSummarizeError}
              whatsAppLogs={whatsAppLogs}
              setActivityLogCaseId={setActivityLogCaseId}
            />
          ) : (
              <div className="space-y-8 animate-fade-in duration-700">
                {/* List View of all cases */}
                  
                {!isFocusMode && filterBarMarkup}

                {/* --- REAL-TIME INTUITIVE DASHBOARD STATISTICS BOARD --- */}
                {!isFocusMode && (
                  <DashboardStatistics cases={cases} isHighContrast={isHighContrast} />
                )}

                {!isSwitchingView ? (
                  <>
                    {memoizedView}
                    
                    {/* Sentinel for infinite scroll in Grid View */}
                    {viewMode === 'grid' && visibleCount < filteredCases.length && (
                      <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-6">
                        {isVirtualLoading ? (
                          <div className="flex items-center gap-3 text-[#ff7f00]">
                            <div className="w-6 h-6 rounded-full border-2 border-slate-800 border-t-[#ff7f00] animate-spin"></div>
                            <span className="text-xs font-black">جاري تحميل المزيد من القضايا...</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-bold">اسحب أو مرر للأسفل لعرض المزيد</span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-[#ff7f00] animate-spin"></div>
                  </div>
                )}
              </div>
            )}

      {isCreateOpen && (
        <AddCaseModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          clients={clients} 
          onUpdateState={onUpdateState} 
        />
      )}

      {/* Scanned Document Attachments Upload Modal */}
      {isUploadOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-6 animate-in fade-in duration-500">
          <div className="bg-white  border border-slate-200  rounded-[3rem] w-full max-w-xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
            
            <div className="bg-gradient-to-br from-[#050e21] to-[#0c1a35] p-10 flex items-center justify-between text-slate-900 border-b border-primary/20">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-primary/10 text-amber-600 rounded-2xl border border-primary/20">
                  <Paperclip className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="font-display font-black text-2xl tracking-tight uppercase">مركز أرشفة الوثائق السحابي</h2>
                  <p className="text-amber-600 text-xs font-black mt-2 uppercase tracking-[0.2em] opacity-80">Secure Legal Asset Repository</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadingState('idle');
                  setAttachFileName('');
                }}
                className="w-12 h-12 bg-white[#050e21] text-slate-900 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-white"
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
                className="border-4 border-dashed border-primary/10 transition-colors rounded-[2.5rem] p-12 bg-slate-50  text-center flex flex-col items-center justify-center space-y-6 group cursor-pointer shadow-inner"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChangeInCases} 
                  className="hidden" 
                  accept=".pdf,.docx" 
                />
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center transition-transform duration-500">
                   <Download className="w-10 h-10 text-amber-600 animate-bounce" />
                </div>
                <div>
                  <span className="text-sm  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-black block mb-2">إسقاط وثائق الـ PDF أو الـ Word هنا أو انقر لاختيار ملف</span>
                  <span className="text-xs  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-bold uppercase tracking-[0.2em]">encrypted protocol material v4.0.1</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   uppercase tracking-widest block">مسمى الوثيقة القانونية</label>
                  <input 
                    type="text"
                    value={attachFileName}
                    onChange={(e) => setAttachFileName(e.target.value)}
                    placeholder="مذكرة_الرد_على_بينة_المدعي"
                    required
                    className="w-full bg-slate-50  border border-slate-200  rounded-2xl py-5 px-6 text-sm font-black  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   focus:outline-none focus:border-primary shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                  <div className="space-y-3">
                    <label className="text-xs font-black  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   uppercase tracking-widest block">صيغة الملف الاحترافية</label>
                    <select
                      value={attachFileType}
                      onChange={(e: any) => setAttachFileType(e.target.value)}
                      className="w-full bg-slate-50  border border-slate-200  rounded-2xl py-5 px-5 text-xs font-black  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   focus:outline-none focus:border-primary"
                    >
                      <option value="pdf">Protected PDF (Highly Secure)</option>
                      <option value="docx">Word Document (Editable)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   uppercase tracking-widest block">معيار الجودة والدقة</label>
                    <select
                      value={attachFileSize}
                      onChange={(e) => setAttachFileSize(e.target.value)}
                      className="w-full bg-slate-50  border border-slate-200  rounded-2xl py-5 px-5 text-xs font-black  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   focus:outline-none focus:border-primary"
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
                <div className="space-y-3 bg-slate-50  p-6 rounded-3xl border border-slate-200  shadow-inner">
                  <div className="flex justify-between text-xs font-black  text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   uppercase tracking-widest font-sans">
                    <span>{uploadProgress}% جاري التشفير والمزامنة</span>
                    <span className="text-amber-600">Processing Assets...</span>
                  </div>
                  <div className="w-full bg-white  rounded-full h-2.5 overflow-hidden border border-slate-200 ">
                    <motion.div 
                      className="bg-gradient-to-r from-primary to-primary-light h-full rounded-full transition-all shadow-[0_0_15px_rgba(184,134,11,0.4)]" 
                      style={{ width: `${uploadProgress}%` }}
                    ></motion.div>
                  </div>
                </div>
              )}

              {uploadingState === 'completed' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500 border border-emerald-500 py-5 px-6 rounded-2xl text-center text-xs text-emerald-500 font-extrabold flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center">✓</div>
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
                  className="flex-1 bg-slate-100   text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-black py-5 rounded-[1.5rem] text-xs uppercase tracking-widest"
                >
                  إلغاء التراجع
                </button>
                <button 
                  type="submit"
                  disabled={uploadingState === 'uploading' || uploadingState === 'completed'}
                  className="flex-[2] bg-primary text-slate-900 font-black py-5 rounded-[1.5rem] text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all border border-primary-light/20 uppercase tracking-widest disabled:opacity-50"
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
          const activeC = filteredCases.find(item => item.id === activityLogCaseId) || (cases || []).find(item => item.id === activityLogCaseId);
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
                className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm"
              />
              {/* Drawer Container */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between"
              >
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-100 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-display font-black text-slate-900 text-base">سجل النشاط والتعديلات العدلية</h3>
                        <p className="text-[10px] font-mono text-amber-500 tracking-wider">Activity History: #{activeC.caseNumber}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActivityLogCaseId(null)}
                      className="p-1.5 rounded-lg text-slate-900 font-black font-bold transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-right">
                      <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest block">الدعوى المستهدفة</span>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">{activeC.caseName}</h4>
                      <div className="flex justify-between items-center text-xs text-slate-900 font-black font-bold pt-3 border-t border-slate-200/65">
                        <span>العميل: <strong className="text-slate-900 font-bold">{activeC.clientName}</strong></span>
                        <span>رقم القضية: <strong className="text-slate-900 font-bold font-mono">#{activeC.caseNumber}</strong></span>
                      </div>
                    </div>

                    <div className="relative border-r-2 border-slate-200 mr-3 pr-6 space-y-8 py-3 text-right">
                      {timelineData.map((t, tIdx) => (
                        <div key={tIdx} className="relative">
                          {/* Timeline dot */}
                          <span className="absolute -right-[31px] top-1.5 w-3 h-3 rounded-full border-4 border-[#050e21] bg-amber-500 ring-4 ring-amber-500/10 shadow-lg" />
                          
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-900 font-bold border border-slate-850 px-2 py-0.5 rounded-md font-bold direction-ltr">
                                {t.date} • {t.time}
                              </span>
                              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20`}>
                                {t.badge}
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-slate-900">{t.title}</h5>
                            <p className="text-[11px] text-slate-900 font-bold leading-relaxed font-bold">{t.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-100 text-center">
                  <button 
                    onClick={() => setActivityLogCaseId(null)}
                    className="w-full bg-white[#0c1a35] text-slate-900 border border-slate-200 text-xs font-black py-4 rounded-xl transition-all cursor-pointer"
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
            <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-md" onClick={() => setReportModalCase(null)}></div>
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
                <button onClick={() => setReportModalCase(null)} className="p-2 text-slate-900 font-black font-bold hover:text-slate-900 font-black font-bold cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl mb-6">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                     <FileText className="w-6 h-6 text-slate-900 font-black font-bold" />
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
                  className="flex-[2] bg-slate-900 border border-slate-900 text-slate-900 font-black py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
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
