/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, Bot, Edit2, Calendar, MapPin, ChevronLeft, Trash2, Eye, User, Notebook, Plus, Download, Gavel
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
  commercial: { from: '#1f2937', to: '#111827', nameAr: 'التجارية' }, 
  labor: { from: '#064e3b', to: '#022c22', nameAr: 'العمالية' },         
  civil: { from: '#1e3a8a', to: '#0f172a', nameAr: 'المدنية' },    
  criminal: { from: '#7f1d1d', to: '#450a0a', nameAr: 'الجزائية' }, 
  personal_status: { from: '#713f12', to: '#422006', nameAr: 'الأحوال الشخصية' }, 
  administrative: { from: '#451a03', to: '#291304', nameAr: 'الإدارية' }, 
  financial: { from: '#831843', to: '#4a044e', nameAr: 'المالية' },    
  execution: { from: '#831843', to: '#4a044e', nameAr: 'المالية' },    
  archived: { from: '#4b5563', to: '#374151', nameAr: 'مؤرشفة' }, 
  other: { from: '#1f2937', to: '#111827', nameAr: 'أخرى' },       
};

// ==========================================
// COLOR MATH FOR DYNAMIC CONTRAST & WCAG AAA
// ==========================================
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = new RegExp('^#?([a-f\\d])([a-f\\d])([a-f\\d])$', 'i');
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const fullHexRegex = new RegExp('^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$', 'i');
  const result = fullHexRegex.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const inv255 = Math.pow(255, -1);
  const [rs, gs, bs] = [r, g, b].map(val => {
    const v = val * inv255;
    return v <= 0.03928 ? v * Math.pow(12.92, -1) : Math.pow((v + 0.055) * Math.pow(1.055, -1), 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) * Math.pow(darker + 0.05, -1);
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

export function calculateTextColor(isLightTheme: boolean, isHighContrast: boolean, type: 'primary' | 'secondary' | 'muted' | 'accent', currentPalette: WCAGAAATextPalette): string {
  switch (type) {
    case 'primary': return 'text-white font-[900] text-xl [text-shadow:_1px_1px_0_rgba(0,0,0,0.4),_-1px_-1px_0_rgba(0,0,0,0.4),_1px_-1px_0_rgba(0,0,0,0.4),_-1px_1px_0_rgba(0,0,0,0.4)]';
    case 'secondary': return 'text-amber-400 font-[900] text-lg [text-shadow:_1px_1px_0_rgba(0,0,0,0.2),_-1px_-1px_0_rgba(0,0,0,0.2),_1px_-1px_0_rgba(0,0,0,0.2),_-1px_1px_0_rgba(0,0,0,0.2)]';
    case 'muted': return 'text-orange-400 font-[800] text-base';
    case 'accent': return 'text-[#FF7F00] font-[900] text-xl [text-shadow:_1px_1px_0_rgba(0,0,0,0.3),_-1px_-1px_0_rgba(0,0,0,0.3),_1px_-1px_0_rgba(0,0,0,0.3),_-1px_1px_0_rgba(0,0,0,0.3)]';
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
      innerCardBg: 'bg-slate-900 bg-opacity-90 border-2 border-[#f59e0b]',
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
      badgeBg: 'bg-slate-200 bg-opacity-80 hover:bg-slate-200 border-slate-400 border-2',
      badgeText: 'text-slate-950 font-black',
      accentBorder: 'border-slate-300',
      innerCardBg: 'bg-slate-100 bg-opacity-95 border-2 border-slate-200 border-opacity-90 shadow-sm',
      buttonBg: 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-600 border-opacity-40 font-black border',
      glowShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
      useOverlayMask: false,
      isLightThemeActive: true
    };
  }

  const fromRgb = hexToRgb(fromHex) || { r: 15, g: 23, b: 42 };
  const toRgb = hexToRgb(toHex) || { r: 2, g: 6, b: 23 };

  const lFrom = getRelativeLuminance(fromRgb.r, fromRgb.g, fromRgb.b);
  const lTo = getRelativeLuminance(toRgb.r, toRgb.g, toRgb.b);
  const lAvg = (lFrom + lTo) * 0.5;

  const contrastWithLight = getContrastRatio(1.0, lAvg);
  const contrastWithDark = getContrastRatio(0.005, lAvg);

  const useLightText = contrastWithLight >= contrastWithDark || contrastWithLight >= 4.5;
  const maxContrast = Math.max(contrastWithLight, contrastWithDark);
  const useOverlayMask = maxContrast < 7.0; 

  if (useLightText) {
    return {
      primaryText: 'text-white font-black [text-shadow:_1px_1px_0_rgba(0,0,0,0.8),_-1px_-1px_0_rgba(0,0,0,0.8),_1px_-1px_0_rgba(0,0,0,0.8),_-1px_1px_0_rgba(0,0,0,0.8)]',
      secondaryText: 'text-slate-100 font-extrabold [text-shadow:_1px_1px_0_rgba(0,0,0,0.4),_-1px_-1px_0_rgba(0,0,0,0.4),_1px_-1px_0_rgba(0,0,0,0.4),_-1px_1px_0_rgba(0,0,0,0.4)]',
      mutedText: 'text-slate-300 font-bold',
      accentText: 'text-amber-400 font-black [text-shadow:_1px_1px_0_rgba(0,0,0,0.6),_-1px_-1px_0_rgba(0,0,0,0.6),_1px_-1px_0_rgba(0,0,0,0.6),_-1px_1px_0_rgba(0,0,0,0.6)]', 
      badgeBg: 'bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-15 border-white border-opacity-30',
      badgeText: 'text-white font-black',
      accentBorder: 'border-[#f59e0b] border-opacity-50',
      innerCardBg: 'bg-slate-900 bg-opacity-50 border border-[#f59e0b] border-opacity-30 backdrop-blur-md',
      buttonBg: 'bg-amber-500 bg-opacity-20 hover:bg-amber-500 hover:bg-opacity-30 text-amber-300 border-amber-500 border-opacity-50 font-black',
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
      badgeBg: 'bg-black bg-opacity-10 hover:bg-black hover:bg-opacity-15 border-black border-opacity-30',
      badgeText: 'text-black font-black',
      accentBorder: 'border-black border-opacity-20',
      innerCardBg: 'bg-black bg-opacity-5 border border-black border-opacity-15 backdrop-blur-md',
      buttonBg: 'bg-black bg-opacity-10 hover:bg-black hover:bg-opacity-20 text-black border-black border-opacity-30 font-black',
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
      const parts = dateStr.match(new RegExp('(\\d+)[\\-/.](\\d+)[\\-/.](\\d+)'));
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
    const invDayMs = Math.pow(1000 * 60 * 60 * 24, -1);
    const diffDays = Math.ceil(diffTime * invDayMs);

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

interface CardThemeConfig {
  bg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  innerCardBg: string;
  badgeBg: string;
  badgeText: string;
  accentText: string;
  accentBorder: string;
  glowShadow: string;
  tagBg: string;
  tagText: string;
}

export function getLuxuryCardTheme(category: string, isDark: boolean): CardThemeConfig {
  if (isDark) {
    switch (category) {
      case 'commercial':
        return {
          bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: 'border-[#D4AF37] border-opacity-35',
          textPrimary: 'text-amber-100 font-extrabold',
          textSecondary: 'text-slate-300 font-bold',
          textMuted: 'text-slate-400 font-medium',
          innerCardBg: 'bg-slate-950 bg-opacity-60 border border-[#D4AF37] border-opacity-20',
          badgeBg: 'bg-amber-50 bg-opacity-15 border border-[#D4AF37] border-opacity-30',
          badgeText: 'text-amber-300 font-black',
          accentText: 'text-amber-400 font-black',
          accentBorder: 'border-amber-500 border-opacity-40',
          glowShadow: 'rgba(212, 175, 55, 0.15)',
          tagBg: 'bg-slate-900 bg-opacity-80 border border-slate-700 border-opacity-50',
          tagText: 'text-slate-300'
        };
      case 'labor':
        return {
          bg: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
          border: 'border-emerald-500 border-opacity-35',
          textPrimary: 'text-emerald-100 font-extrabold',
          textSecondary: 'text-slate-300 font-bold',
          textMuted: 'text-emerald-300 border-opacity-70 font-medium',
          innerCardBg: 'bg-emerald-950 bg-opacity-60 border border-emerald-500 border-opacity-20',
          badgeBg: 'bg-emerald-500 bg-opacity-15 border border-emerald-500 border-opacity-30',
          badgeText: 'text-emerald-300 font-black',
          accentText: 'text-emerald-400 font-black',
          accentBorder: 'border-emerald-500 border-opacity-40',
          glowShadow: 'rgba(16, 185, 129, 0.15)',
          tagBg: 'bg-emerald-950 bg-opacity-80 border border-emerald-900 border-opacity-50',
          tagText: 'text-emerald-300'
        };
      case 'civil':
        return {
          bg: 'linear-gradient(135deg, #0B1A33 0%, #1e3a8a 100%)',
          border: 'border-blue-400 border-opacity-35',
          textPrimary: 'text-blue-50 font-extrabold',
          textSecondary: 'text-slate-300 font-bold',
          textMuted: 'text-blue-300 border-opacity-70 font-medium',
          innerCardBg: 'bg-slate-950 bg-opacity-60 border border-blue-500 border-opacity-20',
          badgeBg: 'bg-blue-500 bg-opacity-15 border border-blue-500 border-opacity-30',
          badgeText: 'text-blue-300 font-black',
          accentText: 'text-blue-400 font-black',
          accentBorder: 'border-blue-500 border-opacity-40',
          glowShadow: 'rgba(59, 130, 246, 0.15)',
          tagBg: 'bg-slate-900 bg-opacity-80 border border-slate-700 border-opacity-50',
          tagText: 'text-blue-300'
        };
      case 'criminal':
        return {
          bg: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
          border: 'border-rose-500 border-opacity-35',
          textPrimary: 'text-rose-100 font-extrabold',
          textSecondary: 'text-slate-300 font-bold',
          textMuted: 'text-rose-300 border-opacity-70 font-medium',
          innerCardBg: 'bg-rose-950 bg-opacity-60 border border-rose-500 border-opacity-20',
          badgeBg: 'bg-rose-500 bg-opacity-15 border border-rose-500 border-opacity-30',
          badgeText: 'text-rose-300 font-black',
          accentText: 'text-rose-400 font-black',
          accentBorder: 'border-rose-500 border-opacity-40',
          glowShadow: 'rgba(239, 68, 68, 0.15)',
          tagBg: 'bg-rose-950 bg-opacity-80 border border-rose-900 border-opacity-50',
          tagText: 'text-rose-300'
        };
      case 'personal_status':
        return {
          bg: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)',
          border: 'border-purple-500 border-opacity-35',
          textPrimary: 'text-purple-100 font-extrabold',
          textSecondary: 'text-slate-300 font-bold',
          textMuted: 'text-purple-300 border-opacity-70 font-medium',
          innerCardBg: 'bg-purple-950 bg-opacity-60 border border-purple-500 border-opacity-20',
          badgeBg: 'bg-purple-500 bg-opacity-15 border border-purple-500 border-opacity-30',
          badgeText: 'text-purple-300 font-black',
          accentText: 'text-purple-400 font-black',
          accentBorder: 'border-purple-500 border-opacity-40',
          glowShadow: 'rgba(168, 85, 247, 0.15)',
          tagBg: 'bg-purple-950 bg-opacity-80 border border-purple-900 border-opacity-50',
          tagText: 'text-purple-300'
        };
      case 'administrative':
        return {
          bg: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
          border: 'border-stone-500 border-opacity-35',
          textPrimary: 'text-stone-100 font-extrabold',
          textSecondary: 'text-slate-300 font-bold',
          textMuted: 'text-stone-300 border-opacity-70 font-medium',
          innerCardBg: 'bg-stone-950 bg-opacity-60 border border-stone-500 border-opacity-20',
          badgeBg: 'bg-stone-500 bg-opacity-15 border border-stone-500 border-opacity-30',
          badgeText: 'text-stone-300 font-black',
          accentText: 'text-stone-400 font-black',
          accentBorder: 'border-stone-500 border-opacity-40',
          glowShadow: 'rgba(120, 113, 108, 0.15)',
          tagBg: 'bg-stone-900 bg-opacity-80 border border-stone-700 border-opacity-50',
          tagText: 'text-stone-300'
        };
      case 'execution':
        return {
          bg: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
          border: 'border-amber-500 border-opacity-35',
          textPrimary: 'text-amber-100 font-extrabold',
          textSecondary: 'text-slate-300 font-bold',
          textMuted: 'text-amber-300 border-opacity-70 font-medium',
          innerCardBg: 'bg-amber-950 bg-opacity-60 border border-amber-500 border-opacity-20',
          badgeBg: 'bg-amber-500 bg-opacity-15 border border-amber-500 border-opacity-30',
          badgeText: 'text-amber-300 font-black',
          accentText: 'text-amber-400 font-black',
          accentBorder: 'border-amber-500 border-opacity-40',
          glowShadow: 'rgba(245, 158, 11, 0.15)',
          tagBg: 'bg-amber-950 bg-opacity-80 border border-amber-900 border-opacity-50',
          tagText: 'text-amber-300'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: 'border-slate-500 border-opacity-35',
          textPrimary: 'text-slate-100 font-extrabold',
          textSecondary: 'text-slate-300 font-bold',
          textMuted: 'text-slate-400 font-medium',
          innerCardBg: 'bg-slate-950 bg-opacity-60 border border-slate-500 border-opacity-20',
          badgeBg: 'bg-slate-500 bg-opacity-15 border border-slate-500 border-opacity-30',
          badgeText: 'text-slate-300 font-black',
          accentText: 'text-slate-400 font-black',
          accentBorder: 'border-slate-500 border-opacity-40',
          glowShadow: 'rgba(100, 116, 139, 0.15)',
          tagBg: 'bg-slate-900 bg-opacity-80 border border-slate-700 border-opacity-50',
          tagText: 'text-slate-300'
        };
    }
  } else {
    switch (category) {
      case 'commercial':
        return {
          bg: 'linear-gradient(135deg, #FCF9F2 0%, #F5EFE0 100%)',
          border: 'border-[#D4AF37] border-opacity-50',
          textPrimary: 'text-[#1c1917] font-black',
          textSecondary: 'text-[#44403c] font-extrabold',
          textMuted: 'text-[#78716c] font-bold',
          innerCardBg: 'bg-white bg-opacity-95 border border-[#D4AF37] border-opacity-35 shadow-sm',
          badgeBg: 'bg-amber-100 border border-amber-400',
          badgeText: 'text-amber-950 font-black',
          accentText: 'text-amber-800 font-black',
          accentBorder: 'border-amber-500 border-opacity-30',
          glowShadow: 'rgba(212, 175, 55, 0.12)',
          tagBg: 'bg-white border border-slate-200',
          tagText: 'text-slate-800 font-bold'
        };
      case 'labor':
        return {
          bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          border: 'border-emerald-500 border-opacity-40',
          textPrimary: 'text-emerald-950 font-black',
          textSecondary: 'text-emerald-900 font-extrabold',
          textMuted: 'text-emerald-800 font-bold',
          innerCardBg: 'bg-white bg-opacity-95 border border-emerald-300 shadow-sm',
          badgeBg: 'bg-emerald-100 border border-emerald-400',
          badgeText: 'text-emerald-950 font-black',
          accentText: 'text-emerald-800 font-black',
          accentBorder: 'border-emerald-500 border-opacity-30',
          glowShadow: 'rgba(16, 185, 129, 0.12)',
          tagBg: 'bg-white border border-slate-200',
          tagText: 'text-emerald-800 font-bold'
        };
      case 'civil':
        return {
          bg: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
          border: 'border-blue-400 border-opacity-40',
          textPrimary: 'text-blue-950 font-black',
          textSecondary: 'text-blue-900 font-extrabold',
          textMuted: 'text-blue-800 font-bold',
          innerCardBg: 'bg-white bg-opacity-95 border border-blue-300 shadow-sm',
          badgeBg: 'bg-blue-100 border border-blue-400',
          badgeText: 'text-blue-950 font-black',
          accentText: 'text-blue-800 font-black',
          accentBorder: 'border-blue-500 border-opacity-30',
          glowShadow: 'rgba(59, 130, 246, 0.12)',
          tagBg: 'bg-white border border-slate-200',
          tagText: 'text-blue-800 font-bold'
        };
      case 'criminal':
        return {
          bg: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
          border: 'border-rose-400 border-opacity-40',
          textPrimary: 'text-rose-950 font-black',
          textSecondary: 'text-rose-900 font-extrabold',
          textMuted: 'text-rose-800 font-bold',
          innerCardBg: 'bg-white bg-opacity-95 border border-rose-300 shadow-sm',
          badgeBg: 'bg-rose-100 border border-rose-400',
          badgeText: 'text-rose-950 font-black',
          accentText: 'text-rose-800 font-black',
          accentBorder: 'border-rose-500 border-opacity-30',
          glowShadow: 'rgba(239, 68, 68, 0.12)',
          tagBg: 'bg-white border border-slate-200',
          tagText: 'text-rose-800 font-bold'
        };
      case 'personal_status':
        return {
          bg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
          border: 'border-purple-400 border-opacity-40',
          textPrimary: 'text-purple-950 font-black',
          textSecondary: 'text-purple-900 font-extrabold',
          textMuted: 'text-purple-800 font-bold',
          innerCardBg: 'bg-white bg-opacity-95 border border-purple-300 shadow-sm',
          badgeBg: 'bg-purple-100 border border-purple-400',
          badgeText: 'text-purple-950 font-black',
          accentText: 'text-purple-800 font-black',
          accentBorder: 'border-purple-500 border-opacity-30',
          glowShadow: 'rgba(168, 85, 247, 0.12)',
          tagBg: 'bg-white border border-slate-200',
          tagText: 'text-purple-800 font-bold'
        };
      case 'administrative':
        return {
          bg: 'linear-gradient(135deg, #F9FAF5 0%, #F5F7E0 100%)',
          border: 'border-stone-400 border-opacity-30',
          textPrimary: 'text-stone-950 font-black',
          textSecondary: 'text-stone-900 font-extrabold',
          textMuted: 'text-[#57534e] font-bold',
          innerCardBg: 'bg-white bg-opacity-95 border border-stone-300 shadow-sm',
          badgeBg: 'bg-[#f5f5f4] border border-stone-300',
          badgeText: 'text-stone-950 font-black',
          accentText: 'text-stone-800 font-black',
          accentBorder: 'border-stone-500 border-opacity-20',
          glowShadow: 'rgba(120, 113, 108, 0.08)',
          tagBg: 'bg-white border border-slate-200',
          tagText: 'text-stone-800 font-bold'
        };
      case 'execution':
        return {
          bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: 'border-amber-500 border-opacity-40',
          textPrimary: 'text-amber-950 font-black',
          textSecondary: 'text-[#78350f] font-extrabold',
          textMuted: 'text-[#92400e] font-bold',
          innerCardBg: 'bg-white bg-opacity-95 border border-amber-300 shadow-sm',
          badgeBg: 'bg-amber-100 border border-amber-400',
          badgeText: 'text-amber-950 font-black',
          accentText: 'text-amber-900 font-black',
          accentBorder: 'border-amber-500 border-opacity-30',
          glowShadow: 'rgba(245, 158, 11, 0.12)',
          tagBg: 'bg-white border border-slate-200',
          tagText: 'text-amber-800 font-bold'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #F8FAF9 0%, #F1F5F4 100%)',
          border: 'border-slate-300',
          textPrimary: 'text-slate-950 font-black',
          textSecondary: 'text-slate-900 font-extrabold',
          textMuted: 'text-slate-800 font-bold',
          innerCardBg: 'bg-white bg-opacity-95 border border-slate-200 shadow-sm',
          badgeBg: 'bg-slate-100 border border-slate-300',
          badgeText: 'text-slate-950 font-black',
          accentText: 'text-slate-800 font-black',
          accentBorder: 'border-slate-300',
          glowShadow: 'rgba(148, 163, 184, 0.08)',
          tagBg: 'bg-white border border-slate-200',
          tagText: 'text-slate-800 font-bold'
        };
    }
  }
}

const CaseCard = React.memo(function CaseCard(props: CaseCardProps) {
  try {
    const {
      c,
      onSelectCase,
      isHighContrast,
      isSyncing,
      onNajizSync,
      setActivityLogCaseId,
      getInteractiveCaseStyles,
      daysLeft = 999,
      onArchiveToggle,
      selectedRole,
      onDeleteCase
    } = props;
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
        if (!element) throw new Error("ملخص التقرير غير متوفر");
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) * Math.pow(canvas.width, -1));
        pdf.save(`تقرير_${c.caseNumber || c.id}.pdf`);
      } catch (err: any) {
        alert("خطأ: " + err.message);
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
        if (!user) return;
        await supabase.from('notes').insert({ user_id: user.id, note_text: quickNoteText });
        setNoteSavedSuccessfully(true);
        setQuickNoteText('');
        setTimeout(() => { setNoteSavedSuccessfully(false); setIsNotePopoverOpen(false); }, 1500);
      } finally {
        setIsSavingNote(false);
      }
    };

    const [isDark, setIsDark] = useState(true);
    const styles = getInteractiveCaseStyles(c?.category || 'general', c?.status || 'new');
    const arabicStatusName = styles?.arabicStatusName || 'غير محدد';

    return (
      <div
        onClick={() => onSelectCase(c)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer bg-white rounded-[2rem] border border-slate-200 border-opacity-80 p-7 shadow-sm transition-all"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <span className="bg-[#FFFBEB] border border-amber-200 text-[#B45309] px-3 py-1 rounded-full text-xs font-black">
              {c?.caseNumber || 'رقم القضية'}
            </span>
            <div className="flex gap-2">
              <span className="bg-[#1E3A8A] text-white px-3 py-1 rounded-full text-xs font-black">
                {c?.category === 'commercial' ? 'تجارية' : 'عامة'}
              </span>
            </div>
          </div>
          
          <h3 className="text-[#050E21] font-black text-xl text-right [text-shadow:0.5px_0.5px_0_rgba(0,0,0,0.1)]">{c?.caseName || 'بدون اسم'}</h3>
          
          <div className="grid grid-cols-2 gap-4 text-right">
            <div className="flex items-center gap-2 justify-end text-xs font-black text-slate-800 [text-shadow:0.3px_0.3px_0_rgba(0,0,0,0.05)]">
              <span>{c?.clientName || 'غير محدد'}</span>
              <User className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-center gap-2 justify-end text-xs font-black text-slate-800 [text-shadow:0.3px_0.3px_0_rgba(0,0,0,0.05)]">
              <span>{c?.nextSessionDate || 'غير محدد'}</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="flex gap-2">
             <button onClick={handleExportReport} className="flex-1 py-2 rounded-xl bg-slate-50 border text-xs font-black">تصدير PDF</button>
             <button onClick={(e) => { e.stopPropagation(); onNajizSync(c); }} className="flex-1 py-2 rounded-xl bg-amber-50 border text-xs font-black">مزامنة ناجز</button>
          </div>
        </div>
        
        {/* Offscreen Template for PDF */}
        <div id={`pdf-report-template-${c?.id}`} className="fixed -left-[9999px] p-10 bg-white text-black w-[800px]" dir="rtl">
          <h1 className="text-2xl font-black mb-4">تقرير قضية</h1>
          <p>رقم القضية: {c?.caseNumber}</p>
          <p>الموضوع: {c?.caseName}</p>
          <p>الموكل: {c?.clientName}</p>
          <p>التفاصيل: {c?.details}</p>
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("CaseCard error:", error);
    return <div className="p-4 bg-red-100 text-red-800">Error rendering case: {error.message}</div>;
  }
});

export default CaseCard;
