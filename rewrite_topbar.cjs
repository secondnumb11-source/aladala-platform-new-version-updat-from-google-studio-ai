const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const startIndex = content.indexOf('{/* Universal Notification Bell (Global scope) */}');
const endIndex = content.indexOf('{/* Module Router Multiplexer */}');

if (startIndex === -1 || endIndex === -1) {
  console.error('not found');
  process.exit(1);
}

const topbar = `
        <header className="
          sticky top-0 z-40
          bg-white
          border-b border-[#e5e7eb]
          px-6 py-2.5
          flex items-center justify-between
          shadow-sm
        " dir="rtl">
          {/* بحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="
                bg-[#f3f4f6] border border-[#e5e7eb]
                rounded-xl pr-9 pl-4 py-2
                text-sm text-gray-700 placeholder-gray-400
                focus:outline-none focus:border-[#c9a84c]
                w-72
              "
              placeholder="ابحث عن قضية، عميل، موظف..."
            />
          </div>

          {/* أيقونات اليمين */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">4</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 bg-[#f3f4f6] rounded-xl px-3 py-1.5 cursor-pointer">
              <div className="w-7 h-7 bg-[#c9a84c] rounded-full flex items-center justify-center">
                <span className="text-[#1a2744] text-xs font-black">{currentUser?.name?.charAt(0) || 'م'}</span>
              </div>
              <div>
                <p className="text-[#1a2744] text-xs font-bold">{currentUser?.name || 'المستخدم'}</p>
                <p className="text-gray-500 text-[10px]">{roles.find(r => r.id === selectedRole)?.name || 'مكتب محاماة'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100 text-red-500" title="تسجيل الخروج">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        <div className="p-0 pb-12">
`;

const newContent = content.substring(0, startIndex) + topbar + content.substring(endIndex);
fs.writeFileSync('src/App.tsx', newContent);
console.log('done topbar replacement');
