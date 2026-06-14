import React from 'react';
import { 
  ShieldCheck, CheckCircle2, TrendingUp, Users, Calendar, Scale, Clock, 
  Activity, AlertTriangle, Cpu, Search, Zap, AlertCircle, FileText, 
  Download, GripVertical, Info, CheckSquare, DollarSign, Layout, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend
} from 'recharts';
import { motion } from 'motion/react';

// Specialized Widget Components for Dashboard

export const NajizPerformanceWidget = ({ sessions }: { sessions: any[] }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          أداء منصة ناجز
        </h3>
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">متصل ومزامن</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 mb-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{v: 85}, {v: 15}]} cx="50%" cy="50%" innerRadius={35} outerRadius={45} startAngle={90} endAngle={-270} dataKey="v">
                <Cell fill="#6366f1" />
                <Cell fill="#f1f5f9" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-slate-900">85%</span>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-500 mb-6">كفاءة الربط مع الأنظمة العدلية</p>
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-slate-50 p-3 rounded-2xl">
            <span className="block text-lg font-black text-slate-900">{sessions.length}</span>
            <span className="text-[10px] font-bold text-slate-400">جلسة مجدولة</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl">
            <span className="block text-lg font-black text-slate-900">12</span>
            <span className="text-[10px] font-bold text-slate-400">طلب تنفيذ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgenciesAlertWidget = ({ agencies }: { agencies: any[] }) => {
  // Use real data if provided, otherwise fallback to mock for visual polish
  const displayAgencies = agencies && agencies.length > 0 ? agencies : [
    { id: '1', client: 'شركة الأفق التجارية', expiry: '2026-07-15', status: 'active' },
    { id: '2', client: 'مؤسسة الرياض للمقاولات', expiry: '2026-06-25', status: 'urgent' },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] p-8 h-full flex flex-col relative overflow-hidden border-b-4 border-b-[#c0a060]">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#c0a060]" />
          الوكالات القضائية
        </h3>
        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
          <Sparkles size={12} className="text-amber-500 animate-pulse" />
          <span className="text-[9px] font-black text-amber-700">تحديث ذكي</span>
        </div>
      </div>
      
      <div className="space-y-3 flex-1 relative z-10">
        {displayAgencies.map((agency: any) => {
          const expiryDate = new Date(agency.expiry);
          const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isUrgent = daysLeft <= 15;

          return (
            <div key={agency.id} className={`p-4 rounded-2xl border transition-all hover:bg-white hover:shadow-lg group ${isUrgent ? 'bg-rose-50 border-rose-100 ring-1 ring-rose-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-[#c0a060] transition-colors">{agency.client}</span>
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${isUrgent ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                  {isUrgent ? 'تنتهي قريباً' : 'سارية'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className={isUrgent ? 'text-rose-500' : 'text-slate-400'} />
                  <span className={`text-[10px] font-bold ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
                    {isUrgent ? `متبقي ${daysLeft} يوم!` : `متبقي ${daysLeft} يوم`}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-400">{expiryDate.toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-6 w-full py-3.5 bg-slate-900 text-white font-black text-xs rounded-2xl hover:bg-slate-800 transition-all shadow-md active:scale-95">
        إدارة جميع الوكالات
      </button>
    </div>
  );
};

export const OverdueTasksWidget = ({ tasks }: { tasks: any[] }) => {
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
  
  return (
    <div className="bg-white border-rose-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col relative overflow-hidden border-b-4 border-b-rose-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-rose-600 text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          المهام المتأخرة
        </h3>
        <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full">يتطلب معالجة</span>
      </div>
      
      <div className="space-y-4 flex-1">
        {overdue.length > 0 ? (
          overdue.slice(0, 4).map((task, i) => (
            <div key={i} className="flex gap-4 items-center p-3 hover:bg-rose-50 rounded-2xl transition-all group border border-transparent hover:border-rose-100">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-all">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-800 line-clamp-1">{task.title}</h4>
                <p className="text-[10px] font-black text-rose-600 mt-1">تأخرت منذ {Math.abs(Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} يوم</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckSquare size={32} />
            </div>
            <p className="text-xs font-black text-slate-400">لا توجد مهام متأخرة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const DeadlinesWidget = ({ cases }: { cases: any[] }) => {
  const critical = cases.filter(c => c.status === 'primary_judgment' || c.priority === 'high');

  return (
    <div className="bg-white border-amber-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col border-b-4 border-b-amber-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-amber-600 text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          مهل استحقاق عدلية
        </h3>
        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl">حرجة</span>
      </div>
      <div className="space-y-4 flex-1">
        {critical.length > 0 ? (
          critical.slice(0, 3).map((c, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg animate-pulse">تنتهي قريباً</span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">#{c.caseNumber}</span>
              </div>
              <h4 className="text-xs font-black text-slate-800 line-clamp-1">{c.caseName}</h4>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
            <Layout size={40} className="mb-4" />
            <p className="text-xs font-black">لا توجد مهل قريبة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const UpcomingHearingsList = ({ hearings, cases }: { hearings: any[], cases: any[] }) => {
  const upcoming = hearings.filter(h => new Date(h.date) >= new Date()).slice(0, 3);

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          مواعيد الجلسات
        </h3>
        <button className="text-[10px] font-black text-indigo-600 hover:underline">عرض الكل</button>
      </div>
      <div className="space-y-4 flex-1">
        {upcoming.length > 0 ? (
          upcoming.map((h, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 hover:bg-indigo-50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:text-white group-hover:bg-indigo-500 transition-all">
                <span className="text-[10px] font-black">{new Date(h.date).getDate()}</span>
                <span className="text-[8px] font-bold">{new Date(h.date).toLocaleDateString('ar-SA', { month: 'short' })}</span>
              </div>
              <div className="flex-1 min-w-0 text-right">
                <h4 className="text-xs font-black text-slate-800 line-clamp-1">{h.caseName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={10} className="text-slate-400" />
                  <span className="text-[10px] text-slate-500 font-bold">{h.time}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 opacity-40">
            <Calendar size={40} className="mb-4" />
            <p className="text-xs font-black text-slate-400">لا توجد جلسات قادمة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const EmployeePerformanceKPI = ({ tasks }: { tasks: any[] }) => {
  const empStats = new Map();
  tasks.forEach(t => {
    const emp = t.assignedTo || 'غير محدد';
    if (!empStats.has(emp)) empStats.set(emp, { total: 0, done: 0 });
    empStats.get(emp).total++;
    if (t.status === 'done') empStats.get(emp).done++;
  });

  const statsArray = Array.from(empStats.entries()).map(([name, stat]) => ({
    name,
    completion: Math.round((stat.done / (stat.total || 1)) * 100),
    total: stat.total
  })).sort((a, b) => b.completion - a.completion).slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          تحليل أداء الفريق
        </h3>
        <TrendingUp size={16} className="text-emerald-500" />
      </div>
      <div className="space-y-6 flex-1">
        {statsArray.map((emp, idx) => (
          <div key={idx} className="space-y-2.5">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800">{emp.name}</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{emp.completion}% كفاءة</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
              <motion.div 
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${emp.completion}%` }}
                transition={{ duration: 1.2, delay: idx * 0.1, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
        {statsArray.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
            <Users size={40} className="mb-4" />
            <p className="text-xs font-black">لا توجد بيانات متاحة</p>
          </div>
        )}
      </div>
    </div>
  );
};
