import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Archive, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Shield, 
  Tag, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  UploadCloud,
  RefreshCw,
  X,
  FileIcon,
  Paperclip,
  ExternalLink,
  Plus,
  Layers
} from "lucide-react";
import { supabase, uploadFileToStorage } from "@/lib/supabase";

interface DocumentRow {
  id: string;
  case_id: string | null;
  client_id: string | null;
  name: string;
  category: string;
  size: string;
  uploaded_at: string;
  content_text: string | null;
  tags: string[] | null;
  storage_path: string | null;
  created_at?: string;
}

interface AttachmentRow {
  id: string;
  case_id: string | null;
  document_id: string | null;
  file_name: string;
  file_size: string;
  upload_date: string;
  category: string;
  storage_url: string | null;
  created_at?: string;
}

interface CaseOption {
  id: string;
  case_number: string;
  case_name: string;
}

interface ClientOption {
  id: string;
  name: string;
}

export default function ArchiveModule() {
  const [activeTab, setActiveTab] = useState<"documents" | "attachments">("documents");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingAtts, setLoadingAtts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Add Document Form states
  const [showDocForm, setShowDocForm] = useState(false);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("document");
  const [docCaseId, setDocCaseId] = useState("");
  const [docClientId, setDocClientId] = useState("");
  const [docTagsInput, setDocTagsInput] = useState("");
  const [docContentText, setDocContentText] = useState("");
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);

  // Add Attachment Form states
  const [showAttForm, setShowAttForm] = useState(false);
  const [attFileName, setAttFileName] = useState("");
  const [attCategory, setAttCategory] = useState("appendix");
  const [attCaseId, setAttCaseId] = useState("");
  const [attDocId, setAttDocId] = useState("");
  const [selectedAttFile, setSelectedAttFile] = useState<File | null>(null);

  // Selected Document details modal
  const [selectedDocDetails, setSelectedDocDetails] = useState<DocumentRow | null>(null);

  // Notification states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const docFileInputRef = useRef<HTMLInputElement>(null);
  const attFileInputRef = useRef<HTMLInputElement>(null);

  // Categories helper
  const docCategories = [
    { value: "pleading", label: "لوائح ومذكرات قضائية", color: "blue" },
    { value: "document", label: "مستندات وأسانيد الدعوى", color: "emerald" },
    { value: "judgment", label: "أحكام قضائية وصكوك صيانة", color: "amber" },
    { value: "execution_decision", label: "قرارات تنفيذ مادة 34", color: "rose" },
    { value: "other", label: "أخرى ومرفقات متنوعة", color: "slate" }
  ];

  const attCategories = [
    { value: "appendix", label: "ملحق إضافي للائحة" },
    { value: "id_proof", label: "وثيقة إثبات هوية" },
    { value: "proxy", label: "صورة وكالة شرعية" },
    { value: "receipt", label: "سند مالية أو فواتير" },
    { value: "judgment_copy", label: "نسخة صك أو اعتراض" }
  ];

  // Fetch functions
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDocuments((data || []) as DocumentRow[]);
    } catch (err: any) {
      console.error("[ArchiveModule] Error loading documents:", err);
      showNotification("error", "حدث خطأ أثناء تحميل المستندات والأرشيف الإلكتروني.");
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchAttachments = async () => {
    setLoadingAtts(true);
    try {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAttachments((data || []) as AttachmentRow[]);
    } catch (err: any) {
      console.error("[ArchiveModule] Error loading attachments:", err);
    } finally {
      setLoadingAtts(false);
    }
  };

  const fetchMetaOptions = async () => {
    try {
      const { data: casesData } = await supabase
        .from("cases")
        .select("id, case_number, case_name")
        .order("created_at", { ascending: false });
      
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name")
        .order("name", { ascending: true });

      if (casesData) setCases(casesData as CaseOption[]);
      if (clientsData) setClients(clientsData as ClientOption[]);
    } catch (err) {
      console.error("[ArchiveModule] Error loading meta options:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchAttachments();
    fetchMetaOptions();

    // Listen to real-time events on documents table
    const docChannelId = `documents-rt-${Math.random().toString(36).substring(7)}`;
    const docChannel = supabase
      .channel(docChannelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    // Listen to real-time events on attachments table
    const attChannelId = `attachments-rt-${Math.random().toString(36).substring(7)}`;
    const attChannel = supabase
      .channel(attChannelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attachments" },
        () => {
          fetchAttachments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(docChannel);
      supabase.removeChannel(attChannel);
    };
  }, []);

  const showNotification = (type: "success" | "error", msg: string) => {
    if (type === "success") {
      setSuccessMsg(msg);
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg("");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // Upload Document Handler
  const handleDocFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !selectedDocFile) {
      showNotification("error", "الرجاء تحديد الملف وتعبئة اسم المستند.");
      return;
    }

    setIsUploading(true);
    try {
      const file = selectedDocFile;
      const fileExt = file.name.split(".").pop();
      const storageFileName = `docs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const storagePath = `archive/${storageFileName}`;

      const { url } = await uploadFileToStorage(
        "documents",
        storagePath,
        file
      );

      const downloadUrl = url;

      // Format size
      const sizeMb = file.size / (1024 * 1024);
      const sizeStr = sizeMb > 0.1 ? `${sizeMb.toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`;

      // Parse tags
      const parsedTags = docTagsInput
        ? docTagsInput.split(",").map(t => t.trim()).filter(Boolean)
        : [];
      parsedTags.push(fileExt ? fileExt.toUpperCase() : "DOC");

      // Insert document metadata row
      const payload = {
        name: docName,
        category: docCategory,
        size: sizeStr,
        case_id: docCaseId || null,
        client_id: docClientId || null,
        content_text: docContentText || `مستند مؤرشف سحابياً بشكل أمن. مسار التخزين: ${storagePath}`,
        tags: parsedTags,
        storage_path: storagePath,
        uploaded_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from("documents")
        .insert([payload]);

      if (insertError) throw insertError;

      showNotification("success", `تمت أرشفة ورفع وتصنيف مستند "${docName}" بنجاح السحابي الآمن 📁!`);
      
      // Reset form variables
      setDocName("");
      setDocCategory("document");
      setDocCaseId("");
      setDocClientId("");
      setDocTagsInput("");
      setDocContentText("");
      setSelectedDocFile(null);
      setShowDocForm(false);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
      
      fetchDocuments();
    } catch (err: any) {
      console.error("[ArchiveModule] File Upload Error:", err);
      showNotification("error", err.message || "فشلت عملية أرشفة ورفع الملف المرفق.");
    } finally {
      setIsUploading(false);
    }
  };

  // Upload Attachment Handler
  const handleAttFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attFileName || !selectedAttFile) {
      showNotification("error", "قم باختيار مرفق وتعبئة الحقول المطلوبة.");
      return;
    }

    setIsUploading(true);
    try {
      const file = selectedAttFile;
      const fileExt = file.name.split(".").pop();
      const storageFileName = `atts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const storagePath = `archive_attachments/${storageFileName}`;

      const { url } = await uploadFileToStorage(
        "documents",
        storagePath,
        file
      );

      const downloadUrl = url;

      // Format size
      const sizeMb = file.size / (1024 * 1024);
      const sizeStr = sizeMb > 0.1 ? `${sizeMb.toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`;

      // Insert attachment row
      const payload = {
        file_name: attFileName,
        file_size: sizeStr,
        category: attCategory,
        case_id: attCaseId || null,
        document_id: attDocId || null,
        upload_date: new Date().toISOString().split("T")[0],
        storage_url: downloadUrl
      };

      const { error: insertError } = await supabase
        .from("attachments")
        .insert([payload]);

      if (insertError) throw insertError;

      showNotification("success", `تمت إضافة المرفق "${attFileName}" وربطه بالملف بنجاح!`);
      
      // Reset form variables
      setAttFileName("");
      setAttCategory("appendix");
      setAttCaseId("");
      setAttDocId("");
      setSelectedAttFile(null);
      setShowAttForm(false);
      if (attFileInputRef.current) attFileInputRef.current.value = "";

      fetchAttachments();
    } catch (err: any) {
      console.error("[ArchiveModule] Attachment upload Exception:", err);
      showNotification("error", err.message || "تعذر إكمال ورفع المرفق المطلوب.");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (id: string, name: string, storagePath: string | null) => {
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف المستند المؤرشف (${name}) نهائياً من الخادم والملفات السحابية؟`);
    if (!confirmDelete) return;

    try {
      // 1. Delete actual file from storage bucket if storagePath is present
      if (storagePath) {
        await supabase.storage.from("documents").remove([storagePath]);
      }

      // 2. Delete DB record
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      showNotification("success", `تم حذف مستند (${name}) وإلغاء أرشيفه بالكامل.`);
      fetchDocuments();
    } catch (err: any) {
      console.error("[ArchiveModule] Delete document error:", err);
      showNotification("error", "فشل حذف المستند المرتبط لوجود مرفقات أو قواعد مقيدة.");
    }
  };

  // Delete Attachment
  const handleDeleteAttachment = async (id: string, name: string, storageUrl: string | null) => {
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف المرفق القضائي المضاف (${name}) نهائياً؟`);
    if (!confirmDelete) return;

    try {
      // Attempt to parse actual storage path from URL if matching format
      if (storageUrl && storageUrl.includes("/storage/v1/object/public/documents/")) {
        const pathPart = storageUrl.split("/storage/v1/object/public/documents/")[1];
        if (pathPart) {
          await supabase.storage.from("documents").remove([decodeURIComponent(pathPart)]);
        }
      }

      const { error } = await supabase
        .from("attachments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      showNotification("success", `تم إتلاف وحذف المرفق (${name}) بنجاح.`);
      fetchAttachments();
    } catch (err: any) {
      console.error("[ArchiveModule] Delete attachment error:", err);
      showNotification("error", "حدث خطأ أثناء محاولة إتلاف المرفق.");
    }
  };

  // Get case/client Names for presentation
  const getCaseDetails = (id: string | null) => {
    if (!id) return null;
    return cases.find(c => c.id === id);
  };

  const getClientName = (id: string | null) => {
    if (!id) return "غير محدد";
    return clients.find(cl => cl.id === id)?.name || "عميل غير معروف";
  };

  const getDocNameById = (id: string | null) => {
    if (!id) return "غير مرتبط بمستند";
    return documents.find(d => d.id === id)?.name || "مستند قانوني";
  };

  // Filter logic
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doc.content_text && doc.content_text.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCase = selectedCaseId === "all" || doc.case_id === selectedCaseId;
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCase && matchesCategory;
  });

  const filteredAtts = attachments.filter(att => {
    const matchesSearch = att.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCase = selectedCaseId === "all" || att.case_id === selectedCaseId;
    const matchesCategory = selectedCategory === "all" || att.category === selectedCategory;
    return matchesSearch && matchesCase && matchesCategory;
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs font-bold transition-all animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-xs font-bold transition-all animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Header / Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#c5a880]/15 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#c5a880] flex items-center gap-2">
            <Archive className="w-6 h-6" />
            <span>نظام الحفظ والأرشفة الإلكتروني السحابي (Cloud Archive Engine)</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            إدارة مباشرة وفهرسة ذكية للوائح والمستندات القضائية والمرفقات عبر خوادم التخزين السحابية المشفرة.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#0b1e33] p-1 rounded-xl border border-[#c5a880]/15">
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "documents"
                ? "bg-[#c5a880] text-[#061224]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المستندات الأساسية ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "attachments"
                ? "bg-[#c5a880] text-[#061224]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>المرفقات الفرعية ({attachments.length})</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Search & Add */}
      <div className="bg-[#0b1e33] border border-[#c5a880]/20 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث الذكي في اسم الملف، المحتوى النصي، الأرشفة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#11243f] border border-[#c5a880]/15 rounded-xl py-3 pr-11 pl-4 text-xs font-medium text-slate-100 focus:outline-none focus:border-[#c5a880] transition-colors"
          />
        </div>

        <div className="flex w-full md:w-auto gap-2 text-xs">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-[#11243f] border border-[#c5a880]/15 text-slate-100 py-3 px-4 rounded-xl focus:outline-none focus:border-[#c5a880] cursor-pointer"
          >
            <option value="all">كل قضايا وملفات المكتب</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.case_name.substring(0, 25)}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#11243f] border border-[#c5a880]/15 text-slate-100 py-3 px-4 rounded-xl focus:outline-none focus:border-[#c5a880] cursor-pointer"
          >
            <option value="all">كل التصنيفات والأقسام</option>
            {activeTab === "documents"
              ? docCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))
              : attCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
          </select>

          {activeTab === "documents" ? (
            <button
              onClick={() => setShowDocForm(!showDocForm)}
              className="bg-[#c5a880] hover:bg-[#b0936b] text-[#061224] font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>أرشفة مستند 📤</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAttForm(!showAttForm)}
              className="bg-amber-500 hover:bg-amber-600 text-[#061224] font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>مرفق جديد 📎</span>
            </button>
          )}
        </div>
      </div>

      {/* Dialog for Uploading Document */}
      {showDocForm && (
        <form
          onSubmit={handleDocFileUpload}
          className="bg-[#0b1e33] border border-[#c5a880]/30 rounded-2xl p-6 text-xs space-y-4 animate-fadeIn"
        >
          <div className="flex justify-between items-center border-b border-[#c5a880]/15 pb-2">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <UploadCloud className="text-[#c5a880] w-5 h-5" />
              <span>أرشفة ورفع مستند سحابي جديد</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowDocForm(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">اسم المستند التعريفي:</label>
              <input
                type="text"
                required
                placeholder="مثال: لائحة اعتراضية على حكم الاستئناف"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded-lg p-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">تصنيف وقسم المستند:</label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded-lg p-2.5 text-slate-100 cursor-pointer"
              >
                {docCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">الربط بقضية معينة (مطلوب):</label>
              <select
                required
                value={docCaseId}
                onChange={(e) => setDocCaseId(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded-lg p-2.5 text-slate-100 cursor-pointer"
              >
                <option value="" disabled>اختر القضية المرتبطة بالمستند</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} - {c.case_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">الربط بملف عميل (اختياري):</label>
              <select
                value={docClientId}
                onChange={(e) => setDocClientId(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded-lg p-2.5 text-slate-100 cursor-pointer"
              >
                <option value="">غير مرتبط بعميل معين</option>
                {clients.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">الوسوم / الكلمات المفتاحية (تفصل بينها بفاصلة):</label>
              <input
                type="text"
                placeholder="محكمة, جنائي, استئناف, اعتراض"
                value={docTagsInput}
                onChange={(e) => setDocTagsInput(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded-lg p-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">اختيار وتحميل ملف المستند الأساسي:</label>
              <input
                type="file"
                required
                ref={docFileInputRef}
                onChange={(e) => setSelectedDocFile(e.target.files?.[0] || null)}
                className="w-full bg-[#11243f] text-slate-300 border border-[#c5a880]/20 rounded-lg p-1.5 focus:outline-none focus:border-[#c5a880] cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-medium">الوصف المختصر أو النص اليدوي (OCR text):</label>
            <textarea
              rows={3}
              placeholder="اكتب هنا محتويات المستند أو الملاحظات القانونية الأساسية المدونة عليه للبحث المستقبلي..."
              value={docContentText}
              onChange={(e) => setDocContentText(e.target.value)}
              className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded-lg p-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowDocForm(false);
                setSelectedDocFile(null);
                if (docFileInputRef.current) docFileInputRef.current.value = "";
              }}
              className="px-4 py-2 bg-transparent text-slate-400 hover:text-slate-200"
            >
              إلغاء التراجع
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-[#c5a880] hover:bg-[#b0936b] text-[#061224] px-5 py-2 rounded-lg font-bold disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الرفع سحابياً...</span>
                </>
              ) : (
                <span>ترخيص وبدء الأرشفة</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Dialog for Adding Attachment */}
      {showAttForm && (
        <form
          onSubmit={handleAttFileUpload}
          className="bg-[#0b1e33] border border-amber-500/30 rounded-2xl p-6 text-xs space-y-4 animate-fadeIn"
        >
          <div className="flex justify-between items-center border-b border-amber-500/15 pb-2">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Paperclip className="text-amber-400 w-5 h-5" />
              <span>إدراج مرفق فرعي قضائي جديد</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAttForm(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">اسم المرفق:</label>
              <input
                type="text"
                required
                placeholder="مثال: فاتورة سداد الرسوم الشرعية"
                value={attFileName}
                onChange={(e) => setAttFileName(e.target.value)}
                className="w-full bg-[#11243f] border border-amber-400/20 rounded-lg p-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">تصنيف المرفق:</label>
              <select
                value={attCategory}
                onChange={(e) => setAttCategory(e.target.value)}
                className="w-full bg-[#11243f] border border-amber-400/20 rounded-lg p-2.5 text-slate-100 cursor-pointer"
              >
                {attCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">الربط بمستند رئيسي (اختياري ولكن يفضل):</label>
              <select
                value={attDocId}
                onChange={(e) => setAttDocId(e.target.value)}
                className="w-full bg-[#11243f] border border-amber-400/20 rounded-lg p-2.5 text-slate-100 cursor-pointer"
              >
                <option value="">غير مرتبط بمستند رئيسي</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.substring(0, 40)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">الربط بقضية معينة (مطلوب):</label>
              <select
                required
                value={attCaseId}
                onChange={(e) => setAttCaseId(e.target.value)}
                className="w-full bg-[#11243f] border border-amber-400/20 rounded-lg p-2.5 text-slate-100 cursor-pointer"
              >
                <option value="" disabled>تحديد قضية معينة</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} - {c.case_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-slate-300 font-medium">تحديد ملف المرفق (PDF, صور، مستند):</label>
              <input
                type="file"
                required
                ref={attFileInputRef}
                onChange={(e) => setSelectedAttFile(e.target.files?.[0] || null)}
                className="w-full bg-[#11243f] text-slate-300 border border-amber-400/20 rounded-lg p-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowAttForm(false);
                setSelectedAttFile(null);
                if (attFileInputRef.current) attFileInputRef.current.value = "";
              }}
              className="px-4 py-2 bg-transparent text-slate-400 hover:text-slate-200"
            >
              إلغاء التراجع
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-amber-500 hover:bg-amber-600 text-[#061224] px-5 py-2 rounded-lg font-bold disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الرفع سحابياً...</span>
                </>
              ) : (
                <span>رفع وربط المرفق</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Selected Document Details Modal */}
      {selectedDocDetails && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1e33] border border-[#c5a880]/40 rounded-2xl max-w-2xl w-full p-6 text-xs space-y-4 shadow-2xl relative text-right">
            <div className="flex justify-between items-start border-b border-[#c5a880]/15 pb-3">
              <div>
                <span className="bg-[#c5a880]/10 text-[#c5a880] text-[10px] font-bold px-2 py-0.5 rounded">
                  {docCategories.find(c => c.value === selectedDocDetails.category)?.label || selectedDocDetails.category}
                </span>
                <h3 className="text-white text-base font-bold mt-1.5">{selectedDocDetails.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDocDetails(null)}
                className="p-1 px-2.5 bg-[#11243f] text-slate-300 rounded-lg hover:text-white"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#11243f] p-4 rounded-xl text-slate-300 font-sans">
              <div>
                <span className="text-slate-500 block">حجم المستند:</span>
                <span className="font-bold font-mono py-0.5 text-white">{selectedDocDetails.size}</span>
              </div>
              <div>
                <span className="text-slate-500 block">مرتبط بقضية:</span>
                <span className="font-bold text-white">
                  {getCaseDetails(selectedDocDetails.case_id)?.case_number || "عام / غير مرتبط"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">العميل الثنائي:</span>
                <span className="font-bold text-white">{getClientName(selectedDocDetails.client_id)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">تاريخ الفهرسة:</span>
                <span className="font-bold font-mono text-white">
                  {selectedDocDetails.uploaded_at ? new Date(selectedDocDetails.uploaded_at).toLocaleDateString("ar-SA") : "غير مسجل"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">مسار حفظ السحابي:</span>
                <span className="font-mono text-slate-400 break-all">{selectedDocDetails.storage_path || "تخزين افتراضي"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold">معاينة المستند المرفق:</span>
                {selectedDocDetails.storage_path && (
                  <button
                    onClick={() => {
                      const url = supabase.storage.from("documents").getPublicUrl(selectedDocDetails.storage_path!).data.publicUrl;
                      window.open(url, "_blank");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#11243f] text-[#c5a880] border border-[#c5a880]/30 rounded-lg hover:bg-[#11243f]/80 transition-colors text-[10px] font-bold cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>عرض بكامل الشاشة</span>
                  </button>
                )}
              </div>
              <div className="bg-[#11243f] border border-slate-800 rounded-lg p-2 h-72 md:h-96 w-full flex items-center justify-center relative overflow-hidden group">
                {selectedDocDetails.storage_path ? (
                  <iframe 
                    src={supabase.storage.from("documents").getPublicUrl(selectedDocDetails.storage_path).data.publicUrl} 
                    className="w-full h-full rounded"
                    title={selectedDocDetails.name}
                  />
                ) : (
                  <div className="text-slate-500 font-bold flex flex-col items-center">
                    <FileText className="w-10 h-10 mb-2 opacity-50" />
                    <span>هذا المستند لا يحتوي على ملف مرفق للمعاينة</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-300 font-bold text-[10px]">محتوى الفهرسة المدخل يدويًا:</span>
              <div className="bg-[#11243f] border border-slate-800/50 rounded-lg p-2 max-h-24 overflow-y-auto font-mono text-slate-400 text-[10px] whitespace-pre-wrap leading-relaxed">
                {selectedDocDetails.content_text || "لا توجد فهرسة نصية لهذا المستند."}
              </div>
            </div>

            {selectedDocDetails.tags && selectedDocDetails.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-slate-400 font-bold">الوسوم:</span>
                {selectedDocDetails.tags.map((tg, idx) => (
                  <span key={idx} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                    #{tg}
                  </span>
                ))}
              </div>
            )}

            {/* Attachments for this document inside modal */}
            <div className="border-t border-[#c5a880]/15 pt-3">
              <h4 className="text-white font-bold mb-2 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-[#c5a880]" />
                <span>المرفقات الفرعية المربوطة بهذا المستند ({attachments.filter(a => a.document_id === selectedDocDetails.id).length}) :</span>
              </h4>
              <div className="space-y-2">
                {attachments.filter(a => a.document_id === selectedDocDetails.id).length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">لا توجد ملفات مرفقة فرعية تابعة. يمكنك إرفاق صور بضغطة زر مرفق فرعي بالخارج.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {attachments
                      .filter(a => a.document_id === selectedDocDetails.id)
                      .map((att) => (
                        <div key={att.id} className="bg-[#11243f]/80 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-bold text-slate-200 block truncate">{att.file_name}</span>
                            <span className="text-slate-500 font-mono text-[10px]">{att.file_size} • {att.upload_date}</span>
                          </div>
                          <div className="flex gap-1">
                            {att.storage_url && (
                              <a
                                href={att.storage_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                                title="تحميل / فتح"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id, att.file_name, att.storage_url)}
                              className="p-1.5 bg-rose-950/40 text-rose-400 rounded hover:bg-rose-900/30"
                              title="حذف المرفق"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDocDetails(null)}
                className="bg-slate-900 text-slate-300 px-4 py-2 rounded-lg font-bold"
              >
                إغلاق التفاصيل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      {activeTab === "documents" ? (
        // ------------------ DOCUMENTS GENERAL ARCHIVE VIEW ------------------
        <div>
          {loadingDocs ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-3">
              <RefreshCw className="w-10 h-10 text-[#c5a880] animate-spin" />
              <p className="text-xs text-slate-400">تحميل فهرس المستندات المحدث من الخادم الموحد...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-[#0b1e33] border border-dashed border-[#c5a880]/30 rounded-2xl p-16 text-center text-slate-400">
              <FileIcon className="w-12 h-12 mx-auto text-slate-500 mb-3" />
              <p className="text-sm font-bold text-slate-300">لم يتم العثور على أي مستندات مؤرشفة تطابق مرشحات البحث الحالية.</p>
              <button
                onClick={() => setShowDocForm(true)}
                className="mt-4 bg-[#c5a880]/10 hover:bg-[#c5a880]/20 text-[#c5a880] text-xs font-bold px-4 py-2 rounded-lg border border-[#c5a880]/30 cursor-pointer"
              >
                ابدأ رفع أول مستند سحابي الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocs.map((doc) => {
                const associatedCase = getCaseDetails(doc.case_id);
                return (
                  <div
                    key={doc.id}
                    className="bg-[#0b1e33] border border-[#c5a880]/15 rounded-2xl overflow-hidden hover:border-[#c5a880]/40 transition-all flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`p-2 rounded-lg bg-slate-950/60 text-[#c5a880] text-[10px] font-black`}>
                          {docCategories.find((c) => c.value === doc.category)?.label || "مستند عام"}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedDocDetails(doc)}
                            className="p-1 px-2.5 bg-slate-950/60 rounded text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                            title="مشاهدة التفاصيل الكاملة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-100 line-clamp-2 min-h-[2rem] leading-snug">
                          {doc.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono block">الحجم: {doc.size || "غير معروف"}</span>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-slate-800">
                        {associatedCase && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/5 p-1.5 px-2 rounded border border-amber-500/10">
                            <Tag className="w-3.5 h-3.5" />
                            <span className="truncate">قضية: {associatedCase.case_number} - {associatedCase.case_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>العميل: {getClientName(doc.client_id)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-800 bg-[#071526]/80 flex justify-between items-center text-[10px]">
                      <span className="font-mono text-slate-500">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("ar-SA") : "غير مسجل"}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAttDocId(doc.id);
                            if (doc.case_id) setAttCaseId(doc.case_id);
                            setShowAttForm(true);
                            window.scrollTo({ top: 100, behavior: "smooth" });
                          }}
                          className="text-[#c5a880] hover:underline flex items-center gap-1 cursor-pointer"
                          title="ربط مرفق فرعي بهذا الملف"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>إرفاق</span>
                        </button>

                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.name, doc.storage_path)}
                          className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>تدمير</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // ------------------ ASSOCIATED ATTACHMENTS VIEW ------------------
        <div>
          {loadingAtts ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-3">
              <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-400">جاري تحميل وتنقيب المرفقات القضائية من الخادم...</p>
            </div>
          ) : filteredAtts.length === 0 ? (
            <div className="bg-[#0b1e33] border border-dashed border-amber-500/20 rounded-2xl p-16 text-center text-slate-400">
              <Paperclip className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-300">لا توجد مرفقات ملحقة فرعية مطابقة للخيارات المدونة.</p>
              <button
                onClick={() => setShowAttForm(true)}
                className="mt-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold px-4 py-2 rounded-lg border border-amber-500/30 cursor-pointer"
              >
                أدرج مرفقاً جديداً الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAtts.map((att) => {
                const associatedCase = getCaseDetails(att.case_id);
                return (
                  <div
                    key={att.id}
                    className="bg-[#0b1e33] border border-amber-500/15 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-[#11243f] text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-500/10">
                          {attCategories.find((c) => c.value === att.category)?.label || att.category}
                        </span>
                        <span className="font-mono text-slate-500">حجم: {att.file_size || "غير محدد"}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 mt-3 line-clamp-2 min-h-[2.5rem]">
                        {att.file_name}
                      </h4>

                      <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[10px]">
                        <div className="flex items-center gap-1 text-slate-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>مرتبط بالمستند: </span>
                          <span className="text-slate-200 truncate">{getDocNameById(att.document_id)}</span>
                        </div>
                        {associatedCase && (
                          <div className="flex items-center gap-1 text-amber-500/70">
                            <Tag className="w-3.5 h-3.5" />
                            <span>قضية: {associatedCase.case_number}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                        <span className="font-mono text-slate-600 text-[10px]">{att.upload_date}</span>
                        <div className="flex gap-2">
                           {att.storage_url && (
                             <a href={att.storage_url} target="_blank" rel="noreferrer" className="text-[#c5a880] p-1.5 hover:bg-[#c5a880]/10 rounded">
                               <ExternalLink className="w-3.5 h-3.5" />
                             </a>
                           )}
                           <button onClick={() => handleDeleteAttachment(att.id, att.file_name, att.storage_url)} className="text-rose-400 p-1.5 hover:bg-rose-500/10 rounded">
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
