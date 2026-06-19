/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Clock, Bot, Edit2, Calendar, MapPin, ChevronLeft, Trash2, Eye 
} from 'lucide-react';
import { Case } from '@/types';

interface CaseCardProps {
  c: Case;
  onSelectCase: (caseObj: Case) => void;
  isHighContrast: boolean;
  isSyncing: string | null;
  onNajizSync: (c: Case) => void;
  setActivityLogCaseId: (id: string | null) => void;
  isCaseOverdue: (c: Case) => boolean;
  getInteractiveCaseStyles: (category: string, status: string) => any;
  getStatusKineticStyles: (status: string) => any;
  getCaseDocumentTags: (c: Case) => string[];
  daysLeft?: number;
  onArchiveToggle?: (c: Case) => void;
  selectedRole?: string;
}

export default function CaseCard({
  c,
  onSelectCase,
  isHighContrast,
  isSyncing,
  onNajizSync,
  setActivityLogCaseId,
  isCaseOverdue,
  getInteractiveCaseStyles,
  getStatusKineticStyles,
  getCaseDocumentTags,
  daysLeft = 999,
  onArchiveToggle,
  selectedRole
}: CaseCardProps) {
  const { 
    arabicCategoryName, 
    arabicStatusName, 
    IconComponent, 
    CategoryIcon
  } = getInteractiveCaseStyles(c.category, c.status);

  const statusStyles = getStatusKineticStyles(c.status);
  const cTags = getCaseDocumentTags(c);

  return (
    <div
      onClick={() => onSelectCase(c)}
      className={`card-professional-case relative cursor-pointer rounded-[2rem] border-2 p-[3px] overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
        isHighContrast 
          ? 'border-slate-900 bg-white shadow-xl hover:shadow-slate-300' 
          : 'border-[#fbbf24]/55 bg-[#050e21] shadow-[0_4px_20px_rgba(0,0,0,0.8)] hover:shadow-[#fbbf24]/20'
      } ${c.archived ? 'opacity-60 grayscale-[0.3]' : ''}`}
    >
      {/* Main Content Area - Dynamic theme support */}
      <div className={`relative z-10 w-full h-full p-6 md:p-8 rounded-[calc(2rem-3px)] flex flex-col justify-between shadow-inner ${
        isHighContrast ? 'bg-slate-50' : 'bg-[#0a182f]/80'
      }`}>
        
        <div className="relative z-10 space-y-6 text-right" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivityLogCaseId(c.id);
                }}
                className={`p-2 border rounded-xl transition-all cursor-pointer shrink-0 z-30 ${
                  isHighContrast 
                    ? 'bg-slate-200 border-slate-400 text-slate-800' 
                    : 'bg-amber-500/10 border-amber-500/30 text-[#fbbf24]'
                }`}
                title="سجل النشاط والتعديلات"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>

              <div className={`rounded-xl border shadow-inner flex items-center justify-center shrink-0 ${
                   isHighContrast 
                     ? 'bg-slate-900 border-slate-950 text-white' 
                     : 'bg-[#B8860B]/25 border-amber-500/30 text-[#fbbf24]'
                   }`}
                   style={{ width: `${34}px`, height: `${34}px` }}>
                <IconComponent className={isHighContrast ? 'text-white' : 'text-amber-300'} style={{ width: `${16}px`, height: `${16}px` }} />
              </div>
              <div className="flex flex-col text-right font-sans">
                <span className={`text-[10px] uppercase font-extrabold ${isHighContrast ? 'text-slate-950' : 'text-[#ffff00]'}`}>نظام التقاضي الذكي</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button
                 type="button"
                 onClick={(e) => {
                   e.stopPropagation();
                   onNajizSync(c);
                 }}
                 disabled={isSyncing === c.id}
                 className={`p-2 rounded-xl border transition-all cursor-pointer z-35 flex items-center gap-1.5 ${
                   isSyncing === c.id 
                     ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400 animate-pulse'
                     : isHighContrast 
                        ? 'bg-white border-slate-900 text-slate-900 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-700 text-amber-400 hover:border-amber-400'
                 }`}
                 title="مزامنة بيانات ناجز"
               >
                 <Bot className={`w-3.5 h-3.5 ${isSyncing === c.id ? 'animate-spin' : ''}`} />
                 <span className="text-[9px] font-black">{isSyncing === c.id ? 'جاري السحب...' : 'مزامنة ناجز'}</span>
               </button>
               {c.isNajizSync ? (
                 <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1 shadow-sm ${
                     isHighContrast ? 'bg-[#adff2f] text-black border-black/10' : 'bg-[#adff2f] text-black border-[#adff2f]/50'
                   }`}>
                    <Bot className="w-3 h-3 text-black" />
                    <span>ناجز</span>
                 </span>
               ) : (
                 <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1 shadow-sm ${
                     isHighContrast ? 'bg-orange-100 text-orange-900 border-orange-200' : 'bg-[#ffb067] text-[#4a2600] border-[#ffb067]/50'
                   }`}>
                    <Edit2 className="w-3 h-3" />
                    <span>يدوي</span>
                 </span>
               )}
               <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-colors font-sans shadow-sm ${
                 isHighContrast ? 'bg-slate-950 text-white' : 'bg-slate-900 text-white border-slate-700'
               }`}>
                  <span className="w-2 h-2 rounded-full bg-white opacity-80 animate-pulse"></span>
                  <span className="font-sans font-black">{arabicStatusName}</span>
               </span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 justify-between">
              <span className={`text-[10px] font-mono font-black ${isHighContrast ? 'text-amber-800 font-black' : 'text-amber-400'}`}>#{c.caseNumber}</span>
              {isCaseOverdue(c) && (
                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse">تنفيذ متأخر</span>
              )}
            </div>
            <h3 className={`text-base font-black truncate leading-tight ${isHighContrast ? 'text-slate-900' : 'text-white'}`}>
              {c.caseName}
            </h3>
            <p className={`text-xs ${isHighContrast ? 'text-slate-700 font-bold' : 'text-slate-300'} opacity-90 truncate`}>
              العميل المحال: {c.clientName}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-sans mt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className={`truncate max-w-[120px] ${isHighContrast ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>{c.courtName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className={`font-mono font-black text-[10px] ${isHighContrast ? 'text-slate-800 font-bold' : 'text-amber-400'}`}>{c.nextSessionDate || 'غير مجدول'}</span>
            </div>
          </div>

          {cTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-800/45">
              {cTags.slice(0, 3).map((tag, tIdx) => (
                <span 
                  key={tIdx} 
                  className={`text-[9px] px-2 py-0.5 rounded-md font-sans font-black ${
                    isHighContrast 
                      ? 'bg-slate-200 text-slate-950 border border-slate-400' 
                      : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {onArchiveToggle && (selectedRole === 'admin' || selectedRole === 'lawyer') && (
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800/20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchiveToggle(c);
                }}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all ${
                  c.archived
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-[#fbbf24]'
                }`}
              >
                {c.archived ? 'إلغاء الأرشفة' : 'أرشفة القضية'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
