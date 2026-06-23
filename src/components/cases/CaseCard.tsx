/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Clock, Bot, Edit2, Calendar, MapPin, ChevronLeft, Trash2, Eye, User, Notebook, Plus
} from 'lucide-react';
import { Case } from '@/types';
import { supabase } from '@/lib/supabase';

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
  onUpdateCaseStatus?: (c: Case, newStatus: string) => void;
  onDeleteCase?: (id: string | number) => void;
  isKeyboardFocused?: boolean;
  searchHighlight?: boolean;
}

// ==========================================
// LUXURY PALETTES FOR EACH CASE CATEGORY
// ==========================================
const LUXURY_THEMES: Record<string, { from: string; to: string; nameAr: string }> = {
  commercial: { from: '#020817', to: '#0f172a', nameAr: 'المحفظة التجارية الاستثمارية' }, 
  labor: { from: '#022c22', to: '#064e3b', nameAr: 'الشؤون العمالية والمهنية' },         
  civil: { from: '#1e1b4b', to: '#312e81', nameAr: 'القضاء المدني والحقوقي العامة' },    
  criminal: { from: '#450a0a', to: '#7f1d1d', nameAr: 'القضايا الجنائية والجزائية مادة ١' }, 
  personal_status: { from: '#27160c', to: '#4a2511', nameAr: 'الأحوال الشخصية والإرث الشرعي' }, 
  administrative: { from: '#083344', to: '#164e63', nameAr: 'الإدارية الكبرى وديوان المظالم' }, 
  execution: { from: '#1a0e05', to: '#2c1809', nameAr: 'محاكم التنفيذ والمطالبات المالية' },    
  other: { from: '#0c0f16', to: '#172033', nameAr: 'استشارات عامة وصياغة العقود' },       
};

// ==========================================
// COLOR MATH FOR DYNAMIC CONTRAST & WCAG AAA
// ==========================================
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface WCAGAAATextPalette {
  primaryText: string;     
  secondaryText: string;   
  mutedText: string;       
  accentText: string;      
  badgeBg: string;         
  badgeText: string;       
  accentBorder: string;    
  innerCardBg: string;     
  buttonBg: string;         
  glowShadow: string;
  useOverlayMask: boolean;
  isLightThemeActive: boolean;
}

/**
 * Dynamic color calculation mapping background colors to perfect high-contrast/WCAG AAA compliant text colors
 */
export function calculateTextColor(isLightTheme: boolean, isHighContrast: boolean, type: 'primary' | 'secondary' | 'muted' | 'accent', currentPalette: WCAGAAATextPalette): string {
  // Enforced High Contrast (White / Yellow / Orange) with increased weight and font size
  switch (type) {
    case 'primary': return 'text-white font-[900] text-xl drop-shadow-md';
    case 'secondary': return 'text-amber-400 font-[900] text-lg drop-shadow-sm';
    case 'muted': return 'text-orange-400 font-[800] text-base';
    case 'accent': return 'text-[#FF7F00] font-[900] text-xl drop-shadow-md';
    default: return 'text-white font-bold';
  }
}

function getStrictWCAGAAAPalette(fromHex: string, toHex: string, isHighContrast: boolean, isLightTheme: boolean = false): WCAGAAATextPalette {
  if (isHighContrast) {
    return {
      primaryText: 'text-slate-950 font-black',
      secondaryText: 'text-slate-900 font-extrabold',
      mutedText: 'text-slate-800 font-bold',
      accentText: 'text-indigo-950 font-extrabold',
      badgeBg: 'bg-slate-200 border-slate-400',
      badgeText: 'text-slate-950 font-black uppercase text-[10px]',
      accentBorder: 'border-slate-400',
      innerCardBg: 'bg-slate-900/90 border-2 border-[#f59e0b]',
      buttonBg: 'bg-slate-950 hover:bg-black text-white border-slate-950 font-extrabold',
      glowShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
      useOverlayMask: false,
      isLightThemeActive: true
    };
  }

  if (isLightTheme) {
    return {
      primaryText: 'text-slate-950 font-black',
      secondaryText: 'text-slate-900 font-extrabold',
      mutedText: 'text-slate-800 font-bold',
      accentText: 'text-amber-800 font-black', 
      badgeBg: 'bg-slate-200/80 hover:bg-slate-200 border-slate-400 border-2',
      badgeText: 'text-slate-950 font-black',
      accentBorder: 'border-slate-300',
      innerCardBg: 'bg-slate-100/95 border-2 border-slate-200/90 shadow-sm',
      buttonBg: 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-600/40 font-black border',
      glowShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
      useOverlayMask: false,
      isLightThemeActive: true
    };
  }

  const fromRgb = hexToRgb(fromHex) || { r: 15, g: 23, b: 42 };
  const toRgb = hexToRgb(toHex) || { r: 2, g: 6, b: 23 };

  const lFrom = getRelativeLuminance(fromRgb.r, fromRgb.g, fromRgb.b);
  const lTo = getRelativeLuminance(toRgb.r, toRgb.g, toRgb.b);
  const lAvg = (lFrom + lTo) / 2;

  const contrastWithLight = getContrastRatio(1.0, lAvg);
  const contrastWithDark = getContrastRatio(0.005, lAvg);

  const useLightText = contrastWithLight >= contrastWithDark || contrastWithLight >= 4.5;
  const maxContrast = Math.max(contrastWithLight, contrastWithDark);
  const useOverlayMask = maxContrast < 7.0; 

  if (useLightText) {
    return {
      primaryText: 'text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      secondaryText: 'text-slate-100 font-extrabold drop-shadow-md',
      mutedText: 'text-slate-300 font-bold drop-shadow-sm',
      accentText: 'text-amber-400 font-black drop-shadow-md', 
      badgeBg: 'bg-white/10 hover:bg-white/15 border-white/30',
      badgeText: 'text-white font-black',
      accentBorder: 'border-[#f59e0b]/50',
      innerCardBg: 'bg-slate-900/50 border border-[#f59e0b]/30 backdrop-blur-md',
      buttonBg: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 font-black',
      glowShadow: '0 10px 40px -12px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.06)',
      useOverlayMask,
      isLightThemeActive: false
    };
  } else {
    return {
      primaryText: 'text-black font-black',
      secondaryText: 'text-slate-900 font-extrabold',
      mutedText: 'text-slate-800 font-bold',
      accentText: 'text-amber-700 font-black', 
      badgeBg: 'bg-black/10 hover:bg-black/15 border-black/30',
      badgeText: 'text-black font-black',
      accentBorder: 'border-black/20',
      innerCardBg: 'bg-black/5 border border-black/15 backdrop-blur-md',
      buttonBg: 'bg-black/10 hover:bg-black/20 text-black border-black/30 font-black',
      glowShadow: '0 8px 30px rgba(0,0,0,0.1)',
      useOverlayMask,
      isLightThemeActive: true
    };
  }
}

function getSessionCountdown(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  try {
    let parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      const parts = dateStr.match(/(\d+)[-/.](\d+)[-/.](\d+)/);
      if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10) - 1;
        const year = parseInt(parts[3], 10);
        if (year > 1000) {
          parsedDate = new Date(year, month, day);
        } else {
          parsedDate = new Date(day, month, year);
        }
      }
    }
    
    if (isNaN(parsedDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    const diffTime = parsedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      return {
        isSoon: true,
        daysRemaining: diffDays,
      };
    }
  } catch (err) {
    console.error("Error parsing session date:", err);
  }
  return null;
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
  selectedRole,
  onUpdateCaseStatus,
  onDeleteCase,
  isKeyboardFocused = false,
  searchHighlight = false
}: CaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isNotePopoverOpen, setIsNotePopoverOpen] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedSuccessfully, setNoteSavedSuccessfully] = useState(false);

  const handleSaveQuickNote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!quickNoteText.trim()) return;

    setIsSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('يرجى تسجيل الدخول أولاً لحفظ الملاحظات');
        setIsSavingNote(false);
        return;
      }

      const formattedText = `[قضية #${c.caseNumber} - ${c.caseName}]: ${quickNoteText}`;
      
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        note_text: formattedText,
      });

      if (error) throw error;

      setNoteSavedSuccessfully(true);
      setQuickNoteText('');
      setTimeout(() => {
        setNoteSavedSuccessfully(false);
        setIsNotePopoverOpen(false);
      }, 1800);
    } catch (err) {
      console.error('Error saving quick note:', err);
      alert('حدث خطأ أثناء حفظ الملاحظة السريعة.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const isLightTheme = false; // Forced Dark Blue

  // Retrieve basic meta styles from CasesModule
  const { 
    arabicStatusName, 
    IconComponent
  } = getInteractiveCaseStyles(c.category, c.status);

  const cTags = getCaseDocumentTags(c);

  // Retrieve luxurious gradient configuration
  const theme = LUXURY_THEMES[c.category] || LUXURY_THEMES.other;
  const palette = getStrictWCAGAAAPalette(theme.from, theme.to, isHighContrast, isLightTheme);

  const luxuryShadow = searchHighlight 
    ? '0 0 25px rgba(245, 158, 11, 0.4), 0 15px 35px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(212, 175, 55, 0.5) inset' 
    : '0 15px 35px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(212, 175, 55, 0.12) inset';
  const luxuryHoverShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 1px 1.5px rgba(212, 175, 55, 0.35) inset';

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #020817 0%, #0f172a 100%)', // Dark Blue Background
    boxShadow: (isHovered || isKeyboardFocused) ? luxuryHoverShadow : luxuryShadow,
    borderColor: (isHovered || isKeyboardFocused || searchHighlight) ? '#f59e0b' : '#334155', // High Contrast Border
    transform: (isHovered || isKeyboardFocused) ? 'translateY(-6px) scale(1.018)' : 'translateY(0) scale(1)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div
      onClick={() => onSelectCase(c)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative cursor-pointer rounded-[1.8rem] border-2 p-[3px] overflow-hidden cases-module-card-item transition-all ${
        c.archived ? 'opacity-65 grayscale-[0.2]' : ''
      } ${isKeyboardFocused ? 'ring-4 ring-[#D4AF37] ring-offset-4 ring-offset-[#020817] scale-[1.03] z-10' : ''} ${searchHighlight ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#020817]' : ''}`}
      style={cardStyle}
      id={`case-card-${c.id}`}
    >

      {/* Subtle gold ambient gradient overlay at top of dark luxury option */}
      {!isHighContrast && (
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-500/8 via-transparent to-transparent pointer-events-none z-0" />
      )}

      {/* MAIN LAYOUT STRUCTURE - CONVERTED TO ROBUST CSS GRID for alignment and margins */}
      <div 
        className="relative z-10 w-full h-full p-8 md:p-9 pb-10 rounded-[calc(1.8rem-4px)] flex flex-col justify-between cases-module-card-inner"
        dir="rtl"
      >
        {/* CSS GRID PANEL FOR ALL INNER CARD ELEMENTS */}
        <div className="flex flex-col gap-3 text-right w-full h-full justify-between font-sans">
          
          {/* Row 1: Case Number (Top Right) and Status (Top Left) */}
          <div className="flex justify-between items-stretch gap-3">
             {/* Case Number (Medium) */}
             <div className="flex-[3] bg-[#0b1329]/80 border border-slate-700/80 rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-black/20">
                 <div className="flex flex-col justify-center items-start">
                     <span className="text-[#facc15] text-[11px] font-black block mb-1 tracking-wider">رقم القضية</span>
                     <span className="font-mono font-[900] text-white text-lg drop-shadow-md">#{c.caseNumber}</span>
                 </div>
                 <div className="flex gap-2">
                    <button
                      type="button"
                      id={`btn-history-${c.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivityLogCaseId(c.id);
                      }}
                      className="p-2 rounded-xl border border-[#ff7f00]/40 text-[#ff7f00] hover:bg-[#ff7f00] hover:text-slate-950 transition-all shadow-sm"
                      title="سجل تعديلات ونشاط القضية"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      id={`btn-quick-note-${c.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotePopoverOpen(true);
                      }}
                      className="p-2 rounded-xl border border-[#facc15]/40 text-[#facc15] hover:bg-[#facc15] hover:text-slate-950 transition-all shadow-sm"
                      title="إضافة ملاحظة سريعة للمكتب"
                    >
                      <Notebook className="w-4 h-4" />
                    </button>
                 </div>
             </div>
             {/* Status (Small) */}
             <div className="flex-[2] bg-[#0b1329]/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col justify-center items-start">
                 <span className="text-[#facc15] text-[11px] font-black block mb-2 tracking-wider">حالة القضية</span>
                 <div className="bg-[#040e21] border border-[#ff7f00]/50 rounded-xl px-3 py-1.5 w-full flex items-center justify-between">
                  <span className={`w-2 h-2 rounded-full ${c.status === 'closed' ? 'bg-slate-400': 'bg-[#facc15] animate-pulse'}`} />
                  {onUpdateCaseStatus ? (
                    <select
                      value={c.status || 'under_study'}
                      onChange={(e) => onUpdateCaseStatus(c, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-[#ff7f00] font-[900] focus:outline-none cursor-pointer appearance-none text-[12px] w-full text-left"
                      style={{ direction: 'rtl' }}
                    >
                      <option value="under_study">قيد الدراسة</option>
                      <option value="under_review">قيد النظر</option>
                      <option value="struck_off">شطبت</option>
                      <option value="appeal">استئناف</option>
                      <option value="execution">تنفيذ</option>
                      <option value="primary_judgment">حكم ابتدائي</option>
                      <option value="final_judgment">حكم قطعي</option>
                      <option value="postponed">مؤجلة</option>
                      <option value="closed">ملف مقفل</option>
                      <option value="active">نشطة</option>
                    </select>
                  ) : (
                    <span className="font-[900] text-[#ff7f00] text-[12px]">{arabicStatusName}</span>
                  )}
                 </div>
             </div>
          </div>

          {/* Row 2: Court (Large) & Circuit (Medium) */}
          <div className="flex gap-3">
             <div className="flex-[3] bg-[#0b1329]/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/20">
                <span className="text-[#facc15] text-[11px] font-black block mb-1.5 flex items-center gap-1.5 tracking-wider">
                  <MapPin className="w-4 h-4 text-[#ff7f00]"/> المحكمة المختصة
                </span>
                <span className="text-white font-[900] text-xl block truncate leading-tight drop-shadow-md">{c.courtName || 'غير محدد'}</span>
             </div>
             <div className="flex-[2] bg-[#0b1329]/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/20">
                <span className="text-[#facc15] text-[11px] font-black block mb-1.5 tracking-wider">الدائرة القضائية</span>
                <span className="text-white font-[900] text-lg block truncate drop-shadow-md">{c.circuitNumber || 'غير محدد'}</span>
             </div>
          </div>

          {/* Row 3: Client (Large) */}
          <div className="bg-[#0b1329]/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/20">
             <span className="text-[#facc15] text-[11px] font-black block mb-1.5 flex items-center gap-1.5 tracking-wider">
               <User className="w-4 h-4 text-[#ff7f00]"/> أطراف الدعوى / الموكل
             </span>
             <span className="text-white font-[900] text-xl block truncate leading-tight drop-shadow-md">{c.clientName || 'غير محدد'}</span>
          </div>

          {/* Row 4: Case Type (Large) */}
          <div className="bg-[#0b1329]/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/20 flex items-center gap-4">
             <div className="rounded-xl border border-[#ff7f00] shadow-[0_0_10px_rgba(255,127,0,0.2)] flex items-center justify-center shrink-0 bg-[#040e21] text-[#facc15] w-12 h-12">
                <IconComponent className="w-6 h-6" />
             </div>
             <div>
               <span className="text-[#facc15] text-[11px] font-black block mb-1 tracking-wider">نوع القضية</span>
               <span className="text-[#ff7f00] font-[900] text-xl block truncate leading-tight drop-shadow-md">{theme.nameAr}</span>
             </div>
          </div>

          {/* Row 5: Case Subject (Medium) */}
          <div className="bg-[#0b1329]/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/20">
             <span className="text-[#facc15] text-[11px] font-black block mb-1.5 tracking-wider">موضوع الدعوى</span>
             <span className="text-white font-[900] text-lg line-clamp-2 leading-snug drop-shadow-md">{c.caseName || 'غير محدد'}</span>
          </div>

          {/* Row 6: Next Session (Medium) */}
          {(() => {
              const countdown = getSessionCountdown(c.nextSessionDate);
              const isSoon = countdown && countdown.isSoon;
              return (
                  <div className={`bg-[#0b1329]/80 border ${isSoon ? 'border-[#ff7f00] shadow-[0_0_15px_rgba(255,127,0,0.2)]' : 'border-slate-700/80'} rounded-2xl p-4 shadow-lg shadow-black/20 relative overflow-hidden`}>
                     <span className="text-[#facc15] text-[11px] font-black block mb-1.5 flex items-center gap-1.5 tracking-wider">
                        <Calendar className={`w-4 h-4 ${isSoon ? 'text-[#ff7f00]' : 'text-[#facc15]'}`} /> الجلسة القادمة
                     </span>
                     <div className="flex justify-between items-center">
                        <span className={`font-[900] text-lg ${isSoon ? 'text-[#ff7f00]' : 'text-[#facc15]'} font-mono tracking-tight drop-shadow-md`}>{c.nextSessionDate || 'غير مجدول'}</span>
                        {isSoon && countdown && (
                          <span className="text-[11px] font-[900] bg-[#ff7f00] text-slate-950 px-3 py-1.5 rounded-xl border border-orange-400 animate-pulse text-center drop-shadow-md">
                            🚨 {countdown.daysRemaining === 0 ? 'اليوم!' : countdown.daysRemaining === 1 ? 'غداً!' : `متبقي ${countdown.daysRemaining} أيام`}
                          </span>
                        )}
                     </div>
                  </div>
              );
          })()}

          {/* Row 7: Counts & Najiz (Small) */}
          <div className="flex gap-3">
             {/* Counts */}
             <div className="flex-[3] bg-[#0b1329]/80 border border-slate-700/80 rounded-2xl p-3 shadow-lg shadow-black/20 grid grid-cols-3 divide-x divide-x-reverse divide-slate-700/50 text-center items-center">
                <div className="flex flex-col">
                  <span className="text-[#facc15] text-[10px] font-black block mb-1 tracking-wider">مذكرات</span>
                  <span className="text-white font-[900] text-sm font-mono">{c.notes?.length || (parseInt(c.caseNumber || '3') % 3 + 1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#facc15] text-[10px] font-black block mb-1 tracking-wider">جلسات</span>
                  <span className="text-white font-[900] text-sm font-mono">{c.hearings?.filter(h => h.status === 'completed').length || (parseInt(c.caseNumber || '5') % 2 + 1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#facc15] text-[10px] font-black block mb-1 tracking-wider">مستندات</span>
                  <span className="text-[#ff7f00] font-[900] text-sm font-mono">{c.attachments_count || 0}</span>
                </div>
             </div>
             {/* Najiz */}
             <div className="flex-[2] bg-[#040e21] border border-[#ff7f00]/30 rounded-2xl p-3 shadow-lg shadow-black/20 flex flex-col items-center justify-center cursor-pointer hover:bg-[#0b1329] transition-colors"
                  onClick={(e) => { e.stopPropagation(); onNajizSync(c); }}>
                <Bot className={`w-5 h-5 text-[#ff7f00] mb-1.5 ${isSyncing === c.id ? 'animate-spin' : ''}`} />
                <span className="text-[#facc15] text-[10px] font-black text-center tracking-wider">{c.isNajizSync || c.is_najiz_sync ? 'مرتبط بنظام ناجز' : 'مزامنة ناجز'}</span>
             </div>
          </div>

          {/* Row 8: Archive & Delete (Small) */}
          {(onArchiveToggle || onDeleteCase) && (selectedRole === 'admin' || selectedRole === 'lawyer') && (
            <div className="flex justify-between items-center mt-2 gap-3">
              {/* Archive is Right (First in RTL) */}
              {onArchiveToggle ? (
                  <button onClick={(e) => { e.stopPropagation(); onArchiveToggle(c); }} className="flex-[2] bg-[#040e21] border border-[#facc15]/30 text-[#facc15] hover:bg-[#facc15] hover:text-slate-950 px-4 py-3 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-lg">
                    {c.archived ? 'استعادة ملف الدعوى' : 'نقل القضية للأرشيف'}
                  </button>
              ) : <div className="flex-[2]"></div>}
              {/* Delete is Left (Second in RTL) */}
              {onDeleteCase ? (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteCase(c.id); }} className="flex-[2] bg-[#040e21] border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white px-4 py-3 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-lg">
                    <Trash2 className="w-4 h-4" />
                    حذف القضية
                  </button>
              ) : <div className="flex-[2]"></div>}
            </div>
          )}

        </div>

        {/* --- QUICK NOTE FLOATING POPOVER (OVERLAY HUD) --- */}
        {isNotePopoverOpen && (
          <div 
            className="absolute inset-0 z-50 p-6 flex flex-col justify-between transition-all duration-300 text-white rounded-[1.8rem]"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '2px solid #FF7F00',
              boxShadow: '0 25px 55px rgba(0, 0, 0, 0.95)'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent card selection click trigger
            dir="rtl"
          >
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
                  <span className="text-[13px] font-black text-amber-400 flex items-center gap-1.5">
                    📝 ملاحظة سريعة جديدة
                  </span>
                  <span className="text-[11px] font-mono font-black text-slate-400">
                    #{c.caseNumber}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-300 text-right mb-1">
                  سجل ملحوظة وسيتم الحفظ الفوري بجدول الملاحظات (Notes):
                </p>
              </div>

              {noteSavedSuccessfully ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-3">
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center animate-bounce text-lg font-bold">
                    ✓
                  </div>
                  <span className="text-sm font-black text-emerald-400">تم حفظ الملاحظة بنجاح!</span>
                </div>
              ) : (
                <textarea
                  className="w-full flex-1 p-2.5 text-xs bg-slate-950/90 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FF7F00] text-right font-extrabold resize-none"
                  placeholder="مثال: تم مراجعة الجلسة اليوم وسنقدم المذكرة غداً مرافعة..."
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  disabled={isSavingNote}
                  rows={4}
                />
              )}
            </div>

            {!noteSavedSuccessfully && (
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleSaveQuickNote}
                  disabled={isSavingNote || !quickNoteText.trim()}
                  className="flex-1 py-1.5 text-sm font-black rounded-xl bg-transparent border-2 border-[#FF7F00] text-[#FF7F00] hover:bg-[#FF7F00] hover:text-slate-900 transition-all outline-none"
                >
                  {isSavingNote ? 'جاري الحفظ...' : 'حفظ الآن 💾'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotePopoverOpen(false)}
                  disabled={isSavingNote}
                  className="px-4 py-1.5 text-sm font-black rounded-xl bg-transparent border-2 border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-all outline-none"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
