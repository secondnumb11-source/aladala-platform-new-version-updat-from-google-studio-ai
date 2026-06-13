import fs from 'fs';

let content = fs.readFileSync('src/components/DocumentsModule.tsx', 'utf8');

const startMarker = '{/* Advanced AI-Integrated Search Tool */}';
const endMarker = '{/* Files grid rendering */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Markers not found!");
  process.exit(1);
}

const replacement = `{/* Advanced AI-Integrated Search Tool */}
          <div className={\`p-6 rounded-[2.5rem] border transition-all duration-700 space-y-6 shadow-md relative overflow-hidden backdrop-blur-md \${
            isDeepSearch 
              ? 'bg-blue-50/50 border-blue-200 shadow-[0_0_50px_rgba(59,130,246,0.1)] ring-1 ring-blue-300' 
              : 'bg-white border-slate-200 shadow-slate-200/50'
          }\`}>
            {isDeepSearch && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full pointer-events-none animate-pulse"></div>
            )}
            
            <div className="flex flex-col lg:flex-row gap-5 relative z-10">
              <div className="relative flex-1 group">
                <div className={\`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 \${isDeepSearch ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-500 group-focus-within:bg-blue-600 group-focus-within:text-white'}\`}>
                  <Search className={\`w-4 h-4 \${isDeepSearch ? 'animate-pulse' : ''}\`} />
                </div>
                <input 
                  type="text"
                  placeholder={isDeepSearch ? "جاري محاكاة البحث العميق في نصوص المستندات (NLP)..." : "ابحث باسم المرفق، الرقم القضائي، أو الكلمات المفتاحية..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={\`w-full bg-slate-50 text-sm py-4 pr-14 pl-4 rounded-2xl transition-all duration-500 focus:outline-none font-bold placeholder-slate-400 \${
                    isDeepSearch 
                      ? 'border border-blue-300/50 text-blue-900 focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] ring-2 ring-blue-400/10' 
                      : 'border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }\`}
                />
                {isDeepSearch && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-black tracking-widest uppercase">NLP Analyzer On</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap lg:flex-nowrap gap-3 shrink-0">
                <button 
                  onClick={() => setIsDeepSearch(!isDeepSearch)}
                  className={\`flex items-center gap-3 px-8 py-5 rounded-2xl text-[12px] font-black transition-all duration-500 active:scale-95 whitespace-nowrap overflow-hidden relative group/deep shadow-md \${
                    isDeepSearch 
                      ? 'bg-blue-600 text-white shadow-blue-500/30' 
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                  }\`}
                >
                  <div className={\`p-2 rounded-xl transition-all \${isDeepSearch ? 'bg-white/20' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'}\`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="tracking-tight">{isDeepSearch ? 'تم تفعيل المسح العميق ✨' : 'تفعيل البحث بالذكاء الاصطناعي'}</span>
                  {isDeepSearch && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/deep:animate-shimmer pointer-events-none"></div>}
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center justify-between relative z-10 pt-2">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">تاريخ الرفع:</span>
                  <div className="relative group flex items-center">
                    <Calendar className="w-3 h-3 text-slate-400 ml-1" />
                    <input 
                      type="date"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                      className="bg-transparent border-none py-1 pr-1 pl-4 text-[10px] font-bold text-slate-800 outline-none cursor-pointer min-w-[100px] focus:ring-0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">العميل:</span>
                  <select 
                    value={clientFilter}
                    onChange={e => setClientFilter(e.target.value)}
                    className="bg-transparent border-none p-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 appearance-none pr-8 relative"
                  >
                    <option value="">كافة العملاء</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">القضية:</span>
                  <select 
                    value={caseFilter}
                    onChange={e => setCaseFilter(e.target.value)}
                    className="bg-transparent border-none p-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 appearance-none pr-8 relative"
                  >
                    <option value="">كافة القضايا</option>
                    {cases.map(c => <option key={c.id} value={c.caseName}>{c.caseName}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">التصنيف:</span>
                  <select 
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="bg-transparent border-none p-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 appearance-none pr-8 relative"
                  >
                    {folders.slice(1).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">الوسوم الذكية:</span>
                  <select 
                    value={selectedTagFilter || ''}
                    onChange={e => setSelectedTagFilter(e.target.value || null)}
                    className="bg-transparent border-none p-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 appearance-none pr-8 relative"
                  >
                    <option value="">كافة الوسوم</option>
                    {allAvailableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 lg:mt-0 w-full lg:w-auto overflow-hidden">
                <div className="text-[10px] text-slate-500 font-bold px-3 py-1 border-r border-slate-200">
                  تمت أرشفة <span className="text-blue-600 font-mono font-black">{documents.length}</span> وثيقة قانونية بإجمالي <span className="text-emerald-600 font-mono font-black">1.2GB</span>
                </div>
                <button 
                  onClick={() => {
                     setSearchTerm('');
                     setDateFilter('');
                     setTypeFilter('');
                     setClientFilter('');
                     setCaseFilter('');
                     setActiveFolderFilter('all');
                     setIsDeepSearch(false);
                  }}
                  className="mr-auto lg:mr-0 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl text-[10px] font-black transition-all active:scale-95 whitespace-nowrap"
                >
                  تصفير الفلاتر ⟲
                </button>
              </div>
            </div>
          </div>

          `;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);

fs.writeFileSync('src/components/DocumentsModule.tsx', newContent);
console.log("Card replaced successfully!");
