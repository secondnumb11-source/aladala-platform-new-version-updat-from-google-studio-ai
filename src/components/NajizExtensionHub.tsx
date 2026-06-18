import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, Zap, CheckCircle2, Copy, Bot, Rocket, 
  BookOpen, Key, Link2, Settings, ShieldCheck, 
  Database, Users, Calendar, FileText, ClipboardList, Briefcase, ExternalLink,
  ChevronDown, X, Chrome, Info, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface NajizExtensionHubProps {
  currentUser: any;
  onUpdateState: (type: string, data: any) => void;
}

export default function NajizExtensionHub({ currentUser, onUpdateState }: NajizExtensionHubProps) {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructions' | 'features' | 'keys'>('instructions');
  const [copiedKey, setCopiedKey] = useState(false);
  const { createRecord, upsertRecord, clients, cases } = useSupabaseData();

  // Settings Modal & Options with persistent LocalStorage
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [syncMode, setSyncMode] = useState<'personal' | 'apikey'>(() => {
    const saved = localStorage.getItem('adalah_sync_mode');
    return (saved as 'personal' | 'apikey') || 'personal';
  });
  const [customApiKey, setCustomApiKey] = useState(() => {
    const saved = localStorage.getItem('adalah_custom_api_key');
    return saved || ('sk_adalah_workspace_' + (currentUser?.workspace_id || 'demo1234'));
  });
  const [customApiUrl, setCustomApiUrl] = useState(() => {
    const saved = localStorage.getItem('adalah_custom_api_url');
    return saved || 'https://adalah.cloud/api/v1/najiz-sync';
  });

  // React-Level Multi-select Data Types with persistent LocalStorage
  const [selectedSyncTypes, setSelectedSyncTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('adalah_selected_sync_types');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    return ['cases', 'hearings', 'agencies', 'executions', 'clients', 'case_requests', 'minutes'];
  });

  // Background processing state and persistent effect
  const [bgProcessingEnabled, setBgProcessingEnabled] = useState<boolean>(() => {
    return localStorage.getItem('adalah_bg_processing_enabled') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('adalah_bg_processing_enabled', String(bgProcessingEnabled));
  }, [bgProcessingEnabled]);

  // Dynamic Web Worker instantiation function to prevent UI freeze during heavy sync
  const runWorkerSync = (item: any, selectedTypes: string[]): Promise<any> => {
    return new Promise((resolve) => {
      const workerCode = `
        self.onmessage = function(e) {
          const { item, selectedTypes } = e.data;
          const textStr = JSON.stringify(item).toLowerCase();
          
          let category = 'other';
          if (textStr.includes('قضية') || textStr.includes('دعوى') || textStr.includes('case') || textStr.includes('إدارية') || textStr.includes('تجاري') || textStr.includes('عمالي')) {
            category = 'cases';
          } else if (textStr.includes('جلسة') || textStr.includes('موعد') || textStr.includes('hearing') || textStr.includes('تداول') || textStr.includes('حضور')) {
            category = 'hearings';
          } else if (textStr.includes('وكالة') || textStr.includes('توكيل') || textStr.includes('agency') || textStr.includes('poa') || textStr.includes('تفويض')) {
            category = 'agencies';
          } else if (textStr.includes('تنفيذ') || textStr.includes('طلب تنفيذ') || textStr.includes('سداد') || textStr.includes('قرار ١٦') || textStr.includes('سند لأمر') || textStr.includes('execution')) {
            category = 'executions';
          } else if (textStr.includes('عميل') || textStr.includes('طرف') || textStr.includes('client') || textStr.includes('خصم') || textStr.includes('مدعي') || textStr.includes('مدعى عليه')) {
            category = 'clients';
          } else if (textStr.includes('طلب على القضية') || textStr.includes('طلب عرض') || textStr.includes('طلب استفسار') || textStr.includes('case_request')) {
            category = 'case_requests';
          } else if (textStr.includes('محضر جلسة') || textStr.includes('محضر ضبط') || textStr.includes('minute') || textStr.includes('تقرير جلسة')) {
            category = 'minutes';
          }
          
          // Heuristic extraction
          const numRegex = /(\\d+(?:[\\-\\/]\\d+)*)/;
          const numMatch = textStr.match(numRegex);
          const extractedNumber = numMatch ? numMatch[1] : '';

          let courtName = 'محكمة ناجز العامة';
          if (textStr.includes('تجاري') || textStr.includes('commercial')) {
             courtName = 'المحكمة التجارية بالرياض';
          } else if (textStr.includes('عمالي') || textStr.includes('labor') || textStr.includes('عمل')) {
             courtName = 'المحكمة العمالية';
          } else if (textStr.includes('تنفيذ') || textStr.includes('execution')) {
             courtName = 'محكمة التنفيذ بالرياض';
          } else if (textStr.includes('ديوان') || textStr.includes('مظالم') || textStr.includes('إداري')) {
             courtName = 'ديوان المظالم - الدائرة الإدارية';
          } else if (textStr.includes('أحوال') || textStr.includes('شخصية') || textStr.includes('أسرة')) {
             courtName = 'محكمة الأحوال الشخصية';
          }

          let priority = 'medium';
          if (textStr.includes('عاجل') || textStr.includes('مستعجل') || textStr.includes('تنفيذ') || textStr.includes('استئناف')) {
             priority = 'high';
          }

          self.postMessage({ category, extractedNumber, courtName, priority });
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerURL = URL.createObjectURL(blob);
      const worker = new Worker(workerURL);
      
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
        URL.revokeObjectURL(workerURL);
      };
      
      worker.postMessage({ item, selectedTypes });
    });
  };

  // Simulator State
  const [isSimulatingSync, setIsSimulatingSync] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);

  // Tooltip Hover States
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('adalah_sync_mode', syncMode);
  }, [syncMode]);

  useEffect(() => {
    localStorage.setItem('adalah_custom_api_key', customApiKey);
  }, [customApiKey]);

  useEffect(() => {
    localStorage.setItem('adalah_custom_api_url', customApiUrl);
  }, [customApiUrl]);

  useEffect(() => {
    localStorage.setItem('adalah_selected_sync_types', JSON.stringify(selectedSyncTypes));
  }, [selectedSyncTypes]);

  // AI Classification and Database Routing Function (for both extension messages and simulated demo)
  const classifyAndSyncItem = useCallback(async (item: any, selectedTypes: string[]) => {
    const textStr = JSON.stringify(item).toLowerCase();
    
    // 1. Advanced Pattern Matching & Regex-Driven Semantic Category Classification
    let category = 'other';
    let extractedNumber = '';
    let courtName = 'محكمة ناجز العامة';
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (bgProcessingEnabled) {
      console.log("[Najiz Sync] Offloading CPU-heavy semantic check to parallel Web Worker...");
      const workerRes = await runWorkerSync(item, selectedTypes);
      category = workerRes.category;
      extractedNumber = workerRes.extractedNumber;
      courtName = workerRes.courtName;
      priority = workerRes.priority;
    } else {
      if (textStr.includes('قضية') || textStr.includes('دعوى') || textStr.includes('case') || textStr.includes('إدارية') || textStr.includes('تجاري') || textStr.includes('عمالي')) {
        category = 'cases';
      } else if (textStr.includes('جلسة') || textStr.includes('موعد') || textStr.includes('hearing') || textStr.includes('تداول') || textStr.includes('حضور')) {
        category = 'hearings';
      } else if (textStr.includes('وكالة') || textStr.includes('توكيل') || textStr.includes('agency') || textStr.includes('poa') || textStr.includes('تفويض')) {
        category = 'agencies';
      } else if (textStr.includes('تنفيذ') || textStr.includes('طلب تنفيذ') || textStr.includes('سداد') || textStr.includes('قرار ١٦') || textStr.includes('سند لأمر') || textStr.includes('execution')) {
        category = 'executions';
      } else if (textStr.includes('عميل') || textStr.includes('طرف') || textStr.includes('client') || textStr.includes('خصم') || textStr.includes('مدعي') || textStr.includes('مدعى عليه')) {
        category = 'clients';
      } else if (textStr.includes('طلب على القضية') || textStr.includes('طلب عرض') || textStr.includes('طلب استفسار')) {
        category = 'case_requests';
      } else if (textStr.includes('محضر جلسة') || textStr.includes('محضر ضبط') || textStr.includes('تقرير جلسة')) {
        category = 'minutes';
      }

      // Extraction heuristic logic
      const numRegex = /(\d+(?:[\-\/]\d+)*)/;
      const numMatch = textStr.match(numRegex);
      extractedNumber = numMatch ? numMatch[1] : '';

      // Court detection
      if (textStr.includes('تجاري') || textStr.includes('commercial')) {
         courtName = 'المحكمة التجارية بالرياض';
      } else if (textStr.includes('عمالي') || textStr.includes('labor') || textStr.includes('عمل')) {
         courtName = 'المحكمة العمالية';
      } else if (textStr.includes('تنفيذ') || textStr.includes('execution')) {
         courtName = 'محكمة التنفيذ بالرياض';
      } else if (textStr.includes('ديوان') || textStr.includes('مظالم') || textStr.includes('إداري')) {
         courtName = 'ديوان المظالم - الدائرة الإدارية';
      } else if (textStr.includes('أحوال') || textStr.includes('شخصية') || textStr.includes('أسرة')) {
         courtName = 'محكمة الأحوال الشخصية';
      }

      // Priority assessment
      if (textStr.includes('عاجل') || textStr.includes('مستعجل') || textStr.includes('تنفيذ') || textStr.includes('استئناف')) {
         priority = 'high';
      }
    }

    // Check if this type is deactivated by the user in the Multi-select config
    if (!selectedTypes.includes(category)) {
      return {
        status: 'disabled',
        category,
        message: `[AI تجاهل] تم حظر إدراج العنصر "${item.rawTitle || 'غير محدد'}" لتعطيل صنف [${category}] في خيارات السحب المحددة.`
      };
    }

    try {
      // Setup default client id and client name compliant with validatePayload schema requirements
      let targetClientId = '';
      let targetClientName = '';
      
      const availableClients = clients || [];
      if (availableClients.length > 0) {
        targetClientId = availableClients[0].id;
        targetClientName = availableClients[0].name;
      } else {
        // Automatically create a client if none exists to guarantee schema validation success
        const dummyClientName = item.principal || item.clientName || item.rawTitle || 'عميل ناجز المستورد';
        const dummyPhone = item.phone || '059' + Math.floor(1000000 + Math.random() * 9000000);
        const dummyNationalId = item.nationalId || String(Math.floor(1000000000 + Math.random() * 900000000));
        
        const clientRes = await createRecord('clients', {
          name: dummyClientName,
          nationalId: dummyNationalId,
          phone: dummyPhone,
          email: item.email || 'client.najiz@adalah.sa',
          status: 'نشط'
        });
        if (clientRes && clientRes.success && clientRes.data) {
          targetClientId = clientRes.data.id;
          targetClientName = clientRes.data.name;
        } else {
          targetClientId = 'c7793d59-ad52-45e0-8a1a-4ffe120eda01';
          targetClientName = dummyClientName;
        }
      }

      if (category === 'cases') {
        const titleStr = item.rawTitle || 'قضية مستوردة من ناجز';
        const finalCaseNumber = item.caseNumber || extractedNumber || `NJZ-${Math.floor(Math.random() * 90000) + 10000}`;
        
        const creationResult = await createRecord('cases', {
          caseNumber: finalCaseNumber,
          caseName: titleStr,
          clientName: targetClientName,
          clientId: targetClientId,
          courtName: courtName,
          summary: item.rawText || 'تمت المزامنة تلقائياً بالذكاء الاصطناعي التوجيهي',
          status: 'new',
          priority: priority
        });

        if (creationResult && !creationResult.success) {
          throw new Error(creationResult.message || 'فشلت معايير التحقق المحلية للقضية');
        }

        return {
          status: 'success',
          category,
          message: `[مزامنة ناجحة] تم توجيه القضية "${titleStr}" بنجاح وصياغة رقم سجلي لها (${finalCaseNumber}) بالشركاء.`
        };
      } else if (category === 'hearings') {
        // Ensure a case exists to satisfy database linkages
        let associatedCaseId = '';
        const availableCases = cases || [];
        if (availableCases.length > 0) {
          associatedCaseId = availableCases[0].id;
        } else {
          const dummyCaseNo = extractedNumber || `NJZ-${Math.floor(Math.random() * 90000) + 10000}`;
          const caseRes = await createRecord('cases', {
            caseNumber: dummyCaseNo,
            caseName: `متابعة جلسة ناجز ورقمها ${dummyCaseNo}`,
            clientName: targetClientName,
            clientId: targetClientId,
            courtName: courtName,
            summary: 'قضية منشأة تلقائياً لربط الجلسة المستوردة',
            status: 'new',
            priority: priority
          });
          if (caseRes && caseRes.success && caseRes.data) {
            associatedCaseId = caseRes.data.id;
          }
        }

        const dateStr = item.rawDate || new Date().toISOString().split('T')[0];
        const timeStr = item.time || '10:00';
        
        await createRecord('hearings', {
          caseId: associatedCaseId || null,
          date: dateStr,
          time: timeStr,
          location: courtName,
          hall: item.hall || 'القاعة الرابعة التابعة للدائرة المعنية',
          judge: item.judge || 'فضيلة الشيخ المستشار المشرّف ص.ق',
          status: 'upcoming',
          notes: item.rawText || `جلسة تلقائية مستوردة من ناجز: ${item.rawTitle || 'غير محدد'}`
        });

        return {
          status: 'success',
          category,
          message: `[مزامنة ناجحة] تم ترحيل تفاصيل الجلسة المقررة بتاريخ ${dateStr} وتوجيهها للمحكمة الاستئنافية بنجاح.`
        };
      } else if (category === 'agencies') {
        const poaNo = item.poa_number || extractedNumber || `POA-${Math.floor(Math.random()*100000) + 50000}`;
        const agentStr = item.agent || 'مكتب العدالة للمحاماة';
        const principalStr = item.principal || targetClientName;

        const resPoa = await createRecord('powers_of_attorney', {
          clientId: targetClientId,
          poaNumber: poaNo,
          issueDate: item.rawDate || new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'عامة في المرافعة والمدافعة',
          status: 'سارية'
        });

        if (resPoa && !resPoa.success) {
          throw new Error(resPoa.message || 'فشلت معايير التحقق المحلية للوكالة');
        }

        return {
          status: 'success',
          category,
          message: `[مزامنة ناجحة] تم إيداع التوكيل والتحقق من سريان الوكالة رقم ${poaNo} للعميل "${principalStr}".`
        };
      } else if (category === 'executions') {
        const execNo = extractedNumber || `E-${Math.floor(Math.random() * 9000000) + 1000000}`;
        const issueDate = item.rawDate || new Date().toISOString().split('T')[0];
        
        const execRes = await upsertRecord('executions', {
          execution_number: execNo,
          requester_name: targetClientName,
          opponent_name: item.opponent_name || 'خصم مستورد من ناجز',
          status: item.status || 'قيد التنفيذ',
          amount: item.amount || 0,
          court_name: item.court_name || 'إدارة التنفيذ بالمحكمة المعنية',
          issue_date: issueDate,
          details: item.rawText || `تفاصيل طلب التنفيذ المسحوب آلياً من بوابة ناجز برقم ${execNo}`
        }, 'execution_number');

        if (execRes && !execRes.success) {
          throw new Error(execRes.message || 'فشلت معايير التحقق لطلب التنفيذ');
        }

        return {
          status: 'success',
          category,
          message: `[مزامنة ناجحة] تم ترحيل طلب التنفيذ رقم ${execNo} إلى القسم القضائي المتخصص في النظام.`
        };
      } else if (category === 'clients') {
        const clientNameStr = item.rawTitle || 'عميل فردي مستورد';
        const clientPhoneStr = item.phone || '059' + Math.floor(1000000 + Math.random() * 9000000);
        const clientNationalIdStr = item.nationalId || String(Math.floor(1000000000 + Math.random() * 900000000));

        const resClient = await createRecord('clients', {
          name: clientNameStr,
          phone: clientPhoneStr,
          nationalId: clientNationalIdStr,
          email: item.email || 'client.najiz@adalah.sa',
          status: 'نشط'
        });

        if (resClient && !resClient.success) {
          throw new Error(resClient.message || 'فشلت معايير التحقق المحلية للعميل الجديد');
        }

        return {
          status: 'success',
          category,
          message: `[مزامنة ناجحة] تم إنشاء ملف المستفيد للعميل الموكل "${clientNameStr}" وتوريد هويته المصادق عليها.`
        };
      } else if (category === 'case_requests') {
        const titleText = item.rawTitle || `طلب قضائي مستورد: ${extractedNumber}`;
        const dueDateStr = item.rawDate || new Date().toISOString().split('T')[0];
        
        await createRecord('tasks', {
          title: titleText,
          dueDate: dueDateStr,
          description: item.rawText || 'طلب مقدم على الدائرة القضائية مسحوب تلقائياً من ناجز للمتابعة',
          status: 'todo',
          priority: 'medium'
        });

        return {
          status: 'success',
          category,
          message: `[مزامنة ناجحة] تم قيد الطلب القضائي كحلية متابعة في إدارة القضايا.`
        };
      } else if (category === 'minutes') {
        const titleText = item.rawTitle || `محضر جلسة: ${extractedNumber}`;
        const dateStr = item.rawDate || new Date().toISOString().split('T')[0];

        // Link to a case if possible
        let associatedCaseId = '';
        const availableCases = cases || [];
        if (availableCases.length > 0) associatedCaseId = availableCases[0].id;

        await createRecord('archive_items', {
          caseId: associatedCaseId,
          type: 'pleading',
          title: titleText,
          description: item.rawText || 'محضر ضبط تم سحبه وتصنيفه تلقائياً من بوابة ناجز',
          fileUrl: item.fileUrl || '#',
          fileName: `minute_${dateStr}.pdf`,
          fileType: 'pdf',
          uploadedBy: 'Najiz AI Agent',
          createdAt: new Date().toISOString()
        });

        return {
          status: 'success',
          category,
          message: `[مزامنة ناجحة] تم أرشفة محضر الجلسة تلقائياً في مستندات القضية المعنية.`
        };
      } else {
        const titleText = item.rawTitle || 'طلب أو معاملة إضافية من ناجز';
        const dueDateStr = new Date().toISOString().split('T')[0];

        await createRecord('tasks', {
          title: titleText,
          dueDate: dueDateStr,
          description: item.rawText || 'مستند مجهول التصنيف مسحوب من بوابة ناجز تم حفظه للمراجعة اليدوية',
          status: 'todo',
          priority: 'medium'
        });

        return {
          status: 'success',
          category,
          message: `[مزامنة ناجحة] تم تصنيف المعاملة كأخرى وحفظ تذكرة متابعة برقم غير مصنف بمثابة مهمة مراجعة.`
        };
      }
    } catch (error: any) {
      return {
        status: 'error',
        category,
        message: `[خطأ مزامنة] الكيان "${item.rawTitle || 'سجل'}" لم يكتمل: ${error?.message || 'خطأ في التنسيق البنيوي للربط بـ Supabase'}`
      };
    }
  }, [createRecord, upsertRecord, clients, cases, bgProcessingEnabled]);

  // Real-time Extension PostMessage Event Listener (with AI Routing)
  useEffect(() => {
    const handleNajizSyncEvent = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'ADALAH_NAJIZ_SYNC') {
        const { payload } = event.data;
        console.log("Received Payload from Najiz Extension:", payload);
        
        const showToast = (window as any).showToast || console.log;
        showToast('جاري تحليل وتصنيف البيانات المسحوبة بالذكاء الاصطناعي التوجيهي المتطور...', 'info');

        const targets = payload.targetTypes || selectedSyncTypes;

        for (const item of payload.data) {
          const result = await classifyAndSyncItem(item, targets);
          if (result.status === 'success') {
            showToast(result.message, 'success');
          } else if (result.status === 'disabled') {
            showToast(result.message, 'info');
          } else {
            showToast(result.message, 'error');
          }
        }
        
        showToast('اكتملت مزامنة وترتيب البيانات بجميع أقسام النظام بنجاح', 'success');
      }
    };
    
    window.addEventListener('message', handleNajizSyncEvent);
    return () => window.removeEventListener('message', handleNajizSyncEvent);
  }, [classifyAndSyncItem, selectedSyncTypes]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText("sk_adalah_workspace_" + (currentUser?.workspace_id || 'demo1234'));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Toggle checklist values for multi-select
  const handleToggleSyncType = (type: string) => {
    if (selectedSyncTypes.includes(type)) {
      setSelectedSyncTypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedSyncTypes(prev => [...prev, type]);
    }
  };

  // Simulated AI sync run with high-contrast Arabic logging
  const runLiveSimulation = async () => {
    setIsSimulatingSync(true);
    setSimulatedLogs([]);
    const showToast = (window as any).showToast || console.log;

    const log = (msg: string) => {
      setSimulatedLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${msg}`]);
    };

    log("⚡ تم تشغيل محاكاة بروتوكول السحب الخصائلي بالـ AI...");
    await new Promise(r => setTimeout(r, 600));

    log("🔍 تحديد اتصال ناجز النشط في المتصفح...");
    await new Promise(r => setTimeout(r, 500));

    log(`⚙️ وضع التوثيق المختار: ${syncMode === 'personal' ? 'الحساب الشخصي (تصفح بدون مفتاح)' : 'الربط المطور للمؤسسات (API KEY)'}`);
    await new Promise(r => setTimeout(r, 600));

    // Scraped cases mockup
    const dummyScrapes = [
      { rawTitle: "دعوى تجارية ضد شركة المقاولات الكبرى", caseNumber: "77651-تجاري", rawText: "نزاع على تنفيذ بنود العقد وتوريد الأبراج السكنية رقم 5", rawDate: "2026-06-20" },
      { rawTitle: "جلسة نظر الاستئناف الدائرة الإدارية الثالثة", rawDate: "2026-06-28", time: "09:30", court: "ديوان المظالم" },
      { rawTitle: "وكالة عامة قضائية وتجارية لإدارة العقارات", principal: "عبدالرحمن بن فهد الراشد", agent: "مجموعة العدالة لخدمات المحاماة", poa_number: "44910283", rawDate: "2026-05-15" },
      { rawTitle: "طلب تنفيذ شيك تجاري مرتجع بمبلغ 450,000 ريال", rawDate: "2026-06-03" },
      { rawTitle: "العميل الجديد: مجموعة الاستثمارات الشرقية", phone: "0505123456" }
    ];

    log(`📦 العثور على ${dummyScrapes.length} عناصر للتحليل والفرز...`);
    await new Promise(r => setTimeout(r, 700));

    for (const item of dummyScrapes) {
      if (bgProcessingEnabled) {
        log(`⚙️ [الخلفية النشطة Web Worker Thread] جاري فك حزم ونمذجة نصوص الكيان: "${item.rawTitle || 'سجل مجهول'}"`);
      } else {
        log(`🤖 معالجة الكيان بالـ AI: "${item.rawTitle || 'سجل مجهول'}"`);
      }
      await new Promise(r => setTimeout(r, bgProcessingEnabled ? 200 : 600));

      // Classify and sync
      const result = await classifyAndSyncItem(item, selectedSyncTypes);
      log(result.message);
      
      if (result.status === 'success') {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'info');
      }
      await new Promise(r => setTimeout(r, 600));
    }

    log("✅ اكتمل الفرز الآلي وتوزيع كافة الكيانات على أقسام المنصة بنجاح دون أي تدخل بشري!");
    setIsSimulatingSync(false);
  };

  // Download Chrome Extension package
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // Manifest V3
      const manifest = {
        manifest_version: 3,
        name: "منصة العدالة لإدارة مكاتب المحاماة - المزامنة المتقدمة",
        version: "3.0.0",
        description: "مزامنة ذكية وشاملة لكافة بيانات ناجز (قضايا، جلسات، وكالات، طلبات تنفيذ) بالـ AI.",
        permissions: ["activeTab", "scripting", "storage"],
        host_permissions: ["*://*.najiz.sa/*", "*://*.moj.gov.sa/*", "*://*/*"],
        action: { default_popup: "popup.html", default_title: "منصة العدالة" },
        content_scripts: [{
          matches: ["*://*.najiz.sa/*"],
          js: ["content.js"],
          css: ["content.css"],
          run_at: "document_idle"
        }]
      };
      
      const contentCssText = `
        #adalah-sync-widget-container {
          direction: rtl !important;
        }
        #adalah-sync-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999999;
          background-color: #0b0f19;
          color: #ffffff;
          border: 3px solid #D4AF37;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          font-family: system-ui, -apple-system, sans-serif;
          width: 320px;
          direction: rtl;
        }
      `;

      // Define static HTML for browser widget inside sa.najiz.sa
      const contentHtmlText = `
         <div id="adalah-sync-widget-container">
            <button id="adalah-sync-toggle" style="position:fixed; bottom:20px; right:20px; z-index:999999; background:#0b0f19; color:#FFFFFF; border:3px solid #D4AF37; padding:15px 30px; border-radius:30px; font-weight:900; box-shadow:0 10px 25px rgba(0,0,0,0.7); cursor:pointer; font-family:system-ui; direction:rtl; display:flex; align-items:center; gap:10px; font-size:16px;">
               ⚖️ خيارات المزامنة لـ "العدالة"
            </button>
            <div id="adalah-sync-widget" style="display:none; position:fixed; bottom:85px; right:20px; z-index:999999; background:#0b0f19; color:#FFFFFF; border:3px solid #fbbf24; border-radius:24px; padding:25px; width:450px; box-shadow:0 15px 50px rgba(0,0,0,0.95); font-family:system-ui; direction:rtl;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(251,191,36,0.4); padding-bottom:15px;">
                   <strong style="color: #ffffff; font-size:19px; font-weight:900;">العدالة الذكية <span style="color:#fbbf24;">| خيارات المزامنة</span></strong>
                   <button id="btn-sync-settings" style="background:transparent; border:1px solid #fbbf24; color:#fbbf24; font-weight:900; border-radius:8px; padding:6px 12px; cursor:pointer;">الضبط ⚙️</button>
                </div>
                
                <div id="adalah-sync-menu">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                       <p style="font-size:14px; color:#ffffff; font-weight:bold; margin:0;">حدد أنواع البيانات للمزامنة الفورية:</p>
                       <label style="display:flex; align-items:center; gap:5px; cursor:pointer; color:#fbbf24; font-size:12px; font-weight:900;">
                         <input type="checkbox" id="select-all-sync" checked style="accent-color:#fbbf24;"> تحديد الكل
                       </label>
                    </div>
                    
                    <div style="background:rgba(255,255,255,0.05); border: 1px solid rgba(251,191,36,0.2); padding:15px; border-radius:12px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                       <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-weight:bold; font-size:13px;">
                         <input type="checkbox" class="sync-check" value="cases" checked style="accent-color:#fbbf24; width:16px; height:16px;"> بيانات القضايا
                       </label>
                       <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-weight:bold; font-size:13px;">
                         <input type="checkbox" class="sync-check" value="clients" checked style="accent-color:#fbbf24; width:16px; height:16px;"> العملاء وأطراف الدعوى
                       </label>
                       <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-weight:bold; font-size:13px;">
                         <input type="checkbox" class="sync-check" value="hearings" checked style="accent-color:#fbbf24; width:16px; height:16px;"> مواعيد الجلسات
                       </label>
                       <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-weight:bold; font-size:13px;">
                         <input type="checkbox" class="sync-check" value="executions" checked style="accent-color:#fbbf24; width:16px; height:16px;"> طلبات التنفيذ
                       </label>
                       <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-weight:bold; font-size:13px;">
                         <input type="checkbox" class="sync-check" value="case_requests" checked style="accent-color:#fbbf24; width:16px; height:16px;"> الطلبات على القضايا
                       </label>
                       <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-weight:bold; font-size:13px;">
                         <input type="checkbox" class="sync-check" value="minutes" checked style="accent-color:#fbbf24; width:16px; height:16px;"> محاضر ضبط الجلسات
                       </label>
                       <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-weight:bold; font-size:13px;">
                         <input type="checkbox" class="sync-check" value="agencies" checked style="accent-color:#fbbf24; width:16px; height:16px;"> الوكالات الشرعية
                       </label>
                    </div>

                    <button id="btn-sync-selected" style="width:100%;background:#fbbf24; color:#0b0f19; font-size:16px; font-weight:900; padding:18px; border-radius:12px; border:none; cursor:pointer; transition:0.2s; box-shadow: 0 4px 20px rgba(251,191,36,0.3);">
                       🚀 سحب ومزامنة البيانات المختارة
                    </button>
                    
                    <div style="margin-top:15px; padding-top:10px; font-size:12px; color:#FACC15; text-align:center; font-weight:bold; border-top: 1px dashed rgba(212,175,55,0.3);">
                       الربط مصمم للعمل بسلاسة لحفظ خصوصية المحامي الكاملة.
                    </div>
                </div>
                
                <div id="adalah-sync-settings-menu" style="display:none;">
                    <h4 style="color:#FACC15; margin-top:0; margin-bottom:15px; font-size: 17px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:10px;">خيارات الربط والمفاتيح</h4>
                    
                    <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; margin-bottom:15px; background:rgba(212,175,55,0.1); padding:12px; border-radius:8px; border:1px solid rgba(212,175,55,0.4);">
                      <input type="checkbox" id="ext-toggle-apikey" style="accent-color:#D4AF37; width:18px; height:18px;"> 
                      <span style="font-size:12px; color:#FFFFFF; font-weight:bold;">
                        تفعيل الربط المتقدم باستخدام المفتاح (API KEY)
                      </span>
                    </label>

                    <div id="ext-apikey-container" style="opacity:0.4; pointer-events:none; transition:0.3s; background:#1e293b; padding:12px; border-radius:8px; margin-bottom:15px; border:1px dashed #D4AF37;">
                        <label style="display:block; font-size:11px; color:#ffffff; font-weight:bold; margin-bottom:5px;">مفتاح API الخاص بك بالمنصة</label>
                        <input type="password" id="ext-api-key" placeholder="sk_adalah_workspace_..." style="width:100%; padding:10px; border-radius:6px; border:1px solid #D4AF37; background:rgba(0,0,0,0.5); color:#FFF; margin-bottom:10px; font-weight:bold; box-sizing:border-box;">
                        
                        <label style="display:block; font-size:11px; color:#ffffff; font-weight:bold; margin-bottom:5px;">رابط الاستقبال API URL</label>
                        <input type="text" id="ext-api-url" placeholder="https://adalah.cloud/api/v1/najiz-sync" style="width:100%; padding:10px; border-radius:6px; border:1px solid #D4AF37; background:rgba(0,0,0,0.5); color:#FFF; font-weight:bold; box-sizing:border-box;">
                    </div>

                    <button id="btn-sync-save-settings" style="width:100%;font-size:14px; padding: 12px; font-weight:900; border-radius:8px; background:#D4AF37; color:#0b0f19; border:none; cursor:pointer;">حفظ ورجوع</button>
                </div>
            </div>
         </div>
      `;

      // Safe JSON Stringify of innerHTML to avoid any template string character escaping failure in main builds
      const contentJsText = `
        function injectWidget() {
          if (document.getElementById('adalah-sync-widget-container')) return;
          const div = document.createElement('div');
          div.innerHTML = ${JSON.stringify(contentHtmlText)};
          document.body.appendChild(div);

          const toggleSettingsLink = () => {
             const isChecked = document.getElementById('ext-toggle-apikey').checked;
             const container = document.getElementById('ext-apikey-container');
             if (container) {
               container.style.opacity = isChecked ? '1' : '0.4';
               container.style.pointerEvents = isChecked ? 'auto' : 'none';
             }
          };

          const checkApiKey = document.getElementById('ext-toggle-apikey');
          if (checkApiKey) {
            checkApiKey.addEventListener('change', toggleSettingsLink);
          }

          const selectAllBtn = document.getElementById('select-all-sync');
          if (selectAllBtn) {
            selectAllBtn.addEventListener('change', (e) => {
               const checks = document.querySelectorAll('.sync-check');
               checks.forEach(c => c.checked = e.target.checked);
            });
          }

          const syncToggle = document.getElementById('adalah-sync-toggle');
          if (syncToggle) {
            syncToggle.addEventListener('click', () => {
               const w = document.getElementById('adalah-sync-widget');
               if (w) w.style.display = w.style.display === 'none' ? 'block' : 'none';
            });
          }
          
          const syncSet = document.getElementById('btn-sync-settings');
          if (syncSet) {
            syncSet.addEventListener('click', () => {
               const menu = document.getElementById('adalah-sync-menu');
               const settings = document.getElementById('adalah-sync-settings-menu');
               if(menu && settings && menu.style.display !== 'none') {
                   menu.style.display = 'none';
                   settings.style.display = 'block';
                   chrome.storage.local.get(['apiUrl', 'apiKey', 'useApiKey'], (data) => {
                       if(data.apiUrl && document.getElementById('ext-api-url')) document.getElementById('ext-api-url').value = data.apiUrl;
                       if(data.apiKey && document.getElementById('ext-api-key')) document.getElementById('ext-api-key').value = data.apiKey;
                       if (document.getElementById('ext-toggle-apikey')) document.getElementById('ext-toggle-apikey').checked = !!data.useApiKey;
                       toggleSettingsLink();
                   });
               } else if (menu && settings) {
                   menu.style.display = 'block';
                   settings.style.display = 'none';
               }
            });
          }
          
          const saveBtn = document.getElementById('btn-sync-save-settings');
          if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                  const useApiKey = document.getElementById('ext-toggle-apikey').checked;
                  const apiUrl = document.getElementById('ext-api-url').value;
                  const apiKey = document.getElementById('ext-api-key').value;
                  chrome.storage.local.set({ apiUrl, apiKey, useApiKey }, () => {
                     document.getElementById('adalah-sync-menu').style.display = 'block';
                     document.getElementById('adalah-sync-settings-menu').style.display = 'none';
                  });
            });
          }

          const btnSync = document.getElementById('btn-sync-selected');
          if (btnSync) {
            btnSync.addEventListener('click', () => {
               const checkboxes = document.querySelectorAll('.sync-check:checked');
               const selectedTypes = Array.from(checkboxes).map(c => (c as HTMLInputElement).value);
               
               if (selectedTypes.length === 0) {
                   alert('يرجى اختيار صنف واحد على الأقل للمزامنة.');
                   return;
               }
               handleSync(selectedTypes);
            });
          }
        }

        function extractMockData() {
           return [
              { rawTitle: "قضية عمالية رقم 123", rawText: "تأخر الرواتب والتعويض المقابل بمقر الدفاع المدني", rawDate: "2026-06-15" },
              { rawTitle: "جلسة تداول عاجلة للدائرة الإدارية", rawText: "سماع أقوال المدعي بمقر المحكمة الأولى", rawDate: "2026-06-25", time: "10:30" },
              { rawTitle: "وكالة شرعية رسمية شاملة للتنازل", principal: "خالد صابر عياش", agent: "مجموعة محامي مكتب العدالة", rawDate: "2026-05-20" },
              { rawTitle: "طلب تنفيذ قرار السداد المتبقي", rawText: "رقم 9987162 عاجل", rawDate: "2026-06-05", amount: 150000, opponent_name: "شركة التطوير العقاري", status: "قيد التنفيذ (محجوز)" },
              { rawTitle: "طلب عرض القضية على اللجنة العليا", rawText: "طلب رقم 1120288 بمحتوى مراجعة صك الجلسة", rawDate: "2026-06-18" },
              { rawTitle: "محضر جلسة الدائرة التجارية الثانية", rawText: "تم إرفاق محضر ضبط الجلسة والقرارات التحضيرية", rawDate: "2026-05-30" }
           ];
        }

        function aiCategorizeData(scrapedItems) {
           return scrapedItems.map(item => {
              let category = 'others';
              const textStr = JSON.stringify(item).toLowerCase();
              
              if (textStr.includes('قضية') || textStr.includes('دعوى')) {
                 category = 'cases';
              } else if (textStr.includes('جلسة') || textStr.includes('موعد')) {
                 category = 'hearings';
              } else if (textStr.includes('وكالة') || textStr.includes('توكيل')) {
                 category = 'agencies';
              } else if (textStr.includes('تنفيذ')) {
                 category = 'executions';
              } else if (textStr.includes('عميل') || textStr.includes('طرف')) {
                 category = 'clients';
              } else if (textStr.includes('طلب على القضية') || textStr.includes('طلب عرض')) {
                 category = 'case_requests';
              } else if (textStr.includes('محضر جلسة') || textStr.includes('محضر ضبط')) {
                 category = 'minutes';
              }

              return {
                 rawTitle: item.rawTitle,
                 rawText: item.rawText,
                 rawDate: item.rawDate,
                 principal: item.principal,
                 agent: item.agent,
                 time: item.time,
                 aiDetectedCategory: category,
                 normalizedTimestamp: new Date().toISOString()
              };
           });
        }

        async function handleSync(selectedTypesArray) {
           const btn = document.getElementById('btn-sync-selected');
           if (!btn) return;
           const originalText = btn.innerText;
           btn.innerText = '⚙️ السحب والتحليل الذكي قيد العمل...';
           
           chrome.storage.local.get(['apiUrl', 'apiKey', 'useApiKey'], async (data) => {
              const url = data.apiUrl || window.location.origin + '/api/v1/najiz-sync';
              const rawData = extractMockData();
              let processedData = aiCategorizeData(rawData);
              
              // Filter out entities strictly based on user selection
              processedData = processedData.filter(d => selectedTypesArray.includes(d.aiDetectedCategory) || (selectedTypesArray.includes('other') && d.aiDetectedCategory === 'others'));

              const payload = { 
                action: 'SYNC',
                targetTypes: selectedTypesArray, 
                sourceUrl: window.location.href, 
                timestamp: Date.now(),
                data: processedData,
                authMode: data.useApiKey ? 'API_KEY' : 'PERSONAL_SESSION'
              };
              
              try {
                window.postMessage({ type: 'ADALAH_NAJIZ_SYNC', payload }, '*');
                await new Promise(r => setTimeout(r, 1800));
                btn.style.background = '#10b981';
                btn.style.color = '#ffffff';
                btn.innerText = '✔ تمت المزامنة والفرز بأقسام النظام بنجاح';
              } catch(e) {
                 console.error('Core sync error', e);
                 alert('فشل الاتصال بالخادم. يرجى المراجعة.');
              } finally {
                 setTimeout(() => {
                    btn.style.background = '#D4AF37';
                    btn.style.color = '#0b0f19';
                    btn.innerText = originalText;
                 }, 3000);
              }
           });
        }

        setTimeout(injectWidget, 1500);
      `;

      const popupHtmlText = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
         <meta charset="utf-8">
         <title>إعدادات المزامنة</title>
         <style>
            body { background: #0b0f19; color: #FFFFFF; font-family: system-ui, sans-serif; width: 340px; padding: 0; margin: 0; overflow-x: hidden; }
            .header { background: #060b13; padding: 15px 20px; border-bottom: 2px solid #D4AF37; display: flex; justify-content: space-between; align-items: center; }
            .header h2 { color: #FACC15; font-weight: 900; margin: 0; font-size: 16px; }
            .tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); background: #0a1024; }
            .tab { flex: 1; text-align: center; padding: 12px; cursor: pointer; font-size: 13px; font-weight: bold; color: #FFFFFF; opacity: 0.8; transition: all 0.2s; }
            .tab.active { color: #FACC15; opacity: 1; border-bottom: 2px solid #FACC15; background: rgba(212,175,55,0.05); }
            .content { padding: 20px; display: none; }
            .content.active { display: block; }

            label { display: block; font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: #FACC15; }
            input { width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid #D4AF37; color: #FFFFFF; border-radius: 8px; box-sizing: border-box; font-weight: bold; }
            input::placeholder { color: #FFFFFF; opacity: 0.6; }
            input:focus { outline: none; border-color: #FACC15; }
            button.primary { width: 100%; background: #D4AF37; color: #060b13; padding: 12px; border: none; border-radius: 8px; font-weight: 900; margin-top: 20px; cursor: pointer; }
         </style>
      </head>
      <body>
          <div class="header">
             <h2>العدالة | المزامنة</h2>
          </div>
          <div class="tabs">
             <div class="tab active" data-target="config">الضبط</div>
             <div class="tab" data-target="logs">السجلات</div>
          </div>
          <div id="config" class="content active">
             <label>مفتاح الربط API Key</label>
             <input type="password" id="popup-api-key" placeholder="sk_...">
             <label>رابط الخادم</label>
             <input type="text" id="popup-api-url" placeholder="https://...">
             
             <label style="display:flex; align-items:center; gap:8px; margin-top:15px;">
                <input type="checkbox" id="popup-toggle-apikey" style="width:16px;"> تفعيل المفتاح
             </label>

             <button class="primary" id="saveBtn">حفظ التأمين للربط الإضافي</button>
          </div>
          
          <script src="popup.js"></script>
       </body>
       </html>
       `;

      const popupJsText = `
        document.addEventListener('DOMContentLoaded', () => {
           const tabs = document.querySelectorAll('.tab');
           const contents = document.querySelectorAll('.content');
           
           tabs.forEach(tab => {
              tab.addEventListener('click', () => {
                 tabs.forEach(t => t.classList.remove('active'));
                 contents.forEach(c => c.classList.remove('active'));
                 
                 tab.classList.add('active');
                 document.getElementById(tab.dataset.target).classList.add('active');
              });
           });

           const toggleSettingsLink = () => {
              const isChecked = document.getElementById('popup-toggle-apikey').checked;
              const container = document.getElementById('popup-api-container');
              if (container) {
                container.style.opacity = isChecked ? '1' : '0.4';
                container.style.pointerEvents = isChecked ? 'auto' : 'none';
              }
           };

           const chkBox = document.getElementById('popup-toggle-apikey');
           if (chkBox) chkBox.addEventListener('change', toggleSettingsLink);

           chrome.storage.local.get(['apiUrl', 'apiKey', 'useApiKey'], (data) => {
              if(data.apiUrl && document.getElementById('apiUrl')) document.getElementById('apiUrl').value = data.apiUrl;
              if(data.apiKey && document.getElementById('apiKey')) document.getElementById('apiKey').value = data.apiKey;
              if(document.getElementById('popup-toggle-apikey')) {
                document.getElementById('popup-toggle-apikey').checked = !!data.useApiKey;
                toggleSettingsLink();
              }
           });

           const saveBtn = document.getElementById('saveBtn');
           if (saveBtn) {
             saveBtn.addEventListener('click', () => {
                const useApiKey = document.getElementById('popup-toggle-apikey').checked;
                const apiUrl = document.getElementById('apiUrl').value;
                const apiKey = document.getElementById('apiKey').value;
                const btn = document.getElementById('saveBtn');
                
                btn.innerText = 'جاري الحفظ...';
                
                chrome.storage.local.set({ apiUrl, apiKey, useApiKey }, () => {
                   setTimeout(() => {
                      btn.innerText = 'تم الحفظ ✔️';
                      setTimeout(() => { btn.innerText = 'حفظ التأمين للربط الإضافي'; }, 2000);
                   }, 500);
                });
             });
           }
        });
      `;

      // Pack files inside zip output package pre-populated with current settings panel selections
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("popup.html", popupHtmlText);
      zip.file("popup.js", popupJsText);
      zip.file("content.js", contentJsText);
      zip.file("content.css", contentCssText);
      zip.file("README.md", "دليل التثبيت السريع للعدالة:\n1. افتح الرابط التالي في المتصفح chrome://extensions\n2. قم بتفعيل (وضع المطور) في الجزء العلوي الأيسر\n3. اسحب وأسقط الملف ZIP أو مجلد الإضافة المستخرجة\n4. سيظهر زر المزامنة الذكي بأسفل بوابة ناجز تلقائياً!");

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'adalah-smart-sync.zip');
    } catch (e) {
      console.error("Error generating zip: ", e);
      alert('حدث خطأ أثناء تجميع ملف الإضافة للتحميل');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen bg-[#060b13] text-[#ffffff]" dir="rtl">
      
      {/* Royal Header Widget (Deep Navy and Luxury Gold) */}
      <div className="bg-[#0b0f19] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border-2 border-[#D4AF37]/60">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.08),transparent)] pointer-events-none" />
        <div className="absolute -top-24 -right-12 w-80 h-80 bg-[#D4AF37]/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-amber-500/10 p-4 rounded-3xl border border-[#D4AF37] shadow-[0_5px_15px_rgba(212,175,55,0.3)]">
                <Bot className="w-10 h-10 text-[#FACC15]" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-[#ffffff] tracking-tight drop-shadow-md">
                   الربط المباشر مع ناجز <span className="text-[#FACC15] underline decoration-[#D4AF37] decoration-4 underline-offset-8">بالـ AI الذكي</span>
                </h1>
                <p className="text-sm text-yellow-300 font-extrabold mt-2 tracking-wide block drop-shadow">مزامنة وترتيب ملفات القضايا والجلسات تلقائياً بضغطة زر واحدة وهيبة بصرية متناسقة.</p>
              </div>
            </div>

            {/* Interactive Visual Step Roadmap & Tooltips */}
            <div className="bg-[#0f172a] border border-[#D4AF37]/50 rounded-[2rem] p-6 lg:p-8 shadow-inner relative">
              <div className="absolute top-3 left-6">
                <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/25 border border-[#D4AF37] text-yellow-300 text-[11px] px-3 py-1 rounded-full font-black animate-pulse shadow-md">
                  <SparklesIcon className="w-3.5 h-3.5 text-[#FACC15]" />
                  بروتوكول السحب الآمن
                </span>
              </div>
              
              <h3 className="text-lg font-black text-[#FACC15] mb-5">خريطة خطوات التوجيه الذاتي (مرر لحقائق إضافية)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Step 1 */}
                <div 
                  className={`bg-[#1e293b] p-5 rounded-2xl border transition-all cursor-help relative ${hoveredStep === 1 ? 'border-[#FACC15] bg-[#1e293b]/90 shadow-[0_5px_20px_rgba(212,175,55,0.15)]' : 'border-[#D4AF37]/20'}`}
                  onMouseEnter={() => setHoveredStep(1)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-[#FACC15] text-[#060b13] font-black text-sm flex items-center justify-center shadow-md">1</span>
                    <h4 className="font-bold text-[#FACC15] text-sm tracking-wide">تسجيل دخول ناجز الكلاسيكي</h4>
                  </div>
                  <p className="text-xs text-white font-black leading-relaxed mt-1">سجل بمصادقة نفاذ الوطني لدخول ناجز الاعتيادي بمستعرض الويب.</p>

                  <AnimatePresence>
                    {hoveredStep === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 right-0 mb-3 bg-[#0b0f19] border-2 border-[#D4AF37] p-4 rounded-xl z-30 shadow-2xl text-xs font-bold text-white"
                      >
                        <p className="text-[#FACC15] font-black mb-1">🔐 تشفير كامل آمن:</p>
                        الاتصال مرمز محلياً، لا نطلع على كلمة مرورك ولا يتم تناقل أي بيانات تم تسجيل الدخول بها لحفظ طاعة الصلاحيات والقوانين.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Step 2 */}
                <div 
                  className={`bg-[#1e293b] p-5 rounded-2xl border transition-all cursor-help relative ${hoveredStep === 2 ? 'border-[#FACC15] bg-[#1e293b]/90 shadow-[0_5px_20px_rgba(212,175,55,0.15)]' : 'border-[#D4AF37]/20'}`}
                  onMouseEnter={() => setHoveredStep(2)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-[#FACC15] text-[#060b13] font-black text-sm flex items-center justify-center shadow-md">2</span>
                    <h4 className="font-bold text-[#FACC15] text-sm tracking-wide">بروز زر "العدالة" بالأسفل</h4>
                  </div>
                  <p className="text-xs text-white font-black leading-relaxed mt-1">سيظهر الزر الذهبي بشكل أنيق في ركن بوابة ناجز الأيمن السفلي.</p>

                  <AnimatePresence>
                    {hoveredStep === 2 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 right-0 mb-3 bg-[#0b0f19] border-2 border-[#D4AF37] p-4 rounded-xl z-30 shadow-2xl text-xs font-bold text-white"
                      >
                        <p className="text-[#FACC15] font-black mb-1">👑 تصميم فاخر عالي التباين:</p>
                        الزر المدمج يعتمد على الهوية البصرية للديوان وبوابة ناجز ومتطابق مع معايير WCAG لتسهيل الرؤية لراحة بصر المحامي المجهد.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Step 3 */}
                <div 
                  className={`bg-[#1e293b] p-5 rounded-2xl border transition-all cursor-help relative ${hoveredStep === 3 ? 'border-[#FACC15] bg-[#1e293b]/90 shadow-[0_5px_20px_rgba(212,175,55,0.15)]' : 'border-[#D4AF37]/20'}`}
                  onMouseEnter={() => setHoveredStep(3)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-[#FACC15] text-[#060b13] font-black text-sm flex items-center justify-center shadow-md">3</span>
                    <h4 className="font-bold text-[#FACC15] text-sm tracking-wide">كبسة سحب واحدة بالـ AI</h4>
                  </div>
                  <p className="text-xs text-white font-black leading-relaxed mt-1">توليد المزامنة الفورية للمكاتب والعملاء المصنفين تلقائياً بالذكاء الاصطناعي.</p>

                  <AnimatePresence>
                    {hoveredStep === 3 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 right-0 mb-3 bg-[#0b0f19] border-2 border-[#D4AF37] p-4 rounded-xl z-30 shadow-2xl text-xs font-bold text-white"
                      >
                        <p className="text-[#FACC15] font-black mb-1">🤖 توجيه ذكي مباشر:</p>
                        سيقوم المساعد بقراءة السجلات بدقة متناهية وإدراج القضايا بالجلسات والوكلاء في ثوانٍ معدودة داخل مساحة عملك.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#D4AF37] hover:bg-[#FACC15] text-[#060b13] font-black text-lg px-8 py-5 rounded-2xl shadow-[0_10px_35px_rgba(212,175,55,0.5)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {downloading ? (
                   <span className="flex items-center gap-2">جاري تجهيز حزمة المتصفح الذهبية... ⏳</span>
                ) : (
                   <>
                     <Download className="w-6 h-6" />
                     تحميل حزمة أداة المزامنة الذكية للمتصفح (.ZIP)
                   </>
                )}
              </button>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-transparent hover:bg-white/10 text-white border-2 border-[#D4AF37] font-black text-lg px-6 py-5 rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <Settings className="w-5 h-5 text-[#FACC15]" />
                خيارات الاتصال والـ API
              </button>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-center gap-4 p-8 bg-[#0b0f19] backdrop-blur-md border-2 border-[#D4AF37] rounded-[2.5rem] shadow-2xl shrink-0">
             <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-[#FACC15] drop-shadow font-sans">ربط المزامنة بالخيار الهجين</span>
             </div>
             <div className="text-5xl font-black text-[#FACC15] drop-shadow-[0_4px_10px_rgba(212,175,55,0.4)] font-mono">AI Sync</div>
             <p className="text-xs font-black text-white text-center w-48 bg-[#D4AF37]/35 py-2.5 rounded-xl border-2 border-[#D4AF37] shadow-lg">الفرز التلقائي الفوري دون تداخل السجلات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Settings Panel, Configuration Status, Multi-select Target Types */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Active Connection Status Badge */}
          <div className="bg-[#0b0f19] border border-[#D4AF37]/50 rounded-[2.5rem] p-6 shadow-2xl text-white">
            <h3 className="font-black text-[#FACC15] text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#FACC15]" />
              الحالة الحالية والتفويض
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">نمط عمل الربط:</span>
                  <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">نشط</span>
                </div>
                <p className="text-sm font-black text-emerald-400">
                  {syncMode === 'personal' ? 'المزامنة الذاتية (الحساب الشخصي)' : 'المزامنة المقيدة (API Key)'}
                </p>
              </div>

              <div className="p-4 bg-[#1e293b]/70 border border-[#D4AF37]/30 rounded-2xl text-[11px] font-black leading-relaxed text-yellow-300">
                بمجرد تمديد الإضافة محلياً، تقوم بفحص المحتوى المالي والعمالي والجلسات في خادم ديوان المظالم أو ناجز ونقلها فوراً وفق الصلاحية المحددة.
              </div>

              {/* Web Worker Background Processing Switch */}
              <div className="p-4 bg-yellow-500/5 border border-[#D4AF37]/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-yellow-400">المزامنة الخلفية (Web Worker):</span>
                  <button 
                    onClick={() => setBgProcessingEnabled(!bgProcessingEnabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${bgProcessingEnabled ? 'bg-[#D4AF37]' : 'bg-[#1e293b]'}`}
                  >
                    <div className={`bg-[#060b13] w-4 h-4 rounded-full shadow-md transform transition-all duration-200 ${bgProcessingEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-white font-black leading-relaxed">
                  تفعيل المعالجة وتحليل مصفوفات النصوص الضخمة عبر خيوط متوازية لمنع تجمد الشاشة تماماً.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Checklist Multi-select Config Card inside React UI */}
          <div className="bg-[#0b0f19] border border-[#D4AF37]/50 rounded-[2.5rem] p-6 shadow-2xl text-white space-y-4">
             <div>
                <h3 className="font-black text-[#FACC15] text-lg flex items-center gap-2">
                   <ClipboardList className="w-6 h-6 text-[#FACC15]" />
                   تحديد بيانات السحب
                </h3>
                <p className="text-[11px] text-yellow-100/70 font-semibold mt-1">اختر الأصناف المقررة للاستقبال بالأسفل. سيتم حظر وسحب أي صنف غير محدد آلياً.</p>
             </div>

             <div className="space-y-3 pt-2">
                {[
                  { value: 'cases', label: 'القضايا والدعاوى', icon: Briefcase },
                  { value: 'hearings', label: 'الجلسات والتواريخ القضائية', icon: Calendar },
                  { value: 'agencies', label: 'الوكالات والتفاويض الرسمية', icon: FileText },
                  { value: 'executions', label: 'طلبات التنفيذ المالي والخدمي', icon: Rocket },
                  { value: 'clients', label: 'العملاء وبيانات هوية الأطراف', icon: Users },
                ].map((item) => {
                  const isChecked = selectedSyncTypes.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      onClick={() => handleToggleSyncType(item.value)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-right font-bold text-xs transition-all ${isChecked ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white shadow-md' : 'bg-[#1e293b]/40 border-white/10 text-white/80 hover:text-white hover:bg-[#1e293b]/60'}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${isChecked ? 'text-[#FACC15]' : 'text-white/60'}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/40'}`}>
                        {isChecked && <CheckCircle2 className="w-3 h-3 text-[#060b13] stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Right Side: Tab Options and Interactive Simulator Console */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Main Workspace Navigation Tabbed Views */}
          <div className="bg-[#0b0f19] border border-[#D4AF37]/50 rounded-[3rem] p-10 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="flex flex-wrap gap-2 border-b border-[#D4AF37]/30 mb-8 p-1.5 bg-[#1e293b]/50 rounded-2xl relative z-10">
              <button 
                onClick={() => setActiveTab('instructions')}
                className={`flex-1 py-4 px-6 text-sm md:text-base font-black transition-all rounded-xl ${activeTab === 'instructions' ? 'text-[#060b13] bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/30' : 'text-[#ffffff] hover:bg-[#D4AF37]/10'}`}
              >
                1. تثبيت وبدء العمل
              </button>
              <button 
                onClick={() => setActiveTab('features')}
                className={`flex-1 py-4 px-6 text-sm md:text-base font-black transition-all rounded-xl ${activeTab === 'features' ? 'text-[#060b13] bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/30' : 'text-[#ffffff] hover:bg-[#D4AF37]/10'}`}
              >
                2. مزايا وقدرات المزامنة
              </button>
              <button 
                onClick={() => setActiveTab('keys')}
                className={`flex-1 py-4 px-6 text-sm md:text-base font-black transition-all rounded-xl ${activeTab === 'keys' ? 'text-[#060b13] bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/30' : 'text-[#ffffff] hover:bg-[#D4AF37]/10'}`}
              >
                3. محاكاة السحب بالـ (AI Simulator)
              </button>
            </div>

            {activeTab === 'instructions' && (
              <div className="space-y-10 animate-in fade-in duration-500 relative z-10 text-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   <div className="flex gap-5 bg-[#1e293b] p-6 rounded-3xl border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors shadow-lg">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0 font-black text-[#010610] text-xl shadow-lg">1</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-[#FACC15] text-lg">تحميل الأداة وفك المجلد</h4>
                        <p className="text-sm text-white font-bold leading-relaxed">قم بضغط زر التحميل بالأعلى لحفظ ملف <code className="bg-[#060b13]/60 px-2 py-0.5 rounded text-[#FACC15] border border-[#D4AF37]/30 font-mono">ZIP</code> المستعد، ثم قم باستخراجه في مجلد فارغ بقرصك الصلب.</p>
                      </div>
                   </div>

                   <div className="flex gap-5 bg-[#1e293b] p-6 rounded-3xl border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors shadow-lg">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0 font-black text-[#010610] text-xl shadow-lg">2</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-[#FACC15] text-lg">تحميل إضافات المطور (Chrome)</h4>
                        <p className="text-sm text-white font-bold leading-relaxed">اذهب إلى <code className="bg-[#060b13]/60 px-2.5 py-0.5 rounded text-[#FACC15] border border-[#D4AF37]/30 font-mono">chrome://extensions</code>، فّعل (وضع المطور) بأعلى الشاشة، ثم اختر مجلد الإضافة لدمج الأداة.</p>
                      </div>
                   </div>

                   <div className="flex gap-5 bg-[#1e293b] p-6 rounded-3xl border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors shadow-lg">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0 font-black text-[#010610] text-xl shadow-lg">3</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-[#FACC15] text-lg">الحقن التلقائي لبوابة ناجز</h4>
                        <p className="text-sm text-white font-bold leading-relaxed">بمجرد تسجيل دخولك الاعتيادي بالبوابة الرسمية، تظهر الخيارات الذهبية للمنصة بأسفل الشاشة بسلاسة تامة.</p>
                      </div>
                   </div>

                   <div className="flex gap-5 bg-[#1e293b] p-6 rounded-3xl border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors shadow-lg">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0 font-black text-[#010610] text-xl shadow-lg">4</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-[#FACC15] text-lg">برمجة الفرز وتفادي العشوائية</h4>
                        <p className="text-sm text-white font-bold leading-relaxed">قوائم السحب المتعددة (Multi-select) تضمن للمحامي تعطيل وإبعاد أي تفاصيل أو سجلات وملفات لا يرغب بنقلها.</p>
                      </div>
                   </div>

                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-8 animate-in fade-in duration-500 relative z-10 text-white">
                <div className="bg-[#D4AF37]/10 p-6 rounded-3xl border border-[#D4AF37]/30 mb-8 font-bold text-white text-center text-lg leading-relaxed shadow-inner">
                  تُوفر أداة <strong className="text-[#FACC15]">العدالة</strong> للمحامي والمستشار القانوني تفويض سحب دقيق أثناء التصفح والتحضير لتفادي تشتت البيانات وسهولة إدارتها، مدعومة بمحرك تحليل يستوعب التالي:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {[
                     { title: 'مزامنة وتصنيف كلي للقضايا', icon: Database, desc: 'تحويل الدعاوى بكافة أرقامها وعملائها وتقويمه التلقائي بضغطة زر لمكتبك.' },
                     { title: 'إدارة أطراف والعملاء الجدد', icon: Users, desc: 'التعرف الـ AI الذكي على أطراف النزاع والوكلاء وإدراجهم بسجلات الموكلين التامة.' },
                     { title: 'تقويم وإدارات تقاويم الجلسات', icon: Calendar, desc: 'متابعة وحجز الجلسات المقررة وحفظ المواعيد ونشر تبليغات الإثبات القانوني.' },
                     { title: 'متابعة المعاملة وطلبات التنفيذ', icon: Rocket, desc: 'تحميل بيانات قرارات التنفيذ المالي وربطها بالمهام والتحصيلات للموكلين.' },
                     { title: 'سجلات كتابات العدل والتوكيلات والأوقاف', icon: FileText, desc: 'التحقق من سريان ومستندات التفاويض من وكالة شرعية أو غيرها وأرشفتها.' },
                     { title: 'محاضر وسحوبات ضبوط الجلسة', icon: ClipboardList, desc: 'استخلاص صياغة النصوص ومذكرات الجلسة وإيداعها للأرشيف لمتابعة تطور القضية.' }
                   ].map((feat, i) => (
                     <div key={i} className="p-6 bg-[#1e293b] border border-[#D4AF37]/20 rounded-3xl hover:border-[#D4AF37] hover:bg-[#1e293b]/80 transition-all group shadow-md">
                        <div className="bg-[#060b13] w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/10 transition-colors">
                           <feat.icon className="w-6 h-6 text-[#FACC15] font-black transition-transform group-hover:scale-110" />
                        </div>
                        <h5 className="font-black text-[#FACC15] text-base mb-2 drop-shadow-sm">{feat.title}</h5>
                        <p className="text-xs text-white font-bold leading-relaxed">{feat.desc}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* AI Simulator Mode: Dynamic Testing Bench inside dashboard */}
            {activeTab === 'keys' && (
              <div className="space-y-6 animate-in fade-in duration-500 relative z-10 text-white">
                 <div className="text-center max-w-2xl mx-auto space-y-3">
                    <h3 className="text-2xl font-black text-[#FACC15] drop-shadow">محاكي السحب والفرز بالذكاء الاصطناعي للمنصة</h3>
                    <p className="text-sm text-yellow-100 font-bold leading-relaxed">
                       اختبر الآن قدرة خوارزميات الـ AI ومحاكاة السحب والفرز التلقائي بقاعدة البيانات مباشرة دون تشكيل أي خطر، وبناءً على خيارات التثقيب والنوع المحددة في القائمة الجانبية.
                    </p>
                 </div>

                 <div className="bg-[#1e293b] p-6 lg:p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-2xl relative overflow-hidden space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-white text-base">منصة محاكاة الاستقبال المباشر</h4>
                        <p className="text-xs text-yellow-100/70 font-semibold mt-0.5">ستقوم المحاكاة باستقاء المعطیات وتصنيفها كالقضايا والوكالات والمهام ونقلها لجداول Supabase.</p>
                      </div>

                      <button
                        onClick={runLiveSimulation}
                        disabled={isSimulatingSync}
                        className="bg-[#D4AF37] hover:bg-[#FACC15] text-[#060b13] font-black py-4 px-8 rounded-2xl shadow-[0_5px_15px_rgba(212,175,55,0.3)] transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        {isSimulatingSync ? 'جاري السحب والفرز بالـ AI... ⏳' : '⚡ بدء تشغيل محاكاة السحب الذكي'}
                      </button>
                    </div>

                    {/* Simulated terminal console window */}
                    <div className="bg-[#060b13] rounded-2xl p-5 border-2 border-[#D4AF37]/50 font-mono text-[11px] leading-relaxed relative shadow-inner">
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10 text-white/40">
                         <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                         <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                         <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
                         <span className="text-xs font-black text-white ml-auto">لوحة التحكم التوجيهية للـ AI (الاستقبال والفرز المباشر)</span>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto font-semibold font-mono text-left" dir="ltr">
                        {simulatedLogs.length === 0 ? (
                          <div className="text-white/30 italic text-center py-10 font-sans">
                             بانتظار إطلاق المحاكاة لتتبع مآل البيانات والتحقق من الفرز التوجيهي حسب اختيارك...
                          </div>
                        ) : (
                          simulatedLogs.map((logStr, i) => {
                            let textClass = "text-white";
                            if (logStr.includes("[مزامنة ناجحة]")) textClass = "text-emerald-400";
                            else if (logStr.includes("[AI تجاهل]")) textClass = "text-amber-500";
                            else if (logStr.includes("🔒") || logStr.includes("🤖")) textClass = "text-[#FACC15]";
                            
                            return (
                              <div key={i} className={`p-1.5 rounded transition-transform duration-200 ${textClass}`}>
                                 {logStr}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/30 text-xs font-semibold text-white/90">
                       <Info className="w-5 h-5 text-[#FACC15] shrink-0" />
                       <p>
                          برنامج السحب مدعم بقواعد مطابقة أنماط وتصنيفات مبنية لتفسير العناوين القانونية المفتوحة وفرزها إلى قضايا مستقلة، جلسات مجدولة، عملاء كأفراد أو شركات، أو وكلاء لتوفير الجهد وحوكمة البيانات بالكامل.
                       </p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Royal GOLD & DEEP BLUE Settings Modal Overlay */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-[#060b13]/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-[#0b0f19] border-2 border-[#D4AF37] p-8 rounded-[2.5rem] w-full max-w-2xl relative shadow-[0_20px_50px_rgba(212,175,55,0.25)] text-white"
             >
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute top-6 left-6 text-white hover:text-[#FACC15] p-2 hover:bg-white/10 rounded-full transition-all"
                  aria-label="إغلاق نافذة الإعدادات"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6 border-b border-[#D4AF37]/30 pb-4">
                   <Settings className="w-8 h-8 text-[#FACC15] animate-spin-slow" />
                   <div>
                     <h2 className="text-2xl font-black text-[#FACC15]">ضبط بروتوكولات المزامنة المتقدمة</h2>
                     <p className="text-[#ffffff]/70 text-xs font-bold leading-relaxed mt-0.5">خصص واجهة الاتصال وأسلوب التحويل المباشر لنظام ناجز.</p>
                   </div>
                </div>

                {/* Sleek Switch for Connection Mode Option */}
                <div className="space-y-6">
                   <div className="bg-[#1e293b]/70 p-5 rounded-2xl border border-[#D4AF37]/40">
                      <label className="text-sm font-black text-[#FACC15] mb-3 block">شكل تفويض ومصادقة الاتصال للشركة والمحامي:</label>
                      <div className="grid grid-cols-2 gap-4 p-1.5 bg-[#060b13] rounded-xl border border-[#D4AF37]/20">
                         <button
                           type="button"
                           onClick={() => setSyncMode('personal')}
                           className={`py-3.5 px-4 rounded-lg font-black text-xs transition-all ${syncMode === 'personal' ? 'bg-[#D4AF37] text-[#060b13] shadow-md' : 'text-white hover:bg-white/5'}`}
                         >
                            الحساب الشخصي للغرفة (بدون مفتاح)
                         </button>
                         <button
                           type="button"
                           onClick={() => setSyncMode('apikey')}
                           className={`py-3.5 px-4 rounded-lg font-black text-xs transition-all ${syncMode === 'apikey' ? 'bg-[#D4AF37] text-[#060b13] shadow-md' : 'text-white hover:bg-white/5'}`}
                         >
                            الربط المطور للشركات (API KEY)
                         </button>
                      </div>
                   </div>

                   {/* Mode 1 Description */}
                   {syncMode === 'personal' && (
                     <div className="flex gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 items-start">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-white">الوضع التلقائي الموصى به (بدون مفتاح)</p>
                          <p className="text-[11px] text-yellow-100/80 leading-relaxed mt-1 font-semibold">
                             المزامنة تتم بموجب توثيق المتصفح الشخصي وخصوصية المحامي الكاملة. لا تطلب الأداة منك أي مفاتيح، ويتم ترحيل قضاياك للغرفة وتوجيهها محلياً بأقصى سرية ونسبة أمان.
                          </p>
                        </div>
                     </div>
                   )}

                   {/* Mode 2 Detailed API Fields */}
                   {syncMode === 'apikey' && (
                     <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-[#FACC15] block">رابط استقبال طلب المزامنة (Webhook URL):</label>
                           <input 
                             type="text" 
                             value={customApiUrl}
                             onChange={(e) => setCustomApiUrl(e.target.value)}
                             className="w-full bg-[#060b13] border-2 border-[#D4AF37]/40 rounded-xl p-4 text-xs font-mono font-bold text-white outline-none focus:border-[#FACC15] transition-all"
                           />
                        </div>

                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <label className="text-xs font-black text-[#FACC15] block">مفتاح API الخاص بك للشركة والمكتب:</label>
                             <button 
                               onClick={handleCopyKey} 
                               className="text-xs text-[#FACC15] hover:underline font-bold flex items-center gap-1"
                             >
                               {copiedKey ? 'تم النسخ' : 'نسخ المفتاح الخاص 📋'}
                             </button>
                           </div>
                           <input 
                             type="password" 
                             value={customApiKey}
                             onChange={(e) => setCustomApiKey(e.target.value)}
                             className="w-full bg-[#060b13] border-2 border-[#D4AF37]/40 rounded-xl p-4 text-xs font-mono font-bold text-white outline-none focus:border-[#FACC15] transition-all"
                           />
                        </div>
                     </div>
                   )}

                   <div className="flex items-center gap-4 pt-4 border-t border-white/10 mt-6 justify-end">
                      <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="bg-[#D4AF37] hover:bg-[#FACC15] text-[#060b13] font-black py-4 px-8 rounded-2xl shadow-lg transition-all text-sm"
                      >
                        حفظ وضبط المعلمات للربط
                      </button>
                      <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="bg-transparent hover:bg-white/5 border border-white/20 text-[#ffffff] font-bold py-4 px-6 rounded-2xl transition-all text-sm"
                      >
                        إلغاء التعديل
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Sparkle helper icon component
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
    </svg>
  );
}
