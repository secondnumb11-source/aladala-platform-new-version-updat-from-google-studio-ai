import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Scale,
  FileText,
  Upload,
  Download,
  Eye,
  X,
  Search,
  Plus,
  Gavel,
  BookOpen,
  MessageSquare,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  File as LucideFile,
  FolderOpen,
  Sparkles,
  Clock,
  Filter,
  Copy,
  RotateCw,
} from "lucide-react";
import { supabase, uploadFileToStorage } from "@/lib/supabase";
import { generateUUID } from "@/lib/uuid";

const DOC_TYPES = [
  {
    value: "lawsuit_sheet",
    label: "صحيفة الدعوى",
    icon: FileText,
    color: "text-[#3b82f6] font-extrabold drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    bg: "bg-blue-950/70 bg-gradient-to-br from-blue-950/80 to-blue-900/40",
    border: "border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
  },
  {
    value: "judgment",
    label: "حكم قضائي",
    icon: Gavel,
    color: "text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    bg: "bg-amber-950/70 bg-gradient-to-br from-amber-950/80 to-amber-900/40",
    border: "border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
  },
  {
    value: "session_record",
    label: "محضر ضبط الجلسة",
    icon: BookOpen,
    color: "text-emerald-400 font-extrabold drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    bg: "bg-emerald-950/70 bg-gradient-to-br from-emerald-950/80 to-emerald-900/40",
    border: "border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
  },
  {
    value: "response_memo",
    label: "مذكرة جوابية",
    icon: MessageSquare,
    color: "text-purple-400 font-extrabold drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    bg: "bg-purple-950/70 bg-gradient-to-br from-purple-950/80 to-purple-900/40",
    border: "border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.3)]",
  },
] as const;

type DocType = (typeof DOC_TYPES)[number]["value"];

interface CaseJudgmentsModuleProps {
  cases: any[];
  selectedRole?: string;
}

export default function CaseJudgmentsModule({
  cases,
  selectedRole,
}: CaseJudgmentsModuleProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [uploadModal, setUploadModal] = useState<{
    caseId: string;
    caseName: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState("");

  const [aiPanel, setAiPanel] = useState<{
    doc: any;
    mode: "analyze" | "lawsuit" | "memo";
  } | null>(null);
  const [aiOutput, setAiOutput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Sorting and filtering states for documents in case cards (حديثاً أو قديماً)
  const [docSortOrder, setDocSortOrder] = useState<"recent" | "old">("recent");
  const [docAgeFilter, setDocAgeFilter] = useState<"all" | "recent" | "old">("all");

  // Upload form states
  const [docType, setDocType] = useState<DocType>("judgment");
  const [docName, setDocName] = useState("");
  const [judgmentDate, setJudgmentDate] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [judgmentType, setJudgmentType] = useState("");
  const [courtName, setCourtName] = useState("");
  const [circuitNumber, setCircuitNumber] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("case_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setDocuments(data || []);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // القضايا مع عدد مستنداتها
  const activeCases = cases.filter((c) => !c.archived);
  const filteredCases = activeCases.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (c.caseNumber || c.case_number || "").toLowerCase().includes(s) ||
      (c.caseName || c.title || "").toLowerCase().includes(s) ||
      (c.clientName || c.client_name || "").toLowerCase().includes(s)
    );
  });

  const getDocsForCase = (caseId: string, caseNum: string) =>
    documents
      .filter((d) => d.case_id === caseId || d.case_number === caseNum)
      .filter((d) => filterType === "all" || d.document_type === filterType);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const getDocConfig = (type: string) =>
    DOC_TYPES.find((t) => t.value === type) || DOC_TYPES[0];

  // ===== رفع الملفات =====
  const compressFile = async (file: File): Promise<Blob> => {
    if (!file.type.startsWith("image/")) return file;
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1920;
        let { width: w, height: h } = img;
        if (w > max || h > max) {
          const r = Math.min(max / w, max / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((b) => resolve(b || file), "image/jpeg", 0.8);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const handleUpload = async () => {
    if (!uploadModal) {
      setUploadError("يرجى اختيار القضية");
      return;
    }
    if (!docName.trim()) {
      setUploadError("يرجى إدخال اسم المستند");
      return;
    }
    if (selectedFiles.length === 0) {
      setUploadError("يرجى اختيار ملف واحد على الأقل");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError("");

    const saved: any[] = [];

    try {
      // جلب بيانات القضية المحددة
      const selectedCaseData = cases.find((c) => c.id === uploadModal.caseId);
      const caseNumber =
        selectedCaseData?.caseNumber || selectedCaseData?.case_number || "";
      const caseName =
        selectedCaseData?.caseName ||
        selectedCaseData?.title ||
        selectedCaseData?.clientName ||
        uploadModal.caseName ||
        "";

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(Math.round(10 + (i / selectedFiles.length) * 70));

        let fileUrl: string | null = null;
        let filePath: string | null = null;
        let compressedSize = file.size;

        // ضغط الصور فقط
        let uploadFile: File | Blob = file;
        if (file.type.startsWith("image/")) {
          try {
            const compressed = await new Promise<Blob>((resolve) => {
              const canvas = document.createElement("canvas");
              const img = new Image();
              const objUrl = URL.createObjectURL(file);
              img.onload = () => {
                const max = 1920;
                let { width: w, height: h } = img;
                if (w > max || h > max) {
                  const ratio = Math.min(max / w, max / h);
                  w = Math.round(w * ratio);
                  h = Math.round(h * ratio);
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                  (blob) => resolve(blob || file),
                  "image/jpeg",
                  0.8,
                );
                URL.revokeObjectURL(objUrl);
              };
              img.onerror = () => resolve(file);
              img.src = objUrl;
            });
            uploadFile = compressed;
            compressedSize = compressed.size;
          } catch {
            uploadFile = file;
          }
        }

        // رفع على Supabase Storage
        try {
          const timestamp = Date.now();
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `case-documents/${uploadModal.caseId}/${docType}/${timestamp}_${safeName}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("case-documents")
              .upload(storagePath, uploadFile, {
                cacheControl: "3600",
                upsert: true,
                contentType: file.type || "application/octet-stream",
              });

          if (uploadError) {
            console.error("[Storage Error]", uploadError);
            // Fallback: استخدم Object URL مؤقت
            fileUrl = URL.createObjectURL(file);
            filePath = `local/${timestamp}_${safeName}`;
          } else {
            const { data: urlData } = supabase.storage
              .from("case-documents")
              .getPublicUrl(uploadData.path);
            fileUrl = urlData.publicUrl;
            filePath = uploadData.path;
          }
        } catch (storageErr: any) {
          console.warn("[Storage fallback]", storageErr.message);
          fileUrl = URL.createObjectURL(file);
          filePath = `local/${Date.now()}_${file.name}`;
        }

        // حفظ في قاعدة البيانات
        const docId = crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now();

        const docSuffix = selectedFiles.length > 1 ? ` (${i + 1})` : "";

        const record = {
          id: docId,
          case_id: uploadModal.caseId,
          case_number: caseNumber,
          case_name: caseName,
          document_type: docType,
          document_name: docName.trim() + docSuffix,
          file_url: fileUrl,
          file_path: filePath,
          file_size: file.size,
          compressed_size: compressedSize,
          file_type: file.type || "application/octet-stream",
          hearing_date: hearingDate || null,
          judgment_date: judgmentDate || null,
          judgment_type: judgmentType || null,
          court_name:
            courtName ||
            selectedCaseData?.courtName ||
            selectedCaseData?.court_name ||
            null,
          circuit_number: circuitNumber || null,
          judge_name: judgeName || null,
          notes: notes || null,
          is_compressed: compressedSize < file.size,
          uploaded_by: "المستخدم",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: dbData, error: dbError } = await supabase
          .from("case_documents")
          .insert(record)
          .select()
          .single();

        if (dbError) {
          console.error("[DB Error]", dbError);
          // حاول بدون .single()
          const { error: dbError2 } = await supabase
            .from("case_documents")
            .insert(record);

          if (dbError2) {
            setUploadError(
              `فشل حفظ المستند "${file.name}": ${dbError2.message}`,
            );
            continue;
          }
          saved.push(record);
        } else {
          saved.push(dbData || record);
        }
      }

      setUploadProgress(100);

      if (saved.length > 0) {
        // تحديث State بالمستندات الجديدة
        setDocuments((prev) => [...saved, ...prev]);

        // إغلاق النافذة وإعادة تعيين النموذج
        setUploadModal(null);
        resetUploadForm();

        alert(
          `✅ تم رفع وحفظ ${saved.length} مستند بنجاح\n` +
            `القضية: ${caseName} (#${caseNumber})`,
        );
      } else {
        setUploadError("فشل حفظ جميع المستندات. يرجى المحاولة مرة أخرى");
      }
    } catch (err: any) {
      console.error("[Upload Exception]", err);
      setUploadError("خطأ غير متوقع: " + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setDocType("judgment");
    setDocName("");
    setJudgmentDate("");
    setHearingDate("");
    setJudgmentType("");
    setCourtName("");
    setCircuitNumber("");
    setJudgeName("");
    setNotes("");
    setSelectedFiles([]);
    setUploadError("");
  };

  const handleDelete = async (doc: any) => {
    const confirmed = window.confirm(
      `⚠️ تأكيد الحذف النهائي\n\n` +
        `المستند: ${doc.document_name}\n` +
        `النوع: ${DOC_TYPES.find((t) => t.value === doc.document_type)?.label || doc.document_type}\n` +
        `القضية: #${doc.case_number}\n\n` +
        `سيُحذف المستند نهائياً من قاعدة البيانات والتخزين.\n` +
        `لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟`,
    );

    if (!confirmed) return;

    setIsDeleting(doc.id);

    try {
      // === الخطوة 1: حذف الملف من Supabase Storage ===
      if (
        doc.file_path &&
        !doc.file_path.startsWith("local/") &&
        !doc.file_path.startsWith("fallback") &&
        !doc.file_path.startsWith("http")
      ) {
        try {
          const { error: storageError } = await supabase.storage
            .from("case-documents")
            .remove([doc.file_path]);

          if (storageError) {
            console.warn("[Delete Storage]", storageError.message);
            // لا نوقف العملية — نكمل حذف السجل
          } else {
            console.log("[Delete Storage] ✅ تم حذف الملف");
          }
        } catch (storageEx: any) {
          console.warn("[Delete Storage Exception]", storageEx.message);
        }
      }

      // === الخطوة 2: حذف السجل من قاعدة البيانات ===
      const { error: dbError } = await supabase
        .from("case_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) {
        throw new Error("فشل حذف السجل من قاعدة البيانات: " + dbError.message);
      }

      // === الخطوة 3: تحديث State ===
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));

      // إغلاق العارض إذا كان يعرض المستند المحذوف
      if (viewerDoc?.id === doc.id) setViewerDoc(null);

      // إغلاق لوحة AI إذا كانت مفتوحة للمستند المحذوف
      if (aiPanel?.doc.id === doc.id) {
        setAiPanel(null);
        setAiOutput("");
      }

      // عرض رسالة النجاح
      setDeleteSuccess(doc.document_name);
      setTimeout(() => setDeleteSuccess(""), 4000);

      console.log("[Delete] ✅ تم حذف المستند:", doc.document_name);
    } catch (err: any) {
      console.error("[Delete Error]", err.message);
      alert("❌ فشل الحذف: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  // ===== دالة بناء Context القضية الشاملة =====
  const buildCaseContext = async (doc: any): Promise<string> => {
    // جلب بيانات القضية من Supabase
    const { data: caseData } = await supabase
      .from("cases")
      .select("*")
      .eq("id", doc.case_id || "")
      .maybeSingle();

    // جلب جميع مستندات هذه القضية
    const { data: allDocs } = await supabase
      .from("case_documents")
      .select(
        "document_name, document_type, judgment_type, " +
          "hearing_date, judgment_date, notes, " +
          "court_name, judge_name, created_at",
      )
      .eq("case_number", doc.case_number)
      .order("created_at");

    // بناء Context مفصّل
    return `
========================================
بيانات القضية الكاملة
========================================
رقم القضية: ${doc.case_number}
اسم الدعوى: ${doc.case_name || caseData?.title || "غير محدد"}
الموكل (المدعي/المتهم): ${caseData?.client_name || "غير محدد"}
الخصم (المدعى عليه): ${caseData?.opponent_name || "غير محدد"}
رقم هوية الخصم: ${caseData?.opponent_national_id || "غير محدد"}
المحكمة: ${doc.court_name || caseData?.court_name || "غير محدد"}
رقم الدائرة: ${caseData?.circuit_number || "غير محدد"}
القاضي: ${doc.judge_name || caseData?.judge_name || "غير محدد"}
تصنيف القضية: ${
      caseData?.category === "commercial"
        ? "تجاري"
        : caseData?.category === "labor"
          ? "عمالي"
          : caseData?.category === "civil"
            ? "مدني"
            : caseData?.category === "criminal"
              ? "جزائي"
              : caseData?.category === "personal_status"
                ? "أحوال شخصية"
                : caseData?.category === "administrative"
                  ? "إداري"
                  : caseData?.category || "غير محدد"
    }
مرحلة التقاضي: ${
      caseData?.stage === "litigation"
        ? "ابتدائي"
        : caseData?.stage === "appeals"
          ? "استئنافي"
          : caseData?.stage === "cassation"
            ? "تمييز/نقض"
            : caseData?.stage === "execution"
              ? "تنفيذ"
              : caseData?.stage || "غير محدد"
    }
حالة القضية: ${caseData?.status || "غير محدد"}
رقم وكالة المحامي: ${caseData?.power_of_attorney_number || "غير محدد"}
الرسوم المتفق عليها: ${caseData?.agreed_fees || "غير محدد"} ريال
ملخص القضية: ${caseData?.summary || "غير متوفر"}
تفاصيل القضية: ${caseData?.details || "غير متوفرة"}

========================================
المستند الحالي المُشار إليه
========================================
نوع المستند: ${
      DOC_TYPES.find((t) => t.value === doc.document_type)?.label ||
      doc.document_type
    }
اسم المستند: ${doc.document_name}
تاريخ الجلسة: ${doc.hearing_date || "غير محدد"}
تاريخ الحكم: ${doc.judgment_date || "غير محدد"}
نوع الحكم / نتيجته: ${doc.judgment_type || "غير محدد"}
المحكمة: ${doc.court_name || "غير محدد"}
اسم القاضي: ${doc.judge_name || "غير محدد"}
ملاحظات: ${doc.notes || "لا توجد ملاحظات"}

========================================
سجل مستندات القضية (${allDocs?.length || 0} مستند)
========================================
${
  allDocs
    ?.map((d: any, i: number) => {
      const typeLabel =
        DOC_TYPES.find((t) => t.value === d.document_type)?.label ||
        d.document_type;
      return (
        `${i + 1}. [${typeLabel}] ${d.document_name}` +
        (d.judgment_date ? ` | تاريخ الحكم: ${d.judgment_date}` : "") +
        (d.judgment_type ? ` | النتيجة: ${d.judgment_type}` : "") +
        (d.hearing_date ? ` | تاريخ الجلسة: ${d.hearing_date}` : "") +
        (d.court_name ? ` | المحكمة: ${d.court_name}` : "") +
        (d.notes ? ` | ملاحظة: ${d.notes}` : "")
      );
    })
    .join("\n") || "لا توجد مستندات مسجلة"
}
    `.trim();
  };

  // ===== دالة استدعاء Gemini =====
  const callLegalAI = async (
    doc: any,
    mode: "analyze" | "lawsuit" | "memo",
  ) => {
    setIsAiLoading(true);
    setAiOutput("");
    setAiError("");

    try {
      const caseContext = await buildCaseContext(doc);

      // ===== Prompts القانونية المتوافقة مع الأنظمة السعودية =====
      const prompts = {
        // --- تحليل القضية ---
        analyze: {
          system: `أنت محامٍ سعودي خبير ومستشار قانوني متخصص في التقاضي أمام
  المحاكم السعودية بجميع درجاتها. تستند في تحليلاتك إلى:
  - نظام المرافعات الشرعية السعودي وتعديلاته
  - نظام الإجراءات الجزائية
  - نظام العمل السعودي ولوائحه التنفيذية
  - نظام الشركات ونظام التجارة
  - نظام الأحوال الشخصية
  - المبادئ الشرعية الإسلامية المعمول بها في المملكة
  - أحكام ديوان المظالم والمحاكم الإدارية
  تكتب تحليلاتك بأسلوب قانوني احترافي دقيق ومفصّل باللغة العربية.`,

          user: `بناءً على المعلومات والمستندات القضائية التالية، قدّم تحليلاً
  قانونياً شاملاً واحترافياً ومتوافقاً مع الأنظمة السعودية:

  ${caseContext}

  قدّم التحليل وفق الهيكل التالي:

  ## أولاً: وصف وقائع الدعوى
  سرد منهجي لوقائع القضية وملابساتها وتسلسلها الزمني.

  ## ثانياً: الإطار القانوني المنطبق
  الأنظمة والمواد القانونية السعودية المطبّقة على هذه القضية تحديداً،
  مع ذكر أرقام المواد والأنظمة بدقة.

  ## ثالثاً: تقييم المستندات المقدمة
  تقييم قانوني لكل مستند وأثره على مسار القضية وحجيته أمام المحكمة.

  ## رابعاً: نقاط القوة في موقف الموكل
  الحجج والأدلة والدفوع التي تصبّ في مصلحة الموكل مع التأصيل النظامي.

  ## خامساً: نقاط الضعف والمخاطر القانونية
  التحديات والثغرات التي قد تضعف الموقف، مع اقتراح معالجتها.

  ## سادساً: المسار القضائي والإجراءات
  تقييم المراحل التي مرّت بها القضية والإجراءات المتخذة وسلامتها.

  ## سابعاً: تقدير فرص النجاح
  تقدير موضوعي لفرص كسب القضية مع التبرير القانوني الدقيق.

  ## ثامناً: التوصيات الاستراتيجية
  توصيات عملية ومحددة للخطوات القادمة مرتّبة حسب الأولوية.

  ## تاسعاً: الجدول الزمني والمهل النظامية
  المهل والمواعيد القانونية الواجب مراعاتها وفق الأنظمة السعودية.

  اجعل التحليل دقيقاً ومفصلاً ومستنداً فعلياً إلى الوقائع والمستندات.`,
        },

        // --- صحيفة الدعوى ---
        lawsuit: {
          system: `أنت محامٍ سعودي متخصص في صياغة صحف الدعاوى القضائية وفق
  نظام المرافعات الشرعية السعودي الصادر بالمرسوم الملكي م/1 لعام 1435هـ
  وتعديلاته، ونظام الإجراءات أمام ديوان المظالم، ونظام المحاكم التجارية،
  ولائحة إجراءات المحاكم العمالية. تصيغ صحف الدعاوى بأسلوب قانوني رسمي
  يراعي شروط الصحيفة وبياناتها المنصوص عليها نظاماً، وتستند إلى الأدلة
  والمستندات في إثبات الطلبات.`,

          user: `بناءً على بيانات القضية والمستندات التالية، قم بصياغة صحيفة
  دعوى قضائية احترافية ومكتملة الأركان وفق نظام المرافعات الشرعية السعودي:

  ${caseContext}

  صيغ صحيفة الدعوى وفق النموذج الرسمي المعتمد:

  ─────────────────────────────────────
  بسم الله الرحمن الرحيم
  ─────────────────────────────────────

  صحيفة دعوى قضائية

  المحكمة المرفوعة إليها: [اسم المحكمة المختصة]
  الدائرة: [رقم الدائرة]
  التاريخ: [التاريخ الهجري والميلادي]

  أولاً: بيانات المدعي
  ─────────────────
  الاسم الكامل: [الاسم]
  رقم الهوية الوطنية / الإقامة: [الرقم]
  العنوان: [العنوان الكامل]
  رقم الجوال: [الرقم]
  البريد الإلكتروني: [البريد]
  ويمثله وكيله الشرعي: المحامي [اسم المحامي]
  رقم الرخصة المهنية: [الرقم]
  بموجب وكالة رقم: [رقم الوكالة]

  ثانياً: بيانات المدعى عليه
  ─────────────────────────
  الاسم الكامل: [الاسم]
  رقم الهوية / السجل التجاري: [الرقم]
  العنوان: [العنوان للتبليغ]

  ثالثاً: موضوع الدعوى وطلبات المدعي
  ────────────────────────────────────
  (صياغة واضحة ومحددة لموضوع الدعوى والطلبات)

  رابعاً: وقائع الدعوى وسردها
  ──────────────────────────
  (سرد مفصّل ومنهجي لوقائع النزاع مستنداً للمستندات والأدلة)

  خامساً: الأسانيد القانونية
  ──────────────────────────
  (المواد والأنظمة السعودية التي يستند إليها المدعي بأرقامها الدقيقة)

  سادساً: المستندات المرفقة
  ─────────────────────────
  (قائمة بالمستندات المقدمة دليلاً)

  سابعاً: الطلبات الختامية
  ────────────────────────
  يلتمس المدعي من المحكمة الموقرة التكرم بـ:
  (الطلبات المحددة والواضحة)

  وختاماً، يلتمس المدعي القضاء له بما طُلب،
  والله يحفظ المملكة وولاة أمرها.

  توقيع المحامي
  [الاسم — رقم الرخصة — التاريخ]
  ─────────────────────────────────────

  اجعل الصياغة رسمية وقانونية دقيقة مستندة إلى الوقائع الفعلية للقضية.`,
        },

        // --- المذكرة الجوابية ---
        memo: {
          system: `أنت محامٍ سعودي متخصص في صياغة المذكرات الجوابية والدفوع
  القانونية أمام المحاكم السعودية بجميع درجاتها. تكتب مذكراتك وفق
  أحكام نظام المرافعات الشرعية السعودي، مستنداً إلى:
  - الدفوع الشكلية والموضوعية المقررة نظاماً
  - المبادئ القضائية الصادرة عن المحاكم السعودية
  - الأنظمة واللوائح التنفيذية المعمول بها
  - الفقه الإسلامي المعتمد في المحاكم السعودية
  تكتب بأسلوب قانوني قوي ومحكم يدحض حجج الخصوم ويعزز موقف الموكل.`,

          user: `بناءً على بيانات القضية والمستندات التالية، قم بصياغة مذكرة
  جوابية احترافية ومفصّلة وفق نظام المرافعات الشرعية السعودي:

  ${caseContext}

  صيغ المذكرة الجوابية وفق الهيكل القانوني المعتمد:

  ─────────────────────────────────────
  بسم الله الرحمن الرحيم
  ─────────────────────────────────────

  مذكرة جوابية

  في الدعوى رقم: ${doc.case_number}
  المنظورة أمام: [المحكمة والدائرة]
  المقدمة من: [اسم الموكل] - المدعى عليه / المستأنف
  بوساطة وكيله: المحامي [الاسم]

  ─────────────────────────────────────
  أولاً: مقدمة المذكرة
  ─────────────────────
  (تعريف بالقضية وموقف الموكل والهدف من المذكرة)

  ثانياً: الدفوع الشكلية
  ───────────────────────
  (الدفوع المتعلقة بالاختصاص والإجراءات وشكل الدعوى
   مع الاستناد إلى مواد نظام المرافعات)

  ثالثاً: الدفوع الموضوعية
  ──────────────────────────
  (الدفوع القانونية التفصيلية على كل ادعاء
   مع التأصيل النظامي الدقيق وأرقام المواد)

  رابعاً: الرد التفصيلي على ادعاءات الخصم
  ──────────────────────────────────────────
  (الرد القانوني المنطقي على كل نقطة أثارها الخصم
   مستنداً إلى المستندات والأدلة والأنظمة)

  خامساً: المستندات والأدلة المؤيدة لموقف الموكل
  ──────────────────────────────────────────────
  (عرض المستندات وكيفية توظيفها لدعم الموقف)

  سادساً: الأنظمة والمبادئ القانونية المطبّقة
  ──────────────────────────────────────────
  (المواد النظامية والمبادئ القضائية السعودية المستند إليها
   مع الاقتباس الحرفي من النصوص النظامية حيثما أمكن)

  سابعاً: الخلاصة والطلبات
  ──────────────────────────
  لما تقدّم، يلتمس الموكل من المحكمة الموقرة التكرم بـ:
  1. [الطلب الأول]
  2. [الطلب الثاني]
  3. رفض الدعوى وإلزام المدعي بالمصاريف

  والله يحفظ المملكة وولاة أمرها.

  توقيع المحامي
  [الاسم — رقم الرخصة — التاريخ]
  ─────────────────────────────────────

  اجعل المذكرة قوية ومحكمة واحترافية مستندة فعلياً
  إلى وقائع القضية والأنظمة السعودية.`,
        },
      };

      const selectedPrompt = prompts[mode];

      // استدعاء Gemini عبر الخادم
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: selectedPrompt.user,
          context: selectedPrompt.system,
          caseContext,
          documentId: doc.id,
          mode,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "فشل الذكاء الاصطناعي");
      }

      const output = data.result || data.response || "";
      setAiOutput(output);

      // حفظ النتيجة في قاعدة البيانات
      try {
        await supabase.from("ai_legal_outputs").insert({
          id: generateUUID(),
          case_number: doc.case_number,
          case_id: doc.case_id,
          document_id: doc.id,
          output_type: mode,
          output_text: output,
          model_used: "gemini-2.0-flash",
          created_at: new Date().toISOString(),
        });
      } catch (saveErr) {
        console.warn("[AI Save] Could not save output:", saveErr);
      }
    } catch (err: any) {
      console.error("[AI Legal Error]", err.message);
      setAiError(err.message || "حدث خطأ في التحليل");
    } finally {
      setIsAiLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[#050c18] border border-slate-600 hover:border-slate-500 text-white font-bold rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 focus:shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all duration-200";

  return (
    <div className="min-h-screen bg-[#050e21] text-white p-6" dir="rtl">
      {/* رأس القسم */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-amber-500/15 rounded-2xl border border-amber-500/30">
            <Scale className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              الأحكام وضبط الجلسات والمذكرات
            </h1>
            <p className="text-white font-extrabold text-sm mt-0.5">
              إدارة المستندات القضائية لكل قضية مسجلة
            </p>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {DOC_TYPES.map((type) => {
            const count = documents.filter(
              (d) => d.document_type === type.value,
            ).length;
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() =>
                  setFilterType((f) => (f === type.value ? "all" : type.value))
                }
                className={`rounded-2xl border p-5 text-right transition-all duration-300 ${
                  filterType === type.value
                    ? `${type.bg} ${type.border} scale-[1.03]`
                    : "bg-[#0a1628] border-slate-700/60 hover:border-slate-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${type.color}`} />
                  <span className={`text-xs font-bold ${type.color}`}>
                    {type.label}
                  </span>
                </div>
                <p className="text-2xl font-black text-white">{count}</p>
              </button>
            );
          })}
        </div>

        {/* شريط البحث والفلترة */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم القضية أو الموكل..."
              className="w-full bg-[#0a1628] border border-slate-700 text-white
                rounded-xl pr-10 pl-4 py-2.5 text-sm placeholder-slate-500
                focus:outline-none focus:border-amber-500"
            />
          </div>
          {filterType !== "all" && (
            <button
              onClick={() => setFilterType("all")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white
                text-sm rounded-xl transition-colors flex items-center gap-2"
            >
              <X className="w-3 h-3" />
              مسح الفلتر
            </button>
          )}
        </div>
      </div>

      {/* كروت القضايا */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredCases.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20
          border border-dashed border-slate-700 bg-slate-900/50 rounded-3xl"
        >
          <FolderOpen className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
          <p className="text-white font-black text-base">لا توجد قضايا مسجلة</p>
          <p className="text-yellow-400 text-sm font-bold mt-1">
            أضف قضايا من قسم إدارة القضايا أولاً
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((c) => {
            const caseId = c.id;
            const caseNum = c.caseNumber || c.case_number || "";
            const caseName = c.caseName || c.title || c.clientName || "";
            const caseDocs = getDocsForCase(caseId, caseNum);
            const isExpanded = expandedCaseId === caseId;

            return (
              <div
                key={caseId}
                className="bg-[#0a1628] border border-slate-700/50
                  hover:border-amber-500/30 rounded-2xl overflow-hidden
                  transition-all duration-300"
              >
                {/* رأس كارت القضية */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer
                    hover:bg-amber-500/5 transition-colors"
                  onClick={() => setExpandedCaseId(isExpanded ? null : caseId)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="p-2.5 bg-amber-500/10 rounded-xl
                      border border-amber-500/20 shrink-0"
                    >
                      <Scale className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-yellow-400 font-mono text-xs font-black">
                          #{caseNum}
                        </span>
                        {c.status && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-lg
                            bg-slate-800 text-white border border-slate-600 font-bold"
                          >
                            {c.status}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-black text-sm truncate">
                        {caseName}
                      </h3>
                      {c.courtName || c.court_name ? (
                        <p className="text-yellow-400 text-xs font-bold mt-0.5">
                          {c.courtName || c.court_name}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* عداد المستندات */}
                    <div className="flex gap-2">
                      {DOC_TYPES.map((type) => {
                        const cnt = documents.filter(
                          (d) =>
                            (d.case_id === caseId ||
                              d.case_number === caseNum) &&
                            d.document_type === type.value,
                        ).length;
                        if (cnt === 0) return null;
                        return (
                          <span
                            key={type.value}
                            className={`text-[10px] px-2 py-0.5 rounded-lg
                              font-black bg-slate-800 text-white
                              border border-slate-600`}
                          >
                            {cnt}
                          </span>
                        );
                      })}
                      {caseDocs.length === 0 && (
                        <span className="text-yellow-400 text-xs font-bold">
                          لا توجد مستندات
                        </span>
                      )}
                    </div>

                    {/* زر رفع */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadModal({ caseId, caseName });
                        resetUploadForm();
                        if (c.courtName || c.court_name) {
                          setCourtName(c.courtName || c.court_name);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5
                        bg-amber-600 hover:bg-amber-500 text-white text-xs
                        font-bold rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      رفع
                    </button>

                    <ChevronRight
                      className={`w-4 h-4 text-slate-500
                      transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </div>
                </div>

                {/* المستندات المنسدلة */}
                {isExpanded && (() => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                  const processedDocs = [...caseDocs].filter((doc) => {
                    if (docAgeFilter === "recent") {
                      return new Date(doc.created_at) >= sevenDaysAgo;
                    } else if (docAgeFilter === "old") {
                      return new Date(doc.created_at) < sevenDaysAgo;
                    }
                    return true;
                  }).sort((a, b) => {
                    const timeA = new Date(a.created_at || 0).getTime();
                    const timeB = new Date(b.created_at || 0).getTime();
                    return docSortOrder === "recent" ? timeB - timeA : timeA - timeB;
                  });

                  return (
                    <div className="border-t border-slate-700/50 p-5">
                      {caseDocs.length === 0 ? (
                        <div
                          className="flex flex-col items-center justify-center
                          py-8 border border-dashed border-slate-700 rounded-xl bg-slate-900/50"
                        >
                          <FileText className="w-10 h-10 text-yellow-400 mb-3 animate-pulse" />
                          <p className="text-white text-sm font-black">
                            لا توجد مستندات مرفوعة لهذه القضية
                          </p>
                          <button
                            onClick={() => {
                              setUploadModal({ caseId, caseName });
                              resetUploadForm();
                            }}
                            className="mt-3 text-yellow-400 text-xs font-black hover:text-yellow-300"
                          >
                            + ارفع أول مستند
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* خيارات الفرز والتصفية الزمنية (حديثاً وقديماً) للمستندات */}
                          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-5 pb-4 border-b border-slate-800/80 font-sans">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-400 text-xs font-bold">الترتيب الزمني:</span>
                              <div className="inline-flex rounded-lg bg-[#050e21] p-0.5 border border-slate-700/60">
                                <button
                                  type="button"
                                  onClick={() => setDocSortOrder("recent")}
                                  className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                                    docSortOrder === "recent"
                                      ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  🕒 الأحدث (حديثاً أولاً)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDocSortOrder("old")}
                                  className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                                    docSortOrder === "old"
                                      ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  📁 الأقدم (قديماً أولاً)
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-400 text-xs font-bold">تصنيف الرفع:</span>
                              <div className="inline-flex rounded-lg bg-[#050e21] p-0.5 border border-slate-700/60">
                                <button
                                  type="button"
                                  onClick={() => setDocAgeFilter("all")}
                                  className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                                    docAgeFilter === "all"
                                      ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  الكل ({caseDocs.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDocAgeFilter("recent")}
                                  className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                                    docAgeFilter === "recent"
                                      ? "bg-emerald-500 text-slate-950 font-black shadow-lg"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                  title="الملفات المرفوعة خلال آخر 7 أيام"
                                >
                                  ✨ مرفوع حديثاً ({caseDocs.filter(d => new Date(d.created_at) >= sevenDaysAgo).length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDocAgeFilter("old")}
                                  className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                                    docAgeFilter === "old"
                                      ? "bg-blue-600 text-white font-black shadow-lg"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                  title="الملفات المرفوعة قبل أكثر من 7 أيام"
                                >
                                  ⏳ محفوظ مسبقاً ({caseDocs.filter(d => new Date(d.created_at) < sevenDaysAgo).length})
                                </button>
                              </div>
                            </div>
                          </div>

                          {processedDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 font-sans">
                              <FileText className="w-10 h-10 text-slate-500 mb-2" />
                              <p className="text-slate-400 text-xs font-bold">
                                {docAgeFilter === "recent"
                                  ? "لا توجد مستندات مرفوعة حديثاً (أخر 7 أيام) لهذه القضية."
                                  : "لا توجد مستندات قديمة مسبقة في هذا الفلتر."}
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {processedDocs.map((doc) => {
                                const typeConf = getDocConfig(doc.document_type);
                                const Icon = typeConf.icon;
                                const isDocRecent = new Date(doc.created_at || 0) >= sevenDaysAgo;
                                return (
                                  <div
                                    key={doc.id}
                                    className={`relative group border-2 rounded-2xl
                                      p-5 transition-all duration-300 hover:scale-[1.02]
                                      ${typeConf.border} ${typeConf.bg} shadow-md`}
                                  >
                                    {/* نوع المستند مع شارة حديثاً أو قديماً */}
                                    <div className="flex items-center justify-between gap-1.5 mb-3 select-none">
                                      <div
                                        className="inline-flex items-center gap-2
                                        text-xs font-black px-3 py-1.5 rounded-xl
                                        bg-[#050e21]/90 text-white border border-slate-700/80 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                                      >
                                        <Icon className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)] shrink-0" />
                                        <span className="tracking-wide">{typeConf.label}</span>
                                      </div>

                                      {isDocRecent ? (
                                        <span className="text-[10px] px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black flex items-center gap-1.5 font-sans animate-pulse">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
                                          مرفوع حديثاً
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-1 rounded-xl bg-[#091122] text-slate-200 border border-slate-700 font-black flex items-center gap-1.5 font-sans">
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 block" />
                                          محفوظ مسبقاً
                                        </span>
                                      )}
                                    </div>

                                    {/* اسم المستند */}
                                    <p className="text-white font-black text-sm mb-3 mt-1 leading-relaxed hover:text-amber-300 transition-colors duration-200">
                                      {doc.document_name}
                                    </p>

                                    {/* تفاصيل */}
                                    <div className="space-y-2 mb-4 bg-black/35 p-3 rounded-xl border border-slate-800/85">
                                      {doc.judgment_date && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                                          <span className="text-amber-300 font-extrabold text-xs">
                                            تاريخ الحكم: {doc.judgment_date}
                                          </span>
                                        </div>
                                      )}
                                      {doc.hearing_date && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                                          <span className="text-blue-300 font-extrabold text-xs">
                                            تاريخ الجلسة: {doc.hearing_date}
                                          </span>
                                        </div>
                                      )}
                                      {doc.judgment_type && (
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="inline-block text-[11px] px-2.5 py-1
                                            bg-amber-600/20 text-amber-300 border border-amber-500/40
                                            rounded-lg font-bold"
                                          >
                                            {doc.judgment_type}
                                          </span>
                                        </div>
                                      )}
                                      {doc.court_name && (
                                        <div className="flex items-center gap-2">
                                          <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
                                          <span className="text-slate-100 font-extrabold text-xs truncate">
                                            {doc.court_name}
                                            {doc.circuit_number
                                              ? ` — دائرة ${doc.circuit_number}`
                                              : ""}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* حجم + تاريخ */}
                                    <div
                                      className="flex items-center justify-between
                                      pt-2.5 border-t border-slate-700/50"
                                    >
                                      <span className="text-slate-300 font-bold text-xs">
                                        الحجم:{" "}
                                        <span className="text-amber-400 font-black">
                                          {formatFileSize(
                                            doc.compressed_size || doc.file_size,
                                          )}
                                        </span>
                                      </span>
                                      <span className="text-slate-300 font-bold text-xs">
                                        التاريخ:{" "}
                                        <span className="text-white font-black">
                                          {new Date(doc.created_at).toLocaleDateString(
                                            "ar-SA",
                                          )}
                                        </span>
                                      </span>
                                    </div>

                                    {/* أزرار الإجراءات */}
                                    <div
                                      className="absolute top-3 left-3 flex gap-1
                                      opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <button
                                        onClick={() => {
                                          setAiPanel({ doc, mode: "analyze" });
                                          setAiOutput("");
                                          setAiError("");
                                        }}
                                        className="p-1.5 bg-purple-500/20 hover:bg-purple-500/40
                                          rounded-lg transition-colors"
                                        title="تحليل بالذكاء الاصطناعي"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                      </button>
                                      <button
                                        onClick={() => setViewerDoc(doc)}
                                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40
                                          rounded-lg transition-colors"
                                        title="عرض"
                                      >
                                        <Eye className="w-3 h-3 text-blue-300" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (doc.file_url) {
                                            const a = document.createElement("a");
                                            a.href = doc.file_url;
                                            a.download = doc.document_name;
                                            a.target = "_blank";
                                            a.click();
                                          }
                                        }}
                                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40
                                          rounded-lg transition-colors"
                                        title="تحميل"
                                      >
                                        <Download className="w-3 h-3 text-emerald-300" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(doc)}
                                        disabled={isDeleting === doc.id}
                                        className="p-1.5 bg-red-500/20 hover:bg-red-500/40
                                          rounded-lg transition-colors disabled:opacity-50
                                          group/del"
                                        title="حذف نهائي من قاعدة البيانات"
                                      >
                                        {isDeleting === doc.id ? (
                                          <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                                        ) : (
                                          <Trash2
                                            className="w-3.5 h-3.5 text-red-400
                                            group-hover/del:scale-110 transition-transform"
                                          />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* (1) نافذة رفع المستند */}
      {uploadModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center
          p-4 bg-black/80 backdrop-blur-sm"
          dir="rtl"
        >
          <div
            className="bg-gradient-to-b from-[#0a1628] to-[#040c18] border-2 border-amber-500/50 rounded-2xl
            w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[0_0_35px_rgba(245,158,11,0.25)] animate-in fade-in zoom-in-95 duration-200"
          >
            <div
              className="sticky top-0 bg-[#0a1628]/95 backdrop-blur-md flex items-center
              justify-between p-6 border-b border-slate-700/80 z-10"
            >
              <div>
                <h2 className="text-white font-black text-lg">رفع مستند جديد</h2>
                <p className="text-amber-400 font-bold text-xs mt-1">
                  الموكل / القضية: {uploadModal.caseName}
                </p>
              </div>
              <button
                onClick={() => {
                  setUploadModal(null);
                  resetUploadForm();
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {uploadError && (
                <div
                  className="flex items-center gap-3 p-4 bg-red-500/10
                  border border-red-500/30 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-red-300 text-sm font-bold">{uploadError}</p>
                </div>
              )}

              {/* نوع المستند */}
              <div>
                <label className="block text-slate-200 text-xs font-black tracking-wide mb-2.5">
                  نوع المستند المراد رفعه *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {DOC_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setDocType(type.value)}
                        className={`flex items-center gap-2.5 p-3.5 rounded-xl
                          border-2 transition-all text-right cursor-pointer ${
                            docType === type.value
                              ? `${type.bg} ${type.border} ${type.color} ring-1 ring-amber-400/30`
                              : "bg-[#050e21] border-slate-700/80 text-slate-200 hover:border-slate-500 hover:text-white hover:bg-slate-900"
                          }`}
                      >
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                        <span className="text-xs font-black">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* اسم المستند */}
              <div>
                <label className="block text-slate-200 text-xs font-black tracking-wide mb-2.5">
                  اسم المستند *
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="مثال: حكم ابتدائي رقم 1234"
                  className={inputClass}
                />
              </div>

              {/* الحقول الخاصة */}
              <div className="grid grid-cols-2 gap-3">
                {docType === "judgment" && (
                  <>
                    <div>
                      <label className="block text-slate-300 text-xs font-black mb-1.5">
                        تاريخ الحكم
                      </label>
                      <input
                        type="date"
                        value={judgmentDate}
                        onChange={(e) => setJudgmentDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-xs font-black mb-1.5">
                        نوع الحكم
                      </label>
                      <select
                        value={judgmentType}
                        onChange={(e) => setJudgmentType(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">اختر...</option>
                        <option value="حكم ابتدائي font-bold text-slate-950">حكم ابتدائي</option>
                        <option value="حكم استئنافي font-bold text-slate-950">حكم استئنافي</option>
                        <option value="حكم نقض font-bold text-slate-950 font-bold text-slate-950">حكم نقض / تمييز</option>
                        <option value="حكم لصالح الموكل font-bold text-slate-950">
                          لصالح الموكل ✅
                        </option>
                        <option value="حكم ضد الموكل font-bold text-slate-950">ضد الموكل ❌</option>
                        <option value="حكم جزئي font-bold text-slate-950">حكم جزئي</option>
                        <option value="مشطوب font-bold text-slate-950">مشطوب</option>
                      </select>
                    </div>
                  </>
                )}
                {docType === "session_record" && (
                  <div>
                    <label className="block text-slate-300 text-xs font-black mb-1.5">
                      تاريخ الجلسة
                    </label>
                    <input
                      type="date"
                      value={hearingDate}
                      onChange={(e) => setHearingDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-300 text-xs font-black mb-1.5">
                    المحكمة
                  </label>
                  <input
                    type="text"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    placeholder="اسم المحكمة"
                    className={inputClass}
                  />
                </div>
                {docType === "judgment" && (
                  <div>
                    <label className="block text-slate-300 text-xs font-black mb-1.5">
                      رقم الدائرة
                    </label>
                    <input
                      type="text"
                      value={circuitNumber}
                      onChange={(e) => setCircuitNumber(e.target.value)}
                      placeholder="رقم الدائرة"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-slate-300 text-xs font-black mb-1.5">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="اكتب أي ملاحظات..."
                  className={inputClass + " resize-none"}
                />
              </div>

              {/* رفع الملفات */}
              <div>
                <label className="block text-slate-200 text-xs font-black tracking-wide mb-2.5">
                  ملف المستند المرفق * (PDF، Word، صور)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-500/30 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 rounded-2xl p-8 text-center transition-all duration-300 shadow-[inset_0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] group cursor-pointer"
                >
                  <Upload
                    className="w-10 h-10 text-amber-400 group-hover:text-amber-300 mx-auto mb-3 transition-transform duration-300 group-hover:-translate-y-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  />
                  <p className="text-white font-black text-sm">
                    اسحب الملفات هنا أو اضغط للاختيار من جهازك
                  </p>
                  <p className="text-slate-300 font-extrabold text-xs mt-1.5">
                    يدعم رفع أكثر من ملف (الحد الأقصى الإجمالي الموصى به 20MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    setSelectedFiles((prev) => [
                      ...prev,
                      ...Array.from(e.target.files || []),
                    ]);
                    setUploadError("");
                  }}
                />

                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 bg-[#0a1628]/95 border border-amber-500/30 rounded-xl flex items-center justify-between shadow-[0_0_10px_rgba(245,158,11,0.08)]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <LucideFile className="w-4 h-4 text-amber-400 shrink-0 drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]" />
                          <span className="text-white text-xs font-bold truncate">
                            {f.name}
                          </span>
                          <span className="text-[#3b82f6] font-black text-[10px] shrink-0">
                            {formatFileSize(f.size)}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedFiles((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
                          className="text-slate-400 hover:text-red-400 p-0.5 shrink-0 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* شريط التقدم */}
              {isUploading && (
                <div className="space-y-1 bg-black/20 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-amber-400 font-black animate-pulse">
                      جاري رفع وتأمين المستندات...
                    </span>
                    <span className="text-white font-black">{uploadProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400
                      rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2.5
                    bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3.5 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.55)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      رفع {selectedFiles.length} ملفات...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4.5 h-4.5 text-slate-950" />
                      رفع وتشفير المستندات
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setUploadModal(null);
                    resetUploadForm();
                  }}
                  className="px-6 py-3.5 border border-slate-600 font-bold text-slate-300
                    hover:text-white hover:border-white rounded-xl transition-all duration-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* عارض المستندات */}
      {viewerDoc && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex flex-col"
          dir="rtl"
        >
          <div
            className="flex items-center justify-between px-6 py-4
            bg-[#0a1628] border-b border-slate-700 shrink-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Scale className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {viewerDoc.document_name}
                </p>
                <p className="text-amber-400 text-xs">
                  #{viewerDoc.case_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
                className="flex items-center gap-2 px-4 py-2
                bg-emerald-600 hover:bg-emerald-500 text-white
                text-sm font-bold rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                تحميل
              </button>
              <button
                onClick={() => setViewerDoc(null)}
                className="p-2 text-slate-400 hover:text-white
                  hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {viewerDoc.file_url ? (
              viewerDoc.file_type?.includes("pdf") ? (
                <iframe
                  src={viewerDoc.file_url + "#toolbar=1"}
                  className="w-full h-full max-w-5xl rounded-xl border border-slate-700"
                  title={viewerDoc.document_name}
                />
              ) : viewerDoc.file_type?.startsWith("image/") ? (
                <img
                  src={viewerDoc.file_url}
                  alt={viewerDoc.document_name}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              ) : (
                <div className="text-center">
                  <LucideFile className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-bold mb-4">
                    {viewerDoc.document_name}
                  </p>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = viewerDoc.file_url;
                      a.download = viewerDoc.document_name;
                      a.click();
                    }}
                    className="flex items-center gap-2 mx-auto px-6 py-3
                    bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
                  >
                    <Download className="w-4 h-4" />
                    تحميل الملف
                  </button>
                </div>
              )
            ) : (
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-white font-bold">رابط الملف غير متوفر</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* رسالة نجاح الحذف */}
      {deleteSuccess && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center
            gap-3 px-5 py-3.5 bg-emerald-700 border border-emerald-600
            rounded-2xl shadow-2xl shadow-emerald-900/50
            animate-in slide-in-from-bottom-4 duration-300"
          dir="rtl"
        >
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <div>
            <p className="text-white font-black text-sm">تم الحذف بنجاح</p>
            <p className="text-emerald-200 text-xs truncate max-w-[200px]">
              "{deleteSuccess}"
            </p>
          </div>
        </div>
      )}

      {/* ===== نافذة الذكاء الاصطناعي القانوني ===== */}
      {aiPanel && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md
            flex"
          dir="rtl"
        >
          {/* ===== الشريط الجانبي ===== */}
          <div
            className="w-72 bg-[#0a1628] border-l border-slate-800
            flex flex-col shrink-0 shadow-2xl"
          >
            {/* رأس الشريط */}
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="p-2 bg-purple-500/15 rounded-xl
                  border border-purple-500/25"
                >
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm">
                    المحلل القانوني AI
                  </h3>
                  <p className="text-slate-500 text-[10px]">
                    مدعوم بـ Gemini — الأنظمة السعودية
                  </p>
                </div>
              </div>

              {/* معلومات القضية */}
              <div
                className="bg-[#050e21] rounded-xl p-3 border
                border-slate-800"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-400 text-xs font-mono font-bold">
                    #{aiPanel.doc.case_number}
                  </span>
                </div>
                <p className="text-white text-xs font-bold truncate">
                  {aiPanel.doc.document_name}
                </p>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  {
                    DOC_TYPES.find((t) => t.value === aiPanel.doc.document_type)
                      ?.label
                  }
                </p>
                {aiPanel.doc.judgment_type && (
                  <span
                    className="inline-block mt-1 px-2 py-0.5
                    bg-amber-500/10 text-amber-400 text-[10px]
                    rounded-lg border border-amber-500/20 font-bold"
                  >
                    {aiPanel.doc.judgment_type}
                  </span>
                )}
              </div>
            </div>

            {/* خيارات التحليل */}
            <div className="p-4 flex-1 overflow-y-auto">
              <p
                className="text-slate-500 text-[10px] font-black
                uppercase tracking-widest mb-3"
              >
                نوع المخرج المطلوب:
              </p>

              <div className="space-y-2">
                {[
                  {
                    mode: "analyze" as const,
                    label: "تحليل القضية",
                    desc: "تحليل شامل للوقائع والمستندات والفرص",
                    icon: Scale,
                    activeClass: "bg-amber-600 border-amber-500 text-white",
                    inactiveClass:
                      "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
                  },
                  {
                    mode: "lawsuit" as const,
                    label: "صحيفة دعوى",
                    desc: "صياغة وفق نظام المرافعات السعودي",
                    icon: FileText,
                    activeClass: "bg-blue-600 border-blue-500 text-white",
                    inactiveClass:
                      "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20",
                  },
                  {
                    mode: "memo" as const,
                    label: "مذكرة جوابية",
                    desc: "دفوع قانونية متوافقة مع الأنظمة",
                    icon: MessageSquare,
                    activeClass: "bg-emerald-600 border-emerald-500 text-white",
                    inactiveClass:
                      "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20",
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const isActive = aiPanel.mode === option.mode;
                  return (
                    <button
                      key={option.mode}
                      onClick={() => {
                        setAiPanel((prev) =>
                          prev ? { ...prev, mode: option.mode } : null,
                        );
                        setAiOutput("");
                        setAiError("");
                      }}
                      className={`w-full text-right p-3.5 rounded-xl
                        border-2 transition-all ${
                          isActive ? option.activeClass : option.inactiveClass
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-black text-sm">
                          {option.label}
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          isActive ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {option.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* تنبيه الأنظمة */}
              <div
                className="mt-4 p-3 bg-slate-900/50 rounded-xl
                border border-slate-800"
              >
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  🇸🇦 الوثائق مصاغة وفق الأنظمة السعودية: نظام المرافعات الشرعية،
                  نظام العمل، نظام التجارة، نظام الأحوال الشخصية
                </p>
              </div>
            </div>

            {/* أزرار التشغيل */}
            <div className="p-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => callLegalAI(aiPanel.doc, aiPanel.mode)}
                disabled={isAiLoading}
                className="w-full flex items-center justify-center gap-2
                  bg-purple-600 hover:bg-purple-500 disabled:opacity-50
                  text-white font-black py-3 rounded-xl transition-all
                  shadow-lg shadow-purple-900/30
                  disabled:cursor-not-allowed"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارٍ التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {aiPanel.mode === "analyze" && "تحليل القضية"}
                    {aiPanel.mode === "lawsuit" && "صياغة صحيفة الدعوى"}
                    {aiPanel.mode === "memo" && "صياغة المذكرة الجوابية"}
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setAiPanel(null);
                  setAiOutput("");
                  setAiError("");
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-300
                  text-sm transition-colors rounded-xl hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>

          {/* ===== منطقة النتائج ===== */}
          <div className="flex-1 flex flex-col bg-[#050e21] min-w-0">
            {/* رأس منطقة النتائج */}
            <div
              className="flex items-center justify-between px-6 py-4
              border-b border-slate-800 shrink-0 bg-[#0a1628]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="p-2 bg-purple-500/10 rounded-xl
                  border border-purple-500/20 shrink-0"
                >
                  {aiPanel.mode === "analyze" && (
                    <Scale className="w-5 h-5 text-amber-400" />
                  )}
                  {aiPanel.mode === "lawsuit" && (
                    <FileText className="w-5 h-5 text-blue-400" />
                  )}
                  {aiPanel.mode === "memo" && (
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-white font-black truncate">
                    {aiPanel.mode === "analyze" && "تحليل القضية القانوني"}
                    {aiPanel.mode === "lawsuit" && "صحيفة الدعوى القضائية"}
                    {aiPanel.mode === "memo" && "المذكرة الجوابية"}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    القضية #{aiPanel.doc.case_number} |
                    {aiPanel.doc.case_name || ""}
                  </p>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              {aiOutput && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(aiOutput);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2500);
                    }}
                    className="flex items-center gap-2 px-4 py-2
                      bg-slate-800 hover:bg-slate-700 text-slate-300
                      hover:text-white text-sm font-bold rounded-xl
                      transition-colors border border-slate-700"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        نسخ
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const titles = {
                        analyze: "تحليل-القضية",
                        lawsuit: "صحيفة-الدعوى",
                        memo: "المذكرة-الجوابية",
                      };
                      const fileName = `${titles[aiPanel.mode]}-${aiPanel.doc.case_number}.txt`;
                      const content =
                        `${fileName}\n` +
                        `القضية: ${aiPanel.doc.case_number}\n` +
                        `التاريخ: ${new Date().toLocaleDateString("ar-SA")}\n` +
                        `${"─".repeat(50)}\n\n${aiOutput}`;

                      const blob = new Blob([content], {
                        type: "text/plain;charset=utf-8",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = fileName;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 px-4 py-2
                      bg-amber-600 hover:bg-amber-500 text-white
                      text-sm font-bold rounded-xl transition-colors
                      shadow-lg shadow-amber-900/20"
                  >
                    <Download className="w-4 h-4" />
                    تحميل
                  </button>
                </div>
              )}
            </div>

            {/* محتوى المنطقة */}
            <div className="flex-1 overflow-auto p-6">
              {/* الحالة الابتدائية */}
              {!aiOutput && !isAiLoading && !aiError && (
                <div
                  className="flex flex-col items-center justify-center
                  h-full text-center py-10"
                >
                  <div
                    className="w-24 h-24 bg-purple-500/10 rounded-full
                    flex items-center justify-center mb-6
                    border-2 border-purple-500/20 border-dashed"
                  >
                    <Sparkles className="w-12 h-12 text-purple-400/60" />
                  </div>
                  <h3 className="text-white font-black text-xl mb-2">
                    المحلل القانوني الذكي
                  </h3>
                  <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
                    يحلل القضية استناداً إلى جميع مستنداتها وبياناتها ويصيغ
                    الوثائق القانونية متوافقةً مع الأنظمة السعودية
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-lg w-full">
                    {[
                      {
                        icon: Scale,
                        label: "تحليل شامل",
                        desc: "وقائع وفرص وتوصيات",
                        color: "text-amber-400",
                        bg: "bg-amber-500/10",
                        border: "border-amber-500/20",
                      },
                      {
                        icon: FileText,
                        label: "صحيفة دعوى",
                        desc: "نظام المرافعات السعودي",
                        color: "text-blue-400",
                        bg: "bg-blue-500/10",
                        border: "border-blue-500/20",
                      },
                      {
                        icon: MessageSquare,
                        label: "مذكرة جوابية",
                        desc: "دفوع قانونية محكمة",
                        color: "text-emerald-400",
                        bg: "bg-emerald-500/10",
                        border: "border-emerald-500/20",
                      },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center gap-2 p-4
                            rounded-xl border ${item.bg} ${item.border}`}
                        >
                          <Icon className={`w-7 h-7 ${item.color}`} />
                          <p className={`font-bold text-sm ${item.color}`}>
                            {item.label}
                          </p>
                          <p className="text-slate-600 text-xs text-center">
                            {item.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-slate-700 text-xs mt-8">
                    اختر نوع التحليل من القائمة اليسرى ثم اضغط "تشغيل"
                  </p>
                </div>
              )}

              {/* حالة التحميل */}
              {isAiLoading && (
                <div
                  className="flex flex-col items-center justify-center
                  h-full"
                >
                  <div className="relative mb-6">
                    <div
                      className="w-20 h-20 border-4 border-purple-900
                      border-t-purple-500 rounded-full animate-spin"
                    />
                    <div
                      className="absolute inset-0 flex items-center
                      justify-center"
                    >
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-white font-black text-lg mb-2">
                    {aiPanel.mode === "analyze" && "يحلل القضية..."}
                    {aiPanel.mode === "lawsuit" && "يصيغ صحيفة الدعوى..."}
                    {aiPanel.mode === "memo" && "يكتب المذكرة الجوابية..."}
                  </p>
                  <p className="text-slate-500 text-sm mb-1">
                    يستند إلى وقائع القضية والأنظمة السعودية
                  </p>
                  <p className="text-slate-600 text-xs">يستغرق 15-40 ثانية</p>
                  <div className="flex gap-1.5 mt-6">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 bg-purple-500 rounded-full
                          animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* حالة الخطأ */}
              {aiError && !isAiLoading && (
                <div
                  className="flex flex-col items-center justify-center
                  h-full"
                >
                  <div
                    className="w-16 h-16 bg-red-500/10 rounded-full
                    flex items-center justify-center mb-4
                    border border-red-500/20"
                  >
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-white font-black text-lg mb-2">
                    فشل التحليل
                  </p>
                  <p className="text-red-400 text-sm text-center max-w-sm mb-6">
                    {aiError}
                  </p>
                  <button
                    onClick={() => callLegalAI(aiPanel.doc, aiPanel.mode)}
                    className="flex items-center gap-2 px-6 py-3
                      bg-purple-600 hover:bg-purple-500 text-white
                      font-bold rounded-xl transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {/* النتيجة */}
              {aiOutput && !isAiLoading && (
                <div className="max-w-4xl mx-auto">
                  {/* شارة النجاح */}
                  <div
                    className="flex items-center gap-3 mb-6 pb-4
                    border-b border-slate-800"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-emerald-400 font-black text-sm">
                        تم التحليل بنجاح — Gemini AI
                      </p>
                      <p className="text-slate-600 text-xs">
                        متوافق مع الأنظمة والقوانين السعودية |
                        {new Date().toLocaleString("ar-SA")}
                      </p>
                    </div>
                  </div>

                  {/* النص المولّد */}
                  <div
                    className="bg-[#0a1628] border border-slate-800
                      rounded-2xl p-6 leading-loose text-slate-200 text-sm
                      whitespace-pre-wrap"
                    style={{
                      direction: "rtl",
                      fontFamily: '"Tajawal", "Cairo", Arial, sans-serif',
                      lineHeight: "2.2",
                    }}
                  >
                    {aiOutput.split("\n").map((line, i) => {
                      // عناوين رئيسية
                      if (
                        /^#{1,3}\s/.test(line) ||
                        /^[أ-ي]+اً:/.test(line) ||
                        (line.startsWith("**") && line.endsWith("**"))
                      ) {
                        const clean = line
                          .replace(/^#+\s/, "")
                          .replace(/^\*\*|\*\*$/g, "");
                        return (
                          <p
                            key={i}
                            className="text-amber-400 font-black text-base
                              mt-8 mb-3 pb-2 border-b border-amber-500/20
                              border-r-4 border-r-amber-500 pr-4"
                          >
                            {clean}
                          </p>
                        );
                      }
                      // السطور الفاصلة
                      if (/^─{3,}/.test(line) || /^={3,}/.test(line)) {
                        return <hr key={i} className="border-slate-800 my-4" />;
                      }
                      // نقاط القوائم
                      if (/^[-•*]\s/.test(line) || /^\d+\.\s/.test(line)) {
                        return (
                          <p
                            key={i}
                            className="text-slate-300 mr-6 mb-1.5
                              flex gap-2"
                          >
                            <span className="text-amber-500 shrink-0">◈</span>
                            <span>{line.replace(/^[-•*\d.]\s/, "")}</span>
                          </p>
                        );
                      }
                      // سطر فارغ
                      if (!line.trim()) return <br key={i} />;
                      // النص العادي
                      return (
                        <p key={i} className="text-slate-200 mb-1">
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* تنبيه قانوني */}
                  <div
                    className="flex items-start gap-3 mt-5 p-4
                    bg-amber-500/5 border border-amber-500/15 rounded-xl"
                  >
                    <AlertCircle
                      className="w-4 h-4 text-amber-500
                      mt-0.5 shrink-0"
                    />
                    <p className="text-amber-400/70 text-xs leading-relaxed">
                      هذا التحليل مولّد بالذكاء الاصطناعي بناءً على البيانات
                      المتاحة. يُنصح بمراجعة المحامي المسؤول قبل تقديم أي وثيقة
                      للمحكمة، إذ قد تتطلب التفاصيل الدقيقة تعديلات إضافية تبعاً
                      لمستجدات القضية.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
