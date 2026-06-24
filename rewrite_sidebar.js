const fs = require('fs');
const content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
const startIdx = content.indexOf('return (\n    <>\n      {/* Sidebar Drawers');
if (startIdx === -1) { console.error('not found'); process.exit(1); }
const newContent = content.substring(0, startIdx) + `return (
    <>
      <aside className={\`
        fixed right-0 top-0 h-screen
        w-[220px]
        bg-[#1a2744]
        flex flex-col
        overflow-y-auto
        z-50
        border-l border-[#243460]
        transition-transform duration-300
        \${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      \`} dir="rtl">
        {/* الشعار */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#243460]">
          <div className="w-8 h-8 bg-[#c9a84c] rounded-lg flex items-center justify-center">
            <Scale className="w-4 h-4 text-[#1a2744]" />
          </div>
          <div>
            <p className="text-white font-black text-sm">{officeName || 'العدالة'}</p>
            <p className="text-[#8899bb] text-[10px]">إدارة مكاتب المحاماة</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 sidebar-scrollbar">
          {[
            {
              title: 'المنظومة القضائية',
              itemIds: ['dashboard', 'cases', 'case-judgments', 'executions', 'calendar']
            },
            {
              title: 'العملاء والشؤون الخارجية',
              itemIds: ['clients', 'client-portal', 'agencies', 'whatsapp']
            },
            {
              title: 'فريق العمل',
              itemIds: ['employees-data', 'employee-portal', 'performance', 'tasks']
            },
            {
              title: 'الذكاء الاصطناعي',
              itemIds: ['ai', 'ai-drafting', 'ai-analysis', 'ai-finance-vat', 'ai-judicial-calc', 'ai-deadlines', 'ai-swot', 'ai-finance', 'ai-zatca', 'ai-search']
            },
            {
              title: 'خدمات مساندة',
              itemIds: ['saudi-hub', 'smart-services', 'court-map', 'documents']
            },
            {
              title: 'الإعدادات',
              itemIds: ['najiz', 'audit-logs', 'settings']
            },
          ].map((cat) => {
            const allowedItems = allItems.filter(item => {
              if (!cat.itemIds.includes(item.id)) return false;
              if (item.isAdminOnly && selectedRole !== 'admin') return false;
              if (currentUser?.role === 'client' && item.id !== 'client-portal') return false;
              return true;
            });

            if (allowedItems.length === 0) return null;

            return (
              <div key={cat.title} className="mb-4">
                <p className="px-4 pt-3 pb-1 text-[#c9a84c] text-[10px] font-bold uppercase tracking-widest">
                  {cat.title}
                </p>
                <div className="space-y-0.5">
                  {allowedItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id || (item.children && item.children.some(child => currentTab === child.id));

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.children) {
                            setAiExpanded(!aiExpanded);
                            if (!isActive && !aiExpanded) {
                              onNavigate(item.id);
                            }
                          } else {
                            onNavigate(item.id);
                            setMobileOpen(false);
                          }
                        }}
                        className={\`
                          w-full flex items-center justify-between px-4 py-2 mx-1 rounded-lg text-right
                          \${isActive 
                            ? 'bg-[#c9a84c] text-[#1a2744] text-xs font-bold' 
                            : 'text-[#8899bb] hover:text-white hover:bg-[rgba(255,255,255,0.07)] text-xs font-medium transition-all duration-150'
                          }
                        \`}
                        style={{ width: 'calc(100% - 8px)' }}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.name.replace('AI', '').trim()}</span>
                        </div>
                        {item.children && (
                          <div className="shrink-0">
                            {aiExpanded && isActive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {cat.title === 'الذكاء الاصطناعي' && aiExpanded && (
                  <div className="mr-6 ml-2 mt-1 space-y-0.5 border-r-2 border-[rgba(201,168,76,0.2)] pr-2">
                    {allItems.find(i => i.id === 'ai')?.children?.map(child => {
                      const isChildActive = currentTab === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => {
                            onNavigate(child.id);
                            setMobileOpen(false);
                          }}
                          className={\`
                            w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-right
                            \${isChildActive 
                              ? 'text-[#c9a84c] text-[11px] font-bold' 
                              : 'text-[#8899bb] hover:text-white hover:bg-[rgba(255,255,255,0.05)] text-[11px] font-medium transition-all duration-150'
                            }
                          \`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] shrink-0 opacity-50" />
                          <span>{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <button 
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-[#c9a84c] text-[#1a2744] p-3 rounded-full shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>
      
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
`;

fs.writeFileSync('src/components/Sidebar.tsx', newContent);
console.log('done');
