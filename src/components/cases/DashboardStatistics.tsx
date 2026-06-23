import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Case } from '@/types';
import { BookOpen, Award, CheckCircle2, TrendingUp, BarChart3, PieChartIcon } from 'lucide-react';

interface DashboardStatisticsProps {
  cases: Case[];
  isHighContrast?: boolean;
}

export const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({ 
  cases = [], 
  isHighContrast = false 
}) => {
  // Filter and count active, unarchived cases
  const activeCases = cases.filter(c => !c.archived);

  const underReviewCount = activeCases.filter(
    c => c.status === 'under_review'
  ).length;

  const ruledCount = activeCases.filter(
    c => c.status === 'primary_judgment' || c.status === 'final_judgment'
  ).length;

  const closedCount = activeCases.filter(
    c => c.status === 'closed'
  ).length;

  const otherCount = activeCases.filter(
    c => c.status !== 'under_review' && 
         c.status !== 'primary_judgment' && 
         c.status !== 'final_judgment' && 
         c.status !== 'closed'
  ).length;

  const totalCount = activeCases.length;

  // Chart data
  const chartData = [
    { name: 'قيد النظر', value: underReviewCount, color: '#f59e0b', bgLight: 'rgba(245, 158, 11, 0.1)' },
    { name: 'محكومة', value: ruledCount, color: '#a855f7', bgLight: 'rgba(168, 85, 247, 0.1)' },
    { name: 'منتهية', value: closedCount, color: '#10b981', bgLight: 'rgba(16, 185, 129, 0.1)' }
  ];

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border-2 border-amber-500/40 p-3.5 rounded-2xl shadow-xl text-right font-sans relative overflow-hidden" dir="rtl">
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
          <p className="text-xs font-black text-amber-400 mb-1">{payload[0].name}</p>
          <p className="text-sm font-bold text-white">
            عدد القضايا: <span className="font-mono text-base text-amber-300">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8" dir="rtl">
      {/* Cards & Chart Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Real-time Luxurious Counters */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* 1. Under Review Card */}
          <div className="bg-slate-900/40 border border-[#f59e0b]/30 hover:border-[#f59e0b]/70 rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#f59e0b]/10 rounded-2xl group-hover:scale-110 transition-all">
                <BookOpen className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[10px] font-black text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                قيد النظر
              </span>
            </div>
            <div>
              <span className="text-3xl font-black font-mono text-white tracking-tight block mb-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                {underReviewCount}
              </span>
              <h4 className="text-xs font-black text-slate-300">قضايا قيد المرافعة والنظر</h4>
              <p className="text-[10px] text-slate-400 mt-1">تتطلب تحضيراً للجلسات ومتابعة دورية</p>
            </div>
          </div>

          {/* 2. Ruled Card */}
          <div className="bg-slate-900/40 border border-purple-500/30 hover:border-purple-500/70 rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-all">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                محكومة
              </span>
            </div>
            <div>
              <span className="text-3xl font-black font-mono text-white tracking-tight block mb-1 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                {ruledCount}
              </span>
              <h4 className="text-xs font-black text-slate-300">قضايا صدر فيها أحكام</h4>
              <p className="text-[10px] text-slate-400 mt-1">تشمل الأحكام الابتدائية والاستئنافية</p>
            </div>
          </div>

          {/* 3. Completed/Closed Card */}
          <div className="bg-slate-900/40 border border-emerald-500/30 hover:border-emerald-500/70 rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-all">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                منتهية
              </span>
            </div>
            <div>
              <span className="text-3xl font-black font-mono text-white tracking-tight block mb-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                {closedCount}
              </span>
              <h4 className="text-xs font-black text-slate-300">قضايا منتهية ومغلقة</h4>
              <p className="text-[10px] text-slate-400 mt-1">تم تسويتها بالكامل وتحصيل المستحقات</p>
            </div>
          </div>

        </div>

        {/* Right Side: Recharts Bar Visualization */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 shadow-lg shadow-black/40 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black text-slate-200">التمثيل البياني لتوزيع الحالات</h3>
            </div>
            <div className="text-[10px] font-black text-slate-400">
              إجمالي القضايا النشطة: <span className="font-mono text-white text-xs">{totalCount}</span>
            </div>
          </div>

          <div className="w-full h-36 flex items-center justify-center">
            {totalCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-500 text-xs italic">لا توجد بيانات قضايا كافية لعرض الرسم البياني</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardStatistics;
