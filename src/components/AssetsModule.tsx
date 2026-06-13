/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Coins, 
  TrendingUp, 
  Plus, 
  Search, 
  Link, 
  Calendar, 
  Trash2, 
  Layers, 
  DollarSign, 
  FileText,
  Building,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Cell,
  Treemap
} from 'recharts';
import { Case, Client } from '@/types';

interface LegalAsset {
  id: string;
  name: string;
  category: 'real_estate' | 'stocks' | 'machinery' | 'contracts' | 'cash';
  clientName: string;
  clientId: string;
  value: number; // SAR
  acquisitionDate: string;
  expiryDate?: string;
  region?: string;
  confidentiality?: 'عام' | 'سري' | 'سري للغاية';
  linkedCaseNumber: string;
  linkedCaseName: string;
  notes: string;
}

interface AssetsModuleProps {
  cases: Case[];
  clients: Client[];
  onUpdateState: (type: string, data: any) => void;
}

export default function AssetsModule({
  cases,
  clients,
  onUpdateState
}: AssetsModuleProps) {
  const [themeTick, setThemeTick] = useState(Date.now());

  useEffect(() => {
    const handleThemeEvent = () => setThemeTick(Date.now());
    window.addEventListener('adalah-advanced-config-updated', handleThemeEvent);
    return () => window.removeEventListener('adalah-advanced-config-updated', handleThemeEvent);
  }, []);
  
  // High fidelity starting assets
  const [assets, setAssets] = useState<LegalAsset[]>([
    {
      id: 'asset-1',
      name: 'مستودع شركة نادك اللوجستي بالخرج',
      category: 'real_estate',
      clientName: 'شركة نادك للتنمية الزراعية',
      clientId: 'client-nadec',
      value: 6500000,
      acquisitionDate: '2021-08-14',
      expiryDate: '2026-06-15',
      region: 'الرياض',
      confidentiality: 'عام',
      linkedCaseNumber: '437194619',
      linkedCaseName: 'نزاع عقد توريد خدمات لوجستية',
      notes: 'المستودع الرئيسي الخاضع للشرط الجزائي وحصار الترانزيت البري.'
    },
    {
      id: 'asset-2',
      name: 'محفظة بنك البلاد الاستثمارية المستقلة',
      category: 'stocks',
      clientName: 'مجموعة الشايع للاستثمار',
      clientId: 'client-shaya',
      value: 12000000,
      acquisitionDate: '2023-04-10',
      expiryDate: '2027-04-10',
      region: 'الدمام',
      confidentiality: 'سري للغاية',
      linkedCaseNumber: '451829375',
      linkedCaseName: 'طلب تنفيذ سند لأمر مالي مستقل',
      notes: 'محفظة مالية سائلة ضمانية يجري للتنفيذ مادة 46 حجزها رسمياً.'
    },
    {
      id: 'asset-3',
      name: 'خط إنتاج مصنع البوليمر بالجبيل',
      category: 'machinery',
      clientName: 'شركة البتروكيماويات المتقدمة',
      clientId: 'client-petrochemical',
      value: 24500000,
      acquisitionDate: '2019-11-22',
      expiryDate: '2026-06-25',
      region: 'الشرقية',
      confidentiality: 'سري',
      linkedCaseNumber: '448291039',
      linkedCaseName: 'اعتراض على قرار ضريبي جمركي بقيمة تقديرية',
      notes: 'معدات صناعية مخصصة للاستيراد والخاضعة للربط الضريبي لديوان المظالم.'
    },
    {
      id: 'asset-4',
      name: 'أراضي مخطط الياسمين السكني بالرياض',
      category: 'real_estate',
      clientName: 'م. خالد بن شاهين الدوسري',
      clientId: 'client-khaled',
      value: 3200000,
      acquisitionDate: '2024-02-18',
      expiryDate: '2030-01-01',
      region: 'جدة',
      confidentiality: 'عام',
      linkedCaseNumber: '450917283',
      linkedCaseName: 'حقوق عمالية ومكافأة نهاية الخدمة',
      notes: 'عقار خاص بالعميل م. خالد بن شاهين كغطاء حيازة معتمد بجدة.'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form Fields State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'real_estate' | 'stocks' | 'machinery' | 'contracts' | 'cash'>('real_estate');
  const [newClientName, setNewClientName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newAcqDate, setNewAcqDate] = useState('2026-06-01');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newRegion, setNewRegion] = useState('الرياض');
  const [newConfidentiality, setNewConfidentiality] = useState<'عام' | 'سري' | 'سري للغاية'>('عام');
  const [newLinkedCase, setNewLinkedCase] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newClientName || !newValue) {
      alert('يرجى ملء البيانات الرئيسية للأصل أولاً.');
      return;
    }

    const selectedClientObj = clients.find(cl => cl.name === newClientName) || clients[0];
    const selectedCaseObj = cases.find(cs => cs.caseNumber === newLinkedCase);

    const newAsset: LegalAsset = {
      id: `asset-${Date.now()}`,
      name: newName,
      category: newCategory,
      clientName: newClientName,
      clientId: selectedClientObj ? selectedClientObj.id : `client-${Date.now()}`,
      value: parseFloat(newValue),
      acquisitionDate: newAcqDate,
      expiryDate: newExpiryDate || undefined,
      region: newRegion,
      confidentiality: newConfidentiality,
      linkedCaseNumber: newLinkedCase,
      linkedCaseName: selectedCaseObj ? selectedCaseObj.caseName : 'نزاع مالي عام',
      notes: newNotes || 'لا يوجد تفاصيل إضافية ملحقة بالأصل حالياً.'
    };

    setAssets([newAsset, ...assets]);
    setIsCreateOpen(false);

    // Clear forms
    setNewName('');
    setNewValue('');
    setNewNotes('');
    setNewExpiryDate('');
    alert('تم تسجيل الأصل عالي القيمة وربطه بالملف القضائي الموحد للموكل بنجاح!');
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك بالاستبعاد وإلغاء حصر هذا الأصل؟')) {
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  // 📈 Analytics: Highest Asset Ownership clients summarization
  const clientAssetTotals = assets.reduce((acc: Record<string, { name: string; total: number }>, curr) => {
    if (!acc[curr.clientName]) {
      acc[curr.clientName] = { name: curr.clientName, total: 0 };
    }
    acc[curr.clientName].total += curr.value;
    return acc;
  }, {});

  const chartData = Object.values(clientAssetTotals).sort((a: any, b: any) => b.total - a.total);

  // Filters logic
  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.includes(searchTerm) || 
                          a.clientName.includes(searchTerm) || 
                          a.linkedCaseName.includes(searchTerm);
    if (categoryFilter === 'all') return matchesSearch;
    return matchesSearch && a.category === categoryFilter;
  });

  const totalValue = assets.reduce((sum, item) => sum + item.value, 0);
  const formattedTotalValue = (totalValue / 1000000).toFixed(2) + " مليون ر.س";

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Page Title Header */}
      <div className="bg-sky-50 border border-slate-200 p-6 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 w-32 h-[120px] bg-sky-200/50 blur-3xl rounded-full"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <span className="text-xs text-amber-700 font-bold">💎 منظومة تتبع ثروات وأصول العملاء عالية القيمة</span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">واجهة حصر الأصول وعقد الامتلاك القضائي لمنصة العدالة</h1>
            <p className="text-xs text-slate-600 mt-1">
              أداة متكاملة وذكية لحيازة الأصول العقارية والأوراق المالية وضمانات الاستحواذ المرتبطة مباشرة بنص ومسار قضايا المحاكم.
            </p>
          </div>
          
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-amber-500 text-slate-950 font-black text-xs py-2.5 px-5 rounded-2xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
          >
            + قيد أصل مالي عالي القيمة
          </button>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-sky-50 border border-slate-200 p-4.5 rounded-3xl text-right shadow-sm">
            <span className="text-xs text-slate-800 font-bold block">إجمالي القيمة التقديرية للأصول</span>
            <strong className="text-xl md:text-2xl font-mono font-black text-amber-700 block mt-1">{formattedTotalValue}</strong>
            <span className="text-xs text-slate-500 block mt-0.5">موزعة على الأرصدة الاستثمارية والعقارية</span>
          </div>

          <div className="bg-sky-50 border border-slate-200 p-4.5 rounded-3xl text-right shadow-sm">
            <span className="text-xs text-slate-800 font-bold block">عدد الأصول المرصودة حالياً</span>
            <strong className="text-xl md:text-2xl font-mono font-black text-slate-950 block mt-1">{assets.length} أصول رئيسية</strong>
            <span className="text-xs text-emerald-700 block mt-0.5">نشطة ومربوطة بنظام التقاضي</span>
          </div>

          <div className="bg-sky-50 border border-slate-200 p-4.5 rounded-3xl text-right shadow-sm">
            <span className="text-xs text-slate-800 font-bold block">أعلى الأصول ميزانيةً</span>
            <strong className="text-lg md:text-xl font-black text-slate-950 truncate block mt-1">مصنع البوليمر بالجبيل</strong>
            <span className="text-xs text-slate-500 block mt-0.5">بقيمة 24.5 مليون ريال سعودي</span>
          </div>

          <div className="bg-sky-50 border border-slate-200 p-4.5 rounded-3xl text-right shadow-sm">
            <span className="text-xs text-slate-800 font-bold block">نسبة تغطية الضمانات الشرعية</span>
            <strong className="text-xl md:text-2xl font-mono font-black text-emerald-700 block mt-1">94.2%</strong>
            <span className="text-xs text-slate-500 block mt-0.5">ضد مخاطر الحجوزات الصادرة</span>
          </div>
        </div>

        {/* POAs Alert Sub-panel */}
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-3xl flex items-center gap-3">
          <div className="bg-rose-100 p-2 rounded-2xl shrink-0">
            <AlertCircle className="w-6 h-6 text-rose-600 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 mb-0.5">تنبيه انتهاء صلاحية الوكالات القانونية</h4>
            <p className="text-xs text-rose-800">
              يوجد <strong className="text-rose-600 font-mono text-sm mx-1">{assets.filter(a => {
                if (!a.expiryDate) return false;
                const days = (new Date(a.expiryDate).getTime() - new Date('2026-06-01').getTime()) / (1000 * 3600 * 24);
                return days > 0 && days < 30;
              }).length}</strong> وكالات قانونية (POAs) ستنتهي صلاحيتها خلال أقل من 30 يوماً! يرجى التواصل مع العملاء المعنيين لتجديدها.
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Recharts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Heatmap / Region Distribution representing the requested Analytical ownership view */}
        <div className="lg:col-span-8 bg-sky-50 border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <TrendingUp className="w-4.5 h-4.5 text-amber-655" />
            <h3 className="text-xs font-black text-slate-900">الخريطة الحرارية الجغرافية لتوزيع الأصول وقيمتها حسب المناطق</h3>
          </div>

          {(() => {
            const regionTotals = assets.reduce((acc: Record<string, { region: string; total: number; count: number }>, a) => {
              const r = a.region || 'أخرى';
              if (!acc[r]) acc[r] = { region: r, total: 0, count: 0 };
              acc[r].total += a.value;
              acc[r].count += 1;
              return acc;
            }, {});
            const heatmapData = (Object.values(regionTotals) as { region: string; total: number; count: number }[]).sort((a, b) => b.total - a.total);
            
            return (
              <div style={{ height: '220px', width: '100%', minWidth: 0 }} className="text-xs" dir="ltr">
                <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} key={themeTick}>
                    <Treemap
                      data={heatmapData}
                      dataKey="total"
                      nameKey="region"
                      stroke="#ffffff"
                      fill="#ca8a04"
                    >
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', textAlign: 'right' }} 
                        formatter={(val: any) => [`${(val / 1000000).toFixed(1)} مليون ر.س`, 'قيمة الأصول']}
                      />
                    </Treemap>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
          
          <p className="text-xs text-slate-600 leading-relaxed font-sans mt-2 text-right">
            * مخطط الخريطة الحرارية أعلاه يحلل توزع المخاطر وقيمة الأصول حسب مناطق المملكة العربية السعودية.
          </p>
        </div>

        {/* Quick Insights & Expiry Warnings List */}
        <div className="lg:col-span-4 bg-sky-50 border border-slate-200 p-5 rounded-3xl space-y-4 font-sans text-right shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Layers className="w-4.5 h-4.5 text-rose-605 animate-pulse" />
            <h3 className="text-xs font-black text-slate-900">تنبيهات انقضاء تراخيص الأصول وصلاحيتها</h3>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {assets.filter(a => {
              if (!a.expiryDate) return false;
              const expTime = new Date(a.expiryDate).getTime();
              const nowTime = new Date('2026-06-01').getTime();
              const diffDays = (expTime - nowTime) / (1000 * 3600 * 24);
              return diffDays > 0 && diffDays <= 45; // Approaching expiry (45 days window)
            }).map((al: any, idx: number) => (
              <div key={idx} className="bg-rose-50 p-3 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <h4 className="text-sm font-black text-rose-955 line-clamp-1" title={al.name}>{al.name}</h4>
                    <span className="text-xs text-slate-600">للمنصة العدالة لتمكين الحيازة: {al.clientName}</span>
                  </div>
                </div>

                <div className="text-left font-sans shrink-0">
                  <strong className="text-xs text-rose-800 block">ينتهي في:</strong>
                  <span className="text-xs bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full mt-0.5 inline-block font-bold">
                    {al.expiryDate}
                  </span>
                </div>
              </div>
            ))}
            
            {assets.filter(a => {
              if (!a.expiryDate) return false;
              const expTime = new Date(a.expiryDate).getTime();
              const nowTime = new Date('2026-06-01').getTime();
              const diffDays = (expTime - nowTime) / (1000 * 3600 * 24);
              return diffDays > 0 && diffDays <= 45;
            }).length === 0 && (
              <div className="text-center text-slate-500 text-xs py-4 bg-sky-50 rounded-xl border border-slate-200">
                لا توجد أصول تقترب من انتهاء الصلاحية حالياً.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Filter and Search controls */}
      <div className="bg-sky-50 border border-slate-200 rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute right-3.5 top-3 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="ابحث باسم الأصل المسجل، اسم العميل، أو قضية الارتباط..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all font-sans shadow-sm"
          />
        </div>

        {/* Category Select Filter */}
        <div className="w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white text-slate-800 text-xs py-2 px-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-sans shadow-sm"
          >
            <option value="all">كل مجالات التصنيف والأصول</option>
            <option value="real_estate">ممتلكات وعقارات وأراضٍ</option>
            <option value="stocks">أوراق مالية ومحافظ بنكية</option>
            <option value="machinery">معدات صناعية وغطاء تشغيلي</option>
            <option value="cash">سيولة نقدية وأرصدة بنكية</option>
          </select>
        </div>

      </div>

      {/* Legal Assets list components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssets.map((asset) => (
          <div 
            key={asset.id}
            className="bg-sky-50 border border-slate-200 rounded-3xl p-5 transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    asset.category === 'real_estate' ? 'bg-amber-100 text-amber-805 border border-amber-200' :
                    asset.category === 'stocks' ? 'bg-blue-105 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-250'
                  }`}>
                    {asset.category === 'real_estate' ? '🏢 عقار ومباني' :
                     asset.category === 'stocks' ? '📈 أوراق مالية وأسهم' :
                     asset.category === 'machinery' ? '🏭 مصانع ومعدات' : '💰 نقد واستثمارات'}
                  </span>
                  {asset.confidentiality && (
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      asset.confidentiality === 'سري للغاية' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      asset.confidentiality === 'سري' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {asset.confidentiality === 'سري للغاية' ? '🔴 سري للغاية' : asset.confidentiality === 'سري' ? '🟠 سري' : '🟢 عام'}
                    </span>
                  )}
                </div>
                
                <span className="text-xs text-slate-650 font-mono">تاريخ الحيازة: {asset.acquisitionDate}</span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 mt-3">{asset.name}</h3>
              
              <div className="grid grid-cols-2 gap-4 mt-3 bg-sky-100/50 p-3 rounded-2xl border border-slate-200 text-xs font-sans">
                <div>
                  <span className="text-slate-700 text-[9.5px] block font-bold">العميل المالك للأصل:</span>
                  <span className="text-slate-900 mt-1 font-semibold block">{asset.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-700 text-[9.5px] block font-bold">القيمة التقديرية (SAR):</span>
                  <span className="text-amber-700 font-extrabold mt-1 block">{(asset.value).toLocaleString()} ر.س</span>
                </div>
              </div>

              {/* Linked Case display directly */}
              <div className="mt-3 bg-blue-50/70 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between text-sm font-sans">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                  <span className="text-slate-900 font-medium truncate max-w-[200px]">الملف القضائي: {asset.linkedCaseName}</span>
                </div>
                <span className="text-xs text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md font-mono">رقم {asset.linkedCaseNumber}</span>
              </div>

              {asset.expiryDate && (() => {
                 const expTime = new Date(asset.expiryDate).getTime();
                 const nowTime = new Date('2026-06-01').getTime(); // using current context time
                 const diffDays = Math.ceil((expTime - nowTime) / (1000 * 3600 * 24));
                 if (diffDays > 0 && diffDays <= 30) {
                   return (
                     <div className="mt-2 bg-rose-50 border border-rose-200 shadow-sm shadow-rose-200/20 p-2 rounded-xl flex items-center justify-between text-sm font-sans">
                       <div className="flex items-center gap-1.5">
                         <span className="text-sm">⚠️</span>
                         <span className="text-rose-800 font-bold">تنبيه: اقتراب انتهاء الوكالة / الترخيص:</span>
                       </div>
                       <span className="text-xs text-rose-850 bg-rose-100 px-2 py-0.5 rounded-full font-bold">بعد {diffDays} يوماً</span>
                     </div>
                   );
                 }
                 return null;
              })()}

              <p className="text-[10.5px] text-slate-800 leading-relaxed font-sans mt-3 border-r-2 border-slate-300 pr-2.5">
                {asset.notes}
              </p>
            </div>

            <div className="border-t border-slate-200 pt-3 mt-4 flex items-center justify-between text-xs">
              <span className="text-[9.5px] text-slate-500">حصر وتثبيت قانوني مادة 18</span>
              <button 
                onClick={() => handleDeleteAsset(asset.id)}
                className="text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="إلغاء حصر الأصل"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إلغاء حصر وتثبيت</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal Dialog Form */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span>💎 قيد وتثبيت أصل مالي عالي القيمة للمصنع</span>
              </h2>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-500 text-xl font-bold font-sans"
              >
                إغلاق ×
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="text-sm text-slate-800 font-bold block mb-1">اسم ومسمى الأصل المالي:</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: أسهم محفظة الراجحي المالية"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-800 font-bold block mb-1">تصنيف وباب الأصل:</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-slate-900 focus:outline-none font-sans"
                  >
                    <option value="real_estate">🏢 عقار وممتلكات عقارية</option>
                    <option value="stocks">📊 أوراق مالية ومحافظ</option>
                    <option value="machinery">🏭 خطوط إنتاج ومعدات</option>
                    <option value="cash">💸 أرصدة وسيولة نقدية</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-800 font-bold block mb-1">العميل المالك ذو الامتلاك:</label>
                  <select
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="">-- اختر العميل --</option>
                    {clients.map((cl, i) => (
                      <option key={i} value={cl.name}>{cl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="text-sm text-slate-800 font-bold block mb-1">القيمة التقديرية بالريال السعودي (ر.س):</label>
                  <input 
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="مثال: 5000000"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-800 font-bold block mb-1">تاريخ الحيازة للمستند:</label>
                  <input 
                    type="date"
                    value={newAcqDate}
                    onChange={(e) => setNewAcqDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="text-sm text-slate-800 font-bold block mb-1">المنطقة الجغرافية:</label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="الرياض">الرياض</option>
                    <option value="مكة المكرمة">مكة المكرمة</option>
                    <option value="المدينة المنورة">المدينة المنورة</option>
                    <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                    <option value="جدة">جدة</option>
                    <option value="القصيم">القصيم</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-800 font-bold block mb-1">مستوى السرية (اختياري):</label>
                  <select
                    value={newConfidentiality}
                    onChange={(e) => setNewConfidentiality(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="عام">عام</option>
                    <option value="سري">سري</option>
                    <option value="سري للغاية">سري للغاية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-800 font-bold block mb-1">ربط الأصل بملف القضية المنظورة مباشرة:</label>
                <select
                  value={newLinkedCase}
                  onChange={(e) => setNewLinkedCase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-slate-900 focus:outline-none font-sans"
                >
                  <option value="">-- اختر القضية المراد ربطها --</option>
                  {cases.map((cs, i) => (
                    <option key={i} value={cs.caseNumber}>{cs.caseName} (رقم: {cs.caseNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-800 font-bold block mb-1">مذكرات وحواشي حصر الحيازة:</label>
                <textarea 
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="وصف تفصيلي لحالة الأصل، شهادات وثائق التمليك أو رخص البناء والتشغيل..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-slate-100 text-slate-800 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer border border-slate-300 transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="bg-amber-500 text-slate-950 font-black py-2 px-6 rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/10 active:scale-95 transition-all animate-none"
                >
                  تثبيت وقيد الأصل المالي 💎
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
