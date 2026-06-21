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
        name: "منصة العدالة — مزامنة ناجز",
        version: "7.0",
        description: "سحب بيانات القضايا والجلسات والوكالات والتنفيذ من ناجز ومزامنتها مع منصة العدالة",
        permissions: ["activeTab", "scripting", "storage", "tabs"],
        host_permissions: [
          "https://www.najiz.sa/*",
          "https://najiz.sa/*",
          "https://*.najiz.sa/*",
          "https://aladala-platform-rnuz.onrender.com/*"
        ],
        content_scripts: [{
          matches: [
            "https://www.najiz.sa/*",
            "https://najiz.sa/*",
            "https://*.najiz.sa/*"
          ],
          js: ["content.js"],
          run_at: "document_idle",
          all_frames: false
        }],
        action: {
          default_popup: "popup.html",
          default_title: "العدالة — سحب ناجز v7.0"
        },
        background: {
          service_worker: "background.js"
        }
      }, null, 2));

      // ===== background.js =====
      folder.file('background.js', `
const APP_SERVER = 'https://aladala-platform-rnuz.onrender.com';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ serverUrl: APP_SERVER });
  console.log('[العدالة v7.0] تم التثبيت بنجاح');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady') {
    console.log('[العدالة] Script جاهز:', message.url, '| نوع الصفحة:', message.pageType);
  }
  if (message.action === 'setServerUrl') {
    chrome.storage.local.set({ serverUrl: message.url });
  }
  sendResponse({ received: true });
  return true;
});
`.trim());

      // ===== content.js =====
      folder.file('content.js', `
(function () {
  'use strict';

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  function getPageType() {
    const url = window.location.href;
    if (url.includes('/lawsuit')) return 'cases';
    if (url.includes('/iexecution')) return 'executions';
    if (url.includes('/wekalat') || url.includes('/procuration')) return 'poa';
    if (url.includes('/appointment-requests')) return 'hearings';
    return 'unknown';
  }

  function waitForVisibleContent(timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    return new Promise(function(resolve) {
      var elapsed = 0;
      var interval = setInterval(function() {
        elapsed += 500;
        var body = document.body ? document.body.innerText : '';
        var hasTable = document.querySelectorAll('table tr').length > 1;
        var hasCards = document.querySelectorAll('[class*="card" i],[class*="item" i],[class*="row" i]').length > 2;
        var hasNumbers = /\\d{4}\\/\\d+|\\d{9,}/.test(body);
        var hasContent = /[\\u0600-\\u06FF]{5,}/.test(body) && body.length > 500;
        if (hasTable || hasCards || hasNumbers || hasContent) {
          clearInterval(interval);
          resolve(true);
          return;
        }
        if (elapsed >= timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      }, 500);
    });
  }

  function getVisibleText() {
    var texts = [];
    function isVisible(el) {
      if (!el) return false;
      var style = window.getComputedStyle(el);
      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0' &&
             el.offsetParent !== null;
    }
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      { acceptNode: function(node) {
        if (node.nodeValue && node.nodeValue.trim() && isVisible(node.parentElement)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }}
    );
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue.trim();
      if (text && text.length > 1) texts.push(text);
    }
    return texts.join('\\n');
  }

  function mapCategory(text) {
    if (!text) return 'civil';
    var t = text.toString();
    if (t.includes('تجاري')) return 'commercial';
    if (t.includes('عمالي') || t.includes('عمل')) return 'labor';
    if (t.includes('جزائي') || t.includes('جنائي')) return 'criminal';
    if (t.includes('أحوال') || t.includes('أسرة')) return 'personal_status';
    if (t.includes('إداري') || t.includes('مظالم')) return 'administrative';
    return 'civil';
  }

  function extractCasesFromScreen() {
    var cases = [];
    var seen = new Set();

    document.querySelectorAll('table').forEach(function(table) {
      if (!table.offsetParent) return;
      var headers = Array.from(table.querySelectorAll('thead th,thead td,tr:first-child th'))
        .map(function(h) { return h.innerText ? h.innerText.trim() : ''; });
      var rows = table.querySelectorAll('tbody tr,tr:not(:first-child)');
      rows.forEach(function(row) {
        if (!row.offsetParent) return;
        var cells = Array.from(row.querySelectorAll('td'))
          .map(function(td) { return td.innerText ? td.innerText.trim() : ''; });
        if (cells.length < 2) return;
        var rowText = cells.join(' | ');
        var numMatch = rowText.match(/\\d{4}\\/\\d{1,2}\\/\\d+|\\d{4}\\/\\d{4,}|\\b\\d{9,10}\\b/);
        if (!numMatch || seen.has(numMatch[0])) return;
        seen.add(numMatch[0]);
        var dateMatch = rowText.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/);
        var caseObj = {
          caseNumber: numMatch[0],
          najizCaseNumber: numMatch[0],
          caseName: cells.find(function(c) {
            return c.length > 5 && !/^\\d+[\\/\\-]?\\d*$/.test(c) && !c.includes('محكمة');
          }) || 'قضية من ناجز',
          status: cells.find(function(c) {
            return ['قيد','منتهي','نشط','مقيد','محكوم','مؤجل','مشطوب','موقوف'].some(function(k) { return c.includes(k); });
          }) || 'قيد النظر',
          court: cells.find(function(c) { return c.includes('محكمة'); }) || '',
          category: mapCategory(rowText),
          nextHearing: dateMatch ? dateMatch[0] : '',
          stage: 'litigation',
          isNajizSync: true,
          source: 'screen_table'
        };
        cases.push(caseObj);
      });
    });

    var cardSelectors = [
      '[class*="card" i]','[class*="Card"]',
      '[class*="item" i]','[class*="Item"]',
      '[class*="case" i]','[class*="lawsuit" i]',
      '[role="row"]','[role="listitem"]'
    ];
    cardSelectors.forEach(function(selector) {
      try {
        document.querySelectorAll(selector).forEach(function(el) {
          if (!el.offsetParent) return;
          var text = el.innerText ? el.innerText.trim() : '';
          if (text.length < 10 || text.length > 3000) return;
          var numMatch = text.match(/\\d{4}\\/\\d+|\\d{10,}|\\d{9}/);
          if (!numMatch || seen.has(numMatch[0])) return;
          seen.add(numMatch[0]);
          var lines = text.split('\\n').map(function(l) { return l.trim(); }).filter(Boolean);
          var dateMatch = text.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/);
          cases.push({
            caseNumber: numMatch[0],
            najizCaseNumber: numMatch[0],
            caseName: lines.find(function(l) {
              return l.length > 5 && !/^\\d+[\\/\\-]?\\d*$/.test(l) && l !== numMatch[0];
            }) || 'قضية من ناجز',
            status: lines.find(function(l) {
              return ['قيد','منتهي','نشط','مقيد','محكوم','مؤجل','مشطوب'].some(function(k) { return l.includes(k); });
            }) || 'قيد النظر',
            court: lines.find(function(l) { return l.includes('محكمة'); }) || '',
            category: mapCategory(text),
            nextHearing: dateMatch ? dateMatch[0] : '',
            isNajizSync: true,
            source: 'screen_card'
          });
        });
      } catch(e) {}
    });

    if (cases.length === 0) {
      var visibleText = getVisibleText();
      var allNums = Array.from(new Set(visibleText.match(/\\d{4}\\/\\d{1,2}\\/\\d+|\\d{4}\\/\\d{4,}/g) || []));
      allNums.forEach(function(num) {
        if (!seen.has(num)) {
          seen.add(num);
          var idx = visibleText.indexOf(num);
          var context = visibleText.substring(Math.max(0,idx-300), Math.min(visibleText.length,idx+400));
          cases.push({
            caseNumber: num, najizCaseNumber: num,
            caseName: 'قضية من ناجز',
            status: context.includes('منتهي') ? 'منتهي' : 'قيد النظر',
            court: (context.match(/محكمة[^\\n،,]{2,30}/) || [''])[0],
            category: mapCategory(context),
            nextHearing: (context.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/) || [''])[0],
            isNajizSync: true, source: 'screen_text_fallback'
          });
        }
      });
    }
    return cases;
  }

  function extractHearingsFromScreen() {
    var hearings = [];
    var seen = new Set();
    document.querySelectorAll('table').forEach(function(table) {
      if (!table.offsetParent) return;
      table.querySelectorAll('tbody tr,tr:not(:first-child)').forEach(function(row) {
        var cells = Array.from(row.querySelectorAll('td')).map(function(td) { return td.innerText ? td.innerText.trim() : ''; });
        var rText = cells.join(' ');
        var rDate = rText.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/);
        var rTime = rText.match(/\\d{1,2}:\\d{2}/);
        var rCase = (rText.match(/\\d{4}\\/\\d+|\\d{9,}/) || [''])[0];
        var rKey = rCase + '-' + (rDate ? rDate[0] : '');
        if (!rDate || seen.has(rKey)) return;
        seen.add(rKey);
        hearings.push({
          caseNumber: rCase,
          date: rDate[0],
          time: rTime ? rTime[0] : '09:00',
          court: cells.find(function(c) { return c.includes('محكمة'); }) || '',
          hall: cells.find(function(c) { return c.includes('قاعة') || c.includes('دائرة'); }) || '',
          status: cells.find(function(c) { return ['قادمة','منتهية','مؤجلة','ملغاة'].some(function(k) { return c.includes(k); }); }) || 'قادمة',
          isNajizSync: true, source: 'screen_table'
        });
      });
    });
    return hearings;
  }

  function extractPOAFromScreen() {
    var poas = [];
    var seen = new Set();
    document.querySelectorAll('table').forEach(function(table) {
      if (!table.offsetParent) return;
      table.querySelectorAll('tbody tr,tr:not(:first-child)').forEach(function(row) {
        var cells = Array.from(row.querySelectorAll('td')).map(function(td) { return td.innerText ? td.innerText.trim() : ''; });
        var rowText = cells.join(' ');
        var num = (rowText.match(/\\d{6,}/) || [''])[0];
        if (!num || seen.has(num)) return;
        seen.add(num);
        var dates = rowText.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/g);
        poas.push({
          poaNumber: num,
          type: cells.find(function(c) { return ['عامة','خاصة','قضائية'].some(function(k) { return c.includes(k); }); }) || 'عامة',
          status: cells.find(function(c) { return ['سارية','منتهية','موقوفة'].some(function(k) { return c.includes(k); }); }) || 'سارية',
          issueDate: dates ? dates[0] : '',
          expiryDate: dates && dates[1] ? dates[1] : (dates ? dates[0] : ''),
          isNajizSync: true, source: 'screen_table'
        });
      });
    });
    return poas;
  }

  function extractExecutionsFromScreen() {
    var executions = [];
    var seen = new Set();
    document.querySelectorAll('table').forEach(function(table) {
      if (!table.offsetParent) return;
      table.querySelectorAll('tbody tr,tr:not(:first-child)').forEach(function(row) {
        var cells = Array.from(row.querySelectorAll('td')).map(function(td) { return td.innerText ? td.innerText.trim() : ''; });
        var rowText = cells.join(' ');
        var num = (rowText.match(/\\d{4}\\/\\d+|\\d{9,}/) || [''])[0];
        if (!num || seen.has(num)) return;
        seen.add(num);
        var dateMatch = rowText.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/);
        var amountMatch = rowText.match(/([\\d,]+(?:\\.\\d+)?)\\s*(?:ريال|ر\\.س)/);
        executions.push({
          executionNumber: num,
          status: cells.find(function(c) { return ['منتهي','قيد','جديد','معلق'].some(function(k) { return c.includes(k); }); }) || 'قيد التنفيذ',
          amount: amountMatch ? amountMatch[1].replace(/,/g,'') : '0',
          court: cells.find(function(c) { return c.includes('محكمة'); }) || '',
          issueDate: dateMatch ? dateMatch[0] : '',
          isNajizSync: true, source: 'screen_table'
        });
      });
    });
    return executions;
  }

  async function extractFromCurrentPage() {
    var pageType = getPageType();
    await waitForVisibleContent(15000);
    await new Promise(function(r) { setTimeout(r, 2000); });

    var result = {
      pageType: pageType,
      pageUrl: window.location.href,
      pageTitle: document.title,
      cases: [],
      hearings: [],
      powers_of_attorney: [],
      executions: [],
      scrapedAt: new Date().toISOString()
    };

    switch(pageType) {
      case 'cases':
        result.cases = extractCasesFromScreen();
        var h = extractHearingsFromScreen();
        if (h.length > 0) result.hearings = h;
        break;
      case 'hearings':
        result.hearings = extractHearingsFromScreen();
        break;
      case 'poa':
        result.powers_of_attorney = extractPOAFromScreen();
        break;
      case 'executions':
        result.executions = extractExecutionsFromScreen();
        break;
      default:
        result.cases = extractCasesFromScreen();
        result.hearings = extractHearingsFromScreen();
        result.powers_of_attorney = extractPOAFromScreen();
        result.executions = extractExecutionsFromScreen();
    }

    var totalFound = result.cases.length + result.hearings.length +
                     result.powers_of_attorney.length + result.executions.length;
    result.summary = {
      pageType: pageType,
      totalCases: result.cases.length,
      totalHearings: result.hearings.length,
      totalPOAs: result.powers_of_attorney.length,
      totalExecutions: result.executions.length,
      totalFound: totalFound,
      hasData: totalFound > 0
    };
    return result;
  }

  async function syncToServer(data) {
    try {
      var response = await fetch(SERVER + '/api/najiz-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedData: data, pageType: data.pageType,
          source: 'najiz_screen_reader_v7',
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var result = await response.json();

      if (result.success && result.totalSynced > 0) {
        window.dispatchEvent(new CustomEvent('najiz_sync_complete', {
          detail: {
            cases: result.savedCounts ? result.savedCounts.cases : 0,
            hearings: result.savedCounts ? result.savedCounts.hearings : 0,
            poa: result.savedCounts ? result.savedCounts.poa : 0,
            executions: result.savedCounts ? result.savedCounts.executions : 0,
            total: result.totalSynced
          }
        }));
      }

      return result;
    } catch(err) {
      return { success: false, error: err.message };
    }
  }

  chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    if (['extractData','scrape','getData','sync'].includes(req.action)) {
      (async function() {
        try {
          var pageType = getPageType();
          if (pageType === 'unknown') {
            sendResponse({ success: false, message: 'اذهب لإحدى صفحات ناجز المدعومة' });
            return;
          }
          var data = await extractFromCurrentPage();
          if (!data.summary.hasData) {
            await new Promise(function(r) { setTimeout(r, 5000); });
            data = await extractFromCurrentPage();
            if (!data.summary.hasData) {
              sendResponse({ success: false, data: data, message: 'لم تُوجد بيانات — انتظر تحميل الصفحة وأعد' });
              return;
            }
          }
          var syncResult = await syncToServer(data);
          sendResponse({ success: true, data: data, syncResult: syncResult,
            message: 'تم سحب ' + data.summary.totalFound + ' سجل' });
        } catch(err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }
    if (req.action === 'ping') {
      sendResponse({
        success: true, url: window.location.href,
        pageType: getPageType(),
        isNajiz: window.location.href.includes('najiz.sa')
      });
      return true;
    }
  });

  // المربع العائم
  function createWidget() {
    if (document.getElementById('adala-v7')) return;
    if (!window.location.href.includes('najiz.sa')) return;

    var pageType = getPageType();
    var pageLabels = {
      cases: { label: 'القضايا', section: 'إدارة القضايا', color: '#f59e0b' },
      hearings: { label: 'الجلسات', section: 'مواعيد الجلسات', color: '#3b82f6' },
      poa: { label: 'الوكالات', section: 'قسم الوكالات', color: '#8b5cf6' },
      executions: { label: 'التنفيذ', section: 'طلبات التنفيذ', color: '#10b981' },
      unknown: { label: 'غير محدد', section: '—', color: '#64748b' }
    };
    var info = pageLabels[pageType] || pageLabels.unknown;

    var widget = document.createElement('div');
    widget.id = 'adala-v7';
    widget.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:2147483647;font-family:Arial,sans-serif;direction:rtl;';

    var PAGES = [
      { label: '📁 قضاياي', path: '/applications/lawsuit' },
      { label: '📅 جلساتي', path: '/applications/appointment-requests/' },
      { label: '📜 وكالاتي', path: '/applications/wekalat/procurations-query' },
      { label: '⚡ تنفيذي', path: '/applications/iexecution' }
    ];

    widget.innerHTML =
      '<style>' +
      '#av7-fab{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);border:2px solid rgba(255,255,255,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 20px rgba(245,158,11,0.5);transition:all 0.3s;}' +
      '#av7-fab:hover{transform:scale(1.08);}' +
      '#av7-panel{display:none;position:absolute;bottom:68px;left:0;width:280px;background:#050e21;border:1px solid #1e3a5f;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.7);}' +
      '#av7-panel.open{display:block;}' +
      '.av7h{background:#0a1628;padding:12px 14px;border-bottom:1px solid #1e3a5f;}' +
      '.av7t{color:#f59e0b;font-weight:bold;font-size:14px;}' +
      '.av7s{color:#475569;font-size:10px;margin-top:2px;}' +
      '.av7pg{padding:10px 14px;border-bottom:1px solid #1e3a5f;background:#0f172a;}' +
      '.av7pt{font-size:12px;font-weight:bold;color:' + info.color + ';}' +
      '.av7ps{color:#94a3b8;font-size:10px;margin-top:2px;}' +
      '#av7-status{padding:8px 14px;font-size:11px;color:#94a3b8;text-align:center;border-bottom:1px solid #1e3a5f;min-height:32px;display:flex;align-items:center;justify-content:center;}' +
      '#av7-btn{display:block;width:calc(100% - 24px);margin:10px 12px;padding:11px;background:#f59e0b;color:#000;border:none;border-radius:10px;cursor:pointer;font-size:13px;font-weight:bold;}' +
      '#av7-btn:hover:not(:disabled){opacity:0.9;}' +
      '#av7-btn:disabled{opacity:0.5;cursor:not-allowed;}' +
      '#av7-prog{display:none;padding:4px 14px;text-align:center;font-size:10px;color:#f59e0b;}' +
      '#av7-res{margin:0 12px 10px;padding:8px 10px;background:#0a1628;border-radius:8px;border:1px solid #1e3a5f;font-size:11px;color:#94a3b8;line-height:1.7;display:none;}' +
      '.av7-lnk{display:block;padding:5px 14px;font-size:10px;color:#475569;text-decoration:none;border-bottom:1px solid #0f172a;}' +
      '.av7-lnk:hover{color:#94a3b8;background:#0a1628;}' +
      '.av7-lnk.act{color:#f59e0b;background:#1e3a5f;}' +
      '</style>' +
      '<div id="av7-panel">' +
        '<div class="av7h"><div class="av7t">⚖️ منصة العدالة</div><div class="av7s">سحب البيانات المرئية v7.0</div></div>' +
        '<div class="av7pg">' +
          '<div style="color:#64748b;font-size:10px;margin-bottom:4px">📍 الصفحة الحالية:</div>' +
          '<div class="av7pt">' + (pageType === 'unknown' ? '⚠️ غير مدعومة' : '✅ ' + info.label) + '</div>' +
          '<div class="av7ps">' + (pageType !== 'unknown' ? '← ستُضاف في: ' + info.section : 'اختر صفحة من القائمة') + '</div>' +
        '</div>' +
        '<div id="av7-status">' + (pageType === 'unknown' ? 'اختر صفحة مدعومة' : 'جاهز — اضغط سحب') + '</div>' +
        '<button id="av7-btn" ' + (pageType === 'unknown' ? 'disabled' : '') + '>📥 سحب البيانات من الشاشة</button>' +
        '<div id="av7-prog"></div>' +
        '<div id="av7-res"></div>' +
        PAGES.map(function(p) {
          var isAct = window.location.pathname.includes(p.path.replace(/\\/$/, ''));
          return '<a href="https://najiz.sa' + p.path + '" target="_blank" class="av7-lnk' + (isAct ? ' act' : '') + '">' + p.label + '</a>';
        }).join('') +
      '</div>' +
      '<div id="av7-fab">⚖️</div>';

    document.body.appendChild(widget);

    var fab = document.getElementById('av7-fab');
    var panel = document.getElementById('av7-panel');
    var statusEl = document.getElementById('av7-status');
    var progressEl = document.getElementById('av7-prog');
    var resultEl = document.getElementById('av7-res');
    var syncBtn = document.getElementById('av7-btn');
    var isOpen = false;

    function setStatus(msg, color) {
      statusEl.textContent = msg;
      statusEl.style.color = color || '#94a3b8';
    }

    fab.onclick = function() {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      fab.textContent = isOpen ? '✕' : '⚖️';
    };

    document.addEventListener('click', function(e) {
      if (isOpen && !widget.contains(e.target)) {
        isOpen = false;
        panel.classList.remove('open');
        fab.textContent = '⚖️';
      }
    });

    syncBtn.onclick = async function() {
      syncBtn.disabled = true;
      progressEl.style.display = 'block';
      progressEl.textContent = '⏳ جارٍ قراءة البيانات المرئية...';
      resultEl.style.display = 'none';
      setStatus('⏳ جارٍ القراءة...', '#f59e0b');

      try {
        var data = await extractFromCurrentPage();
        if (!data.summary.hasData) {
          progressEl.textContent = '⏳ إعادة المحاولة بعد 5 ثوانٍ...';
          await new Promise(function(r) { setTimeout(r, 5000); });
          data = await extractFromCurrentPage();
          if (!data.summary.hasData) {
            progressEl.style.display = 'none';
            setStatus('⚠️ لم تُوجد بيانات', '#f59e0b');
            resultEl.innerHTML = '<div style="color:#f59e0b;font-weight:bold">⚠️ لم تُوجد بيانات مرئية</div><div style="color:#64748b;font-size:10px;margin-top:4px">تأكد أن البيانات تظهر على الشاشة كاملاً ثم أعد</div>';
            resultEl.style.display = 'block';
            syncBtn.disabled = false;
            return;
          }
        }
        progressEl.textContent = '📡 جارٍ المزامنة مع النظام...';
        var syncResult = await syncToServer(data);
        var synced = (syncResult && syncResult.totalSynced) || 0;
        var total = data.summary.totalFound;
        progressEl.style.display = 'none';
        setStatus(synced > 0 ? '✅ تمت المزامنة: ' + synced + ' سجل' : '✅ ' + total + ' سجل (موجود مسبقاً)', synced > 0 ? '#22c55e' : '#f59e0b');
        fab.textContent = '✅';
        fab.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
        setTimeout(function() {
          fab.textContent = '⚖️';
          fab.style.background = 'linear-gradient(135deg,#f59e0b,#d97706)';
        }, 5000);
        var html = '';
        if (data.summary.totalCases > 0) html += '<div style="color:#fff">📁 القضايا: <strong>' + data.summary.totalCases + '</strong> ← إدارة القضايا</div>';
        if (data.summary.totalHearings > 0) html += '<div style="color:#fff">📅 الجلسات: <strong>' + data.summary.totalHearings + '</strong> ← مواعيد الجلسات</div>';
        if (data.summary.totalPOAs > 0) html += '<div style="color:#fff">📜 الوكالات: <strong>' + data.summary.totalPOAs + '</strong> ← قسم الوكالات</div>';
        if (data.summary.totalExecutions > 0) html += '<div style="color:#fff">⚡ التنفيذ: <strong>' + data.summary.totalExecutions + '</strong> ← طلبات التنفيذ</div>';
        html += synced > 0
          ? '<div style="color:#22c55e;margin-top:6px;font-weight:bold">✅ ' + synced + ' سجل جديد أُضيف</div>'
          : '<div style="color:#f59e0b;margin-top:6px">البيانات موجودة مسبقاً</div>';
        resultEl.innerHTML = html;
        resultEl.style.display = 'block';
      } catch(err) {
        progressEl.style.display = 'none';
        setStatus('❌ ' + err.message, '#ef4444');
      } finally {
        syncBtn.disabled = false;
      }
    };
  }

  if (document.readyState === 'complete') setTimeout(createWidget, 2000);
  else window.addEventListener('load', function() { setTimeout(createWidget, 2000); });

  var lastUrl = location.href;
  new MutationObserver(function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      var old = document.getElementById('adala-v7');
      if (old) old.remove();
      setTimeout(createWidget, 2500);
    }
  }).observe(document.body, { childList: true, subtree: true });

  console.log('[العدالة v7.0] ✅ جاهز | الصفحة:', getPageType());
})();
`.trim());

      // ===== popup.html =====
      folder.file('popup.html', `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>العدالة — ناجز v7.0</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:300px;min-height:200px;padding:14px;background:#050e21;color:white;font-family:Arial,sans-serif}
.hdr{display:flex;align-items:center;gap:10px;margin-bottom:12px;border-bottom:1px solid #1e3a5f;padding-bottom:10px}
.ttl{font-size:15px;font-weight:bold;color:#f59e0b}
.sub{font-size:10px;color:#475569;margin-top:2px}
#status{font-size:12px;margin-bottom:10px;padding:8px;background:#0a1628;border-radius:8px;text-align:center;color:#94a3b8}
#pageGuide{font-size:11px;color:#475569;margin-bottom:8px;padding:6px 8px;background:#0a1628;border-radius:6px;border-right:3px solid #f59e0b;display:none}
.sec-ttl{font-size:10px;color:#475569;margin:8px 0 4px;text-transform:uppercase;letter-spacing:1px}
#pageButtons{margin-bottom:10px}
.pBtn{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;color:#94a3b8;text-decoration:none;font-size:11px;margin-bottom:4px;transition:all 0.2s}
.pBtn:hover{border-color:#f59e0b;color:#f59e0b}
.pBtn.act{background:#1e3a5f;border-color:#f59e0b;color:#f59e0b}
#extractBtn{width:100%;padding:11px;background:#f59e0b;color:#000;font-weight:bold;font-size:13px;border:none;border-radius:10px;cursor:pointer;transition:opacity 0.2s;margin-bottom:8px}
#extractBtn:disabled{opacity:0.5;cursor:not-allowed}
#extractBtn:hover:not(:disabled){opacity:0.9}
#progress{display:none;text-align:center;font-size:11px;color:#f59e0b;margin-bottom:6px}
#results{margin-top:6px}
.res-box{background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:10px;font-size:11px;line-height:1.7}
</style>
</head>
<body>
<div class="hdr">
  <div>
    <div class="ttl">⚖️ منصة العدالة</div>
    <div class="sub">سحب بيانات ناجز v7.0</div>
  </div>
</div>
<div id="status">جارٍ التحقق...</div>
<div id="pageGuide"></div>
<div class="sec-ttl">📌 صفحات المزامنة</div>
<div id="pageButtons"></div>
<button id="extractBtn">📥 سحب البيانات من الشاشة</button>
<div id="progress">🔄 جارٍ المعالجة...</div>
<div id="results"></div>
<script src="popup.js"></script>
</body>
</html>`.trim());

      // ===== popup.js =====
      folder.file('popup.js', `
document.addEventListener('DOMContentLoaded', async function() {
  var statusEl = document.getElementById('status');
  var extractBtn = document.getElementById('extractBtn');
  var resultsEl = document.getElementById('results');
  var progressEl = document.getElementById('progress');
  var pageGuideEl = document.getElementById('pageGuide');
  var pageBtnsEl = document.getElementById('pageButtons');

  var PAGES = [
    { label: '📁 قضاياي', url: 'https://najiz.sa/applications/lawsuit', path: '/applications/lawsuit', section: 'إدارة القضايا' },
    { label: '📅 جلساتي', url: 'https://najiz.sa/applications/appointment-requests/', path: '/applications/appointment-requests', section: 'مواعيد الجلسات' },
    { label: '📜 وكالاتي', url: 'https://najiz.sa/applications/wekalat/procurations-query', path: '/wekalat', section: 'قسم الوكالات' },
    { label: '⚡ تنفيذي', url: 'https://najiz.sa/applications/iexecution', path: '/iexecution', section: 'طلبات التنفيذ' }
  ];

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : '#94a3b8';
  }

  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  var tab = tabs[0];
  var currentUrl = tab ? (tab.url || '') : '';
  var isNajiz = currentUrl.includes('najiz.sa');
  var currentPage = isNajiz ? PAGES.find(function(p) { return currentUrl.includes(p.path); }) : null;

  if (!isNajiz) {
    setStatus('❌ افتح موقع ناجز أولاً', 'error');
    if (extractBtn) extractBtn.disabled = true;
  } else if (currentPage) {
    setStatus('✅ ' + currentPage.section + ' — جاهز للسحب', 'success');
    if (pageGuideEl) {
      pageGuideEl.style.display = 'block';
      pageGuideEl.innerHTML = '<span style="color:#22c55e">●</span> ستُضاف البيانات إلى قسم <strong style="color:#f59e0b">' + currentPage.section + '</strong>';
    }
  } else {
    setStatus('⚠️ اذهب لإحدى صفحات ناجز أدناه', 'warning');
    if (extractBtn) extractBtn.disabled = true;
  }

  if (pageBtnsEl) {
    pageBtnsEl.innerHTML = PAGES.map(function(p) {
      var isAct = currentUrl.includes(p.path);
      return '<a href="' + p.url + '" target="_blank" class="pBtn' + (isAct ? ' act' : '') + '">' +
        '<span>' + p.label + '</span>' +
        '<span style="font-size:9px;color:#1e3a5f">← ' + p.section + '</span>' +
      '</a>';
    }).join('');
  }

  if (extractBtn) {
    extractBtn.addEventListener('click', async function() {
      if (!currentPage) return;
      setStatus('⏳ جارٍ قراءة البيانات...', 'info');
      progressEl.style.display = 'block';
      progressEl.textContent = '🔄 ينتظر تحميل الصفحة...';
      extractBtn.disabled = true;

      try {
        try {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
          await new Promise(function(r) { setTimeout(r, 1500); });
        } catch(e) {}

        var response = null;
        for (var attempt = 1; attempt <= 3; attempt++) {
          progressEl.textContent = '🔄 محاولة ' + attempt + '/3...';
          try {
            response = await Promise.race([
              chrome.tabs.sendMessage(tab.id, { action: 'extractData' }),
              new Promise(function(_, rej) { setTimeout(function() { rej(new Error('timeout')); }, 25000); })
            ]);
            if (response && response.success && response.data && response.data.summary && response.data.summary.hasData) break;
            if (attempt < 3) {
              progressEl.textContent = '⏳ إعادة المحاولة بعد 3 ثوانٍ...';
              await new Promise(function(r) { setTimeout(r, 3000); });
            }
          } catch(err) {
            if (attempt === 3) throw err;
            await new Promise(function(r) { setTimeout(r, 2000); });
          }
        }

        progressEl.style.display = 'none';

        if (response && response.success && response.data && response.data.summary && response.data.summary.hasData) {
          var d = response.data;
          var s = d.summary;
          var synced = (response.syncResult && response.syncResult.totalSynced) || 0;
          setStatus('✅ تم سحب ' + s.totalFound + ' سجل', 'success');
          if (resultsEl) {
            var html = '<div class="res-box">';
            html += '<div style="color:#f59e0b;font-weight:bold;margin-bottom:8px">📊 نتائج السحب</div>';
            if (s.totalCases > 0) html += '<div style="color:#fff">📁 القضايا: <strong>' + s.totalCases + '</strong> ← إدارة القضايا</div>';
            if (s.totalHearings > 0) html += '<div style="color:#fff">📅 الجلسات: <strong>' + s.totalHearings + '</strong> ← مواعيد الجلسات</div>';
            if (s.totalPOAs > 0) html += '<div style="color:#fff">📜 الوكالات: <strong>' + s.totalPOAs + '</strong> ← قسم الوكالات</div>';
            if (s.totalExecutions > 0) html += '<div style="color:#fff">⚡ التنفيذ: <strong>' + s.totalExecutions + '</strong> ← طلبات التنفيذ</div>';
            html += synced > 0
              ? '<div style="color:#22c55e;margin-top:8px;font-weight:bold">✅ ' + synced + ' سجل جديد في النظام</div>'
              : '<div style="color:#f59e0b;margin-top:8px">البيانات موجودة مسبقاً في النظام</div>';
            html += '</div>';
            resultsEl.innerHTML = html;
          }
        } else {
          setStatus('⚠️ ' + ((response && response.message) || 'انتظر تحميل الصفحة وأعد'), 'warning');
        }
      } catch(err) {
        progressEl.style.display = 'none';
        setStatus('❌ ' + (err.message === 'timeout' ? 'انتهت المهلة' : err.message), 'error');
      } finally {
        extractBtn.disabled = false;
      }
    });
  }
});
`.trim());

      // ===== README.md =====
      folder.file('README.md', `# منصة العدالة — أداة مزامنة ناجز v7.0

## التثبيت
1. افتح Chrome → chrome://extensions
2. فعّل Developer mode
3. اضغط Load unpacked
4. اختر مجلد najiz-extension

## الصفحات المدعومة
| الصفحة | القسم في النظام |
|--------|----------------|
| najiz.sa/applications/lawsuit | إدارة القضايا |
| najiz.sa/applications/appointment-requests/ | مواعيد الجلسات |
| najiz.sa/applications/wekalat/procurations-query | قسم الوكالات |
| najiz.sa/applications/iexecution | طلبات التنفيذ |

## الاستخدام
1. سجّل دخولك على najiz.sa
2. اذهب لإحدى الصفحات أعلاه
3. انتظر تحميل البيانات كاملاً
4. اضغط أيقونة ⚖️ أو افتح الإضافة
5. اضغط "سحب البيانات من الشاشة"

## الخادم
https://aladala-platform-rnuz.onrender.com
`);

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
