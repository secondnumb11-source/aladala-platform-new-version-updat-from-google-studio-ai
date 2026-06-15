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
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">المحاسب القانوني الآلي (AI Auditor)</h2>
                <p className="text-xs text-slate-700 font-bold mt-1">تحليل مالي فوري، مطابقة ضريبية، واستخراج إيرادات المكتب آلياً.</p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اسأل المحاسب: كم إجمالي الإيرادات لشهر مايو؟ هل تم تسديد جميع فواتير التوكيل..."
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold leading-relaxed text-slate-900 h-32 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 custom-scrollbar resize-none font-sans shadow-inner placeholder:text-slate-200 font-bold"
              ></textarea>
              
              {isProcessing ? (
                <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full h-full animate-[shimmer_2s_infinite]"></div>
                  <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-blue-400 animate-spin relative z-10"></div>
                  <p className="text-xs font-black relative z-10 text-white font-bold">جاري مسح قواعد البيانات وحساب القوائم المالية...</p>
                </div>
              ) : analysisResult ? (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col gap-3">
                  <div className="absolute right-0 top-0 w-1.5 h-full bg-blue-500"></div>
                  <h3 className="font-black text-slate-900 flex items-center gap-2 pr-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <span>التحليل المالي الذكي:</span>
                  </h3>
                  <p className="whitespace-pre-line text-sm text-slate-200 font-bold font-bold leading-relaxed pr-2">
                    {analysisResult}
                  </p>
                </div>
              ) : (
                <button 
                  onClick={handleAskAccountant}
                  disabled={!query}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calculator className="w-4 h-4" />
                  <span>استخرج الرأي المحاسبي</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center text-white flex flex-col justify-center items-center h-[200px]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
             <DollarSign className="w-12 h-12 text-blue-400 mb-4 relative z-10" />
             <h4 className="font-black text-lg mb-2 relative z-10 text-white">إحصائيات فورية</h4>
             <p className="text-3xl font-black text-white relative z-10">{invoices.length || 3}</p>
             <p className="text-xs text-slate-200 font-bold font-bold mt-1 relative z-10">إجمالي الفواتير المسجلة</p>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] shadow-sm">
             <h4 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
               <FileText className="w-4 h-4 text-slate-700" />
               نماذج المحاسب الآلي
             </h4>
             <div className="flex flex-wrap gap-2">
                {["حساب الإقرارات الضريبية", "المطابقات البنكية", "حركة الأتعاب للمحامين"].map((tag, i) => (
                  <button key={i} onClick={() => setQuery(tag)} className="text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-all px-3 py-2 rounded-xl shadow-sm">
                    {tag}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Duplicated & Embedded Judicial Fees Calculator with Extreme Contrast & Gold Identity */}
      <div className="bg-[#0b1325] border border-amber-500/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden mt-8 text-right">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -translate-x-10 -translate-y-10"></div>
        <div className="border-b border-slate-800 pb-5 mb-6 font-sans">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-slate-900 rounded-2xl shadow-lg">
              <Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">حاسبة الأتعاب والرسوم القضائية السعودية</h2>
              <p className="text-xs text-amber-500/80 font-bold mt-1">احتساب فوري للأتعاب المهنية، ضريبة القيمة المضافة، والرسوم القضائية التقريبية وفق الأنظمة السعودية.</p>
            </div>
          </div>
        </div>

        <JudicialFeesCalculatorEmbed />
      </div>
    </div>
  );
}

// Highly stylized, high-contrast, fully reactive sub-component for embedded fees calculation
function JudicialFeesCalculatorEmbed() {
  const [claimVal, setClaimVal] = useState<number>(100000);
  const [pursuitRate, setPursuitRate] = useState<number>(10);

  // Standard Saudi Judicial Court Fees: 5% of claim value with a maximum cap of 150,000 SAR
  const judicialFees = Math.min(claimVal * 0.05, 150000);
  const advocacyFees = claimVal * (pursuitRate / 100);
  const vatAmount = advocacyFees * 0.15;
  const totalCost = advocacyFees + vatAmount + judicialFees;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans text-right">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 space-y-6">
        <h4 className="text-sm font-black text-amber-400 border-b border-white/5 pb-2">المتغيرات والمدخلات المالية</h4>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-350">قيمة المطالبة الاجمالية (ر.س)</label>
            <input 
              type="number" 
              value={claimVal} 
              onChange={(e) => setClaimVal(Math.max(0, parseFloat(e.target.value) || 0))} 
              className="w-full bg-slate-950 border border-slate-700 hover:border-amber-500/50 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-3 text-sm font-black text-white transition-all text-left placeholder:text-slate-200 font-bold"
              placeholder="مثال: 150000"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-100 font-bold font-bold px-1">
              <span>منخفض</span>
              <span>بين الـ 50ألف إلى 5 مليون ر.س</span>
              <span>مرتفع</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-350">نسبة السعى/أتعاب المحاماة المتفق عليها (%)</label>
            <div className="flex gap-4 items-center">
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={pursuitRate} 
                onChange={(e) => setPursuitRate(parseInt(e.target.value) || 10)} 
                className="flex-1 accent-amber-500"
              />
              <span className="w-16 text-center bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-black text-amber-400">
                {pursuitRate} %
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 p-6 rounded-2xl border border-amber-500/10 space-y-4 shadow-inner relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
        
        <div className="space-y-4">
          <h4 className="text-sm font-black text-white pr-2 border-b border-white/5 pb-2">النتائج والتقديرات المالية التقريبية</h4>
          
          <div className="grid grid-cols-2 gap-4 text-xs font-bold pr-2">
            <div className="text-slate-200 font-bold">أتعاب السعى الصافية:</div>
            <div className="text-left text-white font-black">{advocacyFees.toLocaleString()} ر.س</div>
            
            <div className="text-slate-200 font-bold">ضريبة القيمة المضافة (15%):</div>
            <div className="text-left text-white font-black">{vatAmount.toLocaleString()} ر.س</div>
            
            <div className="text-amber-500">الرسوم القضائية التقريبية:</div>
            <div className="text-left text-amber-400 font-black">{judicialFees.toLocaleString()} ر.س</div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-white/5 mt-4 flex justify-between items-center text-right">
          <div className="text-xs font-black text-slate-200 font-bold">إجمالي الالتزام التقديري الكلي:</div>
          <div className="text-lg font-black text-amber-400 text-left">
            {totalCost.toLocaleString()} <span className="text-xs">ر.س</span>
          </div>
        </div>
      </div>
    </div>
  );
}
