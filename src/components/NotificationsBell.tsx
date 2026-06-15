import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'urgent';
  action?: string;
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'تحديث الجلسات',
    message: 'تم إضافة جلسة استثنائية لقضية شركة المراعي غداً.',
    time: 'منذ ١٠ دقائق',
    read: false,
    type: 'warning'
  },
  {
    id: 'n2',
    title: 'مزامنة ناجز',
    message: 'اكتملت مزامنة ٤٥ حكماً قضائياً جديداً بنجاح.',
    time: 'منذ ساعتين',
    read: false,
    type: 'success'
  },
  {
    id: 'n3',
    title: 'تعارض في المواعيد',
    message: 'تم رصد تعارض في مواعيد الجلسات يوم الخميس القادم للمحامي سعد.',
    time: 'امس',
    read: true,
    type: 'urgent'
  },
  {
    id: 'n-deadline-alert',
    title: 'تنبيه مهلة استئناف',
    message: 'تبقي 5 أيام فقط على انتهاء مهلة الاستئناف في قضية رقم 5683921.',
    time: 'الآن',
    read: false,
    type: 'urgent'
  },
  {
    id: 'n4',
    title: 'تحديث تشريعي',
    message: 'صدرت تحديثات جديدة على اللائحة التنفيذية لنظام التكاليف القضائية.',
    time: 'امس',
    read: true,
    type: 'info'
  }
];

export default function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const fetchRealAlerts = async () => {
      try {
        const res = await fetch('/api/state');
        if (!res.ok) return;
        const stateData = await res.json();
        
        const realCases = stateData.cases || [];
        const activeCasesAlerts: Notification[] = [];
        
        realCases.forEach((c: any) => {
          const baseDateStr = c.lastSessionDate || c.createdAt || '2026-06-01';
          let baseDate = new Date();
          try {
            baseDate = new Date(baseDateStr);
          } catch(e){}
          const deadlineDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          const today = new Date();
          const diffTime = deadlineDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 30 && diffDays >= -15 && (c.status === 'primary_judgment' || c.status === 'appeal' || c.priority === 'high' || c.status === 'active')) {
            activeCasesAlerts.push({
              id: `real-case-alert-${c.id}`,
              title: `تنبيه مهلة استئناف: قضية ${c.caseNumber || ''}`,
              message: diffDays < 0 
                ? `تنبيه: انقضت مهلة الاستئناف منذ ${Math.abs(diffDays)} أيام لقضية "${c.caseName || ''}".`
                : `متبقي ${diffDays} أيام فقط على انتهاء مهلة الاستئناف لقضية "${c.caseName || ''}".`,
              time: 'الآن 🔔',
              read: false,
              type: 'urgent'
            });
          }
        });

        const realTasks = stateData.tasks || [];
        const tasksAlerts: Notification[] = [];
        realTasks.forEach((t: any) => {
          if (t.status !== 'done' && t.dueDate) {
            let limitDate = new Date();
            try {
              limitDate = new Date(t.dueDate);
            } catch(e){}
            const today = new Date();
            const diffTime = limitDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 7 && diffDays >= -3) {
              tasksAlerts.push({
                id: `real-task-alert-${t.id}`,
                title: `اقتراب موعد تسليم: ${t.title}`,
                message: diffDays < 0
                  ? `مهمة تجاوزت تاريخ الاستحقاق المطلوب للمستشار [${t.assignedTo || ''}]`
                  : `متبقي ${diffDays} أيام للعمل والانتهاء من المهمة المسندة إلى [${t.assignedTo || ''}]`,
                time: 'تنبيه فوري ⏳',
                read: false,
                type: 'warning'
              });
            }
          }
        });

        const realInvoices = stateData.invoices || [];
        const invoicesAlerts: Notification[] = [];
        realInvoices.forEach((inv: any) => {
          if (inv.status === 'pending' && inv.dueDate) {
            let dDate = new Date();
            try { dDate = new Date(inv.dueDate); } catch(e){}
            const diffTime = (new Date()).getTime() - dDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 30) {
              invoicesAlerts.push({
                id: `real-invoice-alert-${inv.id}`,
                title: `فاتورة متأخرة لأكثر من ٣٠ يوماً`,
                message: `تنبيه مالي: توجد فاتورة متأخرة للعميل [${inv.clientName || 'غير معروف'}] بقيمة ${inv.totalAmount} ر.س.`,
                time: 'تنبيه ذكي 💰',
                read: false,
                type: 'urgent',
                action: 'finance'
              });
            }
          }
        });

        // Fetch Powers of Attorney close to expiry
        const realPoas = stateData.powersOfAttorney || [];
        const poasAlerts: Notification[] = [];
        realPoas.forEach((poa: any) => {
          if (poa.expiryDate) {
            let expDate = new Date();
            try { expDate = new Date(poa.expiryDate); } catch(e){}
            const today = new Date();
            expDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const diffTime = expDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 60 && diffDays >= -15) {
              poasAlerts.push({
                id: `real-poa-alert-${poa.id}`,
                title: diffDays <= 0 ? `وكالة منتهية الصلاحية` : `قرب انتهاء صلاحية وكالة`,
                message: diffDays <= 0 
                  ? `انتهى سريان الوكالة رقم ${poa.poaNumber || ''} للموكل "${poa.clientName || ''}"`
                  : `متبقي ${diffDays} يوماً على انتهـاء الوكالة رقم ${poa.poaNumber || ''} للمוکل "${poa.clientName || ''}"`,
                time: 'تنبيه أمان 📄',
                read: false,
                type: diffDays <= 30 ? 'urgent' : 'warning',
                action: 'agencies'
              });
            }
          }
        });

        // Add to Notifications
        setNotifications(prev => {
          const filteredPrev = prev.filter(p => !p.id.startsWith('real-'));
          return [...invoicesAlerts, ...activeCasesAlerts, ...tasksAlerts, ...poasAlerts, ...filteredPrev];
        });

      } catch(e) {
        console.error("Error fetching real alerts for notification bell:", e);
      }
    };

    fetchRealAlerts();
    const interval = setInterval(fetchRealAlerts, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'success': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'urgent': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="fixed top-6 left-6 lg:left-8 lg:top-8 z-50" ref={dropdownRef} dir="rtl">
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-sm transition-all active:scale-95 group"
      >
        <Bell className="w-5 h-5 text-[#fbbf24] transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 text-[10px] font-black text-white items-center justify-center shadow-sm">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-3 left-0 w-[340px] bg-slate-900 border border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 backdrop-blur-md">
              <h3 className="font-black text-sm text-[#fbbf24] tracking-tight">الإشعارات </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="p-1.5 rounded-lg transition-colors text-slate-400" title="تحديد الكل كمقروء">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={handleClearAll} className="p-1.5 rounded-lg transition-colors text-slate-400" title="مسح الكل">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[min(60vh,400px)] overflow-y-auto w-full custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        handleMarkAsRead(notif.id);
                        if (notif.action) {
                           const event = new CustomEvent('global-navigate', { detail: notif.action });
                           window.dispatchEvent(event);
                           setIsOpen(false);
                        }
                      }}
                      className={`p-4 border-b border-slate-800 cursor-pointer transition-all relative group ${!notif.read ? 'bg-amber-500/5' : 'bg-slate-900'}`}
                    >
                      {!notif.read && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#fbbf24] rounded-full shadow-[0_0_5px_rgba(251,191,36,0.5)]"></div>
                      )}
                      <div className="pr-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getTypeStyles(notif.type)}`}>
                            {notif.type === 'urgent' ? 'عاجل' : notif.type === 'warning' ? 'تنبيه' : notif.type === 'success' ? 'نجاح' : 'معلومة'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notif.time}
                          </span>
                        </div>
                        <h4 className={`text-sm font-black mb-1 leading-tight ${notif.read ? 'text-slate-200' : 'text-[#fbbf24]'}`}>
                          {notif.title}
                        </h4>
                        <p className={`text-xs font-bold leading-relaxed line-clamp-2 ${notif.read ? 'text-slate-400' : 'text-white'}`}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <Bell className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold">لا توجد إشعارات حالياً</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
