import React, { useState, useEffect } from "react";
import { Receipt, Plus, Search, Check, AlertCircle, FileSpreadsheet, Printer, X } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  caseNumber: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  status: "paid" | "unpaid" | "partially";
  issueDate: string;
  dueDate: string;
  category: "litigation" | "retainer" | "consultation";
}

export default function BillingInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPrintInvoice, setSelectedPrintInvoice] = useState<Invoice | null>(null);

  // Form states
  const [clientName, setClientName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("litigation");
  const [status, setStatus] = useState("unpaid");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/billing/invoices");
      if (resp.ok) {
        const data = await resp.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) return;

    try {
      const resp = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          caseNumber,
          amount,
          category,
          status
        })
      });

      if (resp.ok) {
        setSuccessMsg("تم إصدار تفاصيل فاتورة الدفع العدلية بنجاح!");
        setClientName("");
        setCaseNumber("");
        setAmount("");
        fetchInvoices();
        setTimeout(() => {
          setSuccessMsg("");
          setShowAddForm(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPending = invoices.filter(inv => inv.status !== "paid").reduce((sum, inv) => sum + inv.totalAmount, 0);

  const filteredInvoices = invoices.filter(inv => 
    inv.clientName.includes(searchQuery) ||
    inv.invoiceNumber.includes(searchQuery) ||
    inv.caseNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Brand & Stats Grid */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#c5a880] flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <span>المطالبات المالية والفوترة الضريبية (15% VAT)</span>
          </h2>
          <p className="text-xs text-slate-900  mt-1">حساب مستحقات الدعاوى، خطط الدفع المجدولة، وتوافق الفاتورة الإلكترونية السعودية.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#c5a880] text-[#061224] text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار فاتورة أتعاب جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
        <div className="bg-[#0b1e33] border border-[#c5a880]/15 p-4 rounded-xl">
          <span className="text-xs text-slate-900  font-bold block">إجمالي الفواتير المطالب بها</span>
          <strong className="text-xl text-slate-100 font-mono mt-1 block">
            {totalInvoiced.toLocaleString("ar-SA")} <span className="text-xs text-[#c5a880]">ر.س</span>
          </strong>
        </div>

        <div className="bg-[#0b1e33] border border-emerald-500 p-4 rounded-xl">
          <span className="text-xs text-emerald-400 font-bold block">الأتعاب المحصلة والمودعة</span>
          <strong className="text-xl text-emerald-400 font-mono mt-1 block">
            {totalPaid.toLocaleString("ar-SA")} <span className="text-xs text-emerald-500">ر.س</span>
          </strong>
        </div>

        <div className="bg-[#0b1e33] border border-amber-500 p-4 rounded-xl">
          <span className="text-xs text-amber-500 font-bold block">الأرصدة المستحقة قيد الانتظار</span>
          <strong className="text-xl text-amber-500 font-mono mt-1 block">
            {totalPending.toLocaleString("ar-SA")} <span className="text-xs text-amber-500">ر.س</span>
          </strong>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddInvoice} className="bg-[#0b1e33] border border-[#c5a880]/30 rounded-xl p-5 space-y-4 text-xs text-right">
          <h3 className="text-slate-200 font-bold border-b border-[#c5a880]/15 pb-2 text-sm">إصدار فاتورة أتعاب عدلية جديدة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-900 ">اسم العميل (العميل المستحق عليه):</label>
              <input
                type="text"
                required
                placeholder="مثال: شركة الفرسان للمقاولات"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">ربط القضية (رقم القضية بناجز - اختياري):</label>
              <input
                type="text"
                placeholder="مثال: 451029411"
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">المبلغ الأساسي للأتعاب (قبل الضريبة):</label>
              <input
                type="number"
                required
                placeholder="ر.س"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 font-mono"
              />
              <span className="text-xs text-amber-400 font-medium block mt-1">
                سيقوم النظام تلقائياً باحتساب 15% ضريبة القيمة المضافة السعودية المقررة نظامياً.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">تصنيف المطالبة / الباقة:</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              >
                <option value="litigation">أتعاب تمثيل وترافع أمام الدائرة</option>
                <option value="retainer">أتعاب اشتراك سنوي (مستشار دوري)</option>
                <option value="consultation">أتعاب تقديم استشارة قانونية مكتوبة</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">حالة المطالبة المبدئية:</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              >
                <option value="unpaid">بانتظار السداد (مستحقة)</option>
                <option value="paid">مسددة بالكامل (مرحّلة للبنك)</option>
                <option value="partially">مسددة جزئياً (تحت التوزيع)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#c5a880]/10">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-transparent border border-slate-700 text-slate-900  px-4 py-2 rounded font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-[#c5a880] text-[#061224] px-4 py-2 rounded font-bold"
            >
              إصدار الفاتورة المعتمدة
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-500 border border-emerald-500 text-emerald-400 p-2.5 rounded text-center font-bold">
              {successMsg}
            </div>
          )}
        </form>
      )}

      {/* Invoices List Panel */}
      <div className="bg-[#0b1e33] border border-[#c5a880]/20 rounded-xl p-5 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث برقم الفاتورة، العميل، رقم القضية..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded-lg p-2.5 pr-10 text-xs text-slate-100 placeholder-slate-500"
          />
          <Search className="w-4 h-4 text-slate-900  absolute right-3.5 top-3.5" />
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-900 ">جاري ترحيل وتوثيق السندات المالية...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-900 ">لا يوجد فواتير متاحة.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#c5a880]/10 text-slate-900 ">
                  <th className="py-2.5 px-3">رقم الفاتورة</th>
                  <th className="py-2.5 px-3">اسم جهة العميل</th>
                  <th className="py-2.5 px-3">رقم القضية المرتبط</th>
                  <th className="py-2.5 px-3 uppercase">المبلغ الأساسي</th>
                  <th className="py-2.5 px-3 uppercase">الضريبة 15%</th>
                  <th className="py-2.5 px-3 uppercase">المجموع الشامل</th>
                  <th className="py-2.5 px-3 text-center">حالة السداد</th>
                  <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                  <th className="py-2.5 px-3 text-center">الخيارات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-800 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{inv.clientName}</td>
                    <td className="py-3 px-3 font-mono text-slate-900 ">{inv.caseNumber || "أتعاب عامة غير معلنة"}</td>
                    <td className="py-3 px-3 font-mono text-slate-200">{(inv.amount || 0).toLocaleString()} ر.س</td>
                    <td className="py-3 px-3 font-mono text-slate-900 ">{(inv.vatAmount || 0).toLocaleString()} ر.س</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-100 bg-amber-500">{(inv.totalAmount || 0).toLocaleString()} ر.س</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                        inv.status === "paid" ? "bg-emerald-500 text-emerald-400" :
                        inv.status === "partially" ? "bg-blue-500 text-blue-400" :
                        "bg-red-500 text-red-500"
                      }`}>
                        {inv.status === "paid" ? "مسددة بالكامل" : inv.status === "partially" ? "مسددة جزئياً" : "غير مدفوعة"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 ">{inv.dueDate}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedPrintInvoice(inv)}
                        className="bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30[#c5a880][#061224] px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 mx-auto transition-all cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة السند</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Invoice Modal OVERLAY */}
      {selectedPrintInvoice && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white text-slate-900  rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Modal Actions Header (no-print) */}
            <div className="bg-[#0b1e33] text-white p-4 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#c5a880]" />
                <span className="font-bold text-sm">معاينة وطباعة الفاتورة الضريبية المبسطة</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#c5a880] text-[#061224] px-4.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>أمر الطباعة</span>
                </button>
                <button
                  onClick={() => setSelectedPrintInvoice(null)}
                  className="bg-sky-50 text-slate-900 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Container (Designed for crisp A4 style printer layout) */}
            <div id="section-to-print" className="p-8 bg-white text-slate-900  space-y-6 text-right font-sans">
              
              {/* Header: Office Branding and ZATCA QR block */}
              <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-slate-900 pb-5 gap-4">
                <div className="space-y-1 text-center md:text-right">
                  <h3 className="text-xl font-bold font-sans text-slate-900 ">مجموعة العدالة للمحاماة والاستشارات القانونية</h3>
                  <p className="text-xs text-slate-900 ">ترخيص وزارة العدل رقم: ٣٩/١٢٢ | عضو هيئة العملاء والمحاميين والمستشاريين القانونيين</p>
                  <p className="text-xs text-slate-900 ">الرياض، المملكة العربية السعودية | هاتف: ٩٢٠٠١٢٣٤٥</p>
                  <p className="text-xs text-slate-900 ">الرقم الضريبي الموحد: ٣١٠٢٩٤١٢٩٤٠٠٠٠٣</p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-800">
                  {/* Mock Cryptographic ZATCA QR Code representing base64 certified signature */}
                  <div className="text-center space-y-1">
                    <div className="w-20 h-20 bg-slate-200 border-2 border-slate-900 flex items-center justify-center p-1 relative mx-auto">
                      <div className="absolute inset-0 bg-contain opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]"></div>
                      {/* Generates a QR-like matrix style using nested divs */}
                      <div className="grid grid-cols-4 gap-0.5 w-full h-full">
                        <div className="bg-sky-50"></div><div className="bg-sky-50"></div><div className="bg-white"></div><div className="bg-sky-50"></div>
                        <div className="bg-white"></div><div className="bg-sky-50"></div><div className="bg-sky-50"></div><div className="bg-white"></div>
                        <div className="bg-sky-50"></div><div className="bg-white"></div><div className="bg-sky-50"></div><div className="bg-sky-50"></div>
                        <div className="bg-sky-50"></div><div className="bg-sky-50"></div><div className="bg-white"></div><div className="bg-sky-50"></div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-900  block">فلتر الفاتورة الإلكترونية المعتمد</span>
                  </div>
                  <div className="text-center font-serif text-slate-900  border-r border-slate-800 pr-3">
                    <span className="text-sm font-bold block">فاتورة ضريبية</span>
                    <span className="text-xs text-slate-900  block">Simplified Tax Invoice</span>
                  </div>
                </div>
              </div>

              {/* Invoice metadata fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-900 ">رقم الفاتورة الإقليمي: </span>
                    <strong className="text-slate-900  font-mono text-sm">{selectedPrintInvoice.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-900 ">تاريخ الإصدار والترحيل: </span>
                    <strong className="text-slate-900  font-mono">{selectedPrintInvoice.issueDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-900 ">تاريخ استحقاق السداد: </span>
                    <strong className="text-slate-900  font-mono">{selectedPrintInvoice.dueDate}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 md:border-r md:border-slate-800 md:pr-4">
                  <div>
                    <span className="text-slate-900 ">السادة العملاء / العميل: </span>
                    <strong className="text-slate-900 ">{selectedPrintInvoice.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-900 ">رقم القضية المرتبط: </span>
                    <strong className="text-slate-900  font-mono">{selectedPrintInvoice.caseNumber || "أتعاب استشارية عامة"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-900 ">نوع الخدمة العدلية: </span>
                    <strong className="text-slate-900 ">
                      {selectedPrintInvoice.category === "litigation" ? "الترافع أمام الجهات القضائية والمحاكم" :
                       selectedPrintInvoice.category === "retainer" ? "عقد استشارات سنوية دورية" : "استشارة قانونية خطية معتمدة"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Central Invoice items list */}
              <div className="border border-slate-800 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-900  border-b border-slate-800 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">بيان الخدمة القانونية المقدمة</th>
                      <th className="py-2.5 px-4 text-center">الكمية</th>
                      <th className="py-2.5 px-4 text-center">سعر الوحدة</th>
                      <th className="py-2.5 px-4 text-center">الخضع للضريبة</th>
                      <th className="py-2.5 px-4 text-center">المقدار الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4 text-slate-900  font-mono">١</td>
                      <td className="py-3 px-4 font-semibold">
                        {selectedPrintInvoice.category === "litigation" ? "تقديم خدمات ترافَع نظامي وبناء المذكرات الجوابية" :
                         selectedPrintInvoice.category === "retainer" ? "تقديم الاستشارات والتحوط للثغرات القانونية شهرياً" : "مراجعة وصياغة مذكرات الدفوع والمستندات القانونية"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">١</td>
                      <td className="py-3 px-4 text-center font-mono">{(selectedPrintInvoice.amount || 0).toLocaleString()} ر.س</td>
                      <td className="py-3 px-4 text-center font-mono">١٥٪</td>
                      <td className="py-3 px-4 text-center font-mono">{(selectedPrintInvoice.amount || 0).toLocaleString()} ر.س</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Subtotals & ZATCA calculation summary */}
              <div className="flex justify-end mt-4">
                <div className="w-full md:w-80 space-y-2 border-t-2 border-slate-900 pt-3 text-xs">
                  <div className="flex justify-between items-center text-slate-900 ">
                    <span>المجموع الأساسي (الخاضع للضريبة):</span>
                    <span className="font-mono text-slate-900 ">{(selectedPrintInvoice.amount || 0).toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 ">
                    <span>ضريبة القيمة المضافة الإلزامية (١٥٪):</span>
                    <span className="font-mono text-slate-900 ">{(selectedPrintInvoice.vatAmount || 0).toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-sm border-t border-slate-800 pt-2 text-slate-950 bg-slate-50 p-2.5 rounded-lg border border-slate-800">
                    <span>المبلغ الإجمالي الشامل (ر.س):</span>
                    <span className="font-mono">{(selectedPrintInvoice.totalAmount || 0).toLocaleString()} ر.س</span>
                  </div>
                </div>
              </div>

              {/* Signature, Terms and Disclaimer Block */}
              <div className="pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-900 ">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 ">الأحكام والشروط العامة:</h4>
                  <p className="leading-relaxed">1. هذا السند يعتبر فاتورة نهائية معتمدة لأغراض هيئة الزكاة والضريبة والجمارك ومصلحة الزكاة والضرائب.</p>
                  <p className="leading-relaxed">2. يتم سداد المبالغ بالتحويل لحساب الآيبان البنكي المعتمد للمكتب الصادر في السند التعاقدي الملحق به.</p>
                </div>

                <div className="space-y-8 flex flex-col justify-between items-end border-r border-slate-800 pr-5">
                  <div className="text-center font-sans">
                    <span className="text-slate-900  block">ختم وتوقيع الشريك العميل والترافيحي:</span>
                    <div className="h-10"></div>
                    <span className="text-slate-900  font-bold font-serif underline block">مجموعة العدالة للمحاماة والاستشارات</span>
                  </div>
                </div>
              </div>

              {/* Printing footer notice */}
              <div className="text-center text-xs text-slate-900  pt-10 border-t border-dashed border-slate-800 font-mono flex justify-between items-center">
                <span>تاريخ تسلسل إصدار النسخة: {new Date().toLocaleString("ar-SA")}</span>
                <span>بواسطة نظام العدالة السعودية - منصة رصد الويب السحابية والمزامنة المزدوجة</span>
              </div>

            </div>

            {/* Modal Actions Footer (no-print) */}
            <div className="bg-slate-100 p-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedPrintInvoice(null)}
                className="bg-slate-300 text-slate-900  px-5 py-2 rounded-lg text-xs font-bold font-sans transition-colors cursor-pointer"
              >
                إغلاق المعاينة
              </button>
              <button
                onClick={() => window.print()}
                className="bg-[#0b1e33] text-white px-5 py-2 rounded-lg text-xs font-bold font-sans transition-colors cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4 text-[#c5a880]" />
                <span>طباعة الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
