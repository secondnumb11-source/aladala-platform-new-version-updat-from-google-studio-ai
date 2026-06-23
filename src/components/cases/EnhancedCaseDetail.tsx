import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Eye, 
  Cpu, 
  Share2, 
  Printer, 
  Archive, 
  FileText, 
  Paperclip, 
  Gavel, 
  Zap, 
  Check, 
  Sparkles,
  Users,
  Download,
  X,
  History,
  MessageSquare,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { Case, Client, Attachment } from '@/types';
import { generateUUID } from '@/lib/uuid';
import { supabase } from '@/lib/supabase';
import DocumentUploadWidget from './DocumentUploadWidget';

interface EnhancedCaseDetailProps {
  selectedCase: Case;
  clients: Client[];
  isHighContrast: boolean;
  onSelectCase: (caseObj: Case | null) => void;
  onUpdateState: (type: string, data: any) => void;
  handleTriggerAiAnalysis: (c: Case) => void;
  handleExportToPdf: (c: Case) => void;
  handleStatusTransition: (c: Case, status: any) => void;
  handleCaseSummarize: () => void;
  isAiLoading: boolean;
  aiAnalysis: string;
  setAiAnalysis: (val: string) => void;
  caseDocumentText: string;
  setCaseDocumentText: (val: string) => void;
  caseDocumentMemo: string;
  setCaseDocumentMemo: (val: string) => void;
  isCaseSummarizing: boolean;
  caseSummarizeError: string | null;
  whatsAppLogs: any[];
  setActivityLogCaseId: (id: string | null) => void;
}

export const EnhancedCaseDetail: React.FC<EnhancedCaseDetailProps> = ({
  selectedCase,
  clients,
  isHighContrast,
  onSelectCase,
  onUpdateState,
  handleTriggerAiAnalysis,
  handleExportToPdf,
  handleStatusTransition,
  handleCaseSummarize,
  isAiLoading,
  aiAnalysis,
  setAiAnalysis,
  caseDocumentText,
  setCaseDocumentText,
  caseDocumentMemo,
  setCaseDocumentMemo,
  isCaseSummarizing,
  caseSummarizeError,
  whatsAppLogs,
  setActivityLogCaseId,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history' | 'finance'>('details');

  const [caseAttachments, setCaseAttachments] = useState<any[]>([]);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('all');
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  
  // Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('documents');
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [selectedFileSizeText, setSelectedFileSizeText] = useState<string>('');

  // Viewer states
  const [viewingAttachment, setViewingAttachment] = useState<any | null>(null);

  const loadCaseAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('record_id', selectedCase.id);
      if (error) {
        console.error('[Attachments] Error fetching:', error);
        return;
      }
      if (data) {
        const mapped = data.map((a: any) => ({
          id: a.id,
          recordId: a.record_id,
          recordType: a.record_type,
          fileName: a.file_name,
          fileSize: a.file_size,
          storagePath: a.storage_path,
          fileUrl: a.file_url,
          createdAt: a.created_at,
          category: a.category || 'documents'
        }));
        setCaseAttachments(mapped);
      }
    } catch (err) {
      console.error('[Attachments] Failed to fetch:', err);
    }
  };

  useEffect(() => {
    if (selectedCase?.id) {
      loadCaseAttachments();
    }
  }, [selectedCase?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setNewDocName(file.name.split('.').slice(0, -1).join('.'));
    setSelectedFileSizeText(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    setSelectedFileType(file.type || 'application/octet-stream');
    
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      alert('الرجاء إدخال اسم للمستند');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(20);
    
    try {
      setUploadProgress(50);
      
      const newAttachment = {
        id: generateUUID(),
        record_id: selectedCase.id,
        record_type: 'case',
        file_name: newDocName,
        file_url: selectedFileContent || `data:text/plain;base64,JHhibWw9`,
        file_size: selectedFileSizeText || '0.1 MB',
        category: newDocCategory,
        storage_path: `attachments/cases/${selectedCase.id}/${generateUUID()}`,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('attachments')
        .insert([newAttachment]);
        
      if (error) {
        console.error('[Upload] Error uploading document:', error);
        alert('خطأ أثناء رفع ومزامنة المستند: ' + error.message);
        setIsUploading(false);
        return;
      }
      
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setIsUploadFormOpen(false);
        setNewDocName('');
        setSelectedFileContent('');
        setSelectedFileSizeText('');
        setSelectedFileType('');
        loadCaseAttachments();
      }, 500);
      
    } catch (err: any) {
      console.error('[Upload] Error in submission handler:', err);
      alert('حدث خطأ غير متوقع أثناء المعالجة.');
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المستند نهائياً؟')) {
      try {
        const { error } = await supabase
          .from('attachments')
          .delete()
          .eq('id', id);
        if (error) {
          console.error('[Attachment Delete] Error deleting:', error);
          alert('فشل حذف المستند: ' + error.message);
          return;
        }
        loadCaseAttachments();
      } catch (err: any) {
        console.error('[Attachment Delete] Exception:', err);
      }
    }
  };

  return (
    <>
      {/* CSS Print Styles for Luxury Official Judicial Template */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide absolutely everything else on the screen (sidebars, app bar, background) */
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Cairo', 'Inter', sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          #root, #app-root, .no-print, button, nav, header, footer, aside, .session-date-dropdown-container, .upload-widget {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          
          /* Force only our print-official-template to show and fill page */
          .print-official-template {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 30px !important;
            background: #ffffff !important;
            color: #111827 !important;
            z-index: 9999999 !important;
            box-sizing: border-box !important;
          }
          
          /* Elegant golden border for luxury paper feel */
          .print-border-frame {
            border: 2px solid #b8860b !important;
            padding: 25px !important;
            border-radius: 12px !important;
            position: relative !important;
            min-height: 94vh !important;
          }
          
          /* High contrast print items overrides */
          .print-text-gold {
            color: #856404 !important;
          }
          .print-bg-gold-light {
            background-color: #fffdf5 !important;
            border: 1px solid #ffeeba !important;
          }
          
          /* Watermark background icon */
          .print-watermark {
            position: absolute !important;
            top: 45% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            font-size: 260px !important;
            opacity: 0.025 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            color: #000000 !important;
          }
          
          /* Ensure headers and tables don't split cut-off badly */
          .page-break-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Luxury Printable Case File Template (Print Mode Only) */}
      <div className="hidden print:block print-official-template" dir="rtl">
        <div className="print-border-frame relative overflow-hidden">
          {/* Watermark icon behind text */}
          <div className="print-watermark">⚖️</div>
          
          {/* Royal Logo Emblem Header */}
          <div className="border-b-4 border-double border-[#d4af37] pb-6 mb-8 flex justify-between items-center relative z-10">
            <div className="text-right space-y-1">
              <h2 className="text-base font-black text-slate-900">مملكة المحاماة والاستشارات القانونية</h2>
              <p className="text-[11px] text-slate-700">بوابة العدالة الرقمية المتكاملة للمرافعات</p>
              <p className="text-[9px] text-slate-500">مُرخّص رسميّاً من وزارة العدل بالمملكة العربية السعودية</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-1">⚖️</div>
              <span className="text-[9px] uppercase font-black tracking-widest text-amber-800 border-2 border-amber-600 px-3 py-1 rounded-xl bg-amber-50">
                وثيقة ملف دعوى رسمي
              </span>
            </div>
            
            <div className="text-left text-[10px] text-slate-700 space-y-1 font-mono">
              <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</div>
              <div>رقم القضية: {selectedCase.caseNumber}</div>
              <div>مرجع النظام: #CASE-{selectedCase.id}</div>
            </div>
          </div>

          {/* First Section: Core Case Data */}
          <div className="mb-8 p-6 rounded-2xl border border-amber-600/20 bg-amber-500/[0.02] relative z-10 page-break-avoid">
            <h3 className="text-xs font-black text-amber-900 border-b-2 border-amber-500/10 pb-2 mb-4 flex items-center gap-2">
              <span>◆</span> أولاً: البيانات التفصيلية لملف القضية
            </h3>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-8 text-xs">
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">اسم القضية / موضوعها:</span>
                <span className="font-black text-slate-900 text-[13px]">{selectedCase.caseName}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">رقم القضية الرسمي:</span>
                <span className="font-mono font-black text-slate-900 text-sm">#{selectedCase.caseNumber}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">المحكمة والهيئة القضائية:</span>
                <span className="font-black text-slate-900">{selectedCase.courtName || 'غير متوفر'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">التصنيف القضائي الفرعي:</span>
                <span className="font-black text-slate-900">
                  {selectedCase.category === 'commercial' ? 'تجاري مالية ومصرفية' :
                   selectedCase.category === 'labor' ? 'عمالية وتأمين واحتساب' :
                   selectedCase.category === 'civil' ? 'مدنية حقوقية' :
                   selectedCase.category === 'criminal' ? 'جزائية جنائية' :
                   selectedCase.category === 'personal_status' ? 'أحوال شخصية وإرث' :
                   selectedCase.category === 'administrative' ? 'إدارية وديوان مظالم' :
                   (selectedCase.category as string) === 'financial' ? 'مالية وضريبية' : 'عامة واستشارات'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">درجة التقاضي / الحالة الجارية:</span>
                <span className="font-black text-slate-900">
                  {selectedCase.status === 'active' ? 'نشطة جارية ومستمرة' :
                   selectedCase.status === 'closed' ? 'مغلقة منتهية نهائياً' : 'قيد الدراسة والمراجعة'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">تاريخ آخر جلسة مرافعة بالملف:</span>
                <span className="font-black text-slate-900 font-mono">{selectedCase.lastSessionDate || 'غير متوفر'}</span>
              </div>
            </div>
          </div>

          {/* Second Section: Client and Opponent Info */}
          <div className="grid grid-cols-2 gap-6 mb-8 relative z-10 page-break-avoid">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40">
              <h4 className="text-xs font-black text-amber-800 border-b border-slate-200 pb-2 mb-3">
                بيانات موكل المكتب (الطرف الأول)
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">الاسم الكريم:</span>{' '}
                  <span className="font-black text-slate-900">{selectedCase.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-500">الصفة القانونية:</span>{' '}
                  <span className="font-black text-slate-800">المدعي (صاحب الحق الموكل)</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40">
              <h4 className="text-xs font-black text-rose-800 border-b border-slate-200 pb-2 mb-3">
                بيانات الخصم (الطرف الثاني)
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">اسم الخصم الكامل:</span>{' '}
                  <span className="font-black text-slate-900">{selectedCase.opponentName || 'غير متوفر'}</span>
                </div>
                <div>
                  <span className="text-slate-500">الصفة القانونية للخصم:</span>{' '}
                  <span className="font-black text-slate-800">المدعى عليه (خصم الطرف الأول)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Third Section: Litigation Subject and Summary */}
          <div className="mb-8 p-6 rounded-2xl border border-slate-200 bg-white relative z-10 page-break-avoid">
            <h3 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-2 mb-3">
              ثالثاً: وقائع موضوع النزاع وتفاصيله القضائية
            </h3>
            <p className="text-xs text-slate-800 leading-relaxed text-justify mb-4">
              {selectedCase.details || 'لم يتم إدخال تفاصيل مطولة بعد لهذا الملف القضائي في النظام.'}
            </p>
            <div className="bg-amber-500/[0.03] p-4 rounded-xl border border-amber-200 italic text-slate-700 text-xs leading-relaxed">
              <strong>الملخص الإداري التنفيذي:</strong> "{selectedCase.summary}"
            </div>
          </div>

          {/* Fourth Section: Financial Transactions */}
          {selectedCase.financialRecords && selectedCase.financialRecords.length > 0 && (
            <div className="mb-8 relative z-10 page-break-avoid">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-2 mb-3">
                رابعاً: كشف الحساب المالي والرسوم الموثقة بالملف
              </h3>
              <table className="w-full text-right text-[10px] border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2 border-r border-slate-200">البيان / رسم المودع</th>
                    <th className="p-2 border-r border-slate-200 text-center">التاريخ</th>
                    <th className="p-2 border-r border-slate-200">نوع النفقة</th>
                    <th className="p-2 border-r border-slate-200 text-left">المبلغ الإجمالي (ر.س)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCase.financialRecords.map((rec: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{rec.description}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{rec.date}</td>
                      <td className="p-2 border-r border-slate-200">
                        {rec.type === 'expense' ? 'مصاريف قضائية خارجية' : rec.type === 'fee' ? 'رسوم قضائية حكومية' : 'أتعاب المحاماة والاستشارة'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-left font-mono font-bold text-slate-900">
                        {parseFloat(rec.amount || '0').toLocaleString()} ر.س
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/50 font-black border-t-2 border-slate-300">
                    <td colSpan={3} className="p-2 text-slate-900 text-left">إجمالي المبالغ والرسوم القضائية الموثقة:</td>
                    <td className="p-2 text-amber-800 text-left font-mono text-xs">
                      {selectedCase.financialRecords.reduce((acc: number, r: any) => acc + (r.amount ? parseFloat(r.amount) : 0), 0).toLocaleString()} ر.س
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures & Certification block */}
          <div className="mt-16 border-t border-slate-200 pt-8 relative z-10 flex justify-between items-center text-[10px] px-8 page-break-avoid">
            <div className="text-center space-y-4">
              <span className="font-bold text-slate-500 block">توقيع المستشار القانوني والمحامي المباشر</span>
              <div className="h-10"></div>
              <p className="font-black text-slate-900">مكتب المحاماة المعتمد للتقاضي</p>
            </div>
            
            <div className="text-center space-y-2 border-2 border-dashed border-amber-600/40 p-4 rounded-full w-20 h-20 flex flex-col items-center justify-center bg-amber-500/[0.02]">
              <span className="text-[8px] font-black text-amber-800 tracking-wider uppercase block leading-none">الختم الرسمي</span>
              <span className="text-lg">⚖️</span>
            </div>
            
            <div className="text-center space-y-4">
              <span className="font-bold text-slate-500 block">توقيع وإقرار موكل القضية (صاحب الشأن)</span>
              <div className="h-10"></div>
              <p className="font-black text-slate-900">{selectedCase.clientName}</p>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="space-y-8"
        dir="rtl"
      >
      {/* Back button */}
      <button 
        onClick={() => {
          onSelectCase(null);
          setAiAnalysis('');
        }}
        className="flex items-center gap-3 text-sm text-slate-500 font-bold hover:text-amber-600 transition-all group w-fit"
      >
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm group-hover:border-amber-200 transition-all">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </div>
        <span>العودة لقائمة جميع الدعاوى والنزاعات</span>
      </button>

      {/* Main Hero Header Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[60px] -ml-24 -mb-24"></div>

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
          <div className="space-y-6 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${
                selectedCase.priority === 'high' 
                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                : selectedCase.priority === 'medium' 
                ? 'bg-amber-50 text-amber-600 border-amber-100' 
                : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                <ShieldAlert className="w-3 h-3" />
                أولوية {selectedCase.priority === 'high' ? 'قصوى عاجلة' : selectedCase.priority === 'medium' ? 'متوسطة' : 'عادية'}
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                رقم الملف: {selectedCase.caseNumber}
              </span>
              {selectedCase.isNajizSync && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-black px-3 py-1 rounded-full inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  مزامنة ناجز النشطة
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
                {selectedCase.caseName}
              </h1>
              <button
                type="button"
                onClick={() => setActivityLogCaseId(selectedCase.id)}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100 transition-all"
                title="سجل النشاط والتعديلات"
              >
                <Clock className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-500">
              <div className="flex items-center gap-2 text-sm font-bold">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>{selectedCase.courtName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Eye className="w-4 h-4 text-amber-600" />
                <span>آخر تحديث: {selectedCase.lastSessionDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 w-full xl:w-80">
            <button 
              onClick={() => handleTriggerAiAnalysis(selectedCase)}
              className="w-full bg-slate-900 text-white font-black px-6 py-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-95 group"
            >
              <Cpu className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>تحليل قانوني معمق (AI)</span>
            </button>

            <button 
              onClick={() => {
                const clientObj = clients.find(cl => cl.id === selectedCase.clientId);
                if (!clientObj) return;
                const msg = `أهلاً بك سعادة العميل / ${clientObj.name}\nلقد تم تفعيل حسابكم في بوابتكم القضائية (العدالة) لمتابعة مستجدات الدعوى رقم (${selectedCase.caseNumber}).`;
                const phone = clientObj.phone.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="w-full bg-white border border-slate-200 text-slate-300 font-black px-6 py-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700 active:scale-95 shadow-sm"
            >
              <Share2 className="w-5 h-5 text-emerald-500" />
              <span>إرسال تعميد العميل</span>
            </button>

            <button 
              onClick={() => handleExportToPdf(selectedCase)}
              className="w-full bg-amber-50 text-amber-700 border border-amber-200 font-black px-6 py-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all hover:bg-amber-100 active:scale-95 shadow-sm"
            >
              <Printer className="w-5 h-5" />
              <span>تصدير ملف الدعوى (PDF)</span>
            </button>

            <button 
              onClick={() => window.print()}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black px-6 py-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all hover:from-amber-700 hover:to-amber-800 active:scale-95 shadow-lg shadow-amber-550/20"
            >
              <Printer className="w-5 h-5 text-amber-100" />
              <span>طباعة ملف القضية ورقياً 🖨️</span>
            </button>
          </div>
        </div>

        {/* Dynamic Stepper - Luxurious Dark Blue Cards Progress Bar */}
        <div className="mt-12 pt-12 border-t border-slate-800" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { id: 'litigation', label: 'تجهيز اللائحة', sub: 'إعداد صحيفة الدعوى والقرائن القضائية' },
              { id: 'sessions', label: 'المرافعات', sub: 'تبادل المذكرات الجوابية وحضور الجلسات أمام الدائرة' },
              { id: 'appeals', label: 'الاستئناف', sub: 'تقديم الاعتراض بالاستئناف وطلب التدقيق القضائي' },
              { id: 'execution', label: 'التنفيذ', sub: 'تقديم طلب التنفيذ المالي والقرارات القضائية' },
              { id: 'done', label: 'الحكم القطعي', sub: 'اكتساب الصفة القطعية النهائية وبدء التحصيل' }
            ].map((st, idx) => {
              const stages = ['litigation', 'appeals', 'execution', 'archived'];
              const currentIdx = stages.indexOf(selectedCase.stage);
              const isPassed = idx <= (currentIdx === -1 ? 1 : currentIdx);
              const isCurrent = idx === (currentIdx === -1 ? 1 : currentIdx);
              
              return (
                <div 
                  key={idx} 
                  className={`relative rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-2xl overflow-hidden border-2 group ${
                    isCurrent 
                      ? 'bg-gradient-to-br from-[#0a1e3a] to-[#040e21] border-[#ff7f00] shadow-[0_0_25px_rgba(255,127,0,0.3)] ring-2 ring-[#ff7f00]/20' 
                      : isPassed 
                        ? 'bg-gradient-to-br from-[#0a1e3a] to-[#040e21] border-[#facc15] shadow-[0_0_20px_rgba(250,204,21,0.2)]'
                        : 'bg-gradient-to-br from-[#051124] to-[#020712] border-slate-800/80 hover:border-slate-700/60'
                  }`}
                  style={{ minHeight: '170px' }}
                >
                  {/* Subtle luxury glow effect inside the card */}
                  <div className={`absolute inset-0 bg-gradient-to-b opacity-10 pointer-events-none ${
                    isCurrent 
                      ? 'from-[#ff7f00]/30 to-transparent' 
                      : isPassed 
                        ? 'from-[#facc15]/30 to-transparent'
                        : 'from-blue-500/10 to-transparent'
                  }`} />

                  {/* Top header row: Circle Icon + Action State Badge */}
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 border shadow-md ${
                      isCurrent 
                        ? 'bg-gradient-to-r from-[#ff7f00] to-orange-500 text-white border-orange-400 shadow-orange-500/20' 
                        : isPassed 
                          ? 'bg-gradient-to-r from-[#facc15] to-amber-500 text-slate-950 border-white shadow-amber-500/20'
                          : 'bg-slate-900/60 text-[#facc15] border-slate-700/60'
                    }`}>
                      {isPassed && idx < (currentIdx === -1 ? 1 : currentIdx) ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <span className="font-mono text-base font-black">{idx + 1}</span>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-full border ${
                      isCurrent 
                        ? 'bg-[#ff7f00]/10 text-[#ff7f00] border-[#ff7f00]/30' 
                        : isPassed 
                          ? 'bg-[#facc15]/10 text-[#facc15] border-[#facc15]/30'
                          : 'bg-slate-900/40 text-slate-400 border-slate-800'
                    }`}>
                      {isCurrent ? 'مرحلة حالية' : isPassed ? 'مرحلة مكتملة' : 'قيد الانتظار'}
                    </span>
                  </div>

                  {/* Case Stage Text Information */}
                  <div className="relative z-10 space-y-2 mt-auto">
                    <h4 className={`text-sm font-black tracking-tight leading-none transition-colors ${
                      isCurrent 
                        ? 'text-[#ff7f00] drop-shadow-[0_0_8px_rgba(255,127,0,0.3)]' 
                        : isPassed 
                          ? 'text-[#facc15] drop-shadow-[0_0_8px_rgba(250,204,21,0.2)]'
                          : 'text-white/90 group-hover:text-white'
                    }`}>
                      {st.label}
                    </h4>
                    <p className={`text-[10px] leading-relaxed font-semibold ${
                      isCurrent 
                        ? 'text-white' 
                        : isPassed 
                          ? 'text-slate-100'
                          : 'text-slate-400/95'
                    }`}>
                      {st.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Details & Documentation */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Bento-style Archive Section */}
          <section className="bg-[#030a16] border border-slate-800/80 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-[#0b1329] text-[#ff7f00] rounded-2xl border border-slate-800 shadow-md">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-white tracking-tight">الأرشفة الإلكترونية المنظمة</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Structured Legal Workspace</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUploadFormOpen(!isUploadFormOpen)}
                className="px-5 py-3 rounded-2xl bg-[#ff7f00] hover:bg-orange-500 text-slate-950 text-xs font-black shadow-lg hover:shadow-[#ff7f00]/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                إيداع مستند جديد
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'pleadings', label: 'اللوائح الجوابية والاعتبارية', icon: FileText, count: caseAttachments.filter(a => a.category === 'pleadings' || a.category === 'pleading').length, color: 'text-[#ff7f00]', bg: 'bg-[#ff7f00]/10 border-[#ff7f00]/20' },
                { id: 'documents', label: 'المستندات الثبوتية والمرافعات', icon: Paperclip, count: caseAttachments.filter(a => a.category === 'documents' || a.category === 'evidence').length, color: 'text-[#facc15]', bg: 'bg-[#facc15]/10 border-[#facc15]/20' },
                { id: 'judgments', label: 'الأحكام والصكوك القضائية', icon: Gavel, count: caseAttachments.filter(a => a.category === 'judgments' || a.category === 'judgment').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { id: 'execution', label: 'قرارات التنفيذ (مادة ٣٤/٤٦)', icon: Zap, count: caseAttachments.filter(a => a.category === 'execution').length, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
              ].map((cat) => {
                const isSelected = selectedDocCategory === cat.id;
                return (
                  <div 
                    key={cat.id} 
                    onClick={() => setSelectedDocCategory(isSelected ? 'all' : cat.id)}
                    className={`p-5 border rounded-3xl hover:border-[#ff7f00]/40 hover:shadow-2xl transition-all duration-300 group cursor-pointer bg-[#0b1329] ${
                      isSelected ? 'border-[#ff7f00] shadow-2xl ring-2 ring-[#ff7f00]/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl border group-hover:border-[#ff7f00]/30 transition-all ${cat.bg} ${cat.color}`}>
                        <cat.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-slate-950 text-[#facc15] border border-slate-800">
                        {cat.count} مستندات
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white group-hover:text-[#ff7f00] transition-colors">{cat.label}</h4>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 pt-4 mt-4 border-t border-slate-800/80">
                      <span>{isSelected ? 'تصفية نشطة حالياً' : 'اضغط للتصفية والفلترة'}</span>
                      <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#ff7f00] transition-all translate-y-2 group-hover:translate-y-0" />
                    </div>
                  </div>
                );
              })}
            </div>

            {isUploadFormOpen && (
              <DocumentUploadWidget 
                caseId={selectedCase.id} 
                onUploadComplete={() => {
                  loadCaseAttachments();
                  setIsUploadFormOpen(false);
                }} 
              />
            )}

            {/* Document Table Gallery */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-[#facc15] uppercase tracking-widest">
                  سجل المستندات المودعة ({selectedDocCategory === 'all' ? 'جميع التصنيفات' : 
                    selectedDocCategory === 'pleadings' ? 'اللوائح الجوابية والاعتبارية' :
                    selectedDocCategory === 'documents' ? 'المستندات الثبوتية والمرافعات' :
                    selectedDocCategory === 'judgments' ? 'الأحكام والصكوك القضائية' :
                    'قرارات التنفيذ'
                  })
                </h4>
                {selectedDocCategory !== 'all' && (
                  <button 
                    onClick={() => setSelectedDocCategory('all')}
                    className="text-[10px] font-black text-[#ff7f00] hover:underline bg-[#ff7f00]/10 px-3 py-1 rounded-full border border-[#ff7f00]/20 cursor-pointer"
                  >
                    عرض جميع المودعات
                  </button>
                )}
              </div>

              {caseAttachments.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-[#040e21] text-slate-400 text-xs font-bold" dir="rtl">
                  📂 لا يوجد مستندات مؤرشفة ومرفوعة لهذه القضية حالياً. انقر على "إيداع مستند جديد" لبدء الأرشفة.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold">
                        <th className="py-3 px-2">اسم المستند في الملف</th>
                        <th className="py-3 px-2">التصنيف</th>
                        <th className="py-3 px-2 text-center">الحجم</th>
                        <th className="py-3 px-2 text-center">تاريخ الإيداع</th>
                        <th className="py-3 px-2 text-center">التحكم والعمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {caseAttachments
                        .filter(a => selectedDocCategory === 'all' || a.category === selectedDocCategory)
                        .map((a) => (
                          <tr key={a.id} className="hover:bg-[#0b1329]/50 transition-colors">
                            <td className="py-3 px-2 font-black text-white flex items-center gap-2">
                              <span>📄</span>
                              <span>{a.fileName}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded-md font-sans font-bold text-[10px] ${
                                a.category === 'pleadings' ? 'bg-[#ff7f00]/20 text-[#ff7f00] border border-[#ff7f00]/30' :
                                a.category === 'documents' ? 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/30' :
                                a.category === 'judgments' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                a.category === 'execution' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {a.category === 'pleadings' ? 'لائحة جوابية' :
                                 a.category === 'documents' ? 'مستند ثبوتي' :
                                 a.category === 'judgments' ? 'حكم قضائي' :
                                 a.category === 'execution' ? 'قرار تنفيذ' : 'أخرى'}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center text-slate-300 font-mono text-[10px]">{a.fileSize}</td>
                            <td className="py-3 px-2 text-center text-slate-400 font-bold text-[10px]">{new Date(a.createdAt).toLocaleDateString('ar-SA')}</td>
                            <td className="py-3 px-2">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => setViewingAttachment(a)}
                                  className="px-3 py-1 bg-[#0b1329] hover:bg-[#040e21] text-[#facc15] border border-slate-800 hover:border-[#ff7f00]/30 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                                >
                                  عرض مستندي 👁️
                                </button>
                                <button 
                                  onClick={() => handleDeleteAttachment(a.id)}
                                  className="p-1 px-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900 text-rose-400 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                                  title="حذف المستند نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      {caseAttachments.filter(a => selectedDocCategory === 'all' || a.category === selectedDocCategory).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-bold text-xs">
                            لا توجد مستندات بعد في هذا التصنيف المحدد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Deep Details Section */}
          <section className="bg-[#030a16] border border-slate-800/80 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-850 pb-6">
              <div className="p-3.5 bg-[#0b1329] text-[#ff7f00] rounded-2xl border border-slate-800 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-white tracking-tight">تفاصيل موضوع النزاع</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Foundation Context Details</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-[#0b1329] p-8 rounded-[2rem] border border-slate-800/80 shadow-inner">
                <p className="text-sm md:text-base leading-relaxed font-bold text-white text-justify">
                  {selectedCase.details || 'لم يتم إدخال تفاصيل مطولة بعد لهذا الملف القضائي.'}
                </p>
              </div>

              <div className="bg-[#ff7f00]/10 p-6 rounded-2xl border border-[#ff7f00]/20 flex flex-col md:flex-row gap-6">
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#ff7f00]">ملخص الربط:</span>
                  <div className="w-10 h-1 bg-[#facc15] rounded-full"></div>
                </div>
                <p className="text-sm font-bold text-white leading-relaxed italic">
                  "{selectedCase.summary}"
                </p>
              </div>
            </div>
          </section>

          {/* AI Analysis Result (Light Mode Version) */}
          <AnimatePresence>
            {(isAiLoading || aiAnalysis) && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-6 relative z-10 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xl text-white tracking-tight">تحليل موكل (AI) المعمق</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sovereign Legal Intelligence</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">
                    V5.0 NEURAL CORE
                  </span>
                </div>

                {isAiLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-6 relative z-10">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-amber-500 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-amber-400" />
                      </div>
                    </div>
                    <p className="text-xs font-black tracking-widest text-slate-300 animate-pulse">جاري استنباط الأسانيد وفحص اللوائح التنفيذية...</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/50 p-8 rounded-[2rem] border border-slate-700 text-base leading-loose font-bold text-white text-justify relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                      <span className="text-[11px] uppercase font-black tracking-widest text-amber-400">ملخص الدراسة الفنية المقترحة للمرافعة</span>
                    </div>
                    <div className="whitespace-pre-line font-sans text-slate-200">
                      {aiAnalysis}
                    </div>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: AI Tools & Alerts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Gemini RAG Summarizer Card */}
          <div className="bg-[#0b1329] border border-slate-800/80 rounded-[2rem] p-6 space-y-6 shadow-2xl hover:border-[#ff7f00]/40 transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-[#ff7f00]/10 text-[#ff7f00] rounded-xl border border-[#ff7f00]/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-black text-xs text-[#facc15] uppercase tracking-wider">موجز المستندات الذكي</h3>
                <p className="text-[9px] text-slate-300 font-bold uppercase mt-0.5">Gemini RAG Summarizer Engine</p>
              </div>
            </div>

            <div className="space-y-4">
              {caseDocumentMemo ? (
                <div className="space-y-4">
                  <div className="bg-[#040e21] p-5 rounded-2xl border border-slate-800/80 text-[12px] text-white leading-relaxed font-bold whitespace-pre-line italic shadow-inner">
                    {caseDocumentMemo}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                        setCaseDocumentMemo('');
                        onUpdateState('cases', { ...selectedCase, summary: '' });
                    }}
                    className="w-full py-3 rounded-xl border border-slate-800 text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 text-[10px] font-black transition-all"
                  >
                    إعادة الصياغة / مسح الموجز 🗑️
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    rows={4}
                    value={caseDocumentText}
                    onChange={(e) => setCaseDocumentText(e.target.value)}
                    placeholder="ألصق نصوص المرافعة أو المستندات هنا لاستخراج ملخص آلي..."
                    className="w-full bg-[#040e21] border border-slate-800/80 p-4 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00]/40 transition-all placeholder-slate-500"
                  />
                  
                  <button
                    type="button"
                    onClick={handleCaseSummarize}
                    disabled={isCaseSummarizing || !caseDocumentText.trim()}
                    className={`w-full py-3.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                      isCaseSummarizing 
                        ? 'bg-slate-800 text-slate-400 cursor-wait'
                        : !caseDocumentText.trim()
                          ? 'bg-[#040e21] text-slate-500 border border-slate-800/80 cursor-not-allowed'
                          : 'bg-[#ff7f00] hover:bg-orange-500 text-slate-950 shadow-lg'
                    }`}
                  >
                    {isCaseSummarizing ? (
                      <div className="w-4 h-4 border-t-2 border-[#ff7f00] rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>تلخيص المستند بـ Gemini</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Automated Protocol Card */}
          <div className="bg-[#0b1329] border border-slate-800/80 rounded-[2rem] p-6 space-y-6 shadow-2xl overflow-hidden relative hover:border-[#ff7f00]/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] -mr-12 -mt-12"></div>
            
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 relative z-10">
              <div className="p-2.5 bg-[#ff7f00]/10 text-[#ff7f00] rounded-xl border border-[#ff7f00]/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-black text-xs text-[#facc15] uppercase tracking-wider">بروتوكول الإشعارات التلقائية</h3>
                <p className="text-[9px] text-slate-300 font-bold uppercase mt-0.5">Automated Client Broadcast Protocol</p>
              </div>
            </div>

            {/* Toggle Status Card */}
            <div className="bg-[#040e21] p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center relative z-10 shadow-inner">
              <div className="space-y-0.5 text-right">
                <span className="text-xs text-white font-black block">إرسال تلقائي للموكل</span>
                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">Active via WhatsApp Gateway</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentVal = (selectedCase as any).whatsappNotificationsEnabled !== false;
                  onUpdateState('cases', { ...selectedCase, whatsappNotificationsEnabled: !currentVal });
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                    (selectedCase as any).whatsappNotificationsEnabled !== false ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-300 ease-in-out ${
                   (selectedCase as any).whatsappNotificationsEnabled !== false ? '-translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Quick Status Switches */}
            <div className="space-y-3 relative z-10">
              <span className="text-[10px] text-slate-300 uppercase tracking-widest font-black block mb-4">تحفيز بث الإشعار الفوري:</span>
              
              <div className="space-y-2">
                {[
                  { id: 'active', label: 'نشطة مرافعة جارية', color: 'blue' },
                  { id: 'judgment_issued', label: 'حكم قضائي صادر', color: 'amber' },
                  { id: 'closed', label: 'إغلاق وتصفية الملف', color: 'rose' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStatusTransition(selectedCase, st.id)}
                    className={`w-full py-3 px-4 rounded-xl text-[10.5px] font-black flex items-center justify-between border transition-all group ${
                      selectedCase.status === st.id
                        ? `bg-gradient-to-r from-[#ff7f00] to-orange-600 text-white border-[#ff7f00] shadow-[0_0_15px_rgba(255,127,0,0.3)]`
                        : `bg-[#040e21] text-slate-200 border-slate-800/80 hover:border-[#ff7f00]/30 hover:text-white`
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        selectedCase.status === st.id ? 'bg-[#facc15] animate-pulse shadow-[0_0_8px_#facc15]' : 'bg-slate-700'
                      }`} />
                      <span>{st.label}</span>
                    </span>
                    {selectedCase.status === st.id && <Check className="w-4 h-4 text-[#facc15]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery History Log */}
            <div className="space-y-4 pt-4 border-t border-slate-800 relative z-10">
              <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">سجل البث لقنوات الواتساب</span>
              <div className="space-y-2.5">
                {whatsAppLogs.filter(log => log.caseNumber === selectedCase.caseNumber).length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-850 rounded-3xl flex flex-col items-center justify-center gap-3 bg-[#040e21]">
                    <MessageSquare className="w-6 h-6 text-slate-700" />
                    <p className="text-[10px] text-slate-500 font-black uppercase">No delivery events logged yet</p>
                  </div>
                ) : (
                  whatsAppLogs.filter(log => log.caseNumber === selectedCase.caseNumber).map((log, idx) => (
                    <div key={idx} className="bg-[#040e21] p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`font-black uppercase ${log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {log.status === 'success' ? 'SENT SUCCESS' : 'FAILED'}
                        </span>
                        <span className="text-slate-400 font-mono font-bold">{log.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-white font-bold leading-tight">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Parties Insight */}
          <div className="bg-[#0b1329] border border-slate-800/80 rounded-[2rem] p-6 space-y-6 shadow-2xl overflow-hidden group hover:border-[#ff7f00]/40 transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-black text-xs text-[#facc15] uppercase tracking-wider">أطراف النزاع</h3>
            </div>
            <div className="space-y-4 text-right">
               <div className="p-4 rounded-2xl bg-[#040e21] border border-slate-800/80 hover:bg-[#0b1329]/40 transition-all">
                  <span className="text-[9px] text-[#facc15] font-black uppercase block mb-1">المدعي (نظامي)</span>
                  <p className="text-sm font-black text-white">{selectedCase.clientName}</p>
               </div>
               <div className="p-4 rounded-2xl bg-[#040e21] border border-slate-800/80 hover:border-rose-900/50 transition-all group/opp">
                  <span className="text-[9px] text-[#ff7f00] font-black uppercase block mb-1">الطرف الخصم</span>
                  <p className="text-sm font-black text-white uppercase">{selectedCase.opponentName}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>

    {/* Magnificent Legal Document Viewer Modal */}
    {viewingAttachment && (
      <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
          {/* Header of Viewer */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">📄</span>
              <div className="text-right">
                <h3 className="font-sans font-black text-sm text-slate-900">{viewingAttachment.fileName}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  تصنيف: {
                    viewingAttachment.category === 'pleadings' ? 'اللوائح الجوابية والاعتبارية' :
                    viewingAttachment.category === 'documents' ? 'المستندات الثبوتية والمرافعات' :
                    viewingAttachment.category === 'judgments' ? 'الأحكام والصكوك القضائية' :
                    viewingAttachment.category === 'execution' ? 'قرارات التنفيذ' : 'مستندات عامة'
                  } • الحجم: {viewingAttachment.fileSize}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setViewingAttachment(null)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content of Document */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
            {viewingAttachment.fileUrl?.startsWith('data:image/') ? (
              <img 
                src={viewingAttachment.fileUrl} 
                alt={viewingAttachment.fileName} 
                className="max-w-full h-auto rounded-xl shadow-lg border border-slate-250 max-h-[60vh] object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* Professional Simulated Legal Document Sheet */
              <div className="bg-white max-w-2xl w-full border border-slate-300 p-12 rounded-xl shadow-md min-h-[70vh] flex flex-col justify-between font-sans relative overflow-hidden text-right leading-loose">
                {/* Corner Watermarks */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-slate-50 rounded-br-full flex items-center justify-center border-r border-b border-slate-200/50">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider rotate-[-45deg]">شعار المكتب</span>
                </div>
                <div className="absolute inset-0 bg-contain bg-center opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1000')` }}></div>

                {/* Upper Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8 text-xs font-black text-slate-900">
                  <div className="space-y-1 text-right">
                    <div>المحكمة: {selectedCase.courtName || "ديوان المظالم"}</div>
                    <div>الدائرة: الدائرة التجارية الثالثة</div>
                    <div>رقم الدعوى: {selectedCase.caseNumber}</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-xs font-black border border-slate-900 px-4 py-1.5 rounded-lg mb-1 bg-amber-50">مستند قضائي معتمد</div>
                    <div>تاريخ الإيداع: {new Date(viewingAttachment.createdAt).toLocaleDateString('ar-SA')}</div>
                  </div>
                </div>

                {/* Document Text Body */}
                <div className="flex-1 space-y-6 pt-2 pb-6 text-right">
                  <h4 className="text-center font-black text-base text-slate-950 border-b border-dashed border-slate-200 pb-4 mb-4">{viewingAttachment.fileName}</h4>
                  <div className="text-sm font-bold text-slate-800 leading-relaxed text-justify space-y-4">
                    <p>إلى فضيلة رئيس الدائرة القضائية الموقر، وبصفتنا وكلاء المستدعى في الدعوى المقيدة أعلاه، يطيب لنا تقديم هذا المستند تلبية لمتطلبات المرافعة العادلة وحفظاً لحقوق موكلنا في النزاع المنظور أمام فضيلتكم الموقرة.</p>
                    
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-4 text-right">
                      <div className="text-amber-700 tracking-wider font-black">تفاصيل ملف الدعوى الفني:</div>
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                        <div>الموكل: {clients.find(cl => cl.id === selectedCase.clientId)?.name || '---'}</div>
                        <div>رقم القضية بالنظام: #{selectedCase.id.slice(0, 8)}</div>
                        <div>تصنيف المستند المودع: {viewingAttachment.category}</div>
                        <div>اسم ملف التخزين السحابي: {viewingAttachment.storagePath.split('/').pop()?.slice(0, 20)}...</div>
                      </div>
                    </div>

                    <p className="mt-6 font-bold">نسأل الله لفضيلتكم العون والسداد في قضائكم العادل وإرساء مبادئ الحق والعدالة ونصرة المظلوم.</p>
                  </div>
                </div>

                {/* Legal Footer Stamp & Signature */}
                <div className="border-t border-slate-400 pt-6 mt-6 flex justify-between items-center text-xs font-bold text-slate-500">
                  <div className="text-right">
                    <div>مقدمه: مكتب العدالة والمحاماة للاستشارات القضائية</div>
                    <div className="mt-2 text-[10px] text-emerald-600 font-sans tracking-tight">✓ توقيع إلكتروني ثنائي مأمون وثابت</div>
                  </div>
                  {/* Visual Stamp */}
                  <div className="w-16 h-16 rounded-full border-4 border-double border-rose-600/60 flex items-center justify-center flex-col text-rose-600/60 font-black tracking-widest text-[8px] rotate-[15deg] select-none">
                    <span className="font-sans">ADALAH</span>
                    <span>مكتب العدالة</span>
                    <span>معتمد</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer of Viewer */}
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = viewingAttachment.fileUrl;
                link.download = viewingAttachment.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors cursor-pointer"
            >
              تحميل المستند الأصلي
            </button>
            <button 
              onClick={() => setViewingAttachment(null)}
              className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-xs transition-colors cursor-pointer"
            >
              إغلاق نافذة العرض
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Elegant Formal Legal Print Layout (Visible ONLY on print) */}
    <div className="hidden print:block official-print-report official-print-case-report text-slate-900 font-serif" dir="rtl">
      {/* Royal Headings */}
      <div className="flex justify-between items-center border-b-2 border-amber-600 pb-6 mb-8">
        <div className="text-right text-xs space-y-1 font-bold text-slate-600">
          <div>المملكة العربية السعودية</div>
          <div>ديوان المظالم / وزارة العدل</div>
          <div>منصة العدالة الموحدة للمحاماة</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-amber-600/10 border border-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-amber-700">
            ⚖️
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">تقرير ملف دعوى قضائية رسمي معتمد</h1>
          <p className="text-[10px] text-slate-500 font-mono">ADALAH CASE MANAGEMENT REPORT</p>
        </div>
        <div className="text-left text-xs space-y-1 font-bold text-slate-600">
          <div>الرقم المرجعي: {selectedCase.id.slice(0, 8).toUpperCase()}</div>
          <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</div>
          <div>وقت المعاينة: {new Date().toLocaleTimeString('ar-SA')}</div>
        </div>
      </div>

      {/* Main Core Case Frame */}
      <div className="official-print-border space-y-6">
        <div className="border-b border-slate-200 pb-3 mb-4">
          <h2 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
            <span>◆ البيانات الأساسية لملف الدعوى القضائية</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs leading-relaxed">
          <div className="border-b border-dashed border-slate-100 pb-2">
            <span className="font-bold text-slate-500">اسم القضية / موضوع الخصومة: </span>
            <strong className="text-slate-900 text-[13px]">{selectedCase.caseName}</strong>
          </div>
          <div className="border-b border-dashed border-slate-100 pb-2">
            <span className="font-bold text-slate-500">رقم قيد القضية الموحد: </span>
            <strong className="text-slate-900 text-[13px] font-sans">{selectedCase.caseNumber}</strong>
          </div>
          <div className="border-b border-dashed border-slate-100 pb-2">
            <span className="font-bold text-slate-500">المحكمة القضائية المختصة: </span>
            <strong className="text-slate-900 text-[13px]">{selectedCase.courtName}</strong>
          </div>
          <div className="border-b border-dashed border-slate-100 pb-2">
            <span className="font-bold text-slate-500">رقم الدائرة القضائية: </span>
            <strong className="text-slate-900 text-[13px]">{selectedCase.circuitNumber || 'الدائرة الأولى'}</strong>
          </div>
          <div className="border-b border-dashed border-slate-100 pb-2">
            <span className="font-bold text-slate-500">تصنيف الدعوى: </span>
            <strong className="text-slate-900 text-[13px] capitalize">{selectedCase.category}</strong>
          </div>
          <div className="border-b border-dashed border-slate-100 pb-2">
            <span className="font-bold text-slate-500">المرحلة الإجرائية الحالية: </span>
            <strong className="text-slate-900 text-[13px]">{selectedCase.stage === 'litigation' ? 'جلسات المرافعة' : selectedCase.stage === 'appeals' ? 'سير الاستئناف' : selectedCase.stage === 'execution' ? 'التنفيذ وإصدار الصك' : 'الحكم القطعي المنتهي'}</strong>
          </div>
        </div>
      </div>

      {/* Litigants */}
      <div className="official-print-border space-y-6 mt-6">
        <div className="border-b border-slate-200 pb-3 mb-4">
          <h2 className="text-sm font-black text-amber-800 uppercase tracking-widest">
            <span>◆ أطراف النزاع والخصومة والتمثيل القانوني</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
            <div className="font-black text-slate-700 pb-1 border-b border-slate-200">الطرف الأول (المدعي / الموكل):</div>
            <div>
              <span className="text-slate-500">الاسم الكريم:</span> <strong className="text-slate-900">{selectedCase.clientName}</strong>
            </div>
            <div>
              <span className="text-slate-500">الفئة:</span> <span className="text-slate-900">موكل مصادق عليه</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
            <div className="font-black text-slate-700 pb-1 border-b border-slate-200">الطرف الثاني (المدعى عليه / الخصم):</div>
            <div>
              <span className="text-slate-500">اسم الخصم المقيد:</span> <strong className="text-slate-900">{selectedCase.opponentName || 'غير مقيد بالملف'}</strong>
            </div>
            <div>
              <span className="text-slate-500">رقم الهوية الوطنية/السجل للخصم:</span> <span className="text-slate-900 font-sans">{selectedCase.opponentNationalId || 'غير متوفر'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Case Details / Facts */}
      <div className="page-break-avoid official-print-border space-y-4 mt-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-sm font-black text-amber-800">◆ تفاصيل موضوع الدعوى ومذكرات ومطالبات الموضوع</h2>
        </div>
        <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
          {selectedCase.details || 'لم يتم تدوين تفاصيل موضوعية بالملف الرئيسي حتى تاريخ إصدار هذا التقرير.'}
        </p>
      </div>

      {/* Scheduled Sessions Log */}
      <div className="page-break-avoid official-print-border space-y-4 mt-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-sm font-black text-amber-800">◆ مواعيد الجلسات وسجل الاستحقاق القضائي القادم</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1">
            <div className="font-black text-amber-700">موعد الجلسة القضائية المجدولة القادمة:</div>
            <div>التاريخ: {selectedCase.nextSessionDate || 'لا توجد جلسات معلنة قريباً'}</div>
            {selectedCase.nextSessionTime && <div>الوقت المعتمد: {selectedCase.nextSessionTime}</div>}
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="font-black text-slate-700">تاريخ آخر جلسة قضائية ومحضر ضبط:</div>
            <div>تاريخ المعاملة: {selectedCase.lastSessionDate || 'لا تتوفر جلسات مسجلة سابقاً'}</div>
          </div>
        </div>
      </div>

      {/* AI Summary and Strategy */}
      {(aiAnalysis || selectedCase.aiRecommendations) && (
        <div className="page-break-avoid official-print-border space-y-4 mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-sm font-black text-amber-800 flex items-center gap-1.5">
              <span>🧠 التحليل القضائي الاستراتيجي التلقائي (الذكاء الاصطناعي)</span>
            </h2>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
            {aiAnalysis || selectedCase.aiRecommendations}
          </div>
        </div>
      )}

      {/* Financial Statement */}
      {selectedCase.financialRecords && selectedCase.financialRecords.length > 0 && (
        <div className="page-break-avoid official-print-border space-y-4 mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-sm font-black text-amber-800">◆ كشف الحساب المالي للقضية والمصاريف والرسوم المودعة</h2>
          </div>
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="p-2 font-black text-slate-700">البيان / الوصف</th>
                <th className="p-2 font-black text-slate-700 text-center">التاريخ</th>
                <th className="p-2 font-black text-slate-700">النوع</th>
                <th className="p-2 font-black text-slate-700 text-left">المبلغ (ر.س)</th>
              </tr>
            </thead>
            <tbody>
              {selectedCase.financialRecords.map((rec: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="p-2 text-slate-800">{rec.description}</td>
                  <td className="p-2 text-slate-500 text-center font-sans">{rec.date}</td>
                  <td className="p-2 text-slate-600">{rec.type === 'expense' ? 'مصاريف مكتب' : rec.type === 'fee' ? 'رسوم قضائية' : 'أتعاب محاماة'}</td>
                  <td className="p-2 text-slate-900 font-sans text-left font-bold">{rec.amount} ر.س</td>
                </tr>
              ))}
              <tr className="bg-slate-50 border-t border-slate-300 font-black">
                <td colSpan={3} className="p-2 text-slate-900">إجمالي النفقات والرسوم الموثقة بالملف:</td>
                <td className="p-2 text-amber-700 text-left font-sans">
                  {selectedCase.financialRecords.reduce((acc: number, r: any) => acc + (r.amount ? parseFloat(r.amount) : 0), 0).toLocaleString()} ر.س
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Authentications Seals & Signatures */}
      <div className="page-break-avoid mt-12 border-t border-slate-300 pt-8 flex justify-between items-start text-xs text-slate-600">
        <div className="text-right space-y-2">
          <div className="font-black text-slate-850">مكتب المحامي والمستشار القانوني المعتمد</div>
          <div className="text-[10px] text-emerald-600">✓ تم التوثيق إلكترونياً بالتوافق مع المعايير العدلية الرقمية</div>
          <div className="h-16"></div>
          <div>التوقيع / المصادقة: .......................................</div>
        </div>

        {/* Traditional Legal Seal */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-4 border-double border-amber-600 flex flex-col items-center justify-center text-amber-600 font-bold rotate-12 select-none">
            <span className="text-[7px] font-sans">ADALAH FIRM</span>
            <span className="text-[9px] font-black">ختم معتمد مستقل</span>
            <span className="text-[7px]">ديوان العدالة</span>
          </div>
          <span className="text-[9px] text-slate-400 mt-2 font-mono">ID: {selectedCase.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
    </>

  );
};

export default EnhancedCaseDetail;
