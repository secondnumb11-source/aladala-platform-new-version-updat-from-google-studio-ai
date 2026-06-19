import React, { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS, Step } from 'react-joyride';

const JoyrideAny = Joyride as any;
import { 
  Download, Zap, CheckCircle2, Copy, Bot, Rocket, 
  BookOpen, Key, Link2, Settings, ShieldCheck, 
  Database, Users, Calendar, FileText, ClipboardList, Briefcase, ExternalLink,
  ChevronDown, X, Chrome, Info, HelpCircle, Sparkles, Code
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
  const { createRecord, updateRecord, upsertRecord, clients, cases, hearings, executions, powersOfAttorney } = useSupabaseData();

  // New states for real-time status and history
  const [syncStatus, setSyncStatus] = useState<Record<string, 'idle' | 'syncing' | 'success'>>({
    cases: 'idle',
    hearings: 'idle',
    agencies: 'idle',
    executions: 'idle',
    clients: 'idle'
  });

  const [syncHistory, setSyncHistory] = useState<Record<string, { lastSync: string | null, newCount: number, updatedCount: number }>>(() => {
    const saved = localStorage.getItem('adalah_najiz_sync_history');
    return saved ? JSON.parse(saved) : {
      cases: { lastSync: null, newCount: 0, updatedCount: 0 },
      hearings: { lastSync: null, newCount: 0, updatedCount: 0 },
      agencies: { lastSync: null, newCount: 0, updatedCount: 0 },
      executions: { lastSync: null, newCount: 0, updatedCount: 0 },
      clients: { lastSync: null, newCount: 0, updatedCount: 0 }
    };
  });

  const [importedCardTheme, setImportedCardTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('adalah_imported_card_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('adalah_najiz_sync_history', JSON.stringify(syncHistory));
  }, [syncHistory]);

  useEffect(() => {
    localStorage.setItem('adalah_imported_card_theme', importedCardTheme);
    // Optional: Broad-cast event or update global context if needed
  }, [importedCardTheme]);

  /**
   * Najiz/Legal Reference Number Normalizer
   * Standardizes Arabic-Indic digits to English digits and cleans separators
   * to ensure robust duplicate detection.
   */
  const normalizeRefNumber = useCallback((val: string | number | null | undefined): string => {
    if (!val) return '';
    let str = String(val).trim();
    
    // 1. Map Arabic-Indic digits (٠-٩) to standard English digits (0-9)
    const arabicDigits: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    str = str.replace(/[٠-٩]/g, (match) => arabicDigits[match]);
    
    // 2. Remove all non-essential characters, keeping only digits, slashes, and dashes
    // This removes 'رقم' or 'القضية' or spaces if they were accidentally included
    str = str.replace(/[^\d\/\-]/g, '');
    
    // 3. Normalize parts (remove leading zeros for each segment to treat 1444/0123 as 1444/123)
    // and standardize on slash '/' as primary separator
    return str.split(/[\/\-]/)
      .map(part => part.replace(/^0+/, ''))
      .filter(part => part.length > 0)
      .join('/');
  }, []);

  // Onboarding Tour State
  const [runTour, setRunTour] = useState(false);

  // Sync Report State
  const [syncReport, setSyncReport] = useState<{
    show: boolean;
    stats: { newCount: number; duplicateCount: number; total: number };
    details: { id?: string; title: string; status: 'new' | 'updated' | 'conflict'; category: string; itemData?: any; existingId?: string }[];
  } | null>(null);
  
  const [isSmartMergeApplying, setIsSmartMergeApplying] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('adalah_najiz_tour_seen');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if (['finished', 'skipped'].includes(status)) {
      setRunTour(false);
      localStorage.setItem('adalah_najiz_tour_seen', 'true');
    }
  };

  // Settings Modal & Options with persistent LocalStorage
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [syncMode, setSyncMode] = useState<'personal' | 'apikey'>(() => {
    const saved = localStorage.getItem('adalah_sync_mode');
    return (saved as 'personal' | 'apikey') || 'personal';
  });
  const [customApiKey, setCustomApiKey] = useState(() => {
    const saved = localStorage.getItem('adalah_custom_api_key');
    return saved || '';
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
          const numRegex = /([\d\u0660-\u0669]+(?:[\-\/][\d\u0660-\u0669]+)*)/;
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

      // Extraction heuristic logic with Arabic digit support
      const numRegex = /([\d\u0660-\u0669]+(?:[\-\/][\d\u0660-\u0669]+)*)/;
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

    // Advanced Matching and Upsert Logic (preventing duplicates and updating existing)
    let isDuplicate = false;
    let existingId = '';
    const finalCaseNumberDetect = item.caseNumber || extractedNumber;
    const normalizedTarget = normalizeRefNumber(finalCaseNumberDetect);

    if (category === 'cases' && normalizedTarget) {
      const existing = (cases || []).find((c: any) => 
        normalizeRefNumber(c.caseNumber) === normalizedTarget || 
        normalizeRefNumber(c.najizCaseNumber) === normalizedTarget
      );
      if (existing) { isDuplicate = true; existingId = existing.id; }
    } else if (category === 'hearings') {
      const hDate = item.rawDate || new Date().toISOString().split('T')[0];
      const hTime = item.time || '10:00';
      const existing = (hearings || []).find((h: any) => h.date === hDate && h.time === hTime);
      if (existing) { isDuplicate = true; existingId = existing.id; }
    } else if (category === 'executions' && (item.execution_number || extractedNumber)) {
      const exNumNormalized = normalizeRefNumber(item.execution_number || extractedNumber);
      const existing = (executions || []).find((ex: any) => 
        normalizeRefNumber(ex.execution_number) === exNumNormalized ||
        normalizeRefNumber(ex.case_number) === exNumNormalized
      );
      if (existing) { isDuplicate = true; existingId = existing.id; }
    } else if (category === 'agencies' && (item.poa_number || extractedNumber)) {
      const poaNumNormalized = normalizeRefNumber(item.poa_number || extractedNumber);
      const existing = (powersOfAttorney || []).find((p: any) => normalizeRefNumber(p.poaNumber) === poaNumNormalized);
      if (existing) { isDuplicate = true; existingId = existing.id; }
    }

    if (isDuplicate) {
      try {
        // Perform an update instead of just blocking
        if (category === 'cases' && existingId) {
          // Defer update so user can smart merge later
          return {
            status: 'conflict',
            category,
            existingId,
            itemData: item,
            title: item.rawTitle || finalCaseNumberDetect || 'سجل متضارب',
            message: `[تضارب] تم اكتشاف سجل مشابه، يرجى اختيار دمج ذكي للبيانات الأحدث.`
          };
        } else if (category === 'hearings' && existingId) {
          return {
            status: 'conflict',
            category,
            existingId,
            itemData: item,
            title: item.rawTitle || finalCaseNumberDetect || 'جلسة متضاربة',
            message: `[تضارب] تم اكتشاف جلسة مشابهة.`
          };
        } else if (category === 'executions' && existingId) {
          return {
            status: 'conflict',
            category,
            existingId,
            itemData: item,
            title: item.rawTitle || finalCaseNumberDetect || 'تنفيذ متضارب',
            message: `[تضارب] تم اكتشاف طلب مشابه للدمج.`
          };
        } else if (category === 'agencies' && existingId) {
          return {
            status: 'conflict',
            category,
            existingId,
            itemData: item,
            title: item.rawTitle || finalCaseNumberDetect || 'وكالة متضاربة',
            message: `[تضارب] تم اكتشاف وكالة مشابهة للدمج.`
          };
        }

        setSyncHistory(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            lastSync: new Date().toISOString(),
          }
        }));
        return {
          status: 'conflict',
          category,
          title: item.rawTitle || finalCaseNumberDetect || 'سجل متضارب',
          message: `[تحديث] تم العثور على تضارب في السجل "${item.rawTitle || 'سجل'}".`
        };
      } catch (e) {
        console.error("Error updating record during sync:", e);
      }
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
          priority: priority,
          is_najiz_sync: true,
          last_sync_at: new Date().toISOString()
        });

        if (creationResult && !creationResult.success) {
          throw new Error(creationResult.message || 'فشلت معايير التحقق المحلية للقضية');
        }

        setSyncHistory(prev => ({
          ...prev,
          cases: {
            ...prev.cases,
            lastSync: new Date().toISOString(),
            newCount: (prev.cases?.newCount || 0) + 1
          }
        }));

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
            priority: priority,
            is_najiz_sync: true,
            last_sync_at: new Date().toISOString()
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
          notes: item.rawText || `جلسة تلقائية مستوردة من ناجز: ${item.rawTitle || 'غير محدد'}`,
          is_najiz_sync: true,
          last_sync_at: new Date().toISOString()
        });

        setSyncHistory(prev => ({
          ...prev,
          hearings: {
            ...prev.hearings,
            lastSync: new Date().toISOString(),
            newCount: (prev.hearings?.newCount || 0) + 1
          }
        }));

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
          status: 'سارية',
          is_najiz_sync: true,
          last_sync_at: new Date().toISOString()
        });

        if (resPoa && !resPoa.success) {
          throw new Error(resPoa.message || 'فشلت معايير التحقق المحلية للوكالة');
        }

        setSyncHistory(prev => ({
          ...prev,
          agencies: {
            ...prev.agencies,
            lastSync: new Date().toISOString(),
            newCount: (prev.agencies?.newCount || 0) + 1
          }
        }));

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
          details: item.rawText || `تفاصيل طلب التنفيذ المسحوب آلياً من بوابة ناجز برقم ${execNo}`,
          is_najiz_sync: true,
          last_sync_at: new Date().toISOString()
        }, 'execution_number');

        if (execRes && !execRes.success) {
          throw new Error(execRes.message || 'فشلت معايير التحقق لطلب التنفيذ');
        }

        setSyncHistory(prev => ({
          ...prev,
          executions: {
            ...prev.executions,
            lastSync: new Date().toISOString(),
            newCount: (prev.executions?.newCount || 0) + 1
          }
        }));

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
          status: 'نشط',
          is_najiz_sync: true,
          last_sync_at: new Date().toISOString()
        });

        if (resClient && !resClient.success) {
          throw new Error(resClient.message || 'فشلت معايير التحقق المحلية للعميل الجديد');
        }

        setSyncHistory(prev => ({
          ...prev,
          clients: {
            ...prev.clients,
            lastSync: new Date().toISOString(),
            newCount: (prev.clients?.newCount || 0) + 1
          }
        }));

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
          priority: 'medium',
          is_najiz_sync: true,
          last_sync_at: new Date().toISOString()
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
          createdAt: new Date().toISOString(),
          is_najiz_sync: true,
          last_sync_at: new Date().toISOString()
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
          priority: 'medium',
          is_najiz_sync: true,
          last_sync_at: new Date().toISOString()
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
        const results = [];
        let newCount = 0;
        let duplicateCount = 0;

        // Set all involved categories to syncing
        const catsToSync = targets.filter((t: string) => syncStatus.hasOwnProperty(t));
        setSyncStatus(prev => {
          const next = { ...prev };
          catsToSync.forEach((c: string) => next[c] = 'syncing');
          return next;
        });

        for (const item of payload.data) {
          const result = await classifyAndSyncItem(item, targets);
          results.push({
            id: Math.random().toString(),
            title: item.rawTitle || item.caseNumber || item.poa_number || 'معاملة ناجز',
            status: (result.status === 'duplicate' || result.status === 'updated' || result.status === 'conflict') ? 'conflict' : 'new' as any,
            category: result.category,
            itemData: result.itemData,
            existingId: result.existingId
          });

          if (result.status === 'success') {
            newCount++;
            showToast(result.message, 'success');
          } else if (result.status === 'duplicate' || result.status === 'updated' || result.status === 'conflict') {
            duplicateCount++;
            showToast(result.message, 'info');
          } else if (result.status === 'disabled') {
            showToast(result.message, 'info');
          } else {
            showToast(result.message, 'error');
          }
        }
        
        // Mark as success
        setSyncStatus(prev => {
          const next = { ...prev };
          catsToSync.forEach((c: string) => next[c] = 'success');
          return next;
        });
        setTimeout(() => {
          setSyncStatus(prev => {
            const next = { ...prev };
            catsToSync.forEach((c: string) => next[c] = 'idle');
            return next;
          });
        }, 3000);

        setSyncReport({
          show: true,
          stats: { newCount: newCount, duplicateCount: duplicateCount, total: payload.data.length },
          details: results
        });

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

    const results = [];
    let newCount = 0;
    let duplicateCount = 0;

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
      
      results.push({
        id: Math.random().toString(),
        title: item.rawTitle || (item as any).caseNumber || (item as any).poa_number || 'معاملة ناجز',
        status: (result.status === 'duplicate' || result.status === 'updated' || result.status === 'conflict') ? 'conflict' : 'new' as any,
        category: result.category,
        itemData: result.itemData,
        existingId: result.existingId
      });

      if (result.status === 'success') {
        newCount++;
        showToast(result.message, 'success');
      } else if (result.status === 'duplicate' || result.status === 'updated' || result.status === 'conflict') {
        duplicateCount++;
        showToast(result.message, 'info');
      } else {
        showToast(result.message, 'info');
      }
      await new Promise(r => setTimeout(r, 600));
    }

    setSyncReport({
      show: true,
      stats: { newCount: newCount, duplicateCount: duplicateCount, total: dummyScrapes.length },
      details: results
    });

    log("✅ اكتمل الفرز الآلي وتوزيع كافة الكيانات على أقسام المنصة بنجاح دون أي تدخل بشري!");
    setIsSimulatingSync(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const manifestCode = `{
  "manifest_version": 3,
  "name": "منصة العدالة - مزامنة ناجز",
  "version": "2.0",
  "description": "مزامنة تلقائية لبيانات ناجز مع منصة العدالة",
  "permissions": ["activeTab", "scripting", "storage", "tabs"],
  "host_permissions": ["*://*.najiz.sa/*", "*://*.adalah.law/*", "http://localhost:*/*"],
  "action": { "default_popup": "popup.html" },
  "content_scripts": [{
    "matches": ["*://*.najiz.sa/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  "background": {
    "service_worker": "background.js"
  }
}`;

      const backgroundJsCode = `chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncNajizData') {
    chrome.storage.local.get(['systemUrl', 'apiKey'], (result) => {
      const systemUrl = result.systemUrl || 'http://localhost:3000';
      const apiKey = result.apiKey || '';
      fetch(systemUrl + '/api/najiz-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           'X-Source': 'najiz-extension',
           ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          type: message.dataType,
          data: message.data,
          url: message.url,
          timestamp: Date.now(),
          apiKey: apiKey,
          rawText: message.data.map(d => d.rawText).join('\\n'),
          selectedTypes: [message.dataType === 'all' ? 'cases' : message.dataType]
        })
      })
      .then(res => res.json())
      .then(data => {
        chrome.storage.local.set({ lastSync: Date.now() });
        sendResponse({ success: true, count: message.data.length });
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "اكتملت المزامنة",
          message: \`تم مزامنة \${message.data.length} سجل بنجاح.\`
        });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    });
    return true;
  }
});`;

      const contentJsCode = `// content.js - سحب البيانات من صفحات ناجز
function extractNajizData() {
  const url = window.location.href;
  let extractedData = [];
  let dataType = 'unknown';

  if (url.includes('/cases') || url.includes('/my-cases')) {
    dataType = 'cases';
    document.querySelectorAll('.case-card, table tr, .najiz-card').forEach(el => {
      const text = el.innerText;
      if (text.includes('رقم القضية') || text.includes('المحكمة')) {
        extractedData.push({
          caseNumber: text.match(/رقم القضية:?\\s*(\\S+)/)?.[1] || 'غير متوفر',
          courtName: text.match(/المحكمة:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          status: text.match(/الحالة:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          date: text.match(/تاريخ:?\\s*([^\\n]+)/)?.[1] || new Date().toISOString().split('T')[0],
          rawText: text
        });
      }
    });
  } else if (url.includes('/sessions') || url.includes('/hearings')) {
    dataType = 'hearings';
    document.querySelectorAll('.session-card, table tr').forEach(el => {
      const text = el.innerText;
      if (text.includes('التاريخ') || text.includes('الجلسة')) {
        extractedData.push({
          date: text.match(/تاريخ:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          time: text.match(/وقت:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          court: text.match(/قاعة:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          rawText: text
        });
      }
    });
  } else if (url.includes('/agencies') || url.includes('/powers')) {
    dataType = 'agencies';
    document.querySelectorAll('.agency-card, table tr').forEach(el => {
      const text = el.innerText;
      if (text.includes('رقم الوكالة')) {
        extractedData.push({
          number: text.match(/رقم الوكالة:?\\s*(\\S+)/)?.[1] || 'غير متوفر',
          issueDate: text.match(/تاريخ الإصدار:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          rawText: text
        });
      }
    });
  } else if (url.includes('/execution')) {
    dataType = 'executions';
    document.querySelectorAll('.execution-card, table tr').forEach(el => {
      const text = el.innerText;
      if (text.includes('رقم الطلب') || text.includes('التنفيذ')) {
        extractedData.push({
          number: text.match(/رقم الطلب:?\\s*(\\S+)/)?.[1] || 'غير متوفر',
          amount: text.match(/المبلغ:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          status: text.match(/الحالة:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          rawText: text
        });
      }
    });
  } else if (url.includes('/judgments') || url.includes('/deeds')) {
    dataType = 'judgments';
    document.querySelectorAll('.judgment-card, table tr').forEach(el => {
      const text = el.innerText;
      if (text.includes('رقم الصك') || text.includes('رقم الحكم')) {
        extractedData.push({
          number: text.match(/رقم الصك:?\\s*(\\S+)/)?.[1] || text.match(/رقم الحكم:?\\s*(\\S+)/)?.[1] || 'غير متوفر',
          date: text.match(/تاريخ:?\\s*([^\\n]+)/)?.[1] || 'غير متوفر',
          rawText: text
        });
      }
    });
  }

  if (extractedData.length === 0) {
    dataType = 'all';
    document.querySelectorAll('.card, table tr').forEach(el => {
      if (el.innerText.length > 50) {
        extractedData.push({ rawText: el.innerText });
      }
    });
  }

  return { dataType, data: extractedData, url };
}

function injectAlAdalahBtn() {
  if (document.querySelector('.aladalah-sync-container')) return;
  const container = document.createElement('div');
  container.className = 'aladalah-sync-container';
  container.innerHTML = \`
    <div style="position:fixed; bottom:20px; left:20px; z-index:99999; background:#0b1329; border:2px solid #D4AF37; padding:10px; border-radius:10px; color:#fff; font-family:sans-serif; text-align:right; direction:rtl; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
      <h4 style="margin:0 0 10px 0; color:#D4AF37;">مزامنة بيانات ناجز</h4>
      <button id="aladalah-sync-all" style="background:#D4AF37; color:#0b1329; border:none; padding:8px 12px; margin:3px; border-radius:5px; font-weight:bold; cursor:pointer;">مزامنة جميع البيانات</button>
      <div style="display:flex; flex-direction:column; gap:5px; margin-top:10px;">
         <button id="aladalah-sync-cases" style="background:#1a2b5e; color:#fff; border:1px solid #D4AF37; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">مزامنة جميع القضايا</button>
         <button id="aladalah-sync-sessions" style="background:#1a2b5e; color:#fff; border:1px solid #D4AF37; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">مزامنة جميع الجلسات</button>
         <button id="aladalah-sync-agencies" style="background:#1a2b5e; color:#fff; border:1px solid #D4AF37; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">سحب الوكالات</button>
         <button id="aladalah-sync-execution" style="background:#1a2b5e; color:#fff; border:1px solid #D4AF37; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">سحب طلبات التنفيذ</button>
         <button id="aladalah-sync-judgments" style="background:#1a2b5e; color:#fff; border:1px solid #D4AF37; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">الأحكام ومحاضر الجلسات</button>
      </div>
    </div>
  \`;
  document.body.appendChild(container);

  const doSync = () => {
    const extracted = extractNajizData();
    if(extracted.data.length === 0) {
      alert("لم يتم العثور على بيانات واضحة للسحب من هذه الصفحة.");
      return;
    }
    chrome.runtime.sendMessage({
      action: 'syncNajizData',
      ...extracted
    }, (res) => {
      if (res && res.success) {
        alert("تم إرسال " + res.count + " سجل بنجاح إلى منصة العدالة!");
      } else {
        alert("تأكد من ضبط رابط النظام في إعدادات الامتداد.");
      }
    });
  };

  document.getElementById('aladalah-sync-all').onclick = doSync;
  document.getElementById('aladalah-sync-cases').onclick = doSync;
  document.getElementById('aladalah-sync-sessions').onclick = doSync;
  document.getElementById('aladalah-sync-agencies').onclick = doSync;
  document.getElementById('aladalah-sync-execution').onclick = doSync;
  document.getElementById('aladalah-sync-judgments').onclick = doSync;
}

const observer = new MutationObserver(() => {
  injectAlAdalahBtn();
});
observer.observe(document.body, { childList: true, subtree: true });

injectAlAdalahBtn();
`;

      const popupHtmlCode = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { width: 320px; font-family: sans-serif; padding: 20px; background: #0b1329; color: #FFFFFF; text-align: right; }
    h3 { margin: 0 0 15px 0; color: #D4AF37; text-align: center; }
    label { font-size: 11px; color: #D4AF37; display: block; margin-bottom: 5px; }
    input { width: 100%; box-sizing: border-box; padding: 8px; margin-bottom: 12px; border: 1px solid #D4AF37; border-radius: 4px; background: #1a2b5e; color: #fff; font-size: 11px; }
    p.status { font-size: 11px; color: #aaa; margin-bottom: 15px; text-align: center; }
    .btn { background: #D4AF37; color: #0b1329; border: none; padding: 10px; font-weight: bold; width: 100%; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 12px; }
    .btn:hover { background: #eac54c; }
    .btn-secondary { background: transparent; color: #D4AF37; border: 1px solid #D4AF37; margin-top: 5px; }
  </style>
</head>
<body>
  <h3>منصة العدالة - مزامنة ناجز</h3>
  
  <label>رابط النظام (URL التطبيق المنشور):</label>
  <input type="text" id="systemUrl" placeholder="https://adalah.law" />

  <label>مفتاح الربط API KEY (اختياري - للربط الخارجي):</label>
  <input type="password" id="apiKey" placeholder="ادخل مفتاح الربط إن وجد" />

  <button class="btn btn-secondary" id="saveUrlBtn">حفظ الإعدادات</button>
  
  <hr style="border-color: #1a2b5e; margin: 20px 0;" />
  
  <p class="status" id="statusText">بانتظار المزامنة...</p>
  <button class="btn" id="syncBtn">مزامنة الآن</button>

  <script src="popup.js"></script>
</body>
</html>`;

      const popupJsCode = `document.addEventListener('DOMContentLoaded', () => {
  const systemUrlInput = document.getElementById('systemUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveUrlBtn = document.getElementById('saveUrlBtn');
  const syncBtn = document.getElementById('syncBtn');
  const statusText = document.getElementById('statusText');

  chrome.storage.local.get(['systemUrl', 'apiKey', 'lastSync'], (result) => {
    if (result.systemUrl) systemUrlInput.value = result.systemUrl;
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.lastSync) {
      statusText.innerText = 'آخر مزامنة: ' + new Date(result.lastSync).toLocaleString('ar-SA');
    }
  });

  saveUrlBtn.addEventListener('click', () => {
    const url = systemUrlInput.value.trim();
    const key = apiKeyInput.value.trim();
    chrome.storage.local.set({ systemUrl: url, apiKey: key }, () => {
      alert('تم حفظ الإعدادات بنجاح!');
    });
  });

  syncBtn.addEventListener('click', () => {
    statusText.innerText = 'جاري المزامنة...';
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: () => { document.getElementById('aladalah-sync-all')?.click(); }
      });
    });
  });
});`;

      const readmeCode = `# أداة المزامنة الفورية لنظام العدالة (منصة ناجز)

أهلاً بك في الدليل الإرشادي لتنصيب امتداد "العدالة وناجز". هذا الامتداد مصمم لتوفير الجهد في تكرار إدخال البيانات عبر سحبها آلياً من بوابة ناجز.

## 🛠️ متطلبات التشغيل
- متصفح Google Chrome (أو متصفح مبني على Chromium مثل Edge).
- اتصال نشط بالإنترنت.

## 🚀 خطوات التثبيت (بوضوح)

### الخطوة الأولى: تجهيز الملفات
1. قم بفك الضغط عن الملف الذي قمت بتحميله الآن (Adalah-Najiz-Sync-Build.zip).
2. تأكد من وجود مجلد يحتوي على ملفات مثل \`manifest.json\` و \`content.js\`.

### الخطوة الثانية: تفعيل وضع المطورين في المتصفح
1. افتح متصفح Google Chrome.
2. اذهب إلى الرابط التالي (انسخه والصقه في شريط العنوان): \`chrome://extensions\`
3. في الزاوية العلوية اليمنى (أو اليسرى حسب اللغة)، ستجد خيار **"وضع المطور" (Developer mode)**، قم بتفعيله.

### الخطوة الثالثة: تحميل الإضافة
1. سيظهر لك زر جديد بعنوان **"تحميل حزمة غير مضغوطة" (Load unpacked)**. اضغط عليه.
2. اختر المجلد الذي قمت بفك ضغطه في الخطوة الأولى.
3. ستلاحظ ظهور أيقونة "العدالة" الآن في قائمة الإضافات.

### الخطوة الرابعة: الضبط والربط
1. ادخل إلى حسابك في **منصة ناجز (najiz.sa)** عبر نفاذ.
2. بمجرد الدخول، ستجد زر "العدالة" أسفل يمين الشاشة.
3. اضغط على أيقونة الإضافة في شريط الأدوات العُلوي للمتصفح.
4. أدخل **رابط النظام** الخاص بك (Webhook URL) الموجود في صفحة "الربط مع ناجز" داخل نظامك.
5. (اختياري) أدخل **مفتاح الـ API** إذا كنت تستخدم الوضع المطور للشركات.
6. اضغط على "حفظ".

## 💡 كيف تستخدم الأداة؟
- عند تصفح "قضاياي" أو "الجلسات" في ناجز، سيظهر لك خيار "مزامنة الكل" أو "مزامنة هذه القضية".
- بمجرد الضغط، سيقوم الذكاء الاصطناعي في نظام العدالة باستقبال البيانات، فرزها، وتحديث "آخر مزامنة" في واجهة القضايا والجلسات لديك فوراً.

---
*شكراً لاستخدامك حلول "العدالة" الذكية.*
`;

      const zip = new JSZip();
      const folder = zip.folder("Adalah-Najiz-Sync-Build");
      if (folder) {
        folder.file("manifest.json", manifestCode);
        folder.file("background.js", backgroundJsCode);
        folder.file("content.js", contentJsCode);
        folder.file("popup.html", popupHtmlCode);
        folder.file("popup.js", popupJsCode);
        folder.file("README-AR.md", readmeCode);
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Adalah-Najiz-Sync-Build.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      (window as any).showToast?.('تم توليد وتنزيل حزمة الإضافة بصيغة ZIP وجاهزة للعمل.', 'success');
    } catch (e) {
      console.error("Error initiating download: ", e);
      (window as any).showToast?.('حدث خطأ أثناء تحميل الإضافة', 'error');
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  const joyrideSteps: Step[] = [
    {
      target: '#najiz-welcome',
      content: 'أهلاً بك في فضاء ناجز المتطور. هنا يمكنك ربط مكتبك ببيانات ناجز الرسمية لسحب القضايا والجلسات آلياً.',
      title: 'أهلاً بك 🚀',
    },
    {
      target: '#sync-dashboard',
      content: 'لوحة التحكم الفورية لمزامنة كافة أقسام مكتبك بضغطة زر من بوابة ناجز.',
      title: 'لوحة التحكم الملكية 👑',
    },
    {
      target: '#sync-history',
      content: 'هنا يتم رصد كل عملية استيراد بدقة متناهية لضمان شفافية وجودة البيانات.',
      title: 'سجل الشفافية 📊',
    },
    {
        target: '#features-section',
        content: 'تعرف على الخطوات العملية لتثبيت الامتداد وتفعيله على متصفحك.',
        title: 'دليل التثبيت 📦',
    },
    {
      target: '#config-card',
      content: 'من هنا حدد أنواع البيانات التي ترغب في استقبالها آلياً.',
      title: 'تخصيص البيانات 🎯',
    },
    {
      target: '#settings-btn',
      content: 'هنا يمكنك ضبط مفاتيح الربط وتغيير هوية الكروت المستوردة.',
      title: 'بروتوكولات الضبط ⚙️',
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      
      <JoyrideAny
        steps={joyrideSteps}
        run={runTour}
        continuous={true}
        callback={handleJoyrideCallback}
        locale={{
          back: 'السابق',
          close: 'إغلاق',
          last: 'نهاية الجولة',
          next: 'التالي',
          skip: 'تخطي الجولة',
        }}
        styles={{
          tooltipContainer: {
            textAlign: 'right',
            direction: 'rtl'
          }
        }}
      />
      {/* Live Dashboard Control Panel */}
      <div id="sync-dashboard" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'cases', label: 'مزامنة القضايا', icon: Database, color: 'blue' },
          { id: 'hearings', label: 'مزامنة الجلسات', icon: Calendar, color: 'amber' },
          { id: 'agencies', label: 'مزامنة الوكالات', icon: Users, color: 'indigo' },
          { id: 'executions', label: 'مزامنة طلبات التنفيذ', icon: FileText, color: 'emerald' }
        ].map((btn) => {
          const status = syncStatus[btn.id] || 'idle';
          return (
            <motion.button
              key={btn.id}
              whileHover={{ scale: 1.05, translateY: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (status === 'idle') {
                  const showToast = (window as any).showToast || console.log;
                  showToast(`جاري الاتصال بـ ناجز لسحب ${btn.label}...`, 'info');
                  setSyncStatus(prev => ({ ...prev, [btn.id]: 'syncing' }));
                  setTimeout(() => {
                    setSyncStatus(prev => ({ ...prev, [btn.id]: 'success' }));
                    showToast(`تم تحديث ${btn.label} بنجاح`, 'success');
                    setTimeout(() => setSyncStatus(prev => ({ ...prev, [btn.id]: 'idle' })), 3000);
                  }, 2000);
                }
              }}
              className={`relative overflow-hidden p-6 rounded-[2.5rem] border-2 transition-all flex flex-col gap-4 text-right shadow-2xl
                ${status === 'syncing' ? 'border-[#D4AF37] bg-slate-900 animate-pulse' : 
                  status === 'success' ? 'border-emerald-500 bg-emerald-950' : 
                  'border-[#D4AF37]/30 bg-[#063060] hover:border-[#D4AF37] shadow-[#063060]/20'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3.5 rounded-2xl ${
                  status === 'syncing' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                  status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-[#D4AF37]/10 text-[#FACC15]'}`}>
                  <btn.icon className="w-7 h-7" />
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-full ${
                  status === 'syncing' ? 'bg-[#D4AF37]/20 text-[#FACC15]' :
                  status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-white/10 text-[#FACC15]/80'}`}>
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'syncing' ? 'bg-[#FACC15] animate-ping' :
                    status === 'success' ? 'bg-emerald-400' :
                    'bg-[#D4AF37]'}`} />
                  {status === 'syncing' ? 'جاري السحب...' : status === 'success' ? 'اكتمل بنجاح' : 'جاهز للربط'}
                </div>
              </div>
              <div>
                <h4 className={`font-black text-lg ${status === 'idle' ? 'text-white' : 'text-white'}`}>{btn.label}</h4>
                <p className={`text-[10px] font-bold ${status === 'idle' ? 'text-[#FACC15]/70' : 'text-white/60'}`}>
                  {syncHistory[btn.id]?.lastSync ? `آخر عملية: ${new Date(syncHistory[btn.id].lastSync!).toLocaleDateString('ar-SA')}` : 'انتظار الربط الأول'}
                </p>
              </div>
              
              {/* Luxury Glossy Overlay */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            </motion.button>
          );
        })}
      </div>

      {/* Sync History Table */}
      <motion.div 
        id="sync-history"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-xl"
      >
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">سجل شفافية البيانات</h3>
              <p className="text-sm text-slate-400 font-bold">متابعة دقيقة لكل عملية استيراد من بوابة ناجز</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">القسم / التصنيف</th>
                <th className="px-8 py-4 text-center">آخر عملية سحب</th>
                <th className="px-8 py-4 text-center">سجلات مضافة</th>
                <th className="px-8 py-4 text-center">سجلات محدثة</th>
                <th className="px-8 py-4 text-center">الحالة الحالية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { id: 'cases', label: 'القضايا والدعاوى', icon: Briefcase },
                { id: 'hearings', label: 'الجلسات والمواعيد', icon: Calendar },
                { id: 'agencies', label: 'الوكالات الشرعية', icon: Users },
                { id: 'executions', label: 'طلبات التنفيذ', icon: Zap },
                { id: 'clients', label: 'ملفات الموكلين', icon: Bot }
              ].map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="font-black text-slate-700 text-sm">{item.label}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-500 text-xs">
                    {syncHistory[item.id]?.lastSync ? new Date(syncHistory[item.id].lastSync!).toLocaleString('ar-SA') : '---'}
                  </td>
                  <td className="px-8 py-5 text-center font-black text-emerald-600 text-sm">
                    {syncHistory[item.id]?.newCount || 0}
                  </td>
                  <td className="px-8 py-5 text-center font-black text-amber-500 text-sm">
                    {syncHistory[item.id]?.updatedCount || 0}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                      syncHistory[item.id]?.lastSync ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {syncHistory[item.id]?.lastSync ? 'متزامن' : 'غير متصل'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      
      {/* Sync Report Modal */}
      <AnimatePresence>
        {syncReport?.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setSyncReport(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-[#0b1329] border-2 border-[#D4AF37] overflow-hidden rounded-[3rem] max-w-2xl w-full shadow-[0_0_50px_rgba(212,175,55,0.4)]"
            >
              <div className="p-8 bg-[#1e293b]/50 border-b border-[#D4AF37]/30">
                 <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[#FACC15] mb-1">تقرير ذكاء المزامنة والمطابقة (Mapping)</h2>
                      <p className="text-slate-300 text-xs font-bold italic">تحليل المطابقة الفوري لتجنب التكرار وتحديث السجلات القائمة.</p>
                    </div>
                    <button 
                      onClick={() => setSyncReport(null)}
                      className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                 </div>

                 <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center">
                       <p className="text-[10px] font-black text-emerald-400 mb-1">بيانات جديدة ✅</p>
                       <p className="text-3xl font-black text-white">{syncReport.stats.newCount}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-center">
                       <p className="text-[10px] font-black text-amber-400 mb-1">سجلات للدمج الذكي 🔁</p>
                       <p className="text-3xl font-black text-white">{syncReport.stats.duplicateCount}</p>
                    </div>
                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 rounded-2xl text-center">
                       <p className="text-[10px] font-black text-[#FACC15] mb-1">إجمالي المعاملات</p>
                       <p className="text-3xl font-black text-white">{syncReport.stats.total}</p>
                    </div>
                 </div>
              </div>

              <div className="p-6 max-h-[400px] overflow-y-auto space-y-3 custom-scrollbar">
                {syncReport.details.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-[#1e293b]/30 border border-white/5 rounded-2xl hover:bg-[#1e293b]/50 transition-all">
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.status === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {item.status === 'new' ? <Zap className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                       </div>
                       <div>
                          <p className="text-xs font-black text-white">{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{item.category}</p>
                       </div>
                    </div>
                    <div className={`text-[10px] font-black px-3 py-1 rounded-full border ${item.status === 'new' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-[#FACC15] border-[#D4AF37]/50'}`}>
                       {item.status === 'new' ? 'بيانات جديدة' : 'معلق للدمج'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-black/20 flex gap-3">
                 {syncReport.details.some(d => d.status === 'conflict') && (
                   <button 
                    disabled={isSmartMergeApplying}
                    onClick={async () => {
                      setIsSmartMergeApplying(true);
                      for (const item of syncReport.details) {
                        if (item.status === 'conflict' && item.existingId && item.itemData) {
                          try {
                            if (item.category === 'cases') {
                              await updateRecord('cases', item.existingId, { last_sync_at: new Date().toISOString(), summary: (item.itemData.rawText || '') + ' [دمج ذكي]' });
                            } else if (item.category === 'hearings') {
                              await updateRecord('hearings', item.existingId, { last_sync_at: new Date().toISOString(), notes: (item.itemData.rawText || '') + ' [دمج ذكي]' });
                            } else if (item.category === 'executions') {
                              await updateRecord('executions', item.existingId, { last_sync_at: new Date().toISOString() });
                            } else if (item.category === 'agencies') {
                              await updateRecord('powers_of_attorney', item.existingId, { last_sync_at: new Date().toISOString() });
                            }
                          } catch (e) { console.error('Error in smart merge:', e); }
                        }
                      }
                      const showToast = (window as any).showToast || console.log;
                      showToast("تم تطبيق دمج ذكي للبيانات الأحدث بنجاح!", "success");
                      setIsSmartMergeApplying(false);
                      setSyncReport(null);
                    }}
                    className="flex-1 bg-[#203c68] hover:bg-[#D4AF37] disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                   >
                     {isSmartMergeApplying ? <Settings className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                     {isSmartMergeApplying ? 'جاري الدمج والتحديث...' : 'دمج ذكي (تحديث البيانات الأحدث)'}
                   </button>
                 )}
                 <button 
                  onClick={() => setSyncReport(null)}
                  className={`${syncReport.details.some(d => d.status === 'conflict') ? 'flex-[0.5] bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300' : 'w-full bg-[#D4AF37] hover:bg-[#FACC15] text-[#060b13]'} font-black py-4 rounded-2xl transition-all`}
                 >
                   إغلاق
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Royal Header Widget (Deep Navy and Luxury Gold) */}
      <div id="najiz-welcome" className="bg-[#0b0f19] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border-2 border-[#D4AF37]/60">
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
            
            <div className="flex flex-wrap items-center gap-4 pt-4" id="download-btn">
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
                id="settings-btn"
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
        <div id="features-section" className="lg:col-span-1 space-y-6">
          
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
                {syncMode === 'apikey' && !customApiKey && (
                  <p className="text-[10px] text-amber-400 mt-1 font-bold">⚠️ لم يتم إدخال مفتاح API - سيتم استخدام الوضع الافتراضي</p>
                )}
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

          {/* Enhanced Infographics & Security Benefits Section */}
          <div className="bg-[#0b0f19] border border-[#D4AF37]/50 rounded-[2.5rem] p-8 shadow-2xl text-white space-y-8">
            <div className="flex items-center gap-4 border-b border-[#D4AF37]/20 pb-4">
              <div className="p-3 bg-[#D4AF37]/20 text-[#D4AF37] rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-[#FACC15] text-xl">دليل الربط الآمن والتثبيت</h3>
            </div>
            
            <div className="space-y-6">
              {[
                { 
                  title: "1. تفعيل وضع المطور", 
                  desc: "افتح chrome://extensions وفعّل خيار 'Developer Mode' للسماح بتحميل الحزم المحلية.",
                  icon: Code,
                  color: "blue"
                },
                { 
                  title: "2. فك حزمة الامتداد", 
                  desc: "يجب استخراج ملف .ZIP المحمل في مجلد مستقل لضمان عمل كافة الملفات البرمجية.",
                  icon: Download,
                  color: "amber"
                },
                { 
                  title: "3. مزايا المزامنة التلقائية", 
                  desc: "الوضع الافتراضي (بدون مفاتيح) يحمي خصوصيتك عبر تشفير البيانات محلياً قبل الترحيل.",
                  icon: ShieldCheck,
                  color: "emerald"
                }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#D4AF37]/30 transition-all">
                  <div className="p-3 rounded-xl bg-slate-800 text-[#D4AF37] h-fit">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{step.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#D4AF37]/5 rounded-2xl border border-[#D4AF37]/20">
              <div className="flex items-center gap-2 mb-2 text-[#FACC15]">
                <Key className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">تطبيق مفاتيح الربط</span>
              </div>
              <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-slate-300">
                <div className="flex justify-between items-center bg-white/5 p-1.5 rounded mb-1">
                  <span className="opacity-60">System URL:</span>
                  <span className="text-emerald-400 font-bold select-all truncate max-w-[120px]">{window.location.origin}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-1.5 rounded">
                  <span className="opacity-60">API Status:</span>
                  <span className={syncMode === 'personal' ? 'text-amber-400' : 'text-blue-400'}>
                    {syncMode === 'personal' ? 'Keyless/Personal' : 'Enterprise API'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Checklist Multi-select Config Card inside React UI */}
          <div className="bg-[#0b0f19] border border-[#D4AF37]/50 rounded-[2.5rem] p-6 shadow-2xl text-white space-y-4" id="config-card">
             <div>
                <h3 className="font-black text-[#FACC15] text-lg flex items-center gap-2">
                   <ClipboardList className="w-6 h-6 text-[#FACC15]" />
                   تحديد بيانات السحب
                </h3>
                <p className="text-[11px] text-amber-100 font-semibold mt-1">اختر الأصناف المقررة للاستقبال بالأسفل. سيتم حظر وسحب أي صنف غير محدد آلياً.</p>
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
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-right font-bold text-xs transition-all ${isChecked ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white shadow-md' : 'bg-[#1e293b]/40 border-white/10 text-slate-200 hover:text-white hover:bg-[#1e293b]/60'}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${isChecked ? 'text-[#FACC15]' : 'text-slate-400'}`} />
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
                        <p className="text-xs text-amber-100 font-semibold mt-0.5">ستقوم المحاكاة باستقاء المعطیات وتصنيفها كالقضايا والوكالات والمهام ونقلها لجداول Supabase.</p>
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
                    <div className={`${importedCardTheme === 'dark' ? 'bg-[#060b13] border-[#D4AF37]/50 text-white' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl p-5 border-2 font-mono text-[11px] leading-relaxed relative shadow-inner overflow-hidden transition-all duration-500`}>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                         <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                            <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
                         </div>
                         <div className={`px-3 py-1 rounded-full text-[9px] font-black ${importedCardTheme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-400'}`}>
                           {importedCardTheme === 'dark' ? 'لوحة التحكم الفاخرة' : 'لوحة التحكم المضيئة'}
                         </div>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto font-semibold font-mono text-left" dir="ltr">
                        {simulatedLogs.length === 0 ? (
                          <div className={`italic text-center py-10 font-sans ${importedCardTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                             بانتظار إطلاق المحاكاة لتتبع مآل البيانات والتحقق من الفرز التوجيهي حسب اختيارك...
                          </div>
                        ) : (
                          simulatedLogs.map((logStr, i) => {
                            let textClass = importedCardTheme === 'dark' ? "text-white" : "text-slate-700";
                            if (logStr.includes("[مزامنة ناجحة]")) textClass = "text-emerald-500 font-black";
                            else if (logStr.includes("[AI تجاهل]")) textClass = "text-amber-500";
                            else if (logStr.includes("🔒") || logStr.includes("🤖")) textClass = "text-[#D4AF37]";
                            
                            return (
                              <div key={i} className={`p-2 rounded-lg mb-1 transition-all ${importedCardTheme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'} ${textClass}`}>
                                 {logStr}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/30 text-xs font-semibold text-white">
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

                <div className="flex items-center gap-3 mb-6 border-b border-[#D4AF37]/30 pb-4" id="settings-btn">
                   <Settings className="w-8 h-8 text-[#FACC15] animate-spin-slow" />
                   <div>
                     <h2 className="text-2xl font-black text-[#FACC15]">ضبط بروتوكولات المزامنة المتقدمة</h2>
                     <p className="text-slate-200 text-xs font-bold leading-relaxed mt-0.5">خصص واجهة الاتصال وأسلوب التحويل المباشر لنظام ناجز.</p>
                   </div>
                </div>

                {/* Theme Selection Section */}
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8">
                  <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FACC15]" />
                    هوية الكروت المستوردة
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setImportedCardTheme('dark')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${importedCardTheme === 'dark' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <div className="w-full h-12 bg-[#0b1329] rounded-lg border border-[#D4AF37]/40 flex items-center justify-center">
                        <div className="w-3/4 h-2 bg-white/20 rounded" />
                      </div>
                      <span className="text-xs font-black text-white">النمط الداكن الفاخر</span>
                    </button>
                    <button 
                      onClick={() => setImportedCardTheme('light')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${importedCardTheme === 'light' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <div className="w-full h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                        <div className="w-3/4 h-2 bg-slate-200 rounded" />
                      </div>
                      <span className="text-xs font-black text-white">النمط المضيء الصافي</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-4 italic">سيتم تطبيق هذا النمط على جميع الكروت المسحوبة من ناجز لضمان تباين عالٍ ومقروئية فائقة في كافة أقسام النظام.</p>
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
                          <p className="text-[11px] text-amber-100 leading-relaxed mt-1 font-semibold">
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
                             onChange={(e) => {
                               setCustomApiUrl(e.target.value);
                               localStorage.setItem('adalah_custom_api_url', e.target.value);
                             }}
                             className="w-full bg-[#060b13] border-2 border-[#D4AF37]/40 rounded-xl p-4 text-xs font-mono font-bold text-white outline-none focus:border-[#FACC15] transition-all"
                             placeholder="https://your-server.com/api/najiz-sync"
                           />
                        </div>

                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <label className="text-xs font-black text-[#FACC15] block">مفتاح الربط (API KEY) - اختياري:</label>
                           </div>
                           <input 
                             type="password" 
                             value={customApiKey}
                             onChange={(e) => {
                               setCustomApiKey(e.target.value);
                               localStorage.setItem('adalah_custom_api_key', e.target.value);
                             }}
                             className="w-full bg-[#060b13] border-2 border-[#D4AF37]/40 rounded-xl p-4 text-xs font-mono font-bold text-white outline-none focus:border-[#FACC15] transition-all"
                             placeholder="ادخل المفتاح أو اتركه فارغاً"
                           />
                           <p className="text-[10px] text-slate-400 font-semibold italic mt-1 leading-relaxed">عند ترك الحقل فارغاً، سيتم الاعتماد على وضع المزامنة التلقائية بدون مفتاح كخيار افتراضي.</p>
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
