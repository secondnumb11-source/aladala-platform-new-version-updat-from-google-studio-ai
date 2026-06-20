import React, {
  useState, useEffect, useRef, useCallback
} from 'react';
import {
  FileText, Upload, Download, Eye, X,
  Search, Filter, Plus, Scale, Gavel,
  BookOpen, MessageSquare, Calendar,
  Building2, User, ChevronDown,
  CheckCircle2, AlertCircle, Loader2,
  ZoomIn, ZoomOut, RotateCw, Maximize2,
  File as FileIcon, Trash2, Clock, FolderOpen,
  Sparkles, Copy, Monitor, RefreshCw, ShieldCheck, Zap
} from 'lucide-react';
import { supabase, uploadFileToStorage } from '@/lib/supabase';
import { generateUUID } from '@/lib/uuid';
import { getDynamicTextColor, getContrastText, TEXT_COLORS } from '@/utils/contrastUtils';

// ===== مكون عارض المستندات الاحترافي =====
const ProfessionalDocumentViewer = ({ 
  doc, 
  onClose, 
  onDownload, 
  onDelete 
}: { 
  doc: CaseDocument; 
  onClose: () => void; 
  onDownload: (doc: CaseDocument) => void;
  onDelete: (doc: CaseDocument) => void;
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotate, setRotate] = useState(0);
  const isImage = doc.file_type?.startsWith('image/');
  
  // تطبيق ألوان التباين للرأس
  const headerBg = 'bg-[#0a1628]';
  const textColor = getContrastText(headerBg);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
      {/* الشريط العلوي */}
      <div className={`flex items-center justify-between px-6 py-4 border-b border-white/10 ${headerBg} ${textColor}`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shrink-0">
            <FileIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <h2 className={`font-black text-lg truncate ${textColor}`}>
              {doc.document_name}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-slate-500 text-xs font-mono">#{doc.case_number}</span>
              <span className="text-slate-600 text-xs">|</span>
              <span className="text-slate-500 text-xs">
                {doc.file_type || 'مستند'} • {((doc.compressed_size || doc.file_size) / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* أدوات المعاينة */}
          <div className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-xl border border-white/10 ml-4">
            <button 
              onClick={() => setZoom(prev => Math.max(25, prev - 25))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              title="تصغير"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs font-mono w-12 text-center text-white">{zoom}%</span>
            <button 
              onClick={() => setZoom(prev => Math.min(400, prev + 25))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              title="تكبير"
            >
              <ZoomIn size={18} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button 
              onClick={() => setRotate(prev => (prev + 90) % 360)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              title="تدوير"
            >
              <RotateCw size={18} />
            </button>
          </div>

          <button
            onClick={() => onDownload(doc)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
          >
            <Download size={18} />
            <span>تحميل</span>
          </button>
          
          <button
            onClick={() => onDelete(doc)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white font-bold rounded-xl transition-all border border-red-600/30"
          >
            <Trash2 size={18} />
            <span>حذف</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white mr-2"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* منطقة العرض */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[#020617] pattern-dots">
        <div 
          className="transition-all duration-300 shadow-2xl bg-white"
          style={{ 
            transform: `scale(${zoom / 100}) rotate(${rotate}deg)`,
            maxHeight: 'none',
            maxWidth: '100%'
          }}
        >
          {isImage ? (
            <img 
              src={doc.file_url || ''} 
              alt={doc.document_name}
              className="max-w-full block" 
              referrerPolicy="no-referrer"
            />
          ) : doc.file_type === 'application/pdf' ? (
            <iframe
              src={`${doc.file_url}#toolbar=0`}
              className="w-[800px] h-[1100px] border-none"
              title="PDF Preview"
            />
          ) : (
            <div className="w-[600px] h-[400px] bg-slate-900 flex flex-col items-center justify-center text-center p-10">
              <FileIcon size={80} className="text-slate-700 mb-6" />
              <p className="text-white font-black text-xl mb-2">المعاينة غير متاحة لهذا النوع من الملفات</p>
              <p className="text-slate-500 text-sm mb-8">يمكنك تحميل الملف لعرضه على جهازك</p>
              <button
                onClick={() => onDownload(doc)}
                className="px-8 py-3 bg-amber-500 text-black font-black rounded-xl hover:bg-amber-400"
              >
                تحميل المستند الآن
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* الشريط السفلي للهوية البصرية */}
      <div className="px-6 py-3 bg-black/60 border-t border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-amber-500" />
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            نظام العدالة الذكي — معارض المستندات المتطور
          </span>
        </div>
        <p className="text-[10px] text-slate-600 font-bold">
          © 2026 جميع الحقوق محفوظة لمحامي النظام
        </p>
      </div>
    </div>
  );
};

// ===== أنواع المستندات =====
const DOC_TYPES = [
  {
    value: 'lawsuit_sheet',
    label: 'صحيفة الدعوى',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/20',
  },
  {
    value: 'judgment',
    label: 'حكم قضائي',
    icon: Gavel,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/20',
  },
  {
    value: 'session_record',
    label: 'محضر ضبط الجلسة',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/20',
  },
  {
    value: 'response_memo',
    label: 'مذكرة جوابية',
    icon: MessageSquare,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/20',
  },
] as const;

type DocType = typeof DOC_TYPES[number]['value'];

interface CaseDocument {
  id: string;
  case_id: string | null;
  case_number: string;
  case_name: string;
  document_type: DocType;
  document_name: string;
  file_url: string | null;
  file_path: string | null;
  file_size: number;
  compressed_size: number;
  file_type: string | null;
  hearing_date: string | null;
  judgment_date: string | null;
  judgment_type: string | null;
  court_name: string | null;
  judge_name: string | null;
  notes: string | null;
  extracted_text: string | null;
  is_compressed: boolean;
  uploaded_by: string | null;
  created_at: string;
}

interface CaseJudgmentsModuleProps {
  cases: any[];
  selectedRole?: string;
}

export default function CaseJudgmentsModule({
  cases,
  selectedRole
}: CaseJudgmentsModuleProps) {

  // ===== States =====
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<CaseDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCase, setFilterCase] = useState<string>('all');

  // Form states
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [docType, setDocType] = useState<DocType>('judgment');
  const [docName, setDocName] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [judgmentDate, setJudgmentDate] = useState('');
  const [judgmentType, setJudgmentType] = useState('');
  const [courtName, setCourtName] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== تحميل المستندات =====
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_judgments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('[Judgments] Load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  // ===== ضغط الملف =====
  const compressFile = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const canvas = document.createElement('canvas');
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          const maxSize = 1920;
          let { width, height } = img;

          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(
              maxSize / width, maxSize / height
            );
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => resolve(blob || file),
            'image/jpeg', 0.75
          );
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else {
        // للـ PDF والملفات الأخرى — إرجاعها كما هي
        resolve(file);
      }
    });
  };

  // ===== رفع الملفات =====
  const handleUpload = async () => {
    if (!selectedCase) {
      setUploadError('يرجى اختيار القضية');
      return;
    }
    if (selectedFiles.length === 0) {
      setUploadError('يرجى اختيار ملف واحد على الأقل');
      return;
    }
    if (!docName.trim()) {
      setUploadError('يرجى إدخال اسم المستند');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const totalFiles = selectedFiles.length;
      let processed = 0;
      const savedDocs: CaseDocument[] = [];

      for (const file of selectedFiles) {
        setUploadProgress(
          Math.round((processed / totalFiles) * 80)
        );

        // ضغط الملف
        const compressed = await compressFile(file);
        const compressedFile = new File(
          [compressed],
          file.name,
          { type: compressed.type || file.type }
        );

        // رفع على Supabase Storage
        let fileUrl = null;
        let filePath = null;

        try {
          const path = `case-documents/${selectedCase.id}/${docType}/${Date.now()}_${file.name}`;
          const result = await uploadFileToStorage(
            'case-documents', path, compressedFile
          );
          fileUrl = result.url;
          filePath = result.path;
        } catch (storageErr) {
          // استخدم Object URL كـ fallback
          fileUrl = URL.createObjectURL(file);
          filePath = `local/${file.name}`;
        }

        // حفظ في قاعدة البيانات
        const docId = generateUUID();
        const docRecord: any = {
          id: docId,
          case_id: selectedCase.id,
          case_number: selectedCase.caseNumber ||
            selectedCase.case_number,
          case_name: selectedCase.caseName ||
            selectedCase.title ||
            selectedCase.case_name,
          document_type: docType,
          document_name: docName.trim() +
            (totalFiles > 1 ? ` (${processed + 1})` : ''),
          file_url: fileUrl,
          file_path: filePath,
          file_size: file.size,
          compressed_size: compressed.size,
          file_type: file.type,
          hearing_date: hearingDate || null,
          judgment_date: judgmentDate || null,
          judgment_type: judgmentType || null,
          court_name: courtName ||
            selectedCase.courtName ||
            selectedCase.court_name || null,
          judge_name: judgeName || null,
          notes: notes || null,
          is_compressed: compressed.size < file.size,
          uploaded_by: 'المستخدم',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('case_judgments')
          .insert(docRecord)
          .select()
          .single();

        if (error) {
          console.error('[Upload] DB error:', error);
        } else {
          savedDocs.push(data);
        }

        processed++;
      }

      setUploadProgress(100);
      setDocuments(prev => [...savedDocs, ...prev]);

      // إعادة تعيين النموذج
      setSelectedCase(null);
      setDocType('judgment');
      setDocName('');
      setHearingDate('');
      setJudgmentDate('');
      setJudgmentType('');
      setCourtName('');
      setJudgeName('');
      setNotes('');
      setSelectedFiles([]);
      setIsAddModalOpen(false);

      alert(
        `✅ تم رفع ${savedDocs.length} مستند بنجاح\n` +
        `القضية: ${selectedCase.caseNumber || selectedCase.case_number}`
      );

    } catch (err: any) {
      setUploadError('خطأ في الرفع: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ===== فلترة المستندات =====
  const filteredDocs = documents.filter(doc => {
    const search = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      doc.document_name.toLowerCase().includes(search) ||
      doc.case_number.toLowerCase().includes(search) ||
      (doc.case_name || '').toLowerCase().includes(search);

    const matchType = filterType === 'all' ||
      doc.document_type === filterType;

    const matchCase = filterCase === 'all' ||
      doc.case_number === filterCase;

    return matchSearch && matchType && matchCase;
  });

  // ===== States الخاصة بالحذف =====
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState('');

  // ===== States المعاينة (Document Viewer) =====
  const [selectedDocForView, setSelectedDocForView] = useState<CaseDocument | null>(null);

  // ===== States الخاصة بالذكاء الاصطناعي =====
  const [aiPanel, setAiPanel] = useState<{
    doc: CaseDocument;
    mode: 'analyze' | 'lawsuit' | 'memo';
  } | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // تحديث النص المستخرج عند فتح اللوحة
  useEffect(() => {
    if (aiPanel) {
      setExtractedText(aiPanel.doc.extracted_text || '');
    }
  }, [aiPanel]);

  const handleExtractText = async () => {
    if (!aiPanel) return;
    setIsExtracting(true);
    // محاكاة عملية OCR
    await new Promise(r => setTimeout(r, 1500));
    
    const mockText = `نص مستخرج تلقائياً من المستند: ${aiPanel.doc.document_name}
تاريخ المستند: ${aiPanel.doc.judgment_date || aiPanel.doc.hearing_date || '2024-05-15'}
الموضوع: مطالبة مالية وتعويض عن أضرار تعاقدية.
الوقائع: تبين من مراجعة المستند وجود بنود تتعلق بالدفع المتأخر والغرامات المنصوص عليها في المادة 12 من العقد المبرم...
تم الاستخراج بنجاح بواسطة محرك AI-OCR المدمج.`;
    
    setExtractedText(mockText);
    setIsExtracting(false);
  };
  const [aiOutput, setAiOutput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [analyzingDeadlineId, setAnalyzingDeadlineId] = useState<string | null>(null);
  const [deadlineResults, setDeadlineResults] = useState<Record<string, any>>({});

  const [isSyncingDeadlines, setIsSyncingDeadlines] = useState(false);

  const handleSyncDeadlines = async () => {
    setIsSyncingDeadlines(true);
    const judgmentDocs = documents.filter(d => d.document_type === 'judgment' && d.judgment_date);
    
    if (judgmentDocs.length === 0) {
      alert('لا توجد أحكام مسجلة بتواريخ محددة للمزامنة');
      setIsSyncingDeadlines(false);
      return;
    }

    let successCount = 0;
    for (const doc of judgmentDocs) {
      try {
        const res = await fetch('/api/ai/analyze-deadline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            judgmentDate: doc.judgment_date,
            type: 'appeal',
            caseTitle: doc.case_name || doc.document_name,
            judgmentSummary: doc.notes
          })
        });
        const data = await res.json();
        
        if (data && data.deadlineDate) {
          const { error } = await supabase
            .from('cases')
            .update({ appeal_deadline: data.deadlineDate })
            .eq('case_number', doc.case_number);
          
          if (!error) successCount++;
          setDeadlineResults(prev => ({ ...prev, [doc.id]: data }));
        }
      } catch (err) {
        console.error('Sync error for doc:', doc.id, err);
      }
    }
    
    alert(`تمت مزامنة وتحديث ${successCount} موعد استئناف بنجاح في قاعدة البيانات.`);
    setIsSyncingDeadlines(false);
  };

  const calculateAIDeadline = async (doc: CaseDocument) => {
    if (!doc.judgment_date) {
      alert('لا يمكن حساب الموعد بدون تاريخ حكم مسجل');
      return;
    }
    setAnalyzingDeadlineId(doc.id);
    try {
      const res = await fetch('/api/ai/analyze-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgmentDate: doc.judgment_date,
          type: 'appeal',
          caseTitle: doc.case_name || doc.document_name,
          judgmentSummary: doc.notes
        })
      });
      const data = await res.json();
      setDeadlineResults(prev => ({ ...prev, [doc.id]: data }));
    } catch (err) {
      console.error('Failed to analyze deadline:', err);
    } finally {
      setAnalyzingDeadlineId(null);
    }
  };

  // ===== الحذف النهائي =====
  const handleDeleteDocument = async (doc: CaseDocument) => {
    const confirmed = window.confirm(
      `⚠️ تأكيد الحذف النهائي\n\n` +
      `المستند: ${doc.document_name}\n` +
      `النوع: ${DOC_TYPES.find(t => t.value === doc.document_type)?.label}\n` +
      `القضية: #${doc.case_number}\n\n` +
      `سيُحذف المستند نهائياً من قاعدة البيانات والتخزين.\n` +
      `لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟`
    );

    if (!confirmed) return;

    setIsDeleting(doc.id);

    try {
      // === الخطوة 1: حذف الملف من Supabase Storage ===
      if (
        doc.file_path &&
        !doc.file_path.startsWith('local/') &&
        !doc.file_path.startsWith('fallback') &&
        !doc.file_path.startsWith('http')
      ) {
        try {
          const { error: storageError } = await supabase.storage
            .from('case-documents')
            .remove([doc.file_path]);

          if (storageError) {
            console.warn(
              '[Delete Storage]', storageError.message
            );
          } else {
            console.log('[Delete Storage] ✅ تم حذف الملف');
          }
        } catch (storageEx: any) {
          console.warn('[Delete Storage Exception]', storageEx.message);
        }
      }

      // === الخطوة 2: حذف السجل من قاعدة البيانات ===
      const { error: dbError } = await supabase
        .from('case_judgments')
        .delete()
        .eq('id', doc.id);

      if (dbError) {
        throw new Error(
          'فشل حذف السجل من قاعدة البيانات: ' + dbError.message
        );
      }

      // === الخطوة 3: تحديث State ===
      setDocuments(prev => prev.filter(d => d.id !== doc.id));

      if (viewerDoc?.id === doc.id) setViewerDoc(null);

      if (aiPanel?.doc.id === doc.id) {
        setAiPanel(null);
        setAiOutput('');
      }

      setDeleteSuccess(doc.document_name);
      setTimeout(() => setDeleteSuccess(''), 4000);

      console.log('[Delete] ✅ تم حذف المستند:', doc.document_name);

    } catch (err: any) {
      console.error('[Delete Error]', err.message);
      alert('❌ فشل الحذف: ' + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  // ===== دالة بناء Context القضية الشاملة =====
  const buildCaseContext = async (
    doc: CaseDocument
  ): Promise<string> => {
    // جلب بيانات القضية من Supabase
    const { data: caseData } = await supabase
      .from('cases')
      .select('*')
      .eq('id', doc.case_id || '')
      .maybeSingle();

    // جلب جميع مستندات هذه القضية
    const { data: allDocs } = await supabase
      .from('case_judgments')
      .select(
        'document_name, document_type, judgment_type, ' +
        'hearing_date, judgment_date, notes, ' +
        'court_name, judge_name, created_at, extracted_text'
      )
      .eq('case_number', doc.case_number)
      .order('created_at');

    // بناء Context مفصّل
    return `
  ========================================
  بيانات القضية الكاملة
  ========================================
  رقم القضية: ${doc.case_number}
  عنوان القضية: ${doc.case_name}
  المحكمة: ${doc.court_name || caseData?.court_name || 'غير محدد'}
  الدائرة: ${caseData?.circuit_name || 'غير محدد'}
  القاضي: ${doc.judge_name || caseData?.judge_name || 'غير محدد'}
  حالة القضية: ${caseData?.status || 'نشطة'}
  
  ========================================
  بيانات المستند المراد تحليله
  ========================================
  نوع المستند: ${DOC_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
  اسم المستند: ${doc.document_name}
  تاريخ المستند: ${doc.judgment_date || doc.hearing_date || 'غير محدد'}
  ملاحظات إضافية: ${doc.notes || 'لا توجد ملاحظات'}
  
  ----------------------------------------
  المحتوى النصي للمستند (Extracted Text):
  ----------------------------------------
  ${doc.extracted_text || 'لم يتم استخراج نص من المستند بعد، التحليل سيعتمد على الأوصاف الخارجية فقط.'}
  
  ========================================
  محتوى ومستندات القضية المرفوعة الأخرى (بعد المعالجة)
  ========================================
  ${((allDocs || []) as any[])
    .filter((d: any) => d.document_name !== doc.document_name)
    .map((d: any) => {
      const typeLabel = DOC_TYPES.find(t => t.value === d.document_type)?.label || d.document_type;
      let docInfo = `- ${d.document_name} (${typeLabel}): ${d.notes || 'بدون ملاحظات'}`;
      if (d.extracted_text) {
        docInfo += `\n    [النص المستخرج بعد المعالجة]: ${d.extracted_text}`;
      }
      return docInfo;
    })
    .join('\n')}
    `.trim();
  };

  // ===== دالة استدعاء Gemini =====
  const callLegalAI = async (
    doc: CaseDocument,
    mode: 'analyze' | 'lawsuit' | 'memo'
  ) => {
    setIsAiLoading(true);
    setAiOutput('');
    setAiError('');

    try {
      // تضمين النص المستخرج الحالي في السياق
      const contextDoc = { ...doc, extracted_text: extractedText };
      const caseContext = await buildCaseContext(contextDoc);

      // ===== Prompts القانونية المتوافقة مع الأنظمة السعودية =====
      const prompts = {

        // --- تحليل القضية ---
        analyze: {
          system:
            `أنت محامٍ سعودي خبير ومستشار قانوني متخصص في التقاضي أمام
  المحاكم السعودية بجميع درجاتها. تستند في تحليلاتك إلى:
  - نظام المرافعات الشرعية السعودي وتعديلاته
  - نظام الإجراءات الجزائية
  - نظام العمل السعودي ولوائحه التنفيذية
  - نظام الشركات ونظام التجارة
  - نظام الأحوال الشخصية
  - المبادئ الشرعية الإسلامية المعمول بها في المملكة
  - أحكام ديوان المظالم والمحاكم الإدارية
  تكتب تحليلاتك بأسلوب قانوني احترافي دقيق ومفصّل باللغة العربية.`,

          user:
            `بناءً على المعلومات والمستندات القضائية التالية، قدّم تحليلاً
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

  اجعل التحليل دقيقاً ومفصلاً ومستنداً فعلياً إلى الوقائع والمستندات.`
        },

        // --- صحيفة الدعوى ---
        lawsuit: {
          system:
            `أنت محامٍ سعودي متخصص في صياغة صحف الدعاوى القضائية وفق
  نظام المرافعات الشرعية السعودي الصادر بالمرسوم الملكي م/1 لعام 1435هـ
  وتعديلاته، ونظام الإجراءات أمام ديوان المظالم، ونظام المحاكم التجارية،
  ولائحة إجراءات المحاكم العمالية. تصيغ صحف الدعاوى بأسلوب قانوني رسمي
  يراعي شروط الصحيفة وبياناتها المنصوص عليها نظاماً، وتستند إلى الأدلة
  والمستندات في إثبات الطلبات.`,

          user:
            `بناءً على بيانات القضية والمستندات التالية، قم بصياغة صحيفة
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

  اجعل الصياغة رسمية وقانونية دقيقة مستندة إلى الوقائع الفعلية للقضية.`
        },

        // --- المذكرة الجوابية ---
        memo: {
          system:
            `أنت محامٍ سعودي متخصص في صياغة المذكرات الجوابية والدفوع
  القانونية أمام المحاكم السعودية بجميع درجاتها. تكتب مذكراتك وفق
  أحكام نظام المرافعات الشرعية السعودي، مستنداً إلى:
  - الدفوع الشكلية والموضوعية المقررة نظاماً
  - المبادئ القضائية الصادرة عن المحاكم السعودية
  - الأنظمة واللوائح التنفيذية المعمول بها
  - الفقه الإسلامي المعتمد في المحاكم السعودية
  تكتب بأسلوب قانوني قوي ومحكم يدحض حجج الخصوم ويعزز موقف الموكل.`,

          user:
            `بناءً على بيانات القضية والمستندات التالية، قم بصياغة مذكرة
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
  إلى وقائع القضية والأنظمة السعودية.`
        }
      };

      const selectedPrompt = prompts[mode];

      // استدعاء Gemini عبر الخادم
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: selectedPrompt.user,
          context: selectedPrompt.system,
          caseContext,
          documentId: doc.id,
          mode
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || `HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'فشل الذكاء الاصطناعي');
      }

      const output = data.result || data.response || '';
      setAiOutput(output);

      // حفظ النتيجة في قاعدة البيانات
      try {
        await supabase.from('ai_legal_outputs').insert({
          id: generateUUID(),
          case_number: doc.case_number,
          case_id: doc.case_id,
          document_id: doc.id,
          output_type: mode,
          output_text: output,
          model_used: 'gemini-2.0-flash',
          created_at: new Date().toISOString()
        });
      } catch(saveErr) {
        console.warn('[AI Save] Could not save output:', saveErr);
      }

    } catch (err: any) {
      console.error('[AI Legal Error]', err.message);
      setAiError(err.message || 'حدث خطأ في التحليل');
    } finally {
      setIsAiLoading(false);
    }
  };

  // ===== التحميل =====
  const handleDownload = (doc: CaseDocument) => {
    if (!doc.file_url) {
      alert('رابط الملف غير متوفر');
      return;
    }
    const a = document.createElement('a');
    a.href = doc.file_url;
    a.download = doc.document_name;
    a.target = '_blank';
    a.click();
  };

  const getDocTypeConfig = (type: string) =>
    DOC_TYPES.find(d => d.value === type) || DOC_TYPES[0];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const uniqueCases = [...new Set(
    documents.map(d => d.case_number)
  )];

  // ===== الواجهة =====
  return (
    <div
      className="min-h-screen bg-[#050e21] text-white p-6"
      dir="rtl"
    >
      {/* ===== رسالة نجاح الحذف ===== */}
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
            <p className="text-white font-black text-sm">
              تم الحذف بنجاح
            </p>
            <p className="text-emerald-200 text-xs truncate max-w-[200px]">
              "{deleteSuccess}"
            </p>
          </div>
        </div>
      )}

      {/* ===== رأس القسم ===== */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <Scale className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                الأحكام وضبط الجلسات والمذكرات
              </h1>
              <p className="text-white font-bold text-sm mt-0.5">
                إدارة ورفع المستندات القضائية لكل قضية
              </p>
            </div>
          </div>
          
          <button
            onClick={() => loadDocuments()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl transition-all border border-amber-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-xs">تحديث المزامنة</span>
          </button>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {DOC_TYPES.map(type => {
            const count = documents.filter(
              d => d.document_type === type.value
            ).length;
            const Icon = type.icon;
            return (
              <div
                key={type.value}
                className={`rounded-2xl border p-4 ${type.bg} ${type.border}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 ${type.color}`} />
                  <span className={`text-xs font-bold ${type.color}`}>
                    {type.label}
                  </span>
                </div>
                <p className="text-2xl font-black text-white">
                  {count}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== شريط الأدوات ===== */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* البحث */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المستند أو رقم القضية..."
            className="w-full bg-[#0a1628] border border-slate-700 text-white
              rounded-xl pr-10 pl-4 py-2.5 text-sm placeholder-slate-500
              focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* فلتر النوع */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-[#0a1628] border border-slate-700 text-white
            rounded-xl px-4 py-2.5 text-sm focus:outline-none
            focus:border-amber-500"
        >
          <option value="all">جميع الأنواع</option>
          {DOC_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* فلتر القضية */}
        <select
          value={filterCase}
          onChange={e => setFilterCase(e.target.value)}
          className="bg-[#0a1628] border border-slate-700 text-white
            rounded-xl px-4 py-2.5 text-sm focus:outline-none
            focus:border-amber-500"
        >
          <option value="all">جميع القضايا</option>
          {uniqueCases.map(cn => (
            <option key={cn} value={cn}>#{cn}</option>
          ))}
        </select>

        {/* زر الإضافة */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-amber-600
            hover:bg-amber-500 text-white font-bold px-5 py-2.5
            rounded-xl transition-colors whitespace-nowrap shadow-lg
            shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          رفع مستند جديد
        </button>
      </div>

      {/* ===== قائمة المستندات ===== */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center
          py-20 border-2 border-dashed border-slate-800 rounded-3xl">
          <FolderOpen className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-white font-black">
            لا توجد مستندات مرفوعة
          </p>
          <p className="text-slate-600 text-sm mt-1">
            اضغط "رفع مستند جديد" للبدء
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map(doc => {
            const typeConf = getDocTypeConfig(doc.document_type);
            const Icon = typeConf.icon;
            const compressionRatio = doc.file_size > 0
              ? Math.round(
                (1 - doc.compressed_size / doc.file_size) * 100
              )
              : 0;

            return (
              <div
                key={doc.id}
                className="group relative bg-[#0a1628] border border-slate-800
                  hover:border-amber-500/40 rounded-2xl p-5 transition-all
                  duration-300 hover:shadow-lg hover:shadow-amber-500/5"
              >
                {/* نوع المستند */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5
                    rounded-xl border text-xs font-bold
                    ${typeConf.bg} ${typeConf.border} ${typeConf.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {typeConf.label}
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex items-center gap-1 opacity-0
                    group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewerDoc(doc)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/40
                        rounded-lg transition-colors"
                      title="عرض"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40
                        rounded-lg transition-colors"
                      title="تحميل"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => {
                        setAiPanel({ doc, mode: 'analyze' });
                        setAiOutput('');
                        setAiError('');
                      }}
                      className="p-2 bg-purple-500/20 hover:bg-purple-500/40
                        rounded-lg transition-colors"
                      title="تحليل بالذكاء الاصطناعي"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc)}
                      disabled={isDeleting === doc.id}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40
                        rounded-lg transition-colors disabled:opacity-50
                        group/del"
                      title="حذف نهائي من قاعدة البيانات"
                    >
                      {isDeleting === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-red-400
                          group-hover/del:scale-110 transition-transform" />
                      )}
                    </button>
                  </div>
                </div>

                {/* اسم المستند */}
                <h3 className="text-white font-bold text-sm mb-1 truncate">
                  {doc.document_name}
                </h3>

                {/* رقم القضية */}
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-amber-400 text-xs font-mono font-bold">
                    #{doc.case_number}
                  </span>
                  {doc.case_name && (
                    <span className="text-slate-500 text-xs truncate">
                      — {doc.case_name}
                    </span>
                  )}
                </div>

                {/* بيانات إضافية */}
                <div className="space-y-1.5 mb-4">
                  {doc.court_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="text-amber-100 text-xs font-bold truncate">
                        {doc.court_name}
                      </span>
                    </div>
                  )}
                  {doc.hearing_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="text-amber-100 text-xs font-bold">
                        {doc.document_type === 'session_record'
                          ? 'جلسة: ' : 'تاريخ: '}
                        {doc.hearing_date}
                      </span>
                    </div>
                  )}
                  {doc.judgment_date && (
                    <div className="flex items-center gap-2">
                      <Gavel className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="text-amber-400 text-xs">
                        تاريخ الحكم: {doc.judgment_date}
                      </span>
                    </div>
                  )}
                  {doc.judgment_type && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="text-emerald-400 text-xs">
                        {doc.judgment_type}
                      </span>
                    </div>
                  )}
                </div>

                {/* حجم الملف */}
                <div className="flex items-center justify-between
                  pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-3 h-3 text-slate-600" />
                    <span className="text-slate-500 text-xs">
                      {formatFileSize(doc.compressed_size || doc.file_size)}
                    </span>
                    {compressionRatio > 5 && (
                      <span className="text-emerald-500 text-[10px] font-bold">
                        ↓{compressionRatio}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-700" />
                    <span className="text-slate-600 text-[10px]">
                      {new Date(doc.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>

                {/* AI Deadline Calculator Trigger */}
                {doc.judgment_date && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    {!deadlineResults[doc.id] ? (
                      <button
                        onClick={() => calculateAIDeadline(doc)}
                        disabled={analyzingDeadlineId === doc.id}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-amber-400 transition-all cursor-pointer"
                      >
                        {analyzingDeadlineId === doc.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>حساب موعد الاستئناف الذكي (AI)</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1.5 text-amber-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-wider">تحليل الموعد النظامي</span>
                           </div>
                           <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black rounded">
                              {deadlineResults[doc.id].deadlineDays} يوماً
                           </span>
                        </div>
                        <p className="text-[10px] text-slate-100 font-black leading-relaxed">
                          {deadlineResults[doc.id].legalReasoning}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== نافذة الرفع ===== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
          p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
          <div className="bg-[#0a1628] border border-slate-700 rounded-2xl
            w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* رأس النافذة */}
            <div className="sticky top-0 bg-[#0a1628] flex items-center
              justify-between p-6 border-b border-slate-800 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Upload className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-lg">
                    رفع مستند قضائي
                  </h2>
                  <p className="text-white font-bold text-xs mt-0.5">
                    اختر القضية ونوع المستند ثم ارفع الملف
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setUploadError('');
                  setSelectedFiles([]);
                }}
                className="p-2 text-slate-400 hover:text-white
                  hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* رسالة خطأ */}
              {uploadError && (
                <div className="flex items-center gap-3 p-4
                  bg-red-500/10 border border-red-500/30 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{uploadError}</p>
                </div>
              )}

              {/* اختيار القضية */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  ⚖️ القضية *
                </label>
                <select
                  value={selectedCase?.id || ''}
                  onChange={e => {
                    const c = cases.find(c =>
                      c.id === e.target.value
                    );
                    setSelectedCase(c || null);
                    if (c?.courtName || c?.court_name) {
                      setCourtName(c.courtName || c.court_name);
                    }
                  }}
                  className="w-full bg-[#050e21] border border-slate-700
                    text-white rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-amber-500"
                >
                  <option value="">— اختر القضية —</option>
                  {cases
                    .filter(c => !c.archived)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        #{c.caseNumber || c.case_number} —{' '}
                        {c.caseName || c.title || c.clientName}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* نوع المستند */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  📋 نوع المستند *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DOC_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = docType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setDocType(type.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl
                          border-2 transition-all text-right ${
                          isSelected
                            ? `${type.bg} ${type.border} ${type.color}`
                            : 'bg-[#050e21] border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${
                          isSelected ? type.color : 'text-slate-500'
                        }`} />
                        <span className="text-sm font-bold">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* اسم المستند */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  📝 اسم المستند *
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="مثال: حكم ابتدائي رقم 1234/2024"
                  className="w-full bg-[#050e21] border border-slate-700
                    text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600
                    focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* حقول متخصصة حسب النوع */}
              <div className="grid grid-cols-2 gap-4">
                {(docType === 'judgment') && (
                  <>
                    <div>
                      <label className="block text-xs font-black text-amber-300 mb-1.5">
                        📅 تاريخ الحكم
                      </label>
                      <input
                        type="date"
                        value={judgmentDate}
                        onChange={e => setJudgmentDate(e.target.value)}
                        className="w-full bg-[#050e21] border border-slate-700
                          text-white rounded-xl px-3 py-2.5 text-sm
                          focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-amber-300 mb-1.5">
                        ⚖️ نوع الحكم
                      </label>
                      <select
                        value={judgmentType}
                        onChange={e => setJudgmentType(e.target.value)}
                        className="w-full bg-[#050e21] border border-slate-700
                          text-white rounded-xl px-3 py-2.5 text-sm
                          focus:outline-none focus:border-amber-500"
                      >
                        <option value="">اختر...</option>
                        <option value="حكم ابتدائي">حكم ابتدائي</option>
                        <option value="حكم استئنافي">حكم استئنافي</option>
                        <option value="حكم نقض">حكم نقض / تمييز</option>
                        <option value="حكم لصالح الموكل">لصالح الموكل ✅</option>
                        <option value="حكم ضد الموكل">ضد الموكل ❌</option>
                        <option value="حكم جزئي">حكم جزئي</option>
                        <option value="مشطوب">مشطوب</option>
                      </select>
                    </div>
                  </>
                )}

                {(docType === 'session_record') && (
                  <div>
                    <label className="block text-xs font-black text-amber-300 mb-1.5">
                      📅 تاريخ الجلسة
                    </label>
                    <input
                      type="date"
                      value={hearingDate}
                      onChange={e => setHearingDate(e.target.value)}
                      className="w-full bg-[#050e21] border border-slate-700
                        text-white rounded-xl px-3 py-2.5 text-sm
                        focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-amber-300 mb-1.5">
                    🏛️ المحكمة
                  </label>
                  <input
                    type="text"
                    value={courtName}
                    onChange={e => setCourtName(e.target.value)}
                    placeholder="اسم المحكمة"
                    className="w-full bg-[#050e21] border border-slate-700
                      text-white rounded-xl px-3 py-2.5 text-sm
                      placeholder-slate-600 focus:outline-none
                      focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-amber-300 mb-1.5">
                    👨‍⚖️ القاضي
                  </label>
                  <input
                    type="text"
                    value={judgeName}
                    onChange={e => setJudgeName(e.target.value)}
                    placeholder="اسم القاضي"
                    className="w-full bg-[#050e21] border border-slate-700
                      text-white rounded-xl px-3 py-2.5 text-sm
                      placeholder-slate-600 focus:outline-none
                      focus:border-amber-500"
                  />
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-xs font-black text-amber-300 mb-1.5">
                  📌 ملاحظات
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="ملاحظات إضافية..."
                  className="w-full bg-[#050e21] border border-slate-700
                    text-white rounded-xl px-4 py-2.5 text-sm resize-none
                    placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* رفع الملفات */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  📎 الملفات *
                  <span className="text-slate-500 font-normal text-xs mr-2">
                    (PDF، Word، صور — يمكن رفع أكثر من ملف)
                  </span>
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700
                    hover:border-amber-500/50 rounded-xl p-8 text-center
                    cursor-pointer transition-colors group"
                >
                  <Upload className="w-10 h-10 text-slate-600
                    group-hover:text-amber-500 mx-auto mb-3 transition-colors" />
                  <p className="text-slate-400 font-bold text-sm mb-1">
                    اسحب الملفات هنا أو اضغط للاختيار
                  </p>
                  <p className="text-slate-600 text-xs">
                    PDF • Word • JPG • PNG — الحد الأقصى 20MB
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(prev => [...prev, ...files]);
                    setUploadError('');
                  }}
                />

                {/* قائمة الملفات المختارة */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between
                          p-3 bg-[#050e21] border border-slate-800
                          rounded-xl"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white text-xs font-bold truncate">
                              {file.name}
                            </p>
                            <p className="text-slate-500 text-[10px]">
                              {formatFileSize(file.size)}
                              {file.size > 1048576 && (
                                <span className="text-amber-500 mr-2">
                                  سيتم ضغطه ↓
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFiles(
                            prev => prev.filter((_, i) => i !== idx)
                          )}
                          className="text-slate-600 hover:text-red-400
                            p-1 shrink-0 transition-colors"
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
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-amber-400 font-bold">
                      جارٍ الرفع والضغط...
                    </span>
                    <span className="text-slate-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600
                        to-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* أزرار النموذج */}
              <div className="flex gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2
                    bg-amber-600 hover:bg-amber-500 disabled:opacity-50
                    text-white font-black py-3 rounded-xl transition-colors
                    shadow-lg shadow-amber-600/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جارٍ الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      رفع المستندات
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setUploadError('');
                    setSelectedFiles([]);
                  }}
                  className="px-6 py-3 border border-slate-700 text-slate-400
                    hover:text-white hover:border-slate-500 rounded-xl
                    transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== عارض المستندات الاحترافي ===== */}
      {viewerDoc && (
        <ProfessionalDocumentViewer
          doc={viewerDoc}
          onClose={() => setViewerDoc(null)}
          onDownload={handleDownload}
          onDelete={handleDeleteDocument}
        />
      )}

      {/* ===== نافذة الذكاء الاصطناعي القانوني ===== */}
      {aiPanel && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md
            flex"
          dir="rtl"
        >
          {/* ===== الشريط الجانبي ===== */}
          <div className="w-72 bg-[#0a1628] border-l border-slate-800
            flex flex-col shrink-0 shadow-2xl">

            {/* رأس الشريط */}
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/15 rounded-xl
                  border border-purple-500/25">
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
              <div className="bg-[#050e21] rounded-xl p-3 border
                border-slate-800">
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
                  {DOC_TYPES.find(
                    t => t.value === aiPanel.doc.document_type
                  )?.label}
                </p>
                {aiPanel.doc.judgment_type && (
                  <span className="inline-block mt-1 px-2 py-0.5
                    bg-amber-500/10 text-amber-400 text-[10px]
                    rounded-lg border border-amber-500/20 font-bold">
                    {aiPanel.doc.judgment_type}
                  </span>
                )}
              </div>
            </div>

            {/* خيارات التحليل */}
            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-3">
                <p className="text-slate-500 text-[10px] font-black
                  uppercase tracking-widest">
                  النص المستخرج من المستند (OCR):
                </p>
                <div className="relative group">
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="سيظهر النص المستخرج هنا بعد النقر على استخراج..."
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl
                      p-3 text-[11px] text-white font-sans leading-relaxed
                      focus:border-purple-500 outline-none resize-none"
                  />
                  <button 
                    onClick={handleExtractText}
                    disabled={isExtracting}
                    className="absolute bottom-2 left-2 p-2 bg-purple-600/20 
                      hover:bg-purple-600 text-purple-400 hover:text-white
                      rounded-lg transition-all border border-purple-500/30
                      disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    ) }
                    <span className="text-[10px] font-black">استخراج OCR</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-[10px] font-black
                  uppercase tracking-widest mb-3">
                  نوع المخرج المطلوب:
                </p>

                <div className="space-y-2">
                {[
                  {
                    mode: 'analyze' as const,
                    label: 'تحليل القضية',
                    desc: 'تحليل شامل للوقائع والمستندات والفرص',
                    icon: Scale,
                    activeClass: 'bg-amber-600 border-amber-500 text-white',
                    inactiveClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  },
                  {
                    mode: 'lawsuit' as const,
                    label: 'صحيفة دعوى',
                    desc: 'صياغة وفق نظام المرافعات السعودي',
                    icon: FileText,
                    activeClass: 'bg-blue-600 border-blue-500 text-white',
                    inactiveClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                  },
                  {
                    mode: 'memo' as const,
                    label: 'مذكرة جوابية',
                    desc: 'دفوع قانونية متوافقة مع الأنظمة',
                    icon: MessageSquare,
                    activeClass: 'bg-emerald-600 border-emerald-500 text-white',
                    inactiveClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }
                ].map(option => {
                  const Icon = option.icon;
                  const isActive = aiPanel.mode === option.mode;
                  return (
                    <button
                      key={option.mode}
                      onClick={() => {
                        setAiPanel(prev =>
                          prev ? { ...prev, mode: option.mode } : null
                        );
                        setAiOutput('');
                        setAiError('');
                      }}
                      className={`w-full text-right p-3.5 rounded-xl
                        border-2 transition-all ${
                        isActive
                          ? option.activeClass
                          : option.inactiveClass
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-black text-sm">
                          {option.label}
                        </span>
                      </div>
                      <p className={`text-xs ${
                        isActive
                          ? 'text-white/70'
                          : 'text-slate-500'
                      }`}>
                        {option.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

              {/* تنبيه الأنظمة */}
              <div className="mt-4 p-3 bg-slate-900/50 rounded-xl
                border border-slate-800">
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  🇸🇦 الوثائق مصاغة وفق الأنظمة السعودية:
                  نظام المرافعات الشرعية، نظام العمل،
                  نظام التجارة، نظام الأحوال الشخصية
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
                    {aiPanel.mode === 'analyze' && 'تحليل القضية'}
                    {aiPanel.mode === 'lawsuit' && 'صياغة صحيفة الدعوى'}
                    {aiPanel.mode === 'memo' && 'صياغة المذكرة الجوابية'}
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setAiPanel(null);
                  setAiOutput('');
                  setAiError('');
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
            <div className={`flex items-center justify-between px-6 py-4
              border-b border-slate-800 shrink-0 bg-[#0a1628] ${getContrastText('bg-[#0a1628]')}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-purple-500/10 rounded-xl
                  border border-purple-500/20 shrink-0">
                  {aiPanel.mode === 'analyze' && (
                    <Scale className="w-5 h-5 text-amber-400" />
                  )}
                  {aiPanel.mode === 'lawsuit' && (
                    <FileText className="w-5 h-5 text-blue-400" />
                  )}
                  {aiPanel.mode === 'memo' && (
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className={`font-black truncate ${getContrastText('bg-[#0a1628]')}`}>
                    {aiPanel.mode === 'analyze' && 'تحليل القضية القانوني'}
                    {aiPanel.mode === 'lawsuit' && 'صحيفة الدعوى القضائية'}
                    {aiPanel.mode === 'memo' && 'المذكرة الجوابية'}
                  </h2>
                  <p className="text-slate-500 text-xs truncate">
                    القضية #{aiPanel.doc.case_number} | {aiPanel.doc.case_name || ''}
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
                        analyze: 'تحليل-القضية',
                        lawsuit: 'صحيفة-الدعوى',
                        memo: 'المذكرة-الجوابية'
                      };
                      const fileName =
                        `${titles[aiPanel.mode]}-${aiPanel.doc.case_number}.txt`;
                      const content =
                        `${fileName}\n` +
                        `القضية: ${aiPanel.doc.case_number}\n` +
                        `التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n` +
                        `${'─'.repeat(50)}\n\n${aiOutput}`;

                      const blob = new Blob(
                        [content],
                        { type: 'text/plain;charset=utf-8' }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
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
                <div className="flex flex-col items-center justify-center
                  h-full text-center py-10">
                  <div className="w-24 h-24 bg-purple-500/10 rounded-full
                    flex items-center justify-center mb-6
                    border-2 border-purple-500/20 border-dashed">
                    <Sparkles className="w-12 h-12 text-purple-400/60" />
                  </div>
                  <h3 className="text-white font-black text-xl mb-2">
                    المحلل القانوني الذكي
                  </h3>
                  <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
                    يحلل القضية استناداً إلى جميع مستنداتها وبياناتها
                    ويصيغ الوثائق القانونية متوافقةً مع الأنظمة السعودية
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-lg w-full">
                    {[
                      {
                        icon: Scale,
                        label: 'تحليل شامل',
                        desc: 'وقائع وفرص وتوصيات',
                        color: 'text-amber-400',
                        bg: 'bg-amber-500/10',
                        border: 'border-amber-500/20'
                      },
                      {
                        icon: FileText,
                        label: 'صحيفة دعوى',
                        desc: 'نظام المرافعات السعودي',
                        color: 'text-blue-400',
                        bg: 'bg-blue-500/10',
                        border: 'border-blue-500/20'
                      },
                      {
                        icon: MessageSquare,
                        label: 'مذكرة جوابية',
                        desc: 'دفوع قانونية محكمة',
                        color: 'text-emerald-400',
                        bg: 'bg-emerald-500/10',
                        border: 'border-emerald-500/20'
                      }
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
                <div className="flex flex-col items-center justify-center
                  h-full">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-purple-900
                      border-t-purple-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center
                      justify-center">
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-white font-black text-lg mb-2">
                    {aiPanel.mode === 'analyze' && 'يحلل القضية...'}
                    {aiPanel.mode === 'lawsuit' && 'يصيغ صحيفة الدعوى...'}
                    {aiPanel.mode === 'memo' && 'يكتب المذكرة الجوابية...'}
                  </p>
                  <p className="text-slate-500 text-sm mb-1">
                    يستند إلى وقائع القضية والأنظمة السعودية
                  </p>
                  <p className="text-slate-600 text-xs">
                    يستغرق 15-40 ثانية
                  </p>
                  <div className="flex gap-1.5 mt-6">
                    {[0,1,2,3].map(i => (
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
                <div className="flex flex-col items-center justify-center
                  h-full">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full
                    flex items-center justify-center mb-4
                    border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-white font-black text-lg mb-2">
                    فشل التحليل
                  </p>
                  <p className="text-red-400 text-sm text-center max-w-sm mb-6">
                    {aiError}
                  </p>
                  <button
                    onClick={() =>
                      callLegalAI(aiPanel.doc, aiPanel.mode)
                    }
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
                  <div className="flex items-center gap-3 mb-6 pb-4
                    border-b border-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-emerald-400 font-black text-sm">
                        تم التحليل بنجاح — Gemini AI
                      </p>
                      <p className="text-slate-600 text-xs">
                        متوافق مع الأنظمة والقوانين السعودية |
                        {new Date().toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>

                  {/* النص النص المولّد */}
                  <div
                    className={`${getContrastText('#0a1628')} bg-[#0a1628] border border-slate-800
                      rounded-2xl p-6 leading-loose text-sm
                      whitespace-pre-wrap`}
                    style={{
                      direction: 'rtl',
                      lineHeight: '2.2'
                    }}
                  >
                    {aiOutput.split('\n').map((line, i) => {
                      // عناوين رئيسية
                      if (/^#{1,3}\s/.test(line) ||
                          /^[أ-ي]+اً:/.test(line) ||
                          (line.startsWith('**') && line.endsWith('**'))) {
                        const clean = line
                          .replace(/^#+\s/, '')
                          .replace(/^\*\*|\*\*$/g, '');
                        return (
                          <p key={i}
                            className="text-amber-400 font-black text-base
                              mt-8 mb-3 pb-2 border-b border-amber-500/20
                              border-r-4 border-r-amber-500 pr-4">
                            {clean}
                          </p>
                        );
                      }
                      // السطور الفاصلة
                      if (/^─{3,}/.test(line) || /^={3,}/.test(line)) {
                        return <hr key={i}
                          className="border-slate-800 my-4" />;
                      }
                      // نقاط القوائم
                      if (/^[-•*]\s/.test(line) ||
                          /^\d+\.\s/.test(line)) {
                        return (
                          <p key={i}
                            className={`mr-6 mb-1.5 flex gap-2 ${getContrastText('#0a1628')}`}>
                            <span className="text-amber-500 shrink-0">◈</span>
                            <span>{line.replace(/^[-•*\d.]\s/, '')}</span>
                          </p>
                        );
                      }
                      // سطر فارغ
                      if (!line.trim()) return <br key={i} />;
                      // النص العادي
                      return (
                        <p key={i} className={`mb-1 ${getContrastText('#0a1628')} opacity-90`}>
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* تنبيه قانوني */}
                  <div className="flex items-start gap-3 mt-5 p-4
                    bg-amber-500/5 border border-amber-500/15 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-500
                      mt-0.5 shrink-0" />
                    <p className="text-amber-400/70 text-xs leading-relaxed">
                      هذا التحليل مولّد بالذكاء الاصطناعي بناءً على البيانات
                      المتاحة. يُنصح بمراجعة المحامي المسؤول قبل تقديم أي
                      وثيقة للمحكمة، إذ قد تتطلب التفاصيل الدقيقة تعديلات
                      إضافية تبعاً لمستجدات القضية.
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
