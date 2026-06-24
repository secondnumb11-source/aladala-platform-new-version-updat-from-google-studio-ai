/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Search, Layers, FileText, TrendingUp, X 
} from 'lucide-react';
import { Case } from '@/types';

interface CaseFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  lastSessionFilter: string;
  setLastSessionFilter: (value: string) => void;
  nextAppointmentFilter: string;
  setNextAppointmentFilter: (value: string) => void;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  categoryFilter: string[];
  setCategoryFilter: (value: string[] | ((prev: string[]) => string[])) => void;
  stageFilter: string;
  setStageFilter: (stage: string) => void;
  courtFilter: string;
  setCourtFilter: (court: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  lawyerFilter: string;
  setLawyerFilter: (lawyer: string) => void;
  selectedDocTag: string;
  setSelectedDocTag: (tag: string) => void;
  cases: Case[];
  countByCategory: (cat: string) => number;
  categories: any[];
  isHighContrast: boolean;
  isGraphsOpen: boolean;
  setIsGraphsOpen: (value: boolean) => void;
  handleExportCSV: () => void;
}

export default function CaseFilters({
  searchTerm,
  setSearchTerm,
  lastSessionFilter,
  setLastSessionFilter,
  nextAppointmentFilter,
  setNextAppointmentFilter,
  viewMode,
  setViewMode,
  categoryFilter,
  setCategoryFilter,
  stageFilter,
  setStageFilter,
  courtFilter,
  setCourtFilter,
  statusFilter,
  setStatusFilter,
  lawyerFilter,
  setLawyerFilter,
  selectedDocTag,
  setSelectedDocTag,
  cases,
  countByCategory,
  categories,
  isHighContrast,
  isGraphsOpen,
  setIsGraphsOpen,
  handleExportCSV
}: CaseFiltersProps) {

  return (
    <div className={`p-8 rounded-[2.5rem] border ${isHighContrast ? 'bg-[#0b1329] border-amber-500/40 shadow-[0_0_35px_rgba(212,175,55,0.15)]' : 'bg-[#040e21] border-amber-500/20 shadow-[0_0_25px_rgba(212,175,55,0.1)]'} mb-10 relative z-20 space-y-6 text-right font-sans`} dir="rtl">
      
      {/* Premium Header for Advanced Search and Filters */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-700/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
          🔍
        </div>
        <div>
          <h3 className="text-sm font-black text-amber-400 tracking-wide">بوابة التصفية والبحث المتقدم</h3>
          <p className="text-[10px] text-white/60 font-medium">البحث والفرز الذكي داخل القضايا بناءً على نوع الدعوى، حالة القضية، أو اسم العميل وأطراف الخصومة</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1 min-w-[320px] relative w-full">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
          <input 
            type="text" 
            placeholder="البحث باسم العميل، نوع القضية، حالة القضية أو رقم الصك..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b1329] border border-slate-700 rounded-2xl py-4 pr-14 pl-6 text-sm font-black text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all shadow-inner"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative">
            <span className="absolute -top-2 right-4 bg-[#040e21] px-2 text-[10px] font-black text-[#facc15] uppercase tracking-wider">آخر جلسة</span>
            <input 
              type="date"
              value={lastSessionFilter}
              onChange={(e) => setLastSessionFilter(e.target.value)}
              className="bg-[#0b1329] border border-slate-700 rounded-xl py-2.5 px-4 text-[11px] font-black text-white outline-none focus:border-[#facc15]/50 focus:ring-2 focus:ring-[#facc15]/20 transition-all [color-scheme:dark]"
            />
          </div>
          <div className="relative">
            <span className="absolute -top-2 right-4 bg-[#040e21] px-2 text-[10px] font-black text-[#ff7f00] uppercase tracking-wider">الموعد القادم</span>
            <input 
              type="date"
              value={nextAppointmentFilter}
              onChange={(e) => setNextAppointmentFilter(e.target.value)}
              className="bg-[#0b1329] border border-slate-700 rounded-xl py-2.5 px-4 text-[11px] font-black text-white outline-none focus:border-[#ff7f00]/50 focus:ring-2 focus:ring-[#ff7f00]/20 transition-all [color-scheme:dark]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-[#0b1329] border border-slate-700 p-1 rounded-2xl shadow-inner">
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'grid' ? 'bg-[#ff7f00] text-slate-950 shadow-lg shadow-[#ff7f00]/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" />
              <span>عرض المربعات</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'table' ? 'bg-[#ff7f00] text-slate-950 shadow-lg shadow-[#ff7f00]/20' : 'text-slate-400 hover:text-white'}`}
            >
              <FileText className="w-4 h-4" />
              <span>عرض القائمة</span>
            </button>
          </div>
          <div className="bg-[#0b1329] border border-slate-700 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
            <span className="text-[10px] text-[#facc15] font-black uppercase tracking-widest">إجمالي القضايا:</span>
            <span className="text-lg font-mono text-white font-black leading-none drop-shadow-md">{(cases || []).length}</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsGraphsOpen(!isGraphsOpen)}
            className="p-3.5 bg-[#0b1329] border border-slate-700 rounded-2xl text-white hover:text-[#ff7f00] font-black transition-all cursor-pointer shadow-inner"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={handleExportCSV}
            className="px-5 py-3.5 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/40 rounded-2xl text-indigo-200 hover:text-white font-black text-[11px] cursor-pointer shadow-lg transition-all tracking-wider"
          >
            تصدير CSV
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === 'all' ? categoryFilter.length === 0 : categoryFilter.includes(cat.id);
          const safeCases = cases || [];
          const count = cat.id === 'all' ? safeCases.filter(c => !c.archived).length : countByCategory(cat.id);
          
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => {
                if (cat.id === 'all') {
                  setCategoryFilter([]);
                } else {
                  setCategoryFilter(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]);
                }
              }}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[11px] font-black transition-all border shrink-0 relative group shadow-inner ${
                isActive 
                  ? 'bg-[#ff7f00] text-slate-950 border-[#ff7f00] shadow-lg shadow-[#ff7f00]/20' 
                  : 'bg-[#040e21] text-white border-slate-700 hover:border-[#facc15]/50 hover:text-[#facc15]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-[#ff7f00]'}`} />
              <span className="tracking-wide">{cat.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${isActive ? 'bg-slate-950/20' : 'bg-slate-800 text-slate-300'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Dropdowns bar to make filter system complete */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-slate-700/80 font-sans">
        <div>
          <label className="block text-[10px] font-black text-[#facc15] mb-1.5 uppercase tracking-wider">مرحلة التقاضي</label>
          <select 
            value={stageFilter} 
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full bg-[#040e21] text-white border border-slate-700 rounded-xl py-2 px-3 text-xs font-black focus:border-[#ff7f00]/50 focus:ring-2 focus:ring-[#ff7f00]/20 outline-none transition-all"
          >
            <option value="all">كل المراحل 📋</option>
            <option value="litigation">المرافعة والتقاضي ⚖️</option>
            <option value="appeals">الاستئناف والتمييز 🏛️</option>
            <option value="execution">محكمة التنفيذ ⚡</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-[#facc15] mb-1.5 uppercase tracking-wider">مكان المحكمة</label>
          <select 
            value={courtFilter} 
            onChange={(e) => setCourtFilter(e.target.value)}
            className="w-full bg-[#040e21] text-white border border-slate-700 rounded-xl py-2 px-3 text-xs font-black focus:border-[#ff7f00]/50 focus:ring-2 focus:ring-[#ff7f00]/20 outline-none transition-all"
          >
            <option value="all">كل المحاكم ⚖️</option>
            <option value="الرياض">الرياض 📍</option>
            <option value="جدة">جدة 📍</option>
            <option value="مكة">مكة المكرمة 📍</option>
            <option value="الشرقية">الشرقية 📍</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-[#facc15] mb-1.5 uppercase tracking-wider">حالة المتابعة</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#040e21] text-white border border-slate-700 rounded-xl py-2 px-3 text-xs font-black focus:border-[#ff7f00]/50 focus:ring-2 focus:ring-[#ff7f00]/20 outline-none transition-all"
          >
            <option value="all">كل الحالات 🗳️</option>
            <option value="active">نشطة فقط 🟢</option>
            <option value="closed">منتهية (مغلقة) 🔴</option>
            <option value="under_review">تحت الدراسة والتدقيق 🧪</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-[#facc15] mb-1.5 uppercase tracking-wider">المستشار المرخص المسؤول</label>
          <select 
            value={lawyerFilter} 
            onChange={(e) => setLawyerFilter(e.target.value)}
            className="w-full bg-[#040e21] text-white border border-slate-700 rounded-xl py-2 px-3 text-xs font-black focus:border-[#ff7f00]/50 focus:ring-2 focus:ring-[#ff7f00]/20 outline-none transition-all"
          >
            <option value="all">كل المحامين 👥</option>
            <option value="baqami">د. البقمي 👑</option>
            <option value="qahtani">أ. القحطاني ⚖️</option>
            <option value="ghamdi">أ. الغامدي 👔</option>
          </select>
        </div>
      </div>

      {/* Advanced Document Tag Filter Bar */}
      <div className="pt-4 border-t border-slate-700/80 mt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#ff7f00] font-black uppercase tracking-widest bg-[#ff7f00]/10 px-2 py-1 rounded">وسوم المستندات الذكية</span>
            <p className="text-[11px] text-white font-bold">فلترة سريعة للقضايا بواسطة وسوم المستندات التلقائية المكتشفة بالذكاء الاصطناعي (AI):</p>
          </div>
          {selectedDocTag !== 'all' && (
            <button 
              type="button"
              onClick={() => setSelectedDocTag('all')}
              className="text-[10px] text-rose-400 font-extrabold flex items-center gap-1 transition-all cursor-pointer hover:text-rose-300"
            >
              <X className="w-3 h-3" />
              إلغاء التصفية بالوسم
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'الكل 📁' },
            { id: 'مفهرس_آلياً', label: 'مفهرس آليا 🤖' },
            { id: 'عقد_تأسيس', label: 'عقود تأسيس 💼' },
            { id: 'عقد_عمل', label: 'عقود عمل 👔' },
            { id: 'عقد_مدني', label: 'عقود مدنية 📜' },
            { id: 'قضاء_تجاري', label: 'القضاء التجاري 🏛️' },
            { id: 'قضاء_عام', label: 'القضاء العام 🏛️' },
            { id: 'قرار_حكم', label: 'قرارات الأحكام 📜' },
            { id: 'مذكرة_دعوى', label: 'مذكرات الدعوى 📝' },
            { id: 'وكالة_شرعية', label: 'الوكالات الشرعية 🔑' },
            { id: 'سند_تنفيذي', label: 'السندات التنفيذية ⚡' },
            { id: 'تقرير_خبير', label: 'تقارير الخبراء 🔍' }
          ].map((tagItem) => {
            const isActive = selectedDocTag === tagItem.id;
            return (
              <button
                type="button"
                key={tagItem.id}
                onClick={() => setSelectedDocTag(tagItem.id)}
                className={`px-3 py-2 rounded-xl text-[11px] font-black border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-inner ${
                  isActive
                    ? 'bg-[#ff7f00] text-slate-950 border-[#ff7f00] shadow-lg shadow-[#ff7f00]/20'
                    : 'bg-[#040e21] text-white border-slate-700 hover:border-[#facc15]/50 hover:text-[#facc15]'
                }`}
              >
                <span>{tagItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
