import fs from 'fs';

let code = fs.readFileSync('src/components/EmployeePortal.tsx', 'utf8');

const calendarInsertion = `
            {/* Interactive Mini Calendar for Assigned Hearings */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
               <h3 className="font-black text-slate-900 text-lg flex items-center gap-2 mb-6">
                 <Calendar className="w-5 h-5 text-indigo-500" />
                 تقويم الجلسات القضائية الخاصة بي (مزامنة ناجز)
               </h3>
               {(!loggedInEmployee?.assignedCases || loggedInEmployee.assignedCases.length === 0) ? (
                 <div className="text-center text-slate-400 font-bold text-sm py-8 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
                    لا توجد قضايا مسندة لك حتى الآن.
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {hearings?.filter(h => loggedInEmployee.assignedCases?.includes(h.caseId || h.caseNumber)).length === 0 ? (
                      <div className="col-span-full text-center text-slate-400 font-bold text-sm py-8 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
                        ليس لديك أي جلسات قادمة مسجلة في القضايا المسندة إليك.
                      </div>
                   ) : (
                     hearings?.filter(h => loggedInEmployee.assignedCases?.includes(h.caseId || h.caseNumber))
                     .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                     .map((h, i) => {
                       const isNear = new Date(h.date).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
                       return (
                         <div key={i} className={\`p-5 rounded-2xl flex flex-col gap-3 border transition-all \${isNear ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}\`}>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                                {new Date(h.date).toLocaleDateString('ar-SA')}
                              </span>
                              {isNear && (
                                <span className="text-[8px] font-black bg-rose-600 text-white px-2 py-1 rounded-full animate-pulse shadow-sm shadow-rose-200">
                                  قريبة جداً
                                </span>
                              )}
                           </div>
                           <div>
                              <h4 className="font-black text-slate-900 text-sm">{h.caseName}</h4>
                              <p className="text-[10px] font-bold text-slate-500 mt-1">الدائرة: {h.court || 'غير محدد'}</p>
                           </div>
                           <div className="mt-auto pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs">
                              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{h.time}</span>
                              <span className="font-bold text-slate-400">رقم: {h.caseNumber}</span>
                           </div>
                         </div>
                       )
                     })
                   )}
                 </div>
               )}
            </div>
`;

code = code.replace(/(<div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">[\s\S]*?<\/div>\s*<\/div>)/, `$1\n\n${calendarInsertion}`);

fs.writeFileSync('src/components/EmployeePortal.tsx', code);
console.log("Portal Calendar added");
