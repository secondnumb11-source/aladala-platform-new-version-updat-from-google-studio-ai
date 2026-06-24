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
      <div className={`overflow-hidden shadow-2xl transition-all duration-300 border rounded-[2.5rem] w-full text-right ${
        isHighContrast 
          ? 'bg-white border-slate-900 border-2 shadow-slate-200' 
          : 'bg-[#050e21] border-slate-700/50 shadow-black/80'
      }`} dir="rtl">
        {/* Table Header */}
        <div className={`flex items-center text-right border-b ${
          isHighContrast ? 'bg-slate-200 border-slate-900 text-slate-950' : 'bg-slate-900/80 border-slate-800 text-slate-200'
        } font-[900] text-xs h-14`} dir="rtl">
          {/* 1. Green column right-most */}
          <div className="w-14 self-stretch flex items-center justify-center bg-[#00b274] text-white shrink-0 font-bold text-base select-none rounded-tr-[2.4rem]">
            <ChevronDown className="w-4 h-4" />
          </div>
          
          {/* 2. رقم القضية */}
          <div className={`flex-[1.2] min-w-[120px] h-full px-4 flex items-center font-black border-l ${
            isHighContrast ? 'bg-slate-100/30 border-slate-200' : 'bg-slate-900/30 border-slate-800/30'
          }`}>رقم القضية</div>
          
          {/* 3. تاريخ القضية */}
          <div className="flex-[1.2] min-w-[110px] h-full px-4 flex items-center font-black border-l border-slate-200/10">تاريخ القضية</div>
          
          {/* 4. نوع القضية */}
          <div className="flex-[1.5] min-w-[130px] h-full px-4 flex items-center font-black border-l border-slate-200/10">نوع القضية</div>
          
          {/* 5. المدعي */}
          <div className="flex-[2] min-w-[150px] h-full px-4 flex items-center font-black border-l border-slate-200/10">المدعي</div>
          
          {/* 6. المدعى عليه */}
          <div className="flex-[2] min-w-[150px] h-full px-4 flex items-center font-black border-l border-slate-200/10">المدعى عليه</div>
          
          {/* 7. الحالة */}
          <div className="flex-[1.2] min-w-[120px] h-full px-4 flex items-center font-black border-l border-slate-200/10">الحالة</div>
          
          {/* 8. Options Column (left-most) */}
          <div className="w-12 h-full flex items-center justify-center shrink-0"></div>
        </div>

        {/* Table Body (Virtualized list) */}
        <VirtualList
          style={{ direction: "rtl" }}
          height={600}
          width="100%"
          className={`divide-y-4 ${isHighContrast ? 'divide-slate-200' : 'divide-slate-900'}`}
          itemCount={filteredCases.length}
          itemSize={100}
        >
          {({ index, style }: any) => {
            const c = filteredCases[index];
            if (!c) return null;
            const { CategoryIcon } = getInteractiveCaseStyles(c.category, c.status);
            const isRowFocused = index === focusedIdx;
            const isMenuOpen = activeMenuCaseId === c.id;

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
                } ${c.archived ? 'opacity-50 grayscale-[0.5]' : ''} ${isHighContrast ? 'border-slate-200' : 'border-slate-800/40'}`} 
                onClick={() => {
                  setFocusedIdx(index);
                  onSelectCase(c);
                }}
                dir="rtl"
              >
                {/* 1. Green stripe right-most */}
                <div className="w-14 self-stretch flex items-center justify-center bg-[#00b274] text-white shrink-0 font-bold text-base select-none border-l border-slate-200/20">
                  <ChevronDown className="w-4 h-4 text-white" />
                </div>

                {/* 2. رقم القضية */}
                <div className={`flex-[1.2] min-w-[120px] h-full px-4 flex items-center font-mono font-black text-xs text-right border-l ${
                  isHighContrast ? 'bg-slate-100/50 border-slate-200 text-slate-850' : 'bg-slate-900/30 border-slate-800/50 text-amber-400'
                }`}>
                  #{c.caseNumber}
                </div>

                {/* 3. تاريخ القضية */}
                <div className={`flex-[1.2] min-w-[110px] h-full px-4 flex items-center font-mono text-xs text-right border-l ${
                  isHighContrast ? 'border-slate-200 text-slate-600' : 'border-slate-800/50 text-white font-bold'
                }`}>
                  {formatCaseDate(c.startDate || c.createdAt)}
                </div>

                {/* 4. نوع القضية */}
                <div className={`flex-[1.5] min-w-[130px] h-full px-4 flex items-center text-xs text-right font-[850] border-l ${
                  isHighContrast ? 'border-slate-200 text-slate-700' : 'border-slate-800/50 text-white'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <CategoryIcon className="w-3.5 h-3.5 opacity-75 shrink-0" />
                    {getArabicCategoryName(c.category)}
                  </span>
                </div>

                {/* 5. المدعي */}
                <div className={`flex-[2] min-w-[150px] h-full px-4 flex items-center text-xs font-[800] text-right border-l truncate ${
                  isHighContrast ? 'border-slate-200 text-slate-800' : 'border-slate-800/50 text-orange-400'
                }`} title={c.clientName}>
                  {c.clientName || 'غير محدد'}
                </div>

                {/* 6. المدعى عليه */}
                <div className={`flex-[2] min-w-[150px] h-full px-4 flex items-center text-xs font-[800] text-right border-l truncate ${
                  isHighContrast ? 'border-slate-200 text-slate-800' : 'border-slate-800/50 text-yellow-400'
                }`} title={c.opponentName}>
                  {c.opponentName || 'غير محدد'}
                </div>

                {/* 7. الحالة */}
                <div className={`flex-[1.2] min-w-[120px] h-full px-4 flex items-center border-l ${
                  isHighContrast ? 'border-slate-200' : 'border-slate-800/50'
                }`} onClick={(e) => e.stopPropagation()}>
                  <select
                    value={c.status || 'under_study'}
                    onChange={(e) => onUpdateCaseStatus && onUpdateCaseStatus(c, e.target.value)}
                    className={`text-[11px] font-black focus:outline-none border-2 rounded-xl px-2.5 py-1.5 cursor-pointer w-full text-center shadow-sm transition-all ${
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

                {/* 8. Options Menu / Actions Column (left-most) */}
                <div className="w-12 h-full flex items-center justify-center shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveMenuCaseId(isMenuOpen ? null : c.id)}
                    className={`p-2 rounded-full transition-all border ${
                      isHighContrast 
                        ? 'hover:bg-slate-100 text-slate-700 border-transparent hover:border-slate-200' 
                        : 'hover:bg-slate-800 text-slate-300 border-transparent hover:border-slate-700/50'
                    }`}
                    title="خيارات التحكم"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Popover */}
                  {isMenuOpen && (
                    <div 
                      className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 w-48 rounded-2xl shadow-xl border p-1.5 transition-all animate-in fade-in slide-in-from-left-2 ${
                        isHighContrast 
                          ? 'bg-white border-slate-200 text-slate-800' 
                          : 'bg-[#0b172a] border-slate-700/80 text-slate-200 shadow-black/80'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActiveMenuCaseId(null);
                          onSelectCase(c);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                          isHighContrast ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                        }`}
                      >
                        <span>📂</span> عرض تفاصيل القضية
                      </button>
                      
                      {onNajizSync && (
                        <button
                          onClick={() => {
                            setActiveMenuCaseId(null);
                            onNajizSync(c);
                          }}
                          className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                            isHighContrast ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                          }`}
                        >
                          <span>🔄</span> مزامنة مع ناجز
                        </button>
                      )}

                      {onArchiveToggle && (
                        <button
                          onClick={() => {
                            setActiveMenuCaseId(null);
                            onArchiveToggle(c);
                          }}
                          className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                            isHighContrast ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                          }`}
                        >
                          <span>📦</span> {c.archived ? 'إلغاء الأرشفة' : 'أرشفة القضية'}
                        </button>
                      )}

                      <div className="h-px bg-slate-200/10 dark:bg-slate-700/30 my-1" />

                      <button
                        onClick={() => {
                          setActiveMenuCaseId(null);
                          if (onDeleteCase) onDeleteCase(c.id);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 text-rose-500 transition-all ${
                          isHighContrast ? 'hover:bg-rose-50' : 'hover:bg-rose-500/10'
                        }`}
                      >
                        <span>🗑️</span> حذف القضية نهائياً
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        </VirtualList>
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
