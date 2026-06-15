import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Check, 
  Smartphone, 
  MessageSquareCode,
  Maximize2,
  Trash2,
  GripVertical,
  Layout,
  Briefcase,
  Building,
  Mail,
  MapPin,
  Sparkles
} from "lucide-react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { InteractiveCard } from "./InteractiveCard";

interface Client {
  id: string;
  name: string;
  clientType: string;
  nationalId: string;
  phone: string;
  email: string;
  address?: string;
  representativeName?: string;
  whatsappEnabled: boolean;
  notes?: string;
}

export default function CrmClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [clientSizes, setClientSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>(() => {
    const saved = localStorage.getItem('crm_client_sizes_config');
    return saved ? JSON.parse(saved) : {};
  });

  const [clientOrder, setClientOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('crm_client_order_config');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync client list into clientOrder
  useEffect(() => {
    if (clients.length > 0) {
      setClientOrder(prev => {
        const existing = new Set(prev);
        const filtered = clients.map(c => c.id);
        const newItems = filtered.filter(id => !existing.has(id));
        if (newItems.length > 0 || prev.length === 0) {
          const updated = [...prev, ...newItems].filter(id => clients.some(c => c.id === id));
          localStorage.setItem('crm_client_order_config', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [clients]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && active.rect && active.rect.current) {
      const { width, height } = active.rect.current;
      try {
        const existing = localStorage.getItem('dragged_card_dimensions_map')
          ? JSON.parse(localStorage.getItem('dragged_card_dimensions_map')!)
          : {};
        existing[active.id] = { width: Math.round(width), height: Math.round(height) };
        localStorage.setItem('dragged_card_dimensions_map', JSON.stringify(existing));
      } catch (e) {
        console.error(e);
      }
    }

    if (!over || active.id === over.id) return;

    setClientOrder((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const updated = arrayMove(items, oldIndex, newIndex);
      localStorage.setItem('crm_client_order_config', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSize = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = (clientSizes[id] === 'large' ? 'small' : clientSizes[id] === 'medium' ? 'large' : 'medium') as "medium" | "small" | "large";
    const updated: Record<string, "medium" | "small" | "large"> = { ...clientSizes, [id]: next };
    setClientSizes(updated);
    localStorage.setItem('crm_client_sizes_config', JSON.stringify(updated));
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New client form states
  const [name, setName] = useState("");
  const [clientType, setClientType] = useState("company");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [notes, setNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchClients = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/crm/clients");
      if (resp.ok) {
        const data = await resp.json();
        setClients(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nationalId) return;

    try {
      const resp = await fetch("/api/crm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          clientType,
          nationalId,
          phone,
          email,
          address,
          representativeName,
          whatsappEnabled,
          notes
        })
      });

      if (resp.ok) {
        setSuccessMsg("تم إضافة العملاء بنجاح وتقييدهم بالمنظومة!");
        
        // --- Simulate Twilio WhatsApp Notification with Credentials ---
        const autoGeneratedUsername = nationalId;
        const autoGeneratedPassword = "AJ-" + Math.floor(Math.random() * 9000 + 1000);
        alert(`[Twilio WhatsApp API] تم إرسال رسالة إلى ${phone || 'العميل'}:\nمرحباً ${name}، تم إنشاء حسابك في بوابة موكل التفاعلية.\nاسم المستخدم (الهوية): ${autoGeneratedUsername}\nالرمز السري الموحد: ${autoGeneratedPassword}\nالرابط الآمن للبوابة: https://aladalah.sa/portal/login`);
        // -----------------------------------------------------------------

        setName("");
        setNationalId("");
        setPhone("");
        setEmail("");
        setAddress("");
        setRepresentativeName("");
        setNotes("");
        fetchClients();
        setTimeout(() => {
          setSuccessMsg("");
          setShowAddForm(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.includes(searchQuery) || 
    c.nationalId.includes(searchQuery) ||
    c.phone.includes(searchQuery)
  );

  const sortedAndFilteredClients = [...filteredClients].sort((a, b) => {
    const aIdx = clientOrder.indexOf(a.id);
    const bIdx = clientOrder.indexOf(b.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#c5a880] flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>نظام سجلات العملاء والعلاقات القضائية</span>
          </h2>
          <p className="text-xs text-slate-900  mt-1">تقييد وسجلات الهوية والبيانات التجارية والوكالات الخاصة بالعملاء بالترميز الآمن.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#c5a880] text-[#061224] text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>موكل جديد (فرد / منشأة)</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddClient} className="bg-[#0b1e33] border border-[#c5a880]/30 rounded-xl p-5 space-y-4 text-xs">
          <h3 className="text-white font-bold font-bold border-b border-[#c5a880]/15 pb-2 text-sm">إضافة ملف موكل جديد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-900 ">الاسم الكامل / الاسم التجاري:</label>
              <input
                type="text"
                required
                placeholder="أدخل الاسم الرباعي أو اسم الشركة"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">تصنيف العميل:</label>
              <select
                value={clientType}
                onChange={e => setClientType(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              >
                <option value="company">شركة / منشأة تجارية</option>
                <option value="individual">فرد / مواطن / مقيم</option>
                <option value="government">جهة حكومية / شبه حكومية</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">رقم الهوية الوطنية / السجل التجاري للمنشأة:</label>
              <input
                type="text"
                required
                placeholder="Ex: 10xxxxxxxx / 1010xxxxxx"
                value={nationalId}
                onChange={e => setNationalId(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">رقم الجوال النشط (الربط التلقائي):</label>
              <input
                type="text"
                placeholder="+966 5xxxxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">البريد الإلكتروني:</label>
              <input
                type="email"
                placeholder="client@domain.sa"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">اسم ممثل المنشأة (إن وجد):</label>
              <input
                type="text"
                placeholder="أدخل اسم المفوض أو المدير التنفيذي"
                value={representativeName}
                onChange={e => setRepresentativeName(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-900 ">العنوان الوطني المعتمد:</label>
              <input
                type="text"
                placeholder="مثال: الرياض - حي الصحافة - ص.ب 12345"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">ملاحظات وشهادات الوكالة:</label>
              <input
                type="text"
                placeholder="مثال: وكالة عامة برقم 44xxxxxx في قضايا العقود"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#c5a880]/10">
            <label className="flex items-center gap-2 text-slate-900">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={e => setWhatsappEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#c5a880]"
              />
              <span>تفعيل الإشعارات الفورية والمزامنة عبر الواتساب المترابط</span>
            </label>

            <div className="flex gap-2">
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
                حفظ الملف العدلي
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="bg-emerald-500 border border-emerald-500 text-emerald-400 p-2.5 rounded text-center font-bold">
              {successMsg}
            </div>
          )}
        </form>
      )}

      <div className="bg-[#0b1e33] border border-[#c5a880]/20 rounded-xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="ابحث عن موكل برقم الهوية، الاسم، رقم الجوال الموثق..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded-lg p-2.5 pr-10 text-xs text-slate-100 placeholder-slate-500"
            />
            <Search className="w-4 h-4 text-slate-900  absolute right-3.5 top-3.5" />
          </div>

          <div className="flex items-center gap-2 border border-[#c5a880]/15 p-1 bg-slate-950/40 rounded-xl self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-2 py-1.5 px-3.5 text-xs font-black flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards' 
                  ? 'bg-[#c5a880] text-[#061224] shadow-md' 
                  : 'text-slate-200 font-bold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>بطاقات تفاعلية dnd ثلاثية الأبعاد</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 py-1.5 px-3.5 text-xs font-black flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-[#c5a880] text-[#061224] shadow-md' 
                  : 'text-slate-200 font-bold'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>جدول البيانات الموحّد</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-200 font-bold">جاري تحميل وتزامن العملاء من الشبكة الموحدة...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-200 font-bold">لم يتم العثور على أي موكل مدرج.</div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#c5a880]/10 text-slate-200 font-bold font-bold bg-[#091526]">
                  <th className="py-3 px-3">نوع الكيان</th>
                  <th className="py-3 px-3">اسم العميل</th>
                  <th className="py-3 px-3">السجل الموحد / الهوية</th>
                  <th className="py-3 px-3">رقم الجوال</th>
                  <th className="py-3 px-3">واتساب إشعار</th>
                  <th className="py-3 px-3">العنوان / الممثل</th>
                  <th className="py-3 px-3">ملاحظات عدلية</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredClients.map(c => (
                  <tr key={c.id} className="border-b border-slate-850[#0f2742] transition-colors text-white font-bold">
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                        c.clientType === "company" ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold" : "bg-[#c5a880]/10 text-[#c5a880]"
                      }`}>
                        {c.clientType === "company" ? "منشأة تجارية" : c.clientType === "government" ? "حكومية" : "مواطن/فرد"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-3.5 px-3 font-mono">{c.nationalId}</td>
                    <td className="py-3.5 px-3 text-mono">{c.phone || "غير محدد"}</td>
                    <td className="py-3.5 px-3">
                      {c.whatsappEnabled ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> مفعّل
                        </span>
                      ) : (
                        <span className="text-slate-700">معطل</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      {c.representativeName ? `عن طريق: ${c.representativeName}` : c.address || "لا يوجد عنوان وطني مضاف"}
                    </td>
                    <td className="py-3.5 px-3 max-w-[200px] truncate" title={c.notes}>{c.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={clientOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sortedAndFilteredClients.map(c => (
                  <SortableClientCard 
                    key={c.id} 
                    client={c} 
                    size={clientSizes[c.id] || 'small'} 
                    onToggleSize={toggleSize} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* WhatsApp & Email Templates Section */}
      <LegalTemplatesSection clients={clients} />
    </div>
  );
}

/* Sub-component for clean organization and avoidance of token limit */
interface LegalTemplate {
  id: string;
  name: string;
  category: "تذكير بالجلسات" | "فواتير ومطالبات" | "تحديثات";
  body: string;
}

interface CrmTemplate {
  id: string;
  name: string;
  category: "تذكير بالجلسات" | "فواتير ومطالبات" | "تحديثات";
  body: string;
}

function LegalTemplatesSection({ clients }: { clients: Client[] }) {
  const [templates, setTemplates] = useState<LegalTemplate[]>([
    {
      id: "tpl-1",
      name: "إشعار وتذكير بجلسة قضائية",
      category: "تذكير بالجلسات",
      body: "مرحباً بك يا {clientName}، نود تذكيركم بوجود جلسة قادمة لدعواكم المقيدة برقم {caseNumber} في {courtName}، وذلك في يوم {sessionDate} في تمام الساعة {sessionTime} م. بوابة العملاء التفاعلية: {portalLink}"
    },
    {
      id: "tpl-2",
      name: "إصدار فاتورة وتنبيه السداد",
      category: "فواتير ومطالبات",
      body: "الموقر {clientName}، تم إصدار مطالبة مالية لملف القضية رقم {caseNumber}. نأمل التفضل بالسداد عبر رابط البورصة المالية للتسهيل: {portalLink}"
    },
    {
      id: "tpl-3",
      name: "تغيير وتحديث حالة القضية",
      category: "تحديثات",
      body: "عميلنا الكريم {clientName}، طرأت مستجدات جديدة لقضيتكم رقم {caseNumber}. الحالة الحالية: {sessionDate}. يرجى فحص المستجدات بالبوابة الآمنة: {portalLink}"
    }
  ]);

  const [activeTemplate, setActiveTemplate] = useState<CrmTemplate | null>(null);
  const [tplName, setTplName] = useState("");
  const [tplCategory, setTplCategory] = useState<CrmTemplate["category"]>("تذكير بالجلسات");
  const [tplBody, setTplBody] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Default testing client swapping state
  const [selectedPreviewClientId, setSelectedPreviewClientId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  // Variable helper list
  const APPROVED_VARS = ["{clientName}", "{caseNumber}", "{sessionDate}", "{sessionTime}", "{courtName}", "{portalLink}"];

  // Analyze text to find invalid variables
  const findInvalidVariables = (text: string) => {
    const matches = text.match(/\{[^}]*\}/g) || [];
    return matches.filter(v => !APPROVED_VARS.includes(v));
  };

  const invalidVarsFound = findInvalidVariables(tplBody);
  const isTemplateValid = invalidVarsFound.length === 0;

  // Insert variable tag at current text focus cursor
  const handleInsertTag = (tag: string) => {
    const textarea = document.getElementById("tpl-body-textarea") as HTMLTextAreaElement;
    if (!textarea) {
      setTplBody(prev => prev + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = tplBody.substring(0, start);
    const after = tplBody.substring(end, tplBody.length);
    setTplBody(before + tag + after);
    setTimeout(() => {
      textarea.focus();
      const newCursor = start + tag.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 50);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName || !tplBody) return;
    if (!isTemplateValid) return; // Prevent saving

    if (isEditing && activeTemplate) {
      setTemplates(prev => prev.map(t => t.id === activeTemplate.id ? { ...t, name: tplName, category: tplCategory, body: tplBody } : t));
      setSuccessMsg("تم تعديل قالب الرسائل الموحد وحفظه بنجاح!");
    } else {
      const newTpl: CrmTemplate = {
        id: `tpl-${Date.now()}`,
        name: tplName,
        category: tplCategory,
        body: tplBody
      };
      setTemplates(prev => [...prev, newTpl]);
      setSuccessMsg("تم حفظ وتثبيت القالب الجديد بالمنظومة!");
    }

    setTimeout(() => {
      setSuccessMsg("");
      setIsEditing(false);
      setActiveTemplate(null);
      setTplName("");
      setTplBody("");
    }, 2000);
  };

  // Live preview interpolator using selected preview client profile data
  const renderPreviewTranslation = () => {
    // Determine active sample customer card
    const targetCli = clients.find(c => c.id === selectedPreviewClientId) || clients[0] || {
      name: "منصور بن خالد الدوسري",
      nationalId: "1029394944",
      phone: "+966 50 293 8493"
    };

    let viewText = tplBody || "(يرجى كتابة نص القالب أو اختيار أحد القوالب الجاهزة أدناه...)";
    viewText = viewText.replace(/{clientName}/g, targetCli.name);
    viewText = viewText.replace(/{caseNumber}/g, "441093849");
    viewText = viewText.replace(/{sessionDate}/g, "1447/04/18 هـ");
    viewText = viewText.replace(/{sessionTime}/g, "09:30 ص");
    viewText = viewText.replace(/{courtName}/g, "المحكمة التجارية بالرياض (الدائرة الثالثة)");
    viewText = viewText.replace(/{portalLink}/g, "https://aladalah.sa/portal/m-dousari");

    return viewText;
  };

  return (
    <div className="bg-[#0b1e33] border border-[#c5a880]/20 rounded-xl p-5 space-y-5 text-xs text-white font-bold">
      <div className="border-b border-[#c5a880]/15 pb-3">
        <h3 className="text-sm font-bold text-[#c5a880] flex items-center gap-2">
          <MessageSquareCode className="w-4.5 h-4.5 text-amber-400" />
          <span>محرر قوالب رسائل الـ WhatsApp والبريد الإلكتروني الموحد</span>
        </h3>
        <p className="text-xs text-slate-900  mt-1">تجهيز قوالب الإرسال الملحوقة بالمتغيرات النشطة، والتحقق الفوري من صحة الرموز المرفقة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Template Form Builder / Editor */}
        <div className="space-y-4">
          <form onSubmit={handleSaveTemplate} className="bg-[#11243f] border border-slate-800 rounded-xl p-4 space-y-4">
            <span className="text-xs bg-amber-500 text-amber-400 border border-amber-500 px-2 py-0.5 rounded-full font-bold">
              {isEditing ? "تعديل قالب عدلي" : "إنشاء قالب رسالة جديد"}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-900 ">اسم القالب الإشاري:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تبليغ الجلسات للموكلين"
                  value={tplName}
                  onChange={e => setTplName(e.target.value)}
                  className="w-full bg-[#0b1e33] border border-slate-700 rounded p-2 text-slate-100 placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-900 ">تصنيف وقسم القالب:</label>
                <select
                  value={tplCategory}
                  onChange={e => setTplCategory(e.target.value as CrmTemplate["category"])}
                  className="w-full bg-[#0b1e33] border border-slate-700 rounded p-2 text-white font-bold cursor-pointer"
                >
                  <option value="تذكير بالجلسات">تذكير بالجلسات</option>
                  <option value="فواتير ومطالبات">فواتير ومطالبات</option>
                  <option value="تحديثات">تحديثات</option>
                </select>
              </div>
            </div>

            {/* Approved tag insert toolbar */}
            <div className="space-y-1">
              <span className="text-xs text-slate-900  font-semibold block">شريط إدراج المتغيرات بمؤشر الكتابة:</span>
              <div className="flex flex-wrap gap-1.5 bg-[#0b1e33] p-2 border border-slate-850 rounded">
                {APPROVED_VARS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="bg-[#11243f][#c5a880]/15 border border-[#c5a880]/20 text-[#c5a880] px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors active:scale-95"
                    title="انقر للإدراج فوراً"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Template text area body */}
            <div className="space-y-1">
              <label className="text-slate-900  flex justify-between">
                <span>مضمون رسالة القالب:</span>
                <span className="text-xs text-amber-400">التحقق اللائحي للأقواس النشطة</span>
              </label>
              <textarea
                id="tpl-body-textarea"
                rows={5}
                required
                placeholder="اكتب مضمون الرسالة مستخدماً الرموز المذكورة أعلاه..."
                value={tplBody}
                onChange={e => setTplBody(e.target.value)}
                className="w-full bg-[#0b1e33] border border-[#c5a880]/30 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            {/* Validation warning block */}
            {!isTemplateValid && (
              <div className="bg-red-500 border border-red-500 text-red-400 p-2.5 rounded-lg space-y-1 animate-pulse">
                <span className="font-bold flex items-center gap-1">❌ تحذير: تم اكتشاف متغيرات مجهولة أو غير مدعومة باللون الأحمر:</span>
                <div className="flex flex-wrap gap-1 font-mono text-xs">
                  {invalidVarsFound.map((bad, iv) => (
                    <span key={iv} className="bg-red-500 text-red-300 px-1.5 py-0.5 rounded border border-red-500">
                      {bad}
                    </span>
                  ))}
                </div>
                <span className="text-xs block text-slate-900  leading-normal">
                  يرجى استخدام الأقواس والرموز الستة المدعومة فقط، لمنع حدوث غش أو خطأ في الربط الآلي وتطبيق ناجز.
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-xs text-slate-900 ">حالة الامتثال: {isTemplateValid ? "✅ القالب نظامي وصالح" : "❌ متعطل لوجود وسوم مجهولة"}</span>
              <div className="flex gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setActiveTemplate(null);
                      setTplName("");
                      setTplBody("");
                    }}
                    className="bg-sky-50 border border-slate-700 px-3.5 py-2 rounded text-slate-900  cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isTemplateValid}
                  className="bg-[#c5a880] text-[#061224] disabled:opacity-40 disabled:cursor-not-allowed font-bold px-4 py-2 rounded transition-all cursor-pointer"
                >
                  {isEditing ? "حفظ التغييرات" : "حفظ وتثبيت القالب للمجموعة"}
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="bg-emerald-500 border border-emerald-500 text-emerald-400 p-2 text-center rounded font-bold">
                {successMsg}
              </div>
            )}
          </form>
        </div>

        {/* Live Client Swapping & Final Translation Output Render */}
        <div className="space-y-4">
          <div className="bg-[#11243f] border border-slate-830 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2">
              <span className="font-bold text-[#c5a880] text-xs">معاينة الرسائل والمحاكة بالهويات الحية</span>
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-xs text-slate-900  shrink-0">تبديل العميل التجريبي:</span>
                <select
                  value={selectedPreviewClientId}
                  onChange={e => setSelectedPreviewClientId(e.target.value)}
                  className="bg-[#0b1e33] border border-[#c5a880]/30 text-white font-bold text-sm rounded p-1 w-full sm:w-44 focus:outline-none focus:border-[#c5a880]"
                >
                  <option value="">-- العميل المفتوح تلقائياً --</option>
                  {clients.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Smart simulated preview card showing what it actually looks like */}
            <div className="bg-[#0b1e33] border border-[#c5a880]/30 rounded-xl p-4 relative overflow-hidden space-y-3 font-sans">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-[#c5a880] to-[#b29367]"></div>
              
              <div className="flex justify-between items-center text-xs text-slate-900  border-b border-slate-850 pb-2 mb-1.5">
                <span>نمط معاينة الرسالة المستلمة بهاتف العميل</span>
                <span className="font-mono text-[#c5a880]">Saudi MOJ Virtual Hub</span>
              </div>

              {/* Message preview body */}
              <div className="text-sm leading-relaxed text-white font-bold bg-[#11243f]/60 p-3 rounded-lg border border-slate-800 break-words whitespace-pre-wrap">
                {renderPreviewTranslation()}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-900 ">
                <span>رقم هاتف المستفيد: {clients.find(c => c.id === selectedPreviewClientId)?.phone || "+966 50 123 4567"}</span>
                <span>تزامن آلي وآمن دائم</span>
              </div>
            </div>

            {/* Preset template chooser */}
            <div className="space-y-2 pt-1">
              <span className="text-xs text-slate-900  font-bold block">القوالب العدلية الجاهزة (حدد للتحميل المباشر):</span>
              <div className="grid grid-cols-1 gap-2">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setActiveTemplate(tpl);
                      setTplName(tpl.name);
                      setTplCategory(tpl.category);
                      setTplBody(tpl.body);
                      setIsEditing(true);
                    }}
                    className="bg-[#0b1e33] p-2.5 rounded-lg border border-slate-800 flex justify-between items-center cursor-pointer transition-colors text-right"
                  >
                    <div>
                      <span className="font-bold text-white font-bold text-xs block">{tpl.name}</span>
                      <span className="text-xs text-amber-400 bg-[#11243f] px-1.5 py-0.5 rounded font-mono inline-block mt-1">
                        {tpl.category}
                      </span>
                    </div>
                    <span className="text-xs text-[#c5a880]">تحرير القالب ✎</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

interface SortableClientCardProps {
  client: Client;
  size: 'small' | 'medium' | 'large';
  onToggleSize: (id: string, e: React.MouseEvent) => void;
  key?: any;
}

function SortableClientCard({ client, size, onToggleSize }: SortableClientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: client.id });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const colSpanClass = size === 'large' 
    ? "col-span-1 md:col-span-3" 
    : size === 'medium' 
    ? "col-span-1 md:col-span-2" 
    : "col-span-1";

  return (
    <div ref={setNodeRef} style={style} className={`${colSpanClass} transition-all duration-300`}>
      <InteractiveCard hasGoldBorder={true}>
        <div className="relative p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-slate-200 font-bold" {...attributes} {...listeners}>
              <GripVertical className="w-4 h-4 text-slate-700" />
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                {client.clientType === 'company' ? <Building className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={(e) => onToggleSize(client.id, e)} 
                className="p-1 px-1.5 bg-slate-900 border border-slate-750 text-[#c5a880] text-[9.5px] font-mono rounded font-black cursor-pointer"
                title="تغيير قياس الكرت ديناميكياً"
              >
                {size === 'large' ? 'كبير ٣x' : size === 'medium' ? 'متوسط ٢x' : 'صغير ١x'}
              </button>
            </div>
          </div>

          <div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
              client.clientType === "company" ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold border border-amber-500/20" : "bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/30"
            }`}>
              {client.clientType === "company" ? "منشأة تجارية" : client.clientType === "government" ? "جهة حكومية" : "مواطن/فرد"}
            </span>
            <h4 className="text-sm font-black text-white mt-2.5 leading-snug">{client.name}</h4>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-slate-800/40">
            <div className="flex justify-between font-mono">
              <span className="text-slate-200 font-bold">الهوية الموحدة:</span>
              <span className="text-white font-bold">{client.nationalId}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-200 font-bold">رقم الهاتف:</span>
              <span className="text-white font-bold">{client.phone || "غير محدد"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-200 font-bold">الممثل / العنوان:</span>
              <span className="text-amber-300 truncate max-w-[140px]" title={client.representativeName || client.address}>
                {client.representativeName ? `الوكيل: ${client.representativeName}` : client.address || "لا يوجد عنوان وطني"}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-850 text-[10px]">
            <span className="text-slate-200 font-bold font-bold">حالة إشعار الواتساب:</span>
            {client.whatsappEnabled ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> مفعّل وتلقائي
              </span>
            ) : (
              <span className="text-slate-200 font-bold">معطل نظاماً</span>
            )}
          </div>
        </div>
      </InteractiveCard>
    </div>
  );
}

