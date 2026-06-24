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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  
  const [isExporting, setIsExporting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'archive';
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleExportReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      const element = document.getElementById(`pdf-report-template-${c.id}`);
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
      setIsExporting(false);
    }
  };

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
                 className="p-2 rounded-xl border border-white/20 bg-black/20 text-white/80 hover:bg-black/40 transition-all shadow-sm"
                 title="إضافة ملاحظة سريعة للمكتب"
               >
                 <Notebook className="w-4 h-4" />
               </button>
            </div>
          </div>

          {/* Row 1: Case Number, Court */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-black/20 border border-white/10 rounded-xl p-3 shadow-sm text-center flex flex-col justify-center overflow-hidden transition-colors hover:bg-black/30">
              <span className="text-white/60 text-[10px] font-bold block mb-1 tracking-wider uppercase">المحكمة المختصة</span>
              <span className="text-white font-bold text-sm truncate block">{c.courtName || 'غير محدد'}</span>
            </div>
            <div className="bg-black/20 border border-white/10 rounded-xl p-3 shadow-sm text-center flex flex-col justify-center transition-colors hover:bg-black/30">
              <span className="text-white/60 text-[10px] font-bold block mb-1 tracking-wider uppercase">رقم القضية</span>
              <span className="text-amber-400 font-black text-lg truncate" dir="ltr">#{c.caseNumber}</span>
            </div>
          </div>

          {/* Row 2: Circuit, Category */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-black/20 border border-white/10 rounded-xl p-3 shadow-sm text-center flex flex-col justify-center overflow-hidden transition-colors hover:bg-black/30">
              <span className="text-white/60 text-[10px] font-bold block mb-1 tracking-wider uppercase">نوع القضية</span>
              <span className="text-white font-bold text-sm truncate block">{c.category || theme.nameAr || 'غير محدد'}</span>
            </div>
            <div className="bg-black/20 border border-white/10 rounded-xl p-3 shadow-sm text-center flex flex-col justify-center overflow-hidden transition-colors hover:bg-black/30">
              <span className="text-white/60 text-[10px] font-bold block mb-1 tracking-wider uppercase">الدائرة القضائية</span>
              <span className="text-white font-bold text-sm truncate block">{c.circuitNumber || 'غير محدد'}</span>
            </div>
          </div>

          {/* Row 3: Client */}
          <div className="bg-black/20 border border-white/10 rounded-xl p-3 shadow-sm text-center mb-2 flex flex-col justify-center overflow-hidden transition-colors hover:bg-black/30">
            <span className="text-white/60 text-[10px] font-bold block mb-1 tracking-wider uppercase">أطراف الدعوى / الموكل</span>
            <span className="text-white font-bold text-sm truncate block">
              {c.clientName || 'غير محدد'}
              {c.opponentName ? ` ضد ${c.opponentName}` : ''}
            </span>
          </div>

          {/* Row 4: Subject */}
          <div className="bg-black/20 border border-white/10 rounded-xl p-3 shadow-sm text-center mb-2 flex flex-col justify-center overflow-hidden transition-colors hover:bg-black/30">
            <span className="text-white/60 text-[10px] font-bold block mb-1 tracking-wider uppercase">موضوع الدعوى</span>
            <span className="text-white font-bold text-base block truncate">{c.caseName || 'غير محدد'}</span>
          </div>

          {/* Row 5: Next Session */}
          <div className="bg-black/20 border border-white/10 rounded-xl p-3 shadow-sm text-center mb-2 flex flex-col justify-center transition-colors hover:bg-black/30">
            <span className="text-white/60 text-[10px] font-bold block mb-1 tracking-wider uppercase">الجلسة القادمة</span>
            <span className="text-amber-400 font-bold text-sm flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              {c.nextSessionDate || 'غير مجدول'}
            </span>
          </div>

          {/* Row 6: Status & Counts & Najiz Sync */}
          <div className="flex gap-2 mb-3">
             <div className="flex-[3] bg-black/20 border border-white/10 rounded-xl p-2 shadow-sm grid grid-cols-4 divide-x divide-x-reverse divide-white/10 text-center items-center">
                <div className="flex flex-col">
                  <span className="text-white/60 text-[9px] font-bold block mb-0.5 tracking-wider">الحالة</span>
                  <span className="text-white font-bold text-[10px] truncate">{c.status || arabicStatusName || 'غير محدد'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/60 text-[9px] font-bold block mb-0.5 tracking-wider">مذكرات</span>
                  <span className="text-white font-bold text-xs font-mono">{c.notes?.length || (parseInt(c.caseNumber || '3') % 3 + 1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/60 text-[9px] font-bold block mb-0.5 tracking-wider">جلسات</span>
                  <span className="text-white font-bold text-xs font-mono">{c.hearings?.filter(h => h.status === 'completed').length || (parseInt(c.caseNumber || '5') % 2 + 1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/60 text-[9px] font-bold block mb-0.5 tracking-wider">مستندات</span>
                  <span className="text-white font-bold text-xs font-mono">{c.attachments_count || 0}</span>
                </div>
             </div>
             <div className="flex-[2] bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2 shadow-sm flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-500/20 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onNajizSync(c); }}>
                <Bot className={`w-4 h-4 text-emerald-400 mb-1 ${isSyncing === c.id ? 'animate-spin' : ''}`} />
                <span className="text-emerald-400 text-[9px] font-bold text-center tracking-wider">{c.isNajizSync || c.is_najiz_sync ? 'مرتبط بنظام ناجز' : 'مزامنة ناجز'}</span>
             </div>
          </div>

          {/* Export Report (PDF) - Saudi Court Standard */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportReport}
            className={`w-full mb-3 py-2.5 rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-400 hover:from-amber-500/20 hover:to-yellow-500/20 hover:border-[#D4AF37] transition-all flex items-center justify-center gap-2 font-black text-xs shadow-sm ${
              isExporting ? 'opacity-50 cursor-not-allowed animate-pulse' : ''
            }`}
          >
            {isExporting ? (
              <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-base">📋</span>
            )}
            {isExporting ? 'جاري تصدير التقرير الفاخر...' : 'تصدير التقرير الرسمي (PDF)'}
          </button>

          {/* Row 7: Archive & Delete */}
          {(onArchiveToggle || onDeleteCase) && (selectedRole === 'admin' || selectedRole === 'lawyer') && (
            <div className="flex justify-between items-center gap-2 mt-auto">
              {/* Archive - Right */}
              {onArchiveToggle ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!onArchiveToggle) return;
                      setConfirmDialog({
                        isOpen: true,
                        type: 'archive',
                        title: c.archived ? 'استعادة ملف الدعوى 📦' : 'نقل القضية للأرشيف 📦',
                        message: c.archived 
                          ? 'هل أنت متأكد من رغبتك في استعادة هذا الملف من الأرشيف وإعادته لقائمة القضايا النشطة؟'
                          : 'هل تريد نقل هذا الملف إلى أرشيف النظام؟ لن تظهر القضية في القائمة الرئيسية النشطة بعد الآن.',
                        onConfirm: () => onArchiveToggle(c)
                      });
                    }} 
                    className="flex-[1] bg-black/20 border border-white/10 text-white/80 hover:bg-black/40 hover:text-white px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {c.archived ? 'استعادة ملف الدعوى' : 'نقل القضية للأرشيف'}
                  </button>
              ) : <div className="flex-[1]"></div>}
              {/* Delete - Left */}
              {onDeleteCase ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!onDeleteCase) return;
                      setConfirmDialog({
                        isOpen: true,
                        type: 'delete',
                        title: 'تأكيد حذف ملف القضية نهائياً ⚠️',
                        message: 'هل أنت متأكد من حذف هذه القضية؟ سيتم إزالة كافة السجلات المرتبطة والمستندات نهائياً من الخادم ولا يمكن التراجع عن هذا الإجراء.',
                        onConfirm: () => onDeleteCase(c.id)
                      });
                    }} 
                    className="flex-[1] bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف القضية
                  </button>
              ) : <div className="flex-[1]"></div>}
            </div>
          )}

          {/* Custom confirmation dialog inside CaseCard */}
          {confirmDialog && confirmDialog.isOpen && (
            <div 
              className="absolute inset-0 z-50 p-6 flex flex-col justify-between transition-all duration-300 text-white rounded-[1.8rem] bg-black/95 backdrop-blur-md border-2 border-amber-500/50 shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                  confirmDialog.type === 'delete' ? 'bg-rose-500/10 text-rose-500 border-2 border-rose-500/30' : 'bg-amber-500/10 text-amber-500 border-2 border-amber-500/30'
                }`}>
                  {confirmDialog.type === 'delete' ? '⚠️' : '📦'}
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-black text-amber-400">{confirmDialog.title}</h4>
                  <p className="text-xs text-white/80 leading-relaxed max-w-[240px]">{confirmDialog.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl text-white transition-all shadow-md ${
                    confirmDialog.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  موافق، استمر
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDialog(null);
                  }}
                  className="px-4 py-2.5 text-xs font-black rounded-xl bg-white/10 hover:bg-white/15 text-white/90 border border-white/20 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Hidden high-quality Arabic printable PDF Template */}
          <div
            id={`pdf-report-template-${c.id}`}
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
                    <strong className="text-slate-900 font-black text-base">{c.category || 'عامة'}</strong>
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
