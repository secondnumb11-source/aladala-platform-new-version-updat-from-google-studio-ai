import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Compass, Zap, FileText, UserPlus, FileSignature, CheckSquare, ArrowLeftRight } from "lucide-react";
import { CourtCase, Client, Task } from "@/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  cases: CourtCase[];
  clients: Client[];
  tasks: Task[];
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  cases = [],
  clients = [],
  tasks = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle Escape and keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Defined static navigation sections
  const navigationItems = [
    { id: "dashboard", label: "لوحة التحكم الرئيسية", icon: Compass, category: "navigation" },
    { id: "cases", label: "إدارة القضايا والملفات", icon: FileText, category: "navigation" },
    { id: "clients", label: "سجلات الموكلين والخصوم", icon: UserPlus, category: "navigation" },
    { id: "tasks", label: "تكليفات وجدول المهام", icon: CheckSquare, category: "navigation" },
    { id: "finance", label: "الحسابات والفواتير الضريبية", icon: FileSignature, category: "navigation" },
    { id: "ai", label: "صياغة المذكرات بالذكاء الاصطناعي", icon: Zap, category: "navigation" },
  ];

  // Defined quick actions
  const actionItems = [
    { id: "new-case", label: "إنشاء قضية جديدة وتوريد ملف", icon: FileText, category: "action", tab: "cases", event: "adalah-trigger-new-case" },
    { id: "new-client", label: "إضافة موكل وسجل جديد للمنصة", icon: UserPlus, category: "action", tab: "clients", event: "adalah-trigger-new-client" },
    { id: "new-task", label: "إسناد وتكليف مهمة لفريق العمل", icon: CheckSquare, category: "action", tab: "tasks", event: "adalah-trigger-new-task" },
    { id: "new-invoice", label: "إصدار فاتورة ضريبية جديدة لعميل", icon: FileSignature, category: "action", tab: "finance", event: "adalah-trigger-new-invoice" },
  ];

  // Filter based on search query
  const getFilteredItems = () => {
    const term = query.trim().toLowerCase();
    
    // Default categories
    const matchedNav = navigationItems.filter(item => 
      item.label.toLowerCase().includes(term)
    );
    
    const matchedActions = actionItems.filter(item => 
      item.label.toLowerCase().includes(term)
    );

    // Search cases
    const matchedCases = cases.filter(c => 
      c.caseNumber.toLowerCase().includes(term) ||
      c.caseName.toLowerCase().includes(term) ||
      (c.clientName && c.clientName.toLowerCase().includes(term)) ||
      (c.opponentName && c.opponentName.toLowerCase().includes(term))
    ).map(c => ({
      id: `case-${c.id}`,
      label: `قضية رقم ${c.caseNumber}: ${c.caseName}`,
      detail: `الخصم: ${c.opponentName || "غير محدد"} - الموكل: ${c.clientName || "غير محدد"}`,
      category: "cases",
      tab: "cases",
      caseObj: c,
      icon: FileText
    }));

    // Search clients
    const matchedClients = clients.filter(cl => 
      cl.name.toLowerCase().includes(term) ||
      ((cl as any).nationalId && (cl as any).nationalId.toLowerCase().includes(term)) ||
      (cl.phone && cl.phone.toLowerCase().includes(term))
    ).map(cl => ({
      id: `client-${cl.id}`,
      label: `موكل: ${cl.name}`,
      detail: `رقم الهوية: ${(cl as any).nationalId || "---"} - هاتف: ${cl.phone || "---"}`,
      category: "clients",
      tab: "clients",
      icon: UserPlus
    }));

    // Search tasks
    const matchedTasks = tasks.filter(t => 
      t.title.toLowerCase().includes(term) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(term))
    ).map(t => ({
      id: `task-${t.id}`,
      label: `مهمة: ${t.title}`,
      detail: `مكلف بها: ${t.assignedTo} - تاريخ الاستحقاق: ${t.dueDate}`,
      category: "tasks",
      tab: "tasks",
      icon: CheckSquare
    }));

    // Group or unite them
    return [
      ...matchedActions.map(a => ({ ...a, detail: "إجراء مباشر فوري" })),
      ...matchedNav.map(n => ({ ...n, detail: "تنقل سريع للأقسام" })),
      ...matchedCases,
      ...matchedClients,
      ...matchedTasks
    ];
  };

  const filtered = getFilteredItems();

  // Keyboard controls for ArrowDown, ArrowUp, and Enter keys
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen || filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelectItem(filtered[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [isOpen, filtered, selectedIndex]);

  // Keep selected index visible
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(".item-active") as HTMLElement;
      if (activeEl) {
        const container = resultsContainerRef.current;
        const offsetTop = activeEl.offsetTop;
        const height = activeEl.clientHeight;
        const containerHeight = container.clientHeight;

        if (offsetTop + height > container.scrollTop + containerHeight) {
          container.scrollTop = offsetTop + height - containerHeight;
        } else if (offsetTop < container.scrollTop) {
          container.scrollTop = offsetTop;
        }
      }
    }
  }, [selectedIndex]);

  // Execute selecting task/action/nav
  const handleSelectItem = (item: any) => {
    if (!item) return;

    if (item.category === "action") {
      onNavigate(item.tab);
      // Dispatch custom event to trigger creating a new item
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(item.event));
      }, 150);
    } else if (item.category === "navigation") {
      onNavigate(item.id);
    } else if (item.category === "cases") {
      onNavigate("cases");
      // Optionally trigger specific details selection
      if (item.caseObj) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("adalah-select-case", { detail: item.caseObj }));
        }, 150);
      }
    } else {
      onNavigate(item.tab);
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 md:px-0">
          
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#020813]/80 backdrop-blur-md cursor-pointer"
          />

          {/* Interactive Modal Frame */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-[#091b30] border border-amber-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(184,134,11,0.15)] flex flex-col text-right h-[480px]"
            dir="rtl"
          >
            {/* Search Input Row */}
            <div className="flex items-center gap-3.5 px-5 py-4 border-b border-slate-800 bg-[#061424]">
              <Search className="w-5 h-5 text-amber-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="ابحث عن قضية، موكل، مهمة، أو تنقل عبر الأقسام... (Ctrl+Space)"
                className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 outline-none text-sm font-sans"
              />
              <div className="bg-slate-800 text-[10px] text-slate-400 font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-700/60 shrink-0 shadow-sm">
                ESC لإغلاق
              </div>
            </div>

            {/* List Results Box */}
            <div 
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 select-none scrollbar-thin scrollbar-thumb-slate-800"
            >
              {filtered.length === 0 ? (
                <div className="text-center py-24 text-slate-400 space-y-2">
                  <span className="text-2xl">🔍</span>
                  <p className="text-xs font-bold font-sans">لم نجد أي نتائج تطابق عملية البحث "{query}"</p>
                  <p className="text-[10px] text-slate-500">حاول البحث بكلمة أخرى أو رقم قضية</p>
                </div>
              ) : (
                <>
                  {/* Category Group List */}
                  {filtered.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = index === selectedIndex;
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`item flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer ${
                          isActive 
                            ? "item-active bg-amber-500/10 border border-amber-500/40 text-amber-500" 
                            : "bg-transparent border border-transparent text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow transition-colors ${
                            isActive ? "bg-amber-500/20 text-amber-500" : "bg-slate-800/80 text-slate-400"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="text-right min-w-0">
                            <h4 className="text-xs font-black font-sans truncate">{item.label}</h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.detail}</p>
                          </div>
                        </div>

                        {/* Direct action indicator on right side */}
                        <div className="flex items-center gap-2">
                          {item.category === "action" && (
                            <span className="text-[9px] bg-red-500/15 text-red-400 px-2.5 py-0.5 rounded-lg border border-red-500/25 font-bold shrink-0">
                              إجراء فوري
                            </span>
                          )}
                          {isActive && (
                            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer Legend */}
            <div className="bg-[#050f1c] border-t border-slate-800/70 p-3.5 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-800 px-1 rounded-sm border border-slate-700/80 font-mono">↑↓</kbd> للتنقل
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-800 px-1 rounded-sm border border-slate-700/80 font-mono">Enter</kbd> للاختيار
                </span>
              </div>
              <p className="font-bold">منصة العدالة - البحث الفوري الذكي باللوحة الموحدة</p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
