/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  User, 
  Trash2, 
  Layout, 
  Calendar,
  AlertCircle,
  FolderOpen,
  Sparkles,
  Bell,
  BellRing,
  X,
  GripVertical,
  Maximize2,
  Timer,
  FileText,
  Gavel,
  FileCheck,
  CheckSquare,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { Task, Case } from '@/types';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import TaskCountdown from './TaskCountdown';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InteractiveCard } from './InteractiveCard';
import { SortableWidgetWrapper } from './SortableWidgetWrapper';
import { generateUUID } from '@/lib/uuid';


interface TasksModuleProps {
  tasks: Task[];
  cases: Case[];
  selectedRole: string;
  onUpdateState: (type: string, data: any) => void;
}

function CountdownTimer({ dueDate }: { dueDate?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    if (!dueDate) return;

    const calculate = () => {
      const targetDate = new Date(dueDate);
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('انتهى الموعد');
        setIsExpiringSoon(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days < 2) setIsExpiringSoon(true);
      
      let str = '';
      if (days > 0) str += `${days} يوم `;
      if (hours > 0) str += `${hours} ساعة `;
      str += `${minutes} دقيقة `;
      setTimeLeft(str);
    };

    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [dueDate]);

  if (!dueDate) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black border transition-all ${
      isExpiringSoon ? 'bg-rose-500 text-white animate-pulse border-rose-400' : 'bg-slate-900/40 text-[#fbbf24] border-[#fbbf24]/20'
    }`}>
      <Timer className="w-3 h-3" />
      <span>{timeLeft}</span>
    </div>
  );
}

export default function TasksModule({
  tasks,
  cases,
  selectedRole,
  onUpdateState
}: TasksModuleProps) {
  
  const [isAdding, setIsAdding] = useState(false);
  const [taskBgColors, setTaskBgColors] = useState<Record<string, string>>({});

  // Trigger new task modal from Command Palette or shortcuts
  useEffect(() => {
    const handleTriggerNewTask = () => {
      setIsAdding(true);
    };
    window.addEventListener('adalah-trigger-new-task', handleTriggerNewTask);
    return () => window.removeEventListener('adalah-trigger-new-task', handleTriggerNewTask);
  }, [setIsAdding]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [taskAssigned, setTaskAssigned] = useState('');
  const [taskCase, setTaskCase] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('09:00');
  const [taskReminderEnabled, setTaskReminderEnabled] = useState(false);
  const [taskReminderTime, setTaskReminderTime] = useState('09:00');
  const [taskType, setTaskType] = useState<'drafting' | 'hearing' | 'client_meeting' | 'audit' | 'other'>('drafting');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (data) {
        setTeamMembers(data);
        if (data.length > 0 && !taskAssigned) {
          setTaskAssigned(data[0].name);
        }
      }
    };
    fetchTeam();
  }, []);

  // Smart Sorting and Notification Alerts state
  const [smartAlertSortEnabled, setSmartAlertSortEnabled] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [simulatedAlertActive, setSimulatedAlertActive] = useState<string | null>(null);

  // Smart dynamic toast-based alerts system state
  interface SmartToast {
    id: string;
    title: string;
    message: string;
    type: 'critical' | 'alert' | 'warning' | 'info';
    taskId?: string;
    dueDate?: string;
    daysLeft?: number;
    assignedTo?: string;
  }
  const [toasts, setToasts] = useState<SmartToast[]>([]);

  // Automated Predictive Alerts for Sessions
  useEffect(() => {
    const checkSessionAlerts = () => {
      const today = new Date('2026-06-04');
      cases.forEach(c => {
        if (c.nextSessionDate) {
          const sessionDate = new Date(c.nextSessionDate);
          const diffMs = sessionDate.getTime() - today.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          if (diffHours > 0 && diffHours <= 48) {
            const hasTask = tasks.some(t => t.caseNumber === c.caseNumber && t.title.includes('مذكرة الدفاع'));
            if (!hasTask) {
              const newTask: Task = {
                id: `auto-memo-${c.id}`,
                title: `إعداد مذكرة الدفاع: قضية ${c.caseNumber}`,
                description: `تنبيه تنبؤي: الجلسة القادمة خلال أقل من 48 ساعة (${c.nextSessionDate}). يجب تجهيز مذكرة الدفاع والأسانيد فوراً.`,
                status: 'todo',
                priority: 'high',
                assignedTo: c.lead_lawyer_id || 'المحامي أحمد البقمي',
                dueDate: c.nextSessionDate,
                caseNumber: c.caseNumber
              };
              onUpdateState('tasks', newTask);

              // Simulate Email
              triggerToast(
                '📧 تنبيه تنبؤي مرسل',
                `تم إرسال بريد آلي للمحامي المسؤول بضرورة إعداد مذكرة القضية ${c.caseNumber} قبل موعد الجلسة بـ 48 ساعة.`,
                'warning'
              );
            }
          }
        }
      });
    };

    checkSessionAlerts();
    const interval = setInterval(checkSessionAlerts, 3600000); 
    return () => clearInterval(interval);
  }, [cases, tasks.length]);

  // Automated Appeal Deadline System
  useEffect(() => {
    const checkAppealDeadlines = () => {
      const urgentAlerts: SmartToast[] = [];
      cases.forEach(c => {
        if ((c.status === 'judgment_issued' || c.status === 'primary_judgment') && c.judgment_date) {
          const jDate = new Date(c.judgment_date);
          const deadline = new Date(jDate);
          deadline.setDate(deadline.getDate() + 30);
          
          const now = new Date();
          const diffMs = deadline.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

          if (diffDays > 0 && diffDays <= 30) {
            // Milestone reminders: 7 days, 3 days, 1 day
            let priority: 'critical' | 'alert' | 'warning' | 'info' = 'info';
            let msg = '';
            
            if (diffDays === 1 || diffHours < 24) {
              priority = 'critical';
              msg = '🚨 آخر فرصة! تنتهي مهلة الاستئناف غداً. يرجى تقديم اللائحة فوراً.';
            } else if (diffDays <= 3) {
              priority = 'alert';
              msg = `⏳ متبقي ${diffDays} أيام فقط على انتهاء مهلة الاستئناف النظامية.`;
            } else if (diffDays % 7 === 0 || diffDays === 7) {
              priority = 'warning';
              msg = `📅 موعد دوري: متبقي ${diffDays} أيام على مهلة الـ 30 يوماً للاستئناف.`;
            }

            if (msg) {
              urgentAlerts.push({
                id: `appeal-${c.id}-${diffDays}`,
                title: `مهلة استئناف: قضية ${c.caseNumber}`,
                message: msg,
                type: priority,
                daysLeft: diffDays,
                dueDate: deadline.toISOString().split('T')[0]
              });
            }
          }
        }
      });

      if (urgentAlerts.length > 0) {
        setToasts(prev => {
          // Avoid duplicates
          const newAlerts = urgentAlerts.filter(ua => !prev.some(p => p.id === ua.id));
          return [...prev, ...newAlerts];
        });
      }
    };

    checkAppealDeadlines();
    const interval = setInterval(checkAppealDeadlines, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, [cases]);

  // Advanced Browser Notification System
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          triggerToast('✓ تم تفعيل الإشعارات', 'سيعمل النظام على إرسال تذكيرات مباشرة لمتصفحك لضمان عدم فوات المواعيد.', 'info');
          new Notification('منصة العدالة', {
            body: 'تم تفعيل إشعارات المهام والتذكيرات القضائية بنجاح!',
            icon: '/logo.svg'
          });
        }
      } catch (err) {
        console.warn('Failed to request notification permission:', err);
      }
    } else {
      triggerToast('⚠️ المتصفح لا يدعم الإشعارات', 'يرجى استخدام متصفح حديث مثل كروم لضمان عمل كافة ميزات التنبيه.', 'warning');
    }
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.svg',
        dir: 'rtl'
      });
    }
  };

  const triggerToast = (
    title: string, 
    message: string, 
    type: 'critical' | 'alert' | 'warning' | 'info',
    extra?: Partial<SmartToast>
  ) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newToast: SmartToast = { id, title, message, type, ...extra };
    
    // Add toast to UI state (max 4 concurrent notifications)
    setToasts(prev => [newToast, ...prev].slice(0, 4));

    // Send native browser notification as well
    sendBrowserNotification(title, message);

    // Optional audio chirp feedback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      
      if (type === 'critical') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.15); // A3
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      } else {
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.08); // G5
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      }
      
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio blocked or disabled safely
    }

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8500);
  };

  // Automated background checker for approaching critical due dates and smart appeal deadlines
  useEffect(() => {
    const today = new Date('2026-06-04');
    
    // Check for cases that reached 'primary_judgment' and ensure they have an appeal task
    cases.forEach(c => {
      if (c.status === 'primary_judgment' || c.status === 'judgment_issued') {
        const hasAppealTask = tasks.some(t => 
          t.caseNumber === c.caseNumber && 
          (t.title.includes('استئناف') || t.title.includes('Appeal'))
        );

        if (!hasAppealTask) {
          const judgmentDate = new Date(c.judgment_date || c.lastActivityAt || '2026-06-01');
          const appealDeadline = new Date(judgmentDate.getTime());
          appealDeadline.setDate(appealDeadline.getDate() + 30);
          
          const deadlineStr = appealDeadline.toISOString().split('T')[0];
          
          // Auto-trigger a system task for the appeal deadline
          const newTask: Task = {
            id: `auto-appeal-${c.id}`,
            title: `تقديم لائحة استئناف: قضية ${c.caseNumber}`,
            description: `تم رصد صدور حكم ابتدائي. الموعد النهائي النظامي (30 يوماً) ينتهي في ${deadlineStr}.`,
            status: 'todo',
            priority: 'high',
            assignedTo: c.lead_lawyer_id || 'المحامي العام للمكتب',
            dueDate: deadlineStr,
            caseNumber: c.caseNumber
          };
          
          onUpdateState('tasks', newTask);
          
          triggerToast(
            '⚖️ تنبيه استئناف تلقائي',
            `تم رصد صدور حكم ابتدائي للقضية ${c.caseNumber}. تم جدولة موعد نهائي للاستئناف (30 يوماً) بنجاح.`,
            'critical'
          );

          if (!localStorage.getItem(`appeal-email-sent-${c.id}`)) {
            fetch('/api/send-custom-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: 'client@example.com', 
                subject: `إشعار هام: صدور صك حكم وتحديد مهلة الاستئناف لدعوى ${c.caseNumber}`,
                notificationType: 'تنبيه استئناف'
              })
            }).then(() => {
              localStorage.setItem(`appeal-email-sent-${c.id}`, 'true');
              triggerToast('📧 إشعار بريدي', `تم إرسال تنبيه بالبريد الإلكتروني للعميل بخصوص انقضاء مهلة الاستئناف للقضية ${c.caseNumber}`, 'info');
            }).catch(console.error);
          }
        }
      }
    });

    // Existing urgent tasks checker
    const initialUrgentTasks = tasks.filter(t => {
      if (t.status === 'done') return false;
      const days = getDaysLeft(t.dueDate);
      return days <= 3 || (t.priority === 'high' && days <= 5);
    });

    if (initialUrgentTasks.length > 0) {
      // Spawn staggered list of notifications
      initialUrgentTasks.forEach((t, index) => {
        const days = getDaysLeft(t.dueDate);
        setTimeout(() => {
          let type: 'critical' | 'alert' | 'warning' | 'info' = 'warning';
          let title = "🚨 موعد حرج قادم للمراجعة";
          let message = `المهمة: "${t.title}" تقترب من موعدها النهائي ولم يتم إنهاؤها بعد.`;

          if (days < 0) {
            type = 'critical';
            title = "⚠️ موعد مهمة منقضي الصلاحية!";
            message = `هذه المهمة تعدت الأجل القانوني المقدر وهو ${t.dueDate}!`;
          } else if (days <= 1) {
            type = 'critical';
            title = "🚨 إنذار أخير: فوات الميعاد متبقي أقل من ٢٤ ساعة!";
            message = `يجب إخلاء الطرف وصياغة المذكرات العارضة للعميل فوراً!`;
          } else if (days <= 3) {
            type = 'alert';
            title = "⚠️ تذكير بالأجل المضروب (٣ أيام متبقية)";
            message = `المهمة مسندة إلى: ${t.assignedTo}. يرجى تعجيل تقديم المستندات.`;
          }

          if (t.title.includes('استئناف') && (days === 7 || days === 3 || days === 1)) {
            const periodicKey = `periodic-appeal-email-${t.id}-${days}`;
            if (!localStorage.getItem(periodicKey)) {
              fetch('/api/send-custom-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: 'lawyer@example.com', 
                  subject: `تذكير استباقي: متبقي ${days} يوماً على المهلة النظامية للاستئناف لدعوى ${t.caseNumber}`,
                  notificationType: 'تذكير دوري'
                })
              }).then(() => {
                localStorage.setItem(periodicKey, 'true');
                triggerToast('📧 إشعار بريدي للمحامي', `تم إرسال تذكير استباقي متبقي ${days} أيام لتقديم لائحة الاستئناف.`, 'info');
              }).catch(console.error);
            }
          }

          triggerToast(title, message, type, {
            taskId: t.id,
            dueDate: t.dueDate,
            daysLeft: days,
            assignedTo: t.assignedTo
          });
        }, (index + 1) * 1500);
      });
    }
  }, [tasks.length]);

  const getDaysLeft = (dueDateStr: string): number => {
    if (!dueDateStr) return 999;
    try {
      const today = new Date('2026-06-04');
      const dueDate = new Date(dueDateStr);
      const diffTime = dueDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  };

  const getUrgencyScore = (task: Task): number => {
    let score = 0;
    if (task.priority === 'high') score += 30;
    else if (task.priority === 'medium') score += 15;
    else score += 5;

    const days = getDaysLeft(task.dueDate);
    if (days <= 0) score += 100; // Overdue
    else if (days <= 2) score += 65; // Extremely close
    else if (days <= 5) score += 30; // Approaching
    else if (days <= 10) score += 10;
    return score;
  };

  const notifySimulate = (task: Task) => {
    setSimulatedAlertActive(task.id);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio feedback context disabled', e);
    }
    setTimeout(() => {
      setSimulatedAlertActive(null);
    }, 4500);
  };

  // Drag and Drop State Management
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);

  const [internalTasks, setInternalTasks] = useState<Task[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tasks_local_order');
      if (saved) {
        const orderIds = JSON.parse(saved);
        const mapped = orderIds.map((id: string) => tasks.find(t => t.id === id)).filter(Boolean);
        const remaining = tasks.filter(t => !orderIds.includes(t.id));
        setInternalTasks([...mapped, ...remaining]);
      } else {
        setInternalTasks(tasks);
      }
    } catch {
      setInternalTasks(tasks);
    }
  }, [tasks]);

  const [taskSizes, setTaskSizes] = useState<Record<string, 'small' | 'medium' | 'full'>>(() => {
    try {
      const saved = localStorage.getItem('tasks_sizes_config');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleTaskSize = (taskId: string) => {
    const sequence: ('small' | 'medium' | 'full')[] = ['small', 'medium', 'full'];
    const current = taskSizes[taskId] || 'medium';
    const next = sequence[(sequence.indexOf(current) + 1) % sequence.length];
    const updated = { ...taskSizes, [taskId]: next };
    setTaskSizes(updated);
    localStorage.setItem('tasks_sizes_config', JSON.stringify(updated));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && active.rect && active.rect.current) {
      const { width, height } = active.rect.current;
      try {
        const existing = localStorage.getItem('dragged_card_dimensions_map')
          ? JSON.parse(localStorage.getItem('dragged_card_dimensions_map')!)
          : {};
        existing[active.id] = { width: Math.round(width), height: Math.round(height) };
        localStorage.setItem('dragged_card_dimensions_map', JSON.stringify(existing));
      } catch (e) {
        console.error(e);
      }
    }

    if (!over) {
      setDraggedTaskId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const activeTask = internalTasks.find(t => t.id === activeId);
    if (!activeTask) {
      setDraggedTaskId(null);
      return;
    }

    const overTask = internalTasks.find(t => t.id === overId);
    
    if (overTask && activeId !== overId) {
      if (activeTask.status !== overTask.status) {
        handleUpdateStatus(activeTask, overTask.status as any);
      }

      setInternalTasks((items) => {
        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);
        const newItems = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('tasks_local_order', JSON.stringify(newItems.map((t: any) => t.id)));
        return newItems;
      });
    } else {
      const statusIds = ['todo', 'in_progress', 'review', 'done'];
      if (statusIds.includes(overId) && activeTask.status !== overId) {
        handleUpdateStatus(activeTask, overId as any);
      }
    }

    setDraggedTaskId(null);
  };

  // AI Task Prioritization state variables
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiAppliedSuccessfully, setAiAppliedSuccessfully] = useState(false);

  const handleFetchAiPrioritization = async () => {
    setIsAiLoading(true);
    setShowAiSuggestions(true);
    setAiAppliedSuccessfully(false);
    try {
      const response = await fetch('/api/ai/prioritize-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks })
      });
      const data = await response.json();
      if (data.success && data.suggestions) {
        setAiSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('[TasksModule AI API] Error fetching:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiPrioritization = () => {
    if (aiSuggestions.length === 0) return;
    
    // Apply suggestions to each task inside global state!
    aiSuggestions.forEach(s => {
      const originalTask = tasks.find(t => t.id === s.taskId);
      if (originalTask) {
        const updatedTask = {
          ...originalTask,
          priority: s.suggestedPriority as 'low' | 'medium' | 'high'
        };
        onUpdateState('tasks', updatedTask);
      }
    });

    setAiAppliedSuccessfully(true);
    setTimeout(() => {
      setShowAiSuggestions(false);
      setAiSuggestions([]);
    }, 2500);
  };

  // Advanced Filter state variables
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterCaseNumber, setFilterCaseNumber] = useState<string>('');

  // Extract unique assignees dynamically for the filter options list
  const uniqueAssignees = Array.from(new Set(internalTasks.map(t => t.assignedTo).filter(Boolean))) as string[];

  // Real-time filtering engine
  const filteredTasks = internalTasks.filter(t => {
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchAssignee = filterAssignee === 'all' || t.assignedTo === filterAssignee;
    const matchCase = !filterCaseNumber || (t.caseNumber && t.caseNumber.includes(filterCaseNumber));
    return matchPriority && matchAssignee && matchCase;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    if (!taskDueDate) {
      triggerToast(
        "تنبيه: حقل مطلوب", 
        "يرجى اختيار تاريخ استحقاق للمهمة لضمان دقة مواعيد المهل القضائية وعدم فوات المواعيد النظامية.", 
        "warning"
      );
      return;
    }

    const newTask: Task = {
      id: generateUUID(),
      title: taskTitle,
      description: taskDesc,
      status: 'todo',
      priority: taskPriority,
      assignedTo: taskAssigned,
      dueDate: `${taskDueDate}T${taskDueTime}`,
      caseNumber: taskCase || undefined
    };

    onUpdateState('tasks', newTask);
    
    // Simulate scheduling a notification if the reminder is enabled
    if (taskReminderEnabled && taskReminderTime) {
      triggerToast(
        "تم تجدول التذكير بنجاح",
        `تم إضافة مجدول المتصفح في الخلفية لتنبيه المستشار "${taskAssigned}" في ${taskDueDate} وقت ${taskReminderTime}`,
        "info"
      );
    }
    
    setIsAdding(false);

    // reset
    setTaskTitle('');
    setTaskDesc('');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskReminderEnabled(false);
    setTaskReminderTime('');
  };

  const handleUpdateStatus = (task: Task, newStatus: 'todo' | 'in_progress' | 'review' | 'done') => {
    const updated = { ...task, status: newStatus };
    onUpdateState('tasks', updated);
  };

  const handleQuickReassign = (taskId: string, memberName: string) => {
    const taskToUpdate = internalTasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      const updated = { ...taskToUpdate, assignedTo: memberName };
      onUpdateState('tasks', updated);
    }
  };

  const columns = [
    { id: 'todo', name: 'المهام المعلقة / بانتظار قيد العمل', color: 'bg-blue-400' },
    { id: 'in_progress', name: 'قيد المطالعة القانونية والتنفيذ', color: 'bg-amber-400' },
    { id: 'review', name: 'مراجعة دفاع كبار المستشارين', color: 'bg-purple-400' },
    { id: 'done', name: 'مكتملة ومرفوعة لناجز', color: 'bg-emerald-400' }
  ];

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Upper Headline Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] tracking-tight">المهام وتوزيع الأعمال</h1>
          <p className="text-xs text-slate-700 mt-1 font-bold">
            متابعة إعداد مذكرات الرد، تجهيز الأسانيد، واجتماعات العملاء عبر منصة مسار التفاعلية للعملاء والمرافعين.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button 
            type="button"
            onClick={() => {
              const columns = ['المهمة', 'الوصف', 'الحالة', 'الأولوية', 'المسند إليه', 'تاريخ الاستحقاق', 'رقم الدعوى'];
              const data = filteredTasks.map(t => [
                t.title,
                t.description || '-',
                t.status === 'todo' ? 'معلقة' : t.status === 'in_progress' ? 'قيد العمل' : t.status === 'review' ? 'قيد المراجعة' : 'مكتملة',
                t.priority === 'high' ? 'عالية' : t.priority === 'medium' ? 'متوسطة' : 'منخفضة',
                t.assignedTo || '-',
                t.dueDate || '-',
                t.caseNumber || '-'
              ]);
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              const htmlContent = `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                  <meta charset="UTF-8">
                  <title>تقرير سجل المهام التكليفية والواجبات القضائية</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght=400;700&display=swap');
                    body { font-family: 'Cairo', sans-serif; padding: 40px; color: #111; }
                    .header { text-align: center; border-bottom: 2px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #b8860b; font-size: 24px; margin: 0; }
                    .meta { font-size: 13px; color: #555; margin-bottom: 20px; display: flex; justify-content: space-between; }
                    table { width: 100%; border-collapse: collapse; margin-block: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: right; font-size: 11px; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    @media print { .no-print { display: none; } }
                  </style>
                </head>
                <body>
                  <div class="no-print" style="margin-bottom: 20px;">
                    <button onclick="window.print();" style="background:#b8860b; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">طباعة التقرير الورقي 🖨️</button>
                  </div>
                  <div class="header">
                    <h1 className="text-xl font-black text-slate-900">منصة العدالة</h1>
                    <p>سجل الواجبات والمهام التكليفية والقضائية لساحة العمل</p>
                  </div>
                  <div class="meta">
                    <div>تاريخ السحب: ${new Date().toLocaleDateString('ar-SA')}</div>
                    <div>إجمالي المهام المفلترة: ${filteredTasks.length}</div>
                  </div>
                  <table>
                    <thead>
                      <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                      ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                  </table>
                </body>
                </html>
              `;
              printWindow.document.write(htmlContent);
              printWindow.document.close();
            }}
            className="bg-[#b8860b] text-white font-black py-2.5 px-5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 border border-primary/20"
            title="طباعة تقرير المهام"
          >
            <span>🖨️</span>
            <span>طباعة تقرير المهام</span>
          </button>

          <button 
            type="button"
            onClick={handleFetchAiPrioritization}
            className="bg-slate-900 border border-slate-700 text-amber-400 font-black py-2.5 px-5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span>تحليل الأولويات بالذكاء الاصطناعي 🧠⚖️</span>
          </button>

          <button 
            onClick={() => setIsAdding(true)}
            className="bg-primary text-white font-black py-2.5 px-5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-accent/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إسناد مهمة جديدة للزملاء +</span>
          </button>

          <button 
            onClick={requestNotificationPermission}
            className="bg-slate-100 text-slate-700 font-black py-2.5 px-5 rounded-2xl text-xs flex items-center gap-2 shadow-sm border border-slate-200 transition-all cursor-pointer"
            title="تفعيل إشعارات المتصفح"
          >
            <Bell className="w-4 h-4" />
            <span>تفعيل تذكيرات المتصفح 🔔</span>
          </button>
        </div>
      </div>

      {/* Embedded WhatsApp/Email Automation Panel removed to WhatsappTemplates as requested */}


      {/* AI Smart Prioritization suggestions box overlay/panel */}
      {showAiSuggestions && (
        <div className="bg-gradient-to-r from-amber-500/5 to-primary/5 rounded-[2rem] border border-primary/20 p-6 md:p-8 space-y-6 animate-fade-in relative overflow-hidden shadow-inner">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div className="text-right">
                <h3 className="font-display font-black text-base text-slate-950">مقترح ترتيب وتصنيف خطورة المهام بالـ AI 🧠🤖</h3>
                <p className="text-xs text-slate-700 mt-1">يقوم النظام بتحليل تواريخ المهل القضائية ومطابقة العائد الترافعي لتصنيف الأولويات بدقة نظامية.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowAiSuggestions(false)}
              className="p-1 px-2 text-slate-200 font-bold border border-transparent rounded-lg transition-all text-xs font-bold"
            >
              إلغاء المقترح ✕
            </button>
          </div>

          {isAiLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin"></div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-900">جاري الاستعلام ومطابقة المهل القضائية السعودية والمواعيد النافذة حالياً...</p>
                <p className="text-xs text-slate-700">مراجعة نصوص مذكرات الرد والاعتراض وفلترة مواعيد التمحيص الإداري</p>
              </div>
            </div>
          ) : aiAppliedSuccessfully ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-inner animate-bounce">
                <CheckSquare className="w-7 h-7" />
              </div>
              <p className="text-sm font-black text-emerald-600">تم تطبيق التوصيات وتحديث جدول أولويات المهام بالمنصة بنجاح! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4 text-right">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">عنوان المهمة المجدولة</th>
                      <th className="p-4">الأولوية الأصلية</th>
                      <th className="p-4">الأولوية المقترحة بالـ AI</th>
                      <th className="p-4">التحليل والمخاطرة القانونية</th>
                      <th className="p-4">التوصية ومسار التخفيف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-bold">
                    {aiSuggestions.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-black">{s.title}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-200 font-bold">
                            {s.originalPriority === 'high' ? 'عالية' : s.originalPriority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg border font-black ${
                            s.suggestedPriority === 'high' || s.suggestedPriority === 'critical'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : s.suggestedPriority === 'medium'
                            ? 'bg-amber-50 text-amber-400 font-black border-amber-200'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {s.suggestedPriority === 'high' || s.suggestedPriority === 'critical' ? 'عالية جداً 🔥' : s.suggestedPriority === 'medium' ? 'متوسطة 🛡️' : 'منخفضة 📋'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-200 font-bold leading-relaxed max-w-xs">{s.reason}</td>
                        <td className="p-4 text-primary font-black leading-relaxed max-w-xs">{s.actionPlan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex md:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiSuggestions(false)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-black transition-all cursor-pointer"
                >
                  إلغاء وتجاهل
                </button>
                <button
                  type="button"
                  onClick={handleApplyAiPrioritization}
                  className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-accent/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>تطبيق وإعادة تعيين مهام المستشارين فورياً ⚡</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Notifications and Expiration Watcher Center removed to Dashboard as requested */}


      {/* كارت توزيع المهام اليومي والعبء الوظيفي (Daily Task Distribution) */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden text-right" dir="rtl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-primary to-emerald-500"></div>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right">
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl border border-primary/20">
              <Layout className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-black text-[#ffd700] text-xl font-display tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">توزيع المهام اليومي والعبء الوظيفي (Daily Task Distribution)</h3>
              <p className="text-xs text-slate-200 mt-1.5 font-bold leading-relaxed">
                تخطيط مجهري ومتابعة لتوزيع ملفات القضايا والأعمال القضائية على الهيكل التكليفي بالمرصد. اسحب أي مهمة من "مخزن المهام" وأفلتها على بطاقة الموظف لإعادة التوزيع الفوري!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2.5 rounded-xl text-xs text-[#ffd700] font-black border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
            <span>● نظام الربط المتكامل مع الكادر التكليفي نشط</span>
          </div>
        </div>

        {/* 1. Workload Graphs & Drop Zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: '1', name: 'المحامي أحمد البقمي', role: 'مدير المكتب / محامي مرخص', avatar: '👨‍⚖️', maxTasks: 6 },
            { id: '2', name: 'سارة خالد', role: 'مستشار كبار قضايا', avatar: '👩‍💼', maxTasks: 5 },
            { id: '3', name: 'فهد عبدالله', role: 'أخصائي قضايا', avatar: '👨‍💻', maxTasks: 5 },
            { id: '4', name: 'نورة السعد', role: 'إدارية صياغة وتنسيق', avatar: '👩‍🔬', maxTasks: 4 }
          ].map((m) => {
            const memberTasks = internalTasks.filter(t => t.assignedTo?.toLowerCase().includes(m.name.slice(0, 5).toLowerCase()) || t.assignedTo === m.name);
            const count = memberTasks.length;
            const percentage = Math.min(100, Math.round((count / m.maxTasks) * 100));
            
            const isOverloaded = count >= m.maxTasks;
            const barColor = isOverloaded ? 'bg-rose-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
            const statusText = isOverloaded ? 'ممتد للطاقة القصوى ⚠️' : percentage >= 70 ? 'عبء مرتفع 📈' : 'متزن ومتاح للمهام ✅';
            const statusColor = isOverloaded ? 'text-rose-200 bg-rose-950 border border-rose-800' : percentage >= 70 ? 'text-amber-200 bg-amber-950 border border-amber-800' : 'text-emerald-205 bg-emerald-950 border border-emerald-800';

            return (
              <div 
                key={m.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("border-amber-500", "bg-amber-500/5", "scale-[1.02]", "ring-2", "ring-amber-500/20");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("border-amber-500", "bg-amber-500/5", "scale-[1.02]", "ring-2", "ring-amber-500/20");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-amber-500", "bg-amber-500/5", "scale-[1.02]", "ring-2", "ring-amber-500/20");
                  const taskId = e.dataTransfer.getData("taskId");
                  if (taskId) {
                    handleQuickReassign(taskId, m.name);
                  }
                }}
                className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 hover:border-[#D4AF37]/40 transition-all duration-300 flex flex-col justify-between space-y-4 shadow-xl"
              >
                {/* Employee Info Header */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900/90 flex items-center justify-center text-2xl border border-slate-750 font-black shrink-0 shadow-inner">
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <h4 className="font-extrabold text-white text-base truncate leading-snug">{m.name}</h4>
                    <p className="text-[11px] text-[#ffd700] truncate mt-0.5 font-black">{m.role}</p>
                  </div>
                </div>

                {/* Workload Progress Bar */}
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-205">عبء العمل الموكل:</span>
                    <span className="text-amber-400">{count} / {m.maxTasks} مهام ({percentage}%)</span>
                  </div>
                  
                  {/* Visual gauge chart */}
                  <div className="h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden shadow-inner flex">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.2)]`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-800/80 text-[11px] font-black">
                  <span className={`px-2.5 py-1 rounded-lg ${statusColor}`}>
                    {statusText}
                  </span>
                  <span className="text-slate-205 font-bold">{memberTasks.length} مهام نشطة</span>
                </div>

                {/* Drop Zone Call to Action */}
                <div className="border border-dashed border-amber-500/30 p-2.5 rounded-xl text-center text-[11px] text-slate-205 font-black bg-slate-900/50 hover:bg-amber-500/5 transition-all">
                  📥 اسحب البطاقات هنا للتكليف
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Drag Pool / Task Bank */}
        <div className="space-y-3 bg-slate-950/60 p-6 rounded-[2rem] border border-slate-800 text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h4 className="text-sm text-[#ffd700] font-black flex items-center gap-1.5 font-display">
              <span className="w-1.5 h-3 bg-amber-500 rounded-full"></span>
              مخزن المهام الحالي المتاح للتمرير وإعادة التوزيع (Workspace Task Pool)
            </h4>
            <span className="text-xs bg-amber-550/10 text-[#ffd700] px-3.5 py-1.5 rounded-full font-black border border-amber-500/30 select-none shadow">
              سحب مرن متاح لكافة العناصر أدناه 🖱️
            </span>
          </div>

          <p className="text-xs text-slate-205 font-bold leading-relaxed">
            يمكنك إمساك أي مهمة من البطاقات أدناه وسحبها وإفلاتها مباشرة على أي من كروت المحامين بالأعلى لتنفيذ إعادة توزيع سريع للجهد الوظيفي اليومي.
          </p>

          <div className="flex gap-3 overflow-x-auto py-2 max-h-52 pr-1 scrollbar-thin">
            {internalTasks.slice(0, 10).map((t) => (
              <div
                key={t.id}
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData("taskId", t.id);
                  e.currentTarget.classList.add("opacity-50");
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove("opacity-50");
                }}
                className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between w-64 min-w-[16rem] transition-all relative shrink-0 hover:border-amber-500/50 ${
                  t.priority === 'high' ? 'border-rose-800' : 
                  t.priority === 'medium' ? 'border-amber-800' : 'border-emerald-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                      t.priority === 'high' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                      t.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {t.priority === 'high' ? 'عاجلة' : t.priority === 'medium' ? 'متوسطة' : 'عادية'}
                    </span>
                    <span className="text-[11px] text-amber-300 font-extrabold bg-slate-950/80 px-2.5 py-0.5 rounded border border-slate-800">المكلف: {t.assignedTo || 'غير محدد'}</span>
                  </div>
                  
                  <h5 className="font-black text-white text-sm leading-relaxed mb-1 truncate">{t.title}</h5>
                  {t.description && (
                    <p className="text-[11px] text-slate-300 font-bold truncate mt-1 leading-normal">{t.description}</p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-800/80 mt-3 text-[11px]">
                  <span className="text-slate-300 font-black">الأجل: {t.dueDate}</span>
                  <span className="font-extrabold text-amber-400 animate-pulse bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">✊ اسحبني الآن</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar Panel */}
      <div className="bg-slate-50  border border-slate-800  p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-5 shadow-sm">
        
        {/* Filter by Priority */}
        <div className="space-y-1.5">
          <label className="text-xs text-primary font-black uppercase tracking-wider block">الأولوية والخطورة</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-white  border border-slate-800  text-xs font-bold text-slate-900  py-3 px-4 rounded-xl outline-none focus:border-primary  transition-all"
          >
            <option value="all">كافة الأولويات والمهام</option>
            <option value="high">شديدة الأولوية والخطورة</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>
        </div>

        {/* Filter by Colleague (Responsible) */}
        <div className="space-y-1.5">
          <label className="text-xs text-primary font-black uppercase tracking-wider block">المحامي المكلف / المستشار المسؤول</label>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full bg-white  border border-slate-800  text-xs font-bold text-slate-900  py-3 px-4 rounded-xl outline-none focus:border-primary  transition-all"
          >
            <option value="all">كافة الزملاء والمستشارين</option>
            <option value="المحامي أحمد البقمي">المحامي أحمد البقمي</option>
            <option value="المساعد سليمان الجاسر">المساعد سليمان الجاسر</option>
            <option value="الباحثة رانية الشمري">الباحثة رانية الشمري</option>
            <option value="فوزية بنت حمود">فوزية بنت حمود</option>
            {uniqueAssignees.filter(as => !['المحامي أحمد البقمي', 'المساعد سليمان الجاسر', 'الباحثة رانية الشمري', 'فوزية بنت حمود'].includes(as)).map((assignee, idx) => (
              <option key={idx} value={assignee}>{assignee}</option>
            ))}
          </select>
        </div>

        {/* Filter by Case Number */}
        <div className="space-y-1.5">
          <label className="text-xs text-primary font-black uppercase tracking-wider block">رقم القضية المرتبط بها</label>
          <div className="relative">
            <input
              type="text"
              placeholder="اكتب رقم القضية للبحث والتدقيق..."
              value={filterCaseNumber}
              onChange={(e) => setFilterCaseNumber(e.target.value)}
              className="w-full bg-white  border border-slate-800  text-xs font-bold text-slate-900  py-3 px-4 rounded-xl outline-none focus:border-primary  font-sans transition-all"
            />
            {filterCaseNumber && (
              <button
                type="button"
                onClick={() => setFilterCaseNumber('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900   font-black text-sm"
              >
                ×
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Kanban Board Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {columns.map((col) => {
            let colTasks = filteredTasks.filter(t => t.status === col.id);
            if (smartAlertSortEnabled) {
              colTasks = [...colTasks].sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
            }
            const isColumnHovered = hoveredColumnId === col.id;
            const isAnyTaskDragging = draggedTaskId !== null;

            return (
              <div 
                key={col.id} 
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setHoveredColumnId(col.id)}
                onDragLeave={() => {
                  if (hoveredColumnId === col.id) setHoveredColumnId(null);
                }}
                className={`border rounded-3xl p-4 flex flex-col space-y-4 min-h-[500px] shadow-sm transition-all duration-300 ease-out bg-slate-50 relative ${
                  isColumnHovered 
                    ? 'border-slate-400 ring-4 ring-slate-100 scale-[1.02] shadow-xl' 
                    : isAnyTaskDragging 
                      ? 'border-slate-300 bg-slate-100/50' 
                      : 'border-slate-200'
                }`}
              >
                
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color}`}></span>
                    <h3 className="font-black text-xs text-slate-900 pb-0.5">{col.name}</h3>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-200 font-bold px-2.5 min-w-5 h-5 flex items-center justify-center rounded-full font-black">
                    {colTasks.length}
                  </span>
                </div>

                {/* Drag and drop interactive helpful banner */}
                {isAnyTaskDragging && !isColumnHovered && (
                  <div className="border border-dashed border-primary/25 p-2 rounded-xl text-center text-[10px] text-slate-200 font-bold animate-pulse font-bold bg-primary/5">
                    🎯 اسحب البطاقة إلى هنا
                  </div>
                )}

                {isColumnHovered && (
                  <div className="border border-dashed border-primary/60 p-2.5 rounded-xl text-center text-xs text-primary animate-bounce font-black bg-primary/10">
                    ⚡ أفلت الآن للموافقة والنقل الفوري!
                  </div>
                )}

                {/* Column cards items list */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-1">
                  {colTasks.length === 0 ? (
                    <p className="text-sm text-slate-700 text-center py-12 font-bold">لا توجد سجلات.</p>
                  ) : (
                    <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {colTasks.map((t) => {
                        const size = taskSizes[t.id] || 'medium';
                        return (
                          <SortableWidgetWrapper
                            key={t.id}
                            id={t.id}
                            isCustomizing={true}
                            className="w-full"
                          >
                            {(() => {
                              return (
                                <motion.div
                                  layout
                                  className={`w-full p-5 rounded-2xl flex flex-col justify-between shadow-sm relative min-h-[200px] transition-all bg-white border border-slate-200 hover:shadow-md hover:border-slate-300`}
                                >

                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2 mr-auto">
                                        <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${
                                          t.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                          t.priority === 'medium' ? 'bg-amber-50 text-amber-400 font-black border-amber-200' : 
                                          'bg-slate-100 text-slate-200 font-bold border-slate-200'
                                        }`}>
                                          {t.priority === 'high' ? 'عالية الأهمية' : t.priority === 'medium' ? 'متوسطة' : 'عادية'}
                                        </span>
                                        
                                        {/* Countdown Timer Badge */}
                                        <TaskCountdown dueDate={t.dueDate} status={t.status} />
                                      </div>

                                      <div className="flex items-center gap-1 order-first">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            notifySimulate(t);
                                          }}
                                          title="إرسال تنبيه فوري"
                                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${simulatedAlertActive === t.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'}`}
                                        >
                                          {simulatedAlertActive === t.id ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleTaskSize(t.id);
                                          }}
                                          title="تعديل حجم عرض البطاقة"
                                          className="p-1 px-1.5 rounded-lg transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                                        >
                                          <Maximize2 className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="p-1 cursor-grab text-slate-200 font-bold hover:text-slate-200 font-bold transition-colors ml-1">
                                          <GripVertical className="w-4 h-4 text-white font-bold" />
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 mt-4">
                                      {(() => {
                                        const typeIcon = t.title.includes('جلسة') ? <Gavel className="w-4 h-4 text-slate-200 font-bold" /> :
                                                       t.title.includes('تدقيق') ? <FileCheck className="w-4 h-4 text-slate-200 font-bold" /> :
                                                       t.title.includes('مستند') || t.title.includes('لائحة') ? <FileText className="w-4 h-4 text-slate-200 font-bold" /> :
                                                       t.title.includes('استشارة') ? <MessageSquare className="w-4 h-4 text-slate-200 font-bold" /> :
                                                       <CheckSquare className="w-4 h-4 text-slate-700" />;
                                        
                                        const daysLeft = getDaysLeft(t.dueDate);
                                        const isGlowing = t.status !== 'done' && daysLeft <= 2;
                                        
                                        return (
                                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${isGlowing ? 'bg-amber-50 border-amber-200 text-amber-400 font-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                            {typeIcon}
                                          </div>
                                        );
                                      })()}
                                      <h4 className="text-slate-900 font-bold text-[13px] leading-relaxed line-clamp-2">{t.title}</h4>
                                    </div>
                                    
                                    {size !== 'small' && (
                                      <p className="text-slate-700 font-medium text-xs leading-relaxed line-clamp-3 pl-11">
                                        {t.description}
                                      </p>
                                    )}

                                    {size === 'full' && t.caseNumber && (
                                      <div className="mt-3 text-[10px] bg-slate-50 border border-slate-200 text-slate-200 font-bold px-3 py-2 rounded-xl font-mono flex items-center justify-between shadow-sm pl-11">
                                        <span className="font-bold">قضية قضائية موثقة</span>
                                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">#{t.caseNumber}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                                      <User className="w-3.5 h-3.5 text-slate-200 font-bold" />
                                      <span className="truncate max-w-[90px]">{t.assignedTo}</span>
                                    </span>

                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                                      <Clock className="w-3.5 h-3.5 text-slate-200 font-bold" />
                                      <span>{t.dueDate}</span>
                                    </span>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                                    <select
                                      value={t.status}
                                      onChange={(e) => handleUpdateStatus(t, e.target.value as any)}
                                      className="w-full bg-slate-50/80 border border-slate-200 text-slate-700 text-[11px] font-black py-2.5 px-3 rounded-xl outline-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm appearance-none"
                                    >
                                      <option value="todo">تعليق</option>
                                      <option value="in_progress">قيد العمل</option>
                                      <option value="review">مراجعة</option>
                                      <option value="done">مكتمل ✓</option>
                                    </select>
                                  </div>
                                </motion.div>
                              );
                            })()}
                          </SortableWidgetWrapper>
                        );
                      })}
                    </SortableContext>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </DndContext>

      {/* Task Creation Modal Popup */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black backdrop-blur-sm" onClick={() => setIsAdding(false)} />
          <div className="relative bg-slate-900 border border-[#fbbf24] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in-up">
            
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="font-black text-lg text-[#fbbf24] ">إسناد وتكليف مهمة جديدة</h2>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-white[#fbbf24] font-black cursor-pointer"
              >
                إغلاق ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-sm text-[#fbbf24]  block mb-1 font-black">مسمى وعنوان المهمة الاستشارية:</label>
                <input 
                  type="text"
                  placeholder="مثال: مراجعة الدفع بالحظر الجوي"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white  font-bold focus:outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div>
                <label className="text-sm text-[#fbbf24]  block mb-1 font-black">المحامي أو الزميل المكلف:</label>
                <select 
                  value={taskAssigned}
                  onChange={(e) => setTaskAssigned(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-2 text-xs text-white  font-bold cursor-pointer"
                >
                  <option value="">اختر الموظف...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} ({member.jobTitle || 'عضو فريق'})
                    </option>
                  ))}
                  {teamMembers.length === 0 && (
                    <>
                      <option value="المحامي أحمد البقمي">المحامي أحمد البقمي (مدير مكتب أول)</option>
                      <option value="المساعد سليمان الجاسر">المساعد سليمان الجاسر (محامي مترافع)</option>
                      <option value="الباحثة رانية الشمري">الباحثة رانية الشمري (استشارات شرعية)</option>
                      <option value="فوزية بنت حمود">فوزية بنت حمود (فريق السكرتارية)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#fbbf24]  block mb-1 font-black">مرتبطة برقم قضية:</label>
                  <select 
                    value={taskCase}
                    onChange={(e) => setTaskCase(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-2 text-xs text-white  font-bold"
                  >
                    <option value="">غير مرتبطة بقضية عامة</option>
                    {cases.map((c, idx) => (
                      <option key={idx} value={c.caseNumber}>قضية رقم #{c.caseNumber} ({c.clientName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-[#fbbf24] block mb-1 font-black">موعد وتاريخ الاستحقاق:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-sans font-bold focus:outline-none"
                    />
                    <input 
                      type="time"
                      value={taskDueTime}
                      onChange={(e) => setTaskDueTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-sans font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#fbbf24]  block mb-1 font-black">الأولوية والخطورة:</label>
                  <select 
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-2 text-xs text-white  font-bold"
                  >
                    <option value="high">شديدة الأولوية والخطورة</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-[#fbbf24] block font-black">تنبيهات المتصفح وإشعارات الويب:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTaskReminderEnabled(!taskReminderEnabled);
                        if (!taskReminderEnabled) requestNotificationPermission();
                      }}
                      className={`flex-1 text-[10px] font-black px-2 py-2 rounded-xl border flex items-center justify-center gap-1 transition-all ${taskReminderEnabled ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-200 font-bold border-slate-700'}`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {taskReminderEnabled ? 'تمكين التذكير الموقوت' : 'جدول إشعار استباقي'}
                    </button>
                    {taskReminderEnabled && (
                      <input 
                        type="time" 
                        value={taskReminderTime}
                        onChange={e => setTaskReminderTime(e.target.value)}
                        className="w-1/2 bg-slate-800 border border-slate-700 rounded-xl py-2 px-2 text-[10px] text-white font-sans font-bold focus:outline-none"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-[#fbbf24]  block mb-1 font-black">وصف وتوجيه العمل بالتفصيل:</label>
                <textarea 
                  rows={2}
                  placeholder="اكتب التوجيهات أو المذكرات لتعديل اللائحة هنا..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white  font-bold focus:outline-none focus:border-[#fbbf24] shadow-inner"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="bg-slate-800 text-white  font-bold py-2 px-4 rounded-xl text-xs border border-slate-700[#fbbf24] cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button 
                  type="submit"
                  className="bg-[#fbbf24] text-slate-950 font-black py-2 px-6 rounded-xl text-xs shadow-lg shadow-accent/20 cursor-pointer active:scale-95"
                >
                  إسناد وتثبيت المهمة +
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for quick task additions - Moved to right to make space for left notifications */}
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-2xl active:scale-95 transition-all z-40 border-2 border-white cursor-pointer flex items-center justify-center animate-bounce"
        style={{ animationDuration: '3s' }}
        title="إضافة مهمة سريعة"
      >
        <Plus className="w-6 h-6 transition-transform" />
      </button>

      {/* Floating Smart Toasts Notification Center - Moved to left side as requested */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none" style={{ direction: 'rtl' }}>
        <AnimatePresence>
          {toasts.map((toast) => {
            let borderAccent = 'border-yellow-500/40';
            let bgAccent = 'bg-slate-900/95';
            let iconText = 'text-yellow-400';
            let badgeText = 'تنبيه زمني';
            let badgeBg = 'bg-yellow-500/10 text-yellow-300 border-yellow-500/25';

            if (toast.type === 'critical') {
              borderAccent = 'border-rose-600/60 shadow-lg shadow-rose-600/10';
              bgAccent = 'bg-slate-950/95';
              iconText = 'text-rose-500 animate-pulse';
              badgeText = 'عاجل وحساس ⚠️';
              badgeBg = 'bg-rose-500 text-white';
            } else if (toast.type === 'alert') {
              borderAccent = 'border-amber-500/40';
              bgAccent = 'bg-[#0A101C]/95';
              iconText = 'text-amber-400';
              badgeText = 'تنبيه قانوني';
              badgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/20';
            } else if (toast.type === 'info') {
              borderAccent = 'border-sky-500/30';
              bgAccent = 'bg-slate-900/95';
              iconText = 'text-sky-400';
              badgeText = 'فحص النظام ✓';
              badgeBg = 'bg-sky-500/10 text-sky-300 border-sky-500/20';
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 100, transition: { duration: 0.2 } }}
                className={`${bgAccent} border-2 ${borderAccent} text-slate-900 p-5 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto relative overflow-hidden flex flex-col gap-2.5 max-w-sm w-full text-right`}
              >
                {/* Glowing bar indicator */}
                <div className={`absolute top-0 right-0 left-0 h-1 bg-current ${iconText}`} />

                <div className="flex items-start justify-between gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-950 rounded-lg">
                      <Bell className={`w-4 h-4 ${iconText}`} />
                    </div>
                    <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded border ${badgeBg}`}>
                      {badgeText}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="text-white/90 font-bold transition-colors p-1 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="font-black text-xs text-yellow-300 leading-snug">{toast.title}</h4>
                  <p className="text-[11px] text-white font-bold leading-relaxed mt-1 font-bold">{toast.message}</p>
                </div>

                {toast.dueDate && (
                  <div className="mt-1 flex items-center justify-between text-[10px] bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 font-bold text-white font-bold">
                      <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                      <span>الأجل: {toast.dueDate}</span>
                    </div>
                    {toast.daysLeft !== undefined && (
                      <span className={`font-black uppercase px-1.5 py-0.5 rounded ${
                        toast.daysLeft < 0 ? 'bg-rose-500/25 text-rose-300' : 'bg-yellow-400/25 text-yellow-300'
                      }`}>
                        {toast.daysLeft < 0 ? 'انقضت الفترة!' : `متبقي ${toast.daysLeft} أيام`}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}