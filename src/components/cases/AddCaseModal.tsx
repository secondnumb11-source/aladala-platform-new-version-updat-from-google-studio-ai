/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateUUID } from '@/lib/uuid';
import { ShieldAlert, Plus, X } from 'lucide-react';
import { Case, Client } from '@/types';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onUpdateState: (type: string, data: any) => Promise<any>;
}

export default function AddCaseModal({ isOpen, onClose, clients, onUpdateState }: AddCaseModalProps) {
  // Form Fields
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newCaseName, setNewCaseName] = useState('');
  const [newCategory, setNewCategory] = useState('commercial');
  const [newStage, setNewStage] = useState('litigation');
  const [newClientName, setNewClientName] = useState('');
  const [newOpponent, setNewOpponent] = useState('');
  const [newCourt, setNewCourt] = useState('');
  const [newNextDate, setNewNextDate] = useState('2026-06-15');
  const [newNextTime, setNewNextTime] = useState('09:30 صباحاً');
  const [newDetails, setNewDetails] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCircuitNumber, setNewCircuitNumber] = useState('');
  const [newOpponentNationalId, setNewOpponentNationalId] = useState('');
  const [newPoANumber, setNewPoANumber] = useState('');
  const [newPlaintiffNationalId, setNewPlaintiffNationalId] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [newClientType, setNewClientType] = useState('individual');
  const [newPlaintiffPhone, setNewPlaintiffPhone] = useState('');
  const [newNajizNumber, setNewNajizNumber] = useState('');
  const [newCompanyCR, setNewCompanyCR] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverValidationError, setServerValidationError] = useState<{ field: string; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCaseNumber.trim() || !newCaseName.trim() || !newClientName.trim()) {
      setServerValidationError({
        field: 'required',
        message: 'يرجى ملء الحقول الإلزامية: رقم القضية، الاسم، الموكل'
      });
      return;
    }

    setIsSubmitting(true);
    setServerValidationError(null);

    try {
      // === الخطوة 1: إيجاد أو إنشاء العميل ===
      let finalClientId: string | null = null;
      let finalClientName = newClientName.trim();

      // ابحث عن العميل في القائمة الموجودة
      const existingClient = clients.find(c =>
        c.name === finalClientName ||
        c.nationalId === newPlaintiffNationalId ||
        (c as any).national_id === newPlaintiffNationalId
      );

      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        // إنشاء عميل جديد في Supabase
        const newClientId = generateUUID();
        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            id: newClientId,
            name: finalClientName,
            id_number: newPlaintiffNationalId || null,
            phone: newPlaintiffPhone || null,
            is_company: newClientType === 'company',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (!clientError) {
          finalClientId = newClientId;
          // تحديث State العملاء
          await onUpdateState('clients', {
            id: newClientId,
            name: finalClientName,
            nationalId: newPlaintiffNationalId || '',
            phone: newPlaintiffPhone || ''
          });
        } else {
          console.warn('[AddCase] Client creation failed:', clientError.message);
          // لا نوقف العملية — القضية ستُضاف بدون client_id
        }
      }

      // === الخطوة 2: إنشاء القضية ===
      const caseId = generateUUID();
      const casePayload: any = {
        id: caseId,
        case_number: newCaseNumber.trim(),
        title: newCaseName.trim(),
        // client_id اختياري — لا يوقف العملية إذا كان null
        client_id: finalClientId,
        client_name: finalClientName,
        category: newCategory || 'civil',
        stage: newStage || 'litigation',
        status: 'new',
        priority: newPriority || 'medium',
        opponent_name: newOpponent?.trim() || null,
        opponent_national_id: newOpponentNationalId?.trim() || null,
        court_name: newCourt?.trim() || null,
        circuit_number: newCircuitNumber?.trim() || null,
        power_of_attorney_number: newPoANumber?.trim() || null,
        summary: newSummary?.trim() || null,
        details: newDetails?.trim() || null,
        is_najiz_sync: !!newNajizNumber,
        najiz_case_number: newNajizNumber?.trim() || null,
        is_confidential: isConfidential,
        archived: false,
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // حفظ في Supabase
      const { data: savedCase, error: caseError } = await supabase
        .from('cases')
        .insert(casePayload)
        .select()
        .single();

      if (caseError) {
        console.error('[AddCase] DB Error:', caseError);
        
        // رسالة خطأ واضحة
        if (caseError.code === '42501') {
          alert('خطأ في صلاحيات قاعدة البيانات (RLS). تواصل مع المسؤول.');
        } else if (caseError.code === '23502') {
          alert('حقل مطلوب فارغ: ' + caseError.message);
        } else if (caseError.code === '23503') {
          // foreign key error — حاول بدون client_id
          const { data: savedCase2, error: caseError2 } = await supabase
            .from('cases')
            .insert({ ...casePayload, client_id: null })
            .select()
            .single();

          if (caseError2) {
            alert('فشل حفظ القضية: ' + caseError2.message);
            return;
          }
          // نجح بدون client_id
          await afterCaseSaved(caseId, savedCase2 || casePayload);
          return;
        } else {
          alert('فشل حفظ القضية: ' + caseError.message);
        }
        return;
      }

      await afterCaseSaved(caseId, savedCase || casePayload);

    } catch (err: any) {
      console.error('[AddCase Exception]', err);
      alert('خطأ غير متوقع: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة مساعدة بعد حفظ القضية
  const afterCaseSaved = async (caseId: string, caseData: any) => {
    // تحديث State المحلي فوراً
    const frontendCase = {
      id: caseId,
      caseNumber: caseData.case_number || newCaseNumber,
      caseName: caseData.title || newCaseName,
      category: caseData.category || newCategory,
      stage: caseData.stage || newStage,
      status: 'new',
      clientName: caseData.client_name || newClientName,
      clientId: caseData.client_id || null,
      opponentName: caseData.opponent_name || newOpponent,
      courtName: caseData.court_name || newCourt,
      nextSessionDate: newNextDate || '',
      summary: caseData.summary || newSummary,
      isNajizSync: !!newNajizNumber,
      priority: caseData.priority || newPriority,
      isConfidential: isConfidential,
      createdAt: new Date().toISOString()
    };

    await onUpdateState('cases', frontendCase);

    // إضافة جلسة أولى إذا كان هناك موعد
    if (newNextDate) {
      try {
        await supabase.from('hearings').insert({
          id: generateUUID(),
          case_id: caseId,
          case_number: newCaseNumber.trim(),
          case_name: newCaseName.trim(),
          date: newNextDate,
          time: newNextTime || '09:00',
          court_name: newCourt?.trim() || null,
          status: 'upcoming',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (hearingErr: any) {
        console.warn('[Hearing Save Warning]:', hearingErr.message);
        // لا نوقف العملية إذا فشلت الجلسة
      }
    }

    onClose();
    alert('✅ تم حفظ القضية بنجاح في قاعدة البيانات');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[6px] p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl p-0 overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative my-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Animated Luxury Gradient Vertical Bar */}
        <div className="absolute top-0 right-0 w-6 h-full bg-gradient-to-b from-amber-400 via-amber-600 to-slate-900 animate-pulse"></div>
        
        <div className="bg-slate-50 p-10 flex items-center justify-between text-slate-800 border-b border-slate-200 mr-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl tracking-tight uppercase text-slate-900">منصة العدالة لإدارة مكاتب المحاماة</h2>
              <p className="text-amber-600 text-xs font-black mt-2 uppercase tracking-[0.2em]">إضافة قضية جديدة</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-12 h-12 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-200 shadow-sm"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleCreateCase} className="p-8 pb-10 mr-6 max-h-[70vh] overflow-y-auto">
          {serverValidationError && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-400 rounded-2xl font-bold text-xs">
              {serverValidationError.message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            {/* Fieldset 1: الأساسيات */}
            <fieldset className="border border-slate-200 rounded-3xl p-6 space-y-6 bg-white relative overflow-hidden shadow-sm">
              <legend className="text-sm font-black text-amber-600 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">البيانات الأساسية</legend>
              
              <div className="space-y-2 relative">
                <label className="text-sm font-black text-slate-700 uppercase tracking-wider block">رقم الدعوى</label>
                <input type="text" value={newCaseNumber} onChange={(e) => setNewCaseNumber(e.target.value)} placeholder="مثال: 450123" required
                  className="w-full bg-slate-50 border border-slate-200 hover:border-amber-400 focus:border-amber-500 text-slate-900 rounded-xl py-3 px-4 text-base md:text-lg font-black placeholder-slate-400 focus:outline-none transition-all shadow-inner" />
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-black text-slate-700 uppercase tracking-wider block">مسمى الخصومة</label>
                <input type="text" value={newCaseName} onChange={(e) => setNewCaseName(e.target.value)} placeholder="اسم الدعوى بالكامل" required
                  className="w-full bg-slate-50 border border-slate-200 hover:border-amber-400 focus:border-amber-500 text-slate-900 rounded-xl py-3 px-4 text-base md:text-lg font-black placeholder-slate-400 focus:outline-none transition-all shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase block">المحكمة</label>
                  <input type="text" value={newCourt} onChange={(e) => setNewCourt(e.target.value)} placeholder="اسم المحكمة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase block">التصنيف</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="criminal">جزائية 🛡️</option>
                    <option value="labor">عمالية 💼</option>
                    <option value="commercial">تجارية 🏛️</option>
                    <option value="personal_status">أحوال شخصية ⚖️</option>
                    <option value="administrative">إدارية 🏛️</option>
                    <option value="execution">منازعة تنفيذ ⚡</option>
                    <option value="consultation">استشارة قانونية 💡</option>
                    <option value="other">أخرى 📌</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Fieldset 2: الأطراف */}
            <fieldset className="border border-slate-200 rounded-3xl p-6 space-y-6 bg-white relative overflow-hidden shadow-sm">
              <legend className="text-sm font-black text-indigo-600 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">بيانات الأطراف</legend>
              
              <div className="flex gap-6 mb-3">
                <label className="flex items-center gap-2 text-base font-black text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer">
                  <input type="radio" name="clientType" value="individual" checked={newClientType === 'individual'} onChange={() => setNewClientType('individual')} className="accent-indigo-500 h-5 w-5" />
                  فرد
                </label>
                <label className="flex items-center gap-2 text-base font-black text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer">
                  <input type="radio" name="clientType" value="company" checked={newClientType === 'company'} onChange={() => setNewClientType('company')} className="accent-indigo-500 h-5 w-5" />
                  شركة تجارية
                </label>
              </div>

              {newClientType === 'individual' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase block">العميل / المدعي (فرد)</label>
                    <div className="flex flex-col gap-3">
                      <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="اسم المدعى بالكامل" required list="clients-list"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" 
                      />
                      <datalist id="clients-list">
                        {clients.map(cl => ( <option key={cl.id} value={cl.name} /> ))}
                      </datalist>
                      <input type="text" value={newPlaintiffNationalId} onChange={(e) => setNewPlaintiffNationalId(e.target.value)} placeholder="رقم هوية المدعي"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" />
                      <input type="text" value={newPlaintiffPhone} onChange={(e) => setNewPlaintiffPhone(e.target.value)} placeholder="رقم هاتف المدعي"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="text-sm font-black text-slate-700 uppercase block">الخصم / المدعى عليه (فرد)</label>
                    <div className="flex flex-col gap-3">
                      <input type="text" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} placeholder="اسم المدعى عليه"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" />
                      <input type="text" value={newOpponentNationalId} onChange={(e) => setNewOpponentNationalId(e.target.value)} placeholder="رقم هوية المدعى عليه"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase block">بيانات الشركة (تجارية)</label>
                    <div className="flex flex-col gap-3">
                      <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="اسم الشركة" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" />
                      <input type="text" value={newCompanyCR} onChange={(e) => setNewCompanyCR(e.target.value)} placeholder="رقم السجل التجاري أو الرقم الموحد"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <input type="text" value={newPoANumber} onChange={(e) => setNewPoANumber(e.target.value)} placeholder="رقم الوكالة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" />
                <input type="text" value={newNajizNumber} onChange={(e) => setNewNajizNumber(e.target.value)} placeholder="رقم الدعوى على ناجز (إن وجد)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl mt-2 py-2 px-3 text-sm text-slate-900" />
              </div>
            </fieldset>

            {/* Fieldset 3: التفاصيل وتاريخ الجلسة */}
            <fieldset className="border border-slate-200 rounded-3xl p-6 space-y-6 bg-white flex flex-col relative overflow-hidden shadow-sm">
              <legend className="text-sm font-black text-emerald-600 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">الجدولة والملاحظات</legend>
              
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 block">تاريخ الجلسة القادمة</label>
                <input type="date" value={newNextDate} onChange={(e) => setNewNextDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 block font-sans">الأولوية</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-700 font-bold text-sm cursor-pointer">
                    <input type="radio" value="high" checked={newPriority === 'high'} onChange={() => setNewPriority('high')} className="accent-rose-500" />
                    عالية 🚨
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 font-bold text-sm cursor-pointer">
                    <input type="radio" value="medium" checked={newPriority === 'medium'} onChange={() => setNewPriority('medium')} className="accent-amber-500" />
                    متوسطة ⚠️
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 font-bold text-sm cursor-pointer">
                    <input type="radio" value="low" checked={newPriority === 'low'} onChange={() => setNewPriority('low')} className="accent-slate-500" />
                    عادية 🔍
                  </label>
                </div>
              </div>
              <div className="space-y-2 flex-grow flex flex-col">
                <label className="text-sm font-black text-slate-700 block">مذكرة الملخص السريع</label>
                <textarea value={newSummary} onChange={(e) => setNewSummary(e.target.value)} placeholder="اكتب ملخصاً هنا..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 flex-grow min-h-[70px] resize-none"
                ></textarea>
              </div>
              <div className="space-y-2 flex-grow flex flex-col">
                <label className="text-sm font-black text-slate-700 block">تفاصيل الدعوى</label>
                <textarea value={newDetails} onChange={(e) => setNewDetails(e.target.value)} placeholder="اكتب التفاصيل الهامة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 flex-grow min-h-[70px] resize-none"
                ></textarea>
              </div>
            </fieldset>
          </div>

          <div className="flex gap-4 pt-6 mt-6 border-t border-slate-200 w-full justify-end">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-slate-100 text-slate-700 border border-slate-200 font-black py-3 px-8 rounded-xl text-xs uppercase hover:bg-slate-200 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-transparent border-2 border-slate-900 text-slate-900 font-black py-3 px-12 rounded-xl text-sm transition-all hover:bg-slate-900 hover:text-white flex items-center gap-2 shadow-sm outline-none uppercase"
            >
              {isSubmitting ? 'جاري الحفظ والمزامنة...' : 'حفظ الدعوى والمزامنة تلقائياً'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
