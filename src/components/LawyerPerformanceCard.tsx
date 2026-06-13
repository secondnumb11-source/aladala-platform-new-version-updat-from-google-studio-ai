import React from 'react';
import { Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const LawyerPerformanceCard = ({ vizHeight, themeTick }: { vizHeight: number, themeTick: number }) => {
  const lawyerPerformanceData = [
      { name: 'أحمد البقمي', cases: 14, win: 12 },
      { name: 'سارة العتيبي', cases: 10, win: 8 },
      { name: 'فهد القحطاني', cases: 8, win: 7 },
      { name: 'ليلى الحربي', cases: 12, win: 10 }
    ];
  return (
    <div className="bg-[#050e21]/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden transition-all duration-300">
      <h3 className="text-xs font-black text-white mb-2 uppercase tracking-widest relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <Users className="w-4 h-4 text-sky-400" />
        أداء كبار المستشارين
      </h3>
      <div style={{ height: `${vizHeight}px`, width: '100%' }} className="relative z-10">
        <ResponsiveContainer width="100%" height="100%" key={themeTick}>
          <BarChart data={lawyerPerformanceData} layout="vertical" margin={{ left: -30 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" stroke="#fff" fontSize={9} fontWeight="900" width={100} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#050e21', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px' }} />
            <Bar dataKey="win" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
