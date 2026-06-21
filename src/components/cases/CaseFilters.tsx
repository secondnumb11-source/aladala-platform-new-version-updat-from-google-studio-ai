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
    <div className={`p-8 rounded-[2.5rem] border ${isHighContrast ? 'bg-white border-slate-900 shadow-xl' : 'bg-[#050e21] border-slate-800 shadow-2xl'} mb-10 relative z-20 space-y-6 text-right`} dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1 min-w-[320px] relative w-full">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            placeholder="البحث في القضايا، الموكلين، أو أرقام الصكوك..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c1a35] border border-slate-700/50 rounded-2xl py-4 pr-14 pl-6 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all shadow-inner"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative">
            <span className="absolute -top-2 right-4 bg-[#050e21] px-2 text-[10px] font-black text-amber-500/80 uppercase">آخر جلسة</span>
            <input 
              type="date"
              value={lastSessionFilter}
              onChange={(e) => setLastSessionFilter(e.target.value)}
              className="bg-[#0c1a35] border border-slate-700/50 rounded-xl py-2.5 px-4 text-[10px] font-black text-white outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <div className="relative">
            <span className="absolute -top-2 right-4 bg-[#050e21] px-2 text-[10px] font-black text-indigo-500/80 uppercase">الموعد القادم</span>
            <input 
              type="date"
              value={nextAppointmentFilter}
              onChange={(e) => setNextAppointmentFilter(e.target.value)}
              className="bg-[#0c1a35] border border-slate-700/50 rounded-xl py-2.5 px-4 text-[10px] font-black text-white outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'grid' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-700'}`}
            >
              <Layers className="w-4 h-4" />
              <span>عرض المربعات</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'table' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300'}`}
            >
              <FileText className="w-4 h-4" />
              <span>عرض القائمة</span>
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3">
            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">إجمالي القضايا:</span>
            <span className="text-lg font-mono text-amber-500 font-black leading-none">{(cases || []).length}</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsGraphsOpen(!isGraphsOpen)}
            className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white font-black transition-all cursor-pointer"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={handleExportCSV}
            className="px-5 py-3.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500 rounded-2xl text-white font-black text-xs cursor-pointer shadow-lg transition-all"
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
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-black transition-all border shrink-0 relative group ${
                isActive 
                  ? 'bg-amber-600 text-white border-amber-500 shadow-xl shadow-amber-600/20' 
                  : 'bg-[#0c1a35] text-white border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-500'}`} />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${isActive ? 'bg-white/20' : 'bg-slate-800 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Dropdowns bar to make filter system complete */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-slate-800/60 font-sans">
        <div>
          <label className="block text-[10px] font-bold text-amber-500 mb-1.5 uppercase">مرحلة التقاضي</label>
          <select 
            value={stageFilter} 
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full bg-[#0c1a35] text-white border border-slate-700 rounded-xl py-2 px-3 text-xs font-bold"
          >
            <option value="all">كل المراحل 📋</option>
            <option value="litigation">المرافعة والتقاضي ⚖️</option>
            <option value="appeals">الاستئناف والتمييز 🏛️</option>
            <option value="execution">محكمة التنفيذ ⚡</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-amber-500 mb-1.5 uppercase">مكان المحكمة</label>
          <select 
            value={courtFilter} 
            onChange={(e) => setCourtFilter(e.target.value)}
            className="w-full bg-[#0c1a35] text-white border border-slate-700 rounded-xl py-2 px-3 text-xs font-bold"
          >
            <option value="all">كل المحاكم ⚖️</option>
            <option value="الرياض">الرياض 📍</option>
            <option value="جدة">جدة 📍</option>
            <option value="مكة">مكة المكرمة 📍</option>
            <option value="الشرقية">الشرقية 📍</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-amber-500 mb-1.5 uppercase">حالة المتابعة</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#0c1a35] text-white border border-slate-700 rounded-xl py-2 px-3 text-xs font-bold"
          >
            <option value="all">كل الحالات 🗳️</option>
            <option value="active">نشطة فقط 🟢</option>
            <option value="closed">منتهية (مغلقة) 🔴</option>
            <option value="under_review">تحت الدراسة والتدقيق 🧪</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-amber-500 mb-1.5 uppercase">المستشار المرخص المسؤول</label>
          <select 
            value={lawyerFilter} 
            onChange={(e) => setLawyerFilter(e.target.value)}
            className="w-full bg-[#0c1a35] text-white border border-slate-700 rounded-xl py-2 px-3 text-xs font-bold"
          >
            <option value="all">كل المحامين 👥</option>
            <option value="baqami">د. البقمي 👑</option>
            <option value="qahtani">أ. القحطاني ⚖️</option>
            <option value="ghamdi">أ. الغامدي 👔</option>
          </select>
        </div>
      </div>

      {/* Advanced Document Tag Filter Bar */}
      <div className="pt-4 border-t border-slate-800/60 mt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded">وسوم المستندات الذكية</span>
            <p className="text-[11px] text-white font-bold">فلترة سريعة للقضايا بواسطة وسوم المستندات التلقائية المكتشفة بالذكاء الاصطناعي (AI):</p>
          </div>
          {selectedDocTag !== 'all' && (
            <button 
              type="button"
              onClick={() => setSelectedDocTag('all')}
              className="text-[10px] text-rose-400 font-extrabold flex items-center gap-1 transition-all cursor-pointer"
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
                className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600/25 text-amber-400 border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'bg-[#0c1a35] text-white border-slate-800/80 hover:border-amber-500/30'
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
