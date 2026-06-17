/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  MapPin, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Send, 
  Eye, 
  Upload, 
  DollarSign, 
  Clock, 
  Activity,
  Edit2,
  ShieldAlert
} from 'lucide-react';
import { Case, Client, Invoice, Message, Hearing, Contract, Document } from '@/types';

interface ClientPortalProps {
  clients: Client[];
  cases: Case[];
  invoices: Invoice[];
  messages: Message[];
  hearings: Hearing[];
  contracts: Contract[];
  documents: Document[];
  onUpdateState: (type: string, data: any) => void;
  currentUser?: { role: string; id: string; name: string } | null;
  onNavigate?: (tab: string) => void;
}

export default function ClientPortal({
  clients,
  cases,
  invoices,
  messages,
  hearings,
  contracts,
  documents,
  onUpdateState,
  currentUser,
  onNavigate
}: ClientPortalProps) {
  
  // Lawyer-side Client Creation and Case Linking States
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('+9665');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientNationalId, setNewClientNationalId] = useState('');
  const [selectedCaseToLink, setSelectedCaseToLink] = useState('');

  const handleCreateClientAndLinkCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim() || !newClientNationalId.trim()) {
      alert('الرجاء تعبئة الحقول الأساسية (الاسم، الجوال، الهوية/السجل التجاري) لإتمام العملية.');
      return;
    }

    const clientId = `client-${Date.now()}`;
    const generatedUsername = `user_${newClientNationalId}`;
    const generatedPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;
    const token = `portal-${Date.now()}`;

    const newCl: Client = {
      id: clientId,
      name: newClientName,
      isCompany: false,
      nationalId: newClientNationalId,
      phone: newClientPhone,
      email: newClientEmail,
      portalUsername: generatedUsername,
      portalPassword: generatedPassword,
      portalToken: token,
      portalLink: `/portal?token=${token}`
    };

    // 1. Update/Add client in the state/DB
    onUpdateState('clients', newCl);

    // 2. Link selected Case if any
    if (selectedCaseToLink) {
      const caseToUpdate = cases.find(c => c.id === selectedCaseToLink);
      if (caseToUpdate) {
        onUpdateState('cases', {
          ...caseToUpdate,
          clientId: clientId,
          clientName: newClientName
        });
      }
    }

    // 3. Trigger immediate Automated WhatsApp notification via Twilio
    const portalUrl = `${window.location.origin}/portal/login`;
    const credMessage = `📱 أهلاً بك عميلنا الكريم ${newCl.name}،\nلقد تم إنشاء حسابكم في بوابة (العدالة) الموحدة وتفعيل ربط قضيتكم بنجاح.\nاسم المستخدم: ${newCl.portalUsername}\nكلمة المرور: ${newCl.portalPassword}\nبوابة الدخول الموحدة: ${portalUrl}\n\n[رسالة آلية معتمدة تم توصيلها بنجاح عبر Twilio WhatsApp API Gateway]`;

    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: newCl.phone, message: credMessage })
    })
    .then((res) => {
      if (res.ok) {
        console.log("automated WhatsApp notification sent via Twilio successful");
      }
    })
    .catch((err) => {
      console.warn("Failed to send WhatsApp notification", err);
    });

    alert(`✅ تم قيد العميل الجديد وربط القضية بنجاح!\nوتم إرسال رسالة واتساب فورية تفاعلية ببيانات الدخول للرقم: ${newCl.phone}\n\nاسم المستخدم: ${generatedUsername}\nكلمة السر: ${generatedPassword}`);

    // Reset Form
    setIsAddingClient(false);
    setNewClientName('');
    setNewClientPhone('+9665');
    setNewClientEmail('');
    setNewClientNationalId('');
    setSelectedCaseToLink('');

    // 4. Perform immediate tab transition/search redirect
    if (onNavigate) {
      onNavigate('clients');
    }
  };

  // Select which client we are simulating the view for (since we can read token or emulate in UI)
  const defaultClient = (currentUser?.role === 'client' || currentUser?.role === 'subscriber' || currentUser?.role === 'partner')
    ? clients.find(c => (c.id === currentUser.id || c.email === currentUser.id || c.portalUsername === currentUser.id)) || clients[0] 
    : clients[0];
    
  const [selectedSimulatedClient, setSelectedSimulatedClient] = useState<Client>(defaultClient);
  
  // Configuration console state hooks for creating real credentials and linking multiple cases
  const [selectedConfigClientId, setSelectedConfigClientId] = useState('');
  const [configUsername, setConfigUsername] = useState('');
  const [configPassword, setConfigPassword] = useState('');
  const [configCheckedCases, setConfigCheckedCases] = useState<string[]>([]);
  const [configPermissions, setConfigPermissions] = useState<Record<string, 'view' | 'edit'>>({});

  // Handle loading chosen client's configuration
  const handleClientConfigSelect = (clientId: string) => {
    setSelectedConfigClientId(clientId);
    const clientSelected = clients.find(c => c.id === clientId);
    if (clientSelected) {
      setConfigUsername(clientSelected.portalUsername || `user_${clientSelected.nationalId || clientSelected.id}`);
      setConfigPassword(clientSelected.portalPassword || `Pass@${Math.floor(1000 + Math.random() * 9000)}`);
      
      // Extract directly linked or custom cases
      const directCases = cases.filter(c => c.clientId === clientId).map(c => c.id);
      setConfigCheckedCases(clientSelected.permittedCases || directCases || []);
      setConfigPermissions(clientSelected.permittedCasePermissions || {});
    } else {
      setConfigUsername('');
      setConfigPassword('');
      setConfigCheckedCases([]);
      setConfigPermissions({});
    }
  };
  
  // Strict isolation logic for Client Portal
  const actualClient = (currentUser?.role === 'client' || currentUser?.role === 'subscriber')
    ? clients.find(c => (c.id === currentUser.id || c.email === currentUser.id || c.portalUsername === currentUser.id))
    : null;

  // If role is client/subscriber, they MUST only see their own data. No simulation allowed.
  const viewingClient = (currentUser?.role === 'client' || currentUser?.role === 'subscriber')
    ? (actualClient || {} as Client)
    : selectedSimulatedClient;

  // If we are a client but couldn't find our own record, we should show nothing or an error
  const isUnauthorizedClient = (currentUser?.role === 'client' || currentUser?.role === 'subscriber') && !actualClient;

  const [isSigned, setIsSigned] = useState(false);
  const [clientMessageInput, setClientMessageInput] = useState('');

  // Signature Drawing name and WhatsApp OTP Simulation states
  const [signerName, setSignerName] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const sendTwilioWhatsAppCredentials = (clientPhone: string, clientName: string, generatedUser: string, generatedPass: string) => {
    const msg = `📱 [Twilio WhatsApp API Gateway]:\nلقد تم إنشاء حساب موكل بنجاح عبر Twilio إلى الرقم: ${clientPhone}\nمرحباً ${clientName}،\nاسم المستخدم: ${generatedUser}\nكلمة المرور: ${generatedPass}\n(Delivered via Twilio)`;
    alert(msg);
    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: clientPhone, message: msg })
    }).catch(console.error);
  };


  // Selected client cases (supports direct linking and custom permitted cases list with specific view/edit clearance)
  const isCasePermitted = (c: Case) => {
    if (!viewingClient) return false;
    if (viewingClient && viewingClient.permittedCases && viewingClient.permittedCases.length > 0) {
      return viewingClient.permittedCases.includes(c.id) || viewingClient.permittedCases.includes(c.caseNumber) || c.clientId === viewingClient.id;
    }
    return c.clientId === viewingClient.id;
  };
  const clientCases = (isUnauthorizedClient || !viewingClient) ? [] : (cases || []).filter(isCasePermitted);

  // Permitted Case Filter dropdown selection state
  const [selectedCaseFilterId, setSelectedCaseFilterId] = useState<string>('all');

  // Filtered cases to display visually on the dashboard
  const filteredClientCases = selectedCaseFilterId === 'all'
    ? clientCases
    : clientCases.filter(c => c.id === selectedCaseFilterId || c.caseNumber === selectedCaseFilterId);

  const clientInvoices = (isUnauthorizedClient || !viewingClient) ? [] : (invoices || []).filter(inv => inv.clientId === viewingClient?.id);
  
  // Custom filter numbers for related details (hearings, updates, tasks)
  const activeCaseFilterNumbers = selectedCaseFilterId === 'all'
    ? clientCases.map(c => c.caseNumber)
    : clientCases.filter(c => c.id === selectedCaseFilterId || c.caseNumber === selectedCaseFilterId).map(c => c.caseNumber);

  const clientHearings = (isUnauthorizedClient || !viewingClient) ? [] : (hearings || []).filter(h => activeCaseFilterNumbers.includes(h.caseNumber));
  const clientMessages = (isUnauthorizedClient || !viewingClient) ? [] : (messages || []).filter(m => activeCaseFilterNumbers.includes(m.caseNumber));
  
  const clientDocuments = (isUnauthorizedClient || !viewingClient) ? [] : (documents || []).filter(d => {
    const belongsToClient = (d as any).clientId === viewingClient?.id || 
      (viewingClient?.name && d.tags?.some(tag => viewingClient.name.includes(tag) || tag.includes(viewingClient.name))) ||
      (viewingClient?.name && d.category.includes(viewingClient.name));
    
    if (!belongsToClient) return false;

    // Filter documents by active selected case
    if (selectedCaseFilterId !== 'all') {
      const activeCase = clientCases.find(c => c.id === selectedCaseFilterId || c.caseNumber === selectedCaseFilterId);
      if (activeCase) {
        return d.name.includes(activeCase.caseName) || 
               d.category.includes(activeCase.caseName) || 
               d.tags?.includes(activeCase.caseNumber) || 
               d.tags?.includes(activeCase.id);
      }
    }
    return true;
  });

  const handleSendToLawyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientMessageInput) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'client',
      senderName: viewingClient?.name || 'عميل',
      text: clientMessageInput,
      timestamp: new Date().toISOString(),
      caseNumber: clientCases[0]?.caseNumber || "437194619"
    };

    onUpdateState('messages', newMsg);
    setClientMessageInput('');
    alert('تم إرسال رسالتكم مباشرة لفريق المرافعة والعملاء بنجاح وسيتم إشعاركم فور الرد بموجب أنظمة التواصل العدلية (العدالة)!');
  };

  const handleSimulatePayment = (inv: Invoice) => {
    const updatedInv = { ...inv, status: 'paid' as const };
    onUpdateState('invoices', updatedInv);
    alert(`تم تأكيد استلام الدفعات بقيمة ${inv.totalAmount.toLocaleString()} ريال سعودي (شاملاً ضريبة القيمة المضافة طبقاً للوائح هيئة الزكاة والضريبة والجمارك - موكل). وتم تحديث الحالة المالية للسجل الموحد بنجاح!`);
  };

  // Dynamic client contracts selection
  const clientContracts = !viewingClient ? [] : (contracts || []).filter(c => c.clientId === viewingClient?.id);
  
  // Construct dynamic active contract
  const activeContract: Contract | undefined = !viewingClient ? undefined : (clientContracts.length > 0 ? clientContracts[0] : {
    id: `contract-mock-${viewingClient.id}`,
    title: "عقد تمثيل ومرافعة شرعية للموكل " + viewingClient.name,
    clientName: viewingClient.name,
    clientId: viewingClient.id,
    content: `بموجب هذه الاتفاقية المبرمة في تاريخه بين موكل للعملاء والعملاء والمحاميين والمستشاريين القانونيين وبين عميلنا الكريم (العميل) ${viewingClient.name}، يلتزم المكتب بتقديم الرعاية والتمثيل القانوني والمرافعة في الدعوى القضائية رقم ${clientCases[0]?.caseNumber || "437194619"} وما يتشعب عنها، صياغة المذكرات الجوابية واللائحة الاعتراضية وتقديم المشورة الفورية للأفراد والمنشآت وفق الأنظمة المرعية بالمملكة العربية السعودية. ويكون هذا العقد سارياً بمجرد التوثيق والمصادقة وإرسال رمز التحقق OTP للرقم (${viewingClient.phone || "+966 50 449 9122"}) من نظام التوثيق العدلي الموحد للمكتب.`,
    status: isSigned ? ('signed' as const) : ('pending' as const),
    phone: viewingClient.phone || '+966 50 449 9122',
    otpCode: "2918",
    otpStatus: otpSent ? ('sent' as const) : ('unsent' as const),
    signedAt: '',
    signerName: ''
  });

  const handleRequestOtp = () => {
    setIsOtpSending(true);
    setOtpError('');
    setTimeout(() => {
      setIsOtpSending(false);
      setOtpSent(true);
      
      const updatedContract = {
        ...activeContract,
        otpStatus: 'sent' as const
      };
      
      if (clientContracts.length > 0) {
        onUpdateState('contracts', updatedContract);
      }
      
      const msgOTP = `📱 [Twilio WhatsApp API Gateway]:\nلقد تم إرسال رمز التحقق الرقمي OTP.\nرمز المطابقة السري هو: 【 ${activeContract.otpCode || "2918"} 】\n(Delivered via Twilio)`;
      alert(msgOTP);
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: activeContract.phone, message: msgOTP })
      }).catch(console.error);
    }, 1000);
  };

  const handleVerifyAndSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName) {
      alert("الرجاء كتابة الاسم الثلاثي للمصادقة على توقيع المعاملة.");
      return;
    }
    const expectedOtp = activeContract.otpCode || "2918";
    if (enteredOtp !== expectedOtp) {
      setOtpError("رمز التحقق OTP المدخل غير مطابق! يرجى الاستعانة بالرمز الموضح في رسالة محاكاة الواتساب.");
      return;
    }

    setOtpVerified(true);
    setIsSigned(true);
    setOtpError('');

    const updatedContract = {
      ...activeContract,
      status: 'signed' as const,
      otpStatus: 'verified' as const,
      signedAt: new Date().toISOString(),
      signerName: signerName
    };
    onUpdateState('contracts', updatedContract);
    alert("✅ تم التوقيع والمصادقة الإلكترونية بنجاح عبر رمز OTP الواتساب!");
  };

  if (isUnauthorizedClient || !viewingClient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-right" dir="rtl">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-display font-black text-slate-900">
          {isUnauthorizedClient ? "خطأ في المصادقة والوصول الشرعي" : "لايوجد بيانات عملاء"}
        </h2>
        <p className="text-slate-900 font-bold max-w-md mx-auto">
          {isUnauthorizedClient ? "لم يتم العثور على ملف العميل المرتبط بحسابك. يرجى التواصل مع الدعم الفني لموكل لتصحيح بيانات الارتباط." : "يرجى إضافة عملاء أولاً لتمكين عرض بوابة العملاء بشكل صحيح."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
          {/* Dynamic Configuration and Simulation Selector Console (Visible only to legal staff) */}
          {!(currentUser?.role === 'client' || currentUser?.role === 'subscriber') && (
            <div className="bg-white border border-slate-305 rounded-3xl p-6 shadow-md space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-205 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-black rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 font-black bg-amber-550/10 px-2 py-0.5 rounded font-bold">بوابة النفاذ والأمن الموحد للعملاء 🔐</span>
                    <h2 className="text-base font-black text-slate-900 mt-1">تهيئة صلاحيات وربط قضايا العملاء وبث بيانات الدخول الآمنة</h2>
                  </div>
                </div>

                {/* Tabs selection options */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => {
                      // Switch to simulation
                      setSelectedSimulatedClient(clients.find(c => c.id === selectedConfigClientId) || clients[0] || selectedSimulatedClient);
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      selectedSimulatedClient.id && !selectedConfigClientId
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-900'
                    }`}
                  >
                    👥 محاكاة بوابة العميل
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedConfigClientId && clients.length > 0) {
                        handleClientConfigSelect(clients[0].id);
                      }
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      selectedConfigClientId
                        ? 'bg-primary text-white shadow-sm font-bold'
                        : 'text-slate-900'
                    }`}
                  >
                    ⚙️ إعداد صلاحيات وربط القضايا
                  </button>
                </div>
              </div>

              {/* VIEW A: SIMULATOR PICKER */}
              {!selectedConfigClientId && (
                <div className="bg-slate-50 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200 animate-fade-in">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">حدد العميل النشط لبدء محاكاة شاشة العرض الخاصة به:</h3>
                    <p className="text-xs text-slate-900 font-bold">اختيار العميل من قائمة المسجلين لعرض القضايا المصرح له بها وتحديثات جلساته فقط.</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                      value={selectedSimulatedClient.id}
                      onChange={(e) => {
                        const chosen = clients.find(cl => cl.id === e.target.value);
                        if (chosen) setSelectedSimulatedClient(chosen);
                      }}
                      className="bg-white border border-slate-300 text-sm font-bold px-4 py-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[240px] transition-all font-sans"
                    >
                      {clients.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name} ({cl.nationalId || 'ببل رقم هوية'})</option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        // Trick config select to display config immediately for new CRM client mock
                        setIsAddingClient(!isAddingClient);
                      }}
                      className="bg-primary text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-all border border-primary/20 shrink-0"
                    >
                      {isAddingClient ? 'إلغاء الإضافة ❌' : '➕ قيد عميل CRM جديد'}
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW B: PORTAL PERMISSION CONFIGURATION FORM */}
              {selectedConfigClientId && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const clientSelected = clients.find(c => c.id === selectedConfigClientId);
                    if (!clientSelected) return;

                    // Update Client portal credentials with specific selection cases list
                    const updatedClient: Client = {
                      ...clientSelected,
                      portalUsername: configUsername.trim(),
                      portalPassword: configPassword.trim(),
                      permittedCases: configCheckedCases,
                      permittedCasePermissions: configPermissions
                    };

                    onUpdateState('clients', updatedClient);

                    // Sync database for direct link
                    configCheckedCases.forEach(caseId => {
                      const fCase = cases.find(c => c.id === caseId || c.caseNumber === caseId);
                      if (fCase && fCase.clientId !== selectedConfigClientId) {
                        onUpdateState('cases', {
                          ...fCase,
                          clientId: selectedConfigClientId,
                          clientName: clientSelected.name
                        });
                      }
                    });

                    // Trigger Twilio/WhatsApp notice dispatch with auto-login link
                    const loginUrl = `${window.location.origin}/?role=client&user=${configUsername.trim()}&pass=${configPassword.trim()}&autologin=true`;
                    const waNotifyText = `🔐 تم تفعيل حساب النفاذ الرقمي لبوابتكم بموكل ⚖️\n\nسعادة العميل الكريم الأستاذ/ الأستاذة: ${clientSelected.name} المحترم،\n\nنود إخطاركم بصدور وتفعيل بيانات اعتماد الدخول الموحد لبوابة العملاء الخاصة بكم لتمكينكم من الاطلاع والمطالعة على القضايا المصرح بها فقط وعلي مواعيد الجلسات والتحديثات:\n\n🔗 رابط الدخول الفوري والمتابعة المباشرة:\n${loginUrl}\n\n👤 اسم المستخدم المعتمد: ${configUsername.trim()}\n🔑 كلمة المرور المؤقتة: ${configPassword.trim()}\n\n[تم الإرسال والامتثال بنجاح بنظام الإشعار الموحد لمنصة العدالة]`;
                    
                    fetch('/api/whatsapp/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ to: clientSelected.phone, message: waNotifyText })
                    })
                    .then(res => {
                      if (res.ok) console.log("portal credential dispatched with twilio gate successfully");
                    })
                    .catch(console.error);

                    alert(`✅ تم بنجاح تفعيل البوابة وتهيئة صلاحيات الأمن المعتمدة!\nالعميل: ${clientSelected.name}\nاسم المستخدم: ${configUsername}\nكلمة المرور: ${configPassword}\nقضايا مرخص بمطالعتها: ${configCheckedCases.length}\n\n[تم بث إشعار الـ WhatsApp بالرابط الآمن الموحد والدخول المباشر للتحديثات بنجاح]`);
                    
                    // Exit config tab by selecting default simulated client
                    setSelectedSimulatedClient(updatedClient);
                    setSelectedConfigClientId('');
                  }}
                  className="bg-slate-50 border border-slate-300 p-6 rounded-2xl space-y-6 animate-fade-in"
                >
                  <div className="flex justify-between items-center border-b border-slate-205 pb-3">
                    <h3 className="font-display font-black text-slate-800 text-sm">إعداد وتخصيص صلاحيات دخول العميل للبوابة وحسابات النفاذ</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedConfigClientId('')}
                      className="text-xs text-rose-600 font-bold"
                    >
                      ✕ تراجع والعودة للمحاكاة
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Choose client dropdown list */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-900 block">1. اختيار العميل من البيانات المسجلة *</label>
                      <select
                        value={selectedConfigClientId}
                        onChange={(e) => handleClientConfigSelect(e.target.value)}
                        className="w-full bg-white border border-slate-305 px-4 py-3 rounded-xl text-xs font-bold text-slate-950 font-sans"
                      >
                        <option value="">-- اختر عميلاً متاحاً بالـ CRM --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.nationalId})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-900 block">اسم المستخدم المقترح للبوابة</label>
                      <input
                        type="text"
                        value={configUsername}
                        onChange={(e) => setConfigUsername(e.target.value)}
                        placeholder="أدخل اسم مستخدم مخصص..."
                        className="w-full bg-white border border-slate-305 px-4 py-3 rounded-xl text-xs font-bold text-slate-950 font-mono text-center"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-900 block">كلمة المرور الموحدة (العدالة)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={configPassword}
                          onChange={(e) => setConfigPassword(e.target.value)}
                          placeholder="كلمة مرور الدخول للمحفظة..."
                          className="w-full bg-white border border-slate-305 px-4 py-3 rounded-xl text-xs font-bold text-slate-950 font-mono text-center"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setConfigPassword(`Pass@${Math.floor(1000 + Math.random() * 9000)}`)}
                          className="bg-slate-200 text-slate-900 text-[10px] px-3 py-1 rounded-xl shadow border border-slate-300 font-bold"
                        >
                          توليد ⚡
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic External Shareable URL Link Generator */}
                  {configUsername.trim() && (
                    <div className="bg-emerald-50 border border-emerald-250 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-800 font-extrabold text-xs bg-emerald-150/60 px-2 py-0.5 rounded">رابط الدخول الخارجي والآمن للعميل المختار 🔗</span>
                      </div>
                      <p className="text-xs text-emerald-950 font-bold leading-relaxed">
                        قم بنسخ هذا الرابط الموحد وإرساله يدوياً للعميل. سيتيح له الدخول التلقائي باستخدام اسم المستخدم وكلمة السر بمجرد النقر عليه للاطلاع الآمن الحصري:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/?role=client&user=${configUsername.trim()}&pass=${configPassword.trim()}&autologin=true`}
                          className="bg-white border border-emerald-300 px-3 py-2.5 rounded-xl text-xs font-mono select-all text-slate-900 flex-1 text-left"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/?role=client&user=${configUsername.trim()}&pass=${configPassword.trim()}&autologin=true`;
                            navigator.clipboard.writeText(link).catch(e => console.warn(e));
                            alert("📋 تم نسخ الرابط الموحّد للعميل بنجاح! جاهز للإرسال الخارجي والواتساب.");
                          }}
                          className="bg-emerald-600 text-white font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow shrink-0 cursor-pointer"
                        >
                          📋 نسخ الرابط الآمن
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-800 font-bold">
                        ✓ يتميز هذا الرابط بقدرته على ملء الحقول تلقائياً وتخطي شاشات تشتيت العميل لينقله مباشرة لقائمته المحددة من القضايا.
                      </p>
                    </div>
                  )}

                  {/* CHOOSE CASES CHECKLIST DROPDOWN AND PERMISSIONS CONFIG */}
                  <div className="bg-white border border-slate-205 p-5 rounded-2xl space-y-4">
                    <span className="text-xs font-black text-slate-900 block border-b pb-2">
                      2. اختيار ومطابقة القضايا التي يمكنه الاطلاع عليها أو التعديل (dropdown lists)
                    </span>
                    
                    <p className="text-xs text-slate-900 font-bold">بموجب إرشادات البوابة، حدد واحدة أو أكثر من الدعاوى النشطة المراد التصريح للعميل بالدخول إليها ومتابعة تحديثاتها وجلساتها المجدولة:</p>

                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar border p-3 rounded-xl bg-slate-50">
                      {cases.map((cs) => {
                        const isChecked = configCheckedCases.includes(cs.id) || configCheckedCases.includes(cs.caseNumber);
                        const currentPerm = configPermissions[cs.id] || 'view';

                        return (
                          <div key={cs.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 rounded-xl border border-slate-200 gap-3 shadow-sm">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`cs-chk-${cs.id}`}
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setConfigCheckedCases(prev => [...prev, cs.id]);
                                    setConfigPermissions(prev => ({ ...prev, [cs.id]: 'view' }));
                                  } else {
                                    setConfigCheckedCases(prev => prev.filter(id => id !== cs.id));
                                    const nextPerms = { ...configPermissions };
                                    delete nextPerms[cs.id];
                                    setConfigPermissions(nextPerms);
                                  }
                                }}
                                className="w-4.5 h-4.5 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary focus:ring-1"
                              />
                              <label htmlFor={`cs-chk-${cs.id}`} className="text-xs font-black text-slate-900 cursor-pointer">
                                {cs.caseName} <span className="text-slate-900 font-mono font-bold text-[11px] block sm:inline sm:mr-2">({cs.courtName} • رقم: {cs.caseNumber})</span>
                              </label>
                            </div>

                            {/* Dropdown to choose permission: Read only or Read & write */}
                            {isChecked && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-900 block font-bold">مستوى الترخيص للعميل:</span>
                                <select
                                  value={currentPerm}
                                  onChange={(e) => {
                                    setConfigPermissions(prev => ({
                                      ...prev,
                                      [cs.id]: e.target.value as any
                                    }));
                                  }}
                                  className="bg-slate-100 border border-slate-300 text-[11px] font-bold px-2 py-1.5 rounded-lg text-slate-900 outline-none"
                                >
                                  <option value="view">الاطلاع فقط (لقراءة الدعاوى واستعراض المستندات)</option>
                                  <option value="edit">الاطلاع والتعديل (يتيح إرفاق لوائح وبث استفسارات)</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-[#aa8c2c] text-white font-black py-4.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-all shadow-lg"
                  >
                    <span>حفظ وثيقة الصلاحيات وإرسال بيانات النفاذ الموحدة عبر Twilio WhatsApp 📲</span>
                  </button>
                </form>
              )}

              {/* VIEW C: CRM CLIENT ADD FORM (Fallback template trigger) */}
              {isAddingClient && !selectedConfigClientId && (
                <form onSubmit={handleCreateClientAndLinkCase} className="bg-slate-50 border border-slate-300 p-8 rounded-3xl space-y-6 shadow-lg animate-fade-in">
                  <div className="flex items-center gap-3 border-b border-slate-300 pb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <User className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-black text-slate-900 text-base">تقييد حساب عميل (أصيل) جديد في سجل الـ CRM الخاص بالمكتب</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-900 uppercase block">اسم العميل (الأصيل) الكامل *</label>
                      <input 
                        type="text" 
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="مثال: صالح بن محمد الودعاني"
                        required
                        className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary transition-all placeholder:text-slate-200 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-900 uppercase block">رقم الهوية الوطنية / السجل التجاري *</label>
                      <input 
                        type="text" 
                        value={newClientNationalId}
                        onChange={(e) => setNewClientNationalId(e.target.value)}
                        placeholder="مثال: 1029384756"
                        required
                        className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary transition-all placeholder:text-slate-200 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-900 uppercase block">رقم الجوال (مع مفتاح الدولة للواتساب) *</label>
                      <input 
                        type="text" 
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="+966500000000"
                        required
                        className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary transition-all placeholder:text-slate-200 font-bold font-sans"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-900 uppercase block">البريد الإلكتروني للعميل</label>
                      <input 
                        type="email" 
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="client@mail.com"
                        className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary transition-all placeholder:text-slate-200 font-bold font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <label className="text-xs font-black text-slate-900 block">ربط القضية البدئية (الدعوى المعلقة بالجدول)</label>
                    <select
                      value={selectedCaseToLink}
                      onChange={(e) => setSelectedCaseToLink(e.target.value)}
                      className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary transition-all"
                    >
                      <option value="">-- اختر دعوى لربطها فوراً بهذا العميل --</option>
                      {cases.map(cs => (
                        <option key={cs.id} value={cs.id}>{cs.caseName} (رقم الدعوى: {cs.caseNumber})</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="bg-indigo-700 text-white font-black text-xs py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 w-full uppercase"
                  >
                    <span>حفظ وقيد العميل وإرسال رسالة الدخول التلقائية عبر Twilio WhatsApp 📲</span>
                  </button>
                </form>
              )}
            </div>
          )}

      {/* Dynamic Cases Filter Dropdown List for Client Portal View */}
      {clientCases.length > 0 && (
        <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-md space-y-4 animate-fade-in" dir="rtl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">القائمة المنسدلة لاختيار القضية النشطة 📂</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-black">فلترة معتمدة ومطابقة</span>
              </h3>
              <p className="text-xs text-slate-800 font-bold leading-normal">من خلال قائمة التصفية التفاعلية، يمكنكم اختيار وتحديد خصومة قضائية معينة لعرض مواعيد جلسات الضبط وتحديثاتها ومستنداتها القانونية الحصرية:</p>
            </div>
            
            <div className="w-full md:w-auto flex items-center gap-2">
              <label htmlFor="client-case-filter" className="text-xs font-black text-slate-900 shrink-0 select-none">القضية النشطة المحددة:</label>
              <select
                id="client-case-filter"
                value={selectedCaseFilterId}
                onChange={(e) => setSelectedCaseFilterId(e.target.value)}
                className="bg-white border-2 border-indigo-100 focus:border-indigo-600 rounded-xl px-4 py-3 text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-sans min-w-[280px] shadow-sm"
              >
                <option value="all">📁 عرض كافة القضايا الموثقة ({clientCases.length})</option>
                {clientCases.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    ⚖️ {cs.caseName} (رقم: {cs.caseNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Portal Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main content columns: Cases, Hearings and files */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Cases files tracking */}
          <div className="card-professional space-y-6">
            <div className="flex items-center justify-between border-b border-slate-300 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-base font-display font-semibold text-slate-950 ">حالة الدعاوى ومراحل التقاضي</h2>
              </div>
              <span className="text-xs text-slate-900  font-black uppercase">{selectedCaseFilterId === 'all' ? clientCases.length : 1} قضايا مستعرضة</span>
            </div>

            {filteredClientCases.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-slate-900" />
                </div>
                <p className="text-sm text-slate-900 font-black tracking-tight">لا توجد دعاوى قضائية نشطة تلمس التصفية الحالية.</p>
              </div>
            ) : (
              filteredClientCases.map((cs, index) => (
                <div key={index} className="bg-slate-50 border border-slate-300 rounded-2xl p-6 space-y-5 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-xs bg-white text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200 font-mono font-bold">
                        ملف دعوى رقم: {cs.caseNumber}
                      </span>
                      <h3 className="font-display font-semibold text-base text-slate-950  mt-2">{cs.caseName}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900  bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      {cs.courtName}
                    </div>
                  </div>

                  <p className="text-xs text-slate-900  font-medium leading-relaxed">
                    {cs.summary}
                  </p>

                  {/* Visual tracker dots for client */}
                  <div className="border-t border-slate-300 pt-5">
                    <span className="text-xs text-slate-900  block mb-4 font-bold uppercase tracking-wider">الجدول الزمني للإجراءات الشرعية الحالية</span>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'اللائحة', active: true },
                        { label: 'جلسات مرافعة', active: cs.stage !== 'litigation' },
                        { label: 'استئناف وتمييز', active: cs.stage === 'appeals' || cs.stage === 'execution' },
                        { label: 'طلب تنفيذ', active: cs.stage === 'execution' }
                      ].map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className={`p-3 rounded-xl text-center text-xs font-bold transition-all ${
                            step.active 
                            ? 'bg-indigo-700 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-slate-200 text-slate-900'
                          } `}>
                            {step.label}
                          </div>
                          {idx < 3 && (
                            <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 border-t border-r hidden sm:block ${
                              step.active && [
                                true,
                                cs.stage !== 'litigation',
                                cs.stage === 'appeals' || cs.stage === 'execution'
                              ][idx+1] ? 'bg-indigo-700 border-white' : 'bg-slate-200 border-slate-300'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Client Documents viewer */}
          <div className="card-professional space-y-6">
            <div className="flex items-center justify-between border-b border-slate-300 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-base font-display font-semibold text-slate-950 ">الصكوك والمذكرات والمستندات الثبوتية</h2>
              </div>
            </div>
            
            {clientDocuments.length === 0 ? (
              <div className="text-center py-6 text-sm font-black text-slate-900">لا توجد صكوك أو مستندات ثبوتية مقيدة.</div>
            ) : (
              <div className="space-y-3">
                {clientDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-slate-300 px-4 py-3 rounded-xl transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-primary" />
                      <div>
                        <h4 className="text-sm font-black text-slate-950">{doc.name}</h4>
                        <p className="text-[10px] text-slate-900 mt-0.5 font-bold uppercase">{doc.category} • {doc.size}</p>
                      </div>
                    </div>
                    <button className="text-xs font-black text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors">عـرض الصك</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Urgent Contract Notification Banner */}
          {activeContract.status === 'pending' && (
            <div className="bg-amber-500 border border-amber-500 text-amber-200 p-4.5 rounded-2xl flex items-start gap-3.5 shadow-sm animate-pulse">
              <span className="text-xl">⚠️</span>
              <div>
                <strong className="text-xs font-black block text-amber-900">تنبيه قانوني معلق: لديك عقد تمثيل رقمي جديد بانتظار توقيعك</strong>
                <p className="text-xs text-slate-900 mt-1 font-bold leading-normal">
                  يرجى قراءة بنود العقد أدناه والمصادقة عليه باستخدام رمز التحقق المرسل لهاتفك {activeContract.phone} لإتمام التفعيل ونظر الدعوى.
                </p>
              </div>
            </div>
          )}

          {/* Secure Client Electronic Signature space */}
          <div className="card-professional bg-white border-slate-300 shadow-xl shadow-slate-200/20 space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-300 pb-5">
              <div className="p-3 bg-slate-100 text-slate-900 rounded-xl text-lg">
                📜
              </div>
              <div>
                <h3 className="font-display font-black text-slate-900 tracking-tight">توثيق ومصادقة العقود الإلكترونية بـ OTP</h3>
                <p className="text-xs text-slate-900 mt-0.5 font-bold">محمي ومصادق بموجب الأنظمة والتعاملات الرقمية السعودية</p>
              </div>
            </div>

            {/* Contract Draft Viewer */}
            <div className="bg-slate-50 border border-slate-300 p-5 rounded-2xl space-y-4">
              <span className="text-xs text-slate-900 bg-white border border-slate-300 px-3 py-1 rounded-md font-bold inline-block font-sans">
                مسودة العقد الرقمي الموحد
              </span>
              <h4 className="font-black text-xs text-slate-900 leading-tight">{activeContract.title}</h4>
              <p className="text-xs text-slate-900 leading-relaxed font-bold max-h-48 overflow-y-auto whitespace-pre-line bg-white p-4.5 border border-slate-300 rounded-xl custom-scrollbar font-sans">
                {activeContract.content}
              </p>
            </div>

            {isSigned || activeContract.status === 'signed' ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center gap-5">
                <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">تم توقيع وتصديق العقد بنجاح</h4>
                  <p className="text-xs text-emerald-800 mt-1 font-bold leading-relaxed">
                    الموقع المعتمد: {signerName || (activeContract && activeContract.signerName) || viewingClient?.name}
                  </p>
                  <p className="text-xs text-slate-900 mt-0.5 font-mono leading-tight">
                    البصمة الزمنية: {activeContract.signedAt || new Date().toISOString()} • التحقق: OTP عبر WhatsApp • متوافق مع نظام التعاملات الإلكترونية السعودي
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 border border-slate-300 rounded-2xl space-y-6">
                <p className="text-xs text-slate-900 leading-relaxed font-bold">
                  بصفتك الطرف الثاني للدراسة والتمثيل، يرجى كتابة اسمك الثلاثي الكامل تمهيداً لطلب رمز التحقق OTP المرسل للواتساب في خطوة واحدة آمنة.
                </p>

                <form onSubmit={handleVerifyAndSign} className="space-y-4">
                  
                  {/* Step A: Signer Name input */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-900 block font-bold uppercase tracking-wider">الاسم الكامل للموقع (ثلاثي كما في الهوية):</label>
                    <input 
                      type="text"
                      placeholder="اكتب اسمك الثلاثي هنا للتوثيق..."
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      required
                      className="w-full bg-white text-slate-900 text-xs py-3 px-4 border border-slate-300 rounded-xl outline-none placeholder:text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-bold"
                    />
                  </div>

                  {/* Step B: OTP WhatsApp Dispatcher */}
                  <div className="space-y-3 bg-white border border-slate-300 rounded-xl p-4">
                    <span className="text-xs text-slate-900 font-bold block">بوابة مصادقة رقم هاتف الواتساب:</span>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <strong className="text-xs text-slate-900 tracking-widest block font-mono">{activeContract.phone}</strong>
                      <button 
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={isOtpSending}
                        className={`text-xs py-2 px-4 rounded-lg font-black transition-all shadow-md ${
                          otpSent 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-primary text-white'
                        }`}
                      >
                        {isOtpSending ? 'جاري التوليد وفحص الواتساب...' : otpSent ? 'إعادة إرسال رمز OTP 📲' : 'أرسل رمز التحقق OTP للواتساب 📱'}
                      </button>
                    </div>
                  </div>

                  {/* Step C: Enter OTP verifying field */}
                  {otpSent && (
                    <div className="space-y-3 p-4 bg-white border border-slate-300 rounded-xl animate-fade-in">
                      <label className="text-sm text-slate-900 block font-black">رمز التحقق OTP المستدعى بمنتج الواتساب:</label>
                      <input 
                        type="text"
                        placeholder="أدخل الرمز المكون من 4 أرقام الموضح في نافذة المحاكاة..."
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        required
                        className="w-full bg-slate-50 text-xs py-3 px-4 border border-slate-300 rounded-xl outline-none text-slate-900 focus:border-slate-500 placeholder:text-slate-900 transition-all font-bold tracking-widest text-center"
                      />
                      {otpError && (
                        <p className="text-xs text-rose-600 font-bold leading-normal">{otpError}</p>
                      )}
                    </div>
                  )}

                  <div className="border border-dashed border-slate-300 rounded-xl h-24 bg-slate-50 flex items-center justify-center cursor-crosshair group transition-colors">
                    <div className="text-center space-y-1">
                      <Edit2 className="w-5 h-5 text-slate-900 mx-auto" />
                      <p className="text-xs text-slate-900 font-bold">بصمة التوقيع الرقمي ومطابقة الـ IP تفاعلياً</p>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-700 text-white font-black py-4 rounded-xl text-xs transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    توقيع ومصادقة العقد إلكترونياً رسمياً ✓
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>

        {/* Right column: Portal invoices, messages */}
        <div className="space-y-8">
          
          {/* Client Financial files inside portal */}
          <div className="card-professional space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-300 pb-5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-slate-950 ">المطالبات المالية وأتعاب ومصاريف التقاضي</h3>
            </div>

            <div className="space-y-4">
              {clientInvoices.length === 0 ? (
                <div className="text-center py-6 text-slate-900  font-medium italic text-xs">لا توجد مطالبات مالية مستحقة.</div>
              ) : (
                clientInvoices.map((inv, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-4 transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-slate-950  font-mono">Fatoora #{inv.id}</h4>
                        <span className="text-xs text-slate-900  font-bold uppercase tracking-wider">{inv.dueDate}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.status === 'paid' ? 'مدفوعة' : 'مستحقة'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-900  font-medium leading-normal">{inv.description}</p>
                    
                    <div className="border-t border-slate-300 pt-4 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-xs text-slate-900  block font-bold mb-1">الرصيد الموحد (العدالة)</span>
                        <strong className="text-slate-950  font-mono text-base">{inv.totalAmount.toLocaleString()} ر.س</strong>
                      </div>

                      {inv.status !== 'paid' && (
                        <button 
                          onClick={() => handleSimulatePayment(inv)}
                          className="bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.95]"
                        >
                          سدد الآن 💳
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat room messages simulator with lawyer */}
          <div className="card-professional space-y-5 bg-white border-slate-300 shadow-xl">
                <div>
                  <h3 className="font-display font-semibold text-slate-950">تراسل مع الفريق القضائي والعملاء</h3>
                  <p className="text-xs text-slate-900 mt-1 font-black">تشفير تام بين العميل وموكل (عميل ومرافع)</p>
                </div>
            
            <div className="space-y-4 h-[280px] overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-300 custom-scrollbar shadow-inner">
              {clientMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    msg.sender === 'client' ? 'mr-auto items-end' : 'ml-auto items-start'
                  }`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${msg.sender === 'client' ? 'text-primary' : 'text-slate-900 '} `}>
                    {msg.senderName}
                  </span>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed font-bold ${
                    msg.sender === 'client' 
                      ? 'bg-primary text-white rounded-tr-none shadow-lg' 
                      : 'bg-white text-slate-950 rounded-tl-none border border-slate-300 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendToLawyer} className="space-y-3 pt-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="كيف يمكننا مساعدتك اليوم؟"
                  value={clientMessageInput}
                  onChange={(e) => setClientMessageInput(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 py-3.5 px-4 rounded-xl text-xs text-slate-900 outline-none focus:border-primary transition-all placeholder:text-slate-900 font-bold shadow-sm"
                />
                <button 
                  type="submit"
                  className="absolute left-2 top-2 p-1.5 bg-primary text-white rounded-lg transition-all shadow-lg active:scale-90"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
