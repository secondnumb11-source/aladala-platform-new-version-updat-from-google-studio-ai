import React from 'react';
import { Case } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, FileDown } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface StatisticsDashboardProps {
  cases: Case[];
}

export default function StatisticsDashboard({ cases }: StatisticsDashboardProps) {
  const completedCases = cases.filter(c => c.status === 'closed').length;
  const totalCases = cases.length;
  const completionRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

  const data = [
    { name: 'مكتملة', value: completedCases },
    { name: 'قيد العمل', value: totalCases - completedCases },
  ];

  const weeklyData = [
    { day: 'السبت', completed: 2 },
    { day: 'الأحد', completed: 4 },
    { day: 'الاثنين', completed: 3 },
    { day: 'الثلاثاء', completed: 5 },
    { day: 'الأربعاء', completed: 2 },
    { day: 'الخميس', completed: 6 },
    { day: 'الجمعة', completed: 1 },
  ];

  const exportToPDF = async () => {
    const input = document.getElementById('statistics-dashboard');
    if (input) {
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFontSize(18);
      pdf.text('تقرير الإنتاجية الأسبوعي', 105, 15, { align: 'center' });
      pdf.addImage(imgData, 'PNG', 10, 30, 190, 100);
      pdf.save('employee-performance-report.pdf');
    }
  };

  return (
    <div id="statistics-dashboard" className="bg-slate-950 border border-[#D4AF37]/30 rounded-[24px] p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-[#FACC15] font-black mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          إحصائيات الإنجاز والإنتاجية
        </h3>
        <button onClick={exportToPDF} className="p-2 text-[#FACC15] font-black rounded-full">
            <FileDown className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <p className="text-[10px] text-slate-200 font-bold">إجمالي القضايا</p>
            <p className="text-xl font-black text-white">{totalCases}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <p className="text-[10px] text-slate-200 font-bold">معدل الإنجاز</p>
            <p className="text-xl font-black text-[#FACC15] font-black">{completionRate}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" fontSize={10} tick={{fill: '#e2e8f0'}} />
          <YAxis fontSize={10} tick={{fill: '#e2e8f0'}} />
          <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#f59e0b'}} />
          <Line type="monotone" dataKey="completed" stroke="#D4AF37" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
