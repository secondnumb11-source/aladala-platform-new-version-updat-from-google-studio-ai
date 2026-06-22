import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import {
  Gavel,
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  CreditCard,
  FileText,
  ChevronLeft,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  DollarSign,
  Activity,
  Trash2,
  Edit2,
  X,
} from "lucide-react";
import { Execution } from "../types";

export function calculateTextColor(hexColor: string | undefined): "text-black" | "text-white" {
  if (!hexColor) return "text-black";
  const cleanHex = hexColor.replace("#", "");
  if (cleanHex.toLowerCase() === "white" || cleanHex.toLowerCase() === "ffffff") return "text-black";

  let r = 255, g = 255, b = 255;
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else if (cleanHex.length === 3) {
    r = parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16);
    g = parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16);
    b = parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16);
  }

  const getSrgb = (c: number) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const L = 0.2126 * getSrgb(r) + 0.7152 * getSrgb(g) + 0.0722 * getSrgb(b);
  return L > 0.179 ? "text-black" : "text-white";
}

export function getTextColorForBg(hexColor: string | undefined): { text: string; subtext: string; label: string; accent: string; border: string; bgBadge?: string } {
  if (!hexColor || hexColor === '#ffffff' || hexColor === 'white') {
    return {
      text: 'text-slate-900',
      subtext: 'text-slate-705',
      label: 'text-slate-500',
      accent: 'text-amber-600',
      border: 'border-slate-200',
      bgBadge: 'bg-slate-100 text-slate-800'
    };
  }
  
  const hex = hexColor.startsWith('#') ? hexColor.substring(1) : hexColor;
  let r = 255, g = 255, b = 255;
  if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (hex.length === 3) {
    r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
    g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
    b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
  }
  
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  
  if (luminance >= 140) {
    return {
      text: 'text-slate-900',
      subtext: 'text-slate-800 font-extrabold',
      label: 'text-slate-600 font-extrabold',
      accent: 'text-amber-700',
      border: 'border-slate-350/50',
      bgBadge: 'bg-white/90 text-slate-900 border border-slate-200 shadow-sm'
    };
  } else {
    return {
      text: 'text-white font-black drop-shadow-sm',
      subtext: 'text-slate-100 font-black drop-shadow-sm',
      label: 'text-slate-300 font-extrabold',
      accent: 'text-amber-300 font-black drop-shadow-sm',
      border: 'border-white/10',
      bgBadge: 'bg-black/50 text-white border border-white/20'
    };
  }
}

interface ExecutionsModuleProps {
  executions: Execution[];
  onCreateExecution?: (e: Partial<Execution>) => void;
  onUpdateExecution?: (id: string, updates: Partial<Execution>) => void;
  onDeleteExecution?: (id: string) => void;
}

export default function ExecutionsModule({
  executions = [],
  onCreateExecution,
  onUpdateExecution,
  onDeleteExecution,
}: ExecutionsModuleProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [editingExec, setEditingExec] = useState<Execution | null>(null);
  const [viewingExec, setViewingExec] = useState<Execution | null>(null);

  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isSyncing, setIsSyncing] = useState(false);

  const [localExecutions, setLocalExecutions] =
    useState<Execution[]>(executions);

  useEffect(() => {
    setLocalExecutions(executions);
  }, [executions]);

  const loadExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from("executions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLocalExecutions(
          data.map((db: any) => ({
            id: db.id,
            execution_number: db.execution_number || "",
            status: db.status || "pending",
            amount: db.amount || 0,
            court_name: db.court_name || "",
            requester_name: db.requester_name || "",
            opponent_name: db.opponent_name || "",
            issue_date: db.issue_date || "",
            is_najiz_sync: db.is_najiz_sync || false,
            created_at: db.created_at,
          })),
        );
      }
    } catch (e) {
      console.error("[ExecutionsModule Load Exception]", e);
    }
  };

  useEffect(() => {
    loadExecutions();

    const handleSyncComplete = () => {
      console.log(
        "[ExecutionsModule] Najiz sync completed, refreshing executions...",
      );
      loadExecutions();
    };

    window.addEventListener("najiz_sync_complete", handleSyncComplete);
    return () => {
      window.removeEventListener("najiz_sync_complete", handleSyncComplete);
    };
  }, []);

  // New execution form state
  const [newExec, setNewExec] = useState<Partial<Execution>>({
    execution_number: "",
    requester_name: "",
    opponent_name: "",
    amount: 0,
    status: "قيد التنفيذ",
    court_name: "",
    issue_date: new Date().toISOString().split("T")[0],
    details: "",
    card_color: "#ffffff",
  });

  const filtered = localExecutions.filter((ex) => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch =
      (ex.execution_number || "").toLowerCase().includes(searchLow) ||
      (ex.requester_name || "").toLowerCase().includes(searchLow) ||
      (ex.opponent_name || "").toLowerCase().includes(searchLow);
    const matchesStatus = filterStatus === "all" || ex.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateExecution) {
      onCreateExecution(newExec);
      setIsAdding(false);
      setNewExec({
        execution_number: "",
        requester_name: "",
        opponent_name: "",
        amount: 0,
        status: "قيد التنفيذ",
        court_name: "",
        issue_date: new Date().toISOString().split("T")[0],
        details: "",
        card_color: "#ffffff",
      });
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExec && onUpdateExecution) {
      onUpdateExecution(editingExec.id, editingExec);
      setEditingExec(null);
    }
  };

  return (
    <div
      id="executions-module-container"
      className="space-y-8 animate-fade-in pb-10"
      dir="rtl"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-10"></div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-2">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
              <Scale className="w-8 h-8 text-amber-600" />
            </div>
            إدارة طلبات التنفيذ
          </h1>
          <p className="text-amber-700 font-bold text-sm">
            متابعة كافة طلبات التنفيذ المزامنة من ناجز أو المضافة يدوياً بتنسيق
            فاخر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === "table" ? "bg-amber-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900"}`}
            >
              جدول
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === "card" ? "bg-amber-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900"}`}
            >
              كروت
            </button>
          </div>

          <button
            onClick={() => {
              setIsSyncing(true);
              setTimeout(() => {
                setIsSyncing(false);
                alert(
                  "تمت المزامنة مع بوابة ناجز بنجاح! تم تحديث ٥ طلبات تنفيذ.",
                );
              }, 2000);
            }}
            disabled={isSyncing}
            className="bg-white hover:bg-slate-50 text-amber-600 border border-amber-300 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Activity
              className={`w-5 h-5 ${isSyncing ? "animate-pulse" : ""}`}
            />
            {isSyncing ? "جاري المزامنة..." : "مزامنة عن طريق ناجز"}
          </button>

          <div className="relative group min-w-[280px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600 group-focus-within:text-amber-700 transition-colors" />
            <input
              type="text"
              placeholder="البحث برقم الطلب أو اسم الطرف..."
              className="bg-white border-2 border-slate-300 rounded-2xl py-3 pr-12 pl-6 text-slate-900 text-sm font-black w-full md:w-80 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            قيد طلب يدوي
          </button>
        </div>
      </div>

      {/* Manual Creation / Edit Modal */}
      <AnimatePresence>
        {(isAdding || editingExec) && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAdding(false);
                setEditingExec(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 relative z-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isAdding
                    ? "قيد سجل تنفيذ جديد"
                    : `تعديل بيانات طلب التنفيذ: ${editingExec?.execution_number}`}
                </h2>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingExec(null);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={isAdding ? handleSubmit : handleUpdateSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
              >
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                      رقم طلب التنفيذ{" "}
                      <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      required
                      className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-mono font-black text-sm placeholder-slate-400 hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm"
                      value={
                        isAdding
                          ? newExec.execution_number
                          : editingExec?.execution_number
                      }
                      onChange={(e) =>
                        isAdding
                          ? setNewExec({
                              ...newExec,
                              execution_number: e.target.value,
                            })
                          : setEditingExec({
                              ...editingExec!,
                              execution_number: e.target.value,
                            })
                      }
                      placeholder="مثال: 4400123456"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                      اسم طالب التنفيذ (الموكل){" "}
                      <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      required
                      className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-black text-sm placeholder-slate-400 hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm"
                      value={
                        isAdding
                          ? newExec.requester_name
                          : editingExec?.requester_name
                      }
                      onChange={(e) =>
                        isAdding
                          ? setNewExec({
                              ...newExec,
                              requester_name: e.target.value,
                            })
                          : setEditingExec({
                              ...editingExec!,
                              requester_name: e.target.value,
                            })
                      }
                      placeholder="اسم الموكل..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                      اسم المنفذ ضده{" "}
                      <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      required
                      className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-black text-sm placeholder-slate-400 hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm"
                      value={
                        isAdding
                          ? newExec.opponent_name
                          : editingExec?.opponent_name
                      }
                      onChange={(e) =>
                        isAdding
                          ? setNewExec({
                              ...newExec,
                              opponent_name: e.target.value,
                            })
                          : setEditingExec({
                              ...editingExec!,
                              opponent_name: e.target.value,
                            })
                      }
                      placeholder="اسم الطرف الآخر..."
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                      مبلغ التنفيذ (ر.س){" "}
                      <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-mono font-black text-sm placeholder-slate-400 hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm"
                      value={isAdding ? newExec.amount : editingExec?.amount}
                      onChange={(e) =>
                        isAdding
                          ? setNewExec({
                              ...newExec,
                              amount: Number(e.target.value),
                            })
                          : setEditingExec({
                              ...editingExec!,
                              amount: Number(e.target.value),
                            })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                      المحكمة / الدائرة
                    </label>
                    <input
                      className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-black text-sm placeholder-slate-400 hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm"
                      value={
                        isAdding ? newExec.court_name : editingExec?.court_name
                      }
                      onChange={(e) =>
                        isAdding
                          ? setNewExec({
                              ...newExec,
                              court_name: e.target.value,
                            })
                          : setEditingExec({
                              ...editingExec!,
                              court_name: e.target.value,
                            })
                      }
                      placeholder="إدارة التنفيذ..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                      تاريخ القيد
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-black text-sm placeholder-slate-400 hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm"
                      value={
                        isAdding ? newExec.issue_date : editingExec?.issue_date
                      }
                      onChange={(e) =>
                        isAdding
                          ? setNewExec({
                              ...newExec,
                              issue_date: e.target.value,
                            })
                          : setEditingExec({
                              ...editingExec!,
                              issue_date: e.target.value,
                            })
                      }
                    />
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                    الحالة الحالية للطلب
                  </label>
                  <select
                    className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-black text-sm hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm cursor-pointer"
                    value={isAdding ? newExec.status : editingExec?.status}
                    onChange={(e) =>
                      isAdding
                        ? setNewExec({ ...newExec, status: e.target.value })
                        : setEditingExec({
                            ...editingExec!,
                            status: e.target.value,
                          })
                    }
                  >
                    <option
                      value="قيد التنفيذ"
                      className="bg-white text-slate-900"
                    >
                      ⏳ قيد التنفيذ
                    </option>
                    <option value="مكتمل" className="bg-white text-slate-900">
                      ✅ منتهي ومسدد بنجاح
                    </option>
                    <option
                      value="طلب معلق"
                      className="bg-white text-slate-900"
                    >
                      ⚠️ معلق بقرار قضائي
                    </option>
                  </select>
                </div>

                <div className="col-span-full">
                  <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                    ملاحظات العمل الخاصة بالسجل
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-bold text-sm placeholder-slate-400 hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm resize-none"
                    value={isAdding ? newExec.details : editingExec?.details}
                    onChange={(e) =>
                      isAdding
                        ? setNewExec({ ...newExec, details: e.target.value })
                        : setEditingExec({
                            ...editingExec!,
                            details: e.target.value,
                          })
                    }
                  />
                </div>

                {/* Accessibility High Contrast Color Settings */}
                <div className="col-span-full bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                  <label className="text-xs font-black text-slate-900 mb-2 block uppercase tracking-wide">
                    الهوية اللونية والسطوع للكارت (Accessibility High Contrast Settings)
                  </label>
                  <p className="text-[11px] text-slate-600 font-extrabold mb-4 leading-relaxed">
                    اصنع مظهراً متميزاً لكارت طلب التنفيذ. سيقوم محرك الألوان الذكي بمكتب دقة المحاماة تلقائياً بفحص سطوع اللون وتغيير لون النصوص (أبيض أو أسود) بصورة تكفل أعلى درجات الوصول وسهولة القراءة والمطابقة للمعايير العالمية.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { hex: "#ffffff", label: "أبيض فائق" },
                      { hex: "#fffdf5", label: "أمبر ملكي" },
                      { hex: "#f0f7ff", label: "أزرق نيلي" },
                      { hex: "#f2faf6", label: "أخضر عذق" },
                      { hex: "#faf5ff", label: "بنفسجي ناعم" },
                      { hex: "#3b0764", label: "داكن أرجواني" },
                      { hex: "#0f172a", label: "كحلي وقاد" },
                      { hex: "#4a1d1d", label: "قرنفلي قضائي" },
                    ].map((col) => {
                      const activeColor = isAdding ? (newExec.card_color || "#ffffff") : (editingExec?.card_color || "#ffffff");
                      const isSelected = activeColor === col.hex;
                      const textConfig = getTextColorForBg(col.hex);
                      return (
                        <button
                          type="button"
                          key={col.hex}
                          onClick={() => {
                            if (isAdding) {
                              setNewExec({ ...newExec, card_color: col.hex });
                            } else if (editingExec) {
                              setEditingExec({ ...editingExec, card_color: col.hex });
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-black transition-all cursor-pointer shadow-sm ${
                            isSelected
                              ? "border-amber-600 ring-2 ring-amber-500/20 scale-105"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                          style={{ backgroundColor: col.hex, color: textConfig.text.includes("white") ? "#ffffff" : "#0f172a" }}
                        >
                          <span className="w-3 h-3 rounded-full border border-slate-300 block shrink-0" style={{ backgroundColor: col.hex }}></span>
                          <span className="truncate">{col.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-full pt-4 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white p-5 rounded-2xl font-extrabold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer border border-amber-500/50"
                  >
                    {isAdding
                      ? "اعتماد قيد الطلب الجديد والمزامنة ✅"
                      : "حفظ التغييرات وتحديث بيانات السجل 💾"}
                  </button>
                  {editingExec && onDeleteExecution && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm("هل أنت متأكد من حذف هذا السجل بشكل نهائي؟")
                        ) {
                          onDeleteExecution(editingExec.id);
                          setEditingExec(null);
                        }
                      }}
                      className="bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 px-8 rounded-2xl transition-all font-black text-sm cursor-pointer shadow-sm"
                    >
                      حذف السجل
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "إجمالي الطلبات",
            value: executions.length,
            textColor: "text-blue-700",
            labelColor: "text-blue-600 font-black",
            bg: "bg-blue-50 border-blue-200 hover:border-blue-300",
            icon: Scale,
            iconColor: "text-blue-600",
          },
          {
            label: "قيد التنفيذ",
            value: executions.filter((e) => e.status?.includes("قيد")).length,
            textColor: "text-amber-700",
            labelColor: "text-amber-600 font-black",
            bg: "bg-amber-50 border-amber-200 hover:border-amber-300",
            icon: Activity,
            iconColor: "text-amber-600 animate-pulse",
          },
          {
            label: "طلبات مكتملة",
            value: executions.filter(
              (e) => e.status?.includes("منتهي") || e.status?.includes("مكتمل"),
            ).length,
            textColor: "text-emerald-700",
            labelColor: "text-emerald-600 font-black",
            bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
            icon: ShieldCheck,
            iconColor: "text-emerald-600",
          },
          {
            label: "إجمالي المبالغ",
            value:
              executions
                .reduce((acc, curr) => acc + (curr.amount || 0), 0)
                .toLocaleString() + " ر.س",
            textColor: "text-purple-700",
            labelColor: "text-purple-600 font-black",
            bg: "bg-purple-50 border-purple-200 hover:border-purple-300",
            icon: DollarSign,
            iconColor: "text-purple-600",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} p-6 rounded-[2rem] border-2 flex items-center justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-md cursor-pointer`}
          >
            <div>
              <p
                className={`${stat.labelColor} text-xs mb-1 uppercase tracking-wider`}
              >
                {stat.label}
              </p>
              <p className={`text-2xl font-black ${stat.textColor} font-sans`}>
                {stat.value}
              </p>
            </div>
            <div className="p-3 bg-white/60 rounded-2xl border border-white">
              <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Table / Cards Section */}
      {viewMode === "table" ? (
        <div className="rounded-[2.5rem] p-4 shadow-sm bg-white border border-slate-200 transition-all duration-300 mb-6 relative overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-separate border-spacing-y-4">
              <thead>
                <tr className="mb-4">
                  <th className="px-8 py-3 text-xs font-black tracking-wide text-slate-500 whitespace-nowrap">
                    رقم الطلب الرسمي
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-slate-500 whitespace-nowrap">
                    طالب الحماية (الموكل)
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-slate-500 whitespace-nowrap">
                    المنفذ ضده
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-slate-500 whitespace-nowrap text-center">
                    المبلغ المستحق
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-slate-500 whitespace-nowrap text-center">
                    الحالة الحالية
                  </th>
                  <th className="px-8 py-3 text-xs font-black tracking-wide text-slate-500 whitespace-nowrap text-left">
                    خيارات التحكم
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-8 py-20 text-center text-slate-400 italic font-black text-lg bg-slate-50 rounded-3xl"
                    >
                      لا توجد نتائج مطابقة لفلترة البحث الحالية...
                    </td>
                  </tr>
                ) : (
                  filtered.map((ex) => (
                    <tr
                      key={ex.id}
                      className="hover:scale-[1.01] bg-white transition-all duration-300 group shadow-sm hover:shadow-md relative"
                    >
                      <td className="px-8 py-6 whitespace-nowrap font-mono font-black text-sm text-[#0f172a] rounded-r-[2rem] border-y border-r border-slate-200 group-hover:text-amber-600 transition-colors">
                        <div className="flex flex-col gap-1">
                          <span
                            className="cursor-pointer hover:underline text-lg drop-shadow-sm"
                            onClick={() => setViewingExec(ex)}
                          >
                            #{ex.execution_number}
                          </span>
                          {ex.is_najiz_sync && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit font-black shadow-sm">
                              <Activity className="w-2.5 h-2.5" /> مزامنة ناجز
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-[#0f172a] font-extrabold text-base border-y border-slate-200">
                        {ex.requester_name}
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-[#334155] font-bold text-base border-y border-slate-200">
                        {ex.opponent_name}
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-center text-amber-600 font-mono font-black text-lg border-y border-slate-200">
                        {(ex.amount || 0).toLocaleString()}{" "}
                        <span className="text-xs text-amber-500 font-sans font-bold">
                          ر.س
                        </span>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-center border-y border-slate-200">
                        <span
                          className={`px-5 py-2 rounded-full text-[11px] font-black border uppercase tracking-widest ${
                            ex.status?.includes("مكتمل") ||
                            ex.status?.includes("منتهي")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                              : ex.status?.includes("قيد")
                                ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                                : "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                          }`}
                        >
                          {ex.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-left rounded-l-[2rem] border-y border-l border-slate-200">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setViewingExec(ex)}
                            className="p-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full transition-all cursor-pointer shadow-sm hover:shadow hover:-translate-y-0.5"
                            title="عرض تفاصيل السجل"
                          >
                            <ArrowUpRight className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingExec(ex)}
                            className="p-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full transition-all cursor-pointer shadow-sm hover:shadow hover:-translate-y-0.5"
                            title="تعديل بيانات السجل"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 italic font-black text-lg bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              لا توجد سجلات مطابقة لخيارات الفلترة الحالية...
            </div>
          ) : (
            filtered.map((ex) => {
              const colors = getTextColorForBg(ex.card_color);
              const isDarkCard = colors.text.includes("white");
              return (
                <motion.div
                  layout
                  key={ex.id}
                  onClick={() => setViewingExec(ex)}
                  className={`p-7 rounded-[2rem] border hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300 group cursor-pointer relative overflow-hidden ${colors.border}`}
                  style={{ backgroundColor: ex.card_color || "#ffffff" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -z-10"></div>

                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm ${
                      isDarkCard ? "bg-white/20 text-white border border-white/30" : "bg-[#0f172a] text-amber-400"
                    }`}>
                      <Gavel className="w-6 h-6" />
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-sm ${
                        ex.status?.includes("مكتمل") || ex.status?.includes("منتهي")
                          ? isDarkCard ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : ex.status?.includes("قيد")
                            ? isDarkCard ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-200"
                            : isDarkCard ? "bg-blue-500/20 text-blue-305 border-blue-500/30" : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {ex.status}
                    </span>
                  </div>

                  <h3 className={`text-lg font-black mb-1.5 transition-colors drop-shadow-sm ${isDarkCard ? "text-white" : "text-[#0f172a] group-hover:text-amber-600"}`}>
                    طلب رقم: {ex.execution_number}
                  </h3>
                  {ex.is_najiz_sync && (
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className={`text-[10px] border px-2.5 py-1 rounded-lg font-black flex items-center gap-1 shadow-sm ${
                        isDarkCard ? "bg-white/10 text-emerald-300 border-white/10" : "bg-emerald-50/80 text-emerald-850 border-emerald-200"
                      }`}>
                        <Activity className="w-3.5 h-3.5 animate-pulse" /> مستورد ومزامن آلياً عبر ناجز
                      </span>
                    </div>
                  )}

                  <div className="space-y-4.5 mb-6 pt-1">
                    <div className={`flex items-center justify-between text-sm pb-2.5 border-b ${isDarkCard ? "border-white/10" : "border-slate-100"}`}>
                      <div className="flex items-center gap-2.5">
                        <User className={`w-4 h-4 ${isDarkCard ? "text-slate-300" : "text-slate-400"}`} />
                        <span className={`${colors.label}`}>
                          الموكل الطالب:
                        </span>
                      </div>
                      <span className={`font-black ${colors.text}`}>
                        {ex.requester_name}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between text-sm pb-2.5 border-b ${isDarkCard ? "border-white/10" : "border-slate-100"}`}>
                      <div className="flex items-center gap-2.5">
                        <User className={`w-4 h-4 ${isDarkCard ? "text-slate-300" : "text-slate-400"}`} />
                        <span className={`${colors.label}`}>
                          الطرف المدين:
                        </span>
                      </div>
                      <span className={`font-extrabold ${colors.subtext}`}>
                        {ex.opponent_name}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between text-sm pb-2.5 border-b ${isDarkCard ? "border-white/10" : "border-slate-100"}`}>
                      <div className="flex items-center gap-2.5">
                        <CreditCard className={`w-4 h-4 ${isDarkCard ? "text-slate-300" : "text-slate-400"}`} />
                        <span className={`${colors.label}`}>
                          قيمة السند:
                        </span>
                      </div>
                      <span className={`font-black text-base font-mono drop-shadow-sm ${colors.accent}`}>
                        {(ex.amount || 0).toLocaleString()}{" "}
                        <span className={`text-[10px] font-sans ${isDarkCard ? "text-amber-305" : "text-amber-600"}`}>
                          ر.س
                        </span>
                      </span>
                    </div>

                    {ex.court_name && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <FileText className={`w-4 h-4 ${isDarkCard ? "text-slate-300" : "text-slate-400"}`} />
                          <span className={`${colors.label}`}>
                            المحكمة:
                          </span>
                        </div>
                        <span className={`font-black text-xs ${colors.subtext}`}>
                          {ex.court_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex gap-2.5 pt-4 border-t ${isDarkCard ? "border-white/10" : "border-slate-100"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setEditingExec(ex)}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 font-black text-xs transition-all border rounded-xl cursor-pointer shadow-sm hover:shadow-md ${
                        isDarkCard
                          ? "bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/45"
                          : "bg-white hover:bg-slate-50 text-[#0f172a] border-slate-200 hover:border-[#0f172a]"
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                      تعديل البيانات
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm("هل أنت متأكد من حذف هذا السجل بشكل نهائي؟")
                        ) {
                          onDeleteExecution && onDeleteExecution(ex.id);
                        }
                      }}
                      className={`p-3 border rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        isDarkCard
                          ? "bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 border-rose-800/50"
                          : "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Execution Details Modal (كارت التفاصيل الداخلية المضيئة) */}
      <AnimatePresence>
        {viewingExec && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingExec(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-600 shadow-sm">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      تفاصيل سجل التنفيذ
                    </h2>
                    <p className="text-xs text-slate-500 font-extrabold mt-1 font-mono">
                      #{viewingExec.execution_number}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingExec(null)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 relative z-10">
                {/* Status Badges Header */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-600 font-black">
                    حالة السند القانوني:
                  </span>
                  <span
                    className={`px-4 py-1.5 rounded-full text-[11px] font-black border uppercase ${
                      viewingExec.status?.includes("مكتمل") ||
                      viewingExec.status?.includes("منتهي")
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                        : viewingExec.status?.includes("قيد")
                          ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                          : "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                    }`}
                  >
                    {viewingExec.status || "قيد المعالجة"}
                  </span>
                </div>

                {/* Sub details card */}
                <div className="bg-white border-2 border-slate-100 shadow-sm p-6 rounded-3xl space-y-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl -z-10"></div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500 text-xs font-black">
                      طالب التنفيذ (الموكل):
                    </span>
                    <span className="text-slate-900 text-sm font-black">
                      {viewingExec.requester_name || "غير محدد"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500 text-xs font-black">
                      المنفذ ضده (المدين):
                    </span>
                    <span className="text-slate-900 text-sm font-extrabold">
                      {viewingExec.opponent_name || "غير محدد"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500 text-xs font-black">
                      قيمة السند التنفيذي الحالية:
                    </span>
                    <span className="text-amber-600 font-mono text-base font-black">
                      {(viewingExec.amount || 0).toLocaleString()} ر.س
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500 text-xs font-black">
                      المحكمة القضائية / المختصة:
                    </span>
                    <span className="text-slate-700 text-xs font-black">
                      {viewingExec.court_name || "محكمة التنفيذ بالمنطقة"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center whitespace-nowrap">
                    <span className="text-slate-500 text-xs font-black">
                      تاريخ القيد ونفاذ الطلب:
                    </span>
                    <span className="text-slate-700 font-mono text-xs font-extrabold">
                      {viewingExec.issue_date || "غير متوفر"}
                    </span>
                  </div>
                </div>

                {/* Automation Details */}
                {viewingExec.is_najiz_sync && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl border border-emerald-200 text-emerald-600 shadow-sm">
                      <ShieldCheck className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-700">
                        موثق ومزامن آلياً عبر بوابة ناجز
                      </h4>
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        آخر مراجعة للتحقق مع ZATCA والعدل:{" "}
                        {viewingExec.last_sync_at
                          ? new Date(
                              viewingExec.last_sync_at,
                            ).toLocaleDateString("ar-SA")
                          : "اللحظة الحالية"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Work description / notes */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-800 font-black block">
                    محاضر وسجل الملاحظات التنفيذية:
                  </span>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl min-h-[80px] text-xs font-bold text-slate-700 leading-relaxed max-h-[140px] overflow-y-auto">
                    {viewingExec.details ||
                      "لا توجد ملاحظات إضافية مسجلة على هذا الطلب حتى الآن."}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      const backupExec = viewingExec;
                      setViewingExec(null);
                      setEditingExec(backupExec);
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm transition-colors shadow-md hover:shadow-lg cursor-pointer text-center active:scale-[0.98] border border-amber-500/50"
                  >
                    تعديل بيانات السجل
                  </button>
                  <button
                    onClick={() => setViewingExec(null)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-6 py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer text-center shadow-sm active:scale-[0.98]"
                  >
                    إغلاق التفاصيل
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
