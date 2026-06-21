import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, MessageCircle } from 'lucide-react';

interface WhatsAppModuleProps {
  clients?: any[];
}

const WhatsAppModule: React.FC<WhatsAppModuleProps> = ({ clients = [] }) => {
  const [realClients, setRealClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean; message: string
  } | null>(null);

  // جلب العملاء الحقيقيين
  useEffect(() => {
    const loadClients = async () => {
      try {
        const { data } = await supabase
          .from('clients')
          .select('id, name, phone, email, status')
          .eq('status', 'active')
          .not('phone', 'is', null)
          .order('name');

        if (data) setRealClients(data);
      } catch(err: any) {
        console.error('[WhatsApp] Load clients:', err.message);
        // Fallback من props
        if (clients?.length > 0) {
          setRealClients(
            clients.filter((c: any) => c.phone)
          );
        }
      }
    };
    loadClients();
  }, []);

  const handleSendWhatsApp = async () => {
    try {
      if (!selectedClient && !recipientPhone.trim()) {
        setSendResult({
          success: false,
          message: 'يرجى اختيار عميل أو إدخال رقم جوال'
        });
        return;
      }

      if (!message.trim()) {
        setSendResult({
          success: false,
          message: 'يرجى كتابة نص الرسالة'
        });
        return;
      }

      const phone = recipientPhone.trim() ||
                    selectedClient?.phone || '';

      if (!phone) {
        setSendResult({
          success: false,
          message: 'هذا العميل ليس لديه رقم جوال مسجل'
        });
        return;
      }

      setIsSending(true);
      setSendResult(null);

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          message: message.trim(),
          clientName: selectedClient?.name || phone
        })
      });

      const result = await response.json();

      setSendResult({
        success: result.success,
        message: result.success
          ? `✅ تم الإرسال لـ ${selectedClient?.name || phone}`
          : '❌ ' + (result.error || 'فشل الإرسال')
      });

      if (result.success) setMessage('');

    } catch(err: any) {
      setSendResult({
        success: false,
        message: '❌ خطأ: ' + err.message
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* اختيار العميل */}
      <div>
        <label className="block text-slate-300 text-sm font-bold mb-2">
          👤 اختر العميل
        </label>
        <select
          value={selectedClient?.id || ''}
          onChange={e => {
            try {
              const clientId = e.target.value;
              if (!clientId) {
                setSelectedClient(null);
                setRecipientPhone('');
                return;
              }

              // ابحث في القائمة الحقيقية أولاً
              const fromReal = realClients?.find(c => c.id === clientId);
              // ثم في props
              const fromProps = clients?.find((c: any) =>
                c.id === clientId
              );
              const client = fromReal || fromProps || null;

              if (!client) {
                setSelectedClient(null);
                setRecipientPhone('');
                return;
              }

              setSelectedClient(client);

              // استخراج الهاتف بأمان
              const phone = client.phone ||
                            client.mobile ||
                            client.phoneNumber ||
                            client.phone_number ||
                            '';
              setRecipientPhone(phone);

            } catch(err: any) {
              console.error('[Client Select Error]', err.message);
            }
          }}
          className="w-full bg-[#050e21] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="">— اختر عميلاً —</option>
          {realClients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
              {client.phone ? ` — ${client.phone}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* رقم الجوال */}
      <div>
        <label className="block text-slate-300 text-sm font-bold mb-2">
          📱 رقم الجوال
        </label>
        <input
          type="text"
          value={recipientPhone}
          onChange={e => setRecipientPhone(e.target.value)}
          placeholder="مثال: 0512345678"
          className="w-full bg-[#050e21] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600"
        />
      </div>

      {/* معلومات العميل المختار */}
      {selectedClient && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-emerald-400 font-bold text-sm">
            ✅ {selectedClient.name}
          </p>
          {selectedClient.phone && (
            <p className="text-slate-400 text-xs mt-1">
              📱 {selectedClient.phone}
            </p>
          )}
          {!selectedClient.phone && (
            <p className="text-amber-400 text-xs mt-1">
              ⚠️ هذا العميل ليس لديه رقم جوال مسجل
            </p>
          )}
        </div>
      )}

      {/* نص الرسالة */}
      <div>
        <label className="block text-slate-300 text-sm font-bold mb-2">
          💬 نص الرسالة
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          placeholder="اكتب رسالتك هنا..."
          className="w-full bg-[#050e21] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-500 placeholder-slate-600"
        />
        <p className="text-slate-600 text-xs mt-1 text-left">
          {message.length} حرف
        </p>
      </div>

      {/* قوالب سريعة */}
      <div>
        <p className="text-slate-500 text-xs font-bold mb-2">
          📋 قوالب سريعة:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'تذكير جلسة', text: `عزيزي/عزيزتي ${selectedClient?.name || '[الاسم]'}، نذكركم بموعد جلسة القضية الخاصة بكم. يرجى التواصل معنا لمزيد من التفاصيل. مكتب المحاماة.` },
            { label: 'طلب مستندات', text: `عزيزي/عزيزتي ${selectedClient?.name || '[الاسم]'}، يرجى إحضار المستندات المطلوبة في أقرب وقت لاستكمال إجراءات قضيتكم. شكراً.` },
            { label: 'موعد استشارة', text: `عزيزي/عزيزتي ${selectedClient?.name || '[الاسم]'}، يسرنا إبلاغكم بأن موعد الاستشارة القانونية قد تم تحديده. يرجى التواصل لتأكيد الموعد.` },
            { label: 'صدور الحكم', text: `عزيزي/عزيزتي ${selectedClient?.name || '[الاسم]'}، نود إحاطتكم علماً بصدور الحكم في قضيتكم. يرجى التواصل معنا للاطلاع على التفاصيل.` }
          ].map((tmpl, i) => (
            <button
              key={i}
              onClick={() => setMessage(tmpl.text)}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-amber-500 rounded-lg transition-all"
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* نتيجة الإرسال */}
      {sendResult && (
        <div className={`p-4 rounded-xl border text-sm font-bold ${
          sendResult.success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {sendResult.message}
        </div>
      )}

      {/* زر الإرسال */}
      <button
        onClick={handleSendWhatsApp}
        disabled={isSending || !recipientPhone || !message}
        className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-emerald-900/30"
      >
        {isSending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            جارٍ الإرسال...
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4" />
            إرسال عبر WhatsApp
          </>
        )}
      </button>
    </div>
  );
};

export default WhatsAppModule;
