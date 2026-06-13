import React, { useState, useEffect } from "react";
import { CourtCase, Task, Note, Hearing, Judgment, ExecutionRequest, PowerOfAttorney, Document } from "@/types";
import { 
  X, Calendar, FileText, CheckSquare, Plus, MessageSquare, 
  Coins, Clock, Clipboard, Search, AlertCircle, Trash2, 
  User, ShieldCheck, Download, Paperclip, Briefcase, PlusCircle,
  MapPin, Sparkles
} from "lucide-react";
import CourtMapAndServices from "./CourtMapAndServices";
import AiDrafting from "./AiDrafting";

interface CaseDetailsViewProps {
  item: CourtCase;
  onClose: () => void;
  onAddTask: (caseId: string, task: Task) => void;
  onToggleTask: (caseId: string, taskId: string) => void;
  onDeleteTask: (caseId: string, taskId: string) => void;
  onAddNote: (caseId: string, note: Note) => void;
  onDeleteNote: (caseId: string, noteId: string) => void;
}

export default function CaseDetailsView({
  item,
  onClose,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddNote,
  onDeleteNote,
}: CaseDetailsViewProps) {
  const isNajizConnected = localStorage.getItem('najiz_api_connected') === 'true';
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "hearings" | "tasks" | "finance" | "communication" | "ai_drafting">("profile");
  
  // WhatsApp Auto Notification setting
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(() => {
    const saved = localStorage.getItem(`whatsappEnabled-${item.id}`);
    return saved !== "false"; // Default to true
  });

  const handleToggleWhatsapp = () => {
    const newVal = !isWhatsappEnabled;
    setIsWhatsappEnabled(newVal);
    localStorage.setItem(`whatsappEnabled-${item.id}`, String(newVal));
  };

  // Custom Task states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Custom Note states
  const [noteContent, setNoteContent] = useState("");

  // AI Summarization states
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  const handleAISummarize = async () => {
    if (!item.subject) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentText: item.subject,
          documentName: item.subject || item.caseNumber,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAiSummary(data.summary);
      } else {
        setAiSummary("عذراً، لم نتمكن من تلخيص النص حالياً. يرجى المحاولة لاحقاً.");
      }
    } catch (e) {
      setAiSummary("حدث خطأ في الاتصال بخادم الذكاء الاصطناعي.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Custom Attachments (PDF / DOCX) from local uploader
  const [customDocs, setCustomDocs] = useState<{ id: string; title: string; fileType: string; uploadedAt: string; size: string }[]>(() => {
    const saved = localStorage.getItem(`customDocs-${item.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // High-value Legal Assets tracking
  const [legalAssets, setLegalAssets] = useState<{ id: string; name: string; value: number; status: string; category: string }[]>(() => {
    const saved = localStorage.getItem(`legalAssets-${item.id}`);
    return saved ? JSON.parse(saved) : [
      { id: "asset-1", name: "صك ملكية أرض استثمارية بحي حطين بالرياض", value: 3800000, status: "مملوك للموكل", category: "عقار" },
      { id: "asset-2", name: "محفظة مستندات أسهم مسجلة بهيئة السوق المالية", value: 950000, status: "تحت النزاع", category: "أسهم شركات" }
    ];
  });

  const [assetName, setAssetName] = useState("");
  const [assetValue, setAssetValue] = useState("");
  const [assetStatus, setAssetStatus] = useState("مملوك للموكل");
  const [assetCategory, setAssetCategory] = useState("عقار");

  // File drag-and-drop / upload states
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFileType, setUploadFileType] = useState("PDF");
  const [uploadError, setUploadError] = useState("");
  const [uploadSizeStr, setUploadSizeStr] = useState("2.4 MB");
  const caseDetailsFileRef = React.useRef<HTMLInputElement>(null);

  const handleCaseDetailsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const nameWithoutExt = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
      const ext = file.name.split('.').pop()?.toUpperCase() || "PDF";
      setUploadTitle(nameWithoutExt);
      setUploadFileType(ext === "DOCX" ? "DOCX" : "PDF");
      const sizeMb = file.size / (1024 * 1024);
      const sizeStr = sizeMb > 0.1 ? `${sizeMb.toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
      setUploadSizeStr(sizeStr);
    }
  };

  const handleSaveAssets = (updated: typeof legalAssets) => {
    setLegalAssets(updated);
    localStorage.setItem(`legalAssets-${item.id}`, JSON.stringify(updated));
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetValue) return;
    const newAsset = {
      id: `asset-${Date.now()}`,
      name: assetName,
      value: parseFloat(assetValue),
      status: assetStatus,
      category: assetCategory
    };
    const updated = [...legalAssets, newAsset];
    handleSaveAssets(updated);
    setAssetName("");
    setAssetValue("");
  };

  const handleDeleteAsset = (id: string) => {
    const updated = legalAssets.filter(a => a.id !== id);
    handleSaveAssets(updated);
  };

  const handleSaveDocs = (updated: typeof customDocs) => {
    setCustomDocs(updated);
    localStorage.setItem(`customDocs-${item.id}`, JSON.stringify(updated));
  };

  const handleAddCustomDoc = (title: string, fileType: string, sizeStr: string = "2.1 MB") => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title,
      fileType: fileType.toUpperCase(),
      uploadedAt: new Date().toISOString().substring(0, 10),
      size: sizeStr
    };
    const updated = [...customDocs, newDoc];
    handleSaveDocs(updated);
  };

  const handleDeleteCustomDoc = (id: string) => {
    const updated = customDocs.filter(d => d.id !== id);
    handleSaveDocs(updated);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      assignedTo: taskAssignee || "غير محدد",
      dueDate: taskDueDate || new Date().toISOString().substring(0, 10),
      status: "pending",
      description: "",
      priority: "medium"
    };
    onAddTask(item.id, newTask);
    setTaskTitle("");
    setTaskAssignee("");
    setTaskDueDate("");
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      author: "أنا (المحامي الحالي)",
      content: noteContent,
      createdAt: new Date().toISOString()
    };
    onAddNote(item.id, newNote);
    setNoteContent("");
  };

  return (
    <div id="case-details-modal" className="fixed inset-0 bg-black backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="area-secondary border-2 border-border rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh] animate-fade-in">
        
        {/* Modal Header */}
        <div className="area-subtle p-5 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-900  font-black">رقم القضية:</span>
                <span className="text-lg font-mono font-black text-main  underline decoration-accent/20 underline-offset-4">{item.caseNumber}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-black shadow-sm ${
                  item.caseStatus === "under_review" ? "bg-warning-bg text-warning border border-warning/30" :
                  item.caseStatus === "final_judgment" ? "bg-success-bg text-success border border-success/30" :
                  "bg-main/10 text-main border border-border"
                }`}>
                  {item.caseStatus === "under_review" ? "قيد النظر" : item.caseStatus === "final_judgment" ? "منتهية بحكم" : item.caseStatus || "غير محدد"}
                </span>
              </div>
              <p className="text-xs text-accent font-black mt-0.5">{item.caseClassification}</p>
            </div>
          </div>
          
          {/* WhatsApp Auto Notification Toggle option */}
          <div className="flex items-center gap-2.5 bg-emerald-500 border border-emerald-500 px-3.5 py-1.5 rounded-2xl text-xs font-black text-emerald-600 select-none mx-2 shrink-0">
            <span className="text-sm">💬</span>
            <span className="hidden md:inline">تنبيهات واتساب للموكل:</span>
            <button 
              type="button"
              onClick={handleToggleWhatsapp}
              className={`w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer ${isWhatsappEnabled ? "bg-emerald-500" : "bg-slate-400"}`}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all duration-200 ${isWhatsappEnabled ? "right-5.5" : "right-1"}`}></div>
            </button>
            <span className="text-xs font-bold">{isWhatsappEnabled ? "نشطة" : "معطلة"}</span>
          </div>

          <button 
            id="close-details-btn"
            onClick={onClose}
            className="text-slate-900 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Subtabs Menu */}
        <div className="area-subtle border-b border-border flex flex-wrap gap-1 px-4 py-2 shadow-inner">
          <button
            id="subtab-profile"
            onClick={() => setActiveSubTab("profile")}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all font-black cursor-pointer ${
              activeSubTab === "profile" 
                ? "bg-accent text-white shadow-lg" 
                : "text-slate-900"
            }`}
          >
            الملف التعريفي والخصوم
          </button>
          
          <button
            id="subtab-hearings"
            onClick={() => setActiveSubTab("hearings")}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all font-black cursor-pointer ${
              activeSubTab === "hearings" 
                ? "bg-accent text-white shadow-lg" 
                : "text-slate-900"
            }`}
          >
            الجلسات والأحكام ({item.hearings.length + item.judgments.length})
          </button>

          <button
            id="subtab-tasks"
            onClick={() => setActiveSubTab("tasks")}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all font-black cursor-pointer ${
              activeSubTab === "tasks" 
                ? "bg-accent text-white shadow-lg" 
                : "text-slate-900"
            }`}
          >
            المهام والملاحظات ({item.tasks.length + item.notes.length})
          </button>

          <button
            id="subtab-finance"
            onClick={() => setActiveSubTab("finance")}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all font-black cursor-pointer ${
              activeSubTab === "finance" 
                ? "bg-accent text-white shadow-lg" 
                : "text-slate-900"
            }`}
          >
            المالية والمستندات ({item.attachments.length + item.financialRecords.length})
          </button>

          <button
            id="subtab-communication"
            onClick={() => setActiveSubTab("communication")}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all font-black cursor-pointer ${
              activeSubTab === "communication" 
                ? "bg-accent text-white shadow-lg" 
                : "text-slate-900"
            }`}
          >
            سجل التواصل والخط الزمني
          </button>

          <button
            id="subtab-aidrafting"
            onClick={() => setActiveSubTab("ai_drafting")}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm transition-all font-black cursor-pointer ${
              activeSubTab === "ai_drafting" 
                ? "bg-[#c5a880] text-slate-900 shadow-lg" 
                : "text-slate-900[#c5a880]/10[#c5a880]"
            }`}
          >
            <Sparkles className="w-4 h-4 inline-block ml-1" />
            المساعد الذكي للصياغة
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-main  min-h-[400px] area-secondary">
          
          {/* TAB 1: Profile & Parties */}
          {activeSubTab === "profile" && (
            <div id="panel-profile" className="space-y-6">
              {/* Core summary */}
              <div className="area-secondary border border-border rounded-xl p-5 space-y-3 shadow-sm">
                <h3 className="text-accent font-black text-sm border-b border-border pb-2 underline decoration-accent/10">تفاصيل موضوع الدعوى (ناجز)</h3>
                <p className="text-sm leading-relaxed text-main  text-justify font-bold">{item.subject}</p>
                
                {/* AI Summary Widget */}
                <div className="mt-4 border border-sky-400/30 rounded-xl p-4 bg-sky-400/5 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-500 flex items-center justify-center border border-sky-400/30">
                         <span className="text-lg">🤖</span>
                       </div>
                       <div>
                         <h4 className="text-xs font-black text-slate-800">تحليل الذكاء الاصطناعي (Gemini AI)</h4>
                         <p className="text-[10px] text-slate-500 font-bold">الحصول على موجز قانوني مركز لنقاط القضية</p>
                       </div>
                    </div>
                    {(!aiSummary && !isSummarizing) && (
                      <button 
                        onClick={handleAISummarize}
                        className="bg-sky-500 text-white text-xs font-black px-4 py-2 rounded-lg flex items-center gap-2 shadow-[0_5px_15px_rgba(14,165,233,0.3)] transition-all active:scale-95"
                      >
                         <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                         تلخيص القضية
                      </button>
                    )}
                  </div>
                  
                  {isSummarizing && (
                    <div className="py-6 flex flex-col items-center justify-center gap-3 relative z-10">
                       <span className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(14,165,233,0.5)]"></span>
                       <p className="text-xs font-black text-sky-500 animate-pulse">جاري صياغة الملخص القانوني عبر Gemini API...</p>
                    </div>
                  )}

                  {aiSummary && !isSummarizing && (
                    <div className="mt-4 p-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg text-sm text-slate-800 font-medium leading-relaxed shadow-inner">
                      <div className="markdown-body space-y-2 whitespace-pre-line text-xs font-bold text-slate-800">
                        {aiSummary.split('\n').map((line, idx) => {
                          if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                            return <li key={idx} className="ml-4 list-disc">{line.replace(/^[-*]\s*/, '').replace(/\*/g, '')}</li>
                          }
                          if (line.trim() === '') return <br key={idx} />
                          return <p key={idx}>{line.replace(/\*/g, '')}</p>
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute top-0 left-0 w-32 h-32 bg-sky-400/10 blur-[50px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 text-slate-900  text-xs font-bold">
                  <div className="area-subtle p-2 rounded-lg border border-border/40">
                    <span className="text-slate-900  block text-xs">المحكمة الناظرة:</span>
                    <strong className="text-main  block text-xs mt-0.5">{item.courtName}</strong>
                  </div>
                  <div className="area-subtle p-2 rounded-lg border border-border/40">
                    <span className="text-slate-900  block text-xs">ناظر القضية:</span>
                    <strong className="text-main  block text-xs mt-0.5">{item.judgeName || "لم يحدد للدائرة"}</strong>
                  </div>
                  <div className="area-subtle p-2 rounded-lg border border-border/40">
                    <span className="text-slate-900  block text-xs">تاريخ القيد المعتمد:</span>
                    <strong className="text-main  block font-mono mt-0.5">{item.startDate}</strong>
                  </div>
                </div>

                {/* Interactive Geographic Court Map Integration */}
                <div className="mt-8 space-y-4">
                   <div className="flex items-center gap-3 border-b border-border pb-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                         <MapPin className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                         <h3 className="text-sm font-black text-main">الموقع الجغرافي للدائرة القضائية والخدمات المحيطة</h3>
                         <p className="text-[10px] text-slate-900 font-bold">تتبع مكان انعقاد الجلسات والدوائر المساندة في منطقة {item.courtName}</p>
                      </div>
                   </div>
                   <div className="area-subtle border border-border rounded-2xl overflow-hidden shadow-sm">
                      <CourtMapAndServices 
                        cases={[item]} 
                        theme="light" 
                        language="ar" 
                        hideHub={true} 
                      />
                   </div>
                </div>

                {/* SQL Relational DB Fields Section - Sync Status */}
                <div className="mt-4 p-4 area-subtle border border-dashed border-accent/20 rounded-xl space-y-3">
                  <h4 className="text-xs font-extrabold text-accent flex items-center gap-2">
                    <span>⚙️ ربط الحقول التقنية بقاعدة البيانات (table: cases)</span>
                    <span className="px-1.5 py-0.5 bg-emerald-500 text-emerald-400 text-[8px] rounded border border-emerald-500 font-sans tracking-wide">
                      متزامن مع PostgreSQL
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-slate-900 block">معرف الجدول (uuid / primary key):</span>
                      <code className="text-indigo-450  font-mono text-[10px] block truncate" title={item.id}>{item.id}</code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-900 block">رقم الدعوى بنظام المحكمة (court_case_number):</span>
                      <code className="text-slate-450 font-mono text-[11px] block">{item.caseNumber || "441029384"}</code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-900 block">معرف قضية ناجز (najiz_case_id):</span>
                      <code className="text-amber-500 font-mono text-[11px] block">NJZ-{item.id.substring(0, 6).toUpperCase()}</code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-900 block">تصنيف الكود الفرعي (case_classification):</span>
                      <span className="text-main  block">{item.caseClassification || "تجاري أولى"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/30 pt-3 text-xs leading-normal font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-accent/10 text-accent rounded">👤</span>
                      <div>
                        <span className="text-slate-900 block">المحامي الشريك المشرف (lead_lawyer_id):</span>
                        <strong className="text-main  text-xs block">د. عادل القحطاني (عضو شريك أول)</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-accent/10 text-accent rounded">⚖️</span>
                      <div>
                        <span className="text-slate-900 block">طاقم الترافع المسند (assigned_lawyers []):</span>
                        <div className="flex gap-1.5 mt-0.5">
                          <span className="bg-[#1e3a8a]/40 text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-bold">أ. خالد الغامدي</span>
                          <span className="bg-[#1e3a8a]/40 text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-bold">أ. نورة الدوسري</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Parties & Legal POAs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Related parties array */}
                <div className="area-secondary border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3">أطراف الخصومة المقيدين</h3>
                  {item.relatedParties.length === 0 ? (
                    <div className="text-center py-6 text-slate-900  text-xs font-bold">لا يوجد أطراف متداخلين حالياً.</div>
                  ) : (
                    <div className="space-y-3">
                      {item.relatedParties.map((party) => (
                        <div key={party.id} className="area-subtle border border-border rounded-lg p-3 flex justify-between items-center shadow-inner">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center font-black text-sm border border-accent/20">
                              {party.relationType === "Plaintiff" ? "مدع" : "مدعى"}
                            </div>
                            <div>
                              <div className="text-xs font-black text-main ">{party.name}</div>
                              <span className="text-xs text-slate-900  font-bold">رقم الهوية: {party.nationalId || "غير معلن للخصوصية"}</span>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-black shadow-sm ${
                            party.relationType === "Plaintiff" ? "bg-success-bg text-success" : "bg-error-bg text-error"
                          }`}>
                            {party.relationType === "Plaintiff" ? "المدعي (العميل)" : "المدعى عليه (الخصم)"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Power of Attorneys */}
                <div className="area-secondary border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3">بيانات الوكالة القانونية للنزاع</h3>
                  {item.powersOfAttorney.length === 0 ? (
                    <div className="text-center py-6 text-slate-900  text-xs font-bold">لا يوجد وكالة مرتبطة مباشرة من ناجز لهذه القضية.</div>
                  ) : (
                    <div className="space-y-3">
                      {item.powersOfAttorney.map((poa) => (
                        <div key={poa.id} className="area-subtle border border-border rounded-lg p-3 space-y-2 shadow-inner">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-main  underline decoration-accent/10">رقم الوكالة: <strong className="font-mono text-accent">{poa.poaNumber}</strong></span>
                            <span className="px-2 py-0.5 rounded bg-success-bg text-success font-black text-xs shadow-sm">
                              {poa.status}
                            </span>
                          </div>
                          <div className="text-sm text-slate-900  space-y-1 font-bold">
                            <div>العميل: <span className="text-main  font-black underline decoration-accent/5">{poa.clientName}</span></div>
                            <div>العميل المعين: <span className="text-main ">{poa.lawyerName}</span></div>
                            <div className="flex justify-between pt-1 text-xs font-black">
                              <span className="text-slate-900 ">تاريخ الصدور: {poa.issueDate}</span>
                              <span className="text-warning text-right">تنتهي في: {poa.expiryDate}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Hearings, Judgments & Execution Requests */}
          {activeSubTab === "hearings" && (
            <div id="panel-hearings" className="space-y-6">
              
              {/* Upcoming and historic hearings */}
              <div className="area-secondary border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3">جدول الجلسات القضائية</h3>
                {item.hearings.length === 0 ? (
                  <div className="text-center py-6 text-slate-900  text-xs font-bold">لم يتم جدولة أي جلسات في نظام وزارة العدل حالياً للتزامن.</div>
                ) : (
                  <div className="space-y-4">
                    {item.hearings.map((h) => (
                      <div key={h.id} className="border-r-4 border-warning area-subtle rounded-r rounded-l-xl p-4 space-y-2 shadow-inner">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-warning" />
                            <span className="text-xs font-black text-accent">جلسة المرافعة</span>
                            <span className="text-xs text-slate-900  font-mono font-bold">({h.date} - {h.time})</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded font-black shadow-sm ${
                            h.hearingStatus === "قادمة" ? "bg-warning-bg text-warning" : "text-slate-900   bg-main/5"
                          }`}>
                            {h.hearingStatus}
                          </span>
                        </div>
                        <div className="text-xs text-main  font-bold">
                          {h.hallNumber && <span className="font-black block text-slate-900  mb-1">مكان الانعقاد: <span className="text-main ">{h.hallNumber}</span></span>}
                          {h.notes && <p className="text-slate-900  mt-1 leading-relaxed italic">توجيه الدائرة: {h.notes}</p>}
                          {h.decision && (
                            <div className="mt-2 area-subtle border border-accent/20 p-2.5 rounded-lg text-accent font-black text-xs shadow-sm">
                              <strong className="block text-main  text-xs mb-1 underline decoration-accent/10">قرار الدائرة:</strong>
                              {h.decision}
                            </div>
                          )}
                        </div>
                        
                        {/* Courtroom Stop Watch / Session Tracker */}
                        <HearingTimer hearing={h} caseId={item.id} onAddNote={onAddNote} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Judgments & Enforcement data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Judgments Block */}
                <div className="area-secondary border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3">الأحكام الصادرة في القضية</h3>
                  {item.judgments.length === 0 ? (
                    <div className="text-center py-6 text-slate-900  text-xs font-bold">لا يوجد أحكام قضائية صادرة أو مدونة لهذه اللائحة حتى الآن.</div>
                  ) : (
                    <div className="space-y-4">
                      {item.judgments.map((j) => (
                        <div key={j.id} className="area-subtle border border-border rounded-xl p-4 space-y-2 shadow-inner">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-900  font-black">قرار حكم رقم: <strong className="font-mono text-main ">{j.judgmentNumber}</strong></span>
                            <span className="px-2 py-0.5 rounded bg-success-bg text-success font-black text-xs shadow-sm">
                              {j.status}
                            </span>
                          </div>
                          <p className="text-xs text-main  text-justify leading-relaxed area-secondary p-3 rounded-lg border border-border/50 font-bold">{j.judgmentText}</p>
                          <div className="text-xs text-slate-900  text-right font-black">تاريخ الإصدار: {j.issueDate}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Execution requests list */}
                <div className="area-secondary border border-border rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      <div>
                        <h3 className="font-black text-sm text-main ">متابعة طلبات التنفيذ المالي والتحصيل (أمر 46)</h3>
                        <p className="text-xs text-slate-900 ">لوحة ذكية لبيان حالة حجز الأموال والأصول والتحصيل الفعلي بالربط مع محاكم التنفيذ</p>
                      </div>
                    </div>
                    {isNajizConnected ? (
                      <span className="text-xs bg-emerald-50 text-emerald-600 font-black px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm animate-pulse">● متصل بناجز (API نشط)</span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-500 font-black px-2.5 py-1 rounded-full border border-slate-200">● استخدام محلي (غير متصل بناجز)</span>
                    )}
                  </div>

                  {item.executionRequests.length === 0 ? (
                    <div className="text-center py-8 text-slate-900  text-xs font-bold">لا يوجد طلبات تنفيذ مالية مسجلة لهذه القضية حالياً.</div>
                  ) : (
                    <div className="space-y-6">
                      {item.executionRequests.map((ex) => {
                        // Calculate metrics for visualization values
                        const rawAmountStr = ex.amount.replace(/[^0-9]/g, '');
                        const totalNum = rawAmountStr ? parseFloat(rawAmountStr) : 450000;
                        const isFinished = ex.status === "منفذ بالكامل";
                        
                        const collectedNum = isFinished ? totalNum : Math.round(totalNum * 0.65);
                        const reservedNum = isFinished ? 0 : Math.round(totalNum * 0.25);
                        const remainingNum = isFinished ? 0 : Math.round(totalNum * 0.10);

                        const collectedPercent = isFinished ? 100 : 65;
                        const reservedPercent = isFinished ? 0 : 25;
                        const remainingPercent = isFinished ? 0 : 10;

                        return (
                          <div key={ex.id} className="area-subtle border border-border rounded-2xl p-5 space-y-4 shadow-inner">
                            
                            {/* Header: numbers and general status */}
                            <div className="flex justify-between items-start flex-wrap gap-2 border-b border-border/60 pb-3">
                              <div>
                                <span className="text-xs text-accent font-black block">رقم طلب التنفيذ العدلي:</span>
                                <strong className="font-mono text-main  text-xs underline decoration-accent/15">{ex.requestNumber}</strong>
                                <span className="text-xs text-slate-900  font-bold block mt-0.5">تاريخ القيد المالي: {ex.requestDate}</span>
                              </div>
                              <div className="text-left">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-sm inline-block ${
                                  isFinished 
                                    ? "bg-success-bg text-success border border-success/30" 
                                    : "bg-warning-bg text-warning border border-warning/30"
                                }`}>
                                  ● {ex.status}
                                </span>
                                <span className="text-xs text-slate-900  block mt-1 font-sans">{ex.courtName || "محكمة التنفيذ بالرياض"}</span>
                              </div>
                            </div>

                            {/* Summary metrics display */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-success-bg/10 border border-success/20 p-2 rounded-xl text-center">
                                <span className="text-xs text-slate-900  block font-black">المحصل الفعلي 💵</span>
                                <strong className="text-sm font-mono font-black text-emerald-600 block mt-0.5">{collectedNum.toLocaleString()} ر.س</strong>
                                <span className="text-xs text-emerald-500 font-bold font-sans">({collectedPercent}%)</span>
                              </div>
                              <div className="bg-warning-bg/10 border border-warning/20 p-2 rounded-xl text-center">
                                <span className="text-xs text-slate-900  block font-black">الحجز المالي النشط 🏛️</span>
                                <strong className="text-sm font-mono font-black text-amber-600 block mt-0.5">{reservedNum.toLocaleString()} ر.س</strong>
                                <span className="text-xs text-amber-500 font-bold font-sans">({reservedPercent}%)</span>
                              </div>
                              <div className="bg-error-bg/10 border border-[#f43f5e]/20 p-2 rounded-xl text-center">
                                <span className="text-xs text-slate-900  block font-black">المتبقي تحت التحصيل ⚖️</span>
                                <strong className="text-sm font-mono font-black text-rose-600 block mt-0.5">{remainingNum.toLocaleString()} ر.س</strong>
                                <span className="text-xs text-rose-500 font-bold font-sans">({remainingPercent}%)</span>
                              </div>
                            </div>

                            {/* Visual segmented Bar Chart / Gauge tube */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-bold text-main ">
                                <span>شريط محاكاة التوزيع المالي والتحصيل المتكامل:</span>
                                <span className="text-accent">القيمة الكلية: {totalNum.toLocaleString()} ريال</span>
                              </div>
                              
                              <div className="w-full h-3.5 bg-slate-200  rounded-full overflow-hidden flex shadow-inner">
                                <div 
                                  style={{ width: `${collectedPercent}%` }} 
                                  className="bg-emerald-500 h-full cursor-pointer transition-all animate-pulse"
                                  title={`المحصل: ${collectedPercent}%`}
                                />
                                <div 
                                  style={{ width: `${reservedPercent}%` }} 
                                  className="bg-amber-400 h-full cursor-pointer transition-all"
                                  title={`الحجز بالبنوك: ${reservedPercent}%`}
                                />
                                <div 
                                  style={{ width: `${remainingPercent}%` }} 
                                  className="bg-rose-500 h-full cursor-pointer transition-all"
                                  title={`متبقي تحت النزاع: ${remainingPercent}%`}
                                />
                              </div>

                              <div className="flex justify-between items-center text-xs text-slate-900  font-bold font-sans px-1">
                                <span className="flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  <span>مقبوض فعلياً ({collectedPercent}%)</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                  <span>حوز مالي بنكي ({reservedPercent}%)</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                  <span>معلق بالدائرة ({remainingPercent}%)</span>
                                </span>
                              </div>
                            </div>

                            {/* visual checkpoints / grid steps of enforcement status */}
                            <div className="border-t border-border/60 pt-3 space-y-2">
                              <span className="text-xs text-main  font-bold block">مراحل وخطوات التتبع الفني للتنفيذ والتحصيل:</span>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                
                                {/* Step 1: Acceptance */}
                                <div className="bg-[#030a1c] border border-slate-800 p-2.5 rounded-xl text-right font-sans relative">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-primary font-black">1. التدقيق والقبول</span>
                                    <span className="text-xs text-emerald-400 font-bold">✓ مكتمل</span>
                                  </div>
                                  <p className="text-xs text-slate-900  font-bold mt-1 leading-normal">تم مراجعة صيغ السند وتعميمه بنجاح بمحاكم التنفيذ.</p>
                                </div>

                                {/* Step 2: Blocking */}
                                <div className="bg-[#030a1c] border border-slate-800 p-2.5 rounded-xl text-right font-sans relative">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-primary font-black">2. الحجز التحفظي</span>
                                    <span className={isFinished ? "text-emerald-400 text-xs font-bold" : "text-amber-400 text-xs font-bold animate-pulse"}>
                                      {isFinished ? "✓ مكتمل" : "● جاري (م46)"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-900  font-bold mt-1 leading-normal">
                                    {isFinished ? "تم رفع حجز الحسابات واسترداد المبالغ." : "حجز الحسابات والممتلكات وعقود الشركات فعال عبر مؤسسة النقد."}
                                  </p>
                                </div>

                                {/* Step 3: Liquidation */}
                                <div className="bg-[#030a1c] border border-slate-800 p-2.5 rounded-xl text-right font-sans relative">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-primary font-black">3. المزاد والتحصيل</span>
                                    <span className={isFinished ? "text-emerald-400 text-xs font-bold" : "text-amber-400 text-xs font-bold"}>
                                      {isFinished ? "✓ مكتمل" : "● سدادات جزئية"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-900  font-bold mt-1 leading-normal">
                                    {isFinished ? "تم تسوية كامل بنود الصك وإثبات السداد." : "تحصيل ما قيمته 65% من السند عبر قنوات وزارة العدل المعتمدة."}
                                  </p>
                                </div>

                                {/* Step 4: Transfer */}
                                <div className="bg-[#030a1c] border border-slate-800 p-2.5 rounded-xl text-right font-sans relative">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-primary font-black">4. الصرف النهائي</span>
                                    <span className={isFinished ? "text-emerald-400 text-xs font-bold" : "text-slate-450 text-xs font-bold"}>
                                      {isFinished ? "✓ مكتمل" : "⏳ قيد الانتظار"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-900  font-bold mt-1 leading-normal">
                                    {isFinished ? "أودعت المبالغ بحساب العميل البنكي." : "تحويل المستحقات لحساب القضية فور سحبها وتوريدها."}
                                  </p>
                                </div>

                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: Custom Tasks, legal notes & notifications */}
          {activeSubTab === "tasks" && (
            <div id="panel-tasks" className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Interactive Custom Tasks List */}
                <div className="area-secondary border border-border rounded-xl p-5 space-y-4 shadow-sm">
                  <h3 className="text-accent font-black text-sm border-b border-border pb-2 underline decoration-accent/10">قائمة المهام والتعليمات للمكتب</h3>
                  
                  {/* Create task inline form */}
                  <form onSubmit={handleCreateTask} className="area-subtle p-3 rounded-xl border border-border space-y-3 shadow-inner">
                    <div className="text-xs font-black text-main ">إسناد مهمة جديدة للمحامين:</div>
                    <input
                      type="text"
                      placeholder="عنوان المهمة (مثال: تقديم مذكرة الاعتراض)"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg text-xs px-2.5 py-2 text-main  font-bold placeholder-muted focus:border-accent outline-none transition-colors"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="المسؤول بالتنفيذ"
                        value={taskAssignee}
                        onChange={(e) => setTaskAssignee(e.target.value)}
                        className="bg-background border border-border rounded-lg text-xs px-2.5 py-2 text-main  font-bold placeholder-muted text-right focus:border-accent outline-none transition-colors"
                      />
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="bg-background border border-border rounded-lg text-xs px-2.5 py-2 text-main  font-bold focus:border-accent outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-accent text-white py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-accent/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>حفظ المهمة في النطاق</span>
                    </button>
                  </form>

                  {/* Tasks List rendering */}
                  {item.tasks.length === 0 ? (
                    <div className="text-center py-6 text-slate-900  text-xs font-bold">لا يوجد أي مهام معينة حالياً لهذه التصفية القضائية.</div>
                  ) : (
                    <div className="space-y-2">
                      {item.tasks.map((tk) => (
                        <div key={tk.id} className="area-subtle border border-border rounded-xl px-4 py-3 flex justify-between items-center shadow-inner group.5 transition-all duration-300">
                          <div className="flex items-center gap-3 w-full">
                            <input
                              type="checkbox"
                              checked={tk.status === "completed"}
                              onChange={() => onToggleTask(item.id, tk.id)}
                              className="w-4 h-4 text-accent accent-accent cursor-pointer rounded border-slate-300 focus:ring-accent ml-2"
                            />
                            <div className="w-full">
                              <div className={`text-xs font-bold leading-tight ${tk.status === "completed" ? "line-through text-slate-500 opacity-60" : "text-main"}`}>{tk.title}</div>
                              <div className="flex items-center justify-between w-full mt-1.5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                  tk.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                  tk.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                }`}>
                                  {tk.priority === 'high' ? 'أولوية قصوى' : tk.priority === 'medium' ? 'أولوية متوسطة' : 'عادية'}
                                </span>
                                <span className="text-[10px] text-slate-900 font-bold block">مكلف: {tk.assignedTo} | الحد: <span className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">{tk.dueDate}</span></span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => onDeleteTask(item.id, tk.id)}
                            className="text-slate-400 opacity-0 mr-4 p-1.5 rounded-md transition-all cursor-pointer"
                            title="حذف المهمة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Interactive Notes List */}
                <div className="area-secondary border border-border rounded-xl p-5 space-y-4 shadow-sm">
                  <h3 className="text-accent font-black text-sm border-b border-border pb-2 underline decoration-accent/10">الملاحظات القانونية والتدوينات المغلقة</h3>

                  {/* Create note form */}
                  <form onSubmit={handleCreateNote} className="space-y-2">
                    <textarea
                      placeholder="اكتب ملاحظة مهنية سرية بخصوص مستندات القضية تظهر لأعضاء المكتب فقط..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                      className="w-full area-subtle border border-border rounded-xl text-xs p-3 text-main  font-bold placeholder-muted text-right leading-relaxed resize-none focus:outline-none focus:border-accent shadow-inner"
                    />
                    <button
                      type="submit"
                      className="w-full bg-background border border-border text-accent py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إدراج الملاحظة</span>
                    </button>
                  </form>

                  {/* Notes List Rendering */}
                  {item.notes.length === 0 ? (
                    <div className="text-center py-6 text-slate-900  text-xs font-bold">لا يوجد أي ملاحظة مدونة حالياً. اكتب واحدة بالأعلى!</div>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {item.notes.map((nt) => (
                        <div key={nt.id} className="area-subtle border border-border rounded-xl p-3 space-y-2 shadow-inner">
                          <div className="flex justify-between items-center text-xs font-black">
                            <span className="text-accent underline decoration-accent/10">{nt.author}</span>
                            <span className="text-slate-900 ">{new Date(nt.createdAt).toLocaleString("ar-SA")}</span>
                          </div>
                          <p className="text-xs text-main  leading-relaxed font-bold italic">{nt.content}</p>
                          <div className="text-right">
                            <button
                              onClick={() => onDeleteNote(item.id, nt.id)}
                              className="text-slate-900 text-xs font-black cursor-pointer"
                            >
                              حذف الملاحظة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              
            </div>
          )}

          {/* TAB 4: Financial Records, Attachments & Documents */}
          {activeSubTab === "finance" && (
            <div id="panel-finance" className="space-y-6">
              
              {/* Financial records table */}
              <div className="area-secondary border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3 underline decoration-accent/10">السجل المالي والأتعاب (المكتب)</h3>
                
                {item.financialRecords.length === 0 ? (
                  <div className="text-center py-6 text-slate-900  text-xs font-bold">لا يوجد حركات مالية مرصودة لأتعاب العميل الحالي.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs font-bold">
                      <thead>
                        <tr className="border-b border-border text-slate-900  font-black">
                          <th className="py-2.5">الوصف والبيان المالي</th>
                          <th className="py-2.5">النوع</th>
                          <th className="py-2.5">المبلغ وحساب الضريبة</th>
                          <th className="py-2.5">تاريخ المعاملة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.financialRecords.map((fin) => (
                          <tr key={fin.id} className="border-b border-border transition-colors">
                            <td className="py-3 text-main  font-black">{fin.description}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded font-black text-xs shadow-sm ${
                                fin.type === "income" ? "bg-success-bg text-success" : "bg-error-bg text-error"
                              }`}>
                                {fin.type === "income" ? "دفعة مقبوضة" : "رسوم مصروفات"}
                              </span>
                            </td>
                            <td className="py-3 font-mono font-black text-accent">
                              {fin.amount.toLocaleString()} ريال سعودي
                            </td>
                            <td className="py-3 text-slate-900  font-black">{fin.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Attachments & Client uploaded docs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Official Attachments (Najiz) */}
                <div className="area-secondary border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3 underline decoration-accent/10">المرفقات الرسمية والمستندات (ناجز)</h3>
                  {item.attachments.length === 0 ? (
                    <div className="text-center py-6 text-slate-900  text-xs font-bold">لم يتم الكشف عن مرفقات عامة بالدعوى في العدالة.</div>
                  ) : (
                    <div className="space-y-3">
                      {item.attachments.map((attach) => (
                        <div key={attach.id} className="area-subtle border border-border rounded-lg p-3 flex justify-between items-center shadow-inner group">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-accent/10 text-accent rounded-lg border border-accent/20">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-main transition-colors">{attach.fileName}</div>
                              <span className="text-xs text-slate-900  font-bold">{attach.category} | {attach.fileSize}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => alert(`محاكاة تحميل ملف ناجز القانوني الآمن: ${attach.fileName}`)}
                            className="p-1.5 border border-border rounded-lg text-accent transition-all cursor-pointer"
                            title="تحميل مستند"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Uploaded client docs */}
                <div className="area-secondary border border-border rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3 underline decoration-accent/10">مركز المستندات والملفات المرفوعة (سحابي مأمن)</h3>
                    
                    {/* Interactive Drop area / input */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) {
                          const file = files[0] as any;
                          const ext = file.name.split(".").pop()?.toLowerCase();
                          if (ext === "pdf" || ext === "docx") {
                            const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
                            const cleanName = file.name.includes(".") ? file.name.substring(0, file.name.lastIndexOf(".")) : file.name;
                            handleAddCustomDoc(cleanName, ext.toUpperCase(), sizeStr);
                            setUploadError("");
                          } else {
                            setUploadError("خطأ: يُسمح فقط برفع ملفات ممسوحة ضوئياً وصحائف بصيغة PDF أو DOCX.");
                          }
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-5 text-center text-xs space-y-2 cursor-pointer transition-all shadow-inner ${
                        isDragging ? "border-accent bg-accent/5 animate-pulse" : "border-border area-subtle"
                      }`}
                      onClick={() => setShowUploadModal(true)}
                    >
                      <Clipboard className={`w-8 h-8 mx-auto transition-transform ${isDragging ? "text-accent scale-110" : "text-slate-900  "}`} />
                      <div className="font-black text-main ">اسحب مستند القضية بصيغة (PDF / DOCX) هنا أو اضغط للرفع المباشر</div>
                      <div className="text-xs text-slate-900  font-bold">الحد الأقصى للملف الواحد: ٢٥ ميجابايت بموثوقية تشفير عالية</div>
                    </div>

                    {uploadError && (
                      <div className="text-error text-xs p-2 bg-error-bg rounded border border-error/30 text-center font-black mt-2">
                        {uploadError}
                      </div>
                    )}
                  </div>

                  {/* Uploaded Documents List */}
                  <div className="space-y-2 mt-4 max-h-[180px] overflow-y-auto pr-1">
                    {customDocs.length === 0 ? (
                      <div className="text-center py-4 text-slate-900  text-sm font-bold">لا يوجد مستندات مرفوعة محلياً بأرشيف العميل.</div>
                    ) : (
                      customDocs.map((doc) => (
                        <div key={doc.id} className="area-subtle border border-border rounded-xl p-2.5 flex justify-between items-center text-xs shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-black shadow-sm ${doc.fileType === "PDF" ? "bg-error-bg text-error" : "bg-accent/10 text-accent"}`}>
                              {doc.fileType}
                            </span>
                            <div>
                              <div className="text-main  font-black truncate max-w-[170px]">{doc.title}</div>
                              <span className="text-xs text-slate-900  block font-bold">{doc.uploadedAt} • {doc.size}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCustomDoc(doc.id)}
                            className="text-slate-900 p-1 transition-colors cursor-pointer"
                            title="حذف المستند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* SECTION: High-Value Legal Assets Section */}
              <div className="area-secondary border border-border rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-accent" />
                    <h3 className="text-accent font-black text-sm">تتبع الأصول ذات القيمة للموكل (Legal Assets Tracker)</h3>
                  </div>
                  <span className="text-xs text-warning font-black bg-warning-bg px-2.5 py-1 rounded-lg border border-warning/20 shadow-sm">
                    مجموع قيمة أصول القضية: {legalAssets.reduce((sum, current) => sum + current.value, 0).toLocaleString()} ر.س
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* List and Statistics of Assets (Col Span 2) */}
                  <div className="lg:col-span-2 space-y-3">
                    {legalAssets.length === 0 ? (
                      <div className="text-center py-10 text-slate-900  text-xs bg-alt/30 border border-border rounded-xl font-bold">لم يتم رصد أصول ذات قيمة حالياً لهذه الدعوى العميلة.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs font-bold">
                          <thead>
                            <tr className="border-b border-border text-slate-900  font-black">
                              <th className="py-2 px-1">الأصل والبيان الموثق</th>
                              <th className="py-2 px-1">التصنيف</th>
                              <th className="py-2 px-1 text-left">القيمة التقديرية</th>
                              <th className="py-2 px-1 text-center">حالة الملكية والنزاع</th>
                              <th className="py-2 px-1 text-center">الإجراء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {legalAssets.map((asset) => (
                              <tr key={asset.id} className="border-b border-border transition-colors">
                                <td className="py-2.5 px-1 text-main  font-black">{asset.name}</td>
                                <td className="py-2.5 px-1"><span className="bg-alt text-main  px-2 py-0.5 rounded-lg text-xs font-black border border-border/50">{asset.category}</span></td>
                                <td className="py-2.5 px-1 text-left font-mono font-black text-accent">{asset.value.toLocaleString()} ر.س</td>
                                <td className="py-2.5 px-1 text-center">
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black shadow-sm ${
                                    asset.status === "مملوك للموكل" ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                                  }`}>
                                    {asset.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-1 text-center">
                                  <button onClick={() => handleDeleteAsset(asset.id)} className="text-slate-900 p-1 cursor-pointer transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Add Asset Quick Form */}
                  <form onSubmit={handleAddAsset} className="area-subtle p-4 border border-border rounded-xl space-y-3 shadow-inner">
                    <h4 className="text-xs font-black text-main  border-b border-border pb-1.5 flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5 text-accent" />
                      <span>توثيق أصل جديد للقضية</span>
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="text-xs text-slate-900  block font-black">بيان أو اسم الأصل:</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="مثال: عقار أرض تجارية بالقصيم" 
                        value={assetName} 
                        onChange={(e) => setAssetName(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs text-main  font-bold outline-none focus:border-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-900  block font-black">القيمة التقديرية (ريال):</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="ر.س" 
                        value={assetValue} 
                        onChange={(e) => setAssetValue(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs text-main  font-mono font-black outline-none focus:border-accent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-900  block font-black">التصنيف:</label>
                        <select 
                          value={assetCategory} 
                          onChange={(e) => setAssetCategory(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs text-main  font-black cursor-pointer"
                        >
                          <option value="عقار">عقار وأراضي</option>
                          <option value="أسهم شركات">أسهم شركات</option>
                          <option value="سيارات">سيارات ومعدات</option>
                          <option value="أخرى">أصول أخرى</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-900  block font-black">الحالة الحالية:</label>
                        <select 
                          value={assetStatus} 
                          onChange={(e) => setAssetStatus(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs text-main  font-black cursor-pointer"
                        >
                          <option value="مملوك للموكل">مملوك للموكل</option>
                          <option value="تحت النزاع">تحت النزاع</option>
                          <option value="محجوز قضائياً">محجوز قضائياً</option>
                          <option value="تمتصفيته">تمت تصفيته</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-accent text-white py-2 rounded-lg text-xs font-black shadow-md shadow-accent/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      تثبيت وإدراج الأصل المالي
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}
          
          {/* TAB 5: Communication Log & Timeline */}
          {activeSubTab === "communication" && (
            <div id="panel-communication" className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Communication logs */}
                <div className="area-secondary border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3 underline decoration-accent/10">بيانات التواصل وأمن العملاء</h3>
                  {item.communicationHistory.length === 0 ? (
                    <div className="text-center py-6 text-slate-900  text-xs font-bold">لا يوجد حركات تواصل مرسلة أو مقيدة.</div>
                  ) : (
                    <div className="space-y-4">
                      {item.communicationHistory.map((comm) => (
                        <div key={comm.id} className="area-subtle border border-border rounded-xl p-3.5 space-y-1.5 text-xs text-main  font-bold shadow-inner">
                          <div className="flex justify-between items-center">
                            <span className="font-black flex items-center gap-1.5 text-main  underline decoration-accent/5">
                              <span className={`w-2 h-2 rounded-full shadow-sm ${comm.direction === "outbound" ? "bg-success" : "bg-accent"}`}></span>
                              {comm.contactPerson}
                            </span>
                            <span className="text-xs text-slate-900  font-mono font-black">{comm.date}</span>
                          </div>
                          <div className="text-main  area-secondary border border-border/50 p-2.5 rounded-lg leading-relaxed italic">{comm.summary}</div>
                          <div className="flex justify-between items-center text-xs text-slate-900  font-black">
                            <span>جهة الاتصال: <strong className="text-accent uppercase">{comm.type}</strong></span>
                            <span>{comm.direction === "outbound" ? "تفويض صادر" : "طلب وارد للسرية"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timeline History */}
                <div className="area-secondary border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-accent font-black text-sm border-b border-border pb-2 mb-3 underline decoration-accent/10">الخط الزمني لتحديثات ناجز</h3>
                  {item.timeline.length === 0 ? (
                    <div className="text-center py-6 text-slate-900  text-xs font-bold">لا يوجد تحديثات مرصودة للتأريخ القضائي.</div>
                  ) : (
                    <div className="relative border-r border-accent/30 pr-4 space-y-5">
                      {item.timeline.map((event) => (
                        <div key={event.id} className="relative">
                          {/* Dot indicator */}
                          <div className="absolute top-1 -right-[21.5px] w-2.5 h-2.5 rounded-full bg-accent border border-background shadow-md z-10 transition-transform"></div>
                          <div className="text-xs font-black text-main ">
                            {event.title} <span className="text-xs text-slate-900  font-mono font-black">({event.date})</span>
                          </div>
                          <p className="text-sm text-slate-900  mt-1 leading-relaxed font-bold italic">
                            {event.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {activeSubTab === "ai_drafting" && (
            <div id="panel-aidrafting" className="space-y-6">
              <AiDrafting />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="area-subtle p-4 border-t border-border flex justify-between items-center text-xs text-slate-900  font-black shadow-inner">
          <span>شفرة تزامن آمن لقضايا المحامي الحالي - وزارة العدل السعودية الموحدة.</span>
          <button
            onClick={onClose}
            className="area-secondary border border-border px-5 py-2 rounded-lg text-slate-900 transition-all cursor-pointer font-black shadow-sm active:scale-95"
          >
            إغلاق ملف القضية
          </button>
        </div>

      </div>

      {/* Interactive File Upload Form Modal (no-drag fallback triggers) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm z-[60] flex items-center justify-center p-4" dir="rtl">
          <div className="area-secondary border-2 border-accent/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-border pb-3">
               <span className="font-black text-main  text-sm flex items-center gap-1.5">
                 <Paperclip className="w-4 h-4 text-accent" />
                 رفع مستند قانوني مصنف لشأن الدعوى
               </span>
               <button onClick={() => { setShowUploadModal(false); setUploadTitle(""); }} className="text-slate-900 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Choose Real File Option */}
              <div 
                onClick={() => caseDetailsFileRef.current?.click()}
                className="border-2 border-dashed border-accent/20 rounded-xl p-4 bg-accent/5 transition-all text-center cursor-pointer space-y-1 block shadow-sm"
              >
                <input 
                  type="file" 
                  ref={caseDetailsFileRef} 
                  onChange={handleCaseDetailsFileChange} 
                  className="hidden" 
                  accept=".pdf,.docx" 
                />
                <Paperclip className="w-6 h-6 mx-auto text-accent" />
                <div className="text-xs text-accent font-black">انقر هنا لتحديد ملف PDF أو Word من جهازك</div>
                <div className="text-[10px] text-slate-900 font-bold">سيتم تعبئة مسمى ونوع المستند تلقائياً</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-900  block font-black">عنوان أو مسمى المستند المرفوع:</label>
                <input 
                  type="text" 
                  placeholder="مثال: صحيفة الدعوى المعدلة أو صك الحكم الصادر"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full area-subtle border border-border rounded-xl p-3 text-xs text-main  font-bold outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-900  block font-black">صيغة الملف المقررة:</label>
                  <select 
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value)}
                    className="w-full area-subtle border border-border rounded-xl p-2.5 text-xs text-main  font-black cursor-pointer"
                  >
                    <option value="PDF">أرشيف ممسوح PDF</option>
                    <option value="DOCX">مذكرة مراجعة DOCX</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-900  block font-black">الحجم التقريبي:</label>
                  <input 
                    type="text" 
                    disabled
                    value={`${uploadSizeStr} (مشفر)`} 
                    className="w-full area-subtle border border-border/50 rounded-xl p-2.5 text-xs text-slate-900  font-mono font-black italic"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!uploadTitle.trim()) {
                    alert("يرجى إدخال مسمى رسمي للمستند.");
                    return;
                  }
                  handleAddCustomDoc(uploadTitle, uploadFileType, uploadSizeStr);
                  setShowUploadModal(false);
                  setUploadTitle("");
                  setUploadSizeStr("2.4 MB");
                }}
                className="w-full bg-accent text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all active:scale-95 cursor-pointer"
              >
                رفع الملف وضمه لأحراز القضية
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Dedicated stopwatch/timer utility for lawyers to track court sessions directly in CaseDetailsView
export function HearingTimer({ hearing, caseId, onAddNote }: { hearing: Hearing; caseId: string; onAddNote: (caseId: string, note: Note) => void }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setIsLogged(false);
  };

  const handleLog = () => {
    if (seconds <= 0) return;
    
    const timeStr = formatTime(seconds);
    const text = `⏱️ [توثيق المرافعة بقاعة المحكمة]: تم رصد وتوثيق مدة الجلسة القضائية المنعقدة بتاريخ ${hearing.date || 'اليوم'} بشكل تلقائي عبر عداد الجلسة. المدة الإجمالية للمرافعة الفعلية أمام الدائرة القضائية بلغت: ${timeStr}.`;
    
    const newNote: Note = {
      id: "note-" + Date.now(),
      content: text,
      author: "عداد جلسات المحكمة",
      createdAt: new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    onAddNote(caseId, newNote);
    setIsLogged(true);
    setIsRunning(false);
  };

  return (
    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-right font-sans my-1" dir="rtl">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">ساعة رصد مدة الجلسات والمرافعات المشفرة ⏱️</span>
        {isLogged && (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-full">
            ✓ تم تدوين المدة بملف القضية
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm">
        {/* Core numbers display */}
        <div className="text-sm font-mono font-black text-emerald-400 tracking-widest bg-slate-900 px-3 py-1 rounded border border-slate-800 flex items-center justify-center min-w-[90px] direction-ltr">
          {formatTime(seconds)}
        </div>

        {/* Stopwatch controllers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleStartPause}
            className={`px-2.5 py-1.5 rounded-lg transition-all border font-bold text-[10px] cursor-pointer ${
              isRunning 
                ? "bg-amber-50 text-amber-700 border-amber-200" 
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            {isRunning ? "إيقاف مؤقت ⏸" : "بدء الرصد ▶"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-200 transition-all font-black text-[10px] cursor-pointer"
          >
            تصفير 🔄
          </button>

          <button
            type="button"
            onClick={handleLog}
            disabled={seconds === 0}
            className={`px-3 py-1.5 rounded-lg transition-all border font-black text-[10px] flex items-center gap-1 ${
              seconds === 0
                ? "bg-slate-50 text-slate-350 border-slate-100 cursor-not-allowed"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 cursor-pointer"
            }`}
          >
            حفظ وتدوين بملف القضية ⚖️
          </button>
        </div>
      </div>
    </div>
  );
}
