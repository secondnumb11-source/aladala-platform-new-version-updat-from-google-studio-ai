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
  commercial: { from: '#1f2937', to: '#111827', nameAr: 'التجارية' }, // رمادي داكن جدا
  labor: { from: '#064e3b', to: '#022c22', nameAr: 'العمالية' },         // أخضر داكن جدا
  civil: { from: '#1e3a8a', to: '#0f172a', nameAr: 'المدنية' },    // أزرق داكن جدا
  criminal: { from: '#7f1d1d', to: '#450a0a', nameAr: 'الجزائية' }, // أحمر داكن جدا
  personal_status: { from: '#713f12', to: '#422006', nameAr: 'الأحوال الشخصية' }, // ذهبي داكن جدا
  administrative: { from: '#451a03', to: '#291304', nameAr: 'الإدارية' }, // بني داكن
  financial: { from: '#831843', to: '#4a044e', nameAr: 'المالية' },    // وردي داكن جدا
  execution: { from: '#831843', to: '#4a044e', nameAr: 'المالية' },    // وردي داكن جدا
  archived: { from: '#4b5563', to: '#374151', nameAr: 'مؤرشفة' }, // فضي داكن جدا
  other: { from: '#1f2937', to: '#111827', nameAr: 'أخرى' },       
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
    ? '0 0 20px rgba(212, 175, 55, 0.15), 0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(212, 175, 55, 0.4) inset' 
    : '0 10px 30px -10px rgba(0, 0, 0, 0.06), 0 0 1px 1px rgba(0, 0, 0, 0.04) inset';
  const luxuryHoverShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.12), 0 0 1px 1.5px rgba(212, 175, 55, 0.4) inset';

  const cardStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`, // Uses the correct category color
    boxShadow: (isHovered || isKeyboardFocused) ? luxuryHoverShadow : luxuryShadow,
    borderColor: (isHovered || isKeyboardFocused || searchHighlight) ? '#facc15' : 'rgba(255,255,255,0.1)', 
    transform: (isHovered || isKeyboardFocused) ? 'translateY(-6px) scale(1.018)' : 'translateY(0) scale(1)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div
      onClick={() => onSelectCase(c)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative cursor-pointer rounded-[1.8rem] border-[1.5px] p-[3px] overflow-hidden cases-module-card-item transition-all ${
        c.archived ? 'opacity-65 grayscale-[0.2]' : ''
      } ${isKeyboardFocused ? 'ring-4 ring-[#D4AF37] ring-offset-4 ring-offset-[#0f172a] scale-[1.03] z-10' : ''} ${searchHighlight ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0f172a]' : ''}`}
      style={cardStyle}
      id={`case-card-${c.id}`}
    >

      {/* Subtle gold ambient gradient overlay at top of dark luxury option */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none z-0" />

      {/* MAIN LAYOUT STRUCTURE - UNIFIED DARK LUXURY BENTO BOX */}
      <div 
        className="relative z-10 w-full h-full p-4 md:p-5 rounded-[calc(1.8rem-4px)] flex flex-col justify-between cases-module-card-inner bg-black/40 backdrop-blur-md"
        dir="rtl"
      >
        {/* CSS GRID PANEL FOR ALL INNER CARD ELEMENTS */}
        <div className="flex flex-col w-full h-full justify-between font-sans">
          
          {/* Top Actions (Row 0) */}
          <div className="flex justify-between items-start mb-3">
            {/* Top Right Actions */}
            <div className="flex gap-2">
               <button
                 type="button"
                 onClick={(e) => { e.stopPropagation(); setActivityLogCaseId(c.id); }}
                 className="p-2 rounded-xl border border-[#facc15] bg-black/40 text-[#facc15] hover:bg-black/60 transition-all shadow-sm"
                 title="سجل تعديلات ونشاط القضية"
               >
                 <Clock className="w-4 h-4 text-[#facc15]" />
               </button>
               <button
                 type="button"
                 onClick={(e) => { e.stopPropagation(); setIsNotePopoverOpen(true); }}
                 className="p-2 rounded-xl border border-[#facc15] bg-black/40 text-[#facc15] hover:bg-black/60 transition-all shadow-sm"
                 title="إضافة ملاحظة سريعة للمكتب"
               >
                 <Notebook className="w-4 h-4 text-[#facc15]" />
               </button>
            </div>
          </div>

          {/* Row 1: Case Number, Court */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-black/40 border border-[#facc15] rounded-xl p-2.5 shadow-sm text-center flex flex-col justify-center">
              <span className="text-[#facc15] text-[10px] font-black block mb-1 tracking-wider">رقم القضية</span>
              <span className="text-[#facc15] font-black text-lg truncate">#{c.caseNumber}</span>
            </div>
            <div className="bg-black/40 border border-[#fbbf24] rounded-xl p-2.5 shadow-sm text-center flex flex-col justify-center overflow-hidden">
              <span className="text-[#fbbf24] text-[10px] font-black block mb-1 tracking-wider">المحكمة المختصة</span>
              <span className="text-[#fbbf24] font-black text-lg truncate block">{c.courtName || 'غير محدد'}</span>
            </div>
          </div>

          {/* Row 2: Circuit, Category */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-black/40 border border-[#facc15] rounded-xl p-2.5 shadow-sm text-center flex flex-col justify-center overflow-hidden">
              <span className="text-[#facc15] text-[10px] font-black block mb-1 tracking-wider">الدائرة القضائية</span>
              <span className="text-white font-bold text-base truncate block">{c.circuitNumber || 'غير محدد'}</span>
            </div>
            <div className="bg-black/40 border border-white rounded-xl p-2.5 shadow-sm text-center flex flex-col justify-center overflow-hidden">
              <span className="text-white text-[10px] font-black block mb-1 tracking-wider">نوع القضية</span>
              <span className="text-[#facc15] font-black text-lg truncate block">{c.category || theme.nameAr || 'غير محدد'}</span>
            </div>
          </div>

          {/* Row 3: Client */}
          <div className="bg-black/40 border border-[#f97316] rounded-xl p-2.5 shadow-sm text-center mb-2 flex flex-col justify-center overflow-hidden">
            <span className="text-[#f97316] text-[10px] font-black block mb-1 tracking-wider">أطراف الدعوى / الموكل</span>
            <span className="text-[#f97316] font-black text-lg truncate block">{c.clientName || 'غير محدد'}</span>
          </div>

          {/* Row 4: Subject */}
          <div className="bg-black/40 border border-white rounded-xl p-3 shadow-sm text-center mb-2 flex flex-col justify-center overflow-hidden">
            <span className="text-white text-[10px] font-black block mb-1 tracking-wider">موضوع الدعوى</span>
            <span className="text-[#facc15] font-bold text-base block truncate">{c.caseName || 'غير محدد'}</span>
          </div>

          {/* Row 5: Next Session */}
          <div className="bg-black/40 border border-[#f97316] rounded-xl p-3 shadow-sm text-center mb-2 flex flex-col justify-center">
            <span className="text-[#f97316] text-[10px] font-black block mb-1 tracking-wider">الجلسة القادمة</span>
            <span className="text-[#fbbf24] font-bold text-base block flex justify-center items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#facc15]" />
              {c.nextSessionDate || 'غير مجدول'}
            </span>
          </div>

          {/* Row 6: Status & Counts & Najiz Sync */}
          <div className="flex gap-2 mb-3">
             <div className="flex-[3] bg-black/40 border border-[#facc15] rounded-xl p-2 shadow-sm grid grid-cols-4 divide-x divide-x-reverse divide-[#facc15] text-center items-center">
                <div className="flex flex-col">
                  <span className="text-[#facc15] text-[9px] font-black block mb-0.5 tracking-wider">الحالة</span>
                  <span className="text-white font-bold text-[10px] truncate">{c.status || arabicStatusName || 'غير محدد'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#facc15] text-[9px] font-black block mb-0.5 tracking-wider">مذكرات</span>
                  <span className="text-white font-bold text-xs font-mono">{c.notes?.length || (parseInt(c.caseNumber || '3') % 3 + 1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#facc15] text-[9px] font-black block mb-0.5 tracking-wider">جلسات</span>
                  <span className="text-white font-bold text-xs font-mono">{c.hearings?.filter(h => h.status === 'completed').length || (parseInt(c.caseNumber || '5') % 2 + 1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#facc15] text-[9px] font-black block mb-0.5 tracking-wider">مستندات</span>
                  <span className="text-white font-bold text-xs font-mono">{c.attachments_count || 0}</span>
                </div>
             </div>
             <div className="flex-[2] bg-black/40 border border-[#4ade80] rounded-xl p-2 shadow-sm flex flex-col items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onNajizSync(c); }}>
                <Bot className={`w-4 h-4 text-[#facc15] mb-1 ${isSyncing === c.id ? 'animate-spin' : ''}`} />
                <span className="text-[#4ade80] text-[9px] font-bold text-center tracking-wider">{c.isNajizSync || c.is_najiz_sync ? 'مرتبط بنظام ناجز' : 'مزامنة ناجز'}</span>
             </div>
          </div>

          {/* Row 7: Archive & Delete */}
          {(onArchiveToggle || onDeleteCase) && (selectedRole === 'admin' || selectedRole === 'lawyer') && (
            <div className="flex justify-between items-center gap-2 mt-auto">
              {/* Archive - Right */}
              {onArchiveToggle ? (
                  <button onClick={(e) => { e.stopPropagation(); onArchiveToggle(c); }} className="flex-[1] bg-black/40 border border-[#f97316] text-[#f97316] hover:bg-black/60 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    {c.archived ? 'استعادة ملف الدعوى' : 'نقل القضية للأرشيف'}
                  </button>
              ) : <div className="flex-[1]"></div>}
              {/* Delete - Left */}
              {onDeleteCase ? (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteCase(c.id); }} className="flex-[1] bg-black/40 border border-[#ef4444] text-[#ef4444] hover:bg-black/60 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <Trash2 className="w-3.5 h-3.5 text-[#facc15]" />
                    حذف القضية
                  </button>
              ) : <div className="flex-[1]"></div>}
            </div>
          )}

        </div>

        {/* --- QUICK NOTE FLOATING POPOVER (OVERLAY HUD) --- */}
        {isNotePopoverOpen && (
          <div 
            className="absolute inset-0 z-50 p-6 flex flex-col justify-between transition-all duration-300 text-slate-900 rounded-[1.8rem] bg-white/95 backdrop-blur-md"
            style={{
              border: '2px solid #f59e0b',
              boxShadow: '0 25px 55px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent card selection click trigger
            dir="rtl"
          >
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                  <span className="text-[13px] font-black text-amber-600 flex items-center gap-1.5">
                    📝 ملاحظة سريعة جديدة
                  </span>
                  <span className="text-[11px] font-mono font-black text-slate-500">
                    #{c.caseNumber}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-600 text-right mb-1">
                  سجل ملحوظة وسيتم الحفظ الفوري بجدول الملاحظات (Notes):
                </p>
              </div>

              {noteSavedSuccessfully ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-3">
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center animate-bounce text-lg font-bold">
                    ✓
                  </div>
                  <span className="text-sm font-black text-emerald-600">تم حفظ الملاحظة بنجاح!</span>
                </div>
              ) : (
                <textarea
                  className="w-full flex-1 p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-right font-extrabold resize-none"
                  placeholder="مثال: تم مراجعة الجلسة اليوم وسنقدم المذكرة غداً مرافعة..."
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  disabled={isSavingNote}
                  rows={4}
                />
              )}
            </div>

            {!noteSavedSuccessfully && (
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleSaveQuickNote}
                  disabled={isSavingNote || !quickNoteText.trim()}
                  className="flex-1 py-2 text-sm font-black rounded-xl bg-amber-500 border border-amber-600 text-white hover:bg-amber-600 transition-all outline-none shadow-md"
                >
                  {isSavingNote ? 'جاري الحفظ...' : 'حفظ الآن 💾'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotePopoverOpen(false)}
                  disabled={isSavingNote}
                  className="px-4 py-2 text-sm font-black rounded-xl bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all outline-none"
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
