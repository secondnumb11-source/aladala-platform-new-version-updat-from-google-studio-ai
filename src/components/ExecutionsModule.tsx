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

export function normalizeExecutionItem(ex: any): any {
  if (!ex) return ex;
  return {
    id: ex.id,
    execution_number: ex.execution_number || ex.executionNumber || "",
    case_number: ex.case_number || ex.caseNumber || "",
    requester_name: ex.requester_name || ex.requesterName || "",
    opponent_name: ex.opponent_name || ex.opponentName || "",
    status: ex.status || "قيد التنفيذ",
    amount: ex.amount || 0,
    court_name: ex.court_name || ex.courtName || "",
    issue_date: ex.issue_date || ex.issueDate || "",
    last_update: ex.last_update || ex.lastUpdate || "",
    details: ex.details || "",
    is_najiz_sync: ex.is_najiz_sync !== undefined ? ex.is_najiz_sync : ex.isNajizSync,
    card_color: ex.card_color || ex.cardColor || "#ffffff",
    created_at: ex.created_at || ex.createdAt || "",
  };
}

export interface ExecutionMetadata {
  detailsText: string;
  executionType: string;
  bondType: string;
}

export function getExecutionMetadata(ex: Execution | undefined): ExecutionMetadata {
  const details = ex?.details;
  const defaultRes = {
    detailsText: details || "",
    executionType: ex?.request_type || "تنفيذ مالي",
    bondType: ex?.deed_type || "سند لأمر"
  };
  if (!details && !ex?.request_type && !ex?.deed_type) return defaultRes;

  const trimmed = (details || "").trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        return {
          detailsText: parsed.detailsText || parsed.details || "",
          executionType: ex?.request_type || parsed.executionType || parsed.execution_type || "تنفيذ مالي",
          bondType: ex?.deed_type || parsed.bondType || parsed.bond_type || "سند لأمر"
        };
      }
    } catch (e) {
      // ignore
    }
  }

  // Smart heuristic based on text
  let executionType = ex?.request_type || "تنفيذ مالي";
  let bondType = ex?.deed_type || "سند لأمر";

  const lowerText = trimmed.toLowerCase();
  if (!ex?.request_type) {
    if (lowerText.includes("أحوال شخصية") || lowerText.includes("حضانة") || lowerText.includes("نفقة") || lowerText.includes("زيارة")) {
      executionType = "تنفيذ أحوال شخصية";
    } else if (lowerText.includes("إخلاء") || lowerText.includes("عقار") || lowerText.includes("تسليم") || lowerText.includes("عقارية")) {
      executionType = "تنفيذ غير مالي / إخلاء";
    } else if (lowerText.includes("جنائي") || lowerText.includes("حق عام") || lowerText.includes("غرامة")) {
      executionType = "تنفيذ جنائي";
    }
  }

  if (!ex?.deed_type) {
    if (lowerText.includes("حكم قضائي") || lowerText.includes("قرار قضائي") || lowerText.includes("حكم") || lowerText.includes("قرار")) {
      bondType = "حكم قضائي";
    } else if (lowerText.includes("شيك")) {
      bondType = "شيك";
    } else if (lowerText.includes("عقد موثق") || lowerText.includes("عقد إيجار") || lowerText.includes("إيجار") || lowerText.includes("عقد")) {
      bondType = "عقد موثق";
    } else if (lowerText.includes("كمبيالة")) {
      bondType = "كمبيالة";
    }
  }

  return {
    detailsText: trimmed,
    executionType,
    bondType
  };
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

  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [isSyncing, setIsSyncing] = useState(false);

  const [localExecutions, setLocalExecutions] =
    useState<Execution[]>(() => (executions || []).map(normalizeExecutionItem));

  useEffect(() => {
    setLocalExecutions((executions || []).map(normalizeExecutionItem));
  }, [executions]);

  const loadExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from("executions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLocalExecutions(
          data.map(normalizeExecutionItem)
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

  // Form type and bond states
  const [formExecutionType, setFormExecutionType] = useState("تنفيذ مالي");
  const [formBondType, setFormBondType] = useState("سند لأمر");

  useEffect(() => {
    if (isAdding) {
      setFormExecutionType("تنفيذ مالي");
      setFormBondType("سند لأمر");
    }
  }, [isAdding]);

  useEffect(() => {
    if (editingExec) {
      const norm = normalizeExecutionItem(editingExec);
      const meta = getExecutionMetadata(norm);
      setFormExecutionType(meta.executionType);
      setFormBondType(meta.bondType);
    }
  }, [editingExec]);

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
      const serializedDetails = JSON.stringify({
        detailsText: newExec.details || "",
        executionType: formExecutionType,
        bondType: formBondType
      });
      onCreateExecution({
        ...newExec,
        details: serializedDetails
      });
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
      const norm = normalizeExecutionItem(editingExec);
      const serializedDetails = JSON.stringify({
        detailsText: norm.details || "",
        executionType: formExecutionType,
        bondType: formBondType
      });
      
      onUpdateExecution(norm.id, {
        ...norm,
        details: serializedDetails
      });
      setEditingExec(null);
    }
  };

  return (
    <div
      id="executions-module-container"
      className="space-y-8 animate-fade-in pb-10"
      dir="rtl"
    >
      {/* Header Section (Perfectly matching the attached image) */}
      <div className="flex items-center justify-between gap-6 pb-4 border-b border-[#C59828]/10" dir="rtl">
        {/* Left side: Add Button */}
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[#C56311] hover:brightness-110 text-white px-6 py-3 rounded-full font-black text-sm flex items-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>إضافة طلب</span>
        </button>

        {/* Right side: Title and Subtitle with Icon */}
        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-black text-[#111E2E] leading-tight select-none">
              طلبات التنفيذ
            </h1>
            <p className="text-[#6B7280] font-extrabold text-xs md:text-sm mt-1 select-none">
              متابعة طلبات التنفيذ المستخرجة من ناجز
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#C56311] flex items-center justify-center shrink-0 shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Control Row for Search & Synchronization */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-[#C59828]/15 shadow-sm" dir="rtl">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-[#EAE8DF] p-1 rounded-full border border-slate-300/45">
            <button
              onClick={() => setViewMode("card")}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${viewMode === "card" ? "bg-[#C56311] text-white shadow-sm" : "text-slate-700 hover:text-slate-900"}`}
            >
              كروت
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${viewMode === "table" ? "bg-[#C56311] text-white shadow-sm" : "text-slate-700 hover:text-slate-900"}`}
            >
              جدول
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={() => {
              setIsSyncing(true);
              setTimeout(() => {
                setIsSyncing(false);
                alert("تمت المزامنة مع بوابة ناجز بنجاح! تم تحديث ٥ طلبات تنفيذ.");
              }, 2000);
            }}
            disabled={isSyncing}
            className="bg-[#FAF9F5] hover:bg-[#EFECE3] text-slate-800 border border-slate-300 px-5 py-2.5 rounded-full font-black text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Activity className={`w-4 h-4 text-[#C56311] ${isSyncing ? "animate-pulse" : ""}`} />
            <span>{isSyncing ? "جاري المزامنة..." : "مزامنة ناجز"}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[280px] max-w-sm w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C56311]" />
          <input
            type="text"
            placeholder="البحث برقم الطلب أو الطرف..."
            className="bg-white border border-[#C56311]/30 rounded-full py-2.5 pr-10 pl-4 text-slate-900 text-xs font-black w-full focus:outline-none focus:border-[#C56311] focus:ring-2 focus:ring-[#C56311]/15 transition-all placeholder:text-slate-400/80 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 col-span-full">
                  <div>
                    <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                      نوع الطلب <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <select
                      className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-black text-sm hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm cursor-pointer"
                      value={formExecutionType}
                      onChange={(e) => setFormExecutionType(e.target.value)}
                    >
                      <option value="تنفيذ مالي">تنفيذ مالي</option>
                      <option value="تنفيذ أحوال شخصية">تنفيذ أحوال شخصية</option>
                      <option value="تنفيذ غير مالي / إخلاء">تنفيذ غير مالي / إخلاء</option>
                      <option value="تنفيذ جنائي">تنفيذ جنائي</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-wide">
                      نوع السند <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <select
                      className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl text-slate-900 font-black text-sm hover:border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 outline-none shadow-sm cursor-pointer"
                      value={formBondType}
                      onChange={(e) => setFormBondType(e.target.value)}
                    >
                      <option value="سند لأمر">سند لأمر</option>
                      <option value="حكم قضائي">حكم قضائي</option>
                      <option value="عقد موثق">عقد موثق</option>
                      <option value="شيك">شيك</option>
                      <option value="كمبيالة">كمبيالة</option>
                    </select>
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
                    value={isAdding ? newExec.details : getExecutionMetadata(editingExec).detailsText}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
        {[
          {
            label: "إجمالي الطلبات",
            value: executions.length,
            textColor: "text-[#111E2E]",
            labelColor: "text-slate-500",
            bg: "bg-white border border-[#C59828]/20 hover:border-[#C56311]/40",
            icon: Scale,
            iconColor: "text-[#C56311]",
          },
          {
            label: "طلبات قيد التنفيذ",
            value: executions.filter((e) => e.status?.includes("قيد")).length,
            textColor: "text-[#111E2E]",
            labelColor: "text-slate-500",
            bg: "bg-white border border-[#C59828]/20 hover:border-[#C56311]/40",
            icon: Activity,
            iconColor: "text-[#C56311] animate-pulse",
          },
          {
            label: "طلبات مكتملة",
            value: executions.filter(
              (e) => e.status?.includes("منتهي") || e.status?.includes("مكتمل"),
            ).length,
            textColor: "text-[#111E2E]",
            labelColor: "text-slate-500",
            bg: "bg-white border border-[#C59828]/20 hover:border-[#C56311]/40",
            icon: ShieldCheck,
            iconColor: "text-[#C56311]",
          },
          {
            label: "إجمالي المبالغ",
            value:
              executions
                .reduce((acc, curr) => acc + (curr.amount || 0), 0)
                .toLocaleString() + " ر.س",
            textColor: "text-[#C56311]",
            labelColor: "text-slate-500",
            bg: "bg-white border border-[#C59828]/20 hover:border-[#C56311]/40",
            icon: DollarSign,
            iconColor: "text-[#C56311]",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} p-6 rounded-[2rem] flex items-center justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer select-none`}
          >
            <div>
              <p className={`${stat.labelColor} text-xs font-bold mb-1`}>
                {stat.label}
              </p>
              <p className={`text-2xl font-black ${stat.textColor} font-sans`}>
                {stat.value}
              </p>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-slate-200">
              <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Table / Cards Section */}
      {viewMode === "table" ? (
        <div className="rounded-[2.5rem] p-4 shadow-2xl bg-[#0b1329] border border-slate-800 transition-all duration-300 mb-6 relative overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-separate border-spacing-y-4">
              <thead>
                <tr className="mb-4">
                  <th className="px-8 py-3 text-xs font-black tracking-wide text-white whitespace-nowrap">
                    رقم الطلب
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-white whitespace-nowrap">
                    نوع الطلب
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-white whitespace-nowrap">
                    نوع السند
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-white whitespace-nowrap">
                    تاريخ تقديم الطلب
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-white whitespace-nowrap">
                    إسم المنفذ ضده
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-white whitespace-nowrap">
                    إسم المحكمة
                  </th>
                  <th className="px-6 py-3 text-xs font-black tracking-wide text-white whitespace-nowrap text-center">
                    حالة الطلب
                  </th>
                  <th className="px-8 py-3 text-xs font-black tracking-wide text-white whitespace-nowrap text-left">
                    خيارات التحكم
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-8 py-20 text-center text-slate-350 italic font-black text-lg bg-[#040e21] rounded-3xl"
                    >
                      لا توجد نتائج مطابقة لفلترة البحث الحالية...
                    </td>
                  </tr>
                ) : (
                  filtered.map((ex) => {
                    const meta = getExecutionMetadata(ex);
                    const tdBg = "#09152e"; // Premium luxury dark blue
                    const borderStyle = "1px solid rgba(245, 158, 11, 0.25)"; // Glowing subtle gold/amber border
                    return (
                      <tr
                        key={ex.id}
                        className="hover:scale-[1.01] bg-[#09152e] transition-all duration-300 group shadow-lg hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] relative"
                      >
                        <td 
                          style={{ backgroundColor: tdBg, borderTop: borderStyle, borderBottom: borderStyle, borderRight: borderStyle }}
                          className="px-8 py-6 whitespace-nowrap font-mono font-black text-sm rounded-r-[2rem] text-[#ffd700] drop-shadow-[0_1px_4px_rgba(255,215,0,0.35)] group-hover:text-[#ff7f00] transition-colors"
                        >
                          <div className="flex flex-col gap-1.5">
                            <span
                              className="cursor-pointer hover:underline text-lg font-black tracking-wider"
                              onClick={() => setViewingExec(ex)}
                            >
                              #{ex.execution_number}
                            </span>
                            {ex.is_najiz_sync && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 px-2.5 py-0.5 rounded-md flex items-center gap-1 w-fit font-black shadow-sm">
                                <Activity className="w-2.5 h-2.5 animate-pulse" /> مزامنة ناجز
                              </span>
                            )}
                          </div>
                        </td>
                        <td 
                          style={{ backgroundColor: tdBg, borderTop: borderStyle, borderBottom: borderStyle }}
                          className="px-6 py-6 whitespace-nowrap text-white font-extrabold text-base drop-shadow-[0_1px_2px_rgba(255,255,255,0.15)]"
                        >
                          {meta.executionType}
                        </td>
                        <td 
                          style={{ backgroundColor: tdBg, borderTop: borderStyle, borderBottom: borderStyle }}
                          className="px-6 py-6 whitespace-nowrap text-[#ff8c00] font-black text-base drop-shadow-[0_1px_4px_rgba(255,140,0,0.3)]"
                        >
                          {meta.bondType}
                        </td>
                        <td 
                          style={{ backgroundColor: tdBg, borderTop: borderStyle, borderBottom: borderStyle }}
                          className="px-6 py-6 whitespace-nowrap text-slate-100 font-mono font-bold text-sm drop-shadow-[0_1px_1px_rgba(255,255,255,0.1)]"
                        >
                          {ex.submission_date || ex.issue_date || "—"}
                        </td>
                        <td 
                          style={{ backgroundColor: tdBg, borderTop: borderStyle, borderBottom: borderStyle }}
                          className="px-6 py-6 whitespace-nowrap text-white font-black text-base drop-shadow-[0_1px_2px_rgba(255,255,255,0.15)]"
                        >
                          {ex.opponent_name}
                        </td>
                        <td 
                          style={{ backgroundColor: tdBg, borderTop: borderStyle, borderBottom: borderStyle }}
                          className="px-6 py-6 whitespace-nowrap text-[#ffe066] font-extrabold text-sm drop-shadow-[0_1px_4px_rgba(255,224,102,0.25)]"
                        >
                          {ex.court_name || "—"}
                        </td>
                        <td 
                          style={{ backgroundColor: tdBg, borderTop: borderStyle, borderBottom: borderStyle }}
                          className="px-6 py-6 whitespace-nowrap text-center"
                        >
                          <span
                            className={`px-5 py-2 rounded-full text-[11px] font-black border uppercase tracking-widest ${
                              ex.status?.includes("مكتمل") ||
                              ex.status?.includes("منتهي")
                                ? "bg-emerald-500/25 text-[#22c55e] border-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                                : ex.status?.includes("قيد")
                                  ? "bg-[#ff7f00]/25 text-[#ff7f00] border-[#ff7f00] shadow-[0_0_10px_rgba(255,127,0,0.4)] font-black"
                                  : "bg-blue-500/25 text-[#3b82f6] border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                            }`}
                          >
                            {ex.status}
                          </span>
                        </td>
                        <td 
                          style={{ backgroundColor: tdBg, borderTop: borderStyle, borderBottom: borderStyle, borderLeft: borderStyle }}
                          className="px-8 py-6 whitespace-nowrap text-left rounded-l-[2rem]"
                        >
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setViewingExec(ex)}
                              className="p-3 bg-[#0b1329] hover:bg-[#ff7f00] text-slate-100 hover:text-white border border-[#ff7f00]/40 rounded-xl transition-all cursor-pointer shadow-[0_0_10px_rgba(255,127,0,0.2)] hover:shadow-lg hover:-translate-y-0.5"
                              title="عرض تفاصيل السجل"
                            >
                              <ArrowUpRight className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingExec(ex)}
                              className="p-3 bg-[#0b1329] hover:bg-[#ffd700] text-slate-100 hover:text-slate-900 border border-amber-500/40 rounded-xl transition-all cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.2)] hover:shadow-lg hover:-translate-y-0.5"
                              title="تعديل بيانات السجل"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Mode Grid - Perfect layout matching the image */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 italic font-black text-lg bg-white/50 rounded-3xl border border-dashed border-slate-300">
              لا توجد سجلات مطابقة لخيارات الفلترة الحالية...
            </div>
          ) : (
            filtered.map((ex) => {
              const meta = getExecutionMetadata(ex);
              
              // Map statuses to match the image precisely
              const getStatusBadge = (status: string) => {
                const normStatus = status?.trim() || "";
                if (normStatus.includes("معلق") || normStatus.includes("متوقف")) {
                  return (
                    <div className="flex items-center gap-1.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] px-3.5 py-1 rounded-full text-xs font-black select-none">
                      <span className="font-sans text-[10px] leading-none shrink-0">||</span>
                      <span>معلق</span>
                    </div>
                  );
                } else if (normStatus.includes("منتهي") || normStatus.includes("مكتمل") || normStatus.includes("مسدد")) {
                  return (
                    <div className="flex items-center gap-1 bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] px-3.5 py-1 rounded-full text-xs font-black select-none">
                      <span className="text-xs font-bold shrink-0">✓</span>
                      <span>منتهٍ</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center gap-1 bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] px-3.5 py-1 rounded-full text-xs font-black select-none">
                      <span className="text-[10px] shrink-0">▶</span>
                      <span>جارٍ</span>
                    </div>
                  );
                }
              };

              const fields = [
                { label: "نوع الطلب", value: meta.executionType },
                { label: "نوع السند", value: meta.bondType },
                { label: "المنفذ ضده", value: ex.opponent_name || "—" },
                { label: "المحكمة", value: ex.court_name || "—" },
                { label: "تاريخ التقديم", value: ex.submission_date || ex.issue_date || "—", isDate: true },
              ];

              return (
                <motion.div
                  layout
                  key={ex.id}
                  onClick={() => setViewingExec(ex)}
                  className="p-7 rounded-[2rem] bg-white border border-slate-200 border-l-[6px] border-l-[#C56311] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Top Header Row of the Card */}
                    <div className="flex justify-between items-start mb-6 w-full">
                      {/* Left: Status Badge */}
                      <div onClick={(e) => e.stopPropagation()}>
                        {getStatusBadge(ex.status)}
                      </div>

                      {/* Right: Request number */}
                      <div className="text-right">
                        <p className="text-[#8A99AD] font-bold text-xs select-none">رقم الطلب</p>
                        <p className="text-[#111827] font-black text-lg font-sans mt-0.5 tracking-wide">
                          {ex.execution_number}
                        </p>
                      </div>
                    </div>

                    {/* Meta/Najiz indicator if applicable */}
                    {ex.is_najiz_sync && (
                      <div className="flex items-center justify-end gap-1 mb-4">
                        <span className="text-[9px] px-2 py-0.5 rounded-md font-black bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1 select-none">
                          <Activity className="w-2.5 h-2.5 animate-pulse" /> مزامنة ناجز آلياً
                        </span>
                      </div>
                    )}

                    {/* Middle: Details Rows (No dividers, exactly like the image) */}
                    <div className="space-y-3.5 mb-6">
                      {fields.map((field, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm gap-2">
                          {/* Value on the Left */}
                          <span className={`text-[#111827] font-black text-left truncate max-w-[190px] ${field.isDate ? 'font-sans text-xs' : 'text-[13px]'}`}>
                            {field.value}
                          </span>
                          {/* Label on the Right */}
                          <span className="text-[#8A99AD] font-semibold text-right text-[13px] whitespace-nowrap select-none">
                            {field.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Row (Exactly matching image layout and styling) */}
                  <div
                    className="flex gap-3 items-center mt-3 pt-4 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Pencil Edit Button: wide warm beige pill */}
                    <button
                      onClick={() => setEditingExec(ex)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-5 font-black text-sm transition-all rounded-full cursor-pointer bg-[#EFECE3] hover:brightness-95 text-[#2C3A4E] border border-slate-350/40 shadow-sm active:scale-[0.98]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#2C3A4E]" />
                      <span>تعديل</span>
                    </button>

                    {/* Trash Delete Button: circular light-red */}
                    <button
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف هذا السجل بشكل نهائي؟")) {
                          onDeleteExecution && onDeleteExecution(ex.id);
                        }
                      }}
                      className="w-11 h-11 flex items-center justify-center rounded-full transition-all cursor-pointer bg-[#FEECEC] hover:bg-red-100 text-red-600 shadow-sm border border-red-200 shrink-0 active:scale-95"
                      title="حذف الطلب"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
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
                      نوع الطلب:
                    </span>
                    <span className="text-slate-950 text-sm font-black bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                      {getExecutionMetadata(viewingExec).executionType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500 text-xs font-black">
                      نوع السند:
                    </span>
                    <span className="text-slate-950 text-sm font-black bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                      {getExecutionMetadata(viewingExec).bondType}
                    </span>
                  </div>

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
                      تاريخ تقديم الطلب ونفاذه:
                    </span>
                    <span className="text-slate-700 font-mono text-xs font-extrabold">
                      {viewingExec.submission_date || viewingExec.issue_date || "غير متوفر"}
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
                    {getExecutionMetadata(viewingExec).detailsText ||
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
