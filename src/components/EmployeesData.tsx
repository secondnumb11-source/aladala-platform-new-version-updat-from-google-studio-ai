import React, { useState, useEffect } from 'react';
import TaskCountdown from './TaskCountdown';
import { 
  Users, Plus, Search, Phone, Mail, 
  UserCheck, Calendar, Briefcase, 
  FileText, Save, Settings as SettingsIcon, 
  ChevronRight, Trash2, GraduationCap, 
  CalendarDays, AtSign, Sparkles, Building2,
  CheckCircle2, X, Download, SlidersHorizontal, AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useSupabase } from '@/contexts/SupabaseContext';
import { Case, Task, Employee, Client } from '@/types';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// Procedural UUID Generator matching standard RFC4122 v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const normalizeEmployee = (emp: any): Employee => {
  if (!emp) return {} as Employee;
  return {
    ...emp,
    id: emp.id,
    name: emp.name || '',
    role: emp.role || '',
    email: emp.email || '',
    phone: emp.phone || '',
    status: emp.status || 'نشط',
    department: emp.department || '',
    joinDate: emp.joinDate || emp.join_date || '',
    nationalId: emp.nationalId || emp.national_id || '',
    nationalIdExpiry: emp.nationalIdExpiry || emp.national_id_expiry || '',
    username: emp.username || '',
    password: emp.password || '',
    customLoginToken: emp.customLoginToken || emp.custom_login_token || '',
    portalLink: emp.portalLink || emp.portal_link || '',
    qualification: emp.qualification || '',
    birthDate: emp.birthDate || emp.birth_date || '',
    manager: emp.manager || '',
    nationality: emp.nationality || '',
    startDate: emp.startDate || emp.start_date || '',
    endDate: emp.endDate || emp.end_date || '',
    branch: emp.branch || '',
    allowances: Number(emp.allowances || 0),
    deductions: Number(emp.deductions || 0),
    baseSalary: emp.baseSalary !== undefined ? Number(emp.baseSalary) : (emp.base_salary !== undefined ? Number(emp.base_salary) : 0),
    salary: emp.salary !== undefined ? Number(emp.salary) : (emp.baseSalary !== undefined ? Number(emp.baseSalary) : (emp.base_salary !== undefined ? Number(emp.base_salary) : 0))
  };
};

export default function EmployeesData({ tasks }: { cases: Case[], tasks: Task[], clients?: Client[], onUpdateState?: (t: string, d: any) => void }) {
  const { user, profile } = useSupabase();
  const { employees: rawEmployees, createRecord, updateRecord, deleteRecord, loading, refresh } = useSupabaseData();
  const employees = React.useMemo(() => {
    const emps = (rawEmployees || []).map(normalizeEmployee);
    emps.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return emps;
  }, [rawEmployees]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedConfigEmployee, setSelectedConfigEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<Employee>>({});

  // ---------------- NEW REMINDERS, FILTERS, SIZES, AND REPORTING STATES ----------------
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('الكل');
  const [selectedJobTitleFilter, setSelectedJobTitleFilter] = useState('الكل');
  
  const [isArranging, setIsArranging] = useState(false);
  const [cardSizes, setCardSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>(() => {
    try {
      const saved = localStorage.getItem('employees_card_sizes_v1');
      return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
  });

  const [employeeCustomOrder, setEmployeeCustomOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('employees_card_order_v1');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  const [showReportWizard, setShowReportWizard] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportHours, setReportHours] = useState<Record<string, number>>({});

  const getExpiryStatus = (expiryDateStr?: string) => {
    if (!expiryDateStr) return null;
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return {
      daysLeft: daysDiff,
      isExpiringSoon: daysDiff >= 0 && daysDiff <= 30,
      isExpired: daysDiff < 0
    };
  };

  const expiringEmployeesList = React.useMemo(() => {
    return employees.filter(emp => {
      const status = getExpiryStatus(emp.nationalIdExpiry);
      return status?.isExpiringSoon === true;
    }).map(emp => {
      const status = getExpiryStatus(emp.nationalIdExpiry);
      const docType = emp.nationality === 'سعودي' ? 'الهوية الوطنية' : 'الإقامة';
      return {
        ...emp,
        docType,
        daysLeft: status?.daysLeft || 0
      };
    });
  }, [employees]);

  const uniqueJobTitles = React.useMemo(() => {
    const titles = employees.map(e => e.jobTitle).filter(Boolean);
    return ['الكل', ...Array.from(new Set(titles))];
  }, [employees]);

  const uniqueBranches = React.useMemo(() => {
    const branches = employees.map(e => e.branch).filter(Boolean);
    return ['الكل', ...Array.from(new Set(branches))];
  }, [employees]);

  const filteredAndSortedList = React.useMemo(() => {
    let result = [...employees];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(emp => 
        (emp.name || '').toLowerCase().includes(q) || 
        (emp.jobTitle || '').toLowerCase().includes(q) || 
        (emp.nationalId || '').toLowerCase().includes(q) || 
        (emp.branch || '').toLowerCase().includes(q)
      );
    }
    if (selectedJobTitleFilter !== 'الكل') {
      result = result.filter(emp => emp.jobTitle === selectedJobTitleFilter);
    }
    if (selectedBranchFilter !== 'الكل') {
      result = result.filter(emp => emp.branch === selectedBranchFilter);
    }
    if (!q && selectedJobTitleFilter === 'الكل' && selectedBranchFilter === 'الكل' && employeeCustomOrder.length > 0) {
      const orderMap = new Map(employeeCustomOrder.map((id, index) => [id, index]));
      result.sort((a, b) => {
        const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
        const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
        return indexA - indexB;
      });
    }
    return result;
  }, [employees, searchQuery, selectedJobTitleFilter, selectedBranchFilter, employeeCustomOrder]);

  const reportData = React.useMemo(() => {
    return employees.map(emp => {
      const completedTasksCount = (tasks || []).filter((t: any) => {
        const assignedName = (t.assignedTo || '').toLowerCase().trim();
        const empName = (emp.name || '').toLowerCase().trim();
        const empUser = (emp.username || '').toLowerCase().trim();
        return (assignedName === empName || assignedName === empUser) && 
               (t.status === 'completed' || t.status === 'done');
      }).length;
      return {
        id: emp.id,
        name: emp.name,
        jobTitle: emp.jobTitle,
        nationalId: emp.nationalId,
        email: emp.email || '',
        phone: emp.phone || '',
        hours: reportHours[emp.id] !== undefined ? reportHours[emp.id] : 160,
        completedTasks: completedTasksCount
      };
    });
  }, [employees, tasks, reportHours]);

  const handleExportCSV = () => {
    let csvContent = "\uFEFF";
    csvContent += "اسم الموظف,المسمى الوظيفي,رقم الهوية,ساعات العمل,المهام المنجزة,البريد الالكتروني\n";
    reportData.forEach(row => {
      csvContent += `"${row.name}","${row.jobTitle}","${row.nationalId}",${row.hours},${row.completedTasks},"${row.email}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الكادر_الشهري_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rowsHtml = reportData.map((row, idx) => `
      <tr>
        <td style="padding:12px; border-bottom:1px solid #e2e8f0; font-family:monospace;">${idx + 1}</td>
        <td style="padding:12px; border-bottom:1px solid #e2e8f0; font-weight:900; color:#0f172a;">${row.name}</td>
        <td style="padding:12px; border-bottom:1px solid #e2e8f0; font-weight:bold; color:#475569;">${row.jobTitle}</td>
        <td style="padding:12px; border-bottom:1px solid #e2e8f0; font-family:monospace;">${row.nationalId}</td>
        <td style="padding:12px; border-bottom:1px solid #e2e8f0; font-weight:black; color:#0f172a; font-family:monospace;">${row.hours} ساعة</td>
        <td style="padding:12px; border-bottom:1px solid #e2e8f0; font-weight:black; color:#db2777; font-family:monospace;">${row.completedTasks} مهمة منجزة</td>
      </tr>
    `).join('');
    win.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير أداء الكادر القضائي - ${reportMonth}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #fff; color: #0f172a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; }
            h1 { font-size: 22px; font-weight: 900; margin: 0; color: #0f172a; }
            .subtitle { font-size: 13px; font-weight: bold; color: #64748b; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; text-align: right; margin-top: 20px; }
            th { background-color: #f8fafc; color: #475569; font-size: 11px; font-weight: 900; padding: 12px; border-bottom: 2px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>العدالة الذكية للهواية القضائية واحتساب الأجور</h1>
              <p class="subtitle">تقرير مؤشرات الكفاءة وساعات العمل لشهر: ${reportMonth}</p>
            </div>
            <div style="text-align: left; font-size: 12px; font-weight: bold; color: #94a3b8;">
              رمز التقرير: REPORT-${reportMonth}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>اسم الموظف كلياً</th>
                <th>المسمى الوظيفي</th>
                <th>رقم الهوية الوطنية/الإقامة</th>
                <th>إجمالي ساعات العمل</th>
                <th>المهام المكتملة</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const moveEmployeeCard = (index: number, direction: 'prev' | 'next') => {
    const list = [...filteredAndSortedList];
    if (direction === 'prev' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'next' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    const orderIds = list.map(e => e.id);
    setEmployeeCustomOrder(orderIds);
    localStorage.setItem('employees_card_order_v1', JSON.stringify(orderIds));
  };

  const handleResizeCard = (id: string, size: 'small' | 'medium' | 'large') => {
    const updated = { ...cardSizes, [id]: size };
    setCardSizes(updated);
    localStorage.setItem('employees_card_sizes_v1', JSON.stringify(updated));
  };

  // Employees list is now loaded and synced centrally from useSupabaseData hook

  useEffect(() => {
    if (selectedConfigEmployee) {
      setFormData(selectedConfigEmployee);
    } else {
      setFormData({
        name: '',
        nationality: 'سعودي',
        nationalId: '',
        nationalIdExpiry: '',
        phone: '',
        jobTitle: '',
        birthDate: '',
        qualification: '',
        email: '',
        manager: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        branch: 'الفرع الرئيسي',
        status: 'نشط'
      });
    }
  }, [selectedConfigEmployee, view]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Verification for National ID / Iqama
    const nid = (formData.nationalId || '').trim();
    if (!nid) {
      alert('⚠️ الرجاء إدخال رقم الهوية الوطنية أو الإقامة للموظف.');
      return;
    }
    if (!/^[12]\d{9}$/.test(nid)) {
      alert('⚠️ خطأ في رقم الهوية الوطنية/الإقامة: يجب أن يتكون من 10 خانات رقمية تماماً ويبدأ بـ 1 أو 2.');
      return;
    }

    if (!formData.name || !formData.name.trim()) {
      alert("⚠️ الرجاء إدخال الاسم الكامل للموظف.");
      return;
    }

    if (!formData.jobTitle || !formData.jobTitle.trim()) {
      alert("⚠️ الرجاء إدخال المسمى الوظيفي للموظف.");
      return;
    }

    const isNew = !formData.id;
    // For new records, we don't send an ID to Supabase (let it generate one)
    // Or we generate a proper UUID if needed. The DB accepts UUIDs.
    const tempId = formData.id || generateUUID();
    
    // We must strictly use snake_case keys that exist in the DB columns
    const empData: any = {
      name: formData.name || '',
      role: formData.role || '',
      email: formData.email || '',
      phone: formData.phone || '',
      status: formData.status || 'نشط',
      department: formData.department || '',
      national_id: nid,
      username: formData.username || `emp_${tempId.substring(0, 8)}`,
      password: formData.password || `pass_${Math.random().toString(36).substring(2, 6)}`,
      custom_login_token: formData.customLoginToken || btoa(`${tempId}-${Math.random().toString(36).substring(2, 10)}`),
      qualification: formData.qualification || '',
      birth_date: formData.birthDate || '',
      manager: formData.manager || '',
      nationality: formData.nationality || '',
      national_id_expiry: formData.nationalIdExpiry || '',
      start_date: formData.startDate || '',
      end_date: formData.endDate || '',
      branch: formData.branch || 'الفرع الرئيسي',
      allowances: Number(formData.allowances) || 0,
      deductions: Number(formData.deductions) || 0,
      base_salary: Number(formData.baseSalary) || 0,
      salary: Number(formData.salary || formData.baseSalary) || 0
    };
    
    empData.portal_link = `${window.location.origin}/employee-portal?user=${empData.username}&token=${empData.custom_login_token}`;

    if (!isNew) {
      empData.id = formData.id;
    }

    // Ensure no undefined or NaN values
    Object.keys(empData).forEach(key => {
      if (empData[key] === undefined) {
        delete empData[key];
      }
      if (typeof empData[key] === 'number' && Number.isNaN(empData[key])) {
         empData[key] = 0;
      }
    });

    try {
      let res;
      if (isNew) {
        res = await createRecord('employees', empData);
      } else {
        res = await updateRecord('employees', formData.id as string, empData);
      }

      if (res && res.success) {
        // Fetch from DB to ensure local state has the true DB record (with DB ID if it was inserted)
        if (refresh) await refresh();
        
        // Update localStorage fallback
        const updatedRaw = await supabase.from('employees').select('*');
        if (updatedRaw && updatedRaw.data) {
          localStorage.setItem('adalah_employees_cache', JSON.stringify(updatedRaw.data));
        }

        alert('✅ تم حفظ بيانات الموظف ومزامنتها بنجاح مع كافة الأقسام وبوابة الموظفين.');
        setView('list');
        setSelectedConfigEmployee(null);
        setFormData({});
      } else {
        alert(`❌ فشل حفظ بيانات الموظف: ${res?.message || 'خطأ غير معروف'}`);
      }
    } catch (err: any) {
      console.error("Save employee exception:", err);
      alert(`❌ حدث خطأ غير متوقع أثناء حفظ بيانات الموظف: ${err.message || String(err)}`);
    }
  };

  const handleDeleteEmployee = async (id: string | number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    try {
      const res = await deleteRecord('employees', id);
      if (res && res.success) {
        alert('✅ تم حذف الموظف بنجاح.');
      } else {
        alert(`❌ فشل حذف الموظف: ${res?.message || 'خطأ غير معروف'}`);
      }
    } catch (err: any) {
      alert(`❌ حدث خطأ أثناء محاولة حذف الموظف: ${err.message || String(err)}`);
    }
  };

  const filtered = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (emp.name || '').toLowerCase().includes(q) || (emp.jobTitle || '').toLowerCase().includes(q);
  });

  if (view === 'form') {
    return (
      <div className="flex-1 p-8 md:p-12 bg-[#F8FAFC] min-h-screen font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[#0f172a] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                {selectedConfigEmployee ? <SettingsIcon className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight mb-1">
                  {selectedConfigEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
                </h1>
                <p className="text-slate-700 font-bold text-sm">أدخل البيانات بنظام الموارد البشرية المركزي</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => window.print()}
                className="px-5 py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-black rounded-2xl flex items-center gap-2 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4" />
                تصدير (PDF)
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveEmployee} className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 md:p-12 space-y-10">
            
            {/* National & Job Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">البيانات الشخصية والوظيفية</h3>
                  <p className="text-[11px] text-slate-700 font-bold">المعلومات المرجعية للهوية والوظيفة</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">اسم الموظف الكامل</label>
                  <input 
                    name="name" 
                    value={formData.name || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-right text-slate-900"
                    placeholder="الاسم الرباعي الرسمي"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">رقم الهوية / الإقامة</label>
                  <input 
                    name="nationalId" 
                    maxLength={10}
                    value={formData.nationalId || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-left text-slate-900"
                    placeholder="10XXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">تاريخ انتهاء الهوية / الإقامة</label>
                  <input 
                    type="date"
                    name="nationalIdExpiry" 
                    value={formData.nationalIdExpiry || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">الجنسية</label>
                  <input 
                    name="nationality" 
                    value={formData.nationality || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                    placeholder="سعودي / مقيم"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">المسمى الوظيفي</label>
                  <input 
                    name="jobTitle" 
                    value={formData.jobTitle || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                    placeholder="مثال: محامي استئناف"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">تاريخ الميلاد</label>
                  <input 
                    type="date"
                    name="birthDate" 
                    value={formData.birthDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">المؤهل الدراسي</label>
                  <input 
                    name="qualification" 
                    value={formData.qualification || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                    placeholder="بكالوريوس قانون / ماجستير"
                  />
                </div>
              </div>
            </section>

            {/* Communication details */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <AtSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">بيانات الاتصال والتواصل</h3>
                  <p className="text-[11px] text-slate-700 font-bold">تأمين قنوات التواصل الرسمية للموظف</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">رقم الجوال</label>
                  <input 
                    name="phone" 
                    value={formData.phone || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-left text-slate-900"
                    placeholder="05XXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">البريد الإلكتروني</label>
                  <input 
                    type="email"
                    name="email" 
                    value={formData.email || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-left text-slate-900"
                    placeholder="employee@firm.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">المدير المباشر</label>
                  <input 
                    name="manager" 
                    value={formData.manager || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-right text-slate-900"
                    placeholder="اسم المدير المسؤول"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">حالة العمل الحالية</label>
                  <select 
                    name="status" 
                    value={formData.status || 'نشط'} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black focus:bg-white focus:border-blue-500 transition-all outline-none cursor-pointer text-slate-900"
                  >
                    <option value="نشط">نشط (على رأس العمل)</option>
                    <option value="إجازة">في إجازة</option>
                    <option value="مستقيل">مستقيل / منتهي الخدمة</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Employment Record */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">سجل التوظيف والخدمة</h3>
                  <p className="text-[11px] text-slate-700 font-bold">توثيق تواريخ المباشرة وفترات العمل</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">تاريخ بدء العمل (المباشرة)</label>
                  <input 
                    type="date"
                    name="startDate" 
                    value={formData.startDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-1 block">تاريخ ترك العمل (إن وُجد)</label>
                  <input 
                    type="date"
                    name="endDate" 
                    value={formData.endDate || ''} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-slate-900"
                  />
                </div>
              </div>
            </section>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-end">
              <button 
                type="button"
                onClick={() => { setView('list'); setSelectedConfigEmployee(null); }}
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
                إلغاء والعودة
              </button>
              <button 
                type="submit"
                className="px-8 py-4 bg-[#0f172a] hover:bg-slate-800 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
              >
                <Save className="w-5 h-5" />
                حفظ بيانات الموظف
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 bg-[#F8FAFC] min-h-screen text-right font-sans" dir="rtl">
      
      {/* Top Professional Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-[#0f172a] text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shrink-0">
               <Users className="w-8 h-8" />
             </div>
             <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">قاعدة بيانات الموظفين</h1>
               <p className="text-slate-700 font-bold text-sm mt-1">البوابة المركزية لإدارة الكادر الوظيفي وموازنة الصلاحيات والوصول الرقمي</p>
             </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowReportWizard(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 text-sm"
          >
            <FileText className="w-5 h-5" />
            <span>تقارير الأداء والرواتب</span>
          </button>
          <button 
            onClick={() => setIsArranging(!isArranging)}
            className={`font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 text-sm ${
              isArranging ? 'bg-amber-505 bg-amber-500 text-white border-transparent' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5 text-amber-500" />
            <span>{isArranging ? 'حفظ ترتيب الهيكلة' : 'تخصيص الواجهة والترتيب'}</span>
          </button>
          <button 
            onClick={() => { setView('form'); setSelectedConfigEmployee(null); }}
            className="bg-[#0f172a] hover:bg-slate-800 text-white font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 text-sm group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>اضافة بيانات موظف</span>
          </button>
        </div>
      </div>

      {/* Proactive Iqama/ID expiry warnings list */}
      {expiringEmployeesList.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mt-8 bg-amber-50 border border-amber-200 rounded-[2rem] p-6 shadow-sm flex items-start gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="w-12 h-12 bg-amber-500 text-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">⚠️ تنبيه إداري نشط: وثائق رسمية تقترب من الانتهاء خلال 30 يوماً!</h3>
            <p className="text-xs text-slate-200 font-bold font-bold">يقوم النظام تلقائياً بتذكير المدير والإدارة القانونية بالمكتب قبل 30 يوماً لبدء إجراءات تجديد هويات الموظفين المذكورين أدناه لتلافي غرامات النظام ودعم الاستقرار الوظيفي:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
              {expiringEmployeesList.map((emp: any) => (
                <div key={emp.id} className="bg-white/80 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-extrabold text-slate-800 truncate max-w-[120px]">{emp.name}</span>
                  </div>
                  <span className="text-rose-600 font-extrabold shrink-0">متبقي {emp.daysLeft} يوماً ({emp.docType})</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Control Utility Toolbar */}
      <div className="mt-8 bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 font-bold group-focus-within:text-blue-600 transition-colors" />
          <input 
            placeholder="البحث عن موظف (بالاسم، المسمى الوظيفي، رقم الهوية)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-200 font-bold"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="space-y-1.5 min-w-[200px]">
            <select
              value={selectedBranchFilter}
              onChange={e => setSelectedBranchFilter(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black text-slate-700 transition-all outline-none"
            >
              <option value="الكل">بطبيعة الفرع: الكل</option>
              {uniqueBranches.filter(b => b !== 'الكل').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 min-w-[200px]">
            <select
              value={selectedJobTitleFilter}
              onChange={e => setSelectedJobTitleFilter(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black text-slate-700 transition-all outline-none"
            >
              <option value="الكل">بالمسمى الوظيفي: الكل</option>
              {uniqueJobTitles.filter(j => j !== 'الكل').map(jt => (
                <option key={jt} value={jt}>{jt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employee Professional Directory Grid */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 border-[4px] border-[#0f172a] border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
             <h2 className="text-xl font-black text-slate-900">جاري تحميل سجلات الموظفين</h2>
          </div>
        </div>
      ) : filteredAndSortedList.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-10 py-32 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 text-white font-bold shadow-sm"
        >
          <Users className="w-20 h-20 opacity-10" />
          <div className="text-center">
            <p className="font-black text-xl text-slate-900">لا توجد سجلات مطابقة</p>
            <p className="font-bold text-slate-200 font-bold text-sm mt-2">ابدأ بإثراء سجلات مكتبك بإضافة موظف جديد</p>
          </div>
          <button 
            onClick={() => setView('form')}
            className="px-8 py-3.5 bg-[#0f172a] text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            إضافة كادر وظيفي
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">
          {filteredAndSortedList.map((emp, idx) => {
            const cardWidthClass = cardSizes[emp.id] === 'large' ? 'col-span-1 lg:col-span-3' : cardSizes[emp.id] === 'medium' ? 'col-span-1 lg:col-span-2' : 'col-span-1';
            return (
              <motion.div 
                key={emp.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col relative group hover:border-[#0f172a]/20 transition-all ${cardWidthClass}`}
              >
                
                {/* Arrangement Toolbar element when customization is active */}
                {isArranging && (
                  <div className="absolute top-4 left-4 z-40 flex items-center gap-1.5 bg-slate-900 text-white border border-slate-800 p-2 rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => moveEmployeeCard(idx, 'prev')} 
                      disabled={idx === 0}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-black rounded-lg disabled:opacity-30 active:scale-90"
                      title="تحريك للخلف"
                    >
                      ⬅️
                    </button>
                    <button 
                      onClick={() => moveEmployeeCard(idx, 'next')} 
                      disabled={idx === filteredAndSortedList.length - 1}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-black rounded-lg disabled:opacity-30 active:scale-90"
                      title="تحريك للأمام"
                    >
                      ➡️
                    </button>
                    <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                    <button 
                      onClick={() => handleResizeCard(emp.id, 'small')} 
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors ${(!cardSizes[emp.id] || cardSizes[emp.id] === 'small') ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-white font-bold'}`}
                    >
                      صغير
                    </button>
                    <button 
                      onClick={() => handleResizeCard(emp.id, 'medium')} 
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors ${(cardSizes[emp.id] === 'medium') ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-white font-bold'}`}
                    >
                      متوسط
                    </button>
                    <button 
                      onClick={() => handleResizeCard(emp.id, 'large')} 
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors ${(cardSizes[emp.id] === 'large') ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-white font-bold'}`}
                    >
                      عريض
                    </button>
                  </div>
                )}

                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0f172a] font-black text-xl border border-slate-100 shadow-sm overflow-hidden">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span>{emp.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">{emp.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-700" />
                        <p className="text-slate-700 font-bold text-[11px] uppercase">{emp.jobTitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wide shadow-sm flex items-center justify-center shrink-0 ${
                    emp.status === 'نشط' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-400 font-black'
                  }`}>
                    {emp.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-slate-100 pt-6">
                  {(() => {
                    const empTasks = (tasks || []).filter(t => (t.assignedTo || '').toLowerCase() === (emp.name || '').toLowerCase() && t.status !== 'done');
                    const mostUrgentTask = [...empTasks].sort((a,b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())[0];
                    
                    return mostUrgentTask ? (
                      <div className="col-span-2 space-y-2 mb-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-200 font-bold">أكثر مهمة إلحاحاً:</span>
                            <TaskCountdown dueDate={mostUrgentTask.dueDate || ''} status={mostUrgentTask.status} />
                         </div>
                         <p className="text-[11px] font-black text-slate-700 truncate">{mostUrgentTask.title}</p>
                      </div>
                    ) : null;
                  })()}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-200 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      رقم الهوية
                    </div>
                    <p className="text-slate-900 font-mono font-black text-sm">{emp.nationalId || '---'}</p>
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-200 font-bold">
                      <CalendarDays className="w-3.5 h-3.5" />
                      انتهاء الوثيقة
                    </div>
                    {emp.nationalIdExpiry ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-mono font-black text-sm">{emp.nationalIdExpiry}</span>
                        {(() => {
                          const status = getExpiryStatus(emp.nationalIdExpiry);
                          if (status?.isExpiringSoon) {
                            return <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title={`ينتهي خلال ${status.daysLeft} يوماً!`} />;
                          } else if (status?.isExpired) {
                            return <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="منتهية!" />;
                          }
                          return <span className="w-2 h-2 rounded-full bg-emerald-500" title="صالحة وفعالة" />;
                        })()}
                      </div>
                    ) : (
                      <p className="text-slate-200 font-bold font-bold text-sm">غير محدد</p>
                    )}
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-200 font-bold">
                      <Building2 className="w-3.5 h-3.5" />
                      الجنسية
                    </div>
                    <p className="text-slate-900 font-black text-sm">{emp.nationality || '---'}</p>
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-200 font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      بدء العمل
                    </div>
                    <p className="text-slate-900 font-mono font-black text-sm">{emp.startDate || '---'}</p>
                  </div>
                  <div className="space-y-1.5 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-200 font-bold">
                      <GraduationCap className="w-3.5 h-3.5" />
                      المؤهل
                    </div>
                    <p className="text-slate-900 font-black text-sm truncate">{emp.qualification || '---'}</p>
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-200 font-bold">
                      <AtSign className="w-3.5 h-3.5" />
                      تواصل
                    </div>
                    <p className="text-slate-900 font-mono font-black text-[13px] truncate">{emp.phone || emp.email || '---'}</p>
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-200 font-bold">
                      <Users className="w-3.5 h-3.5" />
                      المدير المباشر
                    </div>
                    <p className="text-slate-900 font-black text-sm truncate">{emp.manager || '---'}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2.5">
                     <button 
                       onClick={() => { setSelectedConfigEmployee(emp); setView('form'); }}
                       className="px-6 py-3 bg-[#0f172a] text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-all shadow-md"
                     >
                       تحرير بيانات الموظف
                     </button>
                     <button 
                       onClick={() => handleDeleteEmployee(emp.id)}
                       className="w-10 h-10 bg-white text-rose-500 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                  <button 
                    onClick={() => {
                       const win = window.open('', '_blank');
                       if (!win) return;
                       const netPay = (emp.baseSalary || 0) + (emp.allowances || 0) - (emp.deductions || 0);
                       win.document.write(`
                          <html dir="rtl" lang="ar">
                            <head>
                               <title>مسير الرواتب - ${emp.name}</title>
                               <style>
                                 body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #fff; color: #020617; }
                                 h1 { font-size: 24px; font-weight: 900; margin-bottom: 5px; color: #0f172a; }
                                 h2 { font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 40px; }
                                 .row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 16px 0; }
                                 .label { font-size: 14px; font-weight: 800; color: #475569; }
                                 .val { font-size: 16px; font-weight: 900; font-family: monospace; }
                                 .total { background: #f8fafc; padding: 20px; border-radius: 16px; font-size: 20px; font-weight: 900; color: #10b981; margin-top: 30px; display: flex; justify-content: space-between;}
                                 @media print { body { padding: 0; } }
                               </style>
                            </head>
                            <body>
                               <h1>العدالة القضائية - مسير الرواتب الرسمي</h1>
                               <h2>كشف الراتب الشهري للموظف: ${emp.name}</h2>
                               <div class="row"><span class="label">تاريخ المباشرة</span><span class="val">${emp.startDate || '---'}</span></div>
                               <div class="row"><span class="label">المسمى الوظيفي</span><span class="val">${emp.jobTitle}</span></div>
                               <div style="margin-top:40px;">
                                  <div class="row"><span class="label">الراتب الأساسي</span><span class="val">${emp.baseSalary || 0} ر.س</span></div>
                                  <div class="row"><span class="label">البدلات (سكن، نقل، أخرى)</span><span class="val">+${emp.allowances || 0} ر.س</span></div>
                                  <div class="row"><span class="label">الخصومات / التأمينات الاجتماعية</span><span style="color:#e11d48;" class="val">-${emp.deductions || 0} ر.س</span></div>
                               </div>
                               <div class="total">
                                  <span>صافي الراتب المستحق</span>
                                  <span>${netPay} ر.س</span>
                               </div>
                               <script>window.print();</script>
                            </body>
                          </html>
                       `);
                       win.document.close();
                    }}
                    className="w-10 h-10 bg-white border border-slate-200 text-slate-200 font-bold rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
                    title="مسير الراتب"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Monthly Report Wizard Dialog overlay/modal */}
      {showReportWizard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between pb-6 border-b border-slate-100">
              <div className="space-y-1 text-right">
                <h3 className="text-xl font-black text-slate-900">📊 منشئ تقارير الأداء والأجور الشهري</h3>
                <p className="text-xs text-slate-200 font-bold font-bold">تصدير الفواتير ومستندات الأداء لأعضاء المكتب والمحامين بصيغ ورقية أو رقمية</p>
              </div>
              <button 
                onClick={() => setShowReportWizard(false)} 
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-200 font-bold hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-black text-slate-200 font-bold block">حدد شهر التصدير</label>
                <input 
                  type="month"
                  value={reportMonth}
                  onChange={e => setReportMonth(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 transition-all text-slate-800 outline-none"
                />
              </div>
              <div className="flex items-end justify-end gap-3 pt-6 sm:pt-0">
                <button 
                  onClick={handleExportCSV}
                  className="px-6 py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#0f172a]" />
                  تصدير كملف Excel (CSV)
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-emerald-100 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  طباعة وتصدير PDF الملون
                </button>
              </div>
            </div>

            {/* Editable performance hour list */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 text-right">مراجعة وتعديل ساعات عمل الموظفين لشهر ({reportMonth}):</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#f8fafc] text-[#475569] border-b border-slate-100">
                    <tr>
                      <th className="p-4 font-black text-right">اسم الموظف كلياً</th>
                      <th className="p-4 font-black text-right">المسمى الوظيفي</th>
                      <th className="p-4 font-black text-center">المهام القضائية المكتملة</th>
                      <th className="p-4 font-black text-right">خصّص ساعات العمل الكلية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-extrabold text-[#0f172a]">{row.name}</td>
                        <td className="p-4 font-bold text-slate-700">{row.jobTitle}</td>
                        <td className="p-4 text-center font-black text-emerald-600 font-mono">{row.completedTasks} مهمة مكتملة</td>
                        <td className="p-4">
                          <input 
                            type="number"
                            min={0}
                            value={row.hours}
                            onChange={e => setReportHours({ ...reportHours, [row.id]: Number(e.target.value) || 0 })}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black font-mono w-24 text-center outline-none focus:bg-white focus:border-emerald-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
