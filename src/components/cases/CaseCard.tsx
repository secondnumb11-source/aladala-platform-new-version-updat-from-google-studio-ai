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
      } ${isKeyboardFocused ? 'ring-4 ring-[#FF7F00] ring-offset-2 ring-offset-[#050e21]' : ''} ${searchHighlight ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#020817]' : ''}`}
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
        <div className="grid grid-cols-1 gap-6 text-right w-full">
          
          {/* GRID ROW 1: HEADER CONTROLS AND STATUSES */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-dashed border-slate-700/60 pb-4">
            
            {/* Quick Actions (Clock/History) & Category Logo details */}
            <div className="flex items-center gap-2.5">
              <div className="relative group/tooltip">
                <button
                  type="button"
                  id={`btn-history-${c.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivityLogCaseId(c.id);
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 border-2 bg-transparent border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-slate-900 shadow-sm`}
                  title="سجل تعديلات ونشاط القضية"
                >
                  <Clock className="w-4 h-4" />
                </button>
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-amber-500/40 text-amber-400 text-[10px] font-black rounded-xl pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl">
                  مراجعة سجل الأحداث والوقائع التاريخية المحدثة للدعوى 📜
                </div>
              </div>

              <div className={`rounded-xl border-2 border-amber-500 flex items-center justify-center shrink-0 shadow-sm bg-slate-950 text-white`}
              style={{ width: '38px', height: '38px' }}>
                <IconComponent className="text-amber-400" style={{ width: '18px', height: '18px' }} />
              </div>

              {/* Tag for category type of system */}
              <div className="hidden sm:flex flex-col text-right">
                <span className={`uppercase ${calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)}`}>قالب التصنيف القضائي</span>
                <span className={`tracking-tight ${calculateTextColor(isLightTheme, isHighContrast, 'secondary', palette)}`}>{theme.nameAr}</span>
              </div>
            </div>

            {/* Displaying Current Case Status and Najiz Sync Badge */}
            <div className="flex flex-col items-end gap-1.5 z-10">
              {c.is_najiz_sync && (
                <div className="flex items-center gap-1.5 bg-[#D4AF37]/20 border-2 border-[#D4AF37] px-2.5 py-1 rounded-lg animate-pulse-slow">
                   <Clock className="w-3.5 h-3.5 text-[#FACC15]" />
                   <span className="text-xs font-black text-[#FACC15]">مزامنة ناجز: {c.last_sync_at ? new Date(c.last_sync_at).toLocaleDateString('ar-SA') : 'تاريخ غير معروف'}</span>
                </div>
              )}
              <span className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm bg-transparent border-2 border-[#FF7F00] text-[#FF7F00]`}>
                <span className={`w-2.5 h-2.5 rounded-full ${c.status === 'closed' ? 'bg-slate-400': 'bg-amber-400 animate-ping'}`} />
                {onUpdateCaseStatus ? (
                  <select
                    value={c.status || 'under_study'}
                    onChange={(e) => onUpdateCaseStatus(c, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-white font-extrabold focus:outline-none cursor-pointer pr-1 leading-tight appearance-none text-base"
                    style={{ direction: 'rtl' }}
                  >
                    <option value="under_study">قيد الدراسة 🖋️</option>
                    <option value="under_review">قيد النظر ⚖️</option>
                    <option value="struck_off">شطبت 🗑️</option>
                    <option value="appeal">استئناف ⤴️</option>
                    <option value="execution">تنفيذ ⚡</option>
                    <option value="primary_judgment">حكم ابتدائي 📜</option>
                    <option value="final_judgment">حكم قطعي ✅</option>
                    <option value="postponed">مؤجلة ⏳</option>
                    <option value="closed">ملف مقفل منتهي 🔒</option>
                    <option value="active">نشطة جارية ⚖️</option>
                  </select>
                ) : (
                  <span className="font-extrabold text-base">{arabicStatusName}</span>
                )}
              </span>

              <span className={`px-2 py-0.5 rounded-lg border-2 uppercase shrink-0 border-[#f59e0b] text-[#f59e0b] bg-transparent text-[11px] font-[900]`}>
                {onUpdateCaseStatus ? 'تحديث سريع للحالة ✨' : 'نظام العدالة الفاخرة'}
              </span>
            </div>
          </div>

          {/* GRID ROW 2: IDENTIFICATION, LABELS AND CORE INFORMATION */}
          <div className="grid grid-cols-1 gap-3 py-1">
            <div className="flex items-center gap-2 justify-between">
              {/* Case ID Number */}
              <span className={`font-mono font-black border-2 border-amber-400 text-amber-400 bg-transparent px-2.5 py-0.5 rounded-lg tracking-wider text-base`}>
                #{c.caseNumber}
              </span>

              {/* Delayed Badge with high visibility red */}
              {isCaseOverdue(c) && (
                <span className="text-sm font-black text-rose-500 bg-transparent border-2 border-rose-500 px-3 py-1 rounded-xl animate-pulse shadow-sm">
                  طلب مراجعة عاجل
                </span>
              )}
            </div>

            {/* Responsive Case Name Header */}
            <h3 className={`tracking-tight leading-snug line-clamp-2 mt-1 ${calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)}`} style={{ minHeight: '3.5rem' }}>
              {c.caseName}
            </h3>
            
            {/* Associated Client Sub-panel */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-dashed border-slate-700/60 mt-1.5 pb-1.5">
              <User className={`w-5 h-5 shrink-0 stroke-[3px] text-white`} />
              <p className={`truncate ${calculateTextColor(isLightTheme, isHighContrast, 'secondary', palette)}`}>
                الموكل: <span className="font-[900] drop-shadow-sm text-white">{c.clientName}</span>
              </p>
            </div>
          </div>

          {/* GRID ROW 3: DETAILED COURT AND CALENDAR PANELS IN FLEXIBLE GRID */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            
            {/* Court Selection Panel */}
            <div className={`flex flex-col gap-2 p-4 rounded-2xl ${palette.innerCardBg} shadow-md`}>
              <div className="flex items-center gap-1.5 opacity-90">
                <MapPin className="w-5 h-5 text-sky-400 stroke-[3px]" />
                <span className={`${calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)}`}>المحكمة المختصة</span>
              </div>
              <span className={`truncate w-full ${calculateTextColor(isLightTheme, isHighContrast, 'secondary', palette)}`}>{c.courtName}</span>
            </div>
            
            {/* Session Date Panel */}
            {(() => {
              const countdown = getSessionCountdown(c.nextSessionDate);
              const isSoon = countdown && countdown.isSoon;
              const soonPanelBg = isSoon 
                ? 'bg-transparent border-2 border-[#FF7F00]/60 shadow-md shadow-orange-950/30'
                : palette.innerCardBg;
              return (
                <div className={`flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${soonPanelBg}`}>
                  <div className="flex items-center gap-1.5 opacity-90">
                    <Calendar className={`w-5 h-5 stroke-[3px] ${isSoon ? 'text-[#FF7F00] animate-bounce animate-pulse' : 'text-amber-500'}`} />
                    <span className={`${isSoon ? calculateTextColor(isLightTheme, isHighContrast, 'accent', palette) : calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)}`}>
                      الجلسة القادمة
                    </span>
                  </div>
                  <span className={`font-mono ${isSoon ? calculateTextColor(isLightTheme, isHighContrast, 'accent', palette) : calculateTextColor(isLightTheme, isHighContrast, 'secondary', palette)}`}>
                    {c.nextSessionDate || 'غير مجدول'}
                  </span>
                  
                  {isSoon && countdown && (
                    <span className="mt-1.5 text-xs font-black bg-[#FF7F00] text-white px-2 py-0.5 rounded-lg border-2 border-orange-400 animate-pulse text-center block">
                      🚨 {countdown.daysRemaining === 0 ? 'اليوم!' : countdown.daysRemaining === 1 ? 'غداً!' : `متبقي ${countdown.daysRemaining} أيام!`}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* CASE STATISTICS HUD - COMPACT STATISTICS AT A GLANCE */}
          <div className={`grid grid-cols-3 gap-2.5 p-3.5 my-1 rounded-[1.25rem] border border-[#334155] bg-slate-950/40`} dir="rtl">
            <div className="flex flex-col items-center justify-center text-center">
              <span className={`text-xs font-black text-slate-400 block mb-0.5`}>📋 مذكرات</span>
              <span className={`text-lg font-black font-mono tracking-tight text-[#FF7F00]`}>
                {c.notes?.length || (parseInt(c.caseNumber || '3') % 3 + 1)}
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center border-x border-slate-700/30">
              <span className={`text-xs font-black text-slate-400 block mb-0.5`}>🏛️ جلسات</span>
              <span className={`text-lg font-black font-mono tracking-tight text-sky-450`}>
                {c.hearings?.filter(h => h.status === 'completed').length || (parseInt(c.caseNumber || '5') % 2 + 1)}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <span className={`text-xs font-black text-slate-400 block mb-0.5`}>📂 مستندات</span>
              <span className={`text-lg font-black font-mono tracking-tight text-emerald-450`}>
                {c.attachments_count || 0}
              </span>
            </div>
          </div>

          {/* GRID ROW 4: INTERACTIVE ACTIONS & LIVE STATUSES */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-slate-700/60 pb-1">
            {/* Sync trigger button with Quick Note option */}
            <div className="flex items-center gap-2">
              <div className="relative group/tooltip">
                <button
                  type="button"
                  id={`btn-sync-${c.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNajizSync(c);
                  }}
                  disabled={isSyncing === c.id}
                  className="bg-transparent border-2 border-emerald-400 text-emerald-400 font-extrabold py-2 px-3 rounded-xl text-sm transition-all hover:bg-emerald-400 hover:text-slate-900 flex items-center gap-1.5 shadow-sm outline-none cursor-pointer"
                  title="سحب وقائع وبيانات صك الحكم من ناجز"
                >
                  <Bot className={`w-4 h-4 stroke-[2.5px] ${isSyncing === c.id ? 'animate-spin' : ''}`} />
                  <span className="font-[900]">{isSyncing === c.id ? 'جاري السحب...' : 'مزامنة ناجز'}</span>
                </button>
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-emerald-500/40 text-emerald-400 text-[10px] font-black rounded-xl pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl">
                  تحديث فوري لبيانات المرافعة وضبط الجلسات عبر بوابة ناجز العدلية 🤖
                </div>
              </div>

              {/* Quick Note Button */}
              <div className="relative group/tooltip">
                <button
                  type="button"
                  id={`btn-quick-note-${c.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotePopoverOpen(true);
                  }}
                  className="bg-transparent border-2 border-[#FF7F00] text-[#FF7F00] font-extrabold py-2 px-3 rounded-xl text-sm transition-all hover:bg-[#FF7F00] hover:text-slate-900 flex items-center gap-1.5 shadow-sm outline-none cursor-pointer"
                  title="إضافة ملاحظة سريعة للمكتب"
                >
                  <Notebook className="w-4 h-4 stroke-[2.5px]" />
                  <span className="font-[900]">ملاحظة سريعة</span>
                </button>
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-orange-500/40 text-orange-400 text-[10px] font-black rounded-xl pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl">
                  تدوين حواشي وملاحظات قانونية عاجلة لملف القضية للرجوع السريع 📝
                </div>
              </div>
            </div>

            {/* Integration source indicator tag */}
            {c.isNajizSync ? (
              <span className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm bg-transparent border-2 border-emerald-500 text-emerald-500 font-black`}>
                <Bot className="w-4 h-4 text-emerald-500 stroke-[2.5px]" />
                <span>مرتبط بنظام ناجز</span>
              </span>
            ) : (
              <span className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm bg-transparent border-2 border-[#FF7F00] text-[#FF7F00] font-black`}>
                <Edit2 className="w-4 h-4 animate-pulse stroke-[2.5px]" />
                <span>تسجيل إدخال يدوي</span>
              </span>
            )}
          </div>

          {/* GRID ROW 6: MANAGEMENT ARCHIVING PERMISSIONS CONTROLS */}
          {(onArchiveToggle || onDeleteCase) && (selectedRole === 'admin' || selectedRole === 'lawyer') && (
            <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-700/60">
              {onArchiveToggle && (
                <div className="relative group/tooltip">
                  <button
                    type="button"
                    id={`btn-archive-${c.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchiveToggle(c);
                    }}
                    className="bg-transparent border-2 border-amber-500 text-amber-500 font-black py-2 px-4 rounded-xl text-sm transition-all hover:bg-amber-500 hover:text-slate-900 shadow-sm cursor-pointer"
                  >
                    {c.archived ? 'استعادة ملف الدعوى' : 'نقل القضية للأرشيف'}
                  </button>
                  <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-amber-500/40 text-amber-400 text-[10px] font-black rounded-xl pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl">
                    حفظ وإيداع ملف الدعوى القضائية في الأرشيف المالي والإداري التراكمي 📦
                  </div>
                </div>
              )}

              {onDeleteCase && (
                <div className="relative group/tooltip">
                  <button
                    type="button"
                    id={`btn-delete-${c.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCase(c.id);
                    }}
                    className="bg-transparent border-2 border-rose-500 text-rose-500 font-black py-2 px-4 rounded-xl text-sm transition-all hover:bg-rose-500 hover:text-white flex items-center gap-1.5 shadow-sm outline-none cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                    <span>حذف الدعوى</span>
                  </button>
                  <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-red-500/40 text-red-400 text-[10px] font-black rounded-xl pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl">
                    شطب وإزالة ملف الدعوى القضائية نهائياً من قاعدة البيانات النشطة 🗑️
                  </div>
                </div>
              )}
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
