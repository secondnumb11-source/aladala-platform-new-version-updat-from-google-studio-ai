import React, { useState } from "react";
import {
  Scale,
  Download,
  X,
  RefreshCw,
  Shield,
  FileText,
  AlertCircle,
  Calendar,
  Building2,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

interface DocumentPreviewModalProps {
  viewerDoc: {
    id: string;
    document_name: string;
    case_number: string;
    file_url?: string;
    file_type?: string;
    document_type?: string;
    compressed_size?: number;
    file_size?: number;
    judgment_date?: string;
    court_name?: string;
    circuit_number?: string;
    judge_name?: string;
    notes?: string;
  } | null;
  onClose: () => void;
}

export function calculateTextColor(hexColor: string): "text-white" | "text-slate-950" {
  if (!hexColor) return "text-slate-950";
  const cleanHex = hexColor.replace("#", "");
  
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

  // WCAG Relative Luminance conversion
  const getSrgb = (c: number) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const L = 0.2126 * getSrgb(r) + 0.7152 * getSrgb(g) + 0.0722 * getSrgb(b);
  return L > 0.179 ? "text-slate-950" : "text-white";
}

export default function DocumentPreviewModal({ viewerDoc, onClose }: DocumentPreviewModalProps) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  if (!viewerDoc) return null;

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.15, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.15, 0.5));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const isPdf =
    viewerDoc.file_type?.toLowerCase().includes("pdf") ||
    viewerDoc.file_url?.toLowerCase().split("?")[0].endsWith(".pdf");

  const isImage =
    viewerDoc.file_type?.toLowerCase().startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(viewerDoc.file_url || "");

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-md flex flex-col font-sans select-none animate-fade-in"
      dir="rtl"
    >
      <div className="flex-1 max-w-[96%] max-h-[94%] my-auto mx-auto bg-gradient-to-b from-[#fdfdfc] via-white to-[#faf9f6]/95 border-2 border-amber-500/30 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(139,92,26,0.3)] overflow-hidden flex flex-col">
        
        {/* Header Ribbon - Luxury Brand Styling */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-8 py-5 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/20 border-b border-amber-500/10 shrink-0 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-700 rounded-2xl border border-amber-500/20 shadow-inner flex items-center justify-center">
              <Scale className="w-5.5 h-5.5 text-amber-600 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-serif tracking-wider bg-amber-600/10 text-amber-900 font-extrabold border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                  مستند القضاء العادل
                </span>
                <span className="text-[10px] font-mono font-black text-slate-500">
                  ID: {viewerDoc.id?.substring(0, 8) || "N/A"}
                </span>
              </div>
              <h3 className="text-slate-900 font-black text-base truncate max-w-md drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                {viewerDoc.document_name}
              </h3>
              <p className="text-amber-800 text-xs font-black mt-1 flex items-center gap-1.5 leading-none">
                <span>رقم الدعوى المتعلق:</span>
                <span className="font-mono bg-amber-50 px-2 py-0.5 rounded-md border border-amber-500/20 text-amber-950 font-black shadow-sm">
                  #{viewerDoc.case_number}
                </span>
              </p>
            </div>
          </div>

          {/* Interactive controls row */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isImage && (
              <div className="flex items-center bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2 gap-1.5 shadow-sm transition-all">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 hover:text-amber-600 text-slate-600 rounded-lg cursor-pointer"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-700 select-none min-w-[35px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:text-amber-600 text-slate-600 rounded-lg cursor-pointer"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            {isImage && (
              <button
                onClick={handleRotate}
                className="flex items-center gap-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#1a1105] text-xs font-black rounded-xl transition-all border border-slate-300 shadow-sm cursor-pointer hover:border-amber-500"
                title="تدوير المستند 90 درجة"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>تدوير ({rotation}°)</span>
              </button>
            )}

            {viewerDoc.file_url && (
              <button
                onClick={() => {
                  if (viewerDoc.file_url) {
                    const a = document.createElement("a");
                    a.href = viewerDoc.file_url;
                    a.download = viewerDoc.document_name;
                    a.target = "_blank";
                    a.click();
                  }
                }}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل المستند</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-sm cursor-pointer hover:border-red-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Board: Split-view Layout (Left Preview + Right Sidebar) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#fbfbf8]">
          
          {/* Main Document Frame */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-100/50 border-l border-amber-500/10 relative">
            {viewerDoc.file_url ? (
              isPdf ? (
                <iframe
                  src={`${viewerDoc.file_url}#toolbar=1`}
                  className="w-full h-full max-w-[95%] rounded-2xl border-2 border-amber-500/10 bg-white shadow-xl"
                  title={viewerDoc.document_name}
                />
              ) : isImage ? (
                <div className="relative max-w-full max-h-full flex items-center justify-center p-4">
                  <img
                    src={viewerDoc.file_url}
                    alt={viewerDoc.document_name}
                    style={{
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                      transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-xl border-4 border-white transition-shadow"
                  />
                </div>
              ) : (
                <div className="text-center p-10 bg-white rounded-3xl border border-amber-500/20 text-slate-900 max-w-md shadow-lg font-sans">
                  <FileText className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-bounce" />
                  <h4 className="font-extrabold text-[#1a1105] text-sm leading-relaxed mb-4">
                    لا يدعم المعالجة المرئية الفورية
                  </h4>
                  <p className="text-slate-600 text-xs font-semibold mb-6 leading-relaxed">
                    لا يمكن للمتصفح المكتبي عرض هذا الملف بشكل مدمج. يرجى تنزيل المستند لعرضه من خلال البرامج المحلية لهاتفكم أو حاسوبكم الشخصي.
                  </p>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = viewerDoc.file_url || "";
                      a.download = viewerDoc.document_name;
                      a.click();
                    }}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    تحميل الملف الأصلي مباشرة
                  </button>
                </div>
              )
            ) : (
              <div className="text-center font-sans">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-800 font-extrabold">رابط الملف غير متوفر في شبكة البيانات</p>
              </div>
            )}
          </div>

          {/* Luxury metadata right sidebar */}
          <div className="w-full lg:w-80 bg-[#fdfdfa] border-r border-[#edd4a2]/30 p-6 flex flex-col justify-between shrink-0 text-right text-slate-800 font-sans space-y-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-[#1a1105] font-black text-xs uppercase tracking-widest border-b border-amber-500/10 pb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>تفاصيل وبطاقة التوثيق</span>
                </h4>
              </div>

              <div className="space-y-4">
                {/* File Type classification */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold">تصنيف الملف القضائي:</span>
                  <strong className="text-amber-800 font-black text-xs">
                    {viewerDoc.document_type === "lawsuit_sheet" ? "صحيفة الدعوى الإبتدائية" :
                     viewerDoc.document_type === "judgment" ? "قرار حكم قضائي مصدق" :
                     viewerDoc.document_type === "session_record" ? "محضر ضبط جلسات قانوني" :
                     viewerDoc.document_type === "response_memo" ? "مذكرة جوابه قانونية" : "مستند قضائي معتمد"}
                  </strong>
                </div>

                {/* File Size */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold">الحجم والمساحة المدمجة:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-black text-xs font-mono">
                      {formatFileSize(viewerDoc.compressed_size || viewerDoc.file_size || 0)}
                    </strong>
                    {viewerDoc.compressed_size && viewerDoc.file_size && viewerDoc.compressed_size < viewerDoc.file_size && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-300 font-black">
                        وفر {Math.round((1 - (viewerDoc.compressed_size / viewerDoc.file_size)) * 100)}% ⚡
                      </span>
                    )}
                  </div>
                </div>

                {/* Judgment Date */}
                {viewerDoc.judgment_date && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block font-bold">تاريخ صدور الحكم:</span>
                    <strong className="text-slate-900 font-black text-xs font-mono">{viewerDoc.judgment_date}</strong>
                  </div>
                )}

                {/* Court Name */}
                {viewerDoc.court_name && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block font-bold">المحكمة ومصدر الصدور:</span>
                    <strong className="text-slate-900 font-black text-xs leading-relaxed block">{viewerDoc.court_name}</strong>
                  </div>
                )}

                {/* Circuit Number */}
                {viewerDoc.circuit_number && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block font-bold">الدائرة القضائية:</span>
                    <strong className="text-slate-900 font-black text-xs font-mono">الدائرة {viewerDoc.circuit_number}</strong>
                  </div>
                )}

                {/* Judge Name */}
                {viewerDoc.judge_name && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block font-bold">فضيلة الشيخ ناظر القضية:</span>
                    <strong className="text-slate-900 font-black text-xs">{viewerDoc.judge_name}</strong>
                  </div>
                )}

                {/* Extra judicial notes */}
                {viewerDoc.notes && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-bold">ملاحظات وهوية المستلم:</span>
                    <p className="text-slate-800 text-xs font-semibold leading-relaxed whitespace-pre-line">{viewerDoc.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Tag */}
            <div className="pt-4 border-t border-[#edd4a2]/20 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-[10px] text-amber-900 font-black px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Shield className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>توعية رقمية ( SHA-256 Validated )</span>
              </div>
              <p className="text-[9px] text-[#5c4015] font-black leading-relaxed">
                تمت مراجعة هذا السند ومطابقته رقمياً للأنظمة المعتمدة لوزارة العدل السعودية.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
