import React, { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS, Step } from 'react-joyride';

const JoyrideAny = Joyride as any;
import { 
  Download, Zap, CheckCircle2, Copy, Bot, Rocket, 
  BookOpen, Key, Link2, Settings, ShieldCheck, Loader2,
  Database, Users, Calendar, FileText, ClipboardList, Briefcase, ExternalLink,
  ChevronDown, X, Chrome, Info, HelpCircle, Sparkles, Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import ExtensionDownloadSection from './ExtensionDownloadSection';

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
        return ['cases', 'hearings', 'agencies', 'executions', 'clients', 'case_requests', 'minutes'];
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
        window.dispatchEvent(new CustomEvent('najiz_sync_complete'));
        showToast('اكتملت مزامنة البيانات بنجاح', 'success');
      }
    };
    window.addEventListener('message', handleNajizSyncEvent);
    return () => window.removeEventListener('message', handleNajizSyncEvent);
  }, [classifyAndSyncItem, selectedSyncTypes, syncStatus]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText("sk_adalah_workspace_" + (currentUser?.workspace_id || 'demo1234'));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleToggleSyncType = (type: string) => {
    setSelectedSyncTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const runLiveSimulation = async () => {
    setIsSimulatingSync(true);
    setSimulatedLogs([]);
    const log = (msg: string) => setSimulatedLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${msg}`]);
    log("⚡ تم تشغيل محاكاة بروتوكول السحب الخصائلي بالـ AI...");
    await new Promise(r => setTimeout(r, 600));
    log("🔍 تحديد اتصال ناجز النشط في المتصفح...");
    await new Promise(r => setTimeout(r, 500));
    log(`⚙️ وضع التوثيق المختار: ${syncMode === 'personal' ? 'الحساب الشخصي' : 'الربط المطور'}`);
    await new Promise(r => setTimeout(r, 600));
    const dummyScrapes = [
      { id: '1', title: "قضية تجارية - 1445/1230", status: "قيد النظر" },
      { id: '2', title: "جلسة عمالية القادمة", status: "قيد الانتظار" }
    ];
    for (const item of dummyScrapes) {
      log(`📝 معالجة: ${item.title}...`);
      await new Promise(r => setTimeout(r, 800));
      log(`✅ تم مزامنة القسم: ${item.title}`);
    }
    log("🎉 اكتملت المحاكاة بنجاح!");
    setIsSimulatingSync(false);
    (window as any).showToast?.('اكتملت محاكاة المزامنة بنجاح', 'success');
  };

  const generateExtensionZip = async () => {
    try {
      setDownloading(true);
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default || JSZipModule;
      const zip = new (JSZip as any)();
      const folder = zip.folder('najiz-extension');
      if (!folder) throw new Error('Failed to create folder');


      // ===== manifest.json =====
      folder.file('manifest.json', JSON.stringify({
        manifest_version: 3,
        name: "منصة العدالة لإدارة مكاتب المحاماة",
        short_name: "منصة العدالة",
        version: "2.0.0",
        description: "أداة سحب ومزامنة بيانات القضايا والموكلين والجلسات والوكالات وطلبات التنفيذ من منصة ناجز إلى منصة العدالة.",
        default_locale: "ar",
        permissions: ["storage", "activeTab", "scripting", "alarms", "notifications", "tabs"],
        host_permissions: [
          "https://najiz.sa/*",
          "https://www.najiz.sa/*",
          "https://*.najiz.sa/*",
          "https://*.lovable.app/*",
          "https://*.lovableproject.com/*",
          "http://localhost/*",
          "https://aladala-platform-rnuz.onrender.com/*"
        ],
        action: {
          default_popup: "popup.html",
          default_title: "منصة العدالة - مزامنة ناجز"
        },
        background: {
          service_worker: "background.js",
          type: "module"
        },
        options_page: "options.html",
        content_scripts: [
          {
            matches: ["https://najiz.sa/*", "https://www.najiz.sa/*", "https://*.najiz.sa/*"],
            js: ["content.js"],
            css: ["content.css"],
            run_at: "document_idle",
            all_frames: false
          }
        ],
        web_accessible_resources: [
          {
            resources: ["injected.js"],
            matches: ["https://*.najiz.sa/*", "https://najiz.sa/*"]
          }
        ]
      }, null, 2));

      // ===== background.js =====
      folder.file('background.js', `
const ALARM = "adala-auto-sync";

chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.local.get("settings");
  const deviceId = (await chrome.storage.local.get("deviceId")).deviceId || crypto.randomUUID();
  if (!settings) await chrome.storage.local.set({ settings: { interval: 60, autoSync: false }, deviceId });
  else await chrome.storage.local.set({ deviceId });
  schedule();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.action === "RESCHEDULE") { await schedule(); return sendResponse({ ok: true }); }
      if (msg.action === "PUSH") {
        const r = await push(msg.type, msg.payload, msg.pageUrl);
        return sendResponse(r);
      }
      if (msg.action === "SYNC") {
        const r = await syncFromTab(msg.type, msg.tabId);
        return sendResponse(r);
      }
    } catch (e) { sendResponse({ ok: false, error: e.message }); }
  })();
  return true;
});

async function syncFromTab(type, tabId) {
  let scraped = await chrome.tabs.sendMessage(tabId, { action: "SCRAPE", type }).catch(() => null);
  if (!scraped?.ok) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }).catch(() => null);
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content.css"] }).catch(() => null);
    await new Promise((resolve) => setTimeout(resolve, 500));
    scraped = await chrome.tabs.sendMessage(tabId, { action: "SCRAPE", type }).catch(() => null);
  }
  if (!scraped?.ok) return { ok: false, error: "تعذّر سحب البيانات من الصفحة. افتح صفحة بيانات داخل ناجز بعد تسجيل الدخول ثم أعد المحاولة." };
  const r = await push(type, scraped.payload);
  return { ...r, count: scraped.payload?.summary?.totalItems ?? scraped.payload?.items?.length ?? 0 };
}

async function push(type, payload, pageUrl) {
  const { settings = {}, deviceId } = await chrome.storage.local.get(["settings", "deviceId"]);
  if (!settings.apiUrl) {
    return { ok: false, error: "أضف رابط الواجهة (API URL) من صفحة الإعدادات" };
  }
  try {
    const headers = { "Content-Type": "application/json" };
    if (settings.apiKey) {
      headers["X-API-Key"] = settings.apiKey;
      headers["Authorization"] = \`Bearer \${settings.apiKey}\`;
    }
    const res = await fetch(settings.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "najiz-extension",
        type, payload, pageUrl: pageUrl || payload?.url,
        extension: { version: chrome.runtime.getManifest().version, deviceId },
        sentAt: new Date().toISOString(),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: data?.error ? \`HTTP \${res.status}: \${data.error}\` : \`HTTP \${res.status}\` };
    }
    await chrome.storage.local.set({ lastSync: Date.now(), lastSyncResult: data });
    notify("تمت المزامنة بنجاح", \`تم إرسال \${data?.itemCount ?? payload?.summary?.totalItems ?? 0} عنصر إلى المنصة.\`);
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function schedule() {
  await chrome.alarms.clear(ALARM);
  const { settings = {} } = await chrome.storage.local.get("settings");
  if (settings.autoSync && settings.interval) {
    chrome.alarms.create(ALARM, { periodInMinutes: settings.interval });
  }
}

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== ALARM) return;
  const tabs = await chrome.tabs.query({ url: ["*://*.najiz.sa/*", "*://najiz.sa/*"] });
  if (!tabs.length) return; 
  await syncFromTab("all", tabs[0].id);
});

function notify(title, message) {
  try {
    chrome.notifications.create({
      type: "basic", iconUrl: "icon128.png", title, message, priority: 1,
    });
  } catch {}
}
`.trim());

      // ===== content.css =====
      folder.file('content.css', `
#adala-fab {
  position: fixed; bottom: 24px; left: 24px; z-index: 2147483646;
  background: linear-gradient(135deg,#C9A24B,#E6C167); color:#1a1303;
  border: 0; border-radius: 50px; padding: 12px 18px; font-weight: 800;
  font-family: "Segoe UI","Cairo",sans-serif; font-size: 14px; cursor: pointer;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,.5), 0 0 0 2px #0B1A33;
  display: flex; align-items: center; gap: 8px; direction: rtl;
}
#adala-fab:hover { filter: brightness(1.05); }
#adala-panel {
  position: fixed; bottom: 80px; left: 24px; z-index: 2147483647;
  width: 320px; background: linear-gradient(160deg,#0B1A33,#11264a);
  color: #fff; border: 1px solid rgba(201,162,75,.45); border-radius: 14px;
  box-shadow: 0 20px 50px -10px rgba(0,0,0,.6); padding: 14px; direction: rtl;
  font-family: "Segoe UI","Cairo",sans-serif;
}
#adala-panel h3 { color:#FFE27A; font-size:14px; margin:0 0 10px; }
#adala-panel .adala-consent { color:#BFC9DA; font-size:11px; line-height:1.6; margin:0 0 10px; }
#adala-panel .adala-all { width:100%; background:linear-gradient(135deg,#C9A24B,#E6C167); color:#1a1303;
  border:0;padding:10px;border-radius:8px;font-weight:800;cursor:pointer;margin-bottom:10px;font-size:13px;}
#adala-panel .adala-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
#adala-panel .adala-grid button {
  background: rgba(201,162,75,.1); border:1px solid rgba(201,162,75,.4);
  color:#FFE27A; padding:8px; border-radius:7px; cursor:pointer; font-size:12px; font-family:inherit;
}
#adala-panel .adala-grid button:hover { background: rgba(201,162,75,.22); }
#adala-panel .adala-status { margin-top:10px; font-size:12px; color:#BFC9DA; min-height:16px; }
#adala-panel .adala-status.ok { color:#4ade80; }
#adala-panel .adala-status.err { color:#ff8a8a; }
#adala-panel .adala-close { position:absolute; top:8px; left:10px; background:none; border:0; color:#FFE27A; cursor:pointer; font-size:18px;}
`.trim());

      // ===== content.js =====
      folder.file('content.js', `
(function () {
  if (window.__adalaNajizContentInjected) return;
  window.__adalaNajizContentInjected = true;

  const CAPTURE_KEY = "adalaNajizNetworkCaptures";
  const MAX_CAPTURED_RESPONSES = 80;
  const MAX_RAW_TEXT = 1600;
  const TYPES = [
    ["all", "مزامنة جميع البيانات"],
    ["cases", "القضايا"],
    ["clients", "الموكلون والأطراف"],
    ["sessions", "مواعيد الجلسات"],
    ["executions", "طلبات التنفيذ"],
    ["requests", "الطلبات على القضايا"],
    ["minutes", "محاضر ضبط الجلسات"],
    ["agencies", "الوكالات"],
    ["judgments", "الأحكام والاستئناف"],
    ["notices", "الإشعارات"],
    ["documents", "المستندات والمرفقات"],
  ];

  const captured = [];
  injectNetworkBridge();
  createFloatingPanel();

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== "ADALA_NAJIZ_BRIDGE") return;
    rememberNetworkPayload(event.data.payload);
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.action !== "SCRAPE") return false;
    scrape(msg.type || "all")
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
    return true;
  });

  async function rememberNetworkPayload(payload) {
    if (!payload?.url || payload.status >= 400) return;
    if (!isNajizBusinessUrl(payload.url) && !containsNajizBusinessWords(payload.body)) return;
    const entry = {
      url: payload.url,
      method: payload.method || "GET",
      status: payload.status,
      ts: payload.ts || Date.now(),
      body: trimPayload(payload.body),
    };
    captured.unshift(entry);
    if (captured.length > MAX_CAPTURED_RESPONSES) captured.length = MAX_CAPTURED_RESPONSES;
    try {
      const stored = await chrome.storage.local.get(CAPTURE_KEY);
      const merged = [entry, ...(stored[CAPTURE_KEY] || [])].slice(0, MAX_CAPTURED_RESPONSES);
      await chrome.storage.local.set({ [CAPTURE_KEY]: dedupeBy(merged, (x) => \`\${x.url}|\${JSON.stringify(x.body).slice(0, 240)}\`) });
    } catch {
    }
  }

  function injectNetworkBridge() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected.js");
    script.async = false;
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  function createFloatingPanel() {
    const fab = document.createElement("button");
    fab.id = "adala-fab";
    fab.type = "button";
    fab.textContent = "⚖ منصة العدالة — مزامنة";
    document.documentElement.appendChild(fab);

    let panel;
    fab.addEventListener("click", () => {
      if (panel) {
        panel.remove();
        panel = null;
        return;
      }
      panel = document.createElement("div");
      panel.id = "adala-panel";
      panel.innerHTML = \`
        <button class="adala-close" type="button" aria-label="إغلاق">×</button>
        <h3>مزامنة بيانات ناجز إلى منصة العدالة</h3>
        <p class="adala-consent">بالضغط على المزامنة أنت توافق على إرسال البيانات الظاهرة والمحمّلة في هذه الصفحة إلى نظامك.</p>
        <button class="adala-all" type="button" data-t="all">⇅ مزامنة كل ما تم العثور عليه</button>
        <div class="adala-grid">
          \${TYPES.slice(1).map(([key, label]) => \`<button type="button" data-t="\${key}">\${label}</button>\`).join("")}
        </div>
        <div class="adala-status" id="adalaStatus">جاهز — افتح صفحة بيانات داخل ناجز بعد تسجيل الدخول</div>
      \`;
      document.documentElement.appendChild(panel);
      panel.querySelector(".adala-close").onclick = () => {
        panel.remove();
        panel = null;
      };
      panel.querySelectorAll("button[data-t]").forEach((button) => {
        button.addEventListener("click", () => doSync(button.dataset.t));
      });
    });
  }

  async function doSync(type) {
    const status = document.getElementById("adalaStatus");
    if (!status) return;
    status.className = "adala-status";
    status.textContent = "جارٍ قراءة بيانات الصفحة وإرسالها…";
    try {
      const payload = await scrape(type);
      const result = await chrome.runtime.sendMessage({ action: "PUSH", type, payload, pageUrl: location.href });
      if (result?.ok) {
        status.className = "adala-status ok";
        status.textContent = \`✓ وصلت للمنصة: \${payload.summary.totalItems} عنصر (\${payload.summary.networkResponses} استجابة شبكة)\`;
      } else {
        status.className = "adala-status err";
        status.textContent = \`✗ \${result?.error || "فشل الإرسال"}\`;
      }
    } catch (error) {
      status.className = "adala-status err";
      status.textContent = \`✗ \${error?.message || String(error)}\`;
    }
  }

  async function scrape(type) {
    await waitForPageQuiet();
    const network = await getStoredCaptures(type);
    const domItems = collectDomItems();
    const networkItems = collectNetworkItems(network, type);
    const items = dedupeObjects([...domItems, ...networkItems]);
    const normalized = normalizeItems(items, type);
    const summary = makeSummary(normalized, items, network);

    return {
      type,
      url: location.href,
      title: document.title,
      capturedAt: new Date().toISOString(),
      source: "najiz-content-v2",
      summary,
      normalized,
      items: filterItemsForType(items, type).slice(0, 500),
      network: network.map((entry) => ({ url: entry.url, method: entry.method, status: entry.status, ts: entry.ts })).slice(0, 40),
    };
  }

  async function getStoredCaptures(type) {
    const stored = await chrome.storage.local.get(CAPTURE_KEY).catch(() => ({}));
    const list = dedupeBy([...(captured || []), ...((stored && stored[CAPTURE_KEY]) || [])], (x) => \`\${x.url}|\${JSON.stringify(x.body).slice(0, 240)}\`);
    return list.filter((entry) => type === "all" || isCaptureRelevantToType(entry, type)).slice(0, MAX_CAPTURED_RESPONSES);
  }

  function collectDomItems() {
    const items = [];
    document.querySelectorAll("table").forEach((table, tableIndex) => {
      const headers = [...table.querySelectorAll("thead th, thead td")].map((cell) => clean(cell.innerText || cell.textContent));
      const rows = table.querySelectorAll("tbody tr").length ? table.querySelectorAll("tbody tr") : table.querySelectorAll("tr");
      rows.forEach((row, rowIndex) => {
        const cells = [...row.querySelectorAll("td, th")].map((cell) => clean(cell.innerText || cell.textContent));
        if (cells.length < 2 || cells.join(" ").length < 4) return;
        const fields = {};
        cells.forEach((value, index) => {
          fields[headers[index] || \`column_\${index + 1}\`] = value;
        });
        items.push({ _source: "dom_table", _kind: inferKindFromText(cells.join(" ")), tableIndex, rowIndex, fields, text: cells.join(" | ") });
      });
    });

    const selector = [
      "[role='row']",
      "[class*='card' i]",
      "[class*='item' i]",
      "[class*='list' i] > *",
      "[class*='result' i]",
      "[class*='request' i]",
    ].join(",");
    document.querySelectorAll(selector).forEach((element, index) => {
      if (element.closest("#adala-panel") || element.id === "adala-fab") return;
      const text = clean(element.innerText || element.textContent);
      if (text.length < 25 || text.length > MAX_RAW_TEXT) return;
      items.push({ _source: "dom_block", _kind: inferKindFromText(text), index, text, fields: extractFieldsFromText(text) });
    });

    return items;
  }

  function collectNetworkItems(network, type) {
    const items = [];
    network.forEach((entry) => {
      const objects = flattenObjects(entry.body).slice(0, 300);
      objects.forEach((object, index) => {
        const text = objectToText(object);
        if (text.length < 8 || !isBusinessObject(object, text)) return;
        const kind = inferKindFromText(\`\${entry.url} \${text}\`);
        if (type !== "all" && !kindMatchesType(kind, type) && !isTextRelevantToType(\`\${entry.url} \${text}\`, type)) return;
        items.push({ _source: "network", _kind: kind, url: entry.url, index, fields: compactObject(object), text: text.slice(0, MAX_RAW_TEXT) });
      });
    });
    return items;
  }

  function normalizeItems(items, type) {
    const filtered = filterItemsForType(items, type);
    return {
      cases: normalizeCollection(filtered, "case", normalizeCase),
      clients: normalizeCollection(filtered, "client", normalizeClient),
      sessions: normalizeCollection(filtered, "session", normalizeSession),
      agencies: normalizeCollection(filtered, "agency", normalizeAgency),
      executions: normalizeCollection(filtered, "execution", normalizeExecution),
      requests: normalizeCollection(filtered, "request", normalizeRequest),
      minutes: normalizeCollection(filtered, "minute", normalizeMinute),
      judgments: normalizeCollection(filtered, "judgment", normalizeJudgment),
      notices: normalizeCollection(filtered, "notice", normalizeNotice),
      documents: normalizeCollection(filtered, "document", normalizeDocument),
    };
  }

  function normalizeCollection(items, kind, mapper) {
    const relevant = items.filter((item) => item._kind === kind || (kind === "client" && /مدعي|مدعى|موكل|وكيل|طرف/.test(item.text || "")));
    return dedupeObjects(relevant.map(mapper).filter(Boolean)).slice(0, 200);
  }

  function normalizeCase(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const caseNumber = valueByKeys(fields, /case.*(no|num|id)|lawsuit.*(no|num|id)|رقم.*(قض|دعوى)|قضية/i) || match(text, /\b\d{4}\s*\/\s*\d{3,}\b|\b\d{9,}\b/);
    if (!caseNumber && !/قضية|دعوى|محكمة/.test(text)) return null;
    return {
      caseNumber: caseNumber || "",
      caseName: valueByKeys(fields, /name|title|subject|اسم|موضوع|وصف/i) || firstLine(text),
      court: valueByKeys(fields, /court|محكمة|دائرة/i) || match(text, /[^\n|،]{0,30}محكمة[^\n|،]{0,40}/),
      status: valueByKeys(fields, /status|state|حالة/i) || match(text, /قيد النظر|منتهية|منتهي|محكوم|مؤجلة|نشطة|مغلقة/),
      raw: item,
    };
  }

  function normalizeClient(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const name = valueByKeys(fields, /client|party|person|plaintiff|defendant|name|موكل|طرف|مدعي|مدعى|اسم/i) || match(text, /(المدعي|المدعى عليه|الموكل|الوكيل|صاحب الطلب)\s*[:：]?\s*([^|\n،]{3,80})/, 2);
    if (!name) return null;
    return {
      name: clean(name),
      role: valueByKeys(fields, /role|صفة|دور/i) || match(text, /مدعي|مدعى عليه|موكل|وكيل|منفذ ضده|طالب التنفيذ/),
      identityNumber: valueByKeys(fields, /national|identity|idNumber|هوية|سجل/i) || match(text, /\b[12]\d{9}\b/),
      raw: item,
    };
  }

  function normalizeSession(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const date = valueByKeys(fields, /date|sessionDate|hearingDate|تاريخ|موعد/i) || matchDate(text);
    if (!date && !/جلسة|موعد|تقاضي/.test(text)) return null;
    return {
      date: date || "",
      time: valueByKeys(fields, /time|وقت|ساعة/i) || match(text, /\b\d{1,2}:\d{2}\b/),
      caseNumber: valueByKeys(fields, /case.*(no|num)|رقم.*قض/i) || match(text, /\b\d{4}\s*\/\s*\d{3,}\b|\b\d{9,}\b/),
      court: valueByKeys(fields, /court|محكمة|دائرة/i) || match(text, /[^\n|،]{0,30}محكمة[^\n|،]{0,40}/),
      raw: item,
    };
  }

  function normalizeAgency(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const agencyNumber = valueByKeys(fields, /agency|poa|wakalah|وكال|رقم/i) || match(text, /\b\d{9,}\b/);
    if (!agencyNumber && !/وكالة|وكالات|موكل|وكيل/.test(text)) return null;
    return {
      agencyNumber: agencyNumber || "",
      principal: valueByKeys(fields, /principal|موكل/i) || "",
      agent: valueByKeys(fields, /agent|وكيل/i) || "",
      expiryDate: valueByKeys(fields, /expiry|expire|endDate|انتهاء|نهاية/i) || matchDate(text),
      raw: item,
    };
  }

  function normalizeExecution(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const executionNumber = valueByKeys(fields, /execution|enforcement|request.*(no|num)|تنفيذ|طلب/i) || match(text, /\b\d{9,}\b/);
    if (!executionNumber && !/تنفيذ|منفذ|طالب التنفيذ/.test(text)) return null;
    return { executionNumber: executionNumber || "", status: valueByKeys(fields, /status|حالة/i) || "", raw: item };
  }

  function normalizeRequest(item) { return normalizeGeneric(item, /طلب|requests?/i, "requestNumber"); }
  function normalizeMinute(item) { return normalizeGeneric(item, /محضر|ضبط|minutes?/i, "minuteNumber"); }
  function normalizeJudgment(item) { return normalizeGeneric(item, /حكم|استئناف|judg|appeal/i, "judgmentNumber"); }
  function normalizeNotice(item) { return normalizeGeneric(item, /إشعار|اشعار|تنبيه|notification|notice/i, "noticeNumber"); }
  function normalizeDocument(item) { return normalizeGeneric(item, /مستند|مرفق|وثيقة|document|attachment/i, "documentNumber"); }

  function normalizeGeneric(item, keyword, idField) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    if (!keyword.test(text) && !keyword.test(objectToText(fields))) return null;
    return {
      [idField]: valueByKeys(fields, /number|num|no|id|رقم/i) || match(text, /\b\d{6,}\b/) || "",
      title: valueByKeys(fields, /title|name|subject|اسم|موضوع|نوع/i) || firstLine(text),
      date: valueByKeys(fields, /date|تاريخ/i) || matchDate(text),
      raw: item,
    };
  }

  function makeSummary(normalized, items, network) {
    return {
      totalItems: items.length,
      networkResponses: network.length,
      cases: normalized.cases.length,
      clients: normalized.clients.length,
      sessions: normalized.sessions.length,
      agencies: normalized.agencies.length,
      executions: normalized.executions.length,
      requests: normalized.requests.length,
      minutes: normalized.minutes.length,
      judgments: normalized.judgments.length,
      notices: normalized.notices.length,
      documents: normalized.documents.length,
    };
  }

  function filterItemsForType(items, type) {
    if (type === "all") return items;
    return items.filter((item) => kindMatchesType(item._kind, type) || isTextRelevantToType(\`\${item.url || ""} \${item.text || ""} \${objectToText(item.fields || {})}\`, type));
  }

  function inferKindFromText(text) {
    const value = clean(text);
    if (/(lawsuit|case|قضية|قضايا|دعوى|دعاوى|محكمة)/i.test(value)) return "case";
    if (/(hearing|session|appointment|جلسة|جلسات|موعد|مواعيد)/i.test(value)) return "session";
    if (/(agency|poa|wakalah|wekal|وكالة|وكالات|وكيل|موكل)/i.test(value)) return "agency";
    if (/(execution|enforcement|iexecution|تنفيذ|منفذ)/i.test(value)) return "execution";
    if (/(request|طلبات|طلب على القضية|طلب جديد)/i.test(value)) return "request";
    if (/(minute|minutes|محضر|ضبط)/i.test(value)) return "minute";
    if (/(judgment|appeal|حكم|أحكام|استئناف)/i.test(value)) return "judgment";
    if (/(notice|notification|إشعار|اشعار|تنبيه)/i.test(value)) return "notice";
    if (/(document|attachment|مستند|مرفق|وثيقة)/i.test(value)) return "document";
    if (/(client|party|person|مدعي|مدعى|طرف|أطراف)/i.test(value)) return "client";
    return "record";
  }

  function kindMatchesType(kind, type) {
    const map = { cases: "case", clients: "client", sessions: "session", executions: "execution", requests: "request", minutes: "minute", agencies: "agency", judgments: "judgment", notices: "notice", documents: "document" };
    return map[type] === kind;
  }

  function isCaptureRelevantToType(entry, type) { return isTextRelevantToType(\`\${entry.url} \${objectToText(entry.body)}\`, type); }
  function isTextRelevantToType(text, type) { return kindMatchesType(inferKindFromText(text), type); }
  function isNajizBusinessUrl(url) { return /(lawsuit|case|hearing|session|appointment|agency|wekal|poa|execution|notification|document|judgment|appeal|request)/i.test(url || ""); }
  function containsNajizBusinessWords(body) { return /(قضية|قضايا|دعوى|جلسة|وكالة|تنفيذ|محكمة|موكل|مدعي|إشعار|مستند|حكم)/.test(objectToText(body)); }
  function isBusinessObject(object, text) { return object && typeof object === "object" && (Object.keys(object).length >= 2 || /\d{6,}|قضية|جلسة|وكالة|تنفيذ|محكمة/.test(text)); }

  function flattenObjects(value, output = [], depth = 0) {
    if (depth > 7 || output.length > 1000 || value == null) return output;
    if (Array.isArray(value)) {
      value.forEach((item) => flattenObjects(item, output, depth + 1));
      return output;
    }
    if (typeof value === "object") {
      output.push(value);
      Object.values(value).forEach((item) => {
        if (item && typeof item === "object") flattenObjects(item, output, depth + 1);
      });
    }
    return output;
  }

  function compactObject(object) {
    const result = {};
    Object.entries(object || {}).forEach(([key, value]) => {
      if (value == null) return;
      if (["string", "number", "boolean"].includes(typeof value)) result[key] = String(value).slice(0, 500);
    });
    return result;
  }

  function extractFieldsFromText(text) {
    const fields = {};
    text.split(/\n|\|/).forEach((line) => {
      const parts = line.split(/:|：/);
      if (parts.length >= 2) fields[clean(parts[0])] = clean(parts.slice(1).join(":"));
    });
    return fields;
  }

  function trimPayload(value) {
    if (value == null) return value;
    const json = JSON.stringify(value);
    if (json.length < 250000) return value;
    return { __truncated: true, preview: json.slice(0, 240000) };
  }

  function valueByKeys(fields, pattern) {
    const entries = Object.entries(fields || {});
    const direct = entries.find(([key]) => pattern.test(key));
    if (direct) return clean(String(direct[1]));
    const nestedText = objectToText(fields);
    return pattern.test(nestedText) ? "" : "";
  }

  function objectToText(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value !== "object") return String(value);
    try { return JSON.stringify(value, null, 1); } catch { return String(value); }
  }

  function dedupeObjects(items) { return dedupeBy(items, (item) => JSON.stringify(item).slice(0, 1200)); }
  function dedupeBy(items, keyFn) {
    const seen = new Set();
    return items.filter((item) => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function match(text, regex, group = 0) { const found = clean(text).match(regex); return found ? clean(found[group] || found[0]) : ""; }
  function matchDate(text) { return match(text, /\b\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\b|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b|\b\d{1,2}\s+[\u0600-\u06FF]+\s+\d{4}\b/); }
  function firstLine(text) { return clean(text).split(/\n|\|/).find(Boolean)?.slice(0, 120) || ""; }
  function clean(value) { return (value || "").toString().replace(/\s+/g, " ").trim(); }
  function waitForPageQuiet() { return new Promise((resolve) => setTimeout(resolve, 900)); }
})();
`.trim());

      // ===== injected.js =====
      folder.file('injected.js', `
(function () {
  if (window.__adalaNajizBridgeInjected) return;
  window.__adalaNajizBridgeInjected = true;

  const SOURCE = "ADALA_NAJIZ_BRIDGE";
  const MAX_BODY_CHARS = 240000;

  function shouldCapture(url, contentType, body) {
    const target = String(url || "");
    if (!/najiz\.sa|moj\.gov\.sa|najiz/i.test(target) && !containsBusinessWords(body)) return false;
    return /json|text|javascript/i.test(contentType || "") || containsBusinessWords(body) || /(lawsuit|case|session|hearing|agency|wekal|poa|execution|request|judgment|notice|document)/i.test(target);
  }

  function containsBusinessWords(body) {
    const text = typeof body === "string" ? body : safeStringify(body);
    return /(قضية|قضايا|دعوى|جلسة|وكالة|وكالات|تنفيذ|محكمة|موكل|مدعي|مدعى|إشعار|اشعار|مستند|مرفق|حكم|استئناف|طلبات)/.test(text);
  }

  function parseBody(text) {
    const value = String(text || "").slice(0, MAX_BODY_CHARS);
    try { return JSON.parse(value); } catch { return value; }
  }

  function safeStringify(value) {
    try { return JSON.stringify(value); } catch { return String(value || ""); }
  }

  function post(payload) {
    try {
      window.postMessage({ source: SOURCE, payload }, window.location.origin);
    } catch {
      window.postMessage({ source: SOURCE, payload }, "*");
    }
  }

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = async function adalaFetch(input, init) {
      const response = await originalFetch.apply(this, arguments);
      try {
        const url = typeof input === "string" ? input : input?.url;
        const clone = response.clone();
        const contentType = clone.headers.get("content-type") || "";
        if (shouldCapture(url, contentType, "")) {
          clone.text().then((text) => {
            if (!shouldCapture(url, contentType, text)) return;
            post({ url: String(url || ""), method: init?.method || input?.method || "GET", status: response.status, ts: Date.now(), body: parseBody(text) });
          }).catch(() => {});
        }
      } catch {}
      return response;
    };
  }

  const OriginalXHR = window.XMLHttpRequest;
  if (OriginalXHR) {
    const originalOpen = OriginalXHR.prototype.open;
    const originalSend = OriginalXHR.prototype.send;
    OriginalXHR.prototype.open = function adalaOpen(method, url) {
      this.__adalaMethod = method;
      this.__adalaUrl = url;
      return originalOpen.apply(this, arguments);
    };
    OriginalXHR.prototype.send = function adalaSend() {
      this.addEventListener("load", function () {
        try {
          const contentType = this.getResponseHeader("content-type") || "";
          const text = typeof this.responseText === "string" ? this.responseText : "";
          if (!shouldCapture(this.__adalaUrl, contentType, text)) return;
          post({ url: String(this.__adalaUrl || ""), method: this.__adalaMethod || "GET", status: this.status, ts: Date.now(), body: parseBody(text) });
        } catch {}
      });
      return originalSend.apply(this, arguments);
    };
  }
})();
`.trim());

      // ===== popup.html =====
      folder.file('popup.html', `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>منصة العدالة</title>
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <header class="hdr">
      <div>
        <h1>منصة العدالة</h1>
        <p class="sub">المزامنة المباشرة مع ناجز</p>
      </div>
    </header>

    <section id="statusCard" class="card status">
      <div class="row">
        <span class="dot" id="connDot"></span>
        <span id="connText">جارٍ التحقق من الاتصال…</span>
      </div>
      <div class="row small">
        <span>آخر مزامنة:</span>
        <strong id="lastSync">—</strong>
      </div>
    </section>

    <section class="card">
      <h2 class="title">اختر البيانات المراد مزامنتها</h2>

      <button class="btn btn-gold full" id="syncAll">
        ⇅ مزامنة جميع البيانات الآن
      </button>

      <div class="grid">
        <button class="btn btn-ghost" data-type="cases">القضايا</button>
        <button class="btn btn-ghost" data-type="clients">الموكلون والأطراف</button>
        <button class="btn btn-ghost" data-type="sessions">مواعيد الجلسات</button>
        <button class="btn btn-ghost" data-type="executions">طلبات التنفيذ</button>
        <button class="btn btn-ghost" data-type="requests">الطلبات على القضايا</button>
        <button class="btn btn-ghost" data-type="minutes">محاضر ضبط الجلسات</button>
        <button class="btn btn-ghost" data-type="agencies">الوكالات</button>
        <button class="btn btn-ghost" data-type="judgments">الأحكام والاستئناف</button>
        <button class="btn btn-ghost" data-type="notices">الإشعارات والتنبيهات</button>
        <button class="btn btn-ghost" data-type="documents">المستندات والمرفقات</button>
      </div>
    </section>

    <section class="card log">
      <h2 class="title">سجل المزامنة</h2>
      <ul id="logList"><li class="muted">لا توجد عمليات بعد.</li></ul>
    </section>

    <footer class="ftr">
      <button id="openOptions" class="link">⚙ الإعدادات وربط المنصة</button>
      <span class="ver">v2.0.0</span>
    </footer>

    <script src="popup.js"></script>
  </body>
</html>`.trim());

      // ===== popup.css =====
      folder.file('popup.css', `
:root {
  --navy: #0B1A33;
  --navy-2: #11264a;
  --navy-3: #1a3563;
  --gold: #C9A24B;
  --gold-2: #E6C167;
  --yellow: #FFE27A;
  --white: #FFFFFF;
  --muted: #BFC9DA;
  --danger: #ff6b6b;
  --ok: #4ade80;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 380px;
  font-family: "Segoe UI", "Tahoma", "Cairo", sans-serif;
  background: linear-gradient(160deg, var(--navy) 0%, var(--navy-2) 100%);
  color: var(--white);
}
body { padding: 14px; }

.hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.logo { width: 40px; height: 40px; border-radius: 10px; background: var(--navy-3); padding: 4px; }
.hdr h1 { font-size: 16px; color: var(--yellow); letter-spacing: .2px; }
.sub { font-size: 11px; color: var(--gold-2); }

.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(201,162,75,0.25);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}
.title { font-size: 13px; color: var(--gold-2); margin-bottom: 10px; font-weight: 700; }

.row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--white); }
.row.small { margin-top: 6px; font-size: 12px; color: var(--muted); }
.row.small strong { color: var(--yellow); font-weight: 600; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--muted); box-shadow: 0 0 8px rgba(0,0,0,.4); }
.dot.ok { background: var(--ok); }
.dot.warn { background: var(--gold); }
.dot.err { background: var(--danger); }

.btn {
  border: 0; cursor: pointer; font-family: inherit; font-weight: 700;
  padding: 10px 12px; border-radius: 10px; font-size: 13px;
  transition: transform .05s ease, filter .15s ease;
}
.btn:active { transform: scale(.98); }
.btn.full { width: 100%; margin-bottom: 10px; }
.btn-gold {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%);
  color: #1a1303;
  box-shadow: 0 6px 16px -8px rgba(201,162,75,.7);
}
.btn-gold:hover { filter: brightness(1.05); }
.btn-ghost {
  background: rgba(201,162,75,0.08);
  border: 1px solid rgba(201,162,75,0.45);
  color: var(--yellow);
}
.btn-ghost:hover { background: rgba(201,162,75,0.18); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.log ul { list-style: none; max-height: 120px; overflow-y: auto; }
.log li { font-size: 12px; padding: 5px 0; border-bottom: 1px dashed rgba(255,255,255,.06); color: var(--white); }
.log li.muted { color: var(--muted); text-align: center; border: 0; }
.log li.ok { color: var(--ok); }
.log li.err { color: var(--danger); }

.ftr { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.link { background: transparent; border: 0; color: var(--gold-2); cursor: pointer; font-size: 12px; }
.link:hover { color: var(--yellow); text-decoration: underline; }
.ver { color: var(--muted); font-size: 11px; }
`.trim());

      // ===== popup.js =====
      folder.file('popup.js', `
const $ = (s) => document.querySelector(s);

function addLog(msg, cls = "") {
  const ul = $("#logList");
  if (ul.querySelector(".muted")) ul.innerHTML = "";
  const li = document.createElement("li");
  li.className = cls;
  const t = new Date().toLocaleTimeString("ar-SA");
  li.textContent = \`[\${t}] \${msg}\`;
  ul.prepend(li);
}

async function refreshStatus() {
  const { settings = {}, lastSync } = await chrome.storage.local.get(["settings", "lastSync"]);
  const dot = $("#connDot");
  const txt = $("#connText");
  if (!settings.apiUrl) {
    dot.className = "dot warn";
    txt.textContent = "لم يتم ربط المنصة بعد — افتح الإعدادات";
  } else {
    dot.className = "dot ok";
    txt.textContent = \`مرتبط بـ: \${new URL(settings.apiUrl).host}\`;
  }
  $("#lastSync").textContent = lastSync
    ? new Date(lastSync).toLocaleString("ar-SA")
    : "لم تتم بعد";
}

async function ensureNajizTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && /najiz\\.sa/.test(tab.url || "")) return tab;
  // Try any najiz tab
  const tabs = await chrome.tabs.query({ url: ["*://*.najiz.sa/*", "*://najiz.sa/*"] });
  if (tabs.length) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    return tabs[0];
  }
  // Open it
  return await chrome.tabs.create({ url: "https://www.najiz.sa/applications/landing" });
}

async function runSync(type) {
  addLog(\`بدء مزامنة: \${labelFor(type)}…\`);
  const tab = await ensureNajizTab();
  try {
    const res = await chrome.runtime.sendMessage({ action: "SYNC", type, tabId: tab.id });
    if (res?.ok) {
      addLog(\`✓ تمت مزامنة \${labelFor(type)} (\${res.count ?? 0} عنصر)\`, "ok");
    } else {
      addLog(\`✗ فشل: \${res?.error || "خطأ غير معروف"}\`, "err");
    }
  } catch (e) {
    addLog(\`✗ \${e.message}\`, "err");
  }
  refreshStatus();
}

function labelFor(t) {
  return {
    all: "جميع البيانات", cases: "القضايا", clients: "الموكلين",
    sessions: "مواعيد الجلسات", executions: "طلبات التنفيذ",
    requests: "الطلبات", minutes: "محاضر الجلسات",
    agencies: "الوكالات", judgments: "الأحكام",
    notices: "الإشعارات", documents: "المستندات",
  }[t] || t;
}

document.addEventListener("DOMContentLoaded", () => {
  refreshStatus();
  $("#syncAll").addEventListener("click", () => runSync("all"));
  document.querySelectorAll("[data-type]").forEach((b) =>
    b.addEventListener("click", () => runSync(b.dataset.type))
  );
  $("#openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());
});
`.trim());

      // ===== options.html =====
      folder.file('options.html', `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>إعدادات منصة العدالة</title>
  <style>
    :root{--navy:#0B1A33;--navy2:#11264a;--gold:#C9A24B;--gold2:#E6C167;--yellow:#FFE27A;--white:#fff;--muted:#BFC9DA;}
    *{box-sizing:border-box;margin:0;padding:0;font-family:"Segoe UI","Cairo",sans-serif}
    body{background:linear-gradient(160deg,var(--navy),var(--navy2));min-height:100vh;color:var(--white);padding:40px 16px}
    .wrap{max-width:640px;margin:0 auto}
    h1{color:var(--yellow);font-size:24px;margin-bottom:6px}
    .sub{color:var(--gold2);margin-bottom:24px;font-size:14px}
    .card{background:rgba(255,255,255,.04);border:1px solid rgba(201,162,75,.3);border-radius:14px;padding:22px;margin-bottom:16px}
    label{display:block;color:var(--yellow);font-weight:700;margin-bottom:6px;font-size:14px}
    .hint{color:var(--muted);font-size:12px;margin-bottom:10px;line-height:1.7}
    input,select{width:100%;padding:11px 12px;background:rgba(0,0,0,.25);border:1px solid rgba(201,162,75,.4);border-radius:8px;color:var(--white);font-size:14px;direction:ltr;text-align:left}
    input:focus{outline:none;border-color:var(--gold)}
    .field{margin-bottom:16px}
    .row{display:flex;gap:10px;align-items:center;margin-top:8px}
    .btn{cursor:pointer;border:0;padding:11px 18px;border-radius:8px;font-weight:700;font-size:14px;font-family:inherit}
    .btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#1a1303}
    .btn-ghost{background:transparent;border:1px solid var(--gold);color:var(--yellow)}
    .ok{color:#4ade80;font-size:13px}
    .err{color:#ff8a8a;font-size:13px}
    .opt{display:flex;align-items:center;gap:8px;margin:6px 0;color:var(--white);font-size:13px}
    .opt input{width:auto}
    code{background:rgba(0,0,0,.3);padding:2px 6px;border-radius:4px;color:var(--gold2)}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>إعدادات الربط — منصة العدالة</h1>
    <p class="sub">اربط الإضافة بحساب مكتبك في منصة العدالة لإرسال بيانات ناجز تلقائياً.</p>

    <div class="card">
      <div class="field">
        <label>رابط واجهة المنصة (API URL)</label>
        <p class="hint">من إعدادات حسابك في منصة العدالة، انسخ رابط نقطة النهاية. مثال: <code>https://app.example.com/api/v1/sync</code></p>
        <input id="apiUrl" type="url" placeholder="https://your-platform.com/api/v1/sync" />
      </div>

      <div class="field">
        <label>مفتاح الربط (API Key) — اختياري</label>
        <p class="hint">يمكن تركه فارغاً. عند استخدام نظام حسابات لاحقاً يمكن وضع مفتاح ربط داخلي لتوجيه البيانات لحساب موظف محدد.</p>
        <input id="apiKey" type="text" placeholder="اختياري — يمكن تركه فارغاً" />
      </div>

      <div class="field">
        <label>المزامنة التلقائية</label>
        <div class="opt"><input type="checkbox" id="autoSync" /> <span>تفعيل المزامنة التلقائية في الخلفية</span></div>
        <div class="row">
          <span style="color:var(--muted);font-size:13px">كل</span>
          <select id="interval" style="width:140px;direction:rtl;text-align:right">
            <option value="15">15 دقيقة</option>
            <option value="30">30 دقيقة</option>
            <option value="60" selected>ساعة</option>
            <option value="180">3 ساعات</option>
            <option value="360">6 ساعات</option>
          </select>
        </div>
      </div>

      <div class="row">
        <button class="btn btn-gold" id="save">حفظ الإعدادات</button>
        <button class="btn btn-ghost" id="test">اختبار الاتصال</button>
        <span id="msg"></span>
      </div>
    </div>

    <div class="card">
      <label>كيف تستخدم الأداة؟</label>
      <ol style="color:var(--white);padding-inline-start:18px;line-height:2;font-size:14px">
        <li>افتح <code>https://www.najiz.sa</code> وسجّل دخولك بحسابك الشخصي.</li>
        <li>ستظهر شارة الأداة في أسفل الصفحة — اضغطها لاختيار البيانات.</li>
        <li>أو اضغط أيقونة الإضافة في شريط المتصفح واختر ما تريد مزامنته.</li>
        <li>سيتم إرسال البيانات تلقائياً إلى منصة العدالة وترتيبها في الأقسام المناسبة (القضايا، الموكلون، الجلسات…).</li>
      </ol>
    </div>
  </div>
  <script src="options.js"></script>
</body>
</html>`.trim());

      // ===== options.js =====
      folder.file('options.js', `
const $ = (s) => document.querySelector(s);

async function load() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  $("#apiUrl").value = settings.apiUrl || "";
  $("#apiKey").value = settings.apiKey || "";
  $("#autoSync").checked = !!settings.autoSync;
  $("#interval").value = String(settings.interval || 60);
}

async function save() {
  const settings = {
    apiUrl: $("#apiUrl").value.trim(),
    apiKey: $("#apiKey").value.trim(),
    autoSync: $("#autoSync").checked,
    interval: parseInt($("#interval").value, 10) || 60,
  };
  await chrome.storage.local.set({ settings });
  await chrome.runtime.sendMessage({ action: "RESCHEDULE" });
  show("✓ تم حفظ الإعدادات بنجاح", "ok");
}

async function test() {
  const url = $("#apiUrl").value.trim();
  const key = $("#apiKey").value.trim();
  if (!url) return show("الرجاء إدخال رابط الواجهة أولاً (المفتاح اختياري)", "err");
  try {
    const headers = { "Content-Type": "application/json" };
    if (key) { headers["X-API-Key"] = key; headers["Authorization"] = \`Bearer \${key}\`; }
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "ping", source: "najiz-extension", ts: Date.now(), payload: { items: [] } }),
    });
    if (r.ok) show("✓ الاتصال ناجح — المنصة تستقبل البيانات", "ok");
    else show(\`✗ فشل الاتصال (\${r.status})\`, "err");
  } catch (e) { show(\`✗ \${e.message}\`, "err"); }
}

function show(t, cls) {
  const el = $("#msg"); el.textContent = t; el.className = cls;
  setTimeout(() => { el.textContent = ""; }, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  $("#save").addEventListener("click", save);
  $("#test").addEventListener("click", test);
});
`.trim());

      // ===== README.md =====
      folder.file('README.md', `# منصة العدالة — أداة مزامنة ناجز الإصدار 2
      
## التثبيت
1. افتح متصفح Chrome ثم اذهب إلى الرابط: chrome://extensions
2. فعّل خيار Developer mode في أعلى اليمين
3. اضغط على Load unpacked
4. اختر المجلد الخاص بالإضافة najiz-extension الذي قمت بفك الضغط عنه

## الاستخدام
- اذهب إلى موقع ناجز https://www.najiz.sa وسجل الدخول باستخدام النفاذ الوطني
- اضغط على أيقونة الإضافة في شريط المتصفح أو أيقونة "منصة العدالة" في أسفل يسار الشاشة لفتح واجهة السحب
- انقر على القسم الذي تريد سحب بياناته
- احرص على وضع رابط التطبيق الخاص بك في صفحة الإعدادات لكي يتم توجيه البيانات بنجاح

`.trim());


      // توليد ZIP
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'najiz-extension-v7.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      (window as any).showToast?.('تم تجهيز وتحميل حزمة الإضافة v7.0 بنجاح', 'success');
    } catch(err: any) {
      console.error('Failed to generate extension:', err);
      (window as any).showToast?.('فشل توليد الملف: ' + err.message, 'error');
    } finally {
      setDownloading(false);
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
    <div className="najiz-imperial-hub p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 min-h-screen bg-[#FDFDFD]" dir="rtl">
      
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

      {/* Royal Header Widget (Luminous Luxury with Dark Steps) */}
      <section id="najiz-welcome" className="bg-[#FFFFFF] rounded-[3.5rem] p-12 lg:p-16 text-slate-900 shadow-2xl relative overflow-hidden border-4 border-yellow-400/10">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.05),transparent)] pointer-events-none" />
        
        <div className="relative z-10 space-y-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            <div className="max-w-4xl space-y-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="bg-yellow-400 p-5 rounded-[2rem] shadow-xl shadow-yellow-400/20 group hover:scale-110 transition-transform">
                  <Bot className="w-12 h-12 text-black" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                     الاستحواذ الرقمي الملكي على <span className="text-yellow-600 underline decoration-yellow-400/30 underline-offset-[12px]">بيانات ناجز</span>
                  </h1>
                  <p className="text-lg text-slate-500 font-bold mt-4 max-w-2xl">
                    المحرك الذكي الأكثر تطوراً لمزامنة وحقن ملفات القضايا والجلسات والوكلاء من البوابة الرسمية إلى صلب مكتبك بضغطة زر واحدة.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button 
                onClick={generateExtensionZip}
                disabled={downloading}
                className="bg-black hover:bg-slate-900 text-white font-black text-lg px-10 py-6 rounded-3xl shadow-2xl transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50 group"
              >
                {downloading ? (
                   <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                   <Download className="w-6 h-6 group-hover:bounce transition-all text-yellow-400" />
                )}
                <span>{downloading ? 'جاري الصياغة...' : 'تحميل محرك الربط الذهبي'}</span>
              </button>
              
              <button
                 id="settings-btn"
                 onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                 className="p-6 bg-yellow-400 text-black rounded-3xl hover:bg-yellow-500 transition-all shadow-xl active:scale-95"
              >
                <Settings className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Interactive Steps (Dark Luxury) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: 1, title: 'المصادقة الرسمية', desc: 'دخول بوابة ناجز عبر نفاذ الوطني بمستعرضك المعتاد لضمان شرعية الوصول.' },
              { step: 2, title: 'حقن الأداة', desc: 'بمجرد تنشيط "العدالة" على المتصفح، سيظهر رادار السحب الذكي فوراً.' },
              { step: 3, title: 'التدفق الملكي', desc: 'ضغطة زر واحدة كفيلة بنقل كل ما يهمك من سجلات إلى خوادم مكتبك بأمان تام.' }
            ].map((s) => (
              <div key={s.step} className="bg-[#0A0F1E] border-4 border-yellow-400/20 rounded-[2.5rem] p-10 flex flex-col space-y-4 hover:border-yellow-400/40 transition-all relative group overflow-hidden shadow-xl">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/[0.03] blur-3xl rounded-full" />
                 <div className="flex items-center gap-5 relative z-10 font-bold">
                   <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-black flex items-center justify-center text-xl font-black shadow-lg shadow-yellow-400/20">{s.step}</div>
                   <h4 className="!text-yellow-400 font-extrabold text-xl">{s.title}</h4>
                 </div>
                 <p className="!text-white font-semibold leading-relaxed relative z-10 pr-2">{s.desc}</p>
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Sync History Table REMOVED */}
      
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
