import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scale, FileText, Upload, Download, Eye, X,
  Search, Plus, Gavel, BookOpen, MessageSquare,
  Calendar, Building2, ChevronDown, ChevronRight,
  Loader2, Trash2, CheckCircle2, AlertCircle,
  File as LucideFile, FolderOpen, Sparkles, Clock, Filter
} from 'lucide-react';
import { supabase, uploadFileToStorage } from '@/lib/supabase';
import { generateUUID } from '@/lib/uuid';

const DOC_TYPES = [
  { value: 'lawsuit_sheet', label: 'صحيفة الدعوى', icon: FileText,
    color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-400/40' },
  { value: 'judgment', label: 'حكم قضائي', icon: Gavel,
    color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-400/40' },
  { value: 'session_record', label: 'محضر ضبط الجلسة', icon: BookOpen,
    color: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-400/40' },
  { value: 'response_memo', label: 'مذكرة جوابية', icon: MessageSquare,
    color: 'text-purple-300', bg: 'bg-purple-500/20', border: 'border-purple-400/40' },
] as const;

type DocType = typeof DOC_TYPES[number]['value'];

interface CaseJudgmentsModuleProps {
  cases: any[];
  selectedRole?: string;
}

export default function CaseJudgmentsModule({ cases, selectedRole }: CaseJudgmentsModuleProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [uploadModal, setUploadModal] = useState<{ caseId: string; caseName: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState('');

  // Upload form states
  const [docType, setDocType] = useState<DocType>('judgment');
  const [docName, setDocName] = useState('');
  const [judgmentDate, setJudgmentDate] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [judgmentType, setJudgmentType] = useState('');
  const [courtName, setCourtName] = useState('');
  const [circuitNumber, setCircuitNumber] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setDocuments(data || []);
    } catch(e) {} finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  // القضايا مع عدد مستنداتها
  const activeCases = cases.filter(c => !c.archived);
  const filteredCases = activeCases.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (c.caseNumber || c.case_number || '').toLowerCase().includes(s) ||
           (c.caseName || c.title || '').toLowerCase().includes(s) ||
           (c.clientName || c.client_name || '').toLowerCase().includes(s);
  });

  const getDocsForCase = (caseId: string, caseNum: string) =>
    documents.filter(d =>
      d.case_id === caseId || d.case_number === caseNum
    ).filter(d =>
      filterType === 'all' || d.document_type === filterType
    );

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  };

  const getDocConfig = (type: string) =>
    DOC_TYPES.find(t => t.value === type) || DOC_TYPES[0];

  // ===== رفع الملفات =====
  const compressFile = async (file: File): Promise<Blob> => {
    if (!file.type.startsWith('image/')) return file;
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1920;
        let { width: w, height: h } = img;
        if (w > max || h > max) {
          const r = Math.min(max/w, max/h);
          w = Math.round(w*r); h = Math.round(h*r);
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        canvas.toBlob(b => resolve(b || file), 'image/jpeg', 0.8);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const handleUpload = async () => {
    if (!uploadModal) {
      setUploadError('يرجى اختيار القضية');
      return;
    }
    if (!docName.trim()) {
      setUploadError('يرجى إدخال اسم المستند');
      return;
    }
    if (selectedFiles.length === 0) {
      setUploadError('يرجى اختيار ملف واحد على الأقل');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError('');

    const saved: any[] = [];

    try {
      // جلب بيانات القضية المحددة
      const selectedCaseData = cases.find(c => c.id === uploadModal.caseId);
      const caseNumber = selectedCaseData?.caseNumber ||
                         selectedCaseData?.case_number || '';
      const caseName = selectedCaseData?.caseName ||
                       selectedCaseData?.title ||
                       selectedCaseData?.clientName ||
                       uploadModal.caseName || '';

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(Math.round(10 + (i / selectedFiles.length) * 70));

        let fileUrl: string | null = null;
        let filePath: string | null = null;
        let compressedSize = file.size;

        // ضغط الصور فقط
        let uploadFile: File | Blob = file;
        if (file.type.startsWith('image/')) {
          try {
            const compressed = await new Promise<Blob>((resolve) => {
              const canvas = document.createElement('canvas');
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
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                  (blob) => resolve(blob || file),
                  'image/jpeg', 0.8
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
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `case-documents/${uploadModal.caseId}/${docType}/${timestamp}_${safeName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('case-documents')
            .upload(storagePath, uploadFile, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type || 'application/octet-stream'
            });

          if (uploadError) {
            console.error('[Storage Error]', uploadError);
            // Fallback: استخدم Object URL مؤقت
            fileUrl = URL.createObjectURL(file);
            filePath = `local/${timestamp}_${safeName}`;
          } else {
            const { data: urlData } = supabase.storage
              .from('case-documents')
              .getPublicUrl(uploadData.path);
            fileUrl = urlData.publicUrl;
            filePath = uploadData.path;
          }
        } catch (storageErr: any) {
          console.warn('[Storage fallback]', storageErr.message);
          fileUrl = URL.createObjectURL(file);
          filePath = `local/${Date.now()}_${file.name}`;
        }

        // حفظ في قاعدة البيانات
        const docId = crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now();

        const docSuffix = selectedFiles.length > 1 ? ` (${i + 1})` : '';

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
          file_type: file.type || 'application/octet-stream',
          hearing_date: hearingDate || null,
          judgment_date: judgmentDate || null,
          judgment_type: judgmentType || null,
          court_name: courtName || selectedCaseData?.courtName ||
                     selectedCaseData?.court_name || null,
          circuit_number: circuitNumber || null,
          judge_name: judgeName || null,
          notes: notes || null,
          is_compressed: compressedSize < file.size,
          uploaded_by: 'المستخدم',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: dbData, error: dbError } = await supabase
          .from('case_documents')
          .insert(record)
          .select()
          .single();

        if (dbError) {
          console.error('[DB Error]', dbError);
          // حاول بدون .single()
          const { error: dbError2 } = await supabase
            .from('case_documents')
            .insert(record);

          if (dbError2) {
            setUploadError(
              `فشل حفظ المستند "${file.name}": ${dbError2.message}`
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
        setDocuments(prev => [...saved, ...prev]);

        // إغلاق النافذة وإعادة تعيين النموذج
        setUploadModal(null);
        resetUploadForm();

        alert(
          `✅ تم رفع وحفظ ${saved.length} مستند بنجاح\n` +
          `القضية: ${caseName} (#${caseNumber})`
        );
      } else {
        setUploadError('فشل حفظ جميع المستندات. يرجى المحاولة مرة أخرى');
      }

    } catch (err: any) {
      console.error('[Upload Exception]', err);
      setUploadError('خطأ غير متوقع: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setDocType('judgment'); setDocName('');
    setJudgmentDate(''); setHearingDate('');
    setJudgmentType(''); setCourtName('');
    setCircuitNumber(''); setJudgeName('');
    setNotes(''); setSelectedFiles([]);
    setUploadError('');
  };

  const handleDelete = async (doc: any) => {
    if (!confirm(`حذف "${doc.document_name}" نهائياً؟`)) return;
    setIsDeleting(doc.id);
    try {
      if (doc.file_path && !doc.file_path.startsWith('local/') &&
          !doc.file_path.startsWith('http')) {
        await supabase.storage.from('case-documents').remove([doc.file_path]);
      }
      await supabase.from('case_documents').delete().eq('id', doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      if (viewerDoc?.id === doc.id) setViewerDoc(null);
      setDeleteSuccess(doc.document_name);
      setTimeout(() => setDeleteSuccess(''), 3000);
    } catch(err: any) { alert('فشل الحذف: ' + err.message); }
    finally { setIsDeleting(null); }
  };

  const inputClass = "w-full bg-[#050e21] border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500";

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
          {DOC_TYPES.map(type => {
            const count = documents.filter(d => d.document_type === type.value).length;
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setFilterType(f => f === type.value ? 'all' : type.value)}
                className={`rounded-2xl border p-4 text-right transition-all ${
                  filterType === type.value
                    ? `${type.bg} ${type.border} scale-[1.02]`
                    : 'bg-[#0a1628] border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${type.color}`} />
                  <span className={`text-xs font-bold ${type.color}`}>{type.label}</span>
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
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث برقم القضية أو الموكل..."
              className="w-full bg-[#0a1628] border border-slate-700 text-white
                rounded-xl pr-10 pl-4 py-2.5 text-sm placeholder-slate-500
                focus:outline-none focus:border-amber-500"
            />
          </div>
          {filterType !== 'all' && (
            <button
              onClick={() => setFilterType('all')}
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
        <div className="flex flex-col items-center justify-center py-20
          border border-dashed border-slate-700 bg-slate-900/50 rounded-3xl">
          <FolderOpen className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
          <p className="text-white font-black text-base">لا توجد قضايا مسجلة</p>
          <p className="text-yellow-400 text-sm font-bold mt-1">
            أضف قضايا من قسم إدارة القضايا أولاً
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map(c => {
            const caseId = c.id;
            const caseNum = c.caseNumber || c.case_number || '';
            const caseName = c.caseName || c.title || c.clientName || '';
            const caseDocs = getDocsForCase(caseId, caseNum);
            const isExpanded = expandedCaseId === caseId;

            return (
              <div key={caseId}
                className="bg-[#0a1628] border border-slate-700/50
                  hover:border-amber-500/30 rounded-2xl overflow-hidden
                  transition-all duration-300">

                {/* رأس كارت القضية */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer
                    hover:bg-amber-500/5 transition-colors"
                  onClick={() => setExpandedCaseId(isExpanded ? null : caseId)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl
                      border border-amber-500/20 shrink-0">
                      <Scale className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-yellow-400 font-mono text-xs font-black">
                          #{caseNum}
                        </span>
                        {c.status && (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg
                            bg-slate-800 text-white border border-slate-600 font-bold">
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
                      {DOC_TYPES.map(type => {
                        const cnt = documents.filter(d =>
                          (d.case_id === caseId || d.case_number === caseNum) &&
                          d.document_type === type.value
                        ).length;
                        if (cnt === 0) return null;
                        return (
                          <span key={type.value}
                            className={`text-[10px] px-2 py-0.5 rounded-lg
                              font-black bg-slate-800 text-white
                              border border-slate-600`}>
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
                      onClick={e => {
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

                    <ChevronRight className={`w-4 h-4 text-slate-500
                      transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* المستندات المنسدلة */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 p-5">
                    {caseDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center
                        py-8 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {caseDocs.map(doc => {
                          const typeConf = getDocConfig(doc.document_type);
                          const Icon = typeConf.icon;
                          return (
                            <div key={doc.id}
                              className={`relative group bg-[#050e21] border rounded-xl
                                p-4 transition-all hover:scale-[1.01]
                                ${typeConf.border} ${typeConf.bg}`}>

                              {/* نوع المستند */}
                              <div className="inline-flex items-center gap-1.5
                                text-[10px] font-black px-2 py-1 rounded-lg mb-3
                                bg-slate-800 text-white border border-slate-600">
                                <Icon className="w-3 h-3 text-yellow-400" />
                                {typeConf.label}
                              </div>

                              {/* اسم المستند */}
                              <p className="text-white font-black text-sm mb-2 leading-tight">
                                {doc.document_name}
                              </p>

                              {/* تفاصيل */}
                              <div className="space-y-1 mb-3">
                                {doc.judgment_date && (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-yellow-400 shrink-0" />
                                    <span className="text-yellow-400 font-extrabold text-xs">
                                      الحكم: {doc.judgment_date}
                                    </span>
                                  </div>
                                )}
                                {doc.hearing_date && (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-white shrink-0" />
                                    <span className="text-white font-extrabold text-xs">
                                      الجلسة: {doc.hearing_date}
                                    </span>
                                  </div>
                                )}
                                {doc.judgment_type && (
                                  <span className="inline-block text-[10px] px-2 py-0.5
                                    bg-slate-800 text-white border border-slate-600
                                    rounded-lg font-black">
                                    {doc.judgment_type}
                                  </span>
                                )}
                                {doc.court_name && (
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3 text-yellow-400 shrink-0" />
                                    <span className="text-white font-bold text-xs truncate">
                                      {doc.court_name}
                                      {doc.circuit_number ? ` — دائرة ${doc.circuit_number}` : ''}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* حجم + تاريخ */}
                              <div className="flex items-center justify-between
                                pt-2 border-t border-slate-700/50">
                                <span className="text-yellow-400 font-black text-[10px]">
                                  {formatFileSize(doc.compressed_size || doc.file_size)}
                                </span>
                                <span className="text-white font-bold text-[10px]">
                                  {new Date(doc.created_at).toLocaleDateString('ar-SA')}
                                </span>
                              </div>

                              {/* أزرار الإجراءات */}
                              <div className="absolute top-3 left-3 flex gap-1
                                opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setViewerDoc(doc)}
                                  className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40
                                    rounded-lg transition-colors"
                                  title="عرض">
                                  <Eye className="w-3 h-3 text-blue-300" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (doc.file_url) {
                                      const a = document.createElement('a');
                                      a.href = doc.file_url;
                                      a.download = doc.document_name;
                                      a.target = '_blank';
                                      a.click();
                                    }
                                  }}
                                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40
                                    rounded-lg transition-colors"
                                  title="تحميل">
                                  <Download className="w-3 h-3 text-emerald-300" />
                                </button>
                                <button
                                  onClick={() => handleDelete(doc)}
                                  disabled={isDeleting === doc.id}
                                  className="p-1.5 bg-red-500/20 hover:bg-red-500/40
                                    rounded-lg transition-colors disabled:opacity-50"
                                  title="حذف">
                                  {isDeleting === doc.id
                                    ? <Loader2 className="w-3 h-3 text-red-400 animate-spin" />
                                    : <Trash2 className="w-3 h-3 text-red-400" />}
                                </button>
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
          })}
        </div>
      )}

      {/* نافذة رفع المستند */}
      {uploadModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center
          p-4 bg-black/75 backdrop-blur-sm" dir="rtl">
          <div className="bg-[#0a1628] border border-slate-700 rounded-2xl
            w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">

            <div className="sticky top-0 bg-[#0a1628] flex items-center
              justify-between p-5 border-b border-slate-700 z-10">
              <div>
                <h2 className="text-white font-black text-lg">رفع مستند</h2>
                <p className="text-amber-400 text-xs mt-0.5">
                  {uploadModal.caseName}
                </p>
              </div>
              <button onClick={() => { setUploadModal(null); resetUploadForm(); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10
                  border border-red-500/30 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-300 text-sm">{uploadError}</p>
                </div>
              )}

              {/* نوع المستند */}
              <div>
                <label className="block text-slate-200 text-xs font-bold mb-2">
                  نوع المستند *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DOC_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <button key={type.value} type="button"
                        onClick={() => setDocType(type.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl
                          border-2 transition-all text-right ${
                          docType === type.value
                            ? `${type.bg} ${type.border} ${type.color}`
                            : 'bg-[#050e21] border-slate-700 text-slate-300'
                        }`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-bold">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* اسم المستند */}
              <div>
                <label className="block text-slate-200 text-xs font-bold mb-2">
                  اسم المستند *
                </label>
                <input type="text" value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="مثال: حكم ابتدائي رقم 1234"
                  className={inputClass} />
              </div>

              {/* الحقول الخاصة */}
              <div className="grid grid-cols-2 gap-3">
                {docType === 'judgment' && (
                  <>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-1.5">
                        تاريخ الحكم
                      </label>
                      <input type="date" value={judgmentDate}
                        onChange={e => setJudgmentDate(e.target.value)}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-1.5">
                        نوع الحكم
                      </label>
                      <select value={judgmentType}
                        onChange={e => setJudgmentType(e.target.value)}
                        className={inputClass}>
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
                {docType === 'session_record' && (
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1.5">
                      تاريخ الجلسة
                    </label>
                    <input type="date" value={hearingDate}
                      onChange={e => setHearingDate(e.target.value)}
                      className={inputClass} />
                  </div>
                )}
                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1.5">
                    المحكمة
                  </label>
                  <input type="text" value={courtName}
                    onChange={e => setCourtName(e.target.value)}
                    placeholder="اسم المحكمة"
                    className={inputClass} />
                </div>
                {docType === 'judgment' && (
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1.5">
                      رقم الدائرة
                    </label>
                    <input type="text" value={circuitNumber}
                      onChange={e => setCircuitNumber(e.target.value)}
                      placeholder="رقم الدائرة"
                      className={inputClass} />
                  </div>
                )}
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5">
                  ملاحظات
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} placeholder="ملاحظات..."
                  className={inputClass + ' resize-none'} />
              </div>

              {/* رفع الملفات */}
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-2">
                  الملفات * (PDF، Word، صور)
                </label>
                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600
                    hover:border-amber-500/60 rounded-xl p-6 text-center
                    cursor-pointer transition-colors group">
                  <Upload className="w-8 h-8 text-slate-600
                    group-hover:text-amber-500 mx-auto mb-2 transition-colors" />
                  <p className="text-slate-300 text-sm font-bold">
                    اسحب الملفات أو اضغط للاختيار
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    يمكن رفع أكثر من ملف — حد أقصى 20MB
                  </p>
                </div>
                <input ref={fileInputRef} type="file" multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => {
                    setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                    setUploadError('');
                  }} />

                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between
                        p-2.5 bg-[#050e21] border border-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <LucideFile className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-white text-xs truncate">{f.name}</span>
                          <span className="text-slate-500 text-[10px] shrink-0">
                            {formatFileSize(f.size)}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedFiles(prev => prev.filter((_,j) => j !== i))}
                          className="text-slate-600 hover:text-red-400 p-0.5 shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* شريط التقدم */}
              {isUploading && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-amber-400 font-bold">جارٍ الرفع...</span>
                    <span className="text-slate-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400
                      rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* أزرار */}
              <div className="flex gap-3 pt-2 border-t border-slate-700">
                <button onClick={handleUpload} disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2
                    bg-amber-600 hover:bg-amber-500 disabled:opacity-50
                    text-white font-black py-3 rounded-xl transition-colors">
                  {isUploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />جارٍ الرفع...</>
                    : <><Upload className="w-4 h-4" />رفع المستندات</>}
                </button>
                <button onClick={() => { setUploadModal(null); resetUploadForm(); }}
                  className="px-5 py-3 border border-slate-600 text-slate-400
                    hover:text-white rounded-xl transition-colors">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* عارض المستندات */}
      {viewerDoc && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col" dir="rtl">
          <div className="flex items-center justify-between px-6 py-4
            bg-[#0a1628] border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Scale className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {viewerDoc.document_name}
                </p>
                <p className="text-amber-400 text-xs">#{viewerDoc.case_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => {
                if (viewerDoc.file_url) {
                  const a = document.createElement('a');
                  a.href = viewerDoc.file_url;
                  a.download = viewerDoc.document_name;
                  a.target = '_blank';
                  a.click();
                }
              }} className="flex items-center gap-2 px-4 py-2
                bg-emerald-600 hover:bg-emerald-500 text-white
                text-sm font-bold rounded-xl transition-colors">
                <Download className="w-4 h-4" />تحميل
              </button>
              <button onClick={() => setViewerDoc(null)}
                className="p-2 text-slate-400 hover:text-white
                  hover:bg-slate-700 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {viewerDoc.file_url ? (
              viewerDoc.file_type?.includes('pdf') ? (
                <iframe src={viewerDoc.file_url + '#toolbar=1'}
                  className="w-full h-full max-w-5xl rounded-xl border border-slate-700"
                  title={viewerDoc.document_name} />
              ) : viewerDoc.file_type?.startsWith('image/') ? (
                <img src={viewerDoc.file_url} alt={viewerDoc.document_name}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
              ) : (
                <div className="text-center">
                  <LucideFile className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-bold mb-4">{viewerDoc.document_name}</p>
                  <button onClick={() => {
                    const a = document.createElement('a');
                    a.href = viewerDoc.file_url;
                    a.download = viewerDoc.document_name;
                    a.click();
                  }} className="flex items-center gap-2 mx-auto px-6 py-3
                    bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl">
                    <Download className="w-4 h-4" />تحميل الملف
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
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3
          px-5 py-3 bg-emerald-700 border border-emerald-500 rounded-2xl
          shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <div>
            <p className="text-white font-black text-sm">تم الحذف</p>
            <p className="text-emerald-200 text-xs">{deleteSuccess}</p>
          </div>
        </div>
      )}
    </div>
  );
}
