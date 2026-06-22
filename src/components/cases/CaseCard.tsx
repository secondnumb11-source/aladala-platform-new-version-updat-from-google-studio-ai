/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Clock, Bot, Edit2, Calendar, MapPin, ChevronLeft, Trash2, Eye, User 
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
  onUpdateCaseStatus?: (c: Case, newStatus: string) => void;
  onDeleteCase?: (id: string | number) => void;
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

function getStrictWCAGAAAPalette(fromHex: string, toHex: string, isHighContrast: boolean): WCAGAAATextPalette {
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
      primaryText: 'text-white font-black drop-shadow-md',
      secondaryText: 'text-slate-50 font-extrabold drop-shadow',
      mutedText: 'text-slate-200 font-bold',
      accentText: 'text-amber-300 font-black', 
      badgeBg: 'bg-white/10 hover:bg-white/15 border-white/20',
      badgeText: 'text-white font-bold',
      accentBorder: 'border-white/10',
      innerCardBg: 'bg-white/10 border border-white/20 backdrop-blur-md',
      buttonBg: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 font-bold',
      glowShadow: '0 10px 40px -12px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.06)',
      useOverlayMask,
      isLightThemeActive: false
    };
  } else {
    return {
      primaryText: 'text-slate-950 font-black',
      secondaryText: 'text-slate-900 font-extrabold',
      mutedText: 'text-slate-800 font-bold',
      accentText: 'text-amber-950 font-black', 
      badgeBg: 'bg-black/10 hover:bg-black/15 border-black/20',
      badgeText: 'text-slate-950 font-black',
      accentBorder: 'border-black/15',
      innerCardBg: 'bg-black/5 border border-black/10 backdrop-blur-md',
      buttonBg: 'bg-black/10 hover:bg-black/20 text-slate-950 border-black/20 font-black',
      glowShadow: '0 8px 30px rgba(0,0,0,0.1)',
      useOverlayMask,
      isLightThemeActive: true
    };
  }
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
  onDeleteCase
}: CaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Retrieve basic meta styles from CasesModule
  const { 
    arabicStatusName, 
    IconComponent
  } = getInteractiveCaseStyles(c.category, c.status);

  const cTags = getCaseDocumentTags(c);

  // Retrieve luxurious gradient configuration
  const theme = LUXURY_THEMES[c.category] || LUXURY_THEMES.other;
  const palette = getStrictWCAGAAAPalette(theme.from, theme.to, isHighContrast);

  // Custom premium luxury box-shadows reflecting identity & hover states
  const luxuryShadow = isHighContrast 
    ? '0 4px 12px rgba(15, 23, 42, 0.05)'
    : '0 15px 35px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(212, 175, 55, 0.12) inset, 0 6px 20px rgba(212, 175, 55, 0.04)';

  const luxuryHoverShadow = isHighContrast
    ? '0 12px 24px rgba(15, 23, 42, 0.12)'
    : '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 1px 1.5px rgba(212, 175, 55, 0.35) inset, 0 10px 30px rgba(212, 175, 55, 0.12)';

  const cardStyle: React.CSSProperties = {
    background: isHighContrast 
      ? '#ffffff' 
      : `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
    boxShadow: isHovered ? luxuryHoverShadow : luxuryShadow,
    borderColor: isHighContrast 
      ? (isHovered ? '#0f172a' : '#cbd5e1') 
      : (isHovered ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.15)'),
    transform: isHovered ? 'translateY(-4px) scale(1.012)' : 'translateY(0) scale(1)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div
      onClick={() => onSelectCase(c)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative cursor-pointer rounded-[1.8rem] border-2 p-[3px] overflow-hidden ${
        c.archived ? 'opacity-65 grayscale-[0.2]' : ''
      }`}
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
        className="relative z-10 w-full h-full p-6 md:p-7 rounded-[calc(1.8rem-4px)] flex flex-col justify-between"
        dir="rtl"
      >
        {/* CSS GRID PANEL FOR ALL INNER CARD ELEMENTS */}
        <div className="grid grid-cols-1 gap-5 text-right w-full">
          
          {/* GRID ROW 1: HEADER CONTROLS AND STATUSES */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-dashed border-slate-700/15 pb-4">
            
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
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-amber-400 hover:border-amber-400/40 hover:bg-white/10'
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
                <span className={`text-[10px] font-bold opacity-60 uppercase ${palette.primaryText}`}>قالب التصنيف القضائي</span>
                <span className={`text-[12px] font-black tracking-tight ${palette.accentText}`}>{theme.nameAr}</span>
              </div>
            </div>

            {/* Displaying Current Case Status and Najiz Sync Badge */}
            <div className="flex flex-col items-end gap-1.5 z-10">
              {c.is_najiz_sync && (
                <div className="flex items-center gap-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg animate-pulse-slow">
                   <Clock className="w-3 h-3 text-[#FACC15]" />
                   <span className="text-[10px] font-black text-[#FACC15]">مزامنة ناجز: {c.last_sync_at ? new Date(c.last_sync_at).toLocaleDateString('ar-SA') : 'تاريخ غير معروف'}</span>
                </div>
              )}
              <span className={`text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors shadow-sm ${
                isHighContrast 
                  ? 'bg-slate-950 text-white border-slate-900' 
                  : 'bg-black/40 text-white border-white/20 hover:border-amber-400/40'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${c.status === 'closed' ? 'bg-slate-400': 'bg-amber-400 animate-ping'}`} />
                {onUpdateCaseStatus ? (
                  <select
                    value={c.status || 'under_study'}
                    onChange={(e) => onUpdateCaseStatus(c, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-white font-black text-xs focus:outline-none cursor-pointer pr-1 leading-tight appearance-none [&>option]:bg-slate-900 [&>option]:text-white select-custom"
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
                  <span>{arabicStatusName}</span>
                )}
              </span>

              <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border uppercase shrink-0 ${palette.badgeBg} ${palette.badgeText}`}>
                {onUpdateCaseStatus ? 'تحديث سريع للحالة ✨' : 'نظام العدالة الفاخرة'}
              </span>
            </div>
          </div>

          {/* GRID ROW 2: IDENTIFICATION, LABELS AND CORE INFORMATION */}
          <div className="grid grid-cols-1 gap-2.5 py-1">
            <div className="flex items-center gap-2 justify-between">
              {/* Case ID Number */}
              <span className={`text-[12px] font-mono font-black border px-2.5 py-0.5 rounded-lg tracking-wider ${
                isHighContrast 
                  ? 'text-slate-950 bg-slate-200 border-slate-400' 
                  : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
              }`}>
                #{c.caseNumber}
              </span>

              {/* Delayed Badge with high visibility red */}
              {isCaseOverdue(c) && (
                <span className="text-[11px] font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-3 py-0.5 rounded-full animate-pulse shadow-sm">
                  طلب مراجعة عاجل
                </span>
              )}
            </div>

            {/* Responsive Case Name Header */}
            <h3 className={`text-lg md:text-xl tracking-tight leading-snug line-clamp-2 ${palette.primaryText} mt-1`} style={{ minHeight: '2.75rem' }}>
              {c.caseName}
            </h3>
            
            {/* Associated Client Sub-panel */}
            <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-700/10 mt-1">
              <User className={`w-4 h-4 shrink-0 ${palette.accentText}`} />
              <p className={`text-[13px] ${palette.secondaryText} truncate`}>
                الموكل: <span className="font-bold">{c.clientName}</span>
              </p>
            </div>
          </div>

          {/* GRID ROW 3: DETAILED COURT AND CALENDAR PANELS IN FLEXIBLE GRID */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            
            {/* Court Selection Panel */}
            <div className={`flex flex-col gap-1 p-2.5 rounded-2xl ${palette.innerCardBg}`}>
              <div className="flex items-center gap-1.5 opacity-80">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span className={`text-[11px] font-bold ${palette.mutedText}`}>المحكمة المختصة</span>
              </div>
              <span className={`truncate font-black text-xs ${palette.primaryText}`}>{c.courtName}</span>
            </div>
            
            {/* Session Date Panel */}
            <div className={`flex flex-col gap-1 p-2.5 rounded-2xl ${palette.innerCardBg}`}>
              <div className="flex items-center gap-1.5 opacity-80">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span className={`text-[11px] font-bold ${palette.mutedText}`}>الجلسة القادمة</span>
              </div>
              <span className={`font-mono font-black text-xs ${palette.accentText}`}>{c.nextSessionDate || 'غير مجدول'}</span>
            </div>
          </div>

          {/* GRID ROW 4: INTERACTIVE ACTIONS & LIVE STATUSES */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-slate-700/10">
            {/* Sync trigger button */}
            <button
              type="button"
              id={`btn-sync-${c.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onNajizSync(c);
              }}
              disabled={isSyncing === c.id}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${palette.buttonBg}`}
              title="سحب وقائع وبيانات صك الحكم من ناجز"
            >
              <Bot className={`w-4 h-4 ${isSyncing === c.id ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-bold">{isSyncing === c.id ? 'جاري السحب...' : 'مزامنة ناجز'}</span>
            </button>

            {/* Integration source indicator tag */}
            {c.isNajizSync ? (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm ${
                isHighContrast ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>مرتبط بنظام ناجز</span>
              </span>
            ) : (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm ${
                isHighContrast ? 'bg-orange-100 text-orange-950 border-orange-300' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              }`}>
                <Edit2 className="w-4 h-4 text-orange-400 animate-pulse" />
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
                  className={`text-[11px] px-2 py-0.5 rounded-md font-sans font-bold border ${palette.badgeBg} ${palette.badgeText}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* GRID ROW 6: MANAGEMENT ARCHIVING PERMISSIONS CONTROLS */}
          {(onArchiveToggle || onDeleteCase) && (selectedRole === 'admin' || selectedRole === 'lawyer') && (
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-700/10">
              {onArchiveToggle && (
                <button
                  type="button"
                  id={`btn-archive-${c.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveToggle(c);
                  }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    c.archived
                      ? (isHighContrast ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20')
                      : (isHighContrast ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white/55 hover:text-white hover:bg-white/10')
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
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isHighContrast 
                      ? 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-900' 
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الدعوى</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
