/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FixedSizeList } from 'react-window';
const VirtualList = FixedSizeList as any;
import { ChevronLeft, Trash2, MoreVertical, ChevronDown } from 'lucide-react';
import { Case } from '@/types';
import CaseCard from './CaseCard';
import { CaseClassificationTags } from '../CasesModule';

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

export default function CasesList({
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

  if (viewMode === 'table') {
    return (
      <div className={`overflow-x-auto shadow-2xl transition-all duration-300 border rounded-[2.5rem] w-full text-right ${
        isHighContrast 
          ? 'bg-white border-slate-900 border-2 shadow-slate-200' 
          : 'bg-[#050e21] border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.05)]'
      }`} dir="rtl">
        <div className="min-w-[1100px]">
          {/* Table Header */}
          <div className={`flex items-center text-right border-b ${
            isHighContrast ? 'bg-slate-200 border-slate-900 text-slate-950' : 'bg-[#030914] border-[#D4AF37]/20 text-[#D4AF37]/80'
          } font-[900] text-[11px] h-14`} dir="rtl">
            {/* 1. Green column right-most */}
            <div className="w-12 self-stretch flex items-center justify-center bg-emerald-500 text-white shrink-0 font-bold text-base select-none rounded-tr-[2.4rem]">
              <ChevronDown className="w-4 h-4" />
            </div>
            
            <div className="flex-[0.8] min-w-[90px] h-full px-3 flex items-center justify-center font-black border-l border-slate-200/10">رقم القضية</div>
            <div className="flex-[1.5] min-w-[140px] h-full px-3 flex items-center font-black border-l border-slate-200/10">موضوع الدعوى</div>
            <div className="flex-[1.2] min-w-[120px] h-full px-3 flex items-center justify-center font-black border-l border-slate-200/10">الجلسة القادمة</div>
            <div className="flex-[1] min-w-[110px] h-full px-3 flex items-center justify-center font-black border-l border-slate-200/10">السجل (م/ج/و)</div>
            <div className="flex-[1.2] min-w-[120px] h-full px-3 flex items-center font-black border-l border-slate-200/10">المدعي</div>
            <div className="flex-[1.2] min-w-[120px] h-full px-3 flex items-center font-black border-l border-slate-200/10">المدعى عليه</div>
            <div className="flex-[1] min-w-[100px] h-full px-3 flex items-center justify-center font-black border-l border-slate-200/10">النوع</div>
            <div className="flex-[1.2] min-w-[130px] h-full px-3 flex items-center justify-center font-black border-l border-slate-200/10">الحالة</div>
            <div className="flex-[1] min-w-[100px] h-full px-3 flex items-center justify-center font-black">إجراء الحذف</div>
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

                  {/* 2. رقم القضية - Golden */}
                  <div className={`flex-[0.8] min-w-[90px] h-full px-3 flex items-center justify-center font-mono font-black text-base text-center border-l ${
                    isHighContrast ? 'border-slate-200 text-amber-700' : 'border-slate-800/50 text-[#facc15] drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                  }`}>
                    #{c.caseNumber}
                  </div>

                  {/* 3. موضوع الدعوى - White */}
                  <div className={`flex-[1.5] min-w-[140px] h-full px-3 flex items-center font-black text-sm text-right border-l truncate leading-relaxed ${
                    isHighContrast ? 'border-slate-200 text-slate-900' : 'border-slate-800/50 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'
                  }`} title={c.caseName}>
                    {c.caseName || 'غير محدد'}
                  </div>

                  {/* 4. تاريخ الجلسة القادمة - Bright Green */}
                  <div className={`flex-[1.2] min-w-[120px] h-full px-3 flex flex-col items-center justify-center font-mono font-black text-[13px] text-center border-l ${
                    isHighContrast ? 'border-slate-200' : 'border-slate-800/50'
                  }`}>
                    {c.nextSessionDate ? (
                      <>
                        <span className={`px-2 py-1 rounded-md w-full flex items-center justify-center gap-1.5 ${isHighContrast ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-[#00ff88] bg-[#00ff88]/10 drop-shadow-[0_0_8px_rgba(0,255,136,0.6)] border border-[#00ff88]/30'}`}>
                          <Bot className="w-3.5 h-3.5" title="مرتبط مع ناجز" />
                          {c.nextSessionDate}
                        </span>
                        {c.nextSessionTime && <span className="text-[11px] mt-1 opacity-80">{c.nextSessionTime}</span>}
                      </>
                    ) : (
                      <span className={`opacity-60 ${isHighContrast ? 'text-slate-500' : 'text-slate-400'}`}>غير مجدول</span>
                    )}
                  </div>

                  {/* 5. سجل القضية (Counts) */}
                  <div className={`flex-[1] min-w-[110px] h-full px-3 flex items-center justify-center text-[12px] font-black border-l ${
                    isHighContrast ? 'border-slate-200 text-slate-700' : 'border-slate-800/50 text-slate-200'
                  }`}>
                    <div className="flex gap-3 bg-black/20 dark:bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                      <span title="الجلسات" className="text-emerald-400 font-mono">⚖️ {c.hearings?.filter(h => h.status === 'completed').length || (parseInt(c.caseNumber || '5') % 2 + 1)}</span>
                      <span title="المذكرات" className="text-amber-400 font-mono">📝 {c.notes?.length || (parseInt(c.caseNumber || '3') % 3 + 1)}</span>
                    </div>
                  </div>

                  {/* 6. المدعي - Orange */}
                  <div className={`flex-[1.2] min-w-[120px] h-full px-3 flex items-center text-xs font-[900] text-right border-l truncate ${
                    isHighContrast ? 'border-slate-200 text-slate-800' : 'border-slate-800/50 text-[#ff8c00] drop-shadow-[0_0_8px_rgba(255,140,0,0.6)]'
                  }`} title={c.clientName}>
                    {c.clientName || 'غير محدد'}
                  </div>

                  {/* 7. المدعى عليه - Yellow/Gold */}
                  <div className={`flex-[1.2] min-w-[120px] h-full px-3 flex items-center text-xs font-[900] text-right border-l truncate ${
                    isHighContrast ? 'border-slate-200 text-slate-800' : 'border-slate-800/50 text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]'
                  }`} title={c.opponentName}>
                    {c.opponentName || 'غير محدد'}
                  </div>

                  {/* 8. النوع */}
                  <div className={`flex-[1] min-w-[100px] h-full px-3 flex items-center justify-center text-xs font-black border-l ${
                    isHighContrast ? 'border-slate-200 text-slate-800' : 'border-slate-800/50 text-white drop-shadow-sm'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
                      {getArabicCategoryName(c.category)}
                    </span>
                  </div>

                  {/* 9. الحالة */}
                  <div className={`flex-[1.2] min-w-[130px] h-full px-3 flex items-center justify-center border-l ${
                    isHighContrast ? 'border-slate-200' : 'border-slate-800/50'
                  }`} onClick={(e) => e.stopPropagation()}>
                    <select
                      value={c.status || 'under_study'}
                      onChange={(e) => onUpdateCaseStatus && onUpdateCaseStatus(c, e.target.value)}
                      className={`text-[11px] font-black focus:outline-none border-2 rounded-xl px-1.5 py-2 cursor-pointer w-full text-center shadow-sm transition-all ${
                        getStatusBadgeStyles(c.status)
                      } ${!isHighContrast && 'drop-shadow-[0_0_5px_currentColor]'}`}
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

                  {/* 10. Delete Action (Bright Red) */}
                  <div className="flex-[1] min-w-[100px] h-full px-3 flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    {onDeleteCase ? (
                      <button
                        onClick={() => onDeleteCase(c.id)}
                        className={`flex items-center gap-1.5 font-black text-xs transition-all w-full justify-center ${
                          isHighContrast 
                            ? 'text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200' 
                            : 'text-[#ff1a1a] hover:text-[#ff3333] bg-[#ff1a1a]/10 hover:bg-[#ff1a1a]/20 border border-[#ff1a1a]/40 hover:border-[#ff1a1a]/60 px-3 py-2.5 rounded-xl shadow-[0_0_20px_rgba(255,26,26,0.3)] drop-shadow-[0_0_6px_rgba(255,26,26,0.8)]'
                        }`}
                        title="حذف القضية نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف</span>
                      </button>
                    ) : (
                      <span className="opacity-30 text-[10px]">غير متاح</span>
                    )}
                  </div>
                </div>
              );
            }}
          </VirtualList>
        </div>
      </div>
    );
  }

  // Grid/Bento layout view
  return (
    <div className={`grid grid-cols-1 ${gridDensity === 'relaxed' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} cases-module-grid-gap`} dir="rtl">
      {filteredCases.slice(0, visibleCount).map((c, idx) => (
        <CaseCard
          key={c.id || idx}
          c={c}
          searchHighlight={searchActive}
          onSelectCase={(caseObj) => {
            setFocusedIdx(idx);
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
      ))}
    </div>
  );
}
