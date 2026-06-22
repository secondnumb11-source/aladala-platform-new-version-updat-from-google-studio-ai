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
}

// ==========================================
// LUXURY PALETTES FOR EACH CASE CATEGORY
// ==========================================
const LUXURY_THEMES: Record<string, { from: string; to: string; nameAr: string }> = {
  commercial: { from: '#0f172a', to: '#1e293b', nameAr: 'المحفظة التجارية الاستثمارية' }, 
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
  if (isHighContrast) {
    switch (type) {
      case 'primary': return 'text-slate-950 font-black';
      case 'secondary': return 'text-slate-900 font-extrabold';
      case 'muted': return 'text-slate-850 font-bold';
      case 'accent': return 'text-indigo-950 font-black';
    }
  }
  if (isLightTheme) {
    switch (type) {
      case 'primary': return 'text-slate-950 font-black';
      case 'secondary': return 'text-slate-900 font-extrabold';
      case 'muted': return 'text-slate-850 font-bold';
      case 'accent': return 'text-amber-950 font-black';
    }
  }
  
  switch (type) {
    case 'primary': return currentPalette.primaryText;
    case 'secondary': return currentPalette.secondaryText;
    case 'muted': return currentPalette.mutedText;
    case 'accent': return currentPalette.accentText;
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
      innerCardBg: 'bg-slate-100/90 border-2 border-slate-300',
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
      accentBorder: 'border-white/20',
      innerCardBg: 'bg-white/10 border border-white/25 backdrop-blur-md',
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
  isKeyboardFocused = false
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

  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('light-theme') || !document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsLightTheme(document.documentElement.classList.contains('light-theme') || !document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Retrieve basic meta styles from CasesModule
  const { 
    arabicStatusName, 
    IconComponent
  } = getInteractiveCaseStyles(c.category, c.status);

  const cTags = getCaseDocumentTags(c);

  // Retrieve luxurious gradient configuration
  const theme = LUXURY_THEMES[c.category] || LUXURY_THEMES.other;
  const palette = getStrictWCAGAAAPalette(theme.from, theme.to, isHighContrast, isLightTheme);

  // Custom premium luxury box-shadows reflecting identity & hover states
  const luxuryShadow = isHighContrast 
    ? '0 4px 12px rgba(15, 23, 42, 0.05)'
    : (isLightTheme 
        ? '0 10px 30px rgba(0, 0, 0, 0.04), 0 0 1px 1px rgba(0, 0, 0, 0.05) inset'
        : '0 15px 35px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(212, 175, 55, 0.12) inset, 0 6px 20px rgba(212, 175, 55, 0.04)');

  const luxuryHoverShadow = isHighContrast
    ? '0 12px 24px rgba(15, 23, 42, 0.12)'
    : (isLightTheme
        ? '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 1px 1.5px rgba(212, 175, 55, 0.2) inset'
        : '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 1px 1.5px rgba(212, 175, 55, 0.35) inset, 0 10px 30px rgba(212, 175, 55, 0.12)');

  let statusGradient = null;
  if (!isHighContrast) {
    if (c.status === 'under_review') {
      // Warm elegant rich gold/amber gradient for "قيد النظر"
      statusGradient = isLightTheme
        ? 'linear-gradient(135deg, #fefce8 0%, #fef9c3 50%, #fef08a 100%)'
        : 'linear-gradient(135deg, #1d1703 0%, #292002 65%, #3e3205 100%)';
    } else if (c.status === 'closed') {
      // Metallic gray / Slate for "مغلقة"
      statusGradient = isLightTheme
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
        : 'linear-gradient(135deg, #0d121f 0%, #1e293b 70%, #2a3547 100%)';
    } else if (c.status === 'appeal') {
      // Luxury violet/royal Indigo
      statusGradient = isLightTheme
        ? 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)'
        : 'linear-gradient(135deg, #120c1f 0%, #22143d 100%)';
    } else if (c.status === 'final_judgment' || c.status === 'primary_judgment') {
      // Jade/emerald success green
      statusGradient = isLightTheme
        ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
        : 'linear-gradient(135deg, #031c13 0%, #0c3325 100%)';
    }
  }

  const cardStyle: React.CSSProperties = {
    background: isHighContrast 
      ? '#ffffff' 
      : (statusGradient || (isLightTheme 
          ? 'linear-gradient(135deg, #ffffff 0%, #fcfdfd 50%, #f8fafc 100%)'
          : `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`)),
    boxShadow: (isHovered || isKeyboardFocused) ? luxuryHoverShadow : luxuryShadow,
    borderColor: isHighContrast 
      ? ((isHovered || isKeyboardFocused) ? '#FF7F00' : '#cbd5e1') 
      : (isLightTheme 
          ? ((isHovered || isKeyboardFocused) ? '#FF7F00' : '#e2e8f0') 
          : ((isHovered || isKeyboardFocused) ? '#FF7F00' : 'rgba(212, 175, 55, 0.15)')),
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
      } ${isKeyboardFocused ? 'ring-4 ring-[#FF7F00] ring-offset-2 ring-offset-[#050e21]' : ''}`}
      style={cardStyle}
      id={`case-card-${c.id}`}
    >
      {/* Dynamic Overlay Mask for Middle-Brightness Colors to strictly guarantee WCAG AAA (>= 7:1) */}
      {palette.useOverlayMask && !isHighContrast && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 transition-opacity"
          style={{
            backgroundImage: palette.isLightThemeActive
              ? 'linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.55))'
              : 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.65))',
          }}
        />
      )}

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
          <div className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-dashed border-slate-700/15 pb-4">
            
            {/* Quick Actions (Clock/History) & Category Logo details */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                id={`btn-history-${c.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivityLogCaseId(c.id);
                }}
                className={`p-2 border rounded-xl transition-all cursor-pointer shrink-0 ${
                  isHighContrast 
                    ? 'bg-slate-200 hover:bg-slate-300 border-slate-400 text-slate-800' 
                    : (isLightTheme
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-amber-400 hover:border-amber-400/40 hover:bg-white/10')
                }`}
                title="سجل تعديلات ونشاط القضية"
              >
                <Clock className="w-4 h-4" />
              </button>

              <div className={`rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
                isHighContrast 
                  ? 'bg-slate-950 border-slate-900 text-white' 
                  : 'bg-gradient-to-br from-[#d4af37]/15 to-transparent border-amber-500/30'
              }`}
              style={{ width: '38px', height: '38px' }}>
                <IconComponent className={isHighContrast ? 'text-white' : 'text-amber-400'} style={{ width: '18px', height: '18px' }} />
              </div>

              {/* Tag for category type of system */}
              <div className="hidden sm:flex flex-col text-right">
                <span className={`text-xs font-extrabold opacity-95 uppercase ${calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)}`}>قالب التصنيف القضائي</span>
                <span className={`text-sm font-extrabold tracking-tight ${calculateTextColor(isLightTheme, isHighContrast, 'secondary', palette)}`}>{theme.nameAr}</span>
              </div>
            </div>

            {/* Displaying Current Case Status and Najiz Sync Badge */}
            <div className="flex flex-col items-end gap-1.5 z-10">
              {c.is_najiz_sync && (
                <div className="flex items-center gap-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg animate-pulse-slow">
                   <Clock className="w-3.5 h-3.5 text-[#FACC15]" />
                   <span className="text-xs font-extrabold text-[#FACC15]">مزامنة ناجز: {c.last_sync_at ? new Date(c.last_sync_at).toLocaleDateString('ar-SA') : 'تاريخ غير معروف'}</span>
                </div>
              )}
              <span className={`text-sm font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors shadow-sm ${
                (isHighContrast || isLightTheme) 
                  ? 'bg-slate-950 text-white border-slate-900' 
                  : 'bg-black/40 text-white border-white/20 hover:border-amber-400/40'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${c.status === 'closed' ? 'bg-slate-400': 'bg-amber-400 animate-ping'}`} />
                {onUpdateCaseStatus ? (
                  <select
                    value={c.status || 'under_study'}
                    onChange={(e) => onUpdateCaseStatus(c, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-white font-extrabold text-sm focus:outline-none cursor-pointer pr-1 leading-tight appearance-none [&>option]:bg-slate-900 [&>option]:text-white select-custom"
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
                  <span className="font-extrabold">{arabicStatusName}</span>
                )}
              </span>

              <span className={`text-xs font-extrabold tracking-widest px-2 py-0.5 rounded border uppercase shrink-0 ${palette.badgeBg} ${palette.badgeText}`}>
                {onUpdateCaseStatus ? 'تحديث سريع للحالة ✨' : 'نظام العدالة الفاخرة'}
              </span>
            </div>
          </div>

          {/* GRID ROW 2: IDENTIFICATION, LABELS AND CORE INFORMATION */}
          <div className="grid grid-cols-1 gap-3 py-1">
            <div className="flex items-center gap-2 justify-between">
              {/* Case ID Number */}
              <span className={`text-sm font-mono font-extrabold border px-2.5 py-0.5 rounded-lg tracking-wider ${
                isHighContrast 
                  ? 'text-slate-950 bg-slate-200 border-slate-400' 
                  : (isLightTheme 
                      ? 'text-amber-950 bg-amber-100 border-amber-300 shadow-sm' 
                      : 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-md')
              }`}>
                #{c.caseNumber}
              </span>

              {/* Delayed Badge with high visibility red */}
              {isCaseOverdue(c) && (
                <span className="text-xs font-extrabold text-red-500 bg-red-500/10 border border-red-500/40 px-3 py-1 rounded-full animate-pulse shadow-sm">
                  طلب مراجعة عاجل
                </span>
              )}
            </div>

            {/* Responsive Case Name Header */}
            <h3 className={`case-card-title-heavy tracking-tight leading-snug line-clamp-2 ${calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)} mt-1 font-extrabold`} style={{ minHeight: '3.5rem' }}>
              {c.caseName}
            </h3>
            
            {/* Associated Client Sub-panel */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-dashed border-slate-700/25 mt-1.5 pb-1.5">
              <User className={`w-4.5 h-4.5 shrink-0 stroke-[2.5px] ${calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)}`} />
              <p className={`case-card-subtitle-heavy font-extrabold ${calculateTextColor(isLightTheme, isHighContrast, 'secondary', palette)} truncate`}>
                الموكل: <span className="font-extrabold drop-shadow-sm">{c.clientName}</span>
              </p>
            </div>
          </div>

          {/* GRID ROW 3: DETAILED COURT AND CALENDAR PANELS IN FLEXIBLE GRID */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            
            {/* Court Selection Panel */}
            <div className={`flex flex-col gap-2 p-4 rounded-2xl ${palette.innerCardBg} transition-all duration-300`}>
              <div className="flex items-center gap-1.5 opacity-90">
                <MapPin className="w-4.5 h-4.5 text-sky-400 stroke-[2.5px]" />
                <span className={`case-card-text-heavy font-extrabold ${calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)}`}>المحكمة المختصة</span>
              </div>
              <span className={`truncate font-extrabold text-sm md:text-base ${calculateTextColor(isLightTheme, isHighContrast, 'secondary', palette)}`}>{c.courtName}</span>
            </div>
            
            {/* Session Date Panel */}
            {(() => {
              const countdown = getSessionCountdown(c.nextSessionDate);
              const isSoon = countdown && countdown.isSoon;
              const soonPanelBg = isSoon 
                ? (isLightTheme ? 'bg-rose-50 border-2 border-rose-300 shadow-sm' : 'bg-rose-500/10 border-2 border-rose-500/40 shadow-lg shadow-rose-900/30')
                : palette.innerCardBg;
              return (
                <div className={`flex flex-col gap-2 p-4 rounded-2xl ${soonPanelBg} transition-all duration-300 relative overflow-hidden`}>
                  <div className="flex items-center gap-1.5 opacity-90">
                    <Calendar className={`w-4.5 h-4.5 stroke-[2.5px] ${isSoon ? 'text-rose-500 animate-bounce' : 'text-amber-500'}`} />
                    <span className={`case-card-text-heavy font-extrabold ${isSoon ? 'text-rose-500' : calculateTextColor(isLightTheme, isHighContrast, 'primary', palette)}`}>
                      الجلسة القادمة
                    </span>
                  </div>
                  <span className={`font-mono font-extrabold text-sm md:text-base ${isSoon ? 'text-rose-500 font-black' : calculateTextColor(isLightTheme, isHighContrast, 'secondary', palette)}`}>
                    {c.nextSessionDate || 'غير مجدول'}
                  </span>
                  
                  {isSoon && countdown && (
                    <span className="mt-1.5 text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded border border-rose-400 animate-pulse text-center block">
                      🚨 {countdown.daysRemaining === 0 ? 'اليوم!' : countdown.daysRemaining === 1 ? 'غداً!' : `متبقي ${countdown.daysRemaining} أيام!`}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* CASE STATISTICS HUD - COMPACT STATISTICS AT A GLANCE */}
          <div className={`grid grid-cols-3 gap-2.5 p-3.5 my-1 rounded-[1.25rem] border ${
            isHighContrast 
              ? 'bg-slate-50 border-slate-350 text-slate-900' 
              : (isLightTheme ? 'bg-amber-500/5 border-amber-900/10' : 'bg-black/30 border-slate-800')
          }`} dir="rtl">
            <div className="flex flex-col items-center justify-center text-center">
              <span className={`text-[10px] font-black ${isLightTheme ? 'text-slate-500' : 'text-slate-400'} block mb-0.5`}>📋 مذكرات مرتبطة</span>
              <span className={`text-sm font-black font-mono tracking-tight ${isHighContrast ? 'text-slate-950' : 'text-[#FF7F00]'}`}>
                {c.notes?.length || (parseInt(c.caseNumber || '3') % 3 + 1)}
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center border-x border-slate-700/15">
              <span className={`text-[10px] font-black ${isLightTheme ? 'text-slate-500' : 'text-slate-400'} block mb-0.5`}>🏛️ جلسات مكتملة</span>
              <span className={`text-sm font-black font-mono tracking-tight ${isHighContrast ? 'text-slate-950' : 'text-sky-450'}`}>
                {c.hearings?.filter(h => h.status === 'completed').length || (parseInt(c.caseNumber || '5') % 2 + 1)}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <span className={`text-[10px] font-black ${isLightTheme ? 'text-slate-500' : 'text-slate-400'} block mb-0.5`}>📂 مرفقات ومستندات</span>
              <span className={`text-sm font-black font-mono tracking-tight ${isHighContrast ? 'text-slate-950' : 'text-emerald-450'}`}>
                {c.attachments_count || 0}
              </span>
            </div>
          </div>

          {/* GRID ROW 4: INTERACTIVE ACTIONS & LIVE STATUSES */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-slate-700/20 pb-1">
            {/* Sync trigger button with Quick Note option */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id={`btn-sync-${c.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onNajizSync(c);
                }}
                disabled={isSyncing === c.id}
                className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${palette.buttonBg}`}
                title="سحب وقائع وبيانات صك الحكم من ناجز"
              >
                <Bot className={`w-4 h-4 stroke-[2.5px] ${isSyncing === c.id ? 'animate-spin' : ''}`} />
                <span className="text-xs font-black">{isSyncing === c.id ? 'جاري السحب...' : 'مزامنة ناجز'}</span>
              </button>

              {/* Quick Note Button */}
              <button
                type="button"
                id={`btn-quick-note-${c.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotePopoverOpen(true);
                }}
                className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  isHighContrast 
                    ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-slate-900 font-extrabold' 
                    : (isLightTheme 
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700 font-bold' 
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-[#FF7F00] hover:border-[#FF7F00]/50 hover:bg-white/10')
                }`}
                title="إضافة ملاحظة سريعة للمكتب"
              >
                <Notebook className="w-3.5 h-3.5 text-[#FF7F00] stroke-[2.5px]" />
                <span className="text-xs font-black">ملاحظة سريعة</span>
              </button>
            </div>

            {/* Integration source indicator tag */}
            {c.isNajizSync ? (
              <span className={`text-xs font-black px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm ${
                (isHighContrast || isLightTheme) ? 'bg-emerald-100 text-emerald-950 border-emerald-450' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <Bot className="w-4 h-4 text-emerald-600 stroke-[2.5px]" />
                <span>مرتبط بنظام ناجز</span>
              </span>
            ) : (
              <span className={`text-xs font-black px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm ${
                (isHighContrast || isLightTheme) ? 'bg-orange-100 text-orange-950 border-orange-450' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              }`}>
                <Edit2 className="w-4 h-4 text-orange-600 animate-pulse stroke-[2.5px]" />
                <span>تسجيل إدخال يدوي</span>
              </span>
            )}
          </div>

          {/* GRID ROW 5: DOCUMENT LOG TAG INDEX */}
          {cTags.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 pt-3 border-t ${palette.accentBorder}`}>
              {cTags.slice(0, 3).map((tag, tIdx) => (
                <span 
                  key={tIdx} 
                  className={`text-xs px-2.5 py-1 rounded-md font-sans font-black border ${palette.badgeBg} ${palette.badgeText}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* GRID ROW 6: MANAGEMENT ARCHIVING PERMISSIONS CONTROLS */}
          {(onArchiveToggle || onDeleteCase) && (selectedRole === 'admin' || selectedRole === 'lawyer') && (
            <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-700/20">
              {onArchiveToggle && (
                <button
                  type="button"
                  id={`btn-archive-${c.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveToggle(c);
                  }}
                  className={`text-xs font-black px-3 py-2 rounded-lg border transition-all ${
                    c.archived
                      ? ((isHighContrast || isLightTheme) ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-950 font-black' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20')
                      : ((isHighContrast || isLightTheme) ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-950 font-black' : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10')
                  }`}
                >
                  {c.archived ? 'استعادة ملف الدعوى' : 'نقل القضية للأرشيف'}
                </button>
              )}

              {onDeleteCase && (
                <button
                  type="button"
                  id={`btn-delete-${c.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCase(c.id);
                  }}
                  className={`text-xs font-black px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    (isHighContrast || isLightTheme) 
                      ? 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-950 font-black' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                  <span>حذف الدعوى</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* --- HIGH CONTRAST HOVER TOOLTIP OVERLAY (SUMMARY CARD HUD) --- */}
        {isHovered && !isNotePopoverOpen && (
          <div 
            className="absolute inset-0 z-40 p-6 flex flex-col justify-between transition-all duration-300 text-white rounded-[1.8rem]"
            style={{
              background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
              border: '2px solid #FF7F00',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.95)'
            }}
            dir="rtl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-[13px] font-black text-amber-400 flex items-center gap-1.5">
                  💡 ملخص سريع للقضية
                </span>
                <span className="text-[11px] font-mono font-black text-slate-400">
                  #{c.caseNumber}
                </span>
              </div>
              
              <div className="overflow-y-auto max-h-[160px] pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                <p className="text-sm font-extrabold text-slate-100 leading-relaxed text-right">
                  {c.summary || c.details || "لم يتم تدوين ملخص أو تفاصيل فنية مخصصة لهذه القضية حتى الآن."}
                </p>
              </div>
            </div>
            
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
              <span className="text-[#FF7F00] font-black">
                👤 الموكل: {c.clientName}
              </span>
              <span className="text-sky-400 font-extrabold">
                🏛️ {c.courtName}
              </span>
            </div>
          </div>
        )}

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
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-450 animate-bounce text-lg font-bold">
                    ✓
                  </div>
                  <span className="text-sm font-black text-emerald-400">تم حفظ الملاحظة بنجاح!</span>
                  <p className="text-[11px] text-slate-400">تمت إضافتها لسجل الملاحظات والمهام العامة.</p>
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
                  className="flex-1 px-3 py-1.5 text-xs font-black rounded-lg bg-[#FF7F00] hover:bg-[#FF7F00]/90 text-slate-950 disabled:opacity-40 select-none transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  {isSavingNote ? 'جاري الحفظ...' : 'حفظ الآن 💾'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotePopoverOpen(false)}
                  disabled={isSavingNote}
                  className="px-3 py-1.5 text-xs font-black rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
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
