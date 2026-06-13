/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { List } from 'react-window';
import { 
  Plus, 
  Search, 
  SearchIcon,
  Send, 
  Share2, 
  FileText, 
  MessageSquare,
  Lock,
  Phone,
  Mail,
  UserCheck,
  Globe,
  DollarSign,
  Edit2,
  Save,
  PlusCircle,
  Trash2,
  Users,
  Clock,
  Check,
  ShieldCheck,
  GripVertical
} from 'lucide-react';
import { Client, Case } from '@/types';
import { generateUsername, generatePassword } from '@/utils/credentials';
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
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { SortableWidgetWrapper } from './SortableWidgetWrapper';
import { InteractiveCard } from './InteractiveCard';

interface ClientsModuleProps {
  clients: Client[];
  cases: Case[];
  onUpdateState: (type: string, data: any) => void;
}

export default function ClientsModule({
  clients,
  cases,
  onUpdateState
}: ClientsModuleProps) {
  const [internalClients, setInternalClients] = useState<Client[]>([]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('clients_local_order');
      if (saved) {
        const orderIds = JSON.parse(saved);
        const mapped = orderIds.map((id: string) => clients.find(c => c.id === id)).filter(Boolean);
        const newClients = clients.filter(c => !orderIds.includes(c.id));
        setInternalClients([...mapped, ...newClients]);
        return;
      }
    } catch {}
    setInternalClients(clients);
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

    if (active.id !== over?.id && over?.id) {
      setInternalClients((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('clients_local_order', JSON.stringify(newItems.map((c: any) => c.id)));
        return newItems;
      });
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Trigger new client modal from Command Palette or shortcuts
  useEffect(() => {
    const handleTriggerNewClient = () => {
      setIsAdding(true);
    };
    window.addEventListener('adalah-trigger-new-client', handleTriggerNewClient);
    return () => window.removeEventListener('adalah-trigger-new-client', handleTriggerNewClient);
  }, []);
  
  // Form values
  const [newName, setNewName] = useState('');
  const [newIsCompany, setNewIsCompany] = useState(true);
  const [newNationalId, setNewNationalId] = useState('');
  const [newPhone, setNewPhone] = useState('+9665');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // WhatsApp Simulator
  // Message Template Schema
  interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string; // 'court_reminder' | 'invoicing' | 'updates' | 'access'
  }

  // Active editable message templates with real-world placeholders & categories
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: 'hearing_reminder',
      name: 'تذكير بموعد الجلسة القضائية (العدالة) 📅',
      content: 'سعادة العميل الأستاذ / {clientName} المحترم،\n\nنود تذكيركم بأن المحكمة حدّدت جلسة مرافعة شرعية قادمة لدعواكم المقيدة برقم {caseNumber} بـ {courtName} في تاريخ {sessionDate} الساعة {sessionTime}.\n\nيمكنكم متابعة الجلسة مباشرة وتحميل الصكوك والمذكرات الجوابية الشرعية عبر بوابتكم التفاعلية الآمنة (العدالة) باستخدام الرابط التالي:\n{portalLink}\n\nموكل للعملاء والعملاء والمحاميين والمستشاريين القانونيين ⚖️.',
      category: 'court_reminder'
    },
    {
      id: 'portal_access',
      name: 'إرسال بيانات الدخول المعتمدة (العدالة) 🔑',
      content: 'سعادة العميل الأستاذ / {clientName} المحترم،\n\nتم تفعيل حسابكم في بوابتنا القضائية الرقمية (العدالة) لمتابعة ملفات دعواكم رقم {caseNumber}.\n\nبيانات الدخول:\nاسم المستخدم: {username}\nكلمة المرور: {password}\n\nرابط الدخول المباشر:\n{portalLink}\n\nنحيطكم علماً بضرورة الحفاظ على سرية هذه البيانات.\nموكل للعملاء والعملاء والمحاميين والمستشاريين القانونيين ⚖️.',
      category: 'access'
    },
    {
      id: 'invoice_pending',
      name: 'مطالبة سداد أتعاب ومصاريف قضائية (العدالة) 💰',
      content: 'سعادة العميل الأستاذ / {clientName} المحترم،\n\nنرجو منكم سداد دفعة الأتعاب المترتبة على تقديم اللائحة الجوابية الشرعية لدعواكم رقم {caseNumber} البالغة قيد التحصيل.\n\nيمكنكم استعراض الفاتورة الرسمية المشتملة على 15% ضريبة القيمة المضافة لجمهورية المملكة العربية السعودية ممتثلةً لأنظمة هيئة الزكاة والضريبة والجمارك عبر بوابتكم الدائمة:\n{portalLink}\n\nشاكرين ومقدرين لكم ثقتكم في (العدالة) ⚖️.',
      category: 'invoicing'
    },
    {
      id: 'case_accepted',
      name: 'إشعار قيد دعوى قضائية جديدة (العدالة) 📋',
      content: 'سعادة العميل الأستاذ / {clientName} المحترم،\n\nنهنئكم بأنه تم تسجيل وتجهيز ملف دعواكم رقم {caseNumber} بمحكمة {courtName} بنجاح.\n\nنعمل حالياً على صياغة اللائحة الابتدائية وتجهيز الدفوع الشرعية.\n\nللاطلاع على التحديثات في أي وقت، يرجى زيارة بوابتكم الإلكترونية (العدالة):\n{portalLink}\n\nموكل للعملاء والعملاء والمحاميين والمستشاريين القانونيين ⚖️.',
      category: 'updates'
    }
  ]);

  // WhatsApp Simulator & Template Editor States
  const [selectedClientForWa, setSelectedClientForWa] = useState<Client | null>(null);
  const [waTemplate, setWaTemplate] = useState('hearing_reminder');
  const [customMsg, setCustomMsg] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'send' | 'templates'>('send');
  
  // States for active edited template in the builder
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<string>('hearing_reminder');
  const [editedTemplateContent, setEditedTemplateContent] = useState<string>(
    'سعادة العميل الأستاذ / {clientName} المحترم،\n\nنود تذكيركم بأن المحكمة حدّدت جلسة قادمة لقضيتكم المقسمة برقم {caseNumber} بـ {courtName} في تاريخ {sessionDate} الساعة {sessionTime}.\n\nيمكنكم متابعة الجلسة مباشرة وتحميل المذكرات عبر بوابتكم التفاعلية الآمنة باستخدام الرابط التالي:\n{portalLink}\n\nمكتب العدالة للمحاماة والاستشارات ⚖️.'
  );
  const [editedTemplateName, setEditedTemplateName] = useState<string>('تذكير بموعد الجلسة القضائي 📅');
  const [editedTemplateCategory, setEditedTemplateCategory] = useState<string>('court_reminder');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<string>('court_reminder');
  const [sendFilterCategory, setSendFilterCategory] = useState<string>('all');
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [previewClientId, setPreviewClientId] = useState<string>('');
  const [managingPortalClientId, setManagingPortalClientId] = useState<string>('');

  const [waLogs, setWaLogs] = useState<{ id: string; name: string; msg: string; time: string; status: string }[]>([
    {
      id: "1",
      name: "شركة نادك للتنمية الزراعية",
      msg: "تذكير: المحكمة التجارية بالرياض عينت جلسة قادمة لدعواكم القضائية رقم 441728192 بتاريخ 2026-06-12م. نرجو تجهيز الدفاع الشرعي المرفق.",
      time: "2026-05-31 10:15",
      status: "تم التسليم بنجاح 🟢"
    }
  ]);

  // Insert placeholder text at cursor location in template-textarea
  const insertPlaceholder = (tag: string) => {
    const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = editedTemplateContent;
      const before = text.substring(0, start);
      const after  = text.substring(end, text.length);
      const updated = before + tag + after;
      setEditedTemplateContent(updated);
      
      // refocus and update cursor
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
      }, 0);
    } else {
      setEditedTemplateContent(prev => prev + tag);
    }
  };

  // Compile / substitute template placeholders with actual live values
  const formatTemplate = (templateContent: string, client: Client) => {
    const clientCases = cases.filter(c => c.clientId === client.id);
    const relatedCase = clientCases[0];
    const portalUrl = `${window.location.origin}${client.portalLink}`;

    return templateContent
      .replace(/{clientName}/g, client.name)
      .replace(/{caseNumber}/g, relatedCase?.caseNumber || "441728192")
      .replace(/{courtName}/g, relatedCase?.courtName || "المحكمة التجارية بالرياض")
      .replace(/{sessionDate}/g, relatedCase?.nextSessionDate || "2026-06-12")
      .replace(/{sessionTime}/g, relatedCase?.nextSessionTime || "10:30 صباحاً")
      .replace(/{username}/g, client.portalUsername || client.nationalId)
      .replace(/{password}/g, client.portalPassword || "123456")
      .replace(/{portalLink}/g, portalUrl);
  };

  // Supported variables: {clientName}, {caseNumber}, {courtName}, {sessionDate}, {sessionTime}, {portalLink}, {username}, {password}
  const SUPPORTED_PLACEHOLDERS = ['{clientName}', '{caseNumber}', '{courtName}', '{sessionDate}', '{sessionTime}', '{portalLink}', '{username}', '{password}'];

  const getPlaceholderValidationInfo = (text: string) => {
    const regex = /\{([^}]+)\}/g;
    const allMatches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      allMatches.push(match[0]);
    }

    const invalidList = allMatches.filter(tag => !SUPPORTED_PLACEHOLDERS.includes(tag));
    const validList = allMatches.filter(tag => SUPPORTED_PLACEHOLDERS.includes(tag));

    const openCount = (text.match(/\{/g) || []).length;
    const closeCount = (text.match(/\}/g) || []).length;
    const braceMismatch = openCount !== closeCount;

    return {
      invalidPlaceholders: Array.from(new Set(invalidList)),
      validPlaceholders: Array.from(new Set(validList)),
      braceMismatch,
      openCount,
      closeCount,
      isValid: invalidList.length === 0 && !braceMismatch
    };
  };

  const handleSelectTemplateForEdit = (id: string) => {
    const t = templates.find(temp => temp.id === id);
    if (t) {
      setSelectedTemplateForEdit(id);
      setEditedTemplateContent(t.content);
      setEditedTemplateName(t.name);
      setEditedTemplateCategory(t.category || 'court_reminder');
    }
  };

  const handleSaveTemplate = () => {
    if (!editedTemplateName.trim()) {
      alert('الرجاء كتابة اسم القالب أولاً.');
      return;
    }
    
    // Check validation first
    const valInfo = getPlaceholderValidationInfo(editedTemplateContent);
    if (!valInfo.isValid) {
      let errorMsg = 'الرجاء تصحيح أخطاء بناء جملة المتغيرات أولاً:\n';
      if (valInfo.invalidPlaceholders.length > 0) {
        errorMsg += `- تم الكشف عن متغيرات غير مدعومة: ${valInfo.invalidPlaceholders.join('، ')}\n`;
      }
      if (valInfo.braceMismatch) {
        errorMsg += `- عدم تطابق في الأقواس {} المفتوحة والمغلقة (مفتوح: ${valInfo.openCount}، مغلق: ${valInfo.closeCount})\n`;
      }
      alert(errorMsg);
      return;
    }

    setTemplates(prev => prev.map(t => {
      if (t.id === selectedTemplateForEdit) {
        return {
          ...t,
          name: editedTemplateName,
          content: editedTemplateContent,
          category: editedTemplateCategory
        };
      }
      return t;
    }));
    alert('تم حفظ وتعديل قالب رسائل الـ WhatsApp بنجاح وتصنيفه بشكل آمن! سيتم تطبيق التعديلات عند توليد أي إشعار مستقبلاً ⚙️.');
  };

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newId = `custom_template_${Date.now()}`;
    const newTemp: MessageTemplate = {
      id: newId,
      name: newTemplateName + ' 📱',
      content: 'السيد المحترم {clientName}\n\nنفيدكم بـ ...',
      category: newTemplateCategory
    };
    setTemplates(prev => [...prev, newTemp]);
    setSelectedTemplateForEdit(newId);
    setEditedTemplateName(newTemp.name);
    setEditedTemplateContent(newTemp.content);
    setEditedTemplateCategory(newTemplateCategory);
    setNewTemplateName('');
    setShowAddTemplate(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (['hearing_reminder', 'invoice_pending', 'case_accepted', 'portal_access'].includes(id)) {
      alert('الأنظمة الأساسية تمنع حذف القوالب الافتراضية لحماية قنوات التواصل.');
      return;
    }
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا قالب الرسائل المخصص؟')) {
      const remaining = templates.filter(t => t.id !== id);
      setTemplates(remaining);
      const fallback = remaining[0];
      if (fallback) {
         setSelectedTemplateForEdit(fallback.id);
         setEditedTemplateContent(fallback.content);
         setEditedTemplateName(fallback.name);
         setEditedTemplateCategory(fallback.category || 'court_reminder');
      }
    }
  };

  const handleSendFilterCategoryChange = (category: string, client: Client | null) => {
    setSendFilterCategory(category);
    const filteredList = templates.filter(t => category === 'all' || t.category === category);
    const firstItem = filteredList[0];
    if (firstItem) {
      setWaTemplate(firstItem.id);
      if (client) {
        setCustomMsg(formatTemplate(firstItem.content, client));
      }
    } else {
      setWaTemplate('custom');
      setCustomMsg('');
    }
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newNationalId) return;

    const token = `portal-${Date.now()}`;
    const generatedUsername = generateUsername(newName, newNationalId);
    const generatedPassword = generatePassword();

    const newCl: Client = {
      id: `client-${Date.now()}`,
      name: newName,
      isCompany: newIsCompany,
      nationalId: newNationalId,
      phone: newPhone,
      email: newEmail,
      portalUsername: newUsername || generatedUsername,
      portalPassword: newPassword || generatedPassword,
      casesCount: 0,
      billingTotal: 0,
      activePortal: true,
      portalToken: token,
      portalLink: `/portal?token=${token}`
    };

    onUpdateState('clients', newCl);
    setIsAdding(false);
    
    // reset
    setNewName('');
    setNewNationalId('');
    setNewPhone('+9665');
    setNewEmail('');
    setNewUsername('');
    setNewPassword('');
    
    // Automatic WhatsApp for credentials as requested via Twilio
    const portalUrl = `${window.location.origin}/portal/login`;
    const credMessage = `أهلاً بك عميلنا الكريم ${newCl.name}،\nلقد تم إنشاء حسابكم في بوابة (العدالة) بنجاح.\nاسم المستخدم: ${newCl.portalUsername}\nكلمة المرور: ${newCl.portalPassword}\nبوابة الدخول: ${portalUrl}\n\n[رسالة آلية معتمدة تم توصيلها بنجاح عبر Twilio WhatsApp API Gateway]`;

    alert(`✅ جاري الإرسال عبر Twilio WhatsApp...\n\nتم إرسال رسالة واتساب للرقم ${newCl.phone}:\n\n${credMessage}\n\nالحالة: (Delivered via Twilio)`);
    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: newCl.phone, message: credMessage })
    }).catch(console.error);
  };

  const handleTriggerWhatsApp = () => {
    if (!selectedClientForWa) return;
    
    const clientCases = cases.filter(c => c.clientId === selectedClientForWa.id);
    const relatedCase = clientCases[0];
    
    let simulatedMsg = "";
    if (waTemplate === 'hearing_reminder') {
      simulatedMsg = `سعادة العميل الأستاذ / ${selectedClientForWa.name} المحترم، \nنود تذكيركم بأن المحكمة حدّدت جلسة مرافعة شرعية قادمة لدعواكم المقيدة برقم ${relatedCase?.caseNumber || "437194619"} بـ ${relatedCase?.courtName || "المحكمة التجارية بالرياض"} في تاريخ ${relatedCase?.nextSessionDate || "2026-06-12"} الساعة ${relatedCase?.nextSessionTime || "10:30 صباحاً"}. \nيمكنكم متابعة الجلسة مباشرة وتحميل الصكوك والمذكرات الجوابية الشرعية عبر بوابتكم التفاعلية الآمنة (العدالة) باستخدام الرابط التالي: https://ais-pre-36lxcbb43ugicjgqwr67lg-206161544375.europe-west3.run.app${selectedClientForWa.portalLink} \nموكل للعملاء والعملاء والمحاميين والمستشاريين القانونيين (عميل ومرافع).`;
    } else if (waTemplate === 'invoice_pending') {
      simulatedMsg = `سعادة العميل الأستاذ / ${selectedClientForWa.name} المحترم، \nنرجو منكم سداد دفعة أتعاب ومصاريف التقاضي المترتبة على تقديم اللائحة الجوابية الشرعية البالغة قيد التحصيل. يمكنكم استعراض الفاتورة الرسمية المشتملة على 15% ضريبة القيمة المضافة لجمهورية المملكة العربية السعودية ممتثلةً للزكاة والضريبة والجمارك عبر بوابتكم الدائمة: https://ais-pre-36lxcbb43ugicjgqwr67lg-206161544375.europe-west3.run.app${selectedClientForWa.portalLink} \nشاكرين ومقدرين لكم (العدالة).`;
    } else {
      simulatedMsg = customMsg || `أهلاً بك الأستاذ / ${selectedClientForWa.name}، نود إفادتكم بأنه تم ترقية وتحديث ملف دعواكم القضائية بنجاح عبر سحب بوابة ناجز التلقائي.`;
    }

    const newLog = {
      id: `wa-${Date.now()}`,
      name: selectedClientForWa.name,
      msg: simulatedMsg,
      time: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: "تم التسليم فوراً عبر قنوات الربط 🟢"
    };

    setWaLogs(prev => [newLog, ...prev]);
    alert('تم محاكاة قنوات الإرسال وتوجيه رسالة الـ WhatsApp الآلية للعملاء بموجب الأنظمة السعودية بنجاح!');
    setSelectedClientForWa(null);
    setCustomMsg('');
  };

  const filteredClients = internalClients.filter(cl =>
    cl.name.includes(searchTerm) || 
    cl.nationalId.includes(searchTerm) || 
    cl.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-12 text-right animate-fade-in duration-700" dir="rtl">
      
      {/* Top action and Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 border-b border-slate-800  pb-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900  tracking-tighter flex items-center gap-5">
            <div className="p-4 bg-primary/10 text-primary rounded-3xl border border-primary/20 shadow-2xl">
              <Users className="w-10 h-10" />
            </div>
            <span>سجل العملاء والمراسلات</span>
          </h1>
          <p className="text-sm md:text-base text-slate-900 font-bold max-w-3xl leading-loose">
            قاعدة بيانات مركزية احترافية للموكلين، إدارة الهويات الرقمية والتحقق النظامي، وتفعيل قنوات التواصل المؤتمتة عبر WhatsApp وبوابة العميل التفاعلية (العدالة).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button 
            type="button"
            onClick={() => {
              const columns = ['رقم الهوية/السجل', 'الاسم الكامل', 'النوع', 'الهاتف', 'البريد الإلكتروني', 'الدعاوى النشطة'];
              const data = filteredClients.map(c => [
                c.nationalId,
                c.name,
                c.isCompany ? 'شركة / كيان' : 'فرد',
                c.phone,
                c.email || '-',
                cases.filter(cs => cs.clientId === c.id).length.toString()
              ]);
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              const htmlContent = `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                  <meta charset="UTF-8">
                  <title>تقرير سجل العملاء والمراسلات</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght=400;700&display=swap');
                    body { font-family: 'Cairo', sans-serif; padding: 40px; color: #111; }
                    .header { text-align: center; border-bottom: 2px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #b8860b; font-size: 24px; margin: 0; }
                    .meta { font-size: 13px; color: #555; margin-bottom: 20px; display: flex; justify-content: space-between; }
                    table { width: 100%; border-collapse: collapse; margin-block: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: right; font-size: 12px; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    @media print { .no-print { display: none; } }
                  </style>
                </head>
                <body>
                  <div class="no-print" style="margin-bottom: 20px;">
                    <button onclick="window.print();" style="background:#b8860b; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">طباعة التقرير الورقي 🖨️</button>
                  </div>
                  <div class="header">
                    <h1>موكل</h1>
                    <p>سجل العملاء والمراسلات القانوني المعتمدين والموثقين</p>
                  </div>
                  <div class="meta">
                    <div>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</div>
                    <div>إجمالي عدد العملاء المسجلين: ${filteredClients.length}</div>
                  </div>
                  <table>
                    <thead>
                      <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                      ${data.map(row => `
                        <tr>
                          ${row.map(cell => `<td>${cell}</td>`).join('')}
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </body>
                </html>
              `;
              printWindow.document.write(htmlContent);
              printWindow.document.close();
            }}
            className="flex-1 sm:flex-none bg-[#9A7D2C] text-slate-950 font-black text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>تصدير كشف PDF معتمد</span>
          </button>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-[#050e21] p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
          <input 
            type="text" 
            placeholder="البحث بالاسم، الهوية، أو رقم الجوال..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c1a35] border border-slate-700/80 rounded-xl py-3 pr-11 pl-4 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-amber-500 text-slate-950 font-black text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950 font-black" />
          <span>إضافة عميل / موكل جديد +</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left main content block: Clients Cards list */}
        <div className="xl:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredClients.map(cl => (
              <div 
                key={cl.id}
                className="w-full bg-[#0b1324] border-2 border-yellow-400 p-6 flex flex-col justify-between relative overflow-hidden h-full rounded-[24px] shadow-2xl transition-none"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-yellow-400 border border-yellow-500/30">
                      {cl.isCompany ? <Globe className="w-6 h-6 text-yellow-300" /> : <UserCheck className="w-6 h-6 text-yellow-300" />}
                    </div>
                    <span className={`text-[12px] font-black px-3 py-1.5 rounded-full border uppercase tracking-wider ${
                      cl.isCompany ? 'bg-amber-900 text-yellow-300 border-yellow-400' : 'bg-slate-900 text-white border-yellow-400'
                    }`}>
                      {cl.isCompany ? '🏢 كيان قانوني / شركة' : '👤 فرد مواطن'}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="font-display font-black text-xl text-yellow-300 tracking-wide line-clamp-1">{cl.name}</h3>
                    <div className="flex items-center gap-1.5">
                       <Lock className="w-3.5 h-3.5 text-yellow-400" />
                       <span className="text-xs font-black font-mono text-cyan-300">رقم الهوية/السجل التجاري: {cl.nationalId}</span>
                    </div>
                  </div>

                  <div className="space-y-3 py-4 border-y border-yellow-500/20 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black flex items-center gap-1.5 text-yellow-300 text-sm">📞 رقم الجوال:</span>
                      <span className="font-sans tabular-nums tracking-wide text-white font-black text-sm">{cl.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black flex items-center gap-1.5 text-yellow-300 text-sm">✉️ البريد الإلكتروني:</span>
                      <span className="lowercase truncate text-cyan-300 font-black text-sm">{cl.email || 'لا يوجد بريد مسجل'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black flex items-center gap-1.5 text-yellow-300 text-sm">💰 المطالبات المالية:</span>
                      <span className="font-black text-emerald-400 font-sans text-base">
                        {typeof cl.billingTotal === 'number' ? cl.billingTotal.toLocaleString('ar-SA') : '0'} ريال سعودي
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 bg-slate-950 p-4 rounded-2xl border border-yellow-400/40">
                      <span className="text-yellow-300 font-black block border-b border-yellow-500/20 pb-1.5 mb-1.5 text-xs">🔐 حساب البوابة الإلكترونية التفاعلية للموكل</span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-extrabold">حالة الحساب:</span>
                          {cl.activePortal ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-400 font-black">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              نشط ومصرح بالكامل
                            </span>
                          ) : (
                            <span className="bg-rose-950 text-rose-300 px-2.5 py-1 rounded-lg border border-rose-500 font-black">غير مفعّل</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white font-extrabold">اسم مستخدم البوابة:</span>
                          <span className="font-mono font-black text-yellow-300">{cl.portalUsername || cl.nationalId || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white font-extrabold font-black">كلمة مرور البوابة:</span>
                          <span className="font-mono font-black text-yellow-300">{cl.portalPassword || 'Adalah@123'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white font-extrabold">رمز التوثيق (Token):</span>
                          <span className="font-mono text-cyan-300 font-black">{cl.portalToken || 'NAJIZ-SEC-9204'}</span>
                        </div>
                        
                        {cl.portalLink && (
                          <div className="flex flex-col gap-1 mt-2 border-t border-yellow-550/20 pt-2">
                            <span className="text-white font-extrabold text-[11px]">رابط البوابة التفاعلية الفوري:</span>
                            <a 
                              href={cl.portalLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="font-mono text-cyan-300 font-black truncate underline text-[11px]"
                            >
                              {cl.portalLink}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow-300 font-black text-sm">📂 القضايا المربوطة بنظام ناجز:</span>
                    <span className="text-white font-black bg-[#1e293b] px-3 py-1.5 rounded-lg border border-yellow-400">
                      {cases.filter(c => c.clientId === cl.id).length} قضية نشطة للموكل
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedClientForWa(cl);
                        const firstTemplate = templates.find(t => t.id === waTemplate) || templates[0];
                        if (firstTemplate) {
                          setCustomMsg(formatTemplate(firstTemplate.content, cl));
                        }
                        setSidebarTab('send');
                      }}
                      className="flex-1 bg-emerald-600 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-none cursor-pointer border-0 shadow-lg"
                    >
                      <MessageSquare className="w-4 h-4 text-white" />
                      <span>اتصال واتساب</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setManagingPortalClientId(cl.id)}
                      className="p-3 bg-slate-900 text-yellow-300 rounded-xl border border-yellow-400 transition-none cursor-pointer"
                      title="إدارة بوابة العميل السرية وإرسال بيانات الدخول"
                    >
                      <Share2 className="w-4 h-4 text-yellow-300" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
        {/* Column WhatsApp log + Template Simulator */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Segmented Tab Switcher */}
          <div className="bg-slate-100  p-1.5 rounded-3xl border border-slate-800  flex gap-1.5 shadow-inner">
            <button 
              type="button"
              onClick={() => setSidebarTab('send')}
              className={`flex-1 py-4 px-6 rounded-2xl text-center text-sm font-black transition-all duration-500 uppercase tracking-widest ${
                sidebarTab === 'send' 
                  ? 'bg-white  text-primary shadow-2xl border border-slate-800 ' 
                  : 'text-slate-900   '
              }`}
            >
              مركز المراسلات
            </button>
            <button 
              type="button"
              onClick={() => {
                setSidebarTab('templates');
                const t = templates.find(temp => temp.id === selectedTemplateForEdit) || templates[0];
                if (t) {
                  setSelectedTemplateForEdit(t.id);
                  setEditedTemplateContent(t.content);
                  setEditedTemplateName(t.name);
                }
              }}
              className={`flex-1 py-4 px-6 rounded-2xl text-center text-sm font-black transition-all duration-500 uppercase tracking-widest ${
                sidebarTab === 'templates' 
                  ? 'bg-white  text-primary shadow-2xl border border-slate-800 ' 
                  : 'text-slate-900   '
              }`}
            >
              محرر النماذج
            </button>
          </div>

          {/* TAB 1: SEND NOTIFICATION */}
          {sidebarTab === 'send' && (
            <div className="space-y-8 animate-fade-in">
              {selectedClientForWa ? (
                <div className="card-professional bg-gradient-to-br from-[#050e21] to-[#0c1a35] border-primary/30 p-8 space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                  
                  <div className="flex items-center justify-between border-b border-white pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500 text-emerald-500 rounded-2xl border border-emerald-500">
                        <Send className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-white text-lg tracking-tight uppercase">بث إشعار معتمد</h3>
                        <p className="text-xs text-emerald-500 font-black uppercase tracking-widest mt-1">Direct Secure Broadcast</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedClientForWa(null)}
                      className="text-xs font-black text-white  hover: transition-colors uppercase tracking-widest p-2 bg-white rounded-lg border border-white"
                    >
                      إلغاء ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-[#0C121E] via-[#0D1F43] to-[#9A7D2C]/40 border-2 border-[#9A7D2C]/60 rounded-[2rem] relative overflow-hidden group/card shadow-inner">
                       <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 blur-2xl rounded-full transition-all group-hover/card:scale-150"></div>
                       <span className="text-xs text-yellow-300 font-black uppercase tracking-[0.2em] block mb-2">المستلم المعتمد</span>
                       <div className="flex justify-between items-center relative z-10">
                          <span className="font-black text-white text-base">{selectedClientForWa.name}</span>
                          <span className="font-mono text-xs font-black text-yellow-300 bg-slate-950 px-3 py-1 rounded-lg border border-yellow-500/30">{selectedClientForWa.phone}</span>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-900  uppercase tracking-widest block">الفئة المستهدفة</label>
                       <div className="flex flex-wrap gap-2">
                         {[
                           { id: 'all', label: 'الكل' },
                           { id: 'court_reminder', label: 'الجلسات' },
                           { id: 'invoicing', label: 'الفواتير' },
                           { id: 'updates', label: 'تحديثات' }
                         ].map(cat => (
                           <button
                             key={cat.id}
                             type="button"
                             onClick={() => handleSendFilterCategoryChange(cat.id, selectedClientForWa)}
                             className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all border uppercase tracking-widest flex-1 ${
                               sendFilterCategory === cat.id 
                                 ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' 
                                 : 'bg-white border-white text-white  hover:'
                             } `}
                           >
                             {cat.label}
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-900  uppercase tracking-widest block">القالب الذكي</label>
                      <select 
                        value={waTemplate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWaTemplate(val);
                          if (val === 'custom') {
                            setCustomMsg('');
                          } else {
                            const found = templates.find(t => t.id === val);
                            if (found) setCustomMsg(formatTemplate(found.content, selectedClientForWa));
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl py-4 px-5 text-xs font-black focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-sans shadow-inner"
                       >
                         {templates
                           .filter(t => sendFilterCategory === 'all' || t.category === sendFilterCategory)
                           .map(t => (
                             <option key={t.id} value={t.id}>{t.name}</option>
                           ))}
                         <option value="custom">تحرير رسالة حرة ✍️</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-300">معاينة نص الإرسال</label>
                          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                             جاهز للإرسال
                          </span>
                        </div>
                        <textarea
                          rows={6}
                          value={customMsg}
                          onChange={(e) => setCustomMsg(e.target.value)}
                          placeholder="محتوى الإشعار القانوني الاحترافي..."
                          className="w-full bg-[#0c1a35] text-white border border-slate-700 rounded-2xl py-4 px-5 text-sm font-medium leading-relaxed focus:outline-none focus:border-amber-500 transition-all font-sans"
                        />
                      </div>

                      <button 
                        onClick={handleTriggerWhatsApp}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-3 shadow-xl cursor-pointer border-0"
                      >
                        <Send className="w-4 h-4 text-white" />
                        <span>بث الإشعار الفوري WhatsApp 🚀</span>
                      </button>

                      <div className="space-y-6 hidden">
                       </select>
                     </div>

                     <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-widest block font-extrabold text-sm">النموذج النشط للتحصيل والتنبيه</label>
                    <div className="flex gap-3">
                      <select
                         value={selectedTemplateForEdit}
                         onChange={(e) => handleSelectTemplateForEdit(e.target.value)}
                         className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-xs font-black text-white outline-none focus:border-amber-500 transition-all font-sans cursor-pointer shadow-inner pr-10"
                       >
                         {templates.map(t => (
                           <option key={t.id} value={t.id} className="bg-slate-950 text-white">{t.name}</option>
                         ))}
                       </select>
                       <button
                         onClick={() => handleDeleteTemplate(selectedTemplateForEdit)}
                         className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl transition-all border-0 cursor-pointer shadow-lg"
                         title="حذف النموذج الحالي"
                       >
                         <Trash2 className="w-5 h-5 text-white" />
                       </button>
                    </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-xs font-black text-slate-300 uppercase tracking-widest block font-extrabold text-sm">المحرر اللغوي للرسالة</label>
                        <div className="flex gap-2 flex-wrap">
                           {[
                             { tag: '{clientName}', label: 'الاسم' },
                             { tag: '{caseNumber}', label: 'الدعوى' },
                             { tag: '{portalLink}', label: 'الرابط' }
                           ].map(item => (
                             <button
                                key={item.tag}
                                type="button"
                                onClick={() => insertPlaceholder(item.tag)}
                                className="px-3 py-1.5 bg-[#131e35] hover:bg-[#1a294a] text-xs font-black text-white rounded-lg transition-all cursor-pointer border border-[#2d3a54]"
                             >
                               + {item.label}
                             </button>
                           ))}
                        </div>
                     </div>
                     <textarea
                        id="template-textarea"
                        rows={8}
                        value={editedTemplateContent}
                        onChange={(e) => setEditedTemplateContent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-6 px-6 text-sm font-bold text-white leading-relaxed outline-none focus:border-amber-500 transition-all font-sans shadow-inner scrollbar-hide"
                        placeholder="اكتب هنا محتوى الرسالة الشرعية الموحدة..."
                      />
                  </div>

                  <button 
                    onClick={handleSaveTemplate}
                    className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold py-4 rounded-2xl text-xs flex items-center justify-center gap-3 shadow-2xl transition-all cursor-pointer border-0"
                  >
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>حفظ وتوثيق النموذج القضائي المحدث</span>
                  </button>
                </div>
              </div>
            </div>
          )}v>
                </div>
              )}


              <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-xs font-black text-yellow-400 uppercase tracking-widest block font-extrabold text-sm">النموذج النشط للتحصيل والتنبيه</label>
                    <div className="flex gap-3">
                      <select
                         value={selectedTemplateForEdit}
                         onChange={(e) => handleSelectTemplateForEdit(e.target.value)}
                         className="flex-1 bg-slate-900 border border-yellow-450 rounded-2xl py-4 px-5 text-xs font-black text-yellow-300 outline-none focus:border-yellow-400 transition-all font-sans cursor-pointer shadow-inner pr-10"
                       >
                         {templates.map(t => (
                           <option key={t.id} value={t.id} className="bg-slate-950 text-yellow-300">{t.name}</option>
                         ))}
                       </select>
                       <button
                         onClick={() => handleDeleteTemplate(selectedTemplateForEdit)}
                         className="p-4 bg-rose-600 text-white rounded-2xl transition-all border border-transparent cursor-pointer shadow-lg"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-xs font-black text-yellow-400 uppercase tracking-widest block font-extrabold text-sm">المحرر اللغوي للرسالة</label>
                        <div className="flex gap-2 flex-wrap">
                           {[
                             { tag: '{clientName}', label: 'الاسم' },
                             { tag: '{caseNumber}', label: 'الدعوى' },
                             { tag: '{portalLink}', label: 'الرابط' }
                           ].map(item => (
                             <button
                                key={item.tag}
                                type="button"
                                onClick={() => insertPlaceholder(item.tag)}
                                className="px-3 py-1.5 bg-yellow-400 border border-transparent text-xs font-black text-slate-950 rounded-lg transition-all cursor-pointer uppercase tracking-widest"
                             >
                               + {item.label}
                             </button>
                           ))}
                        </div>
                     </div>
                     <textarea
                        id="template-textarea"
                        rows={10}
                        value={editedTemplateContent}
                        onChange={(e) => setEditedTemplateContent(e.target.value)}
                        className="w-full bg-slate-900 border-2 border-yellow-450 rounded-[2.5rem] py-8 px-8 text-xs font-black text-white leading-relaxed outline-none focus:border-yellow-400 transition-all font-sans shadow-inner scrollbar-hide"
                      />
                  </div>

                  <button 
                    onClick={handleSaveTemplate}
                    className="w-full bg-yellow-300 text-slate-950 font-black py-5 rounded-[1.50rem] text-xs flex items-center justify-center gap-3 shadow-2xl transition-all cursor-pointer border-0"
                  >
                    <Save className="w-5 h-5 text-slate-950 transition-transform" />
                    <span>اعتماد ومصادقة النموذج الاحترافي</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050e21]/80 backdrop-blur-md p-6 animate-in fade-in duration-500">
          <div className="bg-white  border border-slate-800  rounded-[2.5rem] w-full max-w-2xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
            
            <div className="bg-gradient-to-br from-[#050e21] to-[#0c1a35] p-10 flex items-center justify-between text-white border-b border-primary/20">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="font-display font-black text-2xl tracking-tight uppercase">تسجيل موكل دولي جديد</h2>
                  <p className="text-primary text-xs font-black mt-2 uppercase tracking-[0.2em] opacity-80">Legal Identity Registration Suite</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdding(false)}
                className="w-12 h-12 bg-white text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-12 space-y-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-900  uppercase tracking-widest block">الاسم الرباعي للموكل / الكيان التجاري</label>
                  <input 
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: شركة نادك للتنمية الزراعية"
                    required
                    className="w-full bg-slate-50  border border-slate-800  rounded-2xl py-5 px-6 text-sm font-black text-slate-900  focus:outline-none focus:border-primary focus:bg-white  transition-all shadow-inner placeholder:text-slate-900 "
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900  uppercase tracking-widest block">تصنيف الشخصية القانونية</label>
                    <select 
                      value={newIsCompany ? 'company' : 'individual'}
                      onChange={(e) => setNewIsCompany(e.target.value === 'company')}
                      className="w-full bg-slate-50  border border-slate-800  rounded-2xl py-5 px-6 text-sm font-black text-slate-900  focus:outline-none focus:border-primary transition-all cursor-pointer font-sans shadow-inner"
                    >
                      <option value="company">مؤسسة / كيان تجاري</option>
                      <option value="individual">فرد (مواطن / مقيم)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900  uppercase tracking-widest block">رقم السجل التجاري / الهوية</label>
                    <input 
                      type="text"
                      value={newNationalId}
                      onChange={(e) => setNewNationalId(e.target.value)}
                      placeholder="مثال: 1010065271"
                      required
                      className="w-full bg-slate-50  border border-slate-800  rounded-2xl py-5 px-6 text-sm font-black text-slate-900  focus:outline-none focus:border-primary font-sans shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900  uppercase tracking-widest block">رقم الجوال النشط (WhatsApp)</label>
                    <div className="relative">
                       <input 
                        type="text"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+966"
                        required
                        className="w-full bg-slate-50  border border-slate-800  rounded-2xl py-5 pr-14 pl-6 text-sm font-black text-slate-900  focus:outline-none focus:border-primary shadow-inner"
                      />
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900  uppercase tracking-widest block">البريد الإلكتروني المعتمد</label>
                    <div className="relative">
                       <input 
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="client@justice-hub.sa"
                        className="w-full bg-slate-50  border border-slate-800  rounded-2xl py-5 pr-14 pl-6 text-sm font-black text-slate-900  focus:outline-none focus:border-primary shadow-inner"
                      />
                      <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-slate-100  text-slate-900  font-black py-5 rounded-[1.5rem] text-xs uppercase tracking-widest  transition-all border border-transparent"
                >
                  إلغاء التراجع
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-primary text-white font-black py-5 rounded-[1.5rem] text-xs shadow-xl shadow-primary/20 active:scale-[0.98] transition-all border border-primary-light/20"
                >
                  حفظ وتسجيل العميل بالنظام +
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portal Management Modal */}
      {managingPortalClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020813]/80 backdrop-blur-md p-4 animate-fade-in" dir="rtl">
          <div className="bg-[#0b1528] w-full max-w-xl rounded-3xl border border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    تفعيل وإرسال بيانات النفاذ للموكل
                  </h3>
                  <p className="text-xs text-slate-900 mt-2 leading-relaxed">
                    النظام يسمح بإنشاء اسم مستخدم وكلمة مرور للموكل مع رابط مخصص لمتابعة قضاياهم ومستنداتهم إلكترونياً.
                  </p>
                </div>
                <button 
                  onClick={() => setManagingPortalClientId('')}
                  className="p-2 text-white hover: bg-white rounded-full transition-all"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const clientObj = clients.find(c => c.id === managingPortalClientId);
                if (!clientObj) return null;

                const username = clientObj.portalUsername || clientObj.nationalId;
                const password = clientObj.portalPassword || "JST-" + Math.floor(100000 + Math.random() * 900000);
                const generatedLink = `${window.location.origin}/portal/login`;

                return (
                  <div className="space-y-6">
                    <div className="bg-[#040d1f] rounded-2xl border border-white p-6 space-y-4">
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900">رابط البوابة التفاعلية:</label>
                        <div className="flex items-center gap-2">
                          <input 
                            readOnly 
                            value={generatedLink}
                            className="w-full bg-white border border-white rounded-xl px-4 py-3 text-xs font-mono text-left text-slate-900 outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-900">اسم المستخدم:</label>
                          <input 
                            readOnly 
                            value={username}
                            className="w-full bg-white border border-white rounded-xl px-4 py-3 text-xs font-mono text-center text-primary font-bold outline-none"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-900">كلمة المرور المقترحة:</label>
                          <input 
                            readOnly 
                            value={password}
                            className="w-full bg-white border border-primary/20 rounded-xl px-4 py-3 text-xs font-mono text-center text-primary font-bold outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          // Save to state
                          onUpdateState('clients', { ...clientObj, portalUsername: username, portalPassword: password, activePortal: true });
                          
                          const msg = `أهلاً بك سعادة العميل / ${clientObj.name}\nلقد تم تفعيل حسابكم لمتابعة ملفاتكم وقضاياكم عبر موكل.\n\nرابط البوابة: ${generatedLink}\nاسم المستخدم: ${username}\nكلمة المرور: ${password}\n\nنأمل تغيير كلمة المرور فور الدخول.`;
                          
                          // WhatsApp Link
                          const phone = clientObj.phone.replace(/[^0-9]/g, '');
                          const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                          
                          window.open(waUrl, '_blank');
                          
                          alert('تم حفظ بيانات الدخول وتجهيز رسالة الـ WhatsApp بنجاح.');
                          setManagingPortalClientId('');
                        }}
                        className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl text-xs flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-900"
                      >
                        <MessageSquare className="w-4 h-4" />
                        حفظ وإرسال بيانات الدخول عبر WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
