/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { List } from 'react-window';
const VirtualList = List as any;
import { ChevronLeft, Trash2 } from 'lucide-react';
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
  onDeleteCase
}: CasesListProps) {
  if (filteredCases.length === 0) {
    return (
      <div className={`p-20 text-center rounded-[3rem] border border-dashed flex flex-col items-center justify-center space-y-6 ${
        isHighContrast ? 'bg-slate-100 border-slate-900 text-slate-900' : 'bg-[#0c1a35] border-slate-800'
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
        <div className={`flex items-center text-right border-b ${isHighContrast ? 'bg-slate-200 border-slate-900' : 'bg-slate-900/80 border-slate-800'}`} dir="rtl">
          <div className="flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">رقم الدعوى</div>
          <div className="flex-[2] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">اسم الدعوى</div>
          <div className="flex-[1.5] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">العميل</div>
          <div className="flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">التصنيف</div>
          <div className="flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">الحالة</div>
          <div className="flex-[1] px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">الجلسة القادمة</div>
          <div className="flex-[0.5] px-4 py-4"></div>
        </div>
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
            const { arabicStatusName, CategoryIcon } = getInteractiveCaseStyles(c.category, c.status);
            return (
              <div 
                style={style}
                className={`flex items-center text-right transition-all group cursor-pointer ${
                  isHighContrast 
                    ? (index % 2 === 0 ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white hover:bg-slate-100') 
                    : (index % 2 === 0 ? 'bg-[#0a182f]/40 hover:bg-amber-500/10' : 'bg-transparent hover:bg-amber-500/10')
                } ${c.archived ? 'opacity-50 grayscale-[0.5]' : ''}`} 
                onClick={() => onSelectCase(c)}
                dir="rtl"
              >
                <div className={`flex-[1] px-4 text-xs font-mono font-black tracking-tight ${isHighContrast ? 'text-amber-800' : 'text-amber-400'} transition-colors`}>#{c.caseNumber}</div>
                <div className="flex-[2] px-4 text-xs font-black tracking-tight truncate">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{c.caseName}</span>
                    {isCaseOverdue(c) && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse relative" title="تجاوزت المهلة النظامية" />
                    )}
                  </div>
                  <CaseClassificationTags category={c.category} status={c.status} isHighContrast={isHighContrast} />
                </div>
                <div className={`flex-[1.5] px-4 text-[11px] font-black tracking-tight truncate ${isHighContrast ? 'text-slate-800' : 'text-indigo-300'}`}>{c.clientName}</div>
                <div className="flex-[1] px-4">
                  <span className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl border-2 inline-flex items-center gap-1 ${
                    isHighContrast 
                      ? 'bg-slate-100 border-slate-900 text-slate-950' 
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}>
                    <CategoryIcon className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex-[1] px-4" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={c.status || 'under_study'}
                    onChange={(e) => onUpdateCaseStatus && onUpdateCaseStatus(c, e.target.value)}
                    className={`text-[11px] font-black bg-transparent focus:outline-none border rounded-lg p-1.5 cursor-pointer ${
                      isHighContrast ? 'text-slate-950 border-slate-900 bg-white font-black' : 'text-amber-400 border-slate-700/50 bg-[#050e21] font-bold'
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
                <div className={`flex-[1] px-4 text-[10px] font-black font-mono tracking-widest truncate ${isHighContrast ? 'text-emerald-900' : 'text-emerald-400'}`}>{c.nextSessionDate || '---'}</div>
                <div className="flex-[0.5] px-4 text-right flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCase && onDeleteCase(c.id);
                    }}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isHighContrast 
                        ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                    }`}
                    title="حذف القضية نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronLeft className="w-4 h-4 transition-all rotate-180 inline-block drop-shadow-sm text-slate-700" />
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
    <div className={`grid grid-cols-1 ${gridDensity === 'relaxed' ? 'md:grid-cols-2 lg:grid-cols-3 gap-10' : 'md:grid-cols-3 lg:grid-cols-4 gap-6'}`} dir="rtl">
      {filteredCases.slice(0, visibleCount).map((c, idx) => (
        <CaseCard
          key={c.id || idx}
          c={c}
          onSelectCase={onSelectCase}
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
        />
      ))}
    </div>
  );
}
