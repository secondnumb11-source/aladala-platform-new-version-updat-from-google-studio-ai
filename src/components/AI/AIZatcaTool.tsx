import React, { useState } from 'react';
import { 
  CheckCircle2, 
  QrCode, 
  UploadCloud, 
  CreditCard, 
  Bot, 
  ShieldCheck, 
  RefreshCw,
  TrendingUp, 
  DollarSign 
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
      `[ZATCA] فحص مصفوفة الفاتورة ومعرف UUID: ${Math.random().toString(36).substring(7)}`,
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
      }, (index + 1) * 800);
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
      }, (index + 1) * 700);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Upper Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 rounded-[2.5rem] border border-emerald-700/40 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <QrCode className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-display font-black tracking-tight text-amber-400">الفواتير المعتمدة وتقارير الربط الضريبي والمدفوعات (ZATCA Portal)</h2>
          </div>
          <p className="text-white max-w-3xl leading-relaxed text-sm font-bold">
            تسجيل ومزامنة الفواتير كلياً مع منصة فاتورة التابعة لهيئة الزكاة والضريبة والجمارك (ZATCA Phase 2)، 
            إضافة لإدارة بوابات السداد المحلية والتحصيلات الإلكترونية الفورية المتوافقة لمحامي العدالة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tab 1: بوابات الدفع الإلكتروني الالي */}
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">بوابات الدفع الإلكتروني الآلي (Saudi Payment Gateways)</h3>
              <p className="text-[11px] text-slate-500 font-bold mt-1">تسهيل دفع وسداد أتعاب الموكلين عبر شبكة مدى وسداد والبطاقات الإئتمانية</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">1. اختر الفاتورة المراد تحصيلها:</label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  setPaymentLogs([]);
                  setPaymentSuccess(false);
                  setSubmitLogs([]);
                  setSubmitSuccess(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500 transition-all font-sans"
              >
                <option value="">-- حدد مطالبة أو فاتورة من اللائحة --</option>
                {availableInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} - العميل: {inv.clientName} - المبلغ: {inv.totalAmount.toLocaleString()} ر.س
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">2. حدد بوابة الدفع التلقائي المعتمدة:</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'mada', label: 'مدى mada' },
                  { id: 'stcpay', label: 'stc pay' },
                  { id: 'applepay', label: 'Apple Pay' },
                  { id: 'visa', label: 'بطاقة ائتمان' }
                ].map(gateway => (
                  <button
                    key={gateway.id}
                    onClick={() => setActiveGateway(gateway.id as any)}
                    className={`p-3 rounded-xl text-[10px] font-black transition-all border text-center ${
                      activeGateway === gateway.id 
                        ? 'bg-slate-900 text-white border-amber-500 shadow-md' 
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}
                  >
                    {gateway.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={isPaying || !selectedInvoiceId}
              className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isPaying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 text-amber-400" />}
              <span>{isPaying ? 'جاري السداد والربط...' : 'دفع أوتوماتيكي وتسجيل الفاتورة'}</span>
            </button>

            {/* Sim Logs */}
            {(paymentLogs.length > 0 || isPaying) && (
              <div className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono whitespace-pre-wrap text-left text-emerald-400 border border-slate-800 leading-normal max-h-[180px] overflow-y-auto">
                {paymentLogs.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))}
                {isPaying && <div className="text-amber-400 animate-pulse">جاري الاستعلام والمزامنة...</div>}
                {paymentSuccess && (
                  <div className="text-white bg-emerald-500/20 px-3 py-2 rounded border border-emerald-500/30 mt-3 text-right">
                    ✅ تم السداد وحفظه بنجاح! تم الامتثال ورفع مستندات QR المشفرة لمنصة الهيئة (ZATCA).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab 2: زاتكا والربط الإلزامي */}
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">بوابة ZATCA والاعتماد الفوري لهيئة الزكاة والجمارك</h3>
              <p className="text-[11px] text-slate-500 font-bold mt-1">المرحلة الثانية للربط التقني والفني للتكامل مع الفواتير الضريبية</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">فحص يدوي ورفع الفاتورة لمنصة الهيئة:</label>
              <button
                onClick={handleZatcaSubmit}
                disabled={isSubmitting || !selectedInvoiceId}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>{isSubmitting ? 'جاري الرفع والاعتماد الضريبي...' : 'إرسال مباشر لهيئة الزكاة والضريبة (Send to ZATCA v2)'}</span>
              </button>
            </div>

            {/* Submission logs */}
            {(submitLogs.length > 0 || isSubmitting) && (
              <div className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono whitespace-pre-wrap text-left text-emerald-400 border border-slate-800 leading-normal max-h-[180px] overflow-y-auto">
                {submitLogs.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))}
                {isSubmitting && <div className="text-amber-400 animate-pulse">جاري التحقق من التشفير...</div>}
                {submitSuccess && (
                  <div className="text-white bg-emerald-500/20 px-3 py-2 rounded border border-emerald-500/30 mt-3 text-right">
                    ✅ تم الاعتماد القانوني والتحقق من التوقيع الرقمي بنجاح!
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-slate-800">بيانات التشفير والامتثال الحالية:</h4>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                <div className="bg-white p-2 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block font-normal">نوع شهادة الربط</span>
                  <span className="text-slate-800 font-extrabold leading-relaxed">Cryptographic ID (CCSID)</span>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block font-normal">نسخة التوافق</span>
                  <span className="text-slate-800 font-extrabold leading-relaxed">ZATCA XML V2 Schema</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="font-black text-slate-900 text-lg">سجل الامتثال للفواتير الضريبية (ZATCA Approved Invoices Ledger)</h3>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">جميع الفواتير والعمليات المحصلة بالاتصال الفوري والتوقيع المترابط</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase">الرقم المرجعي</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase">العميل</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase">الضريبة (VAT)</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase">الإجمالي</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase text-center">أثر بوابة المزامنة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {availableInvoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500">#{inv.id}</td>
                  <td className="py-4 px-6 font-bold text-sm text-slate-900">{inv.clientName}</td>
                  <td className="py-4 px-6 font-bold text-xs text-amber-600">{inv.vatAmount.toLocaleString()} ر.س</td>
                  <td className="py-4 px-6 font-black text-xs text-slate-900">{inv.totalAmount.toLocaleString()} ر.س</td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3" />
                      معتمد ومحصّل QR
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
