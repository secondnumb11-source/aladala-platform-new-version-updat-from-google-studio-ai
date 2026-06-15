import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, HelpCircle, DollarSign, ArrowRight } from 'lucide-react';
import { Hearing, Case, Invoice } from '../types';

interface HearingCustomTimerProps {
  hearing: Hearing;
  cases: Case[];
  invoices: Invoice[];
  onUpdateState: (type: string, data: any) => void;
}

export default function HearingCustomTimer({
  hearing,
  cases,
  invoices,
  onUpdateState
}: HearingCustomTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(600); // 600 SAR/hr estimate
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('new');
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncedInvoiceNum, setSyncedInvoiceNum] = useState('');

  // Find corresponding case and client
  const matchedCase = cases.find(c => c.caseNumber === hearing.caseNumber || c.id === hearing.caseNumber);
  
  // Find unpaid invoices for the same client
  const clientInvoices = matchedCase
    ? invoices.filter(inv => inv.clientId === matchedCase.clientId && inv.status !== 'paid')
    : [];

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const calculateFees = () => {
    return Math.round((seconds / 3600) * hourlyRate * 100) / 100;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
    if (syncSuccess) setSyncSuccess(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setSyncSuccess(false);
  };

  const handleSyncInvoice = () => {
    if (seconds <= 0) return;

    const fees = calculateFees() || 1; // minimum 1 SAR for simulation if needed
    const vat = Math.round(fees * 0.15 * 100) / 100;
    const total = Math.round((fees + vat) * 100) / 100;
    const timeFormatted = formatTime(seconds);

    if (selectedInvoiceId === 'new') {
      // Create new invoice
      const newInvId = `inv-${Date.now()}`;
      const newInvoice: Invoice = {
        id: newInvId,
        clientName: matchedCase ? matchedCase.clientName : (hearing.caseName || 'الموكل الرئيسي'),
        clientId: matchedCase ? matchedCase.clientId : `c-gen-${Date.now()}`,
        description: `أتعاب مرافعة الجلسة الموثقة بالمؤقت للقضية رقم (${hearing.caseNumber}) بمحكمة ${hearing.courtName} - مدة الجلسة الفعلية: ${timeFormatted} (معدل: ${hourlyRate} ر.س/ساعة)`,
        amount: fees,
        vatAmount: vat,
        totalAmount: total,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: 'سداد/تحويل بنكي',
        status: 'pending'
      };

      onUpdateState('invoices', newInvoice);
      setSyncedInvoiceNum(newInvId);
    } else {
      // Add fees to existing invoice
      const existingInv = invoices.find(inv => inv.id === selectedInvoiceId);
      if (existingInv) {
        const updatedFees = Math.round((existingInv.amount + fees) * 100) / 100;
        const updatedVat = Math.round(updatedFees * 0.15 * 100) / 100;
        const updatedTotal = Math.round((updatedFees + updatedVat) * 100) / 100;
        const additionalText = ` + أتعاب جلسة إضافية (المدة: ${timeFormatted})`;

        const updatedInvoice: Invoice = {
          ...existingInv,
          amount: updatedFees,
          vatAmount: updatedVat,
          totalAmount: updatedTotal,
          description: existingInv.description.substring(0, 150) + additionalText
        };

        onUpdateState('invoices', updatedInvoice);
        setSyncedInvoiceNum(existingInv.id);
      }
    }

    setSyncSuccess(true);
    setIsRunning(false);
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-slate-700/60 bg-slate-900/60 text-right space-y-4 shadow-sm" dir="rtl">
      {/* Timer Section Header */}
      <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          <span className="text-[11px] font-black text-slate-100 uppercase tracking-wide">
            مؤقت المرافعة المالي الذكي (إجمالي الجلسة)
          </span>
        </div>
        
        {syncSuccess ? (
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold border border-emerald-500/20 px-2 py-0.5 rounded font-black">
            ✓ تم التزامن مع {syncedInvoiceNum}
          </span>
        ) : (
          <span className="text-[10px] text-slate-200 font-bold font-mono">
            مُسجّل الميقات المالي للدعوى
          </span>
        )}
      </div>

      {/* Timer Display and Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        {/* Core numbers display */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center justify-center font-mono font-black text-xl text-yellow-400 tracking-widest min-w-[120px] shadow-inner">
            {formatTime(seconds)}
          </div>
          
          <div className="text-right">
            <span className="block text-[11px] text-slate-200 font-bold font-black">الرسوم المستحقة المقدرة:</span>
            <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded inline-block mt-1">
              {calculateFees().toLocaleString()} ر.س
            </span>
          </div>
        </div>

        {/* Stopwatch Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleStartPause}
            className={`px-3 py-2 rounded-lg text-xs font-black flex items-center gap-1 transition-all shadow cursor-pointer ${
              isRunning
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold border border-rose-500/30'
                : 'bg-primary/20 text-amber-300 border border-primary/40'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'إيقاف الرصد مؤقتاً' : 'تشغيل المؤقت'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 bg-slate-800 text-white font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
            title="إعادة التصفير"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Configuration & Syncer Section */}
      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Rate input */}
          <div className="space-y-1">
            <label className="text-[10px] text-white font-bold font-bold block">معدل الفوترة (السعر بالساعة):</label>
            <div className="relative">
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 py-1.5 pl-3 pr-8 rounded-lg outline-none font-mono font-bold focus:border-primary"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-700">ر.س/ساعة</span>
            </div>
          </div>

          {/* Invoice target selection */}
          <div className="space-y-1">
            <label className="text-[10px] text-white font-bold font-bold block">مزامنة القيمة المالية مع:</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-white py-1.5 px-2.5 rounded-lg outline-none focus:border-primary font-bold"
            >
              <option value="new">🆕 إصدار فاتورة جديدة للدعوى</option>
              {clientInvoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  📄 فاتورة #{inv.id} ({inv.totalAmount.toLocaleString()} ر.س)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sync trigger button */}
        <button
          type="button"
          onClick={handleSyncInvoice}
          disabled={seconds <= 0}
          className={`w-full py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 border shadow ${
            seconds <= 0
              ? 'bg-slate-800 text-slate-700 border-slate-800 cursor-not-allowed'
              : 'bg-[#ca8a04] text-slate-950 border-[#ca8a04] cursor-pointer'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>حفظ الوقت وترحيل التكلفة الزمنية تلقائياً إلى الفاتورة</span>
        </button>
      </div>
    </div>
  );
}
