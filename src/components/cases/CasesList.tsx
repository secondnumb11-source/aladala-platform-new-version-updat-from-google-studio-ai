/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FixedSizeList } from 'react-window';
const VirtualList = FixedSizeList as any;
import { ChevronLeft, Trash2, MoreVertical, ChevronDown, FileText } from 'lucide-react';
import { Case } from '@/types';
import CaseCard from './CaseCard';
import { CaseClassificationTags } from '../CasesModule';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface CasesListProps {
  filteredCases: Case[];
  viewMode: 'grid' | 'table';
  isHighContrast: boolean;
  onSelectCase: (caseObj: Case) => void;
  isSyncing: string | null;
  onNajizSync: (c: Case) => void;
  setActivityLogCaseId: (id: string | null) => void;
  isCaseOverdue: (c: Case) => boolean;
  getInteractiveCaseStyles: (category: string, status: string) => any;
  getStatusKineticStyles: (status: string) => any;
  getCaseDocumentTags: (c: Case) => string[];
  gridDensity?: 'relaxed' | 'compact' | 'dense';
  visibleCount: number;
  onArchiveToggle?: (c: Case) => void;
  selectedRole?: string;
  onUpdateCaseStatus?: (c: Case, newStatus: string) => void;
  onDeleteCase?: (id: string | number) => void;
  searchActive?: boolean;
  focusedIdx?: number | null;
  setFocusedIdx?: (idx: number | null) => void;
}

const CasesList = React.memo(function CasesList({
  filteredCases,
  viewMode,
  isHighContrast,
  onSelectCase,
  isSyncing,
  onNajizSync,
  setActivityLogCaseId,
  isCaseOverdue,
  getInteractiveCaseStyles,
  getStatusKineticStyles,
  getCaseDocumentTags,
  gridDensity = 'relaxed',
  visibleCount,
  onArchiveToggle,
  selectedRole,
  onUpdateCaseStatus,
  onDeleteCase,
  searchActive = false,
  focusedIdx: externalFocusedIdx,
  setFocusedIdx: externalSetFocusedIdx
}: CasesListProps) {
  const [internalFocusedIdx, setInternalFocusedIdx] = React.useState<number | null>(null);
  const focusedIdx = externalFocusedIdx !== undefined ? externalFocusedIdx : internalFocusedIdx;
  const setFocusedIdx = externalSetFocusedIdx || setInternalFocusedIdx;

  const [activeMenuCaseId, setActiveMenuCaseId] = React.useState<string | null>(null);
  const [exportingId, setExportingId] = React.useState<string | number | null>(null);

  const handleExportReport = async (e: React.MouseEvent, c: Case) => {
    e.stopPropagation();
    setExportingId(c.id);
    try {
      const element = document.getElementById(`pdf-report-template-list-${c.id}`);
      if (!element) throw new Error("ملخص التقرير غير متوفر في الصفحة حالياً");

      // Temporarily change style of offscreen element to static for html2canvas
      const originalStyle = element.getAttribute('style') || '';
      element.style.position = 'static';
      element.style.left = '0';

      const canvas = await html2canvas(element, {
        scale: 2, // High DPI
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Restore style
      element.setAttribute('style', originalStyle);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 Width in mm
      const pageHeight = 297; // A4 Height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`تقرير_القضية_رقم_${c.caseNumber || c.id}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء تصدير التقرير إلى PDF: " + err.message);
    } finally {
      setExportingId(null);
    }
  };

  // Helper function to format date
  const formatCaseDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) return dateStr;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toISOString().split('T')[0].replace(/-/g, '/');
    } catch {
      return dateStr;
    }
  };

  // Helper to get beautiful Arabic Category Name
  const getArabicCategoryName = (category?: string) => {
    switch (category) {
      case 'commercial': return 'تجاري';
      case 'labor': return 'عمالي';
      case 'civil': return 'مدني';
      case 'criminal': return 'جزائي';
      case 'personal_status': return 'أحوال شخصية';
      case 'administrative': return 'إداري';
      case 'financial': return 'مالي';
      case 'execution': return 'تنفيذ';
      default: return 'عامة';
    }
  };

  // Helper for Status Pills
  const getStatusBadgeStyles = (status?: string) => {
    switch (status) {
      case 'under_study':
        return isHighContrast 
          ? 'border-slate-300 text-slate-800 bg-slate-100 hover:bg-slate-200' 
          : 'border-slate-700/60 text-slate-300 bg-slate-800/60 hover:bg-slate-700/60';
      case 'under_review':
      case 'active':
        return isHighContrast 
          ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100' 
          : 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20';
      case 'struck_off':
        return isHighContrast 
          ? 'border-gray-300 text-gray-800 bg-gray-100 hover:bg-gray-200' 
          : 'border-gray-700 text-gray-400 bg-gray-800/60 hover:bg-gray-700/60';
      case 'appeal':
        return isHighContrast 
          ? 'border-indigo-300 text-indigo-800 bg-indigo-50 hover:bg-indigo-100' 
          : 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20';
      case 'execution':
        return isHighContrast 
          ? 'border-orange-300 text-orange-800 bg-orange-50 hover:bg-orange-100' 
          : 'border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20';
      case 'primary_judgment':
      case 'final_judgment':
        return isHighContrast 
          ? 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100' 
          : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20';
      case 'postponed':
        return isHighContrast 
          ? 'border-rose-300 text-rose-800 bg-rose-50 hover:bg-rose-100' 
          : 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20';
      case 'closed':
        return isHighContrast 
          ? 'border-slate-300 text-slate-800 bg-slate-100 hover:bg-slate-200' 
          : 'border-slate-700 text-slate-400 bg-slate-800/40 hover:bg-slate-700/40';
      default:
        return isHighContrast 
          ? 'border-slate-200 text-slate-700 bg-slate-50' 
          : 'border-slate-800 text-slate-400 bg-slate-900/40';
    }
  };

  // Keyboard navigation listener
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (focusedIdx !== null && filteredCases[focusedIdx]) {
      const activeCase = filteredCases[focusedIdx];
      const el = document.getElementById(`case-card-${activeCase.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIdx, filteredCases]);

  if (filteredCases.length === 0) {
    return (
      <div className={`p-20 text-center rounded-[3rem] border border-dashed flex flex-col items-center justify-center space-y-6 ${
        isHighContrast ? 'bg-slate-100 border-slate-900 text-white' : 'bg-[#0c1a35] border-slate-800'
      }`} dir="rtl">
        <span className="text-5xl opacity-40">📂</span>
        <p className="text-white font-black font-bold text-xs uppercase tracking-widest">لا توجد ملفات قضايا تتطابق مع المرشحات الحالية</p>
      </div>
    );
  }

  // Memoized layout selection to prevent unnecessary repainting on view mode changes
  const renderedLayout = React.useMemo(() => {
    if (viewMode === 'table') {
    return (
      <div className={`overflow-x-auto shadow-2xl transition-all duration-300 border rounded-[2.5rem] w-full text-right ${
        isHighContrast 
          ? 'bg-white border-slate-900 border-2 shadow-slate-200' 
          : 'bg-[#050e21] border-[#D4AF37]/35 shadow-[0_0_30px_rgba(212,175,55,0.08)]'
      }`} dir="rtl">
        <div className="min-w-[1200px]">
          {/* Table Header */}
          <div className={`flex items-center text-right border-b ${
            isHighContrast ? 'bg-slate-200 border-slate-900 text-slate-950' : 'bg-[#030914] border-[#D4AF37]/25 text-[#D4AF37] font-[900]'
          } font-[900] text-[11px] h-14`} dir="rtl">
            {/* 1. Green column right-most */}
            <div className="w-12 self-stretch flex items-center justify-center bg-emerald-600 text-white shrink-0 font-bold text-base select-none rounded-tr-[2.4rem]">
              <ChevronDown className="w-4 h-4" />
            </div>
            
            {/* Case Number (Golden text with border) */}
            <div className={`flex-[1] min-w-[110px] h-full px-3 flex items-center justify-center font-black border-l ${isHighContrast ? 'border-slate-300' : 'border-[#D4AF37]/25 bg-[#D4AF37]/10'}`}>رقم القضية</div>
            {/* Client Name (Plaintiff - Front Column with High Contrast) */}
            <div className={`flex-[1.5] min-w-[150px] h-full px-3 flex items-center font-black border-l ${isHighContrast ? 'border-slate-300' : 'border-[#D4AF37]/25 bg-white/5 text-white'}`}>اسم العميل (المدعي)</div>
            {/* Opponent Name */}
            <div className={`flex-[1.2] min-w-[120px] h-full px-3 flex items-center font-black border-l ${isHighContrast ? 'border-slate-300' : 'border-[#D4AF37]/25'}`}>المدعى عليه</div>
            {/* Case Subject */}
            <div className={`flex-[1.8] min-w-[170px] h-full px-3 flex items-center font-black border-l ${isHighContrast ? 'border-slate-300' : 'border-[#D4AF37]/25'}`}>موضوع الدعوى</div>
            {/* Next Session */}
            <div className={`flex-[1.2] min-w-[120px] h-full px-3 flex items-center justify-center font-black border-l ${isHighContrast ? 'border-slate-300' : 'border-[#D4AF37]/25'}`}>الجلسة القادمة</div>
            {/* Record / Counts */}
            <div className={`flex-[1] min-w-[110px] h-full px-3 flex items-center justify-center font-black border-l ${isHighContrast ? 'border-slate-300' : 'border-[#D4AF37]/25'}`}>السجل (م/ج/و)</div>
            {/* Category */}
            <div className={`flex-[1] min-w-[100px] h-full px-3 flex items-center justify-center font-black border-l ${isHighContrast ? 'border-slate-300' : 'border-[#D4AF37]/25'}`}>النوع</div>
            {/* Status */}
            <div className={`flex-[1.2] min-w-[130px] h-full px-3 flex items-center justify-center font-black border-l ${isHighContrast ? 'border-slate-300' : 'border-[#D4AF37]/25'}`}>الحالة</div>
            {/* Actions */}
            <div className="flex-[1.8] min-w-[200px] h-full px-3 flex items-center justify-center font-black">الإجراءات والتقرير</div>
          </div>

          {/* Table Body (Virtualized list) */}
          <VirtualList
            style={{ direction: "rtl", overflowX: "hidden" }}
            height={600}
            width="100%"
            className={`divide-y-4 ${isHighContrast ? 'divide-slate-200' : 'divide-[#D4AF37]/10'}`}
            itemCount={filteredCases.length}
            itemSize={100}
          >
            {({ index, style }: any) => {
              const c = filteredCases[index];
              if (!c) return null;
              const { CategoryIcon } = getInteractiveCaseStyles(c.category, c.status);
              const isRowFocused = index === focusedIdx;

              return (
                <div 
                  id={`case-card-${c.id}`}
                  style={style}
                  className={`flex items-center text-right transition-all group cursor-pointer border-b ${
                    isRowFocused 
                      ? 'bg-amber-500/20 border-y-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-[1.005] z-10' 
                      : isHighContrast 
                        ? (index % 2 === 0 ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white hover:bg-slate-100') 
                        : (index % 2 === 0 ? 'bg-[#0a182f]/40 hover:bg-amber-500/10' : 'bg-transparent hover:bg-amber-500/10')
                  } ${c.archived ? 'opacity-50 grayscale-[0.5]' : ''} ${isHighContrast ? 'border-slate-200' : 'border-[#D4AF37]/10'}`} 
                  onClick={() => {
                    setFocusedIdx(index);
                    onSelectCase(c);
                  }}
                  dir="rtl"
                >
                  {/* 1. Green stripe right-most */}
                  <div className="w-12 self-stretch flex items-center justify-center bg-[#00b274] shrink-0 font-bold border-l border-slate-200/20">
                    <ChevronDown className="w-4 h-4 text-white" />
                  </div>

                  {/* 2. رقم القضية - Golden & Front-Facing */}
                  <div className={`flex-[1] min-w-[110px] h-full px-3 flex items-center justify-center font-mono font-black text-sm text-center border-l ${
                    isHighContrast 
                      ? 'border-slate-200 bg-amber-100/90 border border-amber-500 shadow-sm wcag-aaa-gold-light' 
                      : 'border-[#D4AF37]/25 bg-[#D4AF37]/5 drop-shadow-[0_0_8px_rgba(212,175,55,0.45)] wcag-aaa-gold-dark'
                  }`}>
                    #{c.caseNumber}
                  </div>

                  {/* 3. اسم العميل (المدعي) - High Contrast & Front-Facing */}
                  <div className={`flex-[1.5] min-w-[150px] h-full px-3 flex items-center text-xs font-[900] text-right border-l truncate ${
                    isHighContrast ? 'border-slate-200 text-slate-950 bg-slate-50' : 'border-[#D4AF37]/25 text-white bg-white/5 font-extrabold'
                  }`} title={c.clientName}>
                    {c.clientName || 'غيرحدد'}
                  </div>

                  {/* 4. المدعى عليه */}
                  <div className={`flex-[1.2] min-w-[120px] h-full px-3 flex items-center text-xs font-[800] text-right border-l truncate ${
                    isHighContrast ? 'border-slate-200 text-slate-800' : 'border-[#D4AF37]/25 text-amber-100/90'
                  }`} title={c.opponentName}>
                    {c.opponentName || 'غير محدد'}
                  </div>

                  {/* 5. موضوع الدعوى */}
                  <div className={`flex-[1.8] min-w-[170px] h-full px-3 flex items-center font-black text-xs text-right border-l truncate leading-relaxed ${
                    isHighContrast ? 'border-slate-200 text-slate-800' : 'border-[#D4AF37]/25 text-slate-300'
                  }`} title={c.caseName}>
                    {c.caseName || 'غير محدد'}
                  </div>

                  {/* 6. تاريخ الجلسة القادمة - Bright Green */}
                  <div className={`flex-[1.2] min-w-[120px] h-full px-3 flex flex-col items-center justify-center font-mono font-black text-xs text-center border-l ${
                    isHighContrast ? 'border-slate-200' : 'border-[#D4AF37]/25'
                  }`}>
                    {c.nextSessionDate ? (
                      <>
                        <span className={`px-2 py-1 rounded-md ${isHighContrast ? 'bg-emerald-100 border-emerald-500 shadow-sm wcag-aaa-green-light' : 'bg-[#00ff88]/10 drop-shadow-[0_0_8px_rgba(0,255,136,0.3)] wcag-aaa-green-dark'} border ${isHighContrast ? 'border-emerald-500' : 'border-[#00ff88]/30'}`}>
                          {c.nextSessionDate}
                        </span>
                        {c.nextSessionTime && <span className="text-[10px] mt-1 opacity-70">{c.nextSessionTime}</span>}
                      </>
                    ) : (
                      <span className="opacity-50">غير محدد</span>
                    )}
                  </div>

                  {/* 7. سجل القضية (Counts) */}
                  <div className={`flex-[1] min-w-[110px] h-full px-3 flex items-center justify-center text-[11px] font-black border-l ${
                    isHighContrast ? 'border-slate-200 text-slate-600' : 'border-[#D4AF37]/25 text-slate-300'
                  }`}>
                    <div className="flex gap-2.5 bg-black/25 dark:bg-black/50 px-3 py-1.5 rounded-xl border border-[#D4AF37]/15">
                      <span title="الجلسات" className="text-emerald-400">⚖️{c.hearings?.length || 0}</span>
                      <span title="المستندات" className="text-blue-400">📄{c.attachments_count || 0}</span>
                      <span title="المهام" className="text-amber-400">📝{c.tasks?.length || 0}</span>
                    </div>
                  </div>

                  {/* 8. النوع */}
                  <div className={`flex-[1] min-w-[100px] h-full px-3 flex items-center justify-center text-xs font-[850] border-l ${
                    isHighContrast ? 'border-slate-200 text-slate-700' : 'border-[#D4AF37]/25 text-white'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5 opacity-75 shrink-0 text-[#D4AF37]" />}
                      {getArabicCategoryName(c.category)}
                    </span>
                  </div>

                  {/* 9. الحالة */}
                  <div className={`flex-[1.2] min-w-[130px] h-full px-3 flex items-center justify-center border-l ${
                    isHighContrast ? 'border-slate-200' : 'border-[#D4AF37]/25'
                  }`} onClick={(e) => e.stopPropagation()}>
                    <select
                      value={c.status || 'under_study'}
                      onChange={(e) => onUpdateCaseStatus && onUpdateCaseStatus(c, e.target.value)}
                      className={`text-[10px] font-black focus:outline-none border-2 rounded-xl px-1.5 py-2 cursor-pointer w-full text-center shadow-sm transition-all ${
                        getStatusBadgeStyles(c.status)
                      }`}
                    >
                      <option value="under_study" className="bg-slate-950 text-white">قيد الدراسة 🖋️</option>
                      <option value="under_review" className="bg-slate-950 text-white">قيد النظر ⚖️</option>
                      <option value="struck_off" className="bg-slate-950 text-white">شطبت 🗑️</option>
                      <option value="appeal" className="bg-slate-950 text-white">استئناف ⤴️</option>
                      <option value="execution" className="bg-slate-950 text-white">تنفيذ ⚡</option>
                      <option value="primary_judgment" className="bg-slate-950 text-white">حكم ابتدائي 📜</option>
                      <option value="final_judgment" className="bg-slate-950 text-white">حكم قطعي ✅</option>
                      <option value="postponed" className="bg-slate-950 text-white">مؤجلة ⏳</option>
                      <option value="closed" className="bg-slate-950 text-white">ملف مقفل منتهي 🔒</option>
                      <option value="active" className="bg-slate-950 text-white">نشطة جارية ⚖️</option>
                    </select>
                  </div>

                  {/* 10. Actions Column (Export & Delete) */}
                  <div className="flex-[1.8] min-w-[200px] h-full px-3 flex items-center justify-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleExportReport(e, c)}
                      disabled={exportingId === c.id}
                      className={`flex items-center gap-1 font-black text-[11px] transition-all px-2.5 py-1.5 rounded-xl border cursor-pointer ${
                        isHighContrast 
                          ? 'text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-400 font-bold' 
                          : 'text-[#D4AF37] hover:text-white bg-[#D4AF37]/10 hover:bg-[#D4AF37]/30 border-[#D4AF37]/30 hover:border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
                      } disabled:opacity-50`}
                      title="تصدير تقرير القضية كـ PDF"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>{exportingId === c.id ? 'جاري...' : 'تصدير التقرير'}</span>
                    </button>

                    {onDeleteCase ? (
                      <button
                        onClick={() => onDeleteCase(c.id)}
                        className={`flex items-center gap-1 font-black text-[11px] transition-all px-2.5 py-1.5 rounded-xl border cursor-pointer ${
                          isHighContrast 
                            ? 'text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border-rose-300 font-bold' 
                            : 'text-[#ff2a2a] hover:text-[#ff4d4d] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 shadow-[0_0_15px_rgba(255,42,42,0.1)]'
                        }`}
                        title="حذف القضية نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>حذف</span>
                      </button>
                    ) : (
                      <span className="opacity-30 text-[10px]">غير متاح</span>
                    )}
                  </div>

                  {/* Hidden high-quality Arabic printable PDF Template */}
                  <div
                    id={`pdf-report-template-list-${c.id}`}
                    className="fixed -left-[9999px] top-0 bg-white text-slate-900 p-10 font-sans"
                    style={{ width: '800px', direction: 'rtl' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="border-[6px] border-[#D4AF37] p-6 rounded-2xl relative bg-white">
                      <div className="border border-[#111827] p-6 rounded-xl relative">
                        
                        {/* Header with National/Government Emblem Style */}
                        <div className="flex justify-between items-start border-b-2 border-slate-300 pb-6 mb-6">
                          {/* Right side: KSA Details */}
                          <div className="text-right space-y-1 text-xs font-bold text-slate-800">
                            <p className="text-sm font-black text-slate-950">المملكة العربية السعودية</p>
                            <p>وزارة العدل</p>
                            <p>{c.courtName || 'المحكمة العامة'}</p>
                            <p>{c.circuitNumber ? `الدائرة القضائية ${c.circuitNumber}` : 'الدائرة العامة'}</p>
                          </div>

                          {/* Center: Gold Scales of Justice / Firm Seal Emblem */}
                          <div className="text-center flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] flex items-center justify-center bg-amber-50 shadow-sm mb-2">
                              <span className="text-2xl">⚖️</span>
                            </div>
                            <span className="text-[10px] tracking-[0.25em] font-black text-[#D4AF37] uppercase">شركة العدالة للمحاماة</span>
                          </div>

                          {/* Left side: Date & Ref */}
                          <div className="text-left space-y-1 text-xs font-bold text-slate-800" style={{ direction: 'ltr' }}>
                            <p>الرقم: #{c.caseNumber}</p>
                            <p>التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
                            <p>المرفقات: {c.attachments_count || 0}</p>
                          </div>
                        </div>

                        {/* Main Document Title */}
                        <div className="text-center my-6 space-y-2">
                          <h2 className="text-2xl font-black text-slate-950 underline underline-offset-8 decoration-[#D4AF37]">
                            تقرير ملخص ملف قضية رسمي
                          </h2>
                          <p className="text-xs text-slate-500 font-medium">
                            مستند رسمي صادر عن بوابة العدالة الذكية للخدمات القانونية والمحاماة
                          </p>
                        </div>

                        {/* Grid of Case Basic Metadata */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-right">
                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                            <span className="text-xs text-slate-500 font-bold block mb-1">رقم القضية</span>
                            <strong className="text-slate-900 font-black text-base">#{c.caseNumber}</strong>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                            <span className="text-xs text-slate-500 font-bold block mb-1">نوع القضية</span>
                            <strong className="text-slate-900 font-black text-base">{getArabicCategoryName(c.category)}</strong>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                            <span className="text-xs text-slate-500 font-bold block mb-1">المحكمة المختصة</span>
                            <strong className="text-slate-900 font-black text-base">{c.courtName || 'غير محدد'}</strong>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                            <span className="text-xs text-slate-500 font-bold block mb-1">الدائرة القضائية</span>
                            <strong className="text-slate-900 font-black text-base">{c.circuitNumber || 'غير محدد'}</strong>
                          </div>
                        </div>

                        {/* Litigating Parties Box */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 text-sm text-right">
                          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                            <h3 className="font-black text-slate-900">أطراف الخصومة والدعوى</h3>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-slate-500 font-bold block mb-1">الموكل (المدعي)</span>
                              <strong className="text-slate-900 font-black">{c.clientName || 'غير محدد'}</strong>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 font-bold block mb-1">الطرف المقابل (المدعى عليه)</span>
                              <strong className="text-slate-900 font-black">{c.opponentName || 'غير محدد'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Case Topic / Summary details */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 text-sm text-right">
                          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                            <h3 className="font-black text-slate-900">موضوع ومضمون الدعوى</h3>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <span className="text-xs text-slate-500 font-bold block mb-1">موضوع القضية الرئيسي</span>
                              <p className="text-slate-800 font-bold text-sm leading-relaxed">{c.caseName || 'لا يوجد موضوع رئيسي مسجل'}</p>
                            </div>
                            {c.details && (
                              <div>
                                <span className="text-xs text-slate-500 font-bold block mb-1">تفاصيل ومذكرات القضية</span>
                                <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">{c.details}</p>
                              </div>
                            )}
                            {c.summary && (
                              <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl mt-2">
                                <span className="text-xs text-amber-700 font-black block mb-1 flex items-center gap-1.5">
                                  ✨ ملخص الذكاء الاصطناعي الذكي
                                </span>
                                <p className="text-slate-800 text-xs leading-relaxed">{c.summary}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Upcoming & Past Hearings Section */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 text-sm text-right">
                          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-black text-slate-900">جدول الجلسات القضائية</h3>
                            <span className="text-xs text-slate-500 font-bold">تاريخ الجلسة القادمة: {c.nextSessionDate || 'غير محدد'}</span>
                          </div>
                          <div className="p-4">
                            {c.hearings && c.hearings.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                                      <th className="pb-2">رقم الجلسة</th>
                                      <th className="pb-2">تاريخ الجلسة</th>
                                      <th className="pb-2">الوقت</th>
                                      <th className="pb-2">حالة الجلسة</th>
                                      <th className="pb-2">القرار المتخذ / ملاحظات</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {c.hearings.map((h, i) => (
                                      <tr key={h.id || i} className="text-slate-800">
                                        <td className="py-2.5 font-bold font-mono">#{i + 1}</td>
                                        <td className="py-2.5 font-bold font-mono">{h.date}</td>
                                        <td className="py-2.5 font-mono">{h.time || 'غير محدد'}</td>
                                        <td className="py-2.5">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            h.status === 'upcoming' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                            h.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                            'bg-slate-100 text-slate-600 border border-slate-200'
                                          }`}>
                                            {h.status === 'upcoming' ? 'مجدولة قادمة' :
                                             h.status === 'completed' ? 'منجزة' : 'ملغاة'}
                                          </span>
                                        </td>
                                        <td className="py-2.5 max-w-[200px] truncate" title={h.decision || h.notes}>
                                          {h.decision || h.notes || '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-slate-400 space-y-1">
                                <p className="font-bold">لا يوجد جلسات إضافية مجدولة في سجل القضية حتى الآن.</p>
                                <p className="text-[10px]">الجلسة القادمة المسجلة في النظام: {c.nextSessionDate || 'لا يوجد'} في تمام الساعة {c.nextSessionTime || 'غير محدد'}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Official Stamp & Signatures Footer */}
                        <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200 text-xs">
                          <div className="text-right space-y-1">
                            <p className="text-slate-500 font-bold">المحامـي المسؤول:</p>
                            <p className="text-slate-900 font-black text-sm">{c.lead_lawyer_id || 'مستشار مكتب العدالة الرئيسي'}</p>
                            <p className="text-slate-400">التوقيع: ............................</p>
                          </div>
                          
                          {/* Beautiful Circular Gold Stamp */}
                          <div className="w-20 h-20 rounded-full border-4 border-dashed border-[#D4AF37] flex flex-col items-center justify-center p-1 opacity-80 rotate-12">
                            <span className="text-[7px] text-[#D4AF37] font-black uppercase tracking-wider">مكتب العدالة</span>
                            <span className="text-base">⚖️</span>
                            <span className="text-[6px] text-[#D4AF37] font-black">الختم الرسمي</span>
                          </div>

                          <div className="text-left space-y-1">
                            <p className="text-slate-400">نظام العدالة الذكي للخدمات السحابية</p>
                            <p className="text-slate-400">Al-Adalah Cloud Justice Core</p>
                            <p className="text-[9px] text-slate-300 font-mono">REF_ID: {c.id}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </VirtualList>
        </div>
      </div>
    );
  }

  // Grid/Bento layout view with memoized cards to optimize rendering
  const memoizedGridCards = React.useMemo(() => {
    return (filteredCases || []).filter(Boolean).slice(0, visibleCount).map((c, idx) => (
      <CaseCard
        key={c.id || idx}
        c={c}
        searchHighlight={searchActive}
        onSelectCase={(caseObj) => {
          if (setFocusedIdx) {
            setFocusedIdx(idx);
          }
          onSelectCase(caseObj);
        }}
        isHighContrast={isHighContrast}
        isSyncing={isSyncing}
        onNajizSync={onNajizSync}
        setActivityLogCaseId={setActivityLogCaseId}
        isCaseOverdue={isCaseOverdue}
        getInteractiveCaseStyles={getInteractiveCaseStyles}
        getStatusKineticStyles={getStatusKineticStyles}
        getCaseDocumentTags={getCaseDocumentTags}
        onArchiveToggle={onArchiveToggle}
        selectedRole={selectedRole}
        onUpdateCaseStatus={onUpdateCaseStatus}
        onDeleteCase={onDeleteCase}
        isKeyboardFocused={idx === focusedIdx}
      />
    ));
  }, [
    filteredCases,
    visibleCount,
    searchActive,
    onSelectCase,
    isHighContrast,
    isSyncing,
    onNajizSync,
    setActivityLogCaseId,
    isCaseOverdue,
    getInteractiveCaseStyles,
    getStatusKineticStyles,
    getCaseDocumentTags,
    onArchiveToggle,
    selectedRole,
    onUpdateCaseStatus,
    onDeleteCase,
    focusedIdx,
    setFocusedIdx
  ]);

    return (
      <div className={`grid grid-cols-1 ${gridDensity === 'relaxed' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} cases-module-grid-gap perspective-container`} dir="rtl">
        {memoizedGridCards}
      </div>
    );
  }, [
    viewMode,
    isHighContrast,
    filteredCases,
    gridDensity,
    memoizedGridCards,
    focusedIdx,
    exportingId,
    activeMenuCaseId,
    onSelectCase,
    getInteractiveCaseStyles,
    onDeleteCase,
    selectedRole,
    setFocusedIdx
  ]);

  return renderedLayout;
});

export default CasesList;
