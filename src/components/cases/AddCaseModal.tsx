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
  const [newCourt, setNewCourt] = useState('المحكمة التجارية بالرياض');
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
    if (!newCaseNumber || !newCaseName || !newClientName) {
      setServerValidationError({ field: 'required', message: 'يرجى ملء جميع الحقول الإلزامية' });
      return;
    }

    setIsSubmitting(true);
    try {
      const caseId = generateUUID();
      const casePayload: any = {
        id: caseId,
        case_number: newCaseNumber.trim(),
        title: newCaseName.trim(),
        case_name: newCaseName.trim(),
        client_id: null,        // ← ابدأ بـ null دائماً
        client_name: newClientName.trim(),   // ← احفظ الاسم كنص
        category: newCategory,
        stage: newStage,
        status: 'new',
        priority: newPriority,
        opponent_name: newOpponent || null,
        opponent_national_id: newOpponentNationalId || null,
        court_name: newCourt || null,
        circuit_number: newCircuitNumber || null,
        power_of_attorney_number: newPoANumber || null,
        next_session_at: newNextDate ? new Date(newNextDate).toISOString() : null,
        next_session_time: newNextTime || null,
        summary: (newNajizNumber ? `[رقم الدعوى على ناجز: ${newNajizNumber}]\n` : '') + (newSummary || 'دعوى قضائية جديدة مضافة يدوياً عبر لوحة الإدارة.'),
        details: newDetails || 'لا يوجد تفاصيل نظامية مدونة حالياً.',
        is_najiz_sync: !!newNajizNumber,
        najiz_case_number: newNajizNumber || null,
        is_confidential: isConfidential,
        archived: false,
        metadata: JSON.stringify({ addedManually: true }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // أضف العميل أولاً إذا لم يكن موجوداً
      let finalClientId = null;
      const existingClient = clients.find(c => c.name === newClientName);

      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClientId = generateUUID();
        const { error: clientErr } = await supabase
          .from('clients')
          .insert({
            id: newClientId,
            name: newClientName.trim(),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (!clientErr) {
          finalClientId = newClientId;
          // تحديث State العمراء
          await onUpdateState('clients', {
            id: newClientId,
            name: newClientName.trim(),
            nationalId: newPlaintiffNationalId || '',
            phone: newPlaintiffPhone || ''
          });
        } else {
          console.error('[AddCase Client Supabase Error]', clientErr);
        }
      }

      // الآن أضف القضية مع client_id الصحيح
      casePayload.client_id = finalClientId;

      const { error: caseError } = await supabase
        .from('cases')
        .insert(casePayload);

      if (caseError) {
        console.error('[AddCase Supabase Error]', caseError);
        alert('فشل حفظ القضية في قاعدة البيانات: ' + caseError.message + '\n\nكود الخطأ: ' + caseError.code);
        return;
      }

      // 3. تحديث State المحلي (لعرضها فوراً بدون إعادة تحميل)
      const frontendCase = {
        id: caseId,
        caseNumber: newCaseNumber.trim(),
        caseName: newCaseName.trim(),
        category: newCategory,
        stage: newStage,
        status: 'new',
        clientName: newClientName.trim(),
        clientId: finalClientId,
        opponentName: newOpponent || 'طرف مجهول (خصم)',
        opponentNationalId: newOpponentNationalId,
        courtName: newCourt,
        nextSessionDate: newNextDate || '',
        nextSessionTime: newNextTime || '',
        summary: (newNajizNumber ? `[رقم الدعوى على ناجز: ${newNajizNumber}]\n` : '') + (newSummary || 'دعوى قضائية جديدة مضافة يدوياً عبر لوحة الإدارة.'),
        details: newDetails || 'لا يوجد تفاصيل نظامية مدونة حالياً.',
        isNajizSync: !!newNajizNumber,
        priority: newPriority,
        isConfidential: isConfidential,
        createdAt: new Date().toISOString()
      };

      await onUpdateState('cases', frontendCase);

      // 4. إنشاء جلسة أولية إذا كان هناك موعد
      if (newNextDate && finalClientId) {
        await supabase.from('hearings').insert({
          id: generateUUID(),
          case_id: caseId,
          case_number: newCaseNumber.trim(),
          case_name: newCaseName.trim(),
          date: newNextDate,
          time: newNextTime || '09:00',
          court_name: newCourt || null,
          status: 'upcoming',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      onClose();
      alert('✅ تم حفظ القضية بنجاح في قاعدة البيانات');
    } catch (err: any) {
      console.error('[AddCase Exception]', err);
      alert('خطأ غير متوقع: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050e21]/80 backdrop-blur-md p-6 overflow-y-auto" dir="rtl">
      <div className="bg-[#050e21] border border-slate-800 rounded-[2.5rem] w-full max-w-5xl p-0 overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Animated Luxury Gradient Vertical Bar */}
        <div className="absolute top-0 right-0 w-6 h-full bg-gradient-to-b from-[#D4AF37] via-[#B8860B] to-[#020813] animate-pulse"></div>
        
        <div className="bg-gradient-to-br from-[#050e21] to-[#0c1a35] p-10 flex items-center justify-between text-white border-b border-white/10 mr-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl tracking-tight uppercase text-white">منصة العدالة لإدارة مكاتب المحاماة</h2>
              <p className="text-amber-500 text-xs font-black mt-2 uppercase tracking-[0.2em] opacity-80">إضافة قضية جديدة</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-12 h-12 bg-[#050e21] text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-white hover:bg-slate-800"
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
            <fieldset className="border border-[#D4AF37]/40 rounded-3xl p-6 space-y-6 bg-[#0a1e3f]/50 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              <legend className="text-sm font-black text-[#FFD700] px-4 py-1.5 bg-[#050e21] border-2 border-[#D4AF37]/70 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">البيانات الأساسية</legend>
              
              <div className="space-y-2 relative">
                <label className="text-sm font-black text-[#FFD700] uppercase tracking-wider block">رقم الدعوى</label>
                <input type="text" value={newCaseNumber} onChange={(e) => setNewCaseNumber(e.target.value)} placeholder="مثال: 450123" required
                  className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] text-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]" />
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-black text-[#FFD700] uppercase tracking-wider block">مسمى الخصومة</label>
                <input type="text" value={newCaseName} onChange={(e) => setNewCaseName(e.target.value)} placeholder="اسم الدعوى بالكامل" required
                  className="w-full bg-[#020813] border-2 border-[#D4AF37]/30 hover:border-[#FF7F00]/60 focus:border-[#FF7F00] text-[#FF7F00] rounded-xl py-3 px-4 text-base md:text-lg font-black placeholder-[#FF7F00]/40 focus:outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-[#FFD700] uppercase block">المحكمة</label>
                  <input type="text" value={newCourt} onChange={(e) => setNewCourt(e.target.value)} placeholder="اسم المحكمة"
                    className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm font-bold text-[#FF7F00] focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-[#FFD700] uppercase block">التصنيف</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm font-bold text-[#FF7F00] focus:outline-none"
                  >
                    <option value="criminal" className="bg-[#050e21]">جزائية 🛡️</option>
                    <option value="labor" className="bg-[#050e21]">عمالية 💼</option>
                    <option value="commercial" className="bg-[#050e21]">تجارية 🏛️</option>
                    <option value="personal_status" className="bg-[#050e21]">أحوال شخصية ⚖️</option>
                    <option value="administrative" className="bg-[#050e21]">إدارية 🏛️</option>
                    <option value="execution" className="bg-[#050e21]">منازعة تنفيذ ⚡</option>
                    <option value="consultation" className="bg-[#050e21]">استشارة قانونية 💡</option>
                    <option value="other" className="bg-[#050e21]">أخرى 📌</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Fieldset 2: الأطراف */}
            <fieldset className="border border-[#D4AF37]/40 rounded-3xl p-6 space-y-6 bg-[#0a1e3f]/50 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              <legend className="text-sm font-black text-[#FFD700] px-4 py-1.5 bg-[#050e21] border-2 border-[#D4AF37]/70 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">بيانات الأطراف</legend>
              
              <div className="flex gap-6 mb-3">
                <label className="flex items-center gap-2 text-base font-black text-white hover:text-[#FF7F00] transition-colors cursor-pointer">
                  <input type="radio" name="clientType" value="individual" checked={newClientType === 'individual'} onChange={() => setNewClientType('individual')} className="accent-[#FF7F00] h-5 w-5" />
                  فرد
                </label>
                <label className="flex items-center gap-2 text-base font-black text-white hover:text-[#FF7F00] transition-colors cursor-pointer">
                  <input type="radio" name="clientType" value="company" checked={newClientType === 'company'} onChange={() => setNewClientType('company')} className="accent-[#FF7F00] h-5 w-5" />
                  شركة تجارية
                </label>
              </div>

              {newClientType === 'individual' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#FFD700] uppercase block">العميل / المدعي (فرد)</label>
                    <div className="flex flex-col gap-3">
                      <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="اسم المدعى بالكامل" required list="clients-list"
                        className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" 
                      />
                      <datalist id="clients-list">
                        {clients.map(cl => ( <option key={cl.id} value={cl.name} /> ))}
                      </datalist>
                      <input type="text" value={newPlaintiffNationalId} onChange={(e) => setNewPlaintiffNationalId(e.target.value)} placeholder="رقم هوية المدعي"
                        className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" />
                      <input type="text" value={newPlaintiffPhone} onChange={(e) => setNewPlaintiffPhone(e.target.value)} placeholder="رقم هاتف المدعي"
                        className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t border-[#D4AF37]/20">
                    <label className="text-sm font-black text-[#FFD700] uppercase block">الخصم / المدعى عليه (فرد)</label>
                    <div className="flex flex-col gap-3">
                      <input type="text" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} placeholder="اسم المدعى عليه"
                        className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" />
                      <input type="text" value={newOpponentNationalId} onChange={(e) => setNewOpponentNationalId(e.target.value)} placeholder="رقم هوية المدعى عليه"
                        className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#FFD700] uppercase block">بيانات الشركة (تجارية)</label>
                    <div className="flex flex-col gap-3">
                      <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="اسم الشركة" required
                        className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" />
                      <input type="text" value={newCompanyCR} onChange={(e) => setNewCompanyCR(e.target.value)} placeholder="رقم السجل التجاري أو الرقم الموحد"
                        className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-3 border-t border-[#D4AF37]/20">
                <input type="text" value={newPoANumber} onChange={(e) => setNewPoANumber(e.target.value)} placeholder="رقم الوكالة"
                  className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" />
                <input type="text" value={newNajizNumber} onChange={(e) => setNewNajizNumber(e.target.value)} placeholder="رقم الدعوى على ناجز (إن وجد)"
                  className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl mt-2 py-2 px-3 text-sm text-[#FF7F00]" />
              </div>
            </fieldset>

            {/* Fieldset 3: التفاصيل وتاريخ الجلسة */}
            <fieldset className="border border-[#D4AF37]/40 rounded-3xl p-6 space-y-6 bg-[#0a1e3f]/50 flex flex-col relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              <legend className="text-sm font-black text-[#FFD700] px-4 py-1.5 bg-[#050e21] border-2 border-[#D4AF37]/70 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">الجدولة والملاحظات</legend>
              
              <div className="space-y-2">
                <label className="text-sm font-black text-[#FFD700] block">تاريخ الجلسة القادمة</label>
                <input type="date" value={newNextDate} onChange={(e) => setNewNextDate(e.target.value)}
                  className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-[#FFD700] block font-sans">الأولوية</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-[#FF7F00] text-sm cursor-pointer">
                    <input type="radio" value="high" checked={newPriority === 'high'} onChange={() => setNewPriority('high')} className="accent-red-500" />
                    عالية 🚨
                  </label>
                  <label className="flex items-center gap-2 text-[#FF7F00] text-sm cursor-pointer">
                    <input type="radio" value="medium" checked={newPriority === 'medium'} onChange={() => setNewPriority('medium')} className="accent-amber-500" />
                    متوسطة ⚠️
                  </label>
                  <label className="flex items-center gap-2 text-[#FF7F00] text-sm cursor-pointer">
                    <input type="radio" value="low" checked={newPriority === 'low'} onChange={() => setNewPriority('low')} className="accent-[#FF7F00]" />
                    عادية 🔍
                  </label>
                </div>
              </div>
              <div className="space-y-2 flex-grow flex flex-col">
                <label className="text-sm font-black text-[#FFD700] block">مذكرة الملخص السريع</label>
                <textarea value={newSummary} onChange={(e) => setNewSummary(e.target.value)} placeholder="اكتب ملخصاً هنا..."
                  className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00] flex-grow min-h-[70px] resize-none"
                ></textarea>
              </div>
              <div className="space-y-2 flex-grow flex flex-col">
                <label className="text-sm font-black text-[#FFD700] block">تفاصيل الدعوى</label>
                <textarea value={newDetails} onChange={(e) => setNewDetails(e.target.value)} placeholder="اكتب التفاصيل الهامة..."
                  className="w-full bg-[#020813] border border-[#D4AF37]/30 rounded-xl py-2 px-3 text-sm text-[#FF7F00] flex-grow min-h-[70px] resize-none"
                ></textarea>
              </div>
            </fieldset>
          </div>

          <div className="flex gap-4 pt-6 mt-6 border-t border-slate-800 w-full justify-end">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-[#0c1a35] text-white font-bold py-3 px-8 rounded-xl text-xs uppercase hover:bg-slate-800 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-400 text-blue-950 font-black py-3 px-12 rounded-xl text-xs uppercase hover:bg-amber-300 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'جاري الحفظ والمزامنة...' : 'حفظ الدعوى والمزامنة تلقائياً'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
