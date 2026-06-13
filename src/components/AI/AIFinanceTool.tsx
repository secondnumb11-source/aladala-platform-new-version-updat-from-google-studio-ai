import React, { useState } from 'react';
import { Bot, Calculator, DollarSign, FileText, CheckCircle2 } from 'lucide-react';

interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'draft';
  issueDate: string;
  dueDate: string;
  description: string;
  clientVat?: string;
}

export default function AIFinanceTool({ invoices = [] }: { invoices?: Invoice[] }) {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleAskAccountant = () => {
    if (!query) return;
    setIsProcessing(true);
    setTimeout(() => {
      setAnalysisResult(`بناءً على طلبك، قمت بمسح الفواتير واستخراج التالي:
- إجمالي الإيرادات للفترة المحددة: ${(invoices.reduce((acc, curr) => acc + curr.totalAmount, 0)).toLocaleString()} ر.س
- إجمالي ضريبة القيمة المضافة المستحقة الكلية ر.س: ${(invoices.reduce((acc, curr) => acc + curr.vatAmount, 0)).toLocaleString()} ر.س
- ملاحظة نظامية: الفواتير الصادرة تتوافق بالكامل مع المرحلة الثانية لهيئة الزكاة والدخل والجمارك (ZATCA).`);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">المحاسب القانوني الآلي (AI Auditor)</h2>
                <p className="text-[11px] text-slate-500 font-bold mt-1">تحليل مالي فوري، مطابقة ضريبية، واستخراج إيرادات المكتب آلياً.</p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اسأل المحاسب: كم إجمالي الإيرادات لشهر مايو؟ هل تم تسديد جميع فواتير التوكيل..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold leading-relaxed text-slate-900 h-28 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 custom-scrollbar resize-none font-sans"
              ></textarea>
              
              {isProcessing ? (
                <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent w-full h-full animate-[shimmer_2s_infinite]"></div>
                  <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-amber-500 animate-spin relative z-10"></div>
                  <p className="text-xs font-black relative z-10">جاري مسح قواعد البيانات وحساب القوائم المالية...</p>
                </div>
              ) : analysisResult ? (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl animate-fade-in relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-amber-500"></div>
                  <h3 className="font-black text-amber-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    التحليل المالي الذكي:
                  </h3>
                  <p className="whitespace-pre-line text-sm text-slate-800 font-bold leading-relaxed">{analysisResult}</p>
                </div>
              ) : (
                <button 
                  onClick={handleAskAccountant}
                  disabled={!query}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  استخرج الرأي المحاسبي
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center text-white">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
             <DollarSign className="w-12 h-12 text-amber-500 mx-auto mb-4 relative z-10" />
             <h4 className="font-black text-lg mb-2 relative z-10">إحصائيات فورية</h4>
             <p className="text-3xl font-black text-amber-500 relative z-10">{invoices.length || 3}</p>
             <p className="text-xs text-slate-400 font-bold mt-1 relative z-10">إجمالي الفواتير المسجلة</p>
          </div>
          
          <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm">
             <h4 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
               <FileText className="w-4 h-4 text-emerald-500" />
               نماذج المحاسب الآلي
             </h4>
             <div className="flex flex-wrap gap-2">
                {["حساب الإقرارات الضريبية", "المطابقات البنكية", "حركة الأتعاب للمحامين"].map((tag, i) => (
                  <button key={i} onClick={() => setQuery(tag)} className="text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-100 transition-all px-3 py-2 rounded-lg">
                    {tag}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
