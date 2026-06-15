import fs from 'fs';
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(/import \{ PieChart,[^\}]+ \} from 'recharts';/g, 
  "import { RadialBarChart, RadialBar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';"
);

// We'll write the logic for the dynamic employee stats inside the component
const newKpiLogic = `
              if (widget.id === 'employeePerformanceKPI') {
                 // Dynamic calculation logic
                 const empStats = new Map();
                 tasks.forEach(t => {
                   if (!t.assignedTo) return;
                   if (!empStats.has(t.assignedTo)) {
                     empStats.set(t.assignedTo, { name: t.assignedTo, tasksComplete: 0, totalTasks: 0, onTime: 0, delayed: 0, activeCases: 0 });
                   }
                   const s = empStats.get(t.assignedTo);
                   s.totalTasks++;
                   if (t.status === 'completed' || t.status === 'done') {
                     s.tasksComplete++;
                     if (t.targetCompletionTime && new Date(t.targetCompletionTime) < new Date()) {
                       s.delayed++;
                     } else {
                       s.onTime++;
                     }
                   } else if (t.dueDate && new Date(t.dueDate) < new Date()) {
                     s.delayed++;
                   }
                 });
                 
                 const calculatedEmps = Array.from(empStats.values()).map(s => {
                   let kpi = 100;
                   if (s.totalTasks > 0) {
                     const completionRate = s.tasksComplete / s.totalTasks;
                     const delayRate = s.delayed / s.totalTasks;
                     kpi = Math.max(0, Math.round((completionRate * 100) - (delayRate * 50)));
                   }
                   return {
                     ...s,
                     kpi,
                     color: kpi >= 90 ? 'bg-emerald-500' : kpi >= 70 ? 'bg-blue-500' : 'bg-amber-500',
                     stroke: kpi >= 90 ? '#10b981' : kpi >= 70 ? '#3b82f6' : '#f59e0b',
                     sparkline: [Math.max(0, kpi-10), Math.max(0, kpi-5), kpi, kpi] // Simple dummy sparkline since we lack historical data
                   };
                 }).sort((a,b) => b.kpi - a.kpi).slice(0, 4);

                 // Fake data object for Radar Chart if real isn't rich enough
                 const radarData = calculatedEmps.map(emp => ({
                   subject: emp.name.split(' ')[0],
                   A: emp.kpi,
                   B: 100,
                   fullMark: 100
                 }));

                 return (
                 <SortableWidgetWrapper className={getWidgetClassName(widget.size)} key="employeePerformanceKPI" id="employeePerformanceKPI" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 text-right" dir="rtl">
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <span>مؤشر أداء الموظفين التفصيلي (ديناميكي)</span>
                      </h3>
                      {calculatedEmps.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 text-sm font-bold bg-slate-50 rounded-xl">لا تتوفر مهام مسندة لحساب الأداء</div>
                      ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Employees List */}
                        <div className="space-y-4">
                          {calculatedEmps.map((emp, i) => (
                             <div key={i} className="flex flex-col gap-1.5 p-3 transition-colors rounded-2xl border border-transparent">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-black text-slate-700">{emp.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={emp.kpi >= 90 ? "font-black text-emerald-500" : "font-black text-amber-500"}>{emp.kpi}%</span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                  <div className={emp.color + " h-1.5 rounded-full transition-all duration-1000"} style={{ width: emp.kpi + "%" }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-1">
                                  <span className="flex items-center gap-1">تم الإنجاز: {emp.tasksComplete} / {emp.totalTasks}</span>
                                  <span className="flex items-center gap-1 text-rose-500">متأخرة: {emp.delayed}</span>
                                </div>
                             </div>
                          ))}
                        </div>
                        {/* Radar Chart */}
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar name="الأداء" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      )}
                    </div>
                 </SortableWidgetWrapper>
                 );
              }
`;

code = code.replace(/if \(widget.id === 'employeePerformanceKPI'\) return \([\s\S]*?<\/SortableWidgetWrapper>\s*\);/g, newKpiLogic);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Dashboard KPIs updated");
