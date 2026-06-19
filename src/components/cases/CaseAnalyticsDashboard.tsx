
import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, DollarSign, Layers } from 'lucide-react';

interface CaseAnalyticsDashboardProps {
  data: any[];
  activeTotal: number;
  closedTotal: number;
  chartSize: string;
  chartVizType: string;
  chartOrder: string;
  chartColorTheme: string;
  themeTick: number;
}

export default function CaseAnalyticsDashboard({
  data,
  activeTotal,
  closedTotal,
  chartSize,
  chartVizType,
  chartOrder,
  chartColorTheme,
  themeTick
}: CaseAnalyticsDashboardProps) {

  const colors = React.useMemo(() => {
    if (chartColorTheme === 'classic') {
      return {
        active: '#b8860b', // Dark Gold
        closed: '#475569', // Slate 600
        bgGlow: 'from-amber-600/10 to-transparent',
        border: 'border-amber-600/30'
      };
    } else if (chartColorTheme === 'ocean') {
      return {
        active: '#0ea5e9', // Sky 500
        closed: '#94a3b8', // Slate 400
        bgGlow: 'from-sky-500/10 to-blue-500/10',
        border: 'border-sky-500/30'
      };
    } else if (chartColorTheme === 'emerald') {
      return {
        active: '#10b981', // Neon Emerald
        closed: '#a78bfa', // Bright Violet
        bgGlow: 'from-emerald-500/10 to-purple-500/10',
        border: 'border-emerald-500/30'
      };
    } else { // 'gold'
      return {
        active: '#ffff00', // Sizzling bright yellow
        closed: '#ff9f1c', // Vivid safety orange
        bgGlow: 'from-amber-500/10 to-orange-500/10',
        border: 'border-amber-500/30'
      };
    }
  }, [chartColorTheme]);

  const donutData = React.useMemo(() => [
    { name: 'نشطة', value: activeTotal, color: colors.active },
    { name: 'مغلقة/مؤرشفة', value: closedTotal, color: colors.closed }
  ], [activeTotal, closedTotal, colors]);

  if (activeTotal === 0 && closedTotal === 0) return null;

  const vizHeight = chartSize === 'tiny' ? 75 : chartSize === 'shrunk' ? 110 : 180;

  const financialData = [
    { month: 'يناير', income: 45000 },
    { month: 'فبراير', income: 52000 },
    { month: 'مارس', income: 49000 },
    { month: 'أبريل', income: 68000 },
    { month: 'مايو', income: 72000 }
  ];

  const renderDonutCard = () => (
    <div key="donut" className="bg-[#050e21]/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300">
      <h3 className="text-xs font-black text-white mb-2 uppercase tracking-widest relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <TrendingUp className="w-4 h-4 text-amber-400" />
        توزيع النزاعات
      </h3>
      <div style={{ height: `${vizHeight}px`, width: '100%', minWidth: 0 }} className="relative z-10 transition-all duration-300">
        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={chartSize === 'tiny' ? 20 : chartSize === 'shrunk' ? 32 : 55}
                outerRadius={chartSize === 'tiny' ? 32 : chartSize === 'shrunk' ? 50 : 75}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive={false}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1.5}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: '900', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', color: '#fff' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex gap-4 mt-2 relative z-10 p-1.5 px-3 bg-black/40 rounded-xl border border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-white">نشطة</span>
          <span className="text-sm font-extrabold" style={{ color: colors.active }}>{activeTotal}</span>
        </div>
        <div className="w-px h-4 bg-slate-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-white">مؤرشفة</span>
          <span className="text-sm font-extrabold" style={{ color: colors.closed }}>{closedTotal}</span>
        </div>
      </div>
    </div>
  );

  const renderFinancialChart = () => (
    <div key="finance" className="lg:col-span-1 bg-[#050e21]/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden transition-all duration-300">
      <h3 className="text-xs font-black text-white mb-2 uppercase tracking-widest relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        التدفق النقدي والنمو المالي
      </h3>
      <div style={{ height: `${vizHeight}px`, width: '100%', minWidth: 0 }} className="relative z-10 transition-all duration-300">
        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
            <AreaChart data={financialData} margin={{ left: -30, right: 10 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#fff" fontSize={8} fontWeight="900" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderBarCard = () => (
    <div key="bar" className="lg:col-span-2 bg-[#050e21]/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden transition-all duration-300">
      <h3 className="text-xs font-black text-white mb-2 uppercase tracking-widest relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4_rgba(0,0,0,0.8)]">
        <Layers className="w-4 h-4 text-indigo-400" />
        تحليل النزاعات حسب التصنيف
      </h3>
      <div style={{ height: `${vizHeight}px`, width: '100%', minWidth: 0 }} className="relative z-10 transition-all duration-300">
        <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" key={themeTick}>
            {chartVizType === 'area' ? (
              <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.active} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={colors.active} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.closed} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={colors.closed} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff" 
                  fontSize={10} 
                  fontWeight="900"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const map: any = { commercial: 'تجاري', labor: 'عمالي', civil: 'مدني', criminal: 'جنائي', personal_status: 'أحوال', administrative: 'إداري', financial: 'مالي', execution: 'تنفيذ', other: 'آخر' };
                    return map[val] || val;
                  }}
                />
                <YAxis stroke="#ffffff" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickCount={3} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area name="نشطة" type="monotone" dataKey="active" stroke={colors.active} fillOpacity={1} fill="url(#colorActive)" isAnimationActive={false} />
                <Area name="مغلق" type="monotone" dataKey="closed" stroke={colors.closed} fillOpacity={1} fill="url(#colorClosed)" isAnimationActive={false} />
              </AreaChart>
            ) : chartVizType === 'line' ? (
              <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff" 
                  fontSize={10} 
                  fontWeight="900"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const map: any = { commercial: 'تجاري', labor: 'عمالي', civil: 'مدني', criminal: 'جنائي', personal_status: 'أحوال', administrative: 'إداري', financial: 'مالي', execution: 'تنفيذ', other: 'آخر' };
                    return map[val] || val;
                  }}
                />
                <YAxis stroke="#ffffff" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickCount={3} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Line name="نشطة" type="monotone" dataKey="active" stroke={colors.active} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                <Line name="مغلق" type="monotone" dataKey="closed" stroke={colors.closed} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff" 
                  fontSize={10} 
                  fontWeight="900"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const map: any = { commercial: 'تجاري', labor: 'عمالي', civil: 'مدني', criminal: 'جنائي', personal_status: 'أحوال', administrative: 'إداري', financial: 'مالي', execution: 'تنفيذ', other: 'آخر' };
                    return map[val] || val;
                  }}
                />
                <YAxis stroke="#ffffff" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickCount={3} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  height={18} 
                  iconType="circle" 
                  iconSize={6}
                  wrapperStyle={{ fontSize: '10px', fontWeight: '900', color: '#fff' }} 
                />
                <Bar name="نشطة" dataKey="active" fill={colors.active} radius={[3, 3, 0, 0]} barSize={chartSize === 'tiny' ? 10 : chartSize === 'shrunk' ? 16 : 26} isAnimationActive={false} />
                <Bar name="مغلق" dataKey="closed" fill={colors.closed} radius={[3, 3, 0, 0]} barSize={chartSize === 'tiny' ? 10 : chartSize === 'shrunk' ? 16 : 26} isAnimationActive={false} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const orderedCards = chartOrder === 'donut-first' 
    ? [renderDonutCard(), renderBarCard(), renderFinancialChart()]
    : [renderBarCard(), renderDonutCard(), renderFinancialChart()];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {orderedCards}
    </div>
  );
}
