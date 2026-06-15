/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Send, 
  Share2, 
  FileText, 
  MessageSquare,
  Lock,
  Phone,
  Mail,
  UserCheck,
  Globe,
  Edit2,
  Save,
  Trash2,
  Users,
  Clock,
  ShieldCheck,
  ChevronRight,
  Filter,
  RefreshCw,
  LogOut,
  UserPlus
} from 'lucide-react';
import { Client, Case } from '@/types';
import { generateUsername, generatePassword } from '@/utils/credentials';
import { supabase } from '@/lib/supabase';

interface ClientsModuleProps {
  clients: Client[];
  cases: Case[];
  onUpdateState: (type: string, data: any) => void;
}

// Module-level in-memory cache for Google Access Token
let cachedGoogleAccessToken: string | null = null;

export default function ClientsModule({
  clients,
  cases,
  onUpdateState
}: ClientsModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Google Integration States
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(cachedGoogleAccessToken);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Form values for new client
  const [newName, setNewName] = useState('');
  const [newIsCompany, setNewIsCompany] = useState(true);
  const [newNationalId, setNewNationalId] = useState('');
  const [newPhone, setNewPhone] = useState('+9665');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Message Template Schema
  interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string; 
  }

  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: 'hearing_reminder',
      name: 'تذكير بموعد الجلسة القضائية 📅',
      content: 'سعادة العميل الأستاذ / {clientName} المحترم،\n\nنود تذكيركم بأن المحكمة حدّدت جلسة مرافعة شرعية قادمة لدعواكم المقيدة برقم {caseNumber} في تاريخ {sessionDate}.\n\nيمكنكم المتابعة عبر بوابة العميل:\n{portalLink}\n\nنحن هنا لخدمتكم ⚖️.',
      category: 'court_reminder'
    },
    {
      id: 'portal_access',
      name: 'إرسال بيانات دخول البوابة 🔑',
      content: 'سعادة العميل الأستاذ / {clientName} المحترم،\n\nتم تفعيل حسابكم في بوابة العميل الرقمية.\n\nبيانات الدخول:\nاسم المستخدم: {username}\nكلمة المرور: {password}\n\nرابط الدخول:\n{portalLink}\n\nنأمل الحفاظ على سرية البيانات.\nموكل للخدمات القانونية ⚖️.',
      category: 'access'
    }
  ]);

  const [selectedClientForWa, setSelectedClientForWa] = useState<Client | null>(null);
  const [waTemplate, setWaTemplate] = useState('hearing_reminder');
  const [customMsg, setCustomMsg] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'send' | 'templates'>('send');
  
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<string>('hearing_reminder');
  const [editedTemplateContent, setEditedTemplateContent] = useState<string>('');
  const [editedTemplateName, setEditedTemplateName] = useState<string>('');
  const [sendFilterCategory, setSendFilterCategory] = useState<string>('all');
  const [managingPortalClientId, setManagingPortalClientId] = useState<string>('');

  useEffect(() => {
    const t = templates.find(temp => temp.id === selectedTemplateForEdit);
    if (t) {
      setEditedTemplateContent(t.content);
      setEditedTemplateName(t.name);
    }
  }, [selectedTemplateForEdit, templates]);

  const formatTemplate = (templateContent: string, client: Client) => {
    const clientCases = cases.filter(c => c.clientId === client.id);
    const relatedCase = clientCases[0];
    const portalUrl = `${window.location.origin}${client.portalLink}`;

    return templateContent
      .replace(/{clientName}/g, client.name)
      .replace(/{caseNumber}/g, relatedCase?.caseNumber || "441728192")
      .replace(/{portalLink}/g, portalUrl)
      .replace(/{username}/g, client.portalUsername || client.nationalId)
      .replace(/{password}/g, client.portalPassword || "123456")
      .replace(/{sessionDate}/g, relatedCase?.nextSessionDate || "2026-06-20");
  };

  const handleSelectTemplateForEdit = (id: string) => {
    setSelectedTemplateForEdit(id);
  };

  const handleSaveTemplate = () => {
    setTemplates(prev => prev.map(t => {
      if (t.id === selectedTemplateForEdit) {
        return { ...t, name: editedTemplateName, content: editedTemplateContent };
      }
      return t;
    }));
    alert('✅ تم حفظ التغييرات على القالب بنجاح.');
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newNationalId) return;

    const token = `portal-${Date.now()}`;
    const genUser = generateUsername(newName, newNationalId);
    const genPass = generatePassword();

    const newCl: Client = {
      id: `client-${Date.now()}`,
      name: newName,
      isCompany: newIsCompany,
      nationalId: newNationalId,
      phone: newPhone,
      email: newEmail,
      portalUsername: newUsername || genUser,
      portalPassword: newPassword || genPass,
      casesCount: 0,
      billingTotal: 0,
      activePortal: true,
      portalToken: token,
      portalLink: `/portal?token=${token}`
    };

    onUpdateState('clients', newCl);
    setIsAdding(false);
    setNewName('');
    setNewNationalId('');
    setNewPhone('+9665');
    setNewEmail('');
    setNewUsername('');
    setNewPassword('');
    
    alert(`✅ تم إضافة الموكل ${newCl.name} بنجاح.`);
  };

  const handleTriggerWhatsApp = () => {
    if (!selectedClientForWa) return;
    alert(`🚀 جاري إرسال الرسالة إلى ${selectedClientForWa.phone} عبر WhatsApp...`);
    setSelectedClientForWa(null);
    setCustomMsg('');
  };

  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/contacts.readonly',
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Note: Full contact sync will require redirection.
      setSyncError('ميزة مزامنة جهات الاتصال تتطلب إعادة توجيه الصفحة، قد يكون ذلك محدوداً في بيئة المعاينة.');
    } catch (err: any) {
      console.error('[Google Contacts] Auth error:', err);
      setSyncError(err.message || 'فشلت عملية المصادقة الرقمية مع حساب Google');
    } finally {
      setIsSyncing(false);
    }
  };

  const importGoogleContacts = async (token: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=50',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setGoogleAccessToken(null);
          cachedGoogleAccessToken = null;
          throw new Error('انتهت صلاحية جلسة الاتصال. يرجى تسجيل الدخول مجدداً.');
        }
        throw new Error(`فشل جلب جهات الاتصال (الرمز: ${response.status})`);
      }

      const data = await response.json();
      const connections = data.connections || [];
      
      let importedCount = 0;
      connections.forEach((person: any) => {
        const name = person.names?.[0]?.displayName;
        const phone = person.phoneNumbers?.[0]?.value;
        const email = person.emailAddresses?.[0]?.value;

        if (name && phone) {
          // Check if already exists by phone
          const exists = clients.some(c => c.phone === phone);
          if (!exists) {
            const token = `portal-${Date.now()}-${Math.random()}`;
            const id = `client-google-${Date.now()}-${Math.random()}`;
            const genUser = generateUsername(name, phone.slice(-4));
            const genPass = generatePassword();

            const newCl: Client = {
              id,
              name,
              isCompany: false,
              nationalId: `G-${phone.slice(-6)}`,
              phone,
              email: email || '',
              portalUsername: genUser,
              portalPassword: genPass,
              casesCount: 0,
              billingTotal: 0,
              activePortal: true,
              portalToken: token,
              portalLink: `/portal?token=${token}`
            };
            onUpdateState('clients', newCl);
            importedCount++;
          }
        }
      });

      if (importedCount > 0) {
        alert(`✅ تم استيراد ومزامنة ${importedCount} جهة اتصال جديدة بنجاح من حساب Google الخاص بك!`);
      } else {
        alert('ℹ️ لا توجد جهات اتصال جديدة للاستيراد أو أن جميع جهات الاتصال مسجلة مسبقاً.');
      }
    } catch (err: any) {
      console.error('[Google Contacts] Sync error:', err);
      setSyncError(err.message || 'خطأ أثناء مزامنة جهات الاتصال');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredClients = clients.filter(cl =>
    cl.name.includes(searchTerm) || 
    cl.nationalId.includes(searchTerm) || 
    cl.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8 text-right animate-in fade-in duration-700" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-400 font-black" />
            <span>إدارة الموكلين والمراسلات</span>
          </h1>
          <p className="text-slate-700 font-medium mt-2">سجل شامل لكافة العملاء مع أدوات التواصل الفوري والتحكم في بوابات الوصول.</p>
        </div>
      </div>

      {/* Search and Quick Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 font-bold" />
            <input 
              type="text" 
              placeholder="البحث بالاسم، الهوية، أو الجوال..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-11 pl-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="w-full lg:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موكل جديد</span>
        </button>
      </div>

      {syncError && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-900 font-bold flex justify-between items-center animate-in slide-in-from-top-2">
          <span>⚠️ {syncError}</span>
          <button onClick={() => setSyncError(null)} className="text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Clients List */}
        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.map(cl => (
              <div 
                key={cl.id}
                className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-amber-400 font-black">
                    {cl.isCompany ? <Globe className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${cl.isCompany ? 'bg-amber-50 border-amber-200 text-amber-400 font-black' : 'bg-slate-50 border-slate-200 text-slate-200 font-bold'}`}>
                    {cl.isCompany ? 'مؤسسة / كيان' : 'فرد موكل'}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="font-bold text-lg text-slate-900">{cl.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono">ID: {cl.nationalId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs border-t border-slate-100 pt-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">الجوال:</span>
                    <span className="font-sans font-bold text-slate-900" dir="ltr">{cl.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">البريد:</span>
                    <span className="text-slate-900 font-bold truncate max-w-[150px]">{cl.email || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setSelectedClientForWa(cl);
                      const t = templates.find(x => x.id === waTemplate) || templates[0];
                      if (t) setCustomMsg(formatTemplate(t.content, cl));
                      setSidebarTab('send');
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>واتساب</span>
                  </button>
                  <button 
                    onClick={() => setManagingPortalClientId(cl.id)}
                    className="p-2.5 bg-slate-100 border border-slate-200 text-slate-200 font-bold rounded-lg hover:bg-slate-200 transition-all"
                    title="إدارة البوابة"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messaging & Template Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200 shadow-inner">
            <button 
              onClick={() => setSidebarTab('send')}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${sidebarTab === 'send' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-700'}`}
            >
              مركز المراسلة
            </button>
            <button 
              onClick={() => setSidebarTab('templates')}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${sidebarTab === 'templates' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-700'}`}
            >
              محرر القوالب
            </button>
          </div>

          {sidebarTab === 'send' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-in slide-in-from-right-4 duration-500">
              {selectedClientForWa ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-slate-900">إرسال إشعار فوري</h3>
                    <button onClick={() => setSelectedClientForWa(null)} className="text-xs text-rose-500 font-bold hover:underline">إلغاء ×</button>
                  </div>
                  
                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-white">
                    <span className="text-[10px] text-amber-500 font-bold block mb-1">المستلم المعتمد</span>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">{selectedClientForWa.name}</span>
                      <span className="font-mono text-[10px] text-slate-200 font-bold">{selectedClientForWa.phone}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700">القالب الذكي</label>
                    <select 
                      value={waTemplate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWaTemplate(val);
                        const t = templates.find(x => x.id === val);
                        if (t) setCustomMsg(formatTemplate(t.content, selectedClientForWa));
                        else setCustomMsg('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      <option value="custom">رسالة مخصصة ✍️</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700">محتوى الإشعار</label>
                    <textarea 
                      rows={6}
                      value={customMsg}
                      onChange={(e) => setCustomMsg(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                    />
                  </div>

                  <button 
                    onClick={handleTriggerWhatsApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 transition-all border-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>بث الرسالة الآن WhatsApp</span>
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100 text-white font-bold">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-700 font-bold">حدد موكلاً من القائمة لبدء مراسلتة الفورية.</p>
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'templates' && (
            <div className="bg-[#0b1324] border-2 border-[#FFEA00]/30 rounded-[2.5rem] p-8 space-y-8 animate-in slide-in-from-right-4 duration-500 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFEA00]/50 to-transparent"></div>
               
               <div className="space-y-2">
                 <h3 className="text-xl font-black flex items-center gap-3" style={{ color: '#FFEA00' }}>
                   <Edit2 className="w-6 h-6 animate-pulse" style={{ color: '#FFEA00' }} />
                   محيط بناء النماذج
                 </h3>
                 <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#FFFFFF' }}>Aesthetic Legal Template Orchestrator</p>
               </div>

               <div className="space-y-3">
                 <label className="text-xs font-black uppercase tracking-widest block" style={{ color: '#FFFFFF' }}>القالب الحالي للتعديل</label>
                 <select 
                   value={selectedTemplateForEdit}
                   onChange={(e) => handleSelectTemplateForEdit(e.target.value)}
                   className="w-full bg-[#020617] border border-[#FFEA00]/40 rounded-2xl py-4 px-5 text-sm font-black focus:outline-none focus:border-[#FFEA00] transition-all cursor-pointer font-sans shadow-inner text-white"
                   style={{ color: '#FFFFFF', backgroundColor: '#020617' }}
                 >
                   {templates.map(t => (
                     <option key={t.id} value={t.id} className="bg-[#020617] text-white font-extrabold" style={{ color: '#FFFFFF', backgroundColor: '#020617' }}>
                       {t.name}
                     </option>
                   ))}
                 </select>
               </div>

               <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest block" style={{ color: '#FFFFFF' }}>نص النموذج المعتمد</label>
                    <textarea 
                      rows={10}
                      value={editedTemplateContent}
                      onChange={(e) => setEditedTemplateContent(e.target.value)}
                      className="w-full bg-[#020617] border border-[#FFEA00]/40 rounded-2xl py-6 px-6 text-sm font-bold leading-relaxed focus:outline-none focus:border-[#FFEA00] transition-all font-sans shadow-inner scrollbar-hide text-white"
                      style={{ color: '#FFFFFF', backgroundColor: '#020617' }}
                    />
                 </div>

                 <div className="flex flex-wrap gap-2 pt-2">
                    {['{clientName}', '{caseNumber}', '{portalLink}'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setEditedTemplateContent(prev => prev + tag)}
                        className="px-3 py-1.5 bg-[#020617] hover:bg-slate-900 text-[10px] font-black border rounded-lg transition-all cursor-pointer"
                        style={{ color: '#FFEA00', borderColor: '#FFEA00/30' }}
                      >
                        + {tag}
                      </button>
                    ))}
                 </div>

                 <button 
                    onClick={handleSaveTemplate}
                    className="w-full font-black py-5 rounded-2xl text-xs flex items-center justify-center gap-3 shadow-2xl transition-all border-0 active:scale-95 cursor-pointer"
                    style={{ backgroundColor: '#FFEA00', color: '#020617', boxShadow: '0 10px 25px -5px rgba(255, 234, 0, 0.3)' }}
                  >
                    <Save className="w-5 h-5" style={{ color: '#020617' }} />
                    <span className="font-extrabold" style={{ color: '#020617' }}>حفظ واعتماد التعديلات النهائية</span>
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-amber-500 p-8 flex justify-between items-center text-slate-950">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">تسجيل موكل جديد</h2>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">New Client Identity Registration</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdding(false)} 
                className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-all font-black text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-8 space-y-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">الاسم الكامل للموكل / الكيان</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="مثال: شركة النخبة للتطوير العقاري"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest">نوع الموكل</label>
                      <select 
                        value={newIsCompany ? 'company' : 'individual'}
                        onChange={(e) => setNewIsCompany(e.target.value === 'company')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none transition-all cursor-pointer font-sans"
                      >
                        <option value="company">شركة / كيان قانوني</option>
                        <option value="individual">فرد / موكل أصيل</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest">رقم الهوية / السجل</label>
                      <input 
                        type="text" 
                        value={newNationalId}
                        onChange={(e) => setNewNationalId(e.target.value)}
                        placeholder="10XXXXXXXX"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest">رقم الجوال (WhatsApp)</label>
                      <input 
                        type="text" 
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+966"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest">البريد الإلكتروني</label>
                      <input 
                        type="email" 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="client@law.sa"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-200 font-bold font-black py-4 rounded-xl text-xs transition-all"
                  >
                    إلغاء التراجع
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl text-xs shadow-lg shadow-amber-500/10 transition-all border-0 cursor-pointer"
                  >
                    حفظ وتسجيل الموكل بالنظام
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Portal Manager Minimalist Modal */}
      {managingPortalClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">إدارة نفاذ البوابة</h3>
                    <p className="text-xs text-slate-700 font-medium">التحكم في بيانات الدخول والارتباط الرقمي.</p>
                  </div>
                </div>
                <button onClick={() => setManagingPortalClientId('')} className="text-slate-200 font-bold hover:text-slate-200 font-bold transition-all">✕</button>
             </div>

             {(() => {
               const c = clients.find(cl => cl.id === managingPortalClientId);
               if (!c) return null;
               return (
                 <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                       <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-700 font-bold uppercase tracking-widest">اسم المستخدم المعتمد:</span>
                         <span className="font-mono font-black text-slate-900">{c.portalUsername || c.nationalId}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-700 font-bold uppercase tracking-widest">كلمة المرور الحالية:</span>
                         <span className="font-mono font-black text-amber-400 font-black">{c.portalPassword || '********'}</span>
                       </div>
                       <div className="pt-2">
                          <span className="text-[10px] text-slate-200 font-bold font-bold block mb-1">رابط النفاذ المباشر:</span>
                          <div className="bg-white border border-slate-200 p-2 rounded-lg text-[10px] font-mono text-emerald-600 truncate">{window.location.origin}{c.portalLink}</div>
                       </div>
                    </div>

                    <div className="flex gap-3">
                       <button 
                        onClick={() => {
                          const msg = `أهلاً بك سعادة العميل / ${c.name}\nلقد تم تفعيل حسابكم لمتابعة ملفاتكم وقضاياكم عبر بوابة العدالة.\n\nاسم المستخدم: ${c.portalUsername || c.nationalId}\nكلمة المرور: ${c.portalPassword || 'Adalah@123'}\n\nرابط البوابة: ${window.location.origin}/portal/login`;
                          alert(`✅ تم إرسال بيانات الدخول إلى ${c.phone} عبر WhatsApp بنجاح.`);
                          setManagingPortalClientId('');
                        }}
                        className="flex-1 bg-emerald-600 text-white font-black py-3.5 rounded-xl text-[11px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                       >
                         <Send className="w-4 h-4" />
                         بث البيانات عبر WhatsApp
                       </button>
                    </div>
                 </div>
               );
             })()}
          </div>
        </div>
      )}

    </div>
  );
}
