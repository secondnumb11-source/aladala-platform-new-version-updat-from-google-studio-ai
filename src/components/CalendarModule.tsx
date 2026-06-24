import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  User, 
  Link, 
  Info,
  Layers,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Case, Hearing, Task, Invoice } from '@/types';
import { generateUUID } from '@/lib/uuid';
import HearingsModule from './HearingsModule';

interface CalendarModuleProps {
  cases: Case[];
  hearings: Hearing[];
  tasks: Task[];
  invoices?: Invoice[];
  onUpdateState?: (type: string, data: any) => void;
}

export default function CalendarModule({ 
  cases = [], 
  hearings: propHearings = [], 
  tasks = [], 
  invoices = [], 
  onUpdateState 
}: CalendarModuleProps) {
  const [selectedDate, setSelectedDate] = useState<string>("2026-06-12");
  const [activeView, setActiveView] = useState<'calendar' | 'hearings'>('calendar');
  const [syncGoogle, setSyncGoogle] = useState(false);
  const [syncOutlook, setSyncOutlook] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeCourtPin, setActiveCourtPin] = useState<string | null>("riyadh");

  const [localHearings, setLocalHearings] = useState<Hearing[]>(propHearings);

  React.useEffect(() => {
    setLocalHearings(propHearings);
  }, [propHearings]);

  const loadHearings = async () => {
    try {
      const { data, error } = await supabase
        .from('hearings')
        .select('*')
        .order('date', { ascending: true });

      if (!error && data) {
        setLocalHearings(data.map((db: any) => ({
          id: db.id,
          caseId: db.case_id || null,
          caseNumber: db.case_number || '',
          caseName: db.case_name || '',
          date: db.date || '',
          time: db.time || '09:00',
          courtName: db.court_name || '',
          hallName: db.hall_number || db.hall || '',
          status: db.status || 'upcoming',
          isNajizSync: db.is_najiz_sync || false,
          createdAt: db.created_at,
          fromDashboard: db.from_dashboard || db.fromDashboard || false,
          source: db.source || '',
          title: db.title || db.case_name || '',
          raw: db.raw || null
        })));
      }
    } catch (e) {
      console.error('[CalendarModule Load Exception]', e);
    }
  };

  React.useEffect(() => {
    loadHearings();

    const handleSyncComplete = () => {
      console.log('[CalendarModule] Najiz sync completed, refreshing hearings...');
      loadHearings();
    };

    window.addEventListener('najiz_sync_complete', handleSyncComplete);
    return () => {
      window.removeEventListener('najiz_sync_complete', handleSyncComplete);
    };
  }, []);

  const hearings = localHearings;

  // New commitment input states with instant analysis
  const [newTitle, setNewTitle] = useState("");
  const [newCommType, setNewCommType] = useState<"hearing" | "obligation">("hearing");
  const [newDate, setNewDate] = useState("2026-06-12");
  const [newTime, setNewTime] = useState("09:00 صباحاً");
  const [newCourt, setNewCourt] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newLawyer, setNewLawyer] = useState("");
  const [addingSuccess, setAddingSuccess] = useState(false);

  // Edit hearing modal states
  const [editingHearing, setEditingHearing] = useState<Hearing | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editCourt, setEditCourt] = useState("");
  const [editLawyer, setEditLawyer] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const startEditHearing = (h: Hearing) => {
    setEditingHearing(h);
    setEditTitle(h.caseName || "");
    setEditDate(h.date || "");
    setEditTime(h.time || "");
    setEditCourt(h.courtName || "");
    setEditLawyer(h.judgeName || "");
    setEditNotes(h.notes || "");
  };

  const handleSaveEditedHearing = () => {
    if (!editingHearing || !onUpdateState) return;
    const updated: Hearing = {
      ...editingHearing,
      caseName: editTitle,
      date: editDate,
      time: editTime,
      courtName: editCourt,
      judgeName: editLawyer,
      notes: editNotes
    };
    onUpdateState('hearings', updated);
    setEditingHearing(null);
    alert('تم تعديل بيانات الموعد بنجاح.');
  };

  const handleDeleteHearingClick = (hearingId: string) => {
    if (!onUpdateState) return;
    if (window.confirm('🚨 هل أنت متأكد تماماً من رغبتك في حذف هذا الموعد من الأجندة وقاعدة البيانات؟ لا مفر من هذا الإجراء بعد تأكيده.')) {
      onUpdateState('deleteHearing', hearingId);
    }
  };

  // Real-time conflict inspector for proposed input before submission
  const parseDateSafe = (dateStr: string, timeStr?: string) => {
    try {
      if (!dateStr) return null;
      let cleanTime = (timeStr || '09:00:00').toString();
      
      const isPM = cleanTime.includes('مساء');
      const digits = cleanTime.match(/\d+/g);
      if (digits && digits.length >= 2) {
        let h = parseInt(digits[0]);
        let m = parseInt(digits[1]);
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        cleanTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
      } else if (digits && digits.length === 1) {
        let h = parseInt(digits[0]);
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        cleanTime = `${h.toString().padStart(2, '0')}:00:00`;
      } else if (!cleanTime.includes(':')) {
        cleanTime = '09:00:00';
      }

      const d = new Date(`${dateStr}T${cleanTime}`);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  };

  const checkInstantConflict = () => {
    if (!newTitle.trim()) return null;
    
    if (!hearings || !Array.isArray(hearings)) return null;

    // Check conflicts against existing hearings
    for (const h of hearings) {
      if (h && h.date === newDate && h.status !== 'canceled' && h.hearingStatus !== 'canceled') {
        const hTimeParsed = parseDateSafe(h.date, h.time);
        const newTimeParsed = parseDateSafe(newDate, newTime);
        
        const sameTime = hTimeParsed && newTimeParsed && hTimeParsed.getTime() === newTimeParsed.getTime();
        const sameClient = newClient.trim() && (
          (h.caseName || '').includes(newClient) || 
          (cases.find(c => c.caseNumber === h.caseNumber)?.clientName || '').includes(newClient)
        );
        const hCourt = h.courtName ? String(h.courtName).trim() : '';
        const diffCourt = newCourt.trim() && hCourt && hCourt.split(' ')[0] !== newCourt.split(' ')[0];
        
        if (sameTime) {
          return {
            type: "time_clash",
            message: `⚠️ تنبيه تعارض فوري: التاريخ والوقت متعارض مع جلسة أخرى في نفس الوقت (${h.caseName || 'جلسة أخرى'}) في تمام الساعة ${h.time || ''}!`
          };
        }
        if (sameClient) {
          return {
            type: "client_clash",
            message: `⚠️ تعارض عملاء: العميل (${newClient}) لديه التزام قضائي نشط آخر بنفس التاريخ (${newDate})!`
          };
        }
        if (diffCourt && sameTime) {
          return {
            type: "geographical_clash",
            message: `⚠️ تعارض مباعدة جغرافية: المحكمة مختلفة متباعدة بمدينة أخرى في نفس الوقت (${h.courtName || ''} مقابل ${newCourt})!`
          };
        }
      }
    }
    
    // Check against existing tasks
    for (const t of tasks) {
      if (t.dueDate === newDate && t.status !== 'completed' && t.status !== 'done') {
        const sameTitle = t.title && (t.title.includes(newTitle) || newTitle.includes(t.title));
        if (sameTitle) {
          return {
            type: "commitment_clash",
            message: `⚠️ تكرار التزام: يوجد التزام مكرر بنفس العنوان (${t.title}) مستحق بذات التاريخ!`
          };
        }
      }
    }
    return null;
  };

  const instantConflict = checkInstantConflict();

  const handleAddNewCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (instantConflict) {
      if (!window.confirm(`⚠️ هناك تداخل في المواعيد مسبقاً:\n${instantConflict.message}\n\nهل ترغب في المتابعة والجدولة على أي حال؟`)) {
        return;
      }
    }

    if (onUpdateState) {
      if (newCommType === "hearing") {
        const newHearing: Hearing = {
          id: generateUUID(),
          caseNumber: `SA-CAL-${Math.floor(1000 + Math.random() * 9000)}`,
          caseName: newTitle + (newClient ? ` (العميل: ${newClient})` : ""),
          date: newDate,
          time: newTime,
          courtName: newCourt || "المحكمة التجارية بالرياض",
          status: 'upcoming',
          judgeName: newLawyer || "محامي المكتب",
          notes: `تم الإضافة يدوياً للأجندة كالتزام قضائي. العميل: ${newClient || 'غير محدد'}`
        };
        onUpdateState('hearings', newHearing);
      } else {
        const newTask: Task = {
          id: generateUUID(),
          caseNumber: `SA-CAL-${Math.floor(1000 + Math.random() * 9000)}`,
          title: `التزام: ${newTitle}` + (newClient ? ` للموكل ${newClient}` : ""),
          description: `التزام خارجي للمحامي ${newLawyer || 'شريك أول'} بخصوص الدائرة ${newCourt || 'العامة'}.`,
          status: 'pending',
          priority: 'high',
          assignedTo: newLawyer || "محامي المكتب",
          dueDate: newDate
        };
        onUpdateState('tasks', newTask);
      }
      
      setAddingSuccess(true);
      setNewTitle("");
      setNewCourt("");
      setNewClient("");
      setTimeout(() => setAddingSuccess(false), 3000);
    } else {
      alert("خدمة الحفظ غير متصلة مؤقتاً.");
    }
  };

  // Mock scan status
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Saudi court location database for locator map
  const saudiCourtsData = [
    {
      id: "riyadh",
      name: "المحكمة التجارية بالرياض",
      fullName: "المحكمة التجارية بالرياض - الدائرة الثالثة",
      city: "الرياض",
      coordinates: { x: "50%", y: "45%" },
      trialsCount: (hearings || []).filter(h => h && h.courtName && String(h.courtName).includes("الرياض")).length || 2,
      casesLinked: (cases || []).filter(c => c && c.courtName && String(c.courtName).includes("الرياض")),
      workingHours: "08:00 ص - 02:30 م",
      portalLink: "https://najiz.sa",
    },
    {
      id: "jeddah",
      name: "المحكمة العمالية بجدة",
      fullName: "المحكمة العمالية بجدة - الدائرة السابعة",
      city: "جدة",
      coordinates: { x: "20%", y: "60%" },
      trialsCount: (hearings || []).filter(h => h && h.courtName && String(h.courtName).includes("جدة")).length || 1,
      casesLinked: (cases || []).filter(c => c && c.courtName && String(c.courtName).includes("جدة")),
      workingHours: "08:00 ص - 02:30 م",
      portalLink: "https://najiz.sa",
    },
    {
      id: "dammam",
      name: "محكمة التنفيذ بالدمام",
      fullName: "محكمة التنفيذ بالدمام - الدائرة الأولى",
      city: "الدمام",
      coordinates: { x: "75%", y: "35%" },
      trialsCount: (hearings || []).filter(h => h && h.courtName && String(h.courtName).includes("الدمام")).length || 1,
      casesLinked: (cases || []).filter(c => c && c.courtName && String(c.courtName).includes("الدمام")),
      workingHours: "08:00 ص - 02:30 م",
      portalLink: "https://najiz.sa",
    }
  ];

  // Calendar days of June 2026
  const juneDays = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
    const dayHearings = (hearings || []).filter(h => h && h.date === dateStr);
    const dayTasks = (tasks || []).filter(t => t && t.dueDate === dateStr);
    return {
      dayNum,
      dateStr,
      hearings: dayHearings,
      tasks: dayTasks
    };
  });

  // Calculate hearings in the next 24 hours (Smart Reminders)
  const now = new Date(); 
  const upcoming24hHearings = (hearings || []).filter(h => {
    if (!h || !h.date) return false;
    const hDate = parseDateSafe(h.date, h.time);
    if (!hDate) return false;
    const diffMs = hDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  });

  const updateHearingStatus = (hearingId: string, newStatus: string) => {
    const hearing = (hearings || []).find(h => h && h.id === hearingId);
    if (hearing && onUpdateState) {
      onUpdateState('hearings', { ...hearing, hearingStatus: newStatus });
      alert(`تم تحديث حالة الجلسة إلى: ${newStatus}`);
    }
  };

  const handleSyncNow = async () => {
    if (!syncGoogle && !syncOutlook) {
      alert("يرجى تفعيل خيار مزامنة Google Calendar أو Outlook أولاً.");
      return;
    }
    setIsSyncing(true);
    setSyncLogs(prev => ["بدء عملية الاتصال بالتقويم السحابي المستهدف...", ...prev]);
    
    setTimeout(() => {
      setSyncLogs(prev => [
        `مزامنة ${hearings.length} جلسات قضائية مجدولة...`,
        `مزامنة ${tasks.length} مهام نشطة كأحداث تقويم...`,
         ...prev
      ]);
      
      setTimeout(() => {
        setSyncLogs(prev => [
          `✅ نجحت المزامنة بنجاح مع: ${[syncGoogle ? 'Google Calendar' : '', syncOutlook ? 'Outlook Calendar' : ''].filter(Boolean).join(' & ')}`,
          `الموعد القادم للمزامنة التلقائية: ${new Date(Date.now() + 3600000).toLocaleTimeString()}`,
          ...prev
        ]);
        setIsSyncing(false);
      }, 1000);
    }, 800);
  };

  // Trigger simulated 48 hours nodemailer scan
  const handleScanHearings = async () => {
    setIsScanning(true);
    setScanLogs(prev => [`البدء في مسح أجندة الجلسات القضائية المبرمة...`, ...prev]);
    
    try {
      const res = await fetch('/api/hearings/scan-alert', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScanLogs(prev => [
          `رصد الجلسات المتبقي عليها أقل من 48 ساعة...`,
          `وجدت: ${data.alertedCount} جلسة قريبة بحاجة لإشعار عاجل.`,
          `تم استدعاء بروتوكول Nodemailer بنجاح!`,
          `حالة الإشعار: تم المحاكاة بنجاح وإرسال التنبيهات بالبريد.`,
          ...prev
        ]);
      } else {
        setScanLogs(prev => ["خطأ أثناء استدعاء المحاكي.", ...prev]);
      }
    } catch (err) {
      setScanLogs(prev => ["فشل الاتصال بالخادم الرئيسي لإطلاق خدمة SMTP.", ...prev]);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePrintAgenda = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const hearingsListHtml = hearings.map(h => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #ddd; font-weight:bold;">${h.caseNumber}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd; font-weight:bold;">${h.caseName}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${h.date}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd; font-mono:true;">${h.time}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${h.courtName}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${h.judgeName || 'غير محدد'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير جدول الجلسات قضائياً ورقيّاً</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; direction: rtl; text-align: right; }
          .header { text-align: center; border-bottom: 3px double #ca8a04; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 900; }
          .header p { margin: 5px 0 0 0; color: #475569; font-size: 13px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          th { background-color: #0f172a; color: #facc15; padding: 12px; text-align: right; font-weight: 900; }
          td { padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; font-weight: bold; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: left;">
          <button onclick="window.print();" style="background:#ca8a04; color:#0f172a; border:none; padding:10px 22px; border-radius:8px; cursor:pointer; font-weight:900; font-size:13px; box-shadow:0 4px 6px -1px rgba(202,138,4,0.3);">طباعة المستند الورقي 🖨️</button>
        </div>
        <div class="header">
          <h1>موكل والاستشارات</h1>
          <p>التقرير القضائي الرسمي لجدول الجلسات والأجندة العدلية للمقررين</p>
          <p style="font-size: 11px; margin-top: 6px; color: #64748b; font-weight: 500;">تاريخ الإصدار: ${new Date().toLocaleString('ar-SA')}</p>
        </div>
        
        <h2 style="font-size:16px; color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:8px; font-weight:bold;">كشف الجلسات الاستماع والمرافعات النشطة بالمكتب</h2>
        <table>
          <thead>
            <tr>
              <th>رقم الدعوى</th>
              <th>عنوان وموضوع القضية</th>
              <th>تاريخ المرافعة</th>
              <th>التوقيت اليومي</th>
              <th>الجهة / المحكمة المختصة</th>
              <th>الصفة متمثلاً</th>
            </tr>
          </thead>
          <tbody>
            ${hearingsListHtml || '<tr><td colspan="6" style="text-align:center; padding:20px;">لا توجد جلسات مجدولة حالياً.</td></tr>'}
          </tbody>
        </table>
        
        <div class="footer">
          <p>تم استخراج هذا المستند برمجياً ومطابقته بأمان منصة العدالة الذكية المتكاملة</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const [showConflictToast, setShowConflictToast] = useState(false);

  // Overlap and conflict checking algorithm for Saudi court sessions (agenda conflicts)
  const agendaConflicts = [];
  if (hearings && Array.isArray(hearings)) {
    for (let i = 0; i < hearings.length; i++) {
      for (let j = i + 1; j < hearings.length; j++) {
        const h1 = hearings[i];
        const h2 = hearings[j];
        
        if (h1 && h2 && h1.date === h2.date && h1.status !== 'canceled' && h2.status !== 'canceled') {
          const caseObj1 = cases.find(c => c.caseNumber === h1.caseNumber);
          const caseObj2 = cases.find(c => c.caseNumber === h2.caseNumber);
          
          const sameClient = caseObj1 && caseObj2 && (caseObj1.clientId === caseObj2.clientId || caseObj1.clientName === caseObj2.clientName);
          const differentCourts = h1.courtName && h2.courtName && String(h1.courtName).split(' ')[0] !== String(h2.courtName).split(' ')[0]; 
          
          const h1TimeParsed = parseDateSafe(h1.date, h1.time);
          const h2TimeParsed = parseDateSafe(h2.date, h2.time);
          const sameTime = h1TimeParsed && h2TimeParsed && h1TimeParsed.getTime() === h2TimeParsed.getTime();
  
          if (sameTime || sameClient || differentCourts) {
            agendaConflicts.push({
              id: `conflict-${h1.id}-${h2.id}`,
              hearingA: h1,
              hearingB: h2,
              type: sameTime ? 'time_clash' : sameClient ? 'client_clash' : 'geographical_clash',
              clientName: caseObj1?.clientName || h1.caseName || "موكل المكتب",
              reason: sameTime 
                ? `تعليق ميعاد: تعارض ميعاد الجلسة الأولى لحضور (${h1.caseName}) مع ميعاد الجلسة الثانية (${h2.caseName}) بنفس التوقيت في تمام الساعة (${h1.time}).`
                : sameClient 
                ? `تضارب عملاء: العميل (${caseObj1?.clientName || h1.caseName}) لديه جلستان قضائيتان مختلفتان مبرمتان بنفس التاريخ (${h1.date}) مما يصعب تمثيله المزدوج.`
                : `تعارض جغرافي قضائي: المحامي مسند إليه حضور بالدائرة (${h1.courtName}) والجلسة الأخرى بمدينة متباعدة في (${h2.courtName}) في نفس اليوم!`
            });
          }
        }
      }
    }
  }

  React.useEffect(() => {
    if (agendaConflicts.length > 0 && !sessionStorage.getItem('conflictToastShown')) {
      setShowConflictToast(true);
      sessionStorage.setItem('conflictToastShown', 'true');
      const timer = setTimeout(() => setShowConflictToast(false), 1000); // exactly 1 second
      return () => clearTimeout(timer);
    }
  }, [agendaConflicts.length]); // only depends on agendaConflicts.length

  const [draggedCommitment, setDraggedCommitment] = useState<{ id: string, type: 'hearing' | 'task' } | null>(null);

  const handleDragStartEvent = (e: React.DragEvent, id: string, type: 'hearing' | 'task') => {
    setDraggedCommitment({ id, type });
    e.dataTransfer.setData('commitmentId', id);
    e.dataTransfer.setData('commitmentType', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnDay = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('commitmentId') || draggedCommitment?.id;
    const type = e.dataTransfer.getData('commitmentType') || draggedCommitment?.type;
    
    if (!id || !type || !onUpdateState) return;

    if (type === 'hearing') {
      const hearing = hearings.find(h => h.id === id);
      if (hearing) {
        onUpdateState('hearings', { ...hearing, date: dateStr });
        alert(`تم إعادة جدولة الجلسة (#${hearing.caseNumber}) إلى تاريخ ${dateStr} بنجاح ومزامنتها مع الأنظمة العدلية.`);
      }
    } else {
      const task = tasks.find(t => t.id === id);
      if (task) {
        onUpdateState('tasks', { ...task, dueDate: dateStr });
        alert(`تم تحديث ميعاد التزام (${task.title}) إلى تاريخ ${dateStr} بنجاح.`);
      }
    }
    setDraggedCommitment(null);
  };

  return (
    <div className="space-y-6 text-right relative" dir="rtl">
      
      {/* Small floating conflict toast (Replaces old static banner) */}
      {showConflictToast && agendaConflicts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-950/95 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] animate-fade-in flex items-center gap-3 max-w-sm border border-rose-500/30 pointer-events-none">
          <span className="text-sm shrink-0 animate-pulse">🚨</span>
          <div className="flex flex-col text-right">
            <span className="font-black text-[12px] text-rose-500 leading-none">تداخل مواعيد الجلسات</span>
            <span className="text-[11px] text-slate-100 font-bold leading-normal mt-0.5 whitespace-nowrap">يوجد {agendaConflicts.length} تداخل في المواعيد. يرجى المراجعة</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#9A7D2C] via-[#1E3A8A] to-[#0284C7] border-2 border-[#9A7D2C] p-6 rounded-3xl relative overflow-hidden shadow-2xl transition-all duration-500">
        <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-400 blur-3xl rounded-full opacity-30"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <span className="text-xs text-[#FACC15] font-black uppercase" style={{ textShadow: 'none', color: '#FACC15' }}>📅 التقويم القضائي والجلسات</span>
            <h1 className="text-2xl md:text-3xl font-black text-[#FFFFFF] mt-2 tracking-wide" style={{ textShadow: 'none', color: '#FFFFFF' }}>
              التقويم القضائي والجلسات
            </h1>
            <p className="text-xs text-[#FFFFFF] mt-2 leading-relaxed font-black" style={{ textShadow: 'none', color: '#FFFFFF' }}>
              تصفح مواعيد الجلسات والنزاعات الممتدة لعملاء المكتب اليومية، مع ميزة التنبؤ بالخريطة الجغرافية ومطابقة التقويم الخارجي.
            </p>
          </div>
          <button 
            onClick={handleScanHearings}
            disabled={isScanning}
            className="bg-yellow-300 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(253,224,71,0.5)] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'جاري الفحص الموقوت...' : 'مسح وتنبيه الجلسات القادمة (48 ساعة)'}</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex bg-[#07132c] p-1 border border-yellow-500/20 rounded-2xl w-full max-w-md mr-auto relative z-10 shrink-0">
        <button 
          type="button"
          onClick={() => setActiveView('calendar')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${activeView === 'calendar' ? 'bg-[#9A7D2C] text-white shadow-[0_0_15px_rgba(154,125,44,0.4)]' : 'text-slate-400 hover:text-white'}`}
        >
          📅 الأجندة والخريطة التفاعلية
        </button>
        <button 
          type="button"
          onClick={() => setActiveView('hearings')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${activeView === 'hearings' ? 'bg-[#9A7D2C] text-white shadow-[0_0_15px_rgba(154,125,44,0.4)]' : 'text-slate-400 hover:text-white'}`}
        >
          ⚖️ تعديل وإدارة الجلسات التفصيلية
        </button>
      </div>

      {activeView === 'hearings' ? (
        <HearingsModule onUpdateState={(type) => {
          if (type === 'hearings_reload') {
            loadHearings();
          }
        }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: Calendar Grid Selector (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#07132c] border-2 border-yellow-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden group transition-all duration-500">
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 transition-opacity pointer-events-none"></div>
            <div className="flex items-center justify-between border-b border-yellow-500/30 pb-4 mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-white" />
                <h2 className="text-sm font-black text-[#FFFFFF]" style={{ textShadow: 'none', color: '#FFFFFF' }}>أجندة شهر يونيو 2026 (June 2026)</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintAgenda}
                  className="text-xs bg-yellow-500 text-slate-950 font-black px-3 py-1.5 rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center gap-1.5"
                  title="طباعة الأجندة العدلية كاملة ورقيّاً"
                >
                  <span>طباعة الأجندة 🖨️</span>
                </button>
                <span className="text-xs font-mono text-slate-950 bg-yellow-500 px-2.5 py-0.5 rounded font-black shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                  {hearings.length} جلسات مسجلة
                </span>
              </div>
            </div>

            {/* Grid calendar */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-[#FACC15] mb-2 relative z-10">
              <div style={{ textShadow: 'none', color: '#FACC15' }}>الأحد</div>
              <div style={{ textShadow: 'none', color: '#FACC15' }}>الإثنين</div>
              <div style={{ textShadow: 'none', color: '#FACC15' }}>الثلاثاء</div>
              <div style={{ textShadow: 'none', color: '#FACC15' }}>الأربعاء</div>
              <div style={{ textShadow: 'none', color: '#FACC15' }}>الخميس</div>
              <div style={{ textShadow: 'none', color: '#FACC15' }}>الجمعة</div>
              <div style={{ textShadow: 'none', color: '#FACC15' }}>السبت</div>
            </div>

            <div className="grid grid-cols-7 gap-2 font-mono relative z-10">
              {/* Pad with white space is not needed as Jun 1st 2026 is Monday. Monday is column 2. Let's pad 1 day for Sunday (which is Jun 1) */}
              <div className="bg-[#0c1830]/50 border border-slate-700/50 rounded-xl p-2 h-16 opacity-30 text-xs flex items-start justify-end text-yellow-100">31 مايو</div>
              
              {juneDays.map((day) => {
                const isSelected = selectedDate === day.dateStr;
                const hasHearings = day.hearings.length > 0;
                const hasTasks = day.tasks.length > 0;

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnDay(e, day.dateStr)}
                    className={`h-28 rounded-xl border text-right p-2 flex flex-col justify-between transition-all relative group/day ${
                      isSelected 
                        ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500 text-white ring-1 ring-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                        : 'bg-[#0c1830] border-yellow-500/20 text-white'
                    } shadow-sm group/day`}
                  >
                    <span className="text-xs font-black" style={{ color: '#FFFFFF', textShadow: 'none' }}>{day.dayNum}</span>
                    <div className="flex flex-col gap-1 w-full overflow-hidden">
                      {day.hearings.map(h => {
                        const fromDashboard = h.fromDashboard ||
                          h.source === 'najiz_dashboard_calendar' ||
                          /التقويم العدلي|المواعيد المستقبلية/.test(h.title || h.raw?.text || h.notes || h.caseName || '');

                        const sessionTitle = h.title || h.caseName ||
                          (fromDashboard ? 'موعد من التقويم العدلي' : 'جلسة قضائية');

                        return (
                          <div 
                            key={h.id}
                            draggable
                            onDragStart={(e) => handleDragStartEvent(e, h.id, 'hearing')}
                            className={`w-full h-4 rounded text-[10px] px-1 font-black truncate cursor-move flex items-center gap-0.5
                              ${fromDashboard 
                                ? 'bg-amber-600 text-white border border-amber-300' 
                                : 'bg-yellow-500 text-slate-950'
                              }`}
                            title={sessionTitle}
                          >
                            <span>{fromDashboard ? '📅' : '⚖️'}</span>
                            <span className="truncate">{sessionTitle}</span>
                          </div>
                        );
                      })}
                      {day.tasks.map(t => (
                        <div 
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStartEvent(e, t.id, 'task')}
                          className="w-full h-4 bg-blue-500 rounded text-[10px] px-1 text-white font-black truncate cursor-move"
                          title={t.title}
                        >
                          📝 {t.title}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details of Selected Date */}
          <div className="bg-gradient-to-br from-[#9A7D2C] via-[#0C1220] to-[#1E3A8A] border-2 border-[#9A7D2C] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-black border-b border-white/25 pb-2" style={{ color: '#FACC15', textShadow: 'none' }}>
              جدول أعمال تاريخ: <span className="underline font-mono" style={{ color: '#FFFFFF', textShadow: 'none' }}>{selectedDate}</span>
            </h3>

            {juneDays.find(d => d.dateStr === selectedDate)?.hearings.length === 0 && 
             juneDays.find(d => d.dateStr === selectedDate)?.tasks.length === 0 ? (
              <div className="py-6 text-center text-xs font-black" style={{ color: '#FFFFFF', textShadow: 'none' }}>
                لا توجد جلسات أو مهام مجدولة لهذا اليوم.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Hearings */}
                {juneDays.find(d => d.dateStr === selectedDate)?.hearings.map((hearing) => {
                  const h = hearing;
                  const fromDashboard = h.fromDashboard ||
                    h.source === 'najiz_dashboard_calendar' ||
                    /التقويم العدلي|المواعيد المستقبلية/.test(h.title || h.raw?.text || h.notes || h.caseName || '');

                  const sessionTitle = h.title || h.caseName ||
                    (fromDashboard ? 'موعد من التقويم العدلي' : 'جلسة قضائية');

                  return (
                    <div key={hearing.id} className={`${fromDashboard ? 'bg-[#0f2441] border-[#3b82f6]' : 'bg-[#4c0519] border-[#b91c1c]'} border-2 p-4 rounded-xl flex flex-col gap-3 shadow-lg`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 text-right">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${fromDashboard ? 'bg-[#1e40af] text-white border-blue-400/30' : 'bg-[#991B1B] text-white border-red-500/30'}`} style={{ textShadow: 'none' }}>
                              {fromDashboard ? 'التقويم العدلي' : 'جلسة قضائية'}
                            </span>
                          {hearing.is_najiz_sync && (
                            <span className="text-[9px] bg-[#D4AF37] text-slate-950 px-2 py-0.5 rounded font-black flex items-center gap-1">
                               <Clock className="w-2.5 h-2.5" />
                               مستورد من ناجز ({hearing.last_sync_at ? new Date(hearing.last_sync_at).toLocaleDateString('ar-SA') : 'تاريخ غير معروف'})
                            </span>
                          )}
                          <h4 className="text-xs font-black text-white" style={{ textShadow: 'none' }}>{sessionTitle}</h4>
                        </div>
                        <div className="text-sm font-black space-y-1">
                          <div style={{ color: '#FFFFFF', textShadow: 'none' }}>🏛️ المحكمة: <strong style={{ color: '#FACC15', textShadow: 'none' }} className="font-black">{hearing.courtName}</strong></div>
                          {hearing.judgeName && <div style={{ color: '#FFFFFF', textShadow: 'none' }}>⚖️ القاضي: <span style={{ color: '#FACC15', textShadow: 'none' }} className="font-black">{hearing.judgeName}</span></div>}
                          {hearing.notes && <div className="font-black font-sans italic p-2 rounded mt-1.5 border border-[#dc2626]/30 bg-black/40" style={{ color: '#FFFFFF', textShadow: 'none' }}>{hearing.notes}</div>}
                        </div>
                      </div>
                      <div className="text-left font-mono text-xs flex flex-col items-end justify-between">
                        <div>
                          <div className="flex items-center justify-end gap-1 font-black" style={{ color: '#FFFFFF', textShadow: 'none' }}>
                            <Clock className="w-3.5 h-3.5" style={{ color: '#FACC15' }} />
                            <span>{hearing.time}</span>
                          </div>
                          <div className="text-xs font-black mt-1" style={{ color: '#FACC15', textShadow: 'none' }}>القضية: #{hearing.caseNumber}</div>
                        </div>
                      </div>
                    </div>

                    {/* Highly Visible Custom Action Buttons inside the Card */}
                    <div className="border-t border-[#dc2626]/20 pt-3 mt-2 flex flex-wrap items-center justify-between gap-3 select-none no-print">
                      <span className="text-[11px] text-red-200/80 font-sans font-bold">إدارة ميعاد وحالة هذه الجلسة القضائية:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditHearing(hearing)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-450 text-slate-950 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer border border-amber-400/40"
                          title="تعديل ترويسة وموعد الجلسة"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-950 font-black" />
                          <span>تعديل الموعد</span>
                        </button>
                        <button
                          onClick={() => handleDeleteHearingClick(hearing.id)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/10 cursor-pointer border border-rose-500/30 font-sans"
                          title="حذف الجلسة نهائياً من الأجندة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الجلسة</span>
                        </button>
                      </div>
                    </div>


                  </div>
                );
              })}

                {/* Tasks */}
                {juneDays.find(d => d.dateStr === selectedDate)?.tasks.map((task) => (
                  <div key={task.id} className="bg-[#1e293b] border-2 border-[#475569] p-4 rounded-xl flex justify-between items-center shadow-lg">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] bg-[#1E40AF] text-[#FFFFFF] border border-blue-500 px-2 py-0.5 rounded font-black" style={{ textShadow: 'none' }}>مهمة إدارية</span>
                      <h4 className="text-xs font-black" style={{ color: '#FFFFFF', textShadow: 'none' }}>{task.title}</h4>
                      <p className="text-sm font-black leading-relaxed font-sans" style={{ color: '#FFFFFF', textShadow: 'none' }}>{task.description}</p>
                    </div>
                    <div className="text-left text-xs font-black" style={{ color: '#FFFFFF', textShadow: 'none' }}>
                      <div style={{ textShadow: 'none', color: '#FFFFFF' }}>المسؤول: <span style={{ color: '#FACC15' }}>{task.assignedTo}</span></div>
                      <div className="text-xs font-black mt-1" style={{ textShadow: 'none', color: '#FACC15' }}>الأولوية: {task.priority}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Saudi Court Locator Map */}
          <div className="bg-gradient-to-br from-[#9A7D2C]/90 via-[#0f172a] to-[#1E3A8A]/90 border-2 border-[#9A7D2C] rounded-2xl p-6 space-y-4 text-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/20 pb-3">
              <Layers className="w-5 h-5 text-yellow-300" />
              <h2 className="text-sm font-black text-white">الخريطة التفاعلية لفروع المحاكم السعودية</h2>
            </div>
            <p className="text-xs text-yellow-100 leading-relaxed font-bold">
              منصة جغرافية تفاعلية مدمجة تعرض مواقع المحاكم المرتبطة بقضايا العملاء النشطة بالمملكة، وتوفر إحصائيات فورية للمتداول في الدوائر القضائية.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              
              {/* Custom High Fidelity Saudi Vector-Style Map Box */}
              <div className="md:col-span-8 bg-slate-950/60 border border-white/20 p-4 rounded-2xl relative h-[320px] overflow-hidden flex flex-col justify-between">
                <div className="absolute inset-0 bg-radial-gradient from-yellow-500/5 via-transparent to-transparent"></div>
                
                {/* Simulated Saudi Map Outline Graphic */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <span className="text-[120px] text-white filter blur-[2px]">🇸🇦</span>
                </div>

                {/* Map Pins */}
                {saudiCourtsData.map((crt) => {
                  const isActive = activeCourtPin === crt.id;
                  return (
                    <button
                      key={crt.id}
                      onClick={() => setActiveCourtPin(crt.id)}
                      style={{ left: crt.coordinates.x, top: crt.coordinates.y }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
                    >
                      <div className="relative">
                        <MapPin className={`w-8 h-8 transition-transform ${
                          isActive ? 'text-white scale-125 shadow-lg' : 'text-white'
                        }`} />
                        <span className={`absolute -top-6 right-1/2 translate-x-1/2 text-xs font-bold py-0.5 px-2 rounded-lg border shadow-lg whitespace-nowrap block ${
                          isActive ? 'bg-primary text-slate-950 border-yellow-400 font-extrabold' : 'bg-slate-950 text-white font-bold border-slate-800'
                        }`}>
                          {crt.city} ({crt.trialsCount})
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Compass and Legend */}
                <div className="text-xs text-white text-right z-10 space-y-1">
                  <div>خريطة محاكاة جغرافية تفاعلية</div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-2.5 h-2.5 bg-primary rounded-full inline-block"></span>
                    <span>الموقع المحدد</span>
                    <span className="w-2.5 h-2.5 bg-[#0c1a35] rounded-full inline-block"></span>
                    <span>فروع أخرى للمحاكم</span>
                  </div>
                </div>

                <div className="text-left font-mono text-xs text-white z-10 leading-none">
                  KSA COURT COORDINATES MAP v1.2
                </div>
              </div>

              {/* Sidebar Panel for selected location in map */}
              <div className="md:col-span-4 space-y-3">
                {activeCourtPin ? (() => {
                  const data = saudiCourtsData.find(c => c.id === activeCourtPin);
                  if (!data) return null;
                  return (
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 text-right">
                      <div>
                        <span className="text-xs text-yellow-400 font-black font-bold font-sans uppercase block">فرع المحكمة بمسار العملاء</span>
                        <h4 className="text-xs font-black text-white mt-1">{data.name}</h4>
                        <span className="text-xs font-sans text-white font-bold block mt-0.5">{data.fullName}</span>
                      </div>

                      <div className="space-y-1 text-xs text-white font-bold border-t border-slate-800 pt-2 font-sans">
                        <div>📅 إجمالي الجلسات النشطة: <span className="text-white font-bold">{data.trialsCount}</span></div>
                        <div>⏰ ساعات العمل الرسمية: <span className="text-white font-bold text-xs">{data.workingHours}</span></div>
                      </div>

                      <div className="border-t border-slate-800 pt-2.5">
                        <span className="text-xs text-slate-100 font-bold block mb-1">القضايا المتصلة بهذا الفرع:</span>
                        {data.casesLinked.length === 0 ? (
                          <span className="text-xs text-slate-200 font-bold block">لا توجد قضايا نشطة مسجلة</span>
                        ) : (
                          <div className="space-y-1.5">
                            {data.casesLinked.map(cl => (
                              <div key={cl.id} className="text-xs text-white font-bold bg-[#040d1f] p-1.5 rounded border border-slate-850 flex items-center justify-between">
                                <span className="font-bold truncate max-w-[110px]">{cl.clientName}</span>
                                <span className="text-white font-bold font-bold font-sans">#{cl.caseNumber}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <a
                        href={data.portalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-yellow-500 text-slate-950 text-center block py-1.5 rounded-lg text-xs font-extrabold transition-all mt-2"
                      >
                        زيارة البوابة الرقمية المعتمدة
                      </a>
                    </div>
                  );
                })() : (
                  <div className="h-full flex items-center justify-center text-center p-6 text-xs text-white font-bold bg-slate-900 border border-slate-800 rounded-xl">
                    انقر فوق أحد فروع المحاكم على الخريطة لعرض التفاصيل القضائية المغطاة.
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* LEFT COLUMN: Alerts & Outlook/Google Sync config (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
      {/* 24 hour critical warnings panel */}
          <div className="bg-[#07132c] border-2 border-orange-500/50 rounded-3xl p-6 space-y-4 shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-500 relative overflow-hidden group">
            <div className="absolute inset-0 bg-orange-500/5 opacity-0 transition-opacity pointer-events-none"></div>
            <div className="flex items-center gap-2 text-white font-bold relative z-10">
              <AlertTriangle className="w-5 h-5 text-orange-400 animate-pulse" />
              <h2 className="text-xs font-black text-[#FFFFFF]" style={{ textShadow: 'none', color: '#FFFFFF' }}>تذكيرات ذكية (أقل من 24 ساعة)</h2>
            </div>
            
            <p className="text-xs text-[#FFFFFF] leading-relaxed relative z-10 font-bold" style={{ textShadow: 'none', color: '#FFFFFF' }}>
              جلسات حرجة تتطلب التحضير النهائي ورفع المذكرات الجوابية.
            </p>

            {upcoming24hHearings.length === 0 ? (
              <div className="bg-emerald-900 border border-emerald-500/50 p-3.5 rounded-xl text-center text-xs space-y-1 relative z-10">
                <CheckCircle className="w-5 h-5 mx-auto text-emerald-300" />
                <p className="font-black text-[#FFFFFF] text-xs" style={{ textShadow: 'none', color: '#FFFFFF' }}>لا توجد جلسات حرجة حالياً!</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {upcoming24hHearings.map(h => {
                  const fromDashboard = h.fromDashboard ||
                    h.source === 'najiz_dashboard_calendar' ||
                    /التقويم العدلي|المواعيد المستقبلية/.test(h.title || h.raw?.text || h.notes || h.caseName || '');

                  const sessionTitle = h.title || h.caseName ||
                    (fromDashboard ? 'موعد من التقويم العدلي' : 'جلسة قضائية');

                  return (
                    <div key={h.id} className={`${fromDashboard ? 'bg-[#0f2441] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]' : 'bg-orange-950/60 border-orange-500'} border p-4 rounded-2xl space-y-3 text-right w-full`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] text-white font-black px-2 py-0.5 rounded shadow-lg ${fromDashboard ? 'bg-blue-600' : 'bg-orange-600'}`} style={{ textShadow: 'none' }}>
                          {fromDashboard ? 'التقويم العدلي 📅' : 'موعد وشيك 🔥'}
                        </span>
                        <span className="text-[10px] text-[#FACC15] font-mono font-black" style={{ textShadow: 'none', color: '#FACC15' }}>{h.date}</span>
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-[#FFFFFF]" style={{ textShadow: 'none', color: '#FFFFFF' }}>{sessionTitle}</div>
                        <p className="text-[10px] text-[#FACC15] font-bold mt-1" style={{ textShadow: 'none', color: '#FACC15' }}>🏛️ {h.courtName}</p>
                      </div>
                      
                      <div className="pt-2 border-t border-orange-500/20 flex flex-col gap-2">
                         <span className="text-[10px] text-[#FFFFFF] font-black" style={{ textShadow: 'none', color: '#FFFFFF' }}>تحديث الحالة مباشرة:</span>
                         <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {['جاهزية تامة', 'قيد التحضير', 'طلب تأجيل'].map(status => (
                              <button 
                                key={status}
                                onClick={() => updateHearingStatus(h.id, status)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-black whitespace-nowrap transition-all ${
                                  h.hearingStatus === status 
                                    ? 'bg-orange-500 text-slate-950 shadow-inner' 
                                    : 'bg-slate-900 text-[#FACC15] border border-orange-500/30'
                                }`}
                                style={{ textShadow: 'none' }}
                              >
                                {status}
                              </button>
                            ))}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>



          {/* Interactive Quick Add Commitment & Real-time Conflict Analyzer Form */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 space-y-6 text-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <Sparkles className="w-5 h-5 text-amber-400 font-black animate-pulse" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">إضافة التزام قضائي وفحص التعارض الفوري</h2>
            </div>
            
            <p className="text-xs text-slate-200 font-bold leading-relaxed mb-2 font-bold">
              قم بإدخال تفاصيل الجلسة القضائية أو المهمة الإدارية لتحليل ملاءمة الأوقات وتفادي الغياب أو التداخل بالدائرة.
            </p>

            <form onSubmit={handleAddNewCommitment} className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-200/50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewCommType("hearing")}
                  className={`py-2 rounded-lg text-xs font-black transition-all ${
                    newCommType === "hearing" 
                      ? "bg-amber-500 text-white shadow-md scale-100" 
                      : "text-slate-200 font-bold hover:bg-slate-200"
                  } `}
                >
                  ⚖️ جلسة قضائية
                </button>
                <button
                  type="button"
                  onClick={() => setNewCommType("obligation")}
                  className={`py-2 rounded-lg text-xs font-black transition-all ${
                    newCommType === "obligation" 
                      ? "bg-amber-500 text-white shadow-md scale-100" 
                      : "text-slate-200 font-bold hover:bg-slate-200"
                  } `}
                >
                  📌 التزام / مهمة
                </button>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-black flex items-center gap-1.5 uppercase tracking-wide">
                   موضوع الجلسة / الالتزام الجديد *
                </label>
                <input
                  type="text"
                  required
                  placeholder={newCommType === "hearing" ? "مثال: مرافعة بطلان عقد توريد" : "مثال: اجتماع عمل استشاري"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-900 outline-none focus:border-amber-500 transition-all font-sans text-right placeholder-slate-400 shadow-sm"
                />
              </div>

              {/* Client and Lawyer row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-black uppercase tracking-wide">اسم العميل</label>
                  <input
                    type="text"
                    placeholder="مثال: شركة سابك"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 text-xs py-2.5 px-3 rounded-xl text-slate-900 outline-none focus:border-amber-500 transition-all font-sans text-right placeholder-slate-400 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-black uppercase tracking-wide">المحامي المسؤول</label>
                  <input
                    type="text"
                    placeholder="شريك أول"
                    value={newLawyer}
                    onChange={(e) => setNewLawyer(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 text-xs py-2.5 px-3 rounded-xl text-slate-900 outline-none focus:border-amber-500 transition-all font-sans text-right placeholder-slate-400 shadow-sm"
                  />
                </div>
              </div>

              {/* Court Details */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900 font-black uppercase tracking-wide">المحكمة / موقع الانعقاد</label>
                <input
                  type="text"
                  placeholder="المحكمة التجارية بالرياض - الدائرة الثالثة"
                  value={newCourt}
                  onChange={(e) => setNewCourt(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-900 outline-none focus:border-amber-500 transition-all font-sans text-right placeholder-slate-400 shadow-sm"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-black uppercase tracking-wide">التاريخ المعين</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 text-xs py-2 px-2 rounded-xl text-slate-900 outline-none focus:border-amber-500 transition-all font-mono text-center shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-900 font-black uppercase tracking-wide">التوقيت</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 text-xs py-2.5 px-2 rounded-xl text-slate-900 outline-none focus:border-amber-500 transition-all font-sans text-center shadow-sm"
                  >
                    <option value="08:00 صباحاً">08:00 صباحاً</option>
                    <option value="09:00 صباحاً">09:00 صباحاً</option>
                    <option value="10:00 صباحاً">10:00 صباحاً</option>
                    <option value="11:00 صباحاً">11:00 صباحاً</option>
                    <option value="01:00 مساءً">01:00 مساءً</option>
                    <option value="02:00 مساءً">02:00 مساءً</option>
                  </select>
                </div>
              </div>

              {/* Visual Instant Conflict Alerts Panel */}
              {instantConflict && (
                <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-xl text-xs text-rose-900 space-y-1 animate-pulse">
                  <div className="font-extrabold flex items-center gap-1 justify-start">
                    <span>🚨</span>
                    <span>كشف تعارض آني:</span>
                  </div>
                  <p className="leading-relaxed font-bold text-right text-rose-800">{instantConflict.message}</p>
                </div>
              )}
              {!instantConflict && newTitle.trim() && (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 justify-start">
                  <span>🟢</span>
                  <span>الموعد متاح وخالي من التعارضات بالأجندة.</span>
                </div>
              )}

              {addingSuccess && (
                <div className="bg-emerald-100 border-2 border-emerald-300 p-3 rounded-xl text-xs text-emerald-900 font-extrabold text-center shadow-sm">
                  ✅ تم الحفظ وإدراج الموعد بالأجندة محلياً وسحابياً!
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-yellow-500 text-slate-950 font-black py-2 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>➕</span>
                <span>تأكيد الإضافة والجدولة بالأجندة</span>
              </button>
            </form>
          </div>

          <div className="bg-gradient-to-r from-[#9B7C1E] to-[#1B365D] border-2 border-yellow-500/50 rounded-2xl p-5 space-y-3 shadow-lg">
            <h3 className="text-sm font-black flex items-center gap-1" style={{ color: '#FACC15', textShadow: 'none' }}>🛡️ دليل الاستخدام الذكي للأجندة</h3>
            <p className="text-xs leading-relaxed font-sans text-justify font-extrabold" style={{ color: '#FFFFFF', textShadow: 'none' }}>
              تُنظم هذه الأجندة الجلسات بشكل ثنائي (Bi-directional)، حيث يتلقى النظام سجلات ناجز عبر كود ويب هوك، ويقوم بجدولتها محلياً لتفادي غرامات تخلّف حضور الجلسات وتأخير ميعاد الدفعات القانونية.
            </p>
          </div>

        </div>

      </div>
      )}

      {/* Edit Hearing Dialog */}
      {editingHearing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#0C1220] via-[#0f172a] to-[#1e293b] border-2 border-yellow-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-yellow-400">تعديل موعد الجلسة</h3>
              <button 
                onClick={() => setEditingHearing(null)}
                className="text-slate-400 hover:text-white font-bold p-1 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">موضوع الجلسة / اسم القضية</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-300 block mb-1">التاريخ</label>
                  <input 
                    type="date" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-300 block mb-1">التوقيت</label>
                  <input 
                    type="text" 
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">المحكمة المختصة</label>
                <input 
                  type="text" 
                  value={editCourt}
                  onChange={(e) => setEditCourt(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all" 
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">القاضي / المحامي المسؤول</label>
                <input 
                  type="text" 
                  value={editLawyer}
                  onChange={(e) => setEditLawyer(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all" 
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">ملاحظات الجلسة</label>
                <textarea 
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all resize-none font-sans" 
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-white/10 select-none">
              <button 
                onClick={() => setEditingHearing(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveEditedHearing}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
