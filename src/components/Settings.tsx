/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Key, 
  Sliders, 
  Globe, 
  RefreshCw, 
  Palette, 
  CheckCircle, 
  AlertCircle, 
  CheckSquare, 
  Send,
  Database,
  Lock,
  User,
  ShieldAlert,
  SlidersHorizontal,
  Clock,
  Gem,
  Calendar as CalendarIcon,
  Users,
  Save,
  Plus,
  Image,
  Building2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useFirebase } from '@/contexts/FirebaseContext';

interface SentEmail {
  id: string;
  timestamp: string;
  clientEmail: string;
  clientName: string;
  caseNumber: string;
  caseName: string;
  oldStatus: string;
  newStatus: string;
  subject: string;
  status: string;
}

interface SettingsProps {
  colorTheme?: string;
  onColorThemeChange?: (theme: string) => void;
  customRoles?: any;
  onCustomRolesChange?: (roles: any) => void;
  darkGradientTheme?: string;
  onDarkGradientThemeChange?: (theme: string) => void;
  highContrastMode?: boolean;
  onHighContrastModeChange?: (enabled: boolean) => void;
  isDarkMode?: boolean;
  onDarkModeChange?: (enabled: boolean) => void;
}

export const STATIC_GRADIENT_THEMES = [
  { id: 'midnight', name: 'أزرق الليل الملكي (Royal Midnight)', from: '#0b1329', to: '#041a45', border: '#1e3a8a', desc: 'تدرج كحلي كلاسيكي عميق غامق وهادئ للأعين' },
  { id: 'slate', name: 'الرمادي السيبراني المتطور (Classic Slate)', from: '#1e293b', to: '#020617', border: '#475569', desc: 'لون رمادي سيبراني مفعم برونق الاستقرار والعملية' },
  { id: 'emerald', name: 'الأخضر الزمردي المريح للعين (Forest Green)', from: '#022c22', to: '#064e3b', border: '#065f46', desc: 'مزيج زمردي منعش يقلل التعب البصري تماماً' },
  { id: 'sepia', name: 'العسلي الدافئ المريح (Warm Charcoal Brown)', from: '#2e180d', to: '#0c0500', border: '#78350f', desc: 'ألوان ترابية غنية مستوحاة من البيئات المكتبية العريقة لراحة فائقة' },
  { id: 'imperial', name: 'البنفسجي الإمبراطوري المتفرد (Amethyst Royal)', from: '#1e1b4b', to: '#090514', border: '#312e81', desc: 'تدرج أرجواني وبنفسجي ملكي يضفي أناقة استثنائية لمكتبك' },
  { id: 'blackout', name: 'الأسود المطلق فائق التباين (Jet Blackout)', from: '#000000', to: '#050505', border: '#111111', desc: 'أسود معتم بالكامل مع تباين فائق السرعة والأداء' },
  { id: 'royal-gold', name: 'ذهب النخبة الملكي (Elite Slate Gold)', from: '#111622', to: '#080c14', border: '#d4af37', desc: 'مزيج ذهبي وبني ملكي فخم يعكس الفخامة المطلقة والأصالة القضائية' },
  { id: 'serene-blue', name: 'أزرق البحيرات الهادئ (Serene Lake Blue)', from: '#0f1e36', to: '#070d17', border: '#3b82f6', desc: 'أزرق مائي هادئ وعميق مصمم ومختص براحة العينين الفائقة' },
  { id: 'warm-ash', name: 'الرماد الدافئ المخملي (Velvet Warm Ash)', from: '#1a1a1e', to: '#0f0f12', border: '#8da2bb', desc: 'مزيج دافئ ومريح من رمادي المحيط والكرتون يمتص انعكاس الضوء الضار' },
  { id: 'desert-olive', name: 'الزيتوني الصحراوي المهدئ (Desert Olive)', from: '#14221a', to: '#0a110d', border: '#84cc16', desc: 'لون زيتوني صحراوي مهدئ ومريح للأعين في الإضاءة الخافتة والمطالعة الطويلة' },
  { id: 'abyss', name: 'أزرق الأعماق الاسترخائي (Abyss Blue)', from: '#0f172a', to: '#020617', border: '#1e293b', desc: 'تدرج أزرق داكن يمتص الأشعة العالية لراحة تدوم لساعات' },
  { id: 'jade', name: 'اليشم الأخضر الهادئ (Soft Jade)', from: '#14532d', to: '#064e3b', border: '#065f46', desc: 'أخضر داكن هادئ مع ظلال ناعمة تقلل إرهاق العين' },
  { id: 'coffee', name: 'القهوة الداكنة (Dark Coffee)', from: '#3f2b1c', to: '#1c130d', border: '#78350f', desc: 'تدرج بُني داكن مريح مصمم للمعاينة الليلية لتقليل إجهاد النظر' },
  { id: 'sapphire', name: 'تدرج الياقوت الأزرق (Deep Sapphire)', from: '#172554', to: '#080f26', border: '#1d4ed8', desc: 'مزيج ياقوتي غني متناغم مع الإضاءة المنخفضة ويعكس الرقي' }
];

const ensureKpisFirst = (items: any[]) => {
  if (!Array.isArray(items)) return items;
  const kpis = ['kpiCases', 'kpiClients', 'kpiInvoices', 'kpiTasks'];
  const orderedKpis = kpis.map(id => {
    return items.find(w => w.id === id);
  }).filter(Boolean);
  const others = items.filter(w => !kpis.includes(w.id));
  return [...orderedKpis, ...others];
};

export default function Settings({ 
  customRoles,
  onCustomRolesChange,
  darkGradientTheme = 'midnight',
  onDarkGradientThemeChange,
  highContrastMode = false,
  onHighContrastModeChange,
  isDarkMode = false,
  onDarkModeChange
}: SettingsProps) {
  const { profile } = useFirebase();
  // Sync config
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable roles
  const [editableRoles, setEditableRoles] = useState(customRoles || {
    admin: 'شريك أول / مدير المكتب 👑',
    lawyer: 'محامي مُترافع ⚖️',
    researcher: 'باحث ومستشار قانوني 🎓',
    secretary: 'سكرتير إداري 📅',
    accountant: 'محاسب مالي 💰',
    subscriber: 'العميل (حساب العميل) 👤'
  });

  // SMTP Settings (local states loaded from and saved to localStorage or simulated in memory)
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('postmaster@sandbox.mailgun.org');
  const [smtpPass, setSmtpPass] = useState('**********');
  const [smtpFrom, setSmtpFrom] = useState('justice-notifications@mail.sa');
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpSuccess, setSmtpSuccess] = useState(false);

  // States for customThemes dynamic sync
  const [customThemes, setCustomThemes] = useState<{ id: string; name: string; from: string; to: string; border: string; desc?: string }[]>(() => {
    try {
      const stored = localStorage.getItem('adalah-custom-themes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('adalah-custom-themes');
        if (stored) setCustomThemes(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener('adalah-custom-themes-updated', handleUpdate);
    return () => {
      window.removeEventListener('adalah-custom-themes-updated', handleUpdate);
    };
  }, []);

  // States for advanced customization sliders
  const [advancedConfigEnabled, setAdvancedConfigEnabled] = useState(() => {
    return localStorage.getItem('adalah-advanced-config-enabled') === 'true';
  });
  const [elegantGoldMode, setElegantGoldMode] = useState(() => {
    return localStorage.getItem('adalah-elegant-gold-mode') === 'true';
  });
  const [cardRadius, setCardRadius] = useState(() => {
    return localStorage.getItem('adalah-card-border-radius') || '20px';
  });
  const [cardShadowIntensity, setCardShadowIntensity] = useState(() => {
    return localStorage.getItem('adalah-card-shadow-intensity') || '1';
  });
  const [cardBgOpacity, setCardBgOpacity] = useState(() => {
    return localStorage.getItem('adalah-card-bg-opacity') || '1';
  });
  const [cardTransitionSpeed, setCardTransitionSpeed] = useState(() => {
    return localStorage.getItem('adalah-card-transition-duration') || '0.4';
  });
  const [cardCustomBgColor, setCardCustomBgColor] = useState(() => {
    return localStorage.getItem('adalah-card-bg-color') || '';
  });

  const [visionPreset, setVisionPreset] = useState(() => {
    return localStorage.getItem('adalah-vision-preset') || 'default';
  });

  const [visionSat, setVisionSat] = useState(() => {
    return parseFloat(localStorage.getItem('adalah-vision-sat') || '1.0');
  });
  const [visionBright, setVisionBright] = useState(() => {
    return parseFloat(localStorage.getItem('adalah-vision-bright') || '1.0');
  });
  const [visionCont, setVisionCont] = useState(() => {
    return parseFloat(localStorage.getItem('adalah-vision-cont') || '1.0');
  });

  // Effect to apply vision preset on load or slider change
  useEffect(() => {
    const presets: any = {
      default: { sat: 1, bright: 1, cont: 1 },
      reader: { sat: 0.8, bright: 0.9, cont: 1.1 },
      high: { sat: 1.2, bright: 1.1, cont: 1.3 },
      night: { sat: 0.4, bright: 0.8, cont: 1.2 },
      warm_evening: { sat: 0.65, bright: 0.85, cont: 1.12 },
      midnight_reading: { sat: 0.45, bright: 0.75, cont: 1.05 },
      velvet_blue: { sat: 0.55, bright: 0.90, cont: 1.15 },
      contrast_gold: { sat: 1.10, bright: 1.05, cont: 1.30 }
    };

    let p = presets[visionPreset];
    if (visionPreset === 'custom') {
      p = { sat: visionSat, bright: visionBright, cont: visionCont };
    } else if (p) {
      setVisionSat(p.sat);
      setVisionBright(p.bright);
      setVisionCont(p.cont);
    } else {
      p = presets.default;
    }

    document.documentElement.style.setProperty('--preset-saturation', p.sat.toString());
    document.documentElement.style.setProperty('--preset-brightness', p.bright.toString());
    document.documentElement.style.setProperty('--preset-contrast', p.cont.toString());
    
    // Also export for high contrast classes targeting
    document.documentElement.style.setProperty('--high-contrast-sat', p.sat.toString());
    document.documentElement.style.setProperty('--high-contrast-bright', p.bright.toString());
    document.documentElement.style.setProperty('--high-contrast-cont', p.cont.toString());

    localStorage.setItem('adalah-vision-preset', visionPreset);
    localStorage.setItem('adalah-vision-sat', p.sat.toString());
    localStorage.setItem('adalah-vision-bright', p.bright.toString());
    localStorage.setItem('adalah-vision-cont', p.cont.toString());
  }, [visionPreset, visionSat, visionBright, visionCont]);

  // Custom theme editor states
  const [themeName, setThemeName] = useState('');
  const [gradientFrom, setGradientFrom] = useState('#1e293b');
  const [gradientTo, setGradientTo] = useState('#020617');
  const [borderAccent, setBorderAccent] = useState('#475569');

  React.useEffect(() => {
    localStorage.setItem('adalah-advanced-config-enabled', advancedConfigEnabled.toString());
    localStorage.setItem('adalah-elegant-gold-mode', elegantGoldMode.toString());
    if (advancedConfigEnabled) {
      localStorage.setItem('adalah-card-border-radius', cardRadius);
      localStorage.setItem('adalah-card-shadow-intensity', cardShadowIntensity);
      localStorage.setItem('adalah-card-bg-opacity', cardBgOpacity);
      localStorage.setItem('adalah-card-transition-duration', cardTransitionSpeed);
      localStorage.setItem('adalah-card-bg-color', cardCustomBgColor);
      document.documentElement.style.setProperty('--card-transition-speed', `${cardTransitionSpeed}s`);
      if (cardCustomBgColor) {
         document.documentElement.style.setProperty('--card-bg-color', cardCustomBgColor);
      } else {
         document.documentElement.style.removeProperty('--card-bg-color');
      }
    } else {
      localStorage.removeItem('adalah-card-border-radius');
      localStorage.removeItem('adalah-card-shadow-intensity');
      localStorage.removeItem('adalah-card-bg-opacity');
      localStorage.removeItem('adalah-card-transition-duration');
      localStorage.removeItem('adalah-card-bg-color');
      document.documentElement.style.removeProperty('--card-transition-speed');
      document.documentElement.style.removeProperty('--card-bg-color');
    }
    window.dispatchEvent(new Event('adalah-advanced-config-updated'));
    window.dispatchEvent(new Event('adalah-card-transition-updated'));
  }, [advancedConfigEnabled, elegantGoldMode, cardRadius, cardShadowIntensity, cardBgOpacity, cardTransitionSpeed, cardCustomBgColor]);

  const handleCreateCustomTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeName.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newTheme = {
      id: newId,
      name: `${themeName} (مخصص 🎨)`,
      from: gradientFrom,
      to: gradientTo,
      border: borderAccent
    };

    let existingCustom: any[] = [];
    try {
      const stored = localStorage.getItem('adalah-custom-themes');
      if (stored) existingCustom = JSON.parse(stored);
    } catch (err) {}

    const updatedThemes = [...existingCustom, newTheme];
    localStorage.setItem('adalah-custom-themes', JSON.stringify(updatedThemes));
    window.dispatchEvent(new Event('adalah-custom-themes-updated'));

    if (onDarkGradientThemeChange) {
      onDarkGradientThemeChange(newId);
    }

    setThemeName('');
    alert(`تم بنجاح تركيب ثيم "${themeName}" كخيار رسمي وإضافته لقائمة المظهر وحفظه بالخلفية! ✨`);
  };

  // Test Email dispatch states
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailSentLogs, setEmailSentLogs] = useState<SentEmail[]>([]);

  // Database Backup States
  const [isBackupConfOpen, setIsBackupConfOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [backupHistoryList, setBackupHistoryList] = useState<any[]>([]);

  // Office Profile states
  const [officeName, setOfficeName] = useState('منصة العدالة لإدارة مكاتب المحاماة');
  // Najiz API Configuration
  const [najizApiKey, setNajizApiKey] = useState('');
  const [isNajizConnected, setIsNajizConnected] = useState(() => localStorage.getItem('najiz_api_connected') === 'true');
  const [isNajizConnecting, setIsNajizConnecting] = useState(false);

  const [officeLicense, setOfficeLicense] = useState('ترخيص مزاولة مهنة المحاماة رقم 44/291 الصادر عن وزارة العدل');
  const [vatNo, setVatNo] = useState('310182749200003'); // Saudi VAT No.
  const [officeLogo, setOfficeLogo] = useState<string | null>(() => localStorage.getItem('office_logo'));

  // Calendar integration states
  const [isCalendarConnected, setIsCalendarConnected] = useState(() => localStorage.getItem("gcal_connected") === "true");
  const [calendarSelected, setCalendarSelected] = useState(() => localStorage.getItem("gcal_selected") || "lawyer_primary");
  const [isOutlookConnected, setIsOutlookConnected] = useState(() => localStorage.getItem("outlook_connected") === "true");
  const [isCalSyncing, setIsCalSyncing] = useState(false);
  const [calLogs, setCalLogs] = useState<string[]>([]);

  const [whatsappTemplate, setWhatsappTemplate] = useState(() => {
    return localStorage.getItem('adalah-whatsapp-template') || "عزيزي العميل، نود تذكيركم بموعد جلستكم القضائية غداً الموافق {DATE} في تمام الساعة {TIME}. يُرجى التأكد من جاهزيتكم لحضور الجلسة المرئية. مع تحيات مكتب المحاماة.";
  });
  const [whatsappApiKey, setWhatsappApiKey] = useState(() => {
    return localStorage.getItem('adalah-whatsapp-apikey') || "";
  });

  const handleSaveWhatsappMsg = () => {
    localStorage.setItem('adalah-whatsapp-template', whatsappTemplate);
    localStorage.setItem('adalah-whatsapp-apikey', whatsappApiKey);
    alert('تم حفظ إعدادات إشعارات الواتساب بنجاح');
  };

  // Dashboard Modules Visibility & Clean Clutter states
  const [dashboardHideUnusedAuto, setDashboardHideUnusedAuto] = useState(() => localStorage.getItem('dashboard_hide_unused_auto') === 'true');

  // Layout Manager States
  const [visibleCasesCount, setVisibleCasesCount] = useState(() => {
    return parseInt(localStorage.getItem('adalah-visible-cases-count') || '6', 10);
  });
  const [visibleFinancesCount, setVisibleFinancesCount] = useState(() => {
    return parseInt(localStorage.getItem('adalah-visible-finances-count') || '5', 10);
  });
  const [visibleAppointmentsCount, setVisibleAppointmentsCount] = useState(() => {
    return parseInt(localStorage.getItem('adalah-visible-appointments-count') || '5', 10);
  });

  const [showCasesModule, setShowCasesModule] = useState(() => {
    return localStorage.getItem('adalah-show-cases-module') !== 'false';
  });
  const [showFinanceModule, setShowFinanceModule] = useState(() => {
    return localStorage.getItem('adalah-show-finance-module') !== 'false';
  });
  const [showAppointmentsModule, setShowAppointmentsModule] = useState(() => {
    return localStorage.getItem('adalah-show-appointments-module') !== 'false';
  });

  const [dashboardSaveWidgetsSuccess, setDashboardSaveWidgetsSuccess] = useState(false);
  const [widgetsList, setWidgetsList] = useState<any[]>(() => {
    const saved = localStorage.getItem(`dashboard_widgets_config_admin_v2`);
    const defaultList = [
      { id: 'kpiCases', visible: true, name: 'بطاقة إحصائية: القضايا النشطة', desc: 'عدد القضايا النشطة بمكتب المحاماة والعمل الاستشاري.' },
      { id: 'kpiClients', visible: true, name: 'بطاقة إحصائية: الشركات والموكلين', desc: 'أعداد العملاء والشركات النشطة الموثقة.' },
      { id: 'kpiInvoices', visible: true, name: 'بطاقة إحصائية: المحصلات والمالية', desc: 'إجمالي المبالغ والنسب المسددة والتحصيلات القضائية والادارية.' },
      { id: 'kpiTasks', visible: true, name: 'بطاقة إحصائية: الالتزامات الجارية', desc: 'المهام والتكليفات المفتوحة لفريق العمل.' },
      { id: 'employeePerformanceKPI', visible: true, name: 'مؤشرات أداء المستشارين', desc: 'رصد تضامني لسرعة إنجاز الالتزامات ومهام الفريق.' },
      { id: 'summaryAI', visible: true, name: 'مستشار الصياغة والمرافعة بذكاء جيميناي (AI)', desc: 'إنشاء أوراق ومسودات الدفاع والصحائف القانونية بموجب الأنظمة.' },
      { id: 'taskSuggestions', visible: true, name: 'توصيات المهام التلقائية بالذكاء الاصطناعي', desc: 'استكشاف التواريخ العاجلة وعنونة المسؤوليات تلقائياً.' },
      { id: 'legalPerformanceMetrics', visible: true, name: 'تقارير أداء ومخرجات وحسم الدعاوى', desc: 'سرعة الإغلاق والإنتاجية القضائية الإحصائية.' },
      { id: 'upcomingHearingsCard', visible: true, name: 'مواعيد الجلسات والدوائر القضائية', desc: 'قائمة الجلسات المقبلة مع تفاصيل المحكمة والدائرة المعنية بالتبليغ.' },
      { id: 'summaryInvoicesAI', visible: true, name: 'التحليل المالي الذكي للفواتير والتحصيل', desc: 'فحص مالي استشاري بنظام الذكاء الاصطناعي لإجمالي العقود.' },
      { id: 'deadlinesWidget', visible: true, name: 'مراقب المواعيد والمدد القضائية', desc: 'مراقب حثيث وصارم لتفادي تفويت مواعيد الاعتراض أو الاستئناف.' },
      { id: 'summaryPlatform', visible: true, name: 'رابط النظام القضائي الموحد (ناجز والموقع الميداني)', desc: 'متابعة المزامنة السحابية للأنظمة والمنصات الرسمية.' },
      { id: 'summaryCases', visible: true, name: 'الإحصائيات الحية للقضايا والقرارات', desc: 'مؤشرات دائرية ورسوم بيانية تفاعلية لحالة الملفات بالتفصيل.' },
      { id: 'summaryKPI', visible: true, name: 'لوحة استشعار التنبيهات المباشرة', desc: 'إشعار فوري بالجلسات والمهام عاجلة الحل.' },
      { id: 'legalRiskMatrix', visible: true, name: 'مصفوفة المخاطر القانونية والنزاعات', desc: 'توزيع بياني لتحديد درجة خطورة ونفوذ القضايا المالية الشائكة.' },
      { id: 'summaryCalendar', visible: true, name: 'تقويم المراجعات ومواعيد المكتب', desc: 'رؤية تقويمية شاملة واضحة طوال أيام الشهر الجاري.' },
      { id: 'partnerAnalytics', visible: true, name: 'لوحة تفاصيل ميزانية الشركاء', desc: 'متابعة بصرية دقيقة للأرباح والأنشطة المالية المستهدفة.' },
      { id: 'efficiency', visible: true, name: 'مؤشر كفاءة الحسم وتدوير الملفات', desc: 'نسب إغلاق القضايا بالتسوية أو الأحكام القضائية النهائية.' },
      { id: 'agenda', visible: true, name: 'الأجندة القضائية وجلسات المرافعة التفصيلية', desc: 'متابعة خط سير الجلسات يوماً بيوم.' }
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ordered = parsed.map(p => {
            const defItem = defaultList.find(d => d.id === p.id);
            return {
              ...defItem,
              id: p.id,
              visible: p.visible !== false,
              name: defItem?.name || p.id,
              desc: defItem?.desc || ""
            };
          });
          const existingIds = new Set(ordered.map((w: any) => w.id));
          const missing = defaultList.filter(d => !existingIds.has(d.id));
          const combinedList = [...ordered, ...missing];
          return ensureKpisFirst(combinedList);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return defaultList;
  });

  const moveWidgetUp = (index: number) => {
    if (index === 0) return;
    setWidgetsList(prev => {
      const newList = [...prev];
      const temp = newList[index];
      newList[index] = newList[index - 1];
      newList[index - 1] = temp;
      return newList;
    });
  };

  const moveWidgetDown = (index: number) => {
    if (index === widgetsList.length - 1) return;
    setWidgetsList(prev => {
      const newList = [...prev];
      const temp = newList[index];
      newList[index] = newList[index + 1];
      newList[index + 1] = temp;
      return newList;
    });
  };

  const toggleWidgetVisibility = (id: string) => {
    setWidgetsList(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const handleSaveDashboardWidgets = () => {
    localStorage.setItem('dashboard_hide_unused_auto', dashboardHideUnusedAuto ? 'true' : 'false');
    
    // Save Layout Manager States
    localStorage.setItem('adalah-visible-cases-count', visibleCasesCount.toString());
    localStorage.setItem('adalah-visible-finances-count', visibleFinancesCount.toString());
    localStorage.setItem('adalah-visible-appointments-count', visibleAppointmentsCount.toString());
    
    localStorage.setItem('adalah-show-cases-module', showCasesModule ? 'true' : 'false');
    localStorage.setItem('adalah-show-finance-module', showFinanceModule ? 'true' : 'false');
    localStorage.setItem('adalah-show-appointments-module', showAppointmentsModule ? 'true' : 'false');

    const roles = ['admin', 'lawyer', 'researcher', 'secretary', 'secretariat', 'accountant', 'subscriber', 'client'];
    
    roles.forEach(role => {
      const savedConfig = widgetsList.map((w, idx) => ({
        id: w.id,
        visible: w.visible,
        order: idx,
        size: w.id === 'summaryAI' ? 'full' : w.id === 'taskSuggestions' ? 'full' : w.id === 'agenda' ? 'large' : 'half'
      }));
      localStorage.setItem(`dashboard_widgets_config_${role}_v2`, JSON.stringify(savedConfig));
    });

    window.dispatchEvent(new Event('adalah-dashboard-layout-updated'));
    window.dispatchEvent(new Event('storage'));
    
    setDashboardSaveWidgetsSuccess(true);
    setTimeout(() => setDashboardSaveWidgetsSuccess(false), 3000);
  };

  const fetchConfig = async () => {
    try {
      const [resConfig, resEmails, resBackup] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/emails/history'),
        fetch('/api/backup/history')
      ]);
      
      if (resConfig.ok) {
        const data = await resConfig.json();
        setApiKey(data.apiKey || '');
        setWebhookUrl(data.webhookUrl || '');
      }

      if (resEmails.ok) {
        const logs = await resEmails.json();
        setEmailSentLogs(logs);
      }

      if (resBackup.ok) {
        const logs = await resBackup.json();
        setBackupHistoryList(logs);
      }
    } catch (err) {
      console.error('Failed to load settings details:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
    
    // Load SMTP details from dynamic local state of browser
    const localHost = localStorage.getItem('SMTP_HOST');
    const localPort = localStorage.getItem('SMTP_PORT');
    const localUser = localStorage.getItem('SMTP_USER');
    const localPass = localStorage.getItem('SMTP_PASS');
    const localFrom = localStorage.getItem('SMTP_FROM');
    
    if (localHost) setSmtpHost(localHost);
    if (localPort) setSmtpPort(localPort);
    if (localUser) setSmtpUser(localUser);
    if (localPass) setSmtpPass(localPass);
    if (localFrom) setSmtpFrom(localFrom);

    const localOffice = localStorage.getItem('OFFICE_NAME');
    const localLicense = localStorage.getItem('OFFICE_LICENSE');
    const localVat = localStorage.getItem('OFFICE_VAT');
    if (localOffice) setOfficeName(localOffice);
    if (localLicense) setOfficeLicense(localLicense);
    if (localVat) setVatNo(localVat);
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, webhookUrl })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save config:", err);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackupConfOpen(false);
    setIsBackingUp(true);
    setBackupSuccess(false);

    try {
      const res = await fetch('/api/backup/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'شريك أول / مدير مكتب العدالة 👑' })
      });
      if (res.ok) {
        const result = await res.json();
        setBackupSuccess(true);
        if (result.history) {
          setBackupHistoryList(result.history);
        }
        setTimeout(() => setBackupSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Backup trigger failed:', err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSaveSMTP = (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpSuccess(false);

    // Save variables locally
    localStorage.setItem('SMTP_HOST', smtpHost);
    localStorage.setItem('SMTP_PORT', smtpPort);
    localStorage.setItem('SMTP_USER', smtpUser);
    localStorage.setItem('SMTP_PASS', smtpPass);
    localStorage.setItem('SMTP_FROM', smtpFrom);

    // Prompt server environment variables if available or save to mock
    setTimeout(() => {
      setSmtpSaving(false);
      setSmtpSuccess(true);
      setTimeout(() => setSmtpSuccess(false), 3000);
    }, 650);
  };

  
  const handleConnectNajiz = (e: React.FormEvent) => {
    e.preventDefault();
    setIsNajizConnecting(true);
    setTimeout(() => {
      setIsNajizConnecting(false);
      setIsNajizConnected(true);
      localStorage.setItem('najiz_api_connected', 'true');
    }, 1500);
  };
  
  const handleDisconnectNajiz = () => {
    if(confirm('هل أنت متأكد من إلغاء الربط المباشر مع بوابة ناجز؟ سيوقف هذا عمليات الجلب الآلي للجلسات والقضايا الجديدة.')) {
        setIsNajizConnected(false);
        localStorage.removeItem('najiz_api_connected');
        setNajizApiKey('');
    }
  };

  const handleSaveOfficeProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('OFFICE_NAME', officeName);
    localStorage.setItem('OFFICE_LICENSE', officeLicense);
    localStorage.setItem('OFFICE_VAT', vatNo);
    alert('تم حفظ الملف المهني للمكتب في التخزين المحلي للمنصة بنجاح.');
  };

  const handleSaveRoles = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCustomRolesChange) onCustomRolesChange(editableRoles);
    alert('تم تحديث مسميات الأدوار بنجاح وستظهر في الشريط الجانبي والعدالة.');
  };

  const handleConnectCalendar = (type: 'gcal' | 'outlook') => {
    setIsCalSyncing(true);
    setCalLogs(prev => [type === 'gcal' ? "جاري الاتصال بخوادم Google OAuth 2.0..." : "جاري الاتصال بخوادم Microsoft Exchange...", ...prev]);
    setTimeout(() => {
      if (type === 'gcal') {
        setIsCalendarConnected(true);
        localStorage.setItem("gcal_connected", "true");
        setCalLogs(prev => ["✅ متصل بنجاح: تم ربط تقويم Google للمحامي", ...prev]);
      } else {
        setIsOutlookConnected(true);
        localStorage.setItem("outlook_connected", "true");
        setCalLogs(prev => ["✅ متصل بنجاح: تم ربط تقويم Outlook للمحامي", ...prev]);
      }
      setIsCalSyncing(false);
    }, 1500);
  };

  const handleDisconnectCalendar = (type: 'gcal' | 'outlook') => {
    if (confirm(type === 'gcal' ? "هل تريد إلغاء ربط تقويم جوجل وتفكيك الاتصال آلياً؟" : "هل تريد إلغاء ربط تقويم آوتلوك؟")) {
      if (type === 'gcal') {
        setIsCalendarConnected(false);
        localStorage.removeItem("gcal_connected");
      } else {
        setIsOutlookConnected(false);
        localStorage.removeItem("outlook_connected");
      }
      setCalLogs(prev => [`❌ إلغاء الاتصال: تم فك ربط التقويم بشكل سليم.`, ...prev]);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailRecipient) return;

    setEmailSending(true);
    setEmailSentStatus('idle');

    try {
      // Simulate/Trigger Email
      const res = await fetch('/api/state/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cases',
          data: {
            id: 'case-test-' + Date.now(),
            caseNumber: '449102839',
            caseName: 'فحص مالي استرشادي متبادل',
            clientName: 'تطبيق العدالة التجريبي مهيأ',
            clientId: 'client-test',
            status: 'active',
            stage: 'litigation',
            courtName: 'ديوان المظالم - الدائرة الإدارية الأولى'
          }
        })
      });
      
      if (res.ok) {
        setEmailSentStatus('success');
        setTestEmailRecipient('');
        // Refresh email log history instantly
        const resHistory = await fetch('/api/emails/history');
        if (resHistory.ok) {
          const logs = await resHistory.json();
          setEmailSentLogs(logs);
        }
      } else {
        setEmailSentStatus('error');
      }
    } catch (err) {
      console.error('Test dispatch failed:', err);
      setEmailSentStatus('error');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="space-y-6" id="settings-view">
      
      {/* Settings Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-100 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-primary font-bold">⚙️ لوحة التفضيلات وإدارة الربط</span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1">تخصيص تفضيلات العدالة (System Configs)</h1>
            <p className="text-xs text-slate-900 mt-1 leading-relaxed">
              تحكم ببيانات الربط مع إضافة جوجل كروم لسحب قضايا ناجز، مع تهيئة خوادم الإشعارات والبريد التلقائي للموكلين بنظام السجل الموحد.
            </p>
          </div>
        </div>
        
        {profile?.trialExpiresAt && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Clock className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-emerald-700 font-black uppercase tracking-wider">الحساب التجريبي (Trial Account)</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">ينتهي الصلاحية في:</div>
              <div className="text-xs font-mono text-emerald-800 font-bold">
                {new Date(profile.trialExpiresAt).toLocaleString('ar-SA', { 
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT SIDE: Configurations Forms */}
        <div className="lg:col-span-8 space-y-6">

          {/* Office Identity & Logo Management Section - New Interface */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm" id="office-identity-settings">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">الهوية المؤسسية وشعار المكتب</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">تخصيص شعار المكتب وبيانات الترويسة الموحدة لجميع الفواتير والتقارير والسندات الصادرة.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest">شعار المكتب (Office Logo)</label>
                <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 transition-all group relative overflow-hidden h-64 justify-center">
                  {officeLogo ? (
                    <div className="relative group/logo">
                      <img src={officeLogo} alt="Office Logo" className="h-32 object-contain rounded-lg shadow-md" />
                      <button 
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           localStorage.removeItem('office_logo');
                           setOfficeLogo(null);
                           window.dispatchEvent(new Event('storage'));
                         }}
                         className="absolute -top-2 -left-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity shadow-lg"
                      >
                         ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Image className="w-10 h-10 mb-2 transition-transform" />
                      <span className="text-[10px] font-black">اسحب الشعار هنا أو انقر للإرفاق</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          localStorage.setItem('office_logo', base64);
                          setOfficeLogo(base64);
                          window.dispatchEvent(new Event('storage'));
                          alert('✅ تم معالجة ورفع شعار المكتب بنجاح وتحديث ترويسة النظام التلقائية.');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold text-center">يدعم PNG, SVG, JPG. سيتم تحجيم الصورة وتحسين جودتها برمجياً لتناسب التقارير الرسمية.</p>
              </div>

              <form onSubmit={handleSaveOfficeProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900">اسم المكتب (الترويسة الرسمية):</label>
                  <input 
                    type="text" 
                    value={officeName}
                    onChange={e => setOfficeName(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold focus:border-amber-500 outline-none"
                    placeholder="اسم المكتب للتحميل في المطبوعات..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900">الرقم الضريبي (VAT No):</label>
                  <input 
                    type="text" 
                    value={vatNo}
                    onChange={e => setVatNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold font-mono focus:border-amber-500 outline-none"
                    placeholder="3xxxxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-900">نص التذليل / الترخيص:</label>
                  <textarea 
                    value={officeLicense}
                    onChange={e => setOfficeLicense(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold focus:border-amber-500 outline-none h-20 resize-none"
                    placeholder="بيانات الترخيص والمقر..."
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black transition-all shadow-lg flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  حفظ الملف المهني للمكتب
                </button>
              </form>
            </div>
          </div>
          
          {/* Custom Theme Color & Gradient Config for Dark Cards & Backgrounds with Live Preview */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm" id="dark-gradient-picker-card">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <span className="p-1.5 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-lg text-sm">🎨</span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">مظاهر المربعات والخلفيات الداعمة لراحة العين</h2>
                <p className="text-[11px] text-slate-900 mt-0.5">اختر تدرج الألوان المفضل للمربعات الداكنة والخلفيات لعرضها بمزيج مريح للرؤية والمعاينة الحية.</p>
              </div>
            </div>

            {/* Live Preview interactive preview board */}
            <div className="bg-slate-55 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-[11px] font-black text-slate-950 uppercase tracking-widest block">👁️ لوحة المعاينة الحية السريعة (Instant Live Preview):</span>
              <div 
                className="p-5 rounded-xl border border-slate-800 relative overflow-hidden transition-all duration-300 animate-gradient-slow"
                style={{
                  background: `linear-gradient(135deg, ${
                    [...STATIC_GRADIENT_THEMES, ...customThemes].find(t => t.id === darkGradientTheme)?.from || '#0b1329'
                  } 0%, ${
                    [...STATIC_GRADIENT_THEMES, ...customThemes].find(t => t.id === darkGradientTheme)?.to || '#041a45'
                  } 100%)`
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-amber-300 border border-amber-300/30 px-2 py-0.5 rounded uppercase font-bold tracking-widest">مربع تجريبي نموذجى</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                </div>
                <h4 className="text-sm font-black text-white">إحصائيات الملفات القضائية والجلسات المستوردة</h4>
                <p className="text-xs text-white opacity-90 mt-1.5 leading-relaxed">
                  هذا النص مصمم لمحاكاة وضوح القراءه. تضمن فئة <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-[10px] text-yellow-355 font-bold">.text-high-contrast-light-bg</code> تحويل أي نصوص داكنة إلى اللون الأبيض أو الأصفر الفاقع تلقائياً لتفادي الإرهاق البصري.
                </p>
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-white">
                  <div>
                    <span className="block text-[10px] text-white/75 font-semibold">نسبة الرصد:</span>
                    <strong className="text-yellow-355 font-bold">98.4% تباين ممتاز</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/75 font-semibold">حالة راحة العين:</span>
                    <strong className="text-emerald-400 font-bold">تطابق تام لمعايير WCAG</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {[...STATIC_GRADIENT_THEMES, ...customThemes].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onDarkGradientThemeChange && onDarkGradientThemeChange(theme.id)}
                  className={`flex flex-col text-right p-3.5 rounded-xl border text-xs transition-all pointer-events-auto ${
                    darkGradientTheme === theme.id 
                      ? 'border-primary ring-2 ring-primary/10 bg-amber-500/5' 
                      : 'border-slate-800 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-900">{theme.name}</span>
                    <div className="flex gap-1.5 shrink-0 ml-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.from }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.to }}></div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-900 mt-1 font-bold leading-normal">{theme.desc}</span>
                  {darkGradientTheme === theme.id && (
                    <span className="text-[10px] text-primary font-black mt-2 self-start bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                      نشط حالياً (Active Preview)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode Config */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-lg text-sm">👁️‍🗨️</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">نمط التباين العالي (High Contrast Mode)</h2>
                  <p className="text-[11px] text-slate-900 mt-0.5">تطبيق كلاسات CSS تضمن وضوح النصوص بشكل أكبر عبر تحويل أي خطوط رمادية إلى بيضاء أو صفراء ناصعة.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onHighContrastModeChange && onHighContrastModeChange(!highContrastMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${highContrastMode ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${highContrastMode ? 'translate-x-1' : '-translate-x-5'}`} />
              </button>
            </div>
            
            {highContrastMode && (
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg flex items-start gap-2">
                <div className="text-indigo-600 mt-0.5">ℹ️</div>
                <div className="text-[11px] text-indigo-900 leading-relaxed font-bold">
                  تم تفعيل نمط التباين العالي. يمكنك ملاحظة التغيير الفوري في ألوان النصوص الرمادية الداكنة أو الفاتحة لتصبح أكثر سطوعاً (أبيض أو أصفر ناصع) في كافة شاشات وأدوات المنصة.
                </div>
              </div>
            )}
          </div>

          {/* Full Dark Mode Config */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-900 text-white border border-slate-700 rounded-lg text-sm">🌙</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">الوضع الليلي الكامل (Dark Mode)</h2>
                  <p className="text-[11px] text-slate-900 mt-0.5">تفعيل الوضع الليلي لإعادة توزيع الألوان للنظام بالكامل لتوفير تجربة مريحة للمحامين خلال ساعات العمل الطويلة.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDarkModeChange && onDarkModeChange(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-1' : '-translate-x-5'}`} />
              </button>
            </div>
          </div>

          {/* Elegant Gold Mode Config */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg text-sm font-sans font-black">👑</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">الوضع الذهبي الأنيق (Elegant Gold Mode)</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">تخصيص جمالي يحول جميع أطراف الإطارات والظلال واللمسات التفاعلية بالمنصة لتدرجات ذهبية ناعمة ورائعة للمظهر الفخم.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setElegantGoldMode(!elegantGoldMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${elegantGoldMode ? 'bg-amber-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${elegantGoldMode ? 'translate-x-1' : '-translate-x-5'}`} />
              </button>
            </div>
          </div>

          {/* Advanced Visual Coefficient Customizer Card with Sliders */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg text-sm font-sans font-black">🎛️</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">التحكم في الأبعاد والظلال المتقدمة (Advanced Customization)</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">تعديل انحناء الحواف، شدة الظلال وعتمة الخلفيات لجميع الكروت ديناميكياً.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdvancedConfigEnabled(!advancedConfigEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${advancedConfigEnabled ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${advancedConfigEnabled ? 'translate-x-1' : '-translate-x-5'}`} />
              </button>
            </div>

            {advancedConfigEnabled && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-900 font-bold font-sans">زاوية انحناء أطراف الكروت:</span>
                    <span className="font-mono text-primary font-black">{cardRadius}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={parseInt(cardRadius)}
                    onChange={(e) => setCardRadius(`${e.target.value}px`)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-sans">
                    <span>حواف حادة (0px)</span>
                    <span>انحناء مائل مريح (20px)</span>
                    <span>انحناء دائري عريض (40px)</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-900 font-bold font-sans">مؤشر عمق وارتفاع الظلال ثلاثية الأبعاد:</span>
                    <span className="font-mono text-primary font-black">×{cardShadowIntensity}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.1"
                    value={parseFloat(cardShadowIntensity)}
                    onChange={(e) => setCardShadowIntensity(e.target.value)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-sans">
                    <span>مسطح بالكامل (0.0)</span>
                    <span>ظلال دافئة طبيعية (1.0)</span>
                    <span>تأثير عمق بؤري عارم (2.5)</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-900 font-bold">معدل تعتيم وشفافية خلفيات الكروت:</span>
                    <span className="font-mono text-primary font-black">{Math.round(parseFloat(cardBgOpacity) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={parseFloat(cardBgOpacity)}
                    onChange={(e) => setCardBgOpacity(e.target.value)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-sans">
                    <span>زجاجي شفاف (10%)</span>
                    <span>خلفية صلبة داكنة (100%)</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-900 font-bold">سرعة تفاعل وحركة كروت القضايا (Transition Speed):</span>
                    <span className="font-mono text-primary font-black">{cardTransitionSpeed} ثانية</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={parseFloat(cardTransitionSpeed)}
                    onChange={(e) => setCardTransitionSpeed(e.target.value)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-sans">
                    <span>فوري شديد السرعة (0.1s)</span>
                    <span>انتقال ناعم متزن (0.4s)</span>
                    <span>سينمائي هادئ وعريض (1.5s)</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-900 font-bold font-sans">لون بطاقات النظام (اختياري/مخصص):</span>
                    <span className="font-mono text-primary font-black">{cardCustomBgColor || 'السياق الافتراضي'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <input
                       type="color"
                       value={cardCustomBgColor || '#ffffff'}
                       onChange={(e) => setCardCustomBgColor(e.target.value)}
                       className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                     />
                     <button 
                       onClick={() => setCardCustomBgColor('')} 
                       className="text-[10px] bg-slate-200 text-slate-700 px-3 py-1 rounded-xl font-bold transition-colors"
                     >
                        مسح وإلغاء اللون
                     </button>
                  </div>
                </div>

                {/* Dynamically controlled card preview inside Settings */}
                <div className="mt-6 p-5 border border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden" dir="rtl">
                  <span className="text-[11px] font-black text-amber-600 block mb-3">👁️ لوحة معاينة الحواف والظلال اللحظية (Card Geometry Live Preview):</span>
                  
                  <div 
                    className="p-5 border transition-all duration-300 relative bg-white"
                    style={{
                      backgroundColor: cardCustomBgColor || '#ffffff',
                      borderRadius: cardRadius,
                      opacity: parseFloat(cardBgOpacity),
                      borderWidth: highContrastMode ? '3px' : '1px',
                      borderColor: highContrastMode ? (isDarkMode ? '#ffd700' : '#000000') : '#cbd5e1',
                      boxShadow: `0 ${parseFloat(cardShadowIntensity) * 4}px ${parseFloat(cardShadowIntensity) * 8}px rgba(0,0,0,${parseFloat(cardShadowIntensity) * 0.15})`
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded">بطاقة المعاينة القضائية</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <h5 className="text-sm font-black text-slate-900">محاكاة حية لتأثير الأبعاد والسمك</h5>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      هذه البطاقة تعكس الإحساس العام لكافة كروت النظام عند تطبيق الزوايا والظلال الحالية.
                    </p>
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-600 font-bold font-mono">
                      <span>انحناء: {cardRadius}</span>
                      <span>ظلال: {cardShadowIntensity}x</span>
                      <span>شفافية: {Math.round(parseFloat(cardBgOpacity) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* High-Contrast Presets section with Advanced Slider Calibration */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm text-right font-sans" dir="rtl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="p-1.5 bg-sky-500/10 text-sky-600 border border-sky-500/20 rounded-lg text-sm font-sans font-black">🕶️</span>
              <div>
                <h2 className="text-sm font-bold text-slate-950 underline decoration-primary/30">إعدادات الرؤية المريحة والمعايرة العينية (Ocular Comfort Tuning)</h2>
                <p className="text-[11px] text-slate-800 mt-0.5 font-black">اختر من بين المعايرات التقنية الجاهزة أو قم بتخصيص الفلاتر بنفسك لحماية النظر في الأوضاع المظلمة وتحسين سهولة القراءة.</p>
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <span className="text-xs font-bold text-slate-900 block mb-2.5">💡 المعايرات البصرية المجهزة مسبقاً لحماية الأعين:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'default', name: 'الوضع الطبيعي', sat: 1.0, bright: 1.0, cont: 1.0, icon: '🌟' },
                  { id: 'reader', name: 'القراءة الهادئة', sat: 0.8, bright: 0.9, cont: 1.1, icon: '📖' },
                  { id: 'high', name: 'تباين فائق', sat: 1.2, bright: 1.1, cont: 1.3, icon: '👁️' },
                  { id: 'night', name: 'الرؤية الليلية', sat: 0.4, bright: 0.8, cont: 1.2, icon: '🌙' },
                  
                  // Calibration presets specifically for eye comfort in dark/ambient setups
                  { id: 'warm_evening', name: 'المساء الدافئ', sat: 0.65, bright: 0.85, cont: 1.12, icon: '🌇' },
                  { id: 'midnight_reading', name: 'المطالعة الليلية الصامتة', sat: 0.45, bright: 0.75, cont: 1.05, icon: '🌌' },
                  { id: 'velvet_blue', name: 'درع الضوء الأزرق', sat: 0.55, bright: 0.90, cont: 1.15, icon: '🛡️' },
                  { id: 'contrast_gold', name: 'الذهبي عالي التباين', sat: 1.10, bright: 1.05, cont: 1.30, icon: '⚜️' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setVisionPreset(preset.id);
                      setVisionSat(preset.sat);
                      setVisionBright(preset.bright);
                      setVisionCont(preset.cont);
                    }}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 cursor-pointer text-center ${
                      visionPreset === preset.id 
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30 text-slate-950 font-bold' 
                        : 'border-slate-800 bg-white text-slate-900'
                    }`}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <span className="text-[10px] font-black leading-tight">{preset.name}</span>
                    <span className="text-[8px] opacity-70 font-mono">S:{preset.sat} B:{preset.bright} C:{preset.cont}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Controls for Manual High-Contrast Calibration */}
            <div className="bg-slate-50 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-950 border-b border-slate-800 pb-2">
                <span>🎛️ لوحة المعايرة الحرة (Manual Calibration)</span>
                {visionPreset === 'custom' ? (
                  <span className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-lg">تعديل مخصص نشط (Custom Tuning Active)</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVisionPreset('custom')}
                    className="text-[10px] text-primary"
                  >
                    تفعيل التعديل اليدوي
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Saturation Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-900">
                    <span>تشبع الألوان (Saturation):</span>
                    <span className="font-mono text-primary font-black">{visionSat.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={visionSat}
                    onChange={(e) => {
                      setVisionPreset('custom');
                      setVisionSat(parseFloat(e.target.value));
                    }}
                    className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-900 font-bold">
                    <span>خافت (الأشعة الزرقاء)</span>
                    <span>ممتلئ / ساطع</span>
                  </div>
                </div>

                {/* Brightness Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-900">
                    <span>شدة الإضاءة (Brightness):</span>
                    <span className="font-mono text-primary font-black">{visionBright.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={visionBright}
                    onChange={(e) => {
                      setVisionPreset('custom');
                      setVisionBright(parseFloat(e.target.value));
                    }}
                    className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-900 font-bold">
                    <span>مريح للغرف المعتمة</span>
                    <span>ساطع وقوي</span>
                  </div>
                </div>

                {/* Contrast Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-900">
                    <span>نسبة التباين (Contrast):</span>
                    <span className="font-mono text-primary font-black">{visionCont.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={visionCont}
                    onChange={(e) => {
                      setVisionPreset('custom');
                      setVisionCont(parseFloat(e.target.value));
                    }}
                    className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-900 font-bold">
                    <span>ناعم ودافئ</span>
                    <span>محدد وحاد</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm text-right" dir="rtl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="p-1.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-lg text-sm">🎨</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">مصمم الثيمات والتدرجات اللونية الخاص (Dynamic Gradient Stop)</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">حدد تدرجاً مخصصاً وخلفية متباينة لإنشاء نمط تفاعلي يناسب علامتك القانونية.</p>
                </div>
              </div>

            <form onSubmit={handleCreateCustomTheme} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-bold block">اسم الثيم الفني الجديد:</label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="مثال: الغسق المتوهج (Glowing Twilight)"
                  required
                  className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl outline-none focus:border-primary transition-all font-sans font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">لون البدء (From):</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={gradientFrom}
                      onChange={(e) => setGradientFrom(e.target.value)}
                      className="w-10 h-10 border border-slate-300 rounded-lg cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={gradientFrom}
                      onChange={(e) => setGradientFrom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl font-mono uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">لون الانتهاء (To):</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={gradientTo}
                      onChange={(e) => setGradientTo(e.target.value)}
                      className="w-10 h-10 border border-slate-300 rounded-lg cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={gradientTo}
                      onChange={(e) => setGradientTo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl font-mono uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">لون إضاءة الإطار (Border):</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={borderAccent}
                      onChange={(e) => setBorderAccent(e.target.value)}
                      className="w-10 h-10 border border-slate-300 rounded-lg cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={borderAccent}
                      onChange={(e) => setBorderAccent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl font-mono uppercase font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time preview of the dynamic color stops */}
              <div className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs" style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`, borderColor: borderAccent }}>
                <span className="text-white font-black drop-shadow-md">معاينة التدرج المخصص الفورية</span>
                <span className="text-white font-mono tracking-widest font-black" style={{ color: borderAccent }}>PREVIEW LOCK</span>
              </div>

              <button
                type="submit"
                disabled={!themeName.trim()}
                className={`w-full font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${themeName.trim() ? 'bg-[#1e40af] text-white cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                <span>توليد وحفظ الثيم المخصص 🎨</span>
              </button>
            </form>
          </div>

          {/* Editable Roles Config */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-slate-900">تخصيص مسميات الموظفين والعملاء (Roles Customization)</h2>
            </div>
            <p className="text-xs text-slate-900">
              يمكنك هنا تخصيص أسماء الأدوار، مثلاً تغيير "شريك أول" إلى "مدير مالك"، أو "موكل" إلى "مشترك".
            </p>
            <form onSubmit={handleSaveRoles} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">مسمى مدير النظام:</label>
                  <input
                    type="text"
                    value={editableRoles.admin}
                    onChange={(e) => setEditableRoles({ ...editableRoles, admin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">مسمى حساب المحامي:</label>
                  <input
                    type="text"
                    value={editableRoles.lawyer}
                    onChange={(e) => setEditableRoles({ ...editableRoles, lawyer: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">مسمى سكرتير النظام:</label>
                  <input
                    type="text"
                    value={editableRoles.secretary}
                    onChange={(e) => setEditableRoles({ ...editableRoles, secretary: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">مسمى حساب المستشار:</label>
                  <input
                    type="text"
                    value={editableRoles.researcher}
                    onChange={(e) => setEditableRoles({ ...editableRoles, researcher: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">مسمى العملاء/المشتركين:</label>
                  <input
                    type="text"
                    value={editableRoles.subscriber}
                    onChange={(e) => setEditableRoles({ ...editableRoles, subscriber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-800 text-xs text-slate-900 py-2.5 px-3 rounded-xl outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-start mt-4">
                <button
                  type="submit"
                  className="bg-primary text-white font-bold py-2 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Save className="w-4 h-4" />
                  حفظ المسميات المهنية
                </button>
              </div>
            </form>
          </div>

          {/* Role-based Tab Permissions Config (رؤية مخصصة) */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden" dir="rtl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 relative z-10">
              <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">نظام الصلاحيات والرؤية المخصصة (Role-Based View)</h2>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  التحكم في التبويبات المتاحة لكل مستشار أو دور وظيفي. التبويبات غير المحددة سيتم إخفاؤها برمجياً لضمان التركيز وحماية البيانات.
                </p>
              </div>
            </div>
            
            <div className="space-y-4 relative z-10 text-xs">
              {[
                 { roleId: 'lawyer', label: 'صلاحيات المحامي المترافع', defaultTabs: ['cases', 'tasks', 'calendar', 'documents', 'ai-tools'] },
                 { roleId: 'researcher', label: 'صلاحيات الباحث والمستشار', defaultTabs: ['tasks', 'documents', 'ai-tools'] },
                 { roleId: 'accountant', label: 'صلاحيات المحاسب المالي', defaultTabs: ['finance', 'tasks'] },
                 { roleId: 'secretary', label: 'صلاحيات السكرتارية', defaultTabs: ['cases', 'clients', 'calendar', 'documents'] }
              ].map(role => (
                <div key={role.roleId} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <h3 className="font-black text-slate-900 mb-3">{role.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {['dashboard', 'cases', 'tasks', 'calendar', 'finance', 'documents', 'ai-tools', 'clients'].map(tab => {
                       const savedStr = localStorage.getItem(`role-tabs-${role.roleId}`);
                       const savedTabs = savedStr ? JSON.parse(savedStr) : role.defaultTabs;
                       const isChecked = savedTabs.includes(tab);
                       
                       const tabLabels: Record<string, string> = {
                         'dashboard': 'لوحة القيادة', 'cases': 'القضايا', 'tasks': 'المهام', 'calendar': 'التقويم',
                         'finance': 'المالية', 'documents': 'ارشيف المستندات', 'ai-tools': 'المساعد الذكي', 'clients': 'العملاء'
                       };

                       return (
                         <label key={tab} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-primary/10 border-primary text-primary font-black' : 'bg-white border-slate-200 text-slate-500'}`}>
                           <input 
                             type="checkbox" 
                             className="hidden" 
                             checked={isChecked}
                             onChange={(e) => {
                               let newTabs = [...savedTabs];
                               if (e.target.checked) newTabs.push(tab);
                               else newTabs = newTabs.filter((t: string) => t !== tab);
                               localStorage.setItem(`role-tabs-${role.roleId}`, JSON.stringify(newTabs));
                               // Force react re-render by triggering a fake storage event if needed
                               window.dispatchEvent(new Event('storage'));
                             }}
                           />
                           <span>{tabLabels[tab]}</span>
                         </label>
                       );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-2 text-left w-full relative z-10">* مدير المكتب له كافة الصلاحيات افتراضياً ولا تقيد بهذه التبويبات.</div>
          </div>

          {/* Form 1: Office Profile Details */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-slate-900">الملف التجاري والمهني لمكتب المحاماة</h2>
            </div>
            
            <form onSubmit={handleSaveOfficeProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">الاسم المهني للمكتب:</label>
                  <input
                    type="text"
                    value={officeName}
                    onChange={(e) => setOfficeName(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block">رقم السجل الضريبي (VAT No - هيئة الزكاة):</label>
                  <input
                    type="text"
                    value={vatNo}
                    onChange={(e) => setVatNo(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-bold block">تفاصيل تراخيص وزارة العدل وهيئة العملاء والمحاميين والمستشاريين القانونيين:</label>
                <textarea
                  value={officeLicense}
                  onChange={(e) => setOfficeLicense(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-primary text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20"
                >
                  حفظ التفاصيل المهنية للمكتب
                </button>
              </div>
            </form>
          </div>

          

          {/* Form: Najiz API Link */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-sm">💬</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">إشعارات تذكير العملاء (WhatsApp & SMS)</h2>
                  <p className="text-[11px] text-slate-900 mt-0.5">خصص قالب رسائل التذكير التلقائية المجدولة قبل ٢٤ ساعة من موعد الجلسة القضائية.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-bold block">مفتاح الربط (WhatsApp API Key / Twilio):</label>
                <input
                  type="password"
                  placeholder="tw_live_xxxxxxxxxxxxxxxxxxxxx"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs py-3 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-bold block">قالب الرسالة التذكيرية (WhatsApp Template):</label>
                <textarea
                  rows={4}
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs py-3 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-primary resize-none"
                ></textarea>
                <p className="text-[11px] text-slate-500 italic">يتم استبدال المتغيرات {`{DATE}`} و {`{TIME}`} آلياً عند إرسال الإشعار.</p>
              </div>
              <div className="flex justify-end pt-2">
                 <button
                   type="button"
                   onClick={handleSaveWhatsappMsg}
                   className="bg-emerald-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                 >
                   حفظ إعدادات التذكير
                 </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
             <div className="flex justify-between items-start border-b border-slate-800 pb-3">
               <div className="flex items-center gap-2">
                 <Database className="w-5 h-5 text-primary" />
                 <h2 className="text-sm font-bold text-slate-900">الربط المباشر مع بوابة التقاضي (ناجز Najiz)</h2>
               </div>
               {isNajizConnected ? (
                  <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full">
                     <CheckCircle className="w-3 h-3" />
                     متصل - Connected
                  </span>
               ) : (
                  <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold bg-slate-100 text-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                     <AlertCircle className="w-3 h-3" />
                     غير متصل - Disconnected
                  </span>
               )}
             </div>

             <form onSubmit={handleConnectNajiz} className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-xs text-slate-900 font-bold block">مفتاح الربط البرمجي (Najiz API Key):</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                         <Key className="w-4 h-4 text-slate-900" />
                      </div>
                      <input
                        type="password"
                        value={najizApiKey}
                        onChange={(e) => setNajizApiKey(e.target.value)}
                        placeholder="njz_api_xxxxxxxxxxxxxxxxxxxxx"
                        disabled={isNajizConnected || isNajizConnecting}
                        className="w-full bg-slate-50 text-slate-900 text-xs py-3 pl-3 pr-10 rounded-xl border border-slate-800 focus:outline-none focus:border-primary disabled:opacity-50"
                        required
                      />
                   </div>
                   <p className="text-xs text-slate-900 mt-1">يُرجى إدخال رموز الـ API الخاصة للمكتب المستخرجة من بوابة المطورين بوزارة العدل.</p>
                </div>

                <div className="flex justify-end pt-2">
                   {isNajizConnected ? (
                      <button
                        type="button"
                        onClick={handleDisconnectNajiz}
                        className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs py-2.5 px-6 rounded-xl transition-all"
                      >
                         <ShieldAlert className="w-4 h-4" />
                         إلغاء الربط (Disconnect)
                      </button>
                   ) : (
                      <button
                        type="submit"
                        disabled={isNajizConnecting || !najizApiKey}
                        className="flex items-center gap-2 bg-emerald-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                      >
                         <RefreshCw className={`w-4 h-4 ${isNajizConnecting ? 'animate-spin' : ''}`} />
                         {isNajizConnecting ? 'جاري الاتصال والتحقق...' : 'تأكيد الربط والتفعيل (Connect)'}
                      </button>
                   )}
                </div>
             </form>
          </div>

          {/* Form 2: SMTP server configuration */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-slate-900">إعدادات خادم البريد الوارد والتنبيهات (SMTP Server Config)</h2>
              </div>
              <span className="text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded font-bold font-mono">Nodemailer Engine</span>
            </div>

            <form onSubmit={handleSaveSMTP} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block font-sans">SMTP Host Server:</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium"
                    placeholder="e.g. smtp.gmail.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block font-sans">SMTP Port:</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium"
                    placeholder="e.g. 587 or 465"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block font-sans">Sender Email (From):</label>
                  <input
                    type="email"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium"
                    placeholder="notifications@office.sa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block font-sans">SMTP Auth Username:</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-bold block font-sans">SMTP Secret Password:</label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-800 p-3 rounded-xl text-sm text-slate-900 leading-relaxed text-right">
                💡 في حال بقاء الخادم الحقيقي غير مهيأ، ستقوم العدالة تلقائياً بعمل مضاهاة كاملة (Simulation Matcher) لبث رسائل البريد الإلكتروني الافتراضية بنجاح وتسجيل كود المحاكاة في الأرشيف المرجعي.
              </div>

              <div className="flex justify-between items-center pt-2">
                {smtpSuccess && (
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    تم حفظ كود SMTP بنجاح!
                  </span>
                )}
                <span></span>
                <button
                  type="submit"
                  disabled={smtpSaving}
                  className="bg-sky-50 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all"
                >
                  {smtpSaving ? 'جاري الفحص...' : 'حفظ واختبار صحة الاتصال'}
                </button>
              </div>
            </form>
          </div>

          {/* Form 3: Webhook sync keys for browser expansion */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-slate-900">مفاتيح ربط واستيراد بوابة ناجز (Najiz Synchronization Secrets)</h2>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-bold block uppercase font-sans">Platform API Token Key:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-mono tracking-wider"
                    required
                  />
                  <span className="text-xs bg-primary/10 text-primary font-extrabold px-1.5 py-0.5 rounded absolute left-3 top-3.5 border border-primary/20">
                    مستقر
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-bold block uppercase font-sans">Najiz Endpoint Webhook URL:</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-mono"
                  required
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                {saveSuccess ? (
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    تم تحديث مفتاح ربط ناجز بنجاح!
                  </span>
                ) : (
                  <span></span>
                )}
                <button
                  type="submit"
                  disabled={configSaving}
                  className="bg-primary text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20"
                >
                  {configSaving ? 'جاري الرصد...' : 'حفظ مفتاح الربط وتوليد Webhook'}
                </button>
              </div>
            </form>
          </div>

          {/* Form 4: Cloud Database Backup & Automated Cron config */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-slate-900">النسخ الاحتياطي ومزامنة السحاب اليومي (Daily Cloud Backup)</h2>
              </div>
              <span className="text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded font-black font-mono">SUPABASE AUTOMATION</span>
            </div>

            <p className="text-xs text-slate-900 leading-relaxed text-right">
              يوفر هذا النظام جدولاً موقوتاً (Cron Job) لتصدير كامل ملفات القضايا والعملاء والمعاملات المالية وحفظها كملفات مشفرة على وحدة خادم التخزين السحابي الآمن يومياً عند الساعة <strong className="text-primary">03:00 صباحاً</strong> مبرمجة تلقائياً.
            </p>

            <div className="bg-slate-50 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-right">
              <div className="flex justify-between text-slate-900">
                <span>دور الرصد والجلب الموقوت:</span>
                <span className="text-primary font-bold">نشط بقواعد البيانات (Cron Active)</span>
              </div>
              <div className="flex justify-between text-slate-900 text-xs">
                <span>موعد النسخ القادم:</span>
                <span className="font-mono">يومياً الساعة 03:00 ص بتوقيت مكة</span>
              </div>
              <div className="flex justify-between text-slate-900 text-xs border-t border-slate-800 pt-2">
                <span>إجمالي الجداول المشمولة:</span>
                <span className="text-slate-900">Cases, Clients, Financials, Messages, Settings</span>
              </div>
            </div>

            {backupHistoryList.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-slate-900 font-bold block">سجل آخر المزامنات والنسخ الممتدة:</span>
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto font-mono text-xs text-slate-900 pr-1">
                  {backupHistoryList.map((bh, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 border border-slate-800 rounded-lg flex justify-between items-center text-right">
                      <span>{bh.reason}</span>
                      <span className="text-emerald-600 font-bold">{bh.timestamp} - {bh.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              {backupSuccess && (
                <span className="text-emerald-600 text-xs font-bold animate-pulse">
                  ✅ تم الحفظ والنسخ السحابي بنجاح!
                </span>
              )}
              {isBackingUp && (
                <span className="text-primary text-xs font-bold">
                  ⚡ جاري رفع السيرفر وتشفير الجداول...
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsBackupConfOpen(true)}
                className="bg-sky-50 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all"
              >
                تشغيل النسخ الاحتياطي الفوري السحابي ☁️
              </button>
            </div>
          </div>

          {/* Cloud Calendar Sync Integration Card */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-slate-900 font-sans">تكامل التقويمات السحابية (Google & Outlook Calendar Sync)</h2>
              </div>
              <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded font-bold font-mono">Cloud Sync Web-OAuth</span>
            </div>

            <p className="text-xs text-slate-900 leading-relaxed text-right">
              قم بتمكين المزامنة ثنائية الاتجاه لنقل ومتابعة جميع الجلسات القضائية والالتزامات المسجلة في الأجندة مع حسابات Google أو Outlook الخاصة بالعملاء والمحاميين والمستشاريين القانونيين مباشرة لضمان عدم فوات أي موعد.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Google Calendar Card */}
              <div className="bg-slate-50 border border-slate-800 p-4 rounded-xl flex flex-col justify-between gap-3 text-right">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Google Calendar</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${isCalendarConnected ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-200 text-slate-900"} `}>
                      {isCalendarConnected ? "● متصل ونشط" : "غير متصل"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-900 leading-relaxed">يسحب البيانات ويدمج الجلسات بجدول المحامي في Gmail.</p>
                </div>
                
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  {isCalendarConnected ? (
                    <>
                      <button 
                        type="button"
                        onClick={() => handleDisconnectCalendar('gcal')}
                        className="text-xs text-rose-600 font-bold"
                      >
                        إلغاء الربط 💔
                      </button>
                      <span className="text-xs text-slate-900  font-mono">lawyer.adalah@gmail.com</span>
                    </>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleConnectCalendar('gcal')}
                      disabled={isCalSyncing}
                      className="bg-primary text-white text-xs font-black py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <span>🔗</span>
                      <span>ربط ومزامنة تقويم Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Outlook Calendar Card */}
              <div className="bg-slate-50 border border-slate-800 p-4 rounded-xl flex flex-col justify-between gap-3 text-right">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Outlook Calendar</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${isOutlookConnected ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-200 text-slate-900"} `}>
                      {isOutlookConnected ? "● متصل ونشط" : "غير متصل"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-900 leading-relaxed">يتيح للمحامي المزامنة السريعة مع برامج شركة مايكروسوفت.</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  {isOutlookConnected ? (
                    <>
                      <button 
                        type="button"
                        onClick={() => handleDisconnectCalendar('outlook')}
                        className="text-xs text-rose-600 font-bold"
                      >
                        إلغاء الربط 💔
                      </button>
                      <span className="text-xs text-slate-900  font-mono">adalah.lawyer@outlook.com</span>
                    </>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleConnectCalendar('outlook')}
                      disabled={isCalSyncing}
                      className="bg-primary text-white text-xs font-black py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <span>🔗</span>
                      <span>ربط ومزامنة تقويم Outlook</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Selection Options (If GCAL is connected) */}
            {isCalendarConnected && (
              <div className="bg-slate-50 border border-slate-800 p-3 rounded-xl space-y-2 text-right">
                <label className="text-xs font-bold text-slate-900 block">حدد تفضيل إدراج المعايير للجلسات:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio"
                      name="gcal_selected"
                      value="lawyer_primary"
                      checked={calendarSelected === 'lawyer_primary'}
                      onChange={() => {
                        setCalendarSelected('lawyer_primary');
                        localStorage.setItem("gcal_selected", "lawyer_primary");
                      }}
                      className="text-primary"
                    />
                    <span className="text-slate-900">التقويم الرئيسي (Default)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio"
                      name="gcal_selected"
                      value="lawyer_court_only"
                      checked={calendarSelected === 'lawyer_court_only'}
                      onChange={() => {
                        setCalendarSelected('lawyer_court_only');
                        localStorage.setItem("gcal_selected", "lawyer_court_only");
                      }}
                      className="text-primary"
                    />
                    <span className="text-slate-900">إنشاء تقويم "جلسات Adalah"</span>
                  </label>
                </div>
              </div>
            )}

            {/* Calendar Event Log screen */}
            {calLogs.length > 0 && (
              <div className="bg-slate-100 border border-slate-800 p-2.5 rounded-xl text-xs font-mono text-slate-900 space-y-1">
                <span className="block border-b border-slate-800 pb-1 text-xs font-bold text-slate-900">تفاصيل سجلات التقويم السحابي المعاصر:</span>
                {calLogs.slice(0, 3).map((l, idx) => (
                  <div key={idx} className="truncate">{l}</div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Absolute Confirmation dialog overlay */}
          {isBackupConfOpen && (
            <div className="fixed inset-0 bg-sky-100 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center text-right shadow-2xl">
                <span className="text-3xl mx-auto block w-fit">⚠️</span>
                <h3 className="text-sm font-bold text-slate-900">تأكيد إطلاق المزامنة للموارد السحابية</h3>
                <p className="text-xs text-slate-900 leading-relaxed font-sans">
                  هل أنت متأكد من رغبتك في إطلاق عملية تشفير وسحب كامل البيانات (Supabase Master Backup) الآن؟ قد تستغرق هذه العملية دقائق معدودة ريثما تستقر الحزم.
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleTriggerBackup}
                    className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-primary/20"
                  >
                    نعم، بدء التحميل السحابي ☁️
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBackupConfOpen(false)}
                    className="bg-slate-100 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs border border-slate-800"
                  >
                    إلغاء الأمر
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Modules Config (Live Preview & Visual Clutter Reduction) */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-slate-900">تخصيص لوحة التحكم والحد من الازدحام البصري (Dashboard Modules)</h2>
              </div>
              <span className="text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded font-black font-mono">VISUAL CLUTTER ENGINE</span>
            </div>

            <p className="text-xs text-slate-900 leading-relaxed text-right">
              تحكم بمرونة كاملة في طريقة وبنية الوحدات المعروضة في لوحة معلومات المنصة. يمكنك إما إظهار/إخفاء الوحدات برمتها أو تفعيل بروتوكول التصفية الذكية الذي يخفي الصناديق التي تخلو من مهام أو التزامات نشطة تلقائياً.
            </p>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4 text-right">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-950 block">ميزة الفرز والإخفاء التلقائي الخفيف المبتكر:</span>
                <span className="text-[11px] text-slate-600 leading-relaxed block">
                  عند تفعيل هذا التفضيل، ستقوم لوحة التحكم بفلترة وإخفاء الوحدات الفارغة تلقائياً (مثل إخفاء تنبيهات المهل أو سجل العمليات في حال عدم وجود سجلات) بدلاً من عرض الصناديق الفارغة.
                </span>
                <span className="text-[10px] text-amber-600 block font-bold">💡 يحافظ على راحة العين ويمنع التشتيت البصري بالمنصة.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={dashboardHideUnusedAuto} 
                  onChange={(e) => setDashboardHideUnusedAuto(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
 
            {/* واجهة مخصص القاعات (Layout Manager) */}
            <div className="border border-amber-500/30 bg-amber-500/5 p-5 rounded-xl space-y-4 text-right">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                <span className="text-xl">🎛️</span>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-amber-500">مخصص القاعات الذكي (Layout Manager)</span>
                  <span className="text-[10px] text-slate-500">تحديد عدد الكروت الظاهرة وتخصيص مستويات خصوصية القاعات</span>
                </div>
              </div>
              
              <div className="space-y-3.5">
                {/* 1. قاعة القضايا */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block font-display">قاعة إدارة القضايا (Cases Hall)</span>
                    <span className="text-[10px] text-slate-500 block">مرشحات عرض عدد الكروت النشطة</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-600">الكروت:</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="24" 
                        value={visibleCasesCount} 
                        onChange={(e) => setVisibleCasesCount(parseInt(e.target.value, 10))}
                        className="w-24 accent-primary"
                      />
                      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">{visibleCasesCount}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={showCasesModule} 
                        onChange={(e) => setShowCasesModule(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-900 mr-2">{showCasesModule ? 'نشط (ظاهر)' : 'مخفي (خاص)'}</span>
                    </label>
                  </div>
                </div>

                {/* 2. قاعة الشؤون المالية */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block font-display">قاعة الحركة المالية (Finance Hall)</span>
                    <span className="text-[10px] text-slate-500 block">الحد الأقصى لعرض سجل الفواتير والمستحقات</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-600">السجلات:</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={visibleFinancesCount} 
                        onChange={(e) => setVisibleFinancesCount(parseInt(e.target.value, 10))}
                        className="w-24 accent-primary"
                      />
                      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">{visibleFinancesCount}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={showFinanceModule} 
                        onChange={(e) => setShowFinanceModule(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-900 mr-2">{showFinanceModule ? 'نشط (ظاهر)' : 'مخفي (خاص)'}</span>
                    </label>
                  </div>
                </div>

                {/* 3. قاعة الجلسات والمواعيد */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block font-display">قاعة الأجندة والمواعيد (Appointments Hall)</span>
                    <span className="text-[10px] text-slate-500 block">المواعيد المعروضة بجدول الأجندة في لوحة التحكم</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-600">المواعيد:</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="15" 
                        value={visibleAppointmentsCount} 
                        onChange={(e) => setVisibleAppointmentsCount(parseInt(e.target.value, 10))}
                        className="w-24 accent-primary"
                      />
                      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">{visibleAppointmentsCount}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={showAppointmentsModule} 
                        onChange={(e) => setShowAppointmentsModule(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-900 mr-2">{showAppointmentsModule ? 'نشط (ظاهر)' : 'مخفي (خاص)'}</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-black text-slate-950 block border-b border-dashed border-slate-200 pb-2">إعادة ترتيب وتخصيص كروت الويب في لوحة التحكم (مزامنة السحب والإفلات):</span>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                رتب أولويات ترافعك وأدائك بسحب الكروت مباشرة من لوحة التحكم أو بالتحكم اليدوي هنا. استخدم في هذه القائمة المنظمة أزرار الصعود والهبوط لتنظيم التخطيط والتحكم بالظهور.
              </p>
              
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {widgetsList.map((w, index) => (
                  <div key={w.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl transition-all">
                    <div className="flex items-start gap-3 min-w-0">
                      <input 
                        type="checkbox"
                        checked={w.visible !== false}
                        onChange={() => toggleWidgetVisibility(w.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-slate-900 block flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-200 rounded-md text-[10px] text-slate-600 font-mono">#{index + 1}</span>
                          {w.name}
                        </span>
                        <span className="text-[9px] text-slate-500 leading-normal line-clamp-1 font-bold">{w.desc}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveWidgetUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-500 disabled:opacity-30 transition-colors"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidgetDown(index)}
                        disabled={index === widgetsList.length - 1}
                        className="p-1.5 rounded-lg text-slate-500 disabled:opacity-30 transition-colors"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              {dashboardSaveWidgetsSuccess ? (
                <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  تم ترحيل وحفظ تفضيلات لوحة التحكم بنجاح!
                </span>
              ) : (
                <span></span>
              )}
              <button
                type="button"
                onClick={handleSaveDashboardWidgets}
                className="bg-primary text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20"
              >
                حفظ تفضيلات لوحة التحكم
              </button>
            </div>
          </div>

        </div>

        {/* LEFT SIDE: Email test dispatch & sent log tracker */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SMTP Test Console */}
          <div className="bg-white border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Send className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-slate-900 font-sans">SMTP Test Console</h2>
            </div>

            <p className="text-xs text-slate-900 leading-relaxed font-bold">
              قم بتهيئة تجربة إرسال تنبيه فوري بالبريد الإلكتروني لتطبيق العدالة التجريبي ومحاكاة دورة تتبع التعديلات للتثبت من دقة الهيكلة والترويسة الشرعية.
            </p>

            <form onSubmit={handleSendTestEmail} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-bold block">بريد المستلم التجريبي:</label>
                <input
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-primary font-medium font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={emailSending}
                className="w-full bg-primary text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Send className="w-4 h-4" />
                {emailSending ? 'جاري الإرسال والمضاهاة...' : 'إرسال بريد تجريبي مروّس 🚀'}
              </button>
            </form>

            {emailSentStatus === 'success' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>تم الإرسال والمضاهاة بنجاح! راجع أرشيف الإشعارات أدناه لرصد تفاصيل الرسالة.</span>
              </div>
            )}
            
            {emailSentStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>فشل إتمام عملية الإرسال بالخادم. تأكد من تفعيل الاتصالات بالشبكة.</span>
              </div>
            )}
          </div>

          {/* Dynamic historic sent emails tracker */}
          <div className="bg-white border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary animate-pulse" />
              <h2 className="text-xs font-black text-slate-900">أرشيف الإشعارات الصادرة الموحدة</h2>
            </div>

            <p className="text-sm text-slate-900 leading-relaxed font-bold">
              نسخ كاملة من تنبيهات البريد الإلكتروني الصادرة تلقائياً عند تغيير حالات القضايا.
            </p>

            {emailSentLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-900">
                لا توجد إشعارات بريدية مرسلة مؤخراً.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {emailSentLogs.map((log) => (
                  <div key={log.id} className="bg-slate-50 border border-slate-800 p-3 rounded-xl space-y-2 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-900 font-mono font-bold">
                        {new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-xs font-extrabold px-1.5 py-0.2 rounded ${
                        log.status === 'sent' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {log.status === 'sent' ? 'تم التسليم عبر SMTP' : 'مضاهاة نشطة'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{log.subject}</div>
                    
                    <div className="text-xs text-slate-900 space-y-1 font-bold">
                      <div>العميل: <span className="text-slate-900">{log.clientName}</span></div>
                      <div>البريد: <span className="text-primary font-sans">{log.clientEmail}</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs pt-1.5 border-t border-slate-800">
                      <div className="text-slate-900 font-bold">حالة سابقة: <span className="text-rose-600 line-through truncate block">{log.oldStatus}</span></div>
                      <div className="text-slate-900 font-black">حالة جديدة: <span className="text-emerald-700 truncate block">{log.newStatus}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}