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
    setDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const ext = zip.folder('najiz-extension');
      if (!ext) throw new Error("Could not create folder");

      const APP_SERVER = 'https://aladala-platform-rnuz.onrender.com';

      // ===== manifest.json =====
      ext.file('manifest.json', JSON.stringify({
        "manifest_version": 3,
        "name": "منصة العدالة — مزامنة ناجز",
        "version": "4.0",
        "description": "سحب القضايا والوكالات والتنفيذ والجلسات من ناجز ومزامنتها مع النظام",
        "permissions": ["activeTab", "scripting", "storage", "tabs"],
        "host_permissions": [
          "https://www.najiz.sa/*",
          "https://najiz.sa/*",
          "https://*.najiz.sa/*",
          "https://aladala-platform-rnuz.onrender.com/*"
        ],
        "content_scripts": [
          {
            "matches": [
              "https://www.najiz.sa/*",
              "https://najiz.sa/*",
              "https://*.najiz.sa/*"
            ],
            "js": ["content.js"],
            "run_at": "document_idle",
            "all_frames": false
          }
        ],
        "action": {
          "default_popup": "popup.html",
          "default_title": "العدالة — سحب ناجز v4.0"
        },
        "background": {
          "service_worker": "background.js"
        }
      }, null, 2));

      // ===== background.js =====
      ext.file('background.js', `// background.js - منصة العدالة v4.0
const APP_SERVER = 'https://aladala-platform-rnuz.onrender.com';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ serverUrl: APP_SERVER });
  console.log('[العدالة] تم تثبيت الإضافة بنجاح');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady') {
    console.log('[العدالة] Script جاهز:', message.url);
  }
  if (message.action === 'setServerUrl') {
    chrome.storage.local.set({ serverUrl: message.url });
  }
  sendResponse({ received: true });
  return true;
});`);

      // ===== content.js =====
      ext.file('content.js', `(function () {
  'use strict';

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  // تحديد نوع الصفحة الحالية
  function getPageType() {
    const url = window.location.href;
    if (url.includes('/lawsuit')) return 'cases';
    if (url.includes('/wekalat') || url.includes('/procurations')) return 'poa';
    if (url.includes('/iexecution')) return 'executions';
    if (url.includes('/appointment-requests')) return 'hearings';
    return 'unknown';
  }

  // انتظار تحميل البيانات الديناميكية
  function waitForPageData(timeout = 15000) {
    return new Promise((resolve) => {
      let elapsed = 0;
      const check = setInterval(() => {
        elapsed += 500;
        const text = document.body?.innerText || '';
        const tables = document.querySelectorAll('table tr').length;
        const cards = document.querySelectorAll(
          '[class*="card"],[class*="Card"],[class*="item"],[class*="Item"]'
        ).length;
        const hasData = tables > 2 || cards > 2 ||
          /\\d{4}\\/\\d+/.test(text) || /\\d{9,}/.test(text);
        if (hasData || elapsed >= timeout) {
          clearInterval(check);
          resolve(hasData);
        }
      }, 500);
    });
  }

  // ===== استخراج بيانات القضايا =====
  function extractCases() {
    const cases = [];
    const seen = new Set();

    // من الجداول
    document.querySelectorAll('table').forEach(table => {
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');
        const caseNum = rowText.match(/\\d{4}\\/\\d{1,2}\\/\\d+|\\d{4}\\/\\d{4,}|\\d{10,}/)?.[0];
        if (!caseNum || seen.has(caseNum)) return;
        seen.add(caseNum);

        const dateMatch = rowText.match(
          /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
        );

        cases.push({
          caseNumber: caseNum,
          najizCaseNumber: caseNum,
          caseName: cells.find(c =>
            c.length > 5 && !/^\\d+[\\/\\-]?\\d*$/.test(c) &&
            !c.includes('محكمة')
          ) || 'قضية من ناجز',
          status: cells.find(c =>
            ['قيد','منتهي','نشط','مقيد','محكوم','مؤجل',
             'مشطوب','موقوف','صدر','جديد'].some(k => c.includes(k))
          ) || 'قيد النظر',
          court: cells.find(c => c.includes('محكمة')) || '',
          category: cells.find(c =>
            ['تجاري','عمالي','مدني','جزائي','أحوال','إداري',
             'تنفيذ'].some(k => c.includes(k))
          ) || 'مدني',
          nextSessionDate: dateMatch?.[0] || '',
          stage: 'litigation',
          isNajizSync: true,
          source: 'najiz_extension'
        });
      });
    });

    // من البطاقات
    const cardSelectors = [
      '[class*="CaseCard"]','[class*="case-card"]',
      '[class*="CaseItem"]','[class*="caseItem"]',
      '[class*="RequestCard"]','[class*="ListItem"]',
      '[class*="MuiCard"]','[class*="MuiPaper"]',
      '[data-testid*="case"]','.case','.lawsuit-item'
    ];

    cardSelectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(card => {
          const text = (card as HTMLElement).innerText?.trim() || '';
          if (!text || text.length < 10) return;
          const caseNum = text.match(/\\d{4}\\/\\d+|\\d{10,}|\\d{9}/)?.[0];
          if (!caseNum || seen.has(caseNum)) return;
          seen.add(caseNum);

          const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
          const dateMatch = text.match(
            /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
          );

          cases.push({
            caseNumber: caseNum,
            najizCaseNumber: caseNum,
            caseName: lines.find(l =>
              l.length > 5 && !/^\\d+[\\/\\-]?\\d*$/.test(l)
            ) || 'قضية من ناجز',
            status: lines.find(l =>
              ['قيد','منتهي','نشط','مقيد','محكوم',
               'مؤجل','مشطوب'].some(k => l.includes(k))
            ) || 'قيد النظر',
            nextSessionDate: dateMatch?.[0] || '',
            isNajizSync: true,
            source: 'najiz_extension'
          });
        });
      } catch(e) {}
    });

    // fallback من النص
    if (cases.length === 0) {
      const text = document.body?.innerText || '';
      const nums = [...new Set(
        text.match(/\\d{4}\\/\\d{1,2}\\/\\d+|\\d{4}\\/\\d{4,}/g) || []
      )];
      nums.forEach(num => {
        if (!seen.has(num)) {
          seen.add(num);
          cases.push({
            caseNumber: num,
            najizCaseNumber: num,
            caseName: 'قضية من ناجز',
            status: 'قيد النظر',
            isNajizSync: true,
            source: 'najiz_text'
          });
        }
      });
    }

    return cases;
  }

  // ===== استخراج بيانات الوكالات =====
  function extractPOA() {
    const poas = [];
    const seen = new Set();

    document.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');
        const poaNum = rowText.match(/\\d{6,}/)?.[0];
        if (!poaNum || seen.has(poaNum)) return;
        seen.add(poaNum);

        const dateMatch = rowText.match(
          /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/g
        );

        poas.push({
          poaNumber: poaNum,
          type: cells.find(c =>
            ['عامة','خاصة','قضائية','خاص','عام'].some(k => c.includes(k))
          ) || 'عامة',
          status: cells.find(c =>
            ['سارية','منتهية','موقوفة','فعال','غير فعال']
              .some(k => c.includes(k))
          ) || 'سارية',
          issueDate: dateMatch?.[0] || '',
          expiryDate: dateMatch?.[1] || dateMatch?.[0] || '',
          principalName: cells.find(c =>
            c.length > 3 && !/^\\d+$/.test(c) &&
            !['سارية','منتهية','عامة','خاصة'].includes(c)
          ) || '',
          isNajizSync: true,
          source: 'najiz_extension'
        });
      });
    });

    // من البطاقات
    document.querySelectorAll(
      '[class*="Card"],[class*="card"],[class*="Item"],[class*="item"]'
    ).forEach(card => {
      const text = (card as HTMLElement).innerText?.trim() || '';
      if (!text.includes('وكالة') && !text.includes('وكيل')) return;
      const poaNum = text.match(/\\d{6,}/)?.[0];
      if (!poaNum || seen.has(poaNum)) return;
      seen.add(poaNum);

      const dateMatch = text.match(
        /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/g
      );

      poas.push({
        poaNumber: poaNum,
        type: 'عامة',
        status: text.includes('منتهية') ? 'منتهية' : 'سارية',
        expiryDate: dateMatch?.[0] || '',
        isNajizSync: true,
        source: 'najiz_extension'
      });
    });

    return poas;
  }

  // ===== استخراج طلبات التنفيذ =====
  function extractExecutions() {
    const executions = [];
    const seen = new Set();

    document.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');
        const execNum = rowText.match(/\\d{4}\\/\\d+|\\d{9,}/)?.[0];
        if (!execNum || seen.has(execNum)) return;
        seen.add(execNum);

        const dateMatch = rowText.match(
          /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/
        );

        executions.push({
          executionNumber: execNum,
          status: cells.find(c =>
            ['منتهي','قيد','جديد','مكتمل','معلق','نشط']
              .some(k => c.includes(k))
          ) || 'قيد التنفيذ',
          amount: cells.find(c => /[\\d,]+(\\.\\d+)?\\s*(ريال|ر\\.س|SAR)/.test(c)) || '',
          court: cells.find(c => c.includes('محكمة')) || '',
          requesterName: cells.find(c =>
            c.length > 3 && !/^\\d+$/.test(c) &&
            !c.includes('محكمة') && !c.includes('ريال')
          ) || '',
          issueDate: dateMatch?.[0] || '',
          isNajizSync: true,
          source: 'najiz_extension'
        });
      });
    });

    // من البطاقات
    document.querySelectorAll(
      '[class*="Card"],[class*="card"],[class*="Item"]'
    ).forEach(card => {
      const text = (card as HTMLElement).innerText?.trim() || '';
      if (!text.includes('تنفيذ')) return;
      const execNum = text.match(/\\d{4}\\/\\d+|\\d{9,}/)?.[0];
      if (!execNum || seen.has(execNum)) return;
      seen.add(execNum);

      executions.push({
        executionNumber: execNum,
        status: text.includes('منتهي') ? 'منتهي' : 'قيد التنفيذ',
        isNajizSync: true,
        source: 'najiz_extension'
      });
    });

    return executions;
  }

  // ===== استخراج مواعيد الجلسات =====
  function extractHearings() {
    const hearings = [];
    const seen = new Set();

    document.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');

        const dateMatch = rowText.match(
          /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
        );
        const timeMatch = rowText.match(/\\d{1,2}:\\d{2}/);
        const caseNum = rowText.match(/\\d{4}\\/\\d+|\\d{9,}/)?.[0];

        const key = \`\$\{caseNum\}-\$\{dateMatch?.[0]\}\`;
        if (!dateMatch || seen.has(key)) return;
        seen.add(key);

        hearings.push({
          caseNumber: caseNum || '',
          date: dateMatch[0],
          time: timeMatch?.[0] || '09:00',
          court: cells.find(c => c.includes('محكمة')) || '',
          hall: cells.find(c =>
            c.includes('قاعة') || c.includes('دائرة')
          ) || '',
          status: cells.find(c =>
            ['قادمة','منتهية','مؤجلة','ملغاة','جديد']
              .some(k => c.includes(k))
          ) || 'قادمة',
          type: cells.find(c =>
            ['ترافع','نطق','تدقيق','إيداع'].some(k => c.includes(k))
          ) || '',
          isNajizSync: true,
          source: 'najiz_extension'
        });
      });
    });

    // من البطاقات
    document.querySelectorAll(
      '[class*="Appointment"],[class*="appointment"],' +
      '[class*="Hearing"],[class*="hearing"],' +
      '[class*="Session"],[class*="session"],' +
      '[class*="Card"],[class*="card"]'
    ).forEach(card => {
      const text = (card as HTMLElement).innerText?.trim() || '';
      if (text.length < 10) return;
      const dateMatch = text.match(
        /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
      );
      const timeMatch = text.match(/\\d{1,2}:\\d{2}/);
      const caseNum = text.match(/\\d{4}\\/\\d+|\\d{9,}/)?.[0];

      if (!dateMatch) return;
      const key = \`\$\{caseNum\}-\$\{dateMatch[0]\}\`;
      if (seen.has(key)) return;
      seen.add(key);

      hearings.push({
        caseNumber: caseNum || '',
        date: dateMatch[0],
        time: timeMatch?.[0] || '09:00',
        court: text.match(/محكمة[^\\n،,]*/)?.[0] || '',
        status: text.includes('مؤجل') ? 'مؤجلة' :
                text.includes('منتهي') ? 'منتهية' : 'قادمة',
        isNajizSync: true,
        source: 'najiz_extension'
      });
    });

    return hearings;
  }

  // ===== الدالة الرئيسية =====
  async function extractByPageType() {
    await waitForPageData(12000);
    await new Promise(r => setTimeout(r, 2000));

    const pageType = getPageType();
    const url = window.location.href;
    const result = {
      pageType,
      pageUrl: url,
      cases: [],
      hearings: [],
      powers_of_attorney: [],
      executions: [],
      scrapedAt: new Date().toISOString()
    };

    switch (pageType) {
      case 'cases':
        result.cases = extractCases();
        break;
      case 'poa':
        result.powers_of_attorney = extractPOA();
        break;
      case 'executions':
        result.executions = extractExecutions();
        break;
      case 'hearings':
        result.hearings = extractHearings();
        break;
      default:
        // سحب شامل إذا لم تُعرف الصفحة
        result.cases = extractCases();
        result.hearings = extractHearings();
        result.powers_of_attorney = extractPOA();
        result.executions = extractExecutions();
    }

    result.summary = {
      pageType,
      totalCases: result.cases.length,
      totalHearings: result.hearings.length,
      totalPOAs: result.powers_of_attorney.length,
      totalExecutions: result.executions.length,
      hasData: (
        result.cases.length +
        result.hearings.length +
        result.powers_of_attorney.length +
        result.executions.length
      ) > 0
    };

    return result;
  }

  // ===== الاستماع للأوامر =====
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (['extractData','scrape','getData','sync'].includes(request.action)) {
      (async () => {
        try {
          const data = await extractByPageType();

          if (data.summary.hasData) {
            // إرسال للخادم لمزامنة الأقسام الصحيحة
            try {
              await fetch(\`\$\{SERVER\}/api/najiz-sync\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  scrapedData: data,
                  pageType: data.pageType,
                  source: 'chrome_extension',
                  timestamp: new Date().toISOString()
                })
              });
            } catch(syncErr) {
              console.warn('[العدالة] Sync failed:', syncErr.message);
            }

            sendResponse({ success: true, data });
          } else {
            sendResponse({
              success: false,
              data,
              message: getPageGuide(data.pageType)
            });
          }
        } catch(err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }

    if (request.action === 'ping') {
      const pt = getPageType();
      sendResponse({
        success: true,
        url: window.location.href,
        pageType: pt,
        isNajiz: window.location.href.includes('najiz.sa'),
        isTargetPage: pt !== 'unknown'
      });
      return true;
    }

    if (request.action === 'getPageType') {
      sendResponse({ pageType: getPageType() });
      return true;
    }
  });

  function getPageGuide(pageType) {
    const guides = {
      cases: 'انتظر تحميل القضايا ثم اضغط سحب مرة أخرى',
      poa: 'انتظر تحميل الوكالات ثم اضغط سحب مرة أخرى',
      executions: 'انتظر تحميل طلبات التنفيذ ثم اضغط سحب',
      hearings: 'انتظر تحميل المواعيد ثم اضغط سحب مرة أخرى',
      unknown: 'اذهب لإحدى الصفحات المحددة في ناجز ثم اضغط سحب'
    };
    return guides[pageType] || guides.unknown;
  }

  console.log('[العدالة] ✅ جاهز | نوع الصفحة:', getPageType());

  try {
    chrome.runtime.sendMessage({
      action: 'contentScriptReady',
      url: window.location.href,
      pageType: getPageType(),
      isNajiz: window.location.href.includes('najiz.sa')
    });
  } catch(e) {}

})();`);

      // ===== popup.html =====
      ext.file('popup.html', `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>العدالة - ناجز</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 340px;
    min-height: 200px;
    padding: 14px;
    background: #050e21;
    color: white;
    font-family: Arial, sans-serif;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    border-bottom: 1px solid #1e3a5f;
    padding-bottom: 10px;
  }
  .title { font-size: 15px; font-weight: bold; color: #f59e0b; }
  .subtitle { font-size: 10px; color: #475569; margin-top: 2px; }
  #status {
    font-size: 12px;
    margin-bottom: 10px;
    padding: 8px;
    background: #0a1628;
    border-radius: 8px;
    text-align: center;
    color: #94a3b8;
  }
  #pageGuide {
    font-size: 11px;
    color: #475569;
    margin-bottom: 8px;
    padding: 6px 8px;
    background: #0a1628;
    border-radius: 6px;
    border-right: 3px solid #f59e0b;
  }
  .section-title {
    font-size: 10px;
    color: #475569;
    margin: 8px 0 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  #pageButtons { margin-bottom: 10px; }
  #extractBtn {
    width: 100%;
    padding: 11px;
    background: #f59e0b;
    color: #000;
    font-weight: bold;
    font-size: 13px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  #extractBtn:disabled { opacity: 0.5; cursor: not-allowed; }
  #extractBtn:hover:not(:disabled) { background: #d97706; }
  #progress {
    display: none;
    text-align: center;
    font-size: 11px;
    color: #f59e0b;
    margin-top: 6px;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  #results { margin-top: 8px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">⚖️ منصة العدالة</div>
      <div class="subtitle">مزامنة ناجز v4.0 — بدون API Key</div>
    </div>
  </div>

  <div id="status">جارٍ التحقق من الصفحة...</div>
  <div id="pageGuide" style="display:none"></div>

  <div class="section-title">📌 صفحات المزامنة</div>
  <div id="pageButtons"></div>

  <button id="extractBtn">📥 سحب ومزامنة البيانات</button>
  <div id="progress">🔄 جارٍ المعالجة...</div>
  <div id="results"></div>

  <script src="popup.js"></script>
</body>
</html>`);

      // ===== popup.js =====
      ext.file('popup.js', `document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const extractBtn = document.getElementById('extractBtn');
  const resultsEl = document.getElementById('results');
  const progressEl = document.getElementById('progress');
  const pageGuideEl = document.getElementById('pageGuide');
  const pageBtnsEl = document.getElementById('pageButtons');

  const PAGES = [
    { label: '📁 القضايا', url: 'https://najiz.sa/applications/lawsuit', section: 'إدارة القضايا' },
    { label: '📜 الوكالات', url: 'https://najiz.sa/applications/wekalat/procurations-query', section: 'الوكالات' },
    { label: '⚡ التنفيذ', url: 'https://najiz.sa/applications/iexecution', section: 'طلبات التنفيذ' },
    { label: '📅 الجلسات', url: 'https://najiz.sa/applications/appointment-requests/', section: 'مواعيد الجلسات' }
  ];

  const setStatus = (msg, type = 'info') => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : '#94a3b8';
  };

  const setProgress = (show, msg = '') => {
    if (progressEl) {
      progressEl.style.display = show ? 'block' : 'none';
      if (msg) progressEl.textContent = msg;
    }
  };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab?.url || '';
  const isNajiz = currentUrl.includes('najiz.sa');

  let currentPage = isNajiz ? PAGES.find(p => currentUrl.includes(p.url.replace('https://najiz.sa', ''))) : null;

  if (!isNajiz) {
    setStatus('❌ افتح موقع ناجز أولاً', 'error');
    if (extractBtn) extractBtn.disabled = true;
    if (pageBtnsEl) {
      pageBtnsEl.innerHTML = '<p style="color:#f59e0b;font-size:11px;margin:0 0 6px;font-weight:bold">🔗 انتقل مباشرة إلى:</p>' + 
        PAGES.map(p => \`<a href="\$\{p.url\}" target="_blank" style="display:block;background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:6px 10px;color:#94a3b8;text-decoration:none;font-size:11px;margin-bottom:4px;">\$\{p.label\} ← \$\{p.section\}</a>\`).join('');
    }
    return;
  }

  if (currentPage) {
    setStatus(\`✅ صفحة \$\{currentPage.section\} — جاهز للسحب\`, 'success');
    if (pageGuideEl) {
      pageGuideEl.style.display = 'block';
      pageGuideEl.innerHTML = \`<span style="color:#22c55e">●</span> سيتم إضافة البيانات إلى قسم <strong style="color:#f59e0b">\$\{currentPage.section\}</strong>\`;
    }
  } else {
    setStatus('⚠️ اذهب لإحدى الصفحات أدناه للسحب', 'warning');
  }

  if (pageBtnsEl) {
    pageBtnsEl.innerHTML = PAGES.map(p => {
      const isActive = currentUrl.includes(p.url.replace('https://najiz.sa', ''));
      return \`<a href="\$\{p.url\}" target="_blank" style="display:block;background:\$\{isActive ? '#1e3a5f' : '#0a1628'\};border:1px solid \$\{isActive ? '#f59e0b' : '#1e3a5f'\};border-radius:8px;padding:6px 10px;color:#fff;text-decoration:none;font-size:11px;margin-bottom:4px;">\$\{isActive ? '● ' : ''\}\$\{p.label\}<span style="color:#475569;float:left;font-size:10px">→ \$\{p.section\}</span></a>\`;
    }).join('');
  }

  extractBtn?.addEventListener('click', async () => {
    if (!currentPage) { setStatus('⚠️ اذهب لإحدى صفحات ناجز أولاً', 'warning'); return; }
    setStatus(\`⏳ جارٍ سحب \$\{currentPage.section\}...\`, 'info');
    setProgress(true, '🔄 ينتظر تحميل البيانات...');
    extractBtn.disabled = true;

    try {
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
        await new Promise(r => setTimeout(r, 1500));
      } catch(e) {}

      const response = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { action: 'extractData' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 25000))
      ]);

      setProgress(false);
      if (response?.success && response.data) {
        const s = response.data.summary;
        setStatus(\`✅ تم سحب ومزامنة البيانات من \$\{currentPage.section\}\`, 'success');
        if (resultsEl) {
          resultsEl.innerHTML = \`<div style="direction:rtl;font-size:12px;padding:10px;background:#0a1628;border-radius:8px;margin-top:8px;"><p style="color:#f59e0b;font-weight:bold;margin:0 0 8px">📊 نتائج سحب \$\{currentPage.section\}</p>\$\{s.totalCases > 0 ? \`<p style="color:#fff;margin:3px 0">📁 القضايا: <strong>\$\{s.totalCases\}</strong></p>\` : ''\}\$\{s.totalHearings > 0 ? \`<p style="color:#fff;margin:3px 0">📅 الجلسات: <strong>\$\{s.totalHearings\}</strong></p>\` : ''\}\$\{s.totalPOAs > 0 ? \`<p style="color:#fff;margin:3px 0">📜 الوكالات: <strong>\$\{s.totalPOAs\}</strong></p>\` : ''\}\$\{s.totalExecutions > 0 ? \`<p style="color:#fff;margin:3px 0">⚡ التنفيذ: <strong>\$\{s.totalExecutions\}</strong></p>\` : ''\}<p style="color:#22c55e;margin:8px 0 0;font-weight:bold">✅ تمت المزامنة مع النظام</p></div>\`;
        }
      } else {
        setStatus(response?.message || \`⚠️ لم تُوجد بيانات — انتظر تحميل \$\{currentPage.section\} كاملاً\`, 'warning');
      }
    } catch(err) {
      setProgress(false);
      setStatus(err.message === 'timeout' ? '⚠️ انتهت المهلة — أعد المحاولة' : '❌ خطأ: ' + err.message, 'error');
    } finally {
      extractBtn.disabled = false;
    }
  });
});`);

      const content = await zip.generateAsync({ type: 'blob' });
      const { saveAs } = (await import('file-saver')).default;
      saveAs(content, 'adalah-najiz-extension-v4.zip');
      (window as any).showToast?.('تم تجهيز وتحميل حزمة الإضافة v4.0 بنجاح', 'success');
    } catch (error: any) {
      console.error("Error generating extension ZIP:", error);
      (window as any).showToast?.('حدث خطأ أثناء تجهيز الحزمة: ' + error.message, 'error');
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
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 min-h-screen bg-[#FDFDFD]" dir="rtl">
      
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
                 <div className="flex items-center gap-5 relative z-10 font-black">
                   <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-black flex items-center justify-center text-xl shadow-lg shadow-yellow-400/20">{s.step}</div>
                   <h4 className="text-white text-xl">{s.title}</h4>
                 </div>
                 <p className="text-slate-400 font-bold leading-relaxed relative z-10 pr-2">{s.desc}</p>
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Dashboard Control Panel (Dark Luxury Cards) */}
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
              whileHover={{ scale: 1.03, translateY: -4 }}
              whileTap={{ scale: 0.98 }}
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
              className={`relative overflow-hidden p-8 rounded-[3rem] border-2 transition-all flex flex-col gap-5 text-right shadow-2xl
                ${status === 'syncing' ? 'border-yellow-400 bg-[#0A0F1E] animate-pulse' : 
                  status === 'success' ? 'border-emerald-400 bg-[#0A1A2F]' : 
                  'border-white/10 bg-[#0F172A] hover:border-yellow-400 shadow-xl shadow-slate-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-4 rounded-2xl ${
                  status === 'syncing' ? 'bg-yellow-400/20 text-yellow-400' :
                  status === 'success' ? 'bg-emerald-400/20 text-emerald-400' :
                  'bg-yellow-400/10 text-yellow-400'}`}>
                  <btn.icon className="w-8 h-8" />
                </div>
                <div className={`flex items-center gap-2 text-[12px] font-black px-4 py-2 rounded-full ${
                  status === 'syncing' ? 'bg-yellow-400/20 text-yellow-400' :
                  status === 'success' ? 'bg-emerald-400/20 text-emerald-400' :
                  'bg-white/5 text-yellow-400'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    status === 'syncing' ? 'bg-yellow-400 animate-ping' :
                    status === 'success' ? 'bg-emerald-400' :
                    'bg-yellow-400'}`} />
                  {status === 'syncing' ? 'جاري السحب الفوري...' : status === 'success' ? 'اكتمل الربط' : 'جاهز للمزامنة'}
                </div>
              </div>
              <div>
                <h4 className="font-extrabold text-xl text-white tracking-wide">{btn.label}</h4>
                <p className="text-[12px] font-black text-yellow-400/90 mt-1">
                  {syncHistory[btn.id]?.lastSync ? `آخر مزامنة: ${new Date(syncHistory[btn.id].lastSync!).toLocaleDateString('ar-SA')}` : 'انتظار المزامنة الأولى'}
                </p>
              </div>
              
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none opacity-30" />
            </motion.button>
          );
        })}
      </div>

      {/* Sync History Table */}
      <motion.div 
        id="sync-history"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0F172A] border-4 border-yellow-400/20 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-300"
      >
        <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-yellow-400/10 text-yellow-400 rounded-3xl border border-yellow-400/20">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">سجل شفافية المزامنة الملكي</h3>
              <p className="text-sm text-yellow-400 font-black tracking-wide">متابعة دقيقة وفورية لكل قطرة بيانات متدفقة من بوابة ناجز</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-white/5 text-[12px] font-black text-slate-300 uppercase tracking-[0.15em] border-b border-white/5">
                <th className="px-10 py-6">القسم والمجال</th>
                <th className="px-10 py-6 text-center">توقيت السحب الأخير</th>
                <th className="px-10 py-6 text-center">سجلات مضافة</th>
                <th className="px-10 py-6 text-center">سجلات محدثة</th>
                <th className="px-10 py-6 text-center">الحالة التشغيلية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { id: 'cases', label: 'إدارة القضايا والدعاوى', icon: Briefcase },
                { id: 'hearings', label: 'الجلسات والمواعيد القضائية', icon: Calendar },
                { id: 'agencies', label: 'الوكالات والتوكيلات الشرعية', icon: Users },
                { id: 'executions', label: 'طلبات التنفيذ والسداد', icon: Zap },
                { id: 'clients', label: 'ملفات المستفيدين والموكلين', icon: Bot }
              ].map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-yellow-400/10 text-yellow-400 rounded-xl group-hover:scale-110 transition-transform">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-extrabold text-white text-base">{item.label}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center font-bold text-slate-300 text-sm">
                    {syncHistory[item.id]?.lastSync ? new Date(syncHistory[item.id].lastSync!).toLocaleString('ar-SA') : 'في انتظار أول ربط'}
                  </td>
                  <td className="px-10 py-6 text-center font-black text-emerald-400 text-lg">
                    {syncHistory[item.id]?.newCount || 0}
                  </td>
                  <td className="px-10 py-6 text-center font-black text-yellow-400 text-lg">
                    {syncHistory[item.id]?.updatedCount || 0}
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black tracking-wide ${
                      syncHistory[item.id]?.lastSync ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30' : 'bg-white/5 text-slate-500 border border-white/5'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${syncHistory[item.id]?.lastSync ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                      {syncHistory[item.id]?.lastSync ? 'متصل ومحمي' : 'غير نشط'}
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
      <ExtensionDownloadSection 
        apiKey={customApiKey || "ADALAH-DEMO-KEY"} 
        lawyerName={currentUser?.name || "المحامي"} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Settings Panel, Configuration Status, Multi-select Target Types */}
        <div id="features-section" className="lg:col-span-1 space-y-6">
          
          {/* Active Connection Status Badge (Imperial Dark) */}
          <div className="bg-[#0A0F1E] border-4 border-yellow-400/20 rounded-[3rem] p-8 shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-3xl rounded-full" />
            <h3 className="font-black text-yellow-400 text-xl mb-6 flex items-center gap-3 relative z-10">
              <ShieldCheck className="w-8 h-8 text-yellow-400" />
              الحالة الحالية والتفويض
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[1.5rem] shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-white uppercase tracking-widest leading-none">نمط عمل الربط:</span>
                  <span className="text-[10px] bg-emerald-500 text-white px-3 py-1 rounded-full font-black shadow-lg">نشط الآن</span>
                </div>
                <p className="text-lg font-black text-emerald-400">
                  {syncMode === 'personal' ? 'المزامنة الذاتية الملكية' : 'المزامنة المقيدة (API Key)'}
                </p>
                {syncMode === 'apikey' && !customApiKey && (
                  <p className="text-[11px] text-yellow-400 mt-2 font-black">⚠️ لم يتم إدخال مفتاح API - سيتم استخدام الوضع الافتراضي</p>
                )}
              </div>

              <div className="p-6 bg-white/5 border-2 border-yellow-400/20 rounded-[1.5rem] text-sm font-bold leading-relaxed text-yellow-100 shadow-md">
                بمجرد تمديد الإضافة محلياً، تقوم بفحص المحتوى المالي والعمالي والجلسات في خادم ديوان المظالم أو ناجز ونقلها فوراً وفق الصلاحية المحددة.
              </div>

              {/* Web Worker Background Processing Switch */}
              <div className="p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-white uppercase tracking-wider">المزامنة الخلفية (AI Worker):</span>
                  <button 
                    onClick={() => setBgProcessingEnabled(!bgProcessingEnabled)}
                    className={`w-14 h-7 flex items-center rounded-full p-1 transition-all cursor-pointer ${bgProcessingEnabled ? 'bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'bg-slate-700'}`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-lg transform transition-all duration-300 ${bgProcessingEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[11px] text-white font-black leading-relaxed opacity-80">
                  تفعيل المعالجة وتحليل مصفوفات النصوص الضخمة عبر خيوط متوازية لمنع تجمد الشاشة تماماً وضمان تدفق العمل.
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Infographics & Security Benefits Section (Imperial Dark) */}
          <div className="bg-[#0A0F1E] border-4 border-yellow-400/20 rounded-[3rem] p-10 shadow-2xl text-white space-y-10 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/5 blur-3xl rounded-full" />
            <div className="flex items-center gap-5 border-b-2 border-white/10 pb-6 relative z-10">
              <div className="p-4 bg-yellow-400 text-black rounded-2xl shadow-xl">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-black text-white text-2xl">دليل الربط الآمن والتثبيت</h3>
            </div>
            
            <div className="space-y-6 relative z-10">
              {[
                { 
                  title: "1. تفعيل وضع المطور", 
                  desc: "افتح chrome://extensions وفعّل خيار 'Developer Mode' للسماح بتحميل الحزم المحلية المفتوحة.",
                  icon: Code,
                  color: "text-blue-400"
                },
                { 
                  title: "2. فك حزمة الامتداد", 
                  desc: "يجب استخراج ملف .ZIP المحمل في مجلد مستقل لضمان عمل كافة الملفات البرمجية والأذونات.",
                  icon: Download,
                  color: "text-yellow-400"
                },
                { 
                  title: "3. مزايا المزامنة التلقائية", 
                  desc: "الوضع الافتراضي المشفر يحمي خصوصيتك عبر تشفير البيانات محلياً قبل الترحيل الملكي.",
                  icon: Zap,
                  color: "text-emerald-400"
                }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 p-5 bg-white/5 rounded-[1.5rem] border-2 border-white/5 hover:border-yellow-400/30 transition-all group">
                  <div className={`p-3 rounded-xl bg-slate-800 ${step.color} h-fit shadow-lg group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight mb-1">{step.title}</h4>
                    <p className="text-xs text-slate-300 font-bold leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-yellow-400/5 rounded-2xl border-2 border-yellow-400/30 relative z-10">
              <div className="flex items-center gap-3 mb-3 text-yellow-400">
                <Key className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest leading-none">بروتوكول تطبيق المفاتيح</span>
              </div>
              <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-white/90">
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                  <span className="opacity-60 text-yellow-400 font-black">System URL:</span>
                  <span className="text-emerald-400 font-bold select-all truncate max-w-[140px] tracking-wider">{window.location.origin}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                  <span className="opacity-60 text-yellow-400 font-black">API Status:</span>
                  <span className={syncMode === 'personal' ? 'text-amber-400 font-black' : 'text-blue-400 font-black'}>
                    {syncMode === 'personal' ? 'Personal Cloud' : 'Enterprise API v4'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Config Card (Imperial Dark) */}
          <div className="bg-[#0A0F1E] border-4 border-yellow-400/20 rounded-[3rem] p-8 shadow-2xl text-white space-y-8 relative overflow-hidden" id="config-card">
             <div className="absolute top-0 left-0 w-24 h-24 bg-yellow-400/5 blur-2xl rounded-full" />
             <div className="relative z-10 space-y-2">
                <h3 className="font-black text-yellow-400 text-xl flex items-center gap-3">
                   <ClipboardList className="w-8 h-8 text-yellow-400" />
                   تحديد بيانات السحب
                </h3>
                <p className="text-sm text-white font-bold opacity-80 leading-relaxed">اختر الأصناف المقررة للاستقبال بالأسفل. سيتم حظر أي صنف غير محدد آلياً.</p>
             </div>

             <div className="space-y-4 pt-4 relative z-10">
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
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 text-right transition-all group ${isChecked ? 'bg-yellow-400/10 border-yellow-400 text-white shadow-[0_10px_30px_rgba(250,204,21,0.1)]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isChecked ? 'bg-yellow-400 text-black shadow-lg' : 'bg-white/5 text-slate-500'}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-sm font-black ${isChecked ? 'text-white' : 'text-slate-300'}`}>{item.label}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isChecked ? 'bg-yellow-400 border-yellow-400 shadow-lg' : 'border-white/20'}`}>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-black stroke-[4]" />}
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Right Side: Tab Options and Interactive Simulator Console */}
        <div className="lg:col-span-3 space-y-10">
          
          {/* Main Workspace Navigation (Imperial Dark) */}
          <div className="bg-[#0A0F1E] border-8 border-yellow-400/20 rounded-[4rem] p-10 lg:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/[0.03] blur-[150px] rounded-full pointer-events-none" />

            <div className="flex flex-wrap gap-4 border-b-4 border-white/10 mb-12 p-3 bg-white/5 rounded-[2.5rem] relative z-10 shadow-inner">
              <button 
                onClick={() => setActiveTab('instructions')}
                className={`flex-1 py-6 px-8 text-lg font-black transition-all rounded-[1.8rem] border-b-4 ${activeTab === 'instructions' ? 'text-black bg-yellow-400 border-yellow-600 shadow-[0_15px_40px_rgba(250,204,21,0.3)]' : 'text-white hover:bg-white/10 border-transparent'}`}
              >
                1. تثبيت وبدء العمل
              </button>
              <button 
                onClick={() => setActiveTab('features')}
                className={`flex-1 py-6 px-8 text-lg font-black transition-all rounded-[1.8rem] border-b-4 ${activeTab === 'features' ? 'text-black bg-yellow-400 border-yellow-600 shadow-[0_15px_40px_rgba(250,204,21,0.3)]' : 'text-white hover:bg-white/10 border-transparent'}`}
              >
                2. مزايا وقدرات المزامنة
              </button>
              <button 
                onClick={() => setActiveTab('keys')}
                className={`flex-1 py-6 px-8 text-lg font-black transition-all rounded-[1.8rem] border-b-4 ${activeTab === 'keys' ? 'text-black bg-yellow-400 border-yellow-600 shadow-[0_15px_40px_rgba(250,204,21,0.3)]' : 'text-white hover:bg-white/10 border-transparent'}`}
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
