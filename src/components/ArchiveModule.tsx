/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Archive, FileText, Download, Trash2, Eye, Shield, Tag, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { ArchiveItem, Case } from '@/types';

interface ArchiveModuleProps {
  cases: Case[];
  archives?: ArchiveItem[];
  onAddArchive?: (item: Omit<ArchiveItem, 'id' | 'createdAt'>) => void;
  onDeleteArchive?: (id: string) => void;
}

export default function ArchiveModule({ cases, archives = [], onAddArchive, onDeleteArchive }: ArchiveModuleProps) {
  const [activeCaseId, setActiveCaseId] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredArchives = archives.filter(item => {
    const matchesCase = activeCaseId === 'all' || item.caseId === activeCaseId;
    const matchesSearch = item.title.includes(searchTerm) || item.fileName.includes(searchTerm);
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesCase && matchesSearch && matchesType;
  });

  const getCaseName = (id: string) => cases.find(c => c.id === id)?.caseName || 'دعوى قضائية غير محددة';

  const types = [
    { value: 'pleading', label: 'لوائح ومذكرات', color: 'blue' },
    { value: 'document', label: 'مستندات وأسانيد', color: 'emerald' },
    { value: 'judgment', label: 'أحكام قضائية صكوك', color: 'amber' },
    { value: 'execution_decision', label: 'قرارات تنفيذ مادة 34', color: 'rose' },
    { value: 'other', label: 'أخرى', color: 'slate' }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 blur-3xl -translate-x-16 -translate-y-16"></div>
        
        <div className="flex-1 w-full relative group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="البحث في الأرشيف الإلكتروني (اسم الملف، المجلد، القضية...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl py-3.5 pr-14 pl-6 text-sm font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <select 
            value={activeCaseId}
            onChange={(e) => setActiveCaseId(e.target.value)}
            className="bg-slate-950/50 border border-slate-700 text-white py-3.5 px-6 rounded-2xl text-xs font-black focus:outline-none focus:border-amber-500 transition-all"
          >
            <option value="all">جميع القضايا المستندات</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.caseNumber} - {c.caseName.substring(0, 20)}...</option>
            ))}
          </select>
          <button className="bg-amber-500 text-slate-950 px-6 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
            إضافة مستند للأرشيف 📤
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setFilterType('all')}
          className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all border ${filterType === 'all' ? 'bg-slate-900 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}
        >
          الكل
        </button>
        {types.map(t => (
          <button 
            key={t.value}
            onClick={() => setFilterType(t.value)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all border shadow-sm ${filterType === t.value ? 'bg-slate-900 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Archive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredArchives.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-3xl">
            <Archive className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">لا توجد مستندات مؤرشفة بهذا التصنيف حالياً</p>
          </div>
        ) : (
          filteredArchives.map((item) => (
            <motion.div
              layout
              key={item.id}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden transition-all group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${
                    item.type === 'judgment' ? 'bg-amber-500/10 text-amber-600' :
                    item.type === 'pleading' ? 'bg-blue-500/10 text-blue-600' :
                    item.type === 'execution_decision' ? 'bg-rose-500/10 text-rose-600' :
                    'bg-emerald-500/10 text-emerald-600'
                  } transition-transform`}>
                    {item.type === 'judgment' ? <Shield className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div className="flex gap-1.5 opacity-0 transition-opacity">
                    <button className="p-2 bg-slate-100 text-slate-600 rounded-xl transition-colors shadow-sm">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteArchive?.(item.id)}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem]">{item.title}</h4>
                
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg">
                    <Tag className="w-3 h-3 text-amber-500" />
                    <span className="truncate leading-none">{getCaseName(item.caseId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium px-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>رفع بواسطة: {item.uploadedBy}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold">{item.createdAt}</span>
                <button className="flex items-center gap-1.5 text-slate-700 font-black text-[10px] transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  تحميل
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Stats Summary for Partner Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full -translate-y-12 translate-x-12"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">إجمالي الأرشفة القضائية</p>
          <h3 className="text-3xl font-black text-white">{archives.length} <span className="text-xs text-slate-500 font-bold">ملف مؤتمت</span></h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30 font-black">+12.5% من الشهر الماضي</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-lg">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">الأحكام النهائية المؤرشفة (صكوك)</p>
          <h3 className="text-3xl font-black text-slate-900">{archives.filter(a => a.type === 'judgment').length} <span className="text-xs text-slate-400 font-bold">حكم قطعي</span></h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2 space-x-reverse">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold">L{i}</div>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-bold">اطلع عليها الشركاء</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">حالة السعة التخزينية</p>
            <h3 className="text-lg font-black text-slate-900">سحابي: 8.5 GB <span className="text-[10px] text-slate-400">/ 500 GB</span></h3>
            <div className="w-48 h-2 bg-slate-100 rounded-full mt-3 overflow-hidden border border-slate-200 shadow-inner">
               <div className="w-[15%] h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
