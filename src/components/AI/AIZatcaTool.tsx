import React, { useState } from 'react';
import { 
  CheckCircle2, 
  QrCode, 
  UploadCloud, 
  CreditCard, 
  ShieldCheck, 
  RefreshCw,
  Terminal,
  Activity,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';

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
  isZatcaSubmitted?: boolean;
}

export default function AIZatcaTool({ invoices = [] }: { invoices?: Invoice[] }) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitLogs, setSubmitLogs] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeGateway, setActiveGateway] = useState<'mada' | 'stcpay' | 'applepay' | 'visa'>('mada');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentLogs, setPaymentLogs] = useState<string[]>([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Filter invoices for selection (those not processed, or just standard list)
  const availableInvoices = invoices.length > 0 ? invoices : [
    { id: 'INV-1002', clientName: 'شركة الرياض اللوجستية', amount: 45000, vatAmount: 6750, totalAmount: 51750, status: 'paid', issueDate: '2026-05-15', dueDate: '2026-06-15', description: 'أتعاب صياغة اللائحة الإعتراضية بجهة النزاع' },
    { id: 'INV-1003', clientName: 'مؤسسة الابتكار البرمجي', amount: 12000, vatAmount: 1800, totalAmount: 13800, status: 'unpaid', issueDate: '2026-05-18', dueDate: '2026-06-18', description: 'الدفعة الأولى من صياغة إتفاقية الاستثمار' },
    { id: 'INV-1004', clientName: 'مجموعة التميمي القابضة', amount: 89000, vatAmount: 13350, totalAmount: 102350, status: 'paid', issueDate: '2026-05-20', dueDate: '2026-06-20', description: 'تمثيل قانوني في الاستئناف العمالي الشامل' }
  ] as Invoice[];

  const handleZatcaSubmit = () => {
    if (!selectedInvoiceId) return;
    setIsSubmitting(true);
    setSubmitLogs([]);
    setSubmitSuccess(false);

    const steps = [
      '[ZATCA] تهيئة خوارزمية الربط العالي للبنية والرموز...',
      `[ZATCA] فحص مصفوفة الفاتورة ومعرف UUID: ${Math.random().toString(36).substring(7).toUpperCase()}`,
      '[ZATCA] استخراج التوقيع الرقمي المشفر والممتثل للمرحلة الثانية...',
      '[ZATCA] تقديم الطلب الموثق لمنصة فاتورة (Fatoora) بـ Sandbox...',
      '[ZATCA] استجابة ناجحة بالرمز 201 (تم الاعتماد والأرشفة الضريبية بنجاح)'
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setSubmitLogs(prev => [...prev, step]);
        if (index === steps.length - 1) {
          setIsSubmitting(false);
          setSubmitSuccess(true);
        }
      }, (index + 1) * 600);
    });
  };

  const handleSimulatePayment = () => {
    if (!selectedInvoiceId) return;
    setIsPaying(true);
    setPaymentLogs([]);
    setPaymentSuccess(false);

    const steps = [
      `[الدفع] الربط مع بوابة التحصيل الحكومية عبر شبكة ${activeGateway.toUpperCase()}...`,
      '[الدفع] التحقق من سلامة البطاقة وهاتف العميل المفعل...',
      '[الدفع] إرسال OTP المشفر لتفادي المخاطر المالية...',
      '[الدفع] تم تحصيل قيمة أتعاب العميل بنجاح وقيدها في السجل المالي للمكتب.',
      '[الدفع] جاري المزامنة التلقائية مع الهيئة العامة للزكاة والضريبة والجمارك (ZATCA)...',
      '[ZATCA] تم إصدار الفاتورة المعتمدة وتحديث الـ QR Code الضريبي مطوعاً بالامتثال!'
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setPaymentLogs(prev => [...prev, step]);
        if (index === steps.length - 1) {
          setIsPaying(false);
          setPaymentSuccess(true);
        }
      }, (index + 1) * 500);
    });
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-1 md:p-3" dir="rtl" id="zatca-tool-container">
      {/* Visual Header Banner - Clean, High Contrast Slate Metallic Style */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 border border-slate-800 p-8 md:p-10 shadow-xl text-high-contrast-light-bg">
        <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
          <QrCode className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                الربط الإلكتروني والامتثال
              </span>
              <span className="text-[10px] bg-slate-800 text-white font-bold font-bold px-3 py-1 rounded-full border border-slate-700">
                المرحلة الثانية (Phase 2)
              </span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight leading-tight">
              مركز الفوترة الإلكترونية وبوابات الدفع (ZATCA Portal)
            </h1>
            <p className="text-white font-bold max-w-2xl text-xs md:text-sm font-medium leading-relaxed">
              مراقبة وتصميم الفواتير المتكاملة والموقعة إلكترونياً مع مصلحة الضرائب وهيئة الزكاة والضريبة والجمارك السعودية، بالإضافة لربط تحصيلات بطاقات الدفع الفورية.
            </p>
          </div>
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-slate-200 font-bold font-bold font-mono">ENCRYPTED LINK</div>
              <div className="text-xs text-emerald-400 font-black">حالة الامتثال: متصل ونشط</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: بوابات الدفع الإلكتروني الالي */}
        <div className="bg-[#0a1628] border border-[#1e3a5f]/80 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="p-3 bg-slate-50 border border-[#1e3a5f] text-slate-800 rounded-2xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">بوابات الدفع الإلكتروني الآلي (Saudi Payment Gateways)</h3>
                <p className="text-xs text-slate-700 font-bold mt-1">تسهيل تحصيل أتعاب القضايا والاستشارات عبر مدى، STC Pay، وApple Pay</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">1. اختر الفاتورة المراد تحصيلها:</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    setPaymentLogs([]);
                    setPaymentSuccess(false);
                    setSubmitLogs([]);
                    setSubmitSuccess(false);
                  }}
                  className="w-full bg-slate-50 border border-[#1e3a5f] p-4 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-[#0a1628] focus:border-slate-900 focus:ring-4 focus:ring-slate-950/5 transition-all cursor-pointer"
                >
                  <option value="">-- اختر مطالبة موكل أو فاتورة معلقة للربط --</option>
                  {availableInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.id} - {inv.clientName} [الإجمالي: {inv.totalAmount.toLocaleString()} ر.س]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">2. حدد شبكة الدفع الفوري الآمنة:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { id: 'mada', label: 'مدى mada' },
                    { id: 'stcpay', label: 'stc pay' },
                    { id: 'applepay', label: 'Apple Pay' },
                    { id: 'visa', label: 'البطاقات الائتمانية' }
                  ].map(gateway => (
                    <button
                      key={gateway.id}
                      onClick={() => setActiveGateway(gateway.id as any)}
                      className={`p-3.5 rounded-xl text-xs font-black transition-all border text-center cursor-pointer ${
                        activeGateway === gateway.id 
                          ? 'bg-slate-950 text-white border-slate-950 shadow-md text-high-contrast-light-bg' 
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-[#1e3a5f]/60'
                      }`}
                    >
                      {gateway.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <button
              onClick={handleSimulatePayment}
              disabled={isPaying || !selectedInvoiceId}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPaying ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <CreditCard className="w-4 h-4 text-emerald-400" />}
              <span>{isPaying ? 'جاري التحصيل والتبادل الآمن للبيانات...' : 'أرسل أمر الدفع الفوري للموكل'}</span>
            </button>

            {/* Sim Logs Dashboard Console style */}
            {(paymentLogs.length > 0 || isPaying) && (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-inner max-h-[190px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-mono font-bold text-slate-700 tracking-wider flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-emerald-400" /> LOCAL_GATEWAY_TERMINAL
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-emerald-400/90 text-left">
                  {paymentLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">{log}</div>
                  ))}
                  {isPaying && (
                    <div className="text-yellow-400 animate-pulse flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                      مزامنة خوادم سداد الحكومية...
                    </div>
                  )}
                </div>
                {paymentSuccess && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-right text-xs font-bold leading-relaxed">
                    🎉 تم تحصيل الأتعاب بنجاح! تم حفظ السجل الضريبي وإصدار توقيع تشفير الهيئة (ZATCA compliant QR) وتثبيته في كشف العميل.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: زاتكا والربط الإلزامي */}
        <div className="bg-[#0a1628] border border-[#1e3a5f]/80 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="p-3 bg-slate-50 border border-[#1e3a5f] text-slate-800 rounded-2xl">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">بوابة ZATCA والاعتماد الفوري لهيئة الزكاة والجمارك</h3>
                <p className="text-xs text-slate-700 font-bold mt-1">تسجيل الفواتير ضريبياً والتحقق من طوابع التشفير والأرشفة</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-[#1e3a5f]/60 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <Cpu className="w-4 h-4 text-slate-700" />
                <span>بيانات التشفير وخوارزميات الامتثال المعتمدة:</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5 text-[10px] font-bold">
                <div className="bg-[#0a1628] p-3 border border-[#1e3a5f]/60 rounded-xl shadow-xs">
                  <span className="text-slate-700 block font-bold mb-1">شهادة تشفير الربط (CCSID)</span>
                  <span className="text-slate-900 font-extrabold font-mono text-[11px] block">ZATCA Cryptographic ID</span>
                </div>
                <div className="bg-[#0a1628] p-3 border border-[#1e3a5f]/60 rounded-xl shadow-xs">
                  <span className="text-slate-700 block font-bold mb-1">إصدار الهيكل (Schema)</span>
                  <span className="text-slate-900 font-extrabold font-mono text-[11px] block">XML Schema Standard V2</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <button
              onClick={handleZatcaSubmit}
              disabled={isSubmitting || !selectedInvoiceId}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <UploadCloud className="w-4 h-4 text-emerald-400" />}
              <span>{isSubmitting ? 'جاري توقيع وتقديم الفاتورة ضريبياً...' : 'إرسال الفاتورة ضريبياً والاعتماد الآن'}</span>
            </button>

            {/* Submission logs */}
            {(submitLogs.length > 0 || isSubmitting) && (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-inner max-h-[190px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-mono font-bold text-slate-700 tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" /> ZATCA_FATOORA_CONFORMITY_CON
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-emerald-300/90 text-left">
                  {submitLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">{log}</div>
                  ))}
                  {isSubmitting && (
                    <div className="text-yellow-400 animate-pulse flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                      توليد بصمة الفاتورة (Invoice Hash)...
                    </div>
                  )}
                </div>
                {submitSuccess && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-right text-xs font-bold leading-relaxed">
                    ✅ تم التحقق الضريبي وتقديم المستندات والاعتماد في بوابة الهيئة (Fatoora Phase II). الفاتورة الآن رسمية ومسجلة بالأرشيف العام.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs Table - Beautiful high contrast elegant list */}
      <div className="bg-[#0a1628] border border-[#1e3a5f]/80 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">سجل الامتثال للفواتير الضريبية (ZATCA Compliance Invoices)</h3>
              <p className="text-xs text-slate-700 font-bold mt-0.5">تفاصيل الفواتير المسجلة بمصلحة الضرائب لتقارير ضريبة القيمة المضافة 15%</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#1e3a5f] text-slate-700 text-xs font-black">
                <th className="py-4.5 px-6 font-semibold">الرقم المرجعي</th>
                <th className="py-4.5 px-6 font-semibold">الموكل / العميل</th>
                <th className="py-4.5 px-6 font-semibold">مبلغ الضريبة (15% VAT)</th>
                <th className="py-4.5 px-6 font-semibold">المبلغ الإجمالي المعتمد</th>
                <th className="py-4.5 px-6 font-semibold text-center">أثر بوابة المزامنة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900 font-bold text-sm">
              {availableInvoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4.5 px-6 font-mono text-xs text-slate-200 font-bold">#{inv.id}</td>
                  <td className="py-4.5 px-6 font-black text-slate-900">{inv.clientName}</td>
                  <td className="py-4.5 px-6 font-mono text-slate-700 text-xs">{inv.vatAmount.toLocaleString()} ر.س</td>
                  <td className="py-4.5 px-6 font-mono text-slate-900">{inv.totalAmount.toLocaleString()} ر.س</td>
                  <td className="py-4.5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/40">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      معتمد ومحصّل ضريبياً
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
