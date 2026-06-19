/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, BookOpen, Download, Star, Filter, ArrowLeft, ExternalLink, ShieldCheck, Scale, FileText, Crown } from 'lucide-react';
import Markdown from 'react-markdown';

const SAUDI_LAWS = [
  {
    id: 'civil-transactions',
    title: 'نظام المعاملات المدنية',
    desc: 'المرجع الأساسي للحقوق والالتزامات المدنية في المملكة العربية السعودية.',
    category: 'قانون مدني',
    lastUpdated: '1445-01-01',
    content: ''
  },
  {
    id: 'companies-new',
    title: 'نظام الشركات الجديد',
    desc: 'ينظم أنواع الشركات وتأسيسها وحوكمتها وتصفيتها.',
    category: 'قانون تجاري',
    lastUpdated: '1444-06-01',
    content: ''
  },
  {
    id: 'labor-law',
    title: 'نظام العمل',
    desc: 'ينظم العلاقة التعاقدية بين صاحب العمل والعامل.',
    category: 'قانون العمل',
    lastUpdated: '1444-12-01',
    content: ''
  },
  {
    id: 'evidence-law',
    title: 'نظام الإثبات القضائي',
    desc: 'القواعد المنظمة لإثبات الحقوق في المواد المدنية والتجارية.',
    category: 'قانون إجرائي',
    lastUpdated: '1443-05-01',
    content: ''
  },
  {
    id: 'enforcement-law',
    title: 'نظام التنفيذ',
    desc: 'ينظم إجراءات تنفيذ الأحكام والسندات التنفيذية.',
    category: 'قانون إجرائي',
    lastUpdated: '1444-07-01',
    content: ''
  },
  {
    id: 'bankruptcy-law',
    title: 'نظام الإفلاس',
    desc: 'يهدف إلى تمكين المدين المفلس من إعادة تنظيم أوضاعه المالية.',
    category: 'قانون تجاري',
    lastUpdated: '1445-02-01',
    content: ''
  }
];

const TEMPLATES = [
  {
    id: 't1',
    title: 'عقد تأسيس شركة مساهمة مبسطة',
    author: 'مكتب العدالة للاستشارات',
    price: 150,
    downloads: 1240,
    rating: 4.9,
    description: 'نموذج احترافي متوافق مع نظام الشركات الجديد.'
  },
  {
    id: 't2',
    title: 'مذكرة دفاع في دعوى مطالبة مالية',
    author: 'د. خالد المحامي',
    price: 0,
    downloads: 5600,
    rating: 4.7,
    description: 'دفوع قوية للأسانيد والوقائع.'
  }
];

export default function LibraryModule() {
  const [activeTab, setActiveTab] = useState<'regs' | 'templates'>('regs');
  const [selectedLaw, setSelectedLaw] = useState<typeof SAUDI_LAWS[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getLawUrl = (lawId: string): string => {
    switch (lawId) {
      case 'civil-transactions':
        return localStorage.getItem('law_link_civil_transactions') || 'https://laws.boe.gov.sa/SaudiLaws/Laws/LawDetails/6968fd0a-115f-4bf2-abb9-b01600c01fa1';
      case 'companies-new':
        return localStorage.getItem('law_link_companies_new') || 'https://laws.boe.gov.sa/SaudiLaws/Laws/LawDetails/2585f9ea-b97c-40ad-9b8d-ae7b00bef027';
      case 'labor-law':
        return localStorage.getItem('law_link_labor_law') || 'https://laws.boe.gov.sa/SaudiLaws/Laws/LawDetails/f7648348-18e4-4d10-8277-ae7b00bef20b';
      case 'evidence-law':
        return localStorage.getItem('law_link_evidence_law') || 'https://laws.boe.gov.sa/SaudiLaws/Laws/LawDetails/623d3a08-8e81-4b13-b5f7-ae3400877044';
      case 'enforcement-law':
        return localStorage.getItem('law_link_enforcement_law') || 'https://laws.boe.gov.sa/SaudiLaws/Laws/LawDetails/7180fd12-c247-495c-9c7a-ae7b00bef264';
      case 'bankruptcy-law':
        return localStorage.getItem('law_link_bankruptcy_law') || 'https://laws.boe.gov.sa/SaudiLaws/Laws/LawDetails/33580cae-c496-419b-ab05-ae7b00bef18d';
      default:
        return 'https://laws.boe.gov.sa';
    }
  };

  const handleLawClick = (law: typeof SAUDI_LAWS[0]) => {
    const targetUrl = getLawUrl(law.id);
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedLaw(law);
    }
  };

  const filteredLaws = SAUDI_LAWS.filter(l => 
    l.title.includes(searchTerm) || l.category.includes(searchTerm)
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-amber-500" />
            المكتبة القانونية الرقمية والتفاعلية
          </h2>
          <p className="text-slate-200 font-bold text-sm mt-1 font-bold">المرجع الشامل للأنظمة السعودية ونماذج العقود واللوائح</p>
        </div>
        
        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700 relative z-10 shadow-inner">
          <button 
            onClick={() => setActiveTab('regs')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'regs' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-white font-bold'}`}
          >
            الأنظمة واللوائح
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'templates' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-white font-bold'}`}
          >
            سوق النماذج (Marketplace)
          </button>
        </div>
      </div>

      {selectedLaw ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedLaw(null)}
                className="p-2 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-200 font-bold" />
              </button>
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedLaw.title}</h3>
                <div className="flex gap-3 mt-1">
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-black px-2 py-0.5 rounded-lg border border-amber-200 font-black">
                    {selectedLaw.category}
                  </span>
                  <span className="text-[10px] text-slate-700 font-bold">آخر تحديث: {selectedLaw.lastUpdated}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md">
                <Download className="w-4 h-4" />
                تحميل نسخة PDF معتمدة
              </button>
              <button className="flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-black transition-all">
                <ExternalLink className="w-4 h-4" />
                رابط هيئة الخبراء
              </button>
            </div>
          </div>
          <div className="p-10 prose prose-slate max-w-none prose-headings:font-black prose-p:font-bold prose-p:leading-relaxed overflow-y-auto max-h-[600px] markdown-body">
            <Markdown>{selectedLaw.content}</Markdown>
          </div>
        </motion.div>
      ) : activeTab === 'regs' ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200 font-bold w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text" 
              placeholder="ابحث في الأنظمة السعودية (مثل: نظام العمل، الشركات، المحاكم...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-3xl py-4 pr-14 pl-6 text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLaws.map((law) => (
              <motion.div
                key={law.id}
                className="bg-white border border-slate-200 p-6 rounded-3xl shadow-lg transition-all cursor-pointer group"
                onClick={() => handleLawClick(law)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 font-black group- group- transition-all">
                    <Scale className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-200 font-bold px-3 py-1 rounded-full font-black uppercase tracking-wider">
                    {law.category}
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-amber-500 transition-colors flex items-center justify-between gap-2">
                  <span>{law.title}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
                </h4>
                <p className="text-slate-200 font-bold text-xs mt-2 line-clamp-2 font-bold leading-relaxed">{law.desc}</p>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-200 font-bold font-bold">تحديث: {law.lastUpdated}</span>
                  <button className="text-amber-400 font-black font-black text-xs flex items-center gap-1">
                    تصفح النظام
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <h4 className="font-black text-slate-900 flex items-center gap-2 mb-6">
                  <Filter className="w-4 h-4" />
                  تصفية النماذج
                </h4>
                <div className="space-y-4">
                  {['عقود تجارية', 'مذكرات قانونية', 'لوائح اعتراضية', 'اتفاقيات عمل', 'أخرى'].map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                      <span className="text-sm font-bold text-slate-200 font-bold group- transition-colors uppercase">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-amber-500 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group- transition-transform duration-700"></div>
                <div className="relative z-10">
                  <h4 className="font-black text-slate-950 text-sm">شارك نماذجك واربح!</h4>
                  <p className="text-slate-900 text-[10px] mt-2 font-bold leading-relaxed">انضم لأكثر من 500 محامي يشاركون خبراتهم وصيغهم القانونية المتميزة.</p>
                  <button className="w-full bg-slate-950 text-white py-2 rounded-xl text-[10px] font-black mt-4 border border-slate-800 shadow-lg">إضافة نموذج جديد ➕</button>
                </div>
              </div>
            </div>

            {/* Marketplace Grid */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {TEMPLATES.map(temp => (
                <div key={temp.id} className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden  transition-all group">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border-2 border-amber-500 text-amber-500 shadow-md">
                          <Crown className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-900 leading-none">{temp.author}</span>
                          <span className="text-[10px] text-emerald-600 font-bold mt-1 uppercase flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            موثق بالعدالة
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg">
                        {temp.price === 0 ? 'مجاني' : `${temp.price} ريال`}
                      </div>
                    </div>

                    <h4 className="text-base font-black text-slate-900 line-clamp-1">{temp.title}</h4>
                    <p className="text-slate-700 text-[10px] font-bold mt-2 leading-relaxed">{temp.description}</p>
                    
                    <div className="flex items-center gap-4 mt-6 text-[10px] font-bold text-slate-200 font-bold">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-slate-900 font-black">{temp.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>{temp.downloads} تحميل</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button className="flex-1 bg-amber-500  text-slate-950 px-4 py-2.5 rounded-xl text-[10px] font-black shadow-md transition-all flex items-center justify-center gap-2">
                      <Download className="w-3.5 h-3.5" />
                      تحميل الآن
                    </button>
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl  transition-colors text-slate-200 font-bold">
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
