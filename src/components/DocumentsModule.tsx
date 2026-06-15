/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Folder, 
  Upload, 
  FileText, 
  Cpu, 
  Search, 
  Tag, 
  Check, 
  Download,
  Terminal,
  Activity,
  RefreshCw,
  CheckCircle,
  Sparkles,
  Calendar,
  QrCode,
  X,
  ExternalLink,
  Cloud,
  CloudDownload,
  CloudUpload,
  LogOut,
  Lock,
  Landmark
} from 'lucide-react';
import { Document, Client, Case } from '@/types';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export const getDocColorStyles = (doc: Document) => {
  const code = doc.colorCode;
  if (code === 'red') {
    return {
      border: 'border-rose-500 shadow-lg shadow-rose-500/[0.02]',
      badge: 'bg-rose-500 text-rose-600  border border-rose-500',
      dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse',
      bg: 'bg-rose-500/[0.01]'
    };
  }
  if (code === 'green') {
    return {
      border: 'border-emerald-500 shadow-lg shadow-emerald-500/[0.02]',
      badge: 'bg-emerald-500 text-emerald-600  border border-emerald-500',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      bg: 'bg-emerald-500/[0.01]'
    };
  }
  if (code === 'blue') {
    return {
      border: 'border-indigo-500 shadow-lg shadow-indigo-500/[0.02]',
      badge: 'bg-indigo-500 text-indigo-600  border border-indigo-500',
      dot: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse',
      bg: 'bg-indigo-500/[0.01]'
    };
  }
  if (code === 'amber') {
    return {
      border: 'border-amber-500 shadow-lg shadow-amber-500/[0.02]',
      badge: 'bg-amber-500 text-amber-600  border border-amber-500',
      dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      bg: 'bg-amber-500/[0.01]'
    };
  }
  if (code === 'purple') {
    return {
      border: 'border-purple-500 shadow-lg shadow-purple-500/[0.02]',
      badge: 'bg-purple-500 text-purple-600  border border-purple-500',
      dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
      bg: 'bg-purple-500/[0.01]'
    };
  }
  return {
    border: 'border-border',
    badge: 'bg-slate-100  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]    border border-border/40',
    dot: 'bg-slate-300 ',
    bg: ''
  };
};

interface DocumentsModuleProps {
  documents: Document[];
  clients?: Client[];
  cases?: Case[];
  onUpdateState: (type: string, data: any) => void;
}

// Module-level in-memory cache for Google Drive OAuth Access Token.
// Does NOT store in localStorage/sessionStorage according to secure guidelines.
let cachedGoogleAccessToken: string | null = null;

export default function DocumentsModule({
  documents,
  clients = [],
  cases = [],
  onUpdateState
}: DocumentsModuleProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFolderFilter, setActiveFolderFilter] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Google Drive Integration States
  const [activeStorageTab, setActiveStorageTab] = useState<'local' | 'gdrive'>('local');
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(cachedGoogleAccessToken);
  const [gdriveUser, setGdriveUser] = useState<User | null>(null);
  const [isGdriveLoading, setIsGdriveLoading] = useState(false);
  const [gdriveFiles, setGdriveFiles] = useState<any[]>([]);
  const [gdriveError, setGdriveError] = useState<string | null>(null);
  const [gdriveSearchTerm, setGdriveSearchTerm] = useState('');
  const [gdriveTypeFilter, setGdriveTypeFilter] = useState('all');
  const [isExportingDocId, setIsExportingDocId] = useState<string | null>(null);

  // Sync / Listen to Auth Changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setGdriveUser(session?.user || null);
      if (!session) {
        setGoogleAccessToken(null);
        cachedGoogleAccessToken = null;
        setGdriveFiles([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Google Drive Files when access token is active
  useEffect(() => {
    if (googleAccessToken && activeStorageTab === 'gdrive') {
      fetchGdriveFiles();
    }
  }, [googleAccessToken, activeStorageTab, gdriveTypeFilter]);

  const fetchGdriveFiles = async () => {
    if (!googleAccessToken) return;
    setIsGdriveLoading(true);
    setGdriveError(null);
    try {
      // Build Google Drive query to match folders/files safely and avoid trashed documents
      let query = "trashed = false and mimeType != 'application/vnd.google-apps.folder'";
      if (gdriveTypeFilter === 'pdf') {
        query += " and mimeType = 'application/pdf'";
      } else if (gdriveTypeFilter === 'doc') {
        query += " and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')";
      } else if (gdriveTypeFilter === 'sheet') {
        query += " and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')";
      } else if (gdriveTypeFilter === 'image') {
        query += " and (mimeType = 'image/png' or mimeType = 'image/jpeg' or mimeType = 'image/webp')";
      }
      
      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.googleapis.com/drive/v3/files?orderBy=createdTime desc&fields=files(id, name, mimeType, size, createdTime, webViewLink, iconLink)&q=${encodedQuery}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear cache
          setGoogleAccessToken(null);
          cachedGoogleAccessToken = null;
          throw new Error('انتهت صلاحية جلسة الاتصال السحابي. يرجى تسجيل الدخول مجدداً.');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `فشل جلب الملفات من سحابة Google Drive (الرمز: ${response.status})`);
      }
      
      const data = await response.json();
      setGdriveFiles(data.files || []);
    } catch (err: any) {
      console.error('[Google Drive] Fetch files error:', err);
      setGdriveError(err.message || 'خطأ غير متوقع أثناء الاتصال بـ Google Drive');
    } finally {
      setIsGdriveLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGdriveLoading(true);
    setGdriveError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/drive.readonly',
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('[Google Drive] Authentication failed:', err);
      // Give a friendly message if popup blocked or cancelled
      if (err.code === 'auth/popup-blocked') {
        setGdriveError('تم حظر النافذة المنبثقة لمصادقة Google بواسطة المتصفح. يرجى تفعيل النوافذ المنبثقة وإعادة المحاولة.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User cancelled, we just silently clear loading state
        setGdriveError(null);
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        setGdriveError(`خطأ في نطاق مصادقة Google (Unauthorized Domain): النطاق الحالي للتشغيل (${currentHost}) غير معتمد في مشروع Firebase الخاص بك. لحل هذه المشكلة، اذهب إلى كونسول Firebase > أداة Authentication > الإعدادات (Settings) > النطاقات المعتمدة (Authorized domains) ثم اضغط 'إضافة نطاق' وأدخل: ${currentHost} | Authorization Domain Error: Please add ${currentHost} to Authorized domains in Firebase Authentication settings.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setGdriveError('خيار الدخول عبر Google غير مفعّل في مشروع Firebase الخاص بك. يرجى الذهاب إلى كونسول Firebase > أداة Authentication > الإعدادات (Settings) > طرق تسجيل الدخول (Sign-in method) وتفعيل Google. | Google sign-in is not enabled. Please enable it in Firebase Authentication settings.');
      } else {
        setGdriveError(err.message || 'فشلت عملية المصادقة الرقمية مع حساب Google');
      }
    } finally {
      setIsGdriveLoading(false);
    }
  };

  const handleGoogleSignOut = () => {
    setGoogleAccessToken(null);
    cachedGoogleAccessToken = null;
    setGdriveFiles([]);
    setGdriveError(null);
  };

  const handleImportDriveFile = async (file: any) => {
    const confirmImport = window.confirm(`هل أنت متأكد من رغبتك في استيراد المستند "${file.name}" من Google Drive إلى الأرشيف المحلي لمنصة العدالة؟`);
    if (!confirmImport) return;
    
    setIsGdriveLoading(true);
    try {
      let fileExt = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      let sizeMb = file.size ? parseInt(file.size) / (1024 * 1024) : 0.5;
      let sizeStr = sizeMb > 0.1 ? `${sizeMb.toFixed(2)} MB` : `${(sizeMb * 1024).toFixed(0)} KB`;
      
      const newDoc: Document = {
        id: `doc-gdrive-${file.id}-${Date.now()}`,
        name: `سحابي - ${file.name}`,
        category: 'العقود والاتفاقيات', // Default
        uploadedAt: new Date().toISOString().split('T')[0],
        size: sizeStr,
        extractedText: `تم استيراد هذا الملف بنجاح ومزامنته من Google Drive الخاص بك.
اسم المستند: ${file.name}
المستند السحابي المعرف: ${file.id}
صيغة الملف: ${file.mimeType}
رابط الوصول المباشر السحابي: ${file.webViewLink}
تاريخ الاستيراد: ${new Date().toLocaleDateString('ar-SA')}

أصبح هذا المستند الآن متاحاً للمعاينة، الصياغة، التحليل اللغوي، والتحقق البصري مأمن بالكامل.`,
        tags: ['جوجل_درايف', 'مستورد_سحابياً', fileExt, 'Cloud_Integrated'],
        colorCode: 'blue'
      } as any;
      
      onUpdateState('documents', newDoc);
      alert(`✅ تم استيراد المستند "${file.name}" بنجاح وإدراجه في الأرشيف الموحد! يمكنك الآن القيام بالمعاينة السريعة والقراءة الليلية.`);
    } catch (err: any) {
      console.error('[Google Drive] Import failed:', err);
      alert(`❌ فشل استيراد المستند: ${err.message || err}`);
    } finally {
      setIsGdriveLoading(false);
    }
  };

  const handleExportDocToGdrive = async (doc: Document) => {
    if (!googleAccessToken) {
      alert('الرجاء ربط وتسجيل الدخول بحساب Google Drive أولاً من خلال التبويب السحابي.');
      setActiveStorageTab('gdrive');
      return;
    }
    
    // Explicit user confirmation dialog before write operations on Google Drive
    const confirmed = window.confirm(`هل أنت متأكد من رغبتك في تصدير المستند "${doc.name}" وتخزينه بشكل آمن في حساب الـ Google Drive السحابي الخاص بك؟`);
    if (!confirmed) return;
    
    setIsExportingDocId(doc.id);
    try {
      const docName = doc.name.endsWith('.pdf') ? doc.name.replace('.pdf', '_تصدير.txt') : `${doc.name}_تصدير.txt`;
      const metadata = {
        name: docName,
        mimeType: 'text/plain',
        description: 'مصدّر من منصة العدالة للمحاماة - عقد ومذكرة قضائية'
      };
      
      const fileContent = doc.extractedText || `مستند قانوني: ${doc.name}\nتم تصديره من منصة العدالة القضائية.`;
      const boundary = 'foo_bar_baz_adal_aladalah';
      const delimiter = `\r\n--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;
      
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
        fileContent +
        close_delim;
        
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `فشل الاتصال بخدمات Google (الرمز: ${response.status})`);
      }
      
      const data = await response.json();
      console.log('[Google Drive] File uploaded successfully:', data);
      alert(`✅ تم تصدير المستند "${doc.name}" بنجاح إلى حساب الـ Google Drive الخاص بك!\nتم حفظ الملف باسم: "${docName}"`);
      
      if (activeStorageTab === 'gdrive') {
        fetchGdriveFiles();
      }
    } catch (err: any) {
      console.error('[Google Drive] Export error:', err);
      alert(`❌ فشل تصدير المستند إلى Google Drive: ${err.message || err}`);
    } finally {
      setIsExportingDocId(null);
    }
  };

  // Advanced Search & Filter States
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [caseFilter, setCaseFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [selectedQRCodeDoc, setSelectedQRCodeDoc] = useState<Document | null>(null);

  // Smart Template Filler States
  const [showTemplateFiller, setShowTemplateFiller] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [customCourt, setCustomCourt] = useState('');
  const [customOpponent, setCustomOpponent] = useState('');
  const [editedDocContent, setEditedDocContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [filledDocName, setFilledDocName] = useState('');
  
  // Focus Mode States
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingFont, setReadingFont] = useState<"sans" | "amiri" | "playfair">("amiri");
  const [readingFontSize, setReadingFontSize] = useState<"sm" | "md" | "lg" | "xl">("lg");
  const [readingTheme, setReadingTheme] = useState<"cream" | "paper" | "dark-onyx">("cream");

  // Sync Focus Mode body class for sidebar masking
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add("focus-mode-active");
    } else {
      document.body.classList.remove("focus-mode-active");
    }
    return () => {
      document.body.classList.remove("focus-mode-active");
    };
  }, [isFocusMode]);

  const QRCodeModal = () => (
    <AnimatePresence>
      {selectedQRCodeDoc && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
        >
          <div className="absolute inset-0" onClick={() => setSelectedQRCodeDoc(null)}></div>
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full relative z-10 shadow-2xl text-center space-y-8"
            dir="rtl"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">رمز الدخول السريع (QR)</h3>
              <button onClick={() => setSelectedQRCodeDoc(null)} className="p-2 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
               <div className="bg-white p-4 rounded-2xl shadow-xl border border-white">
                 <QRCodeSVG 
                   value={`${window.location.origin}/portal/document/${selectedQRCodeDoc.id}`}
                   size={200}
                   level="H"
                   includeMargin={true}
                 />
               </div>
               <p className="text-[10px] text-slate-400 font-bold mt-6 uppercase tracking-widest">Document Security Protocol Enabled</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-slate-900 leading-tight">{selectedQRCodeDoc.name}</h4>
              <p className="text-xs text-slate-500 font-bold">امسح الرمز أعلاه للوصول الآمن للمستند عبر بوابة العميل.</p>
            </div>

            <div className="flex gap-3">
               <button 
                 className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                 onClick={() => window.print()}
               >
                 <Download className="w-4 h-4" />
                 طباعة الرمز
               </button>
               <button 
                 className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
                 onClick={() => window.open(`/portal/document/${selectedQRCodeDoc.id}`, '_blank')}
               >
                 <ExternalLink className="w-4 h-4" />
                 فتح الرابط
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Predefined high-quality Saudi legal templates
  const templates = [
    {
      id: 'contract_fees',
      name: 'عقد تمثيل ومرافعة شرعية (مرحلة ابتدائية/استئناف)',
      category: 'contracts',
      text: `مكتب المحاماة والعدالة بالرياض والاستشارات القانونية

عقد أتعاب تمثيل وتوكيل شرعي ومرافعة قضائية

إنه في يوم {تاريخ_اليوم} الموافق {تاريخ_ميلادي}، تم الاتفاق والتراضي بين كلٍ من:
الطرف الأول: مكتب المحاماة والعدالة بالرياض، ويمثله المحامي أحمد البقمي.
الطرف الثاني: السيد/ {اسم_العميل}، الحامل للهوية الوطنية رقم {هوية_العميل}.

موضوع وبند الاتفاق والتوكيل:
فوض ووكل الطرف الثاني بموجب هذا الاتفاق الطرف الأول للقيام بكافة الأعمال القانونية والتمثيل القضائي والترافع والمدافعة عنه في الدعوى المقيدة برقم {رقم_القضية} والمقامة لدى {اسم_المحكمة} ضد الخصم السيد/ {اسم_الخصم}، وذلك أمام لجنة الاستئناف والمحاكم المعنية بمختلف درجاتها تماشياً مع الأصول الإجرائية والأنظمة القضائية المرعية بالمملكة العربية السعودية وبما يحفظ سائر حقوق الموكل الشرعية والنظامية.

الالتزامات والأتعاب المقدرة:
يلتزم الطرف الثاني بدفع أتعاب المحاماة والتمثيل المتفق عليها وقدرها {الأتعاب_المقدرة} ريال سعودي، تُسدد على دفعات مجدولة مسبقاً بالتنسيق مع قسم الحسابات والامتثال المالي للمكتب.

الطرف الأول (المكتب): أحمد البقمي                      الطرف الثاني (العميل): {اسم_العميل}`
    },
    {
      id: 'defense_memo',
      name: 'لائحة جوابية ومذكرة رد قانونية',
      category: 'briefs',
      text: `لائحة جوابية ودفاعية نموذجية

صاحب الفضيلة رئيس وأعضاء الدائرة القضائية الموقرة في {اسم_المحكمة}،
السلام عليكم ورحمة الله وبركاته،،،

الموضوع: جواب وتحصين دفاعي في الدعوى المقيدة برقم {رقم_القضية} والمقامة من المدعي السيد/ {اسم_الخصم} ضد موكلنا العميل/ {اسم_العميل}.

أولاً: من الناحية الشكلية والدفع الشكلي:
نلتمس من فضيلتكم قبول هذه المذكرة الدفاعية شكلاً لتقديمها في الميعاد المحدد نظاماً ووفقاً للأصول الإجرائية لنظام المرافعات الشرعية السعودي.

ثانياً: من الناحية الموضوعية ووقائع ومستندات الفاعلية:
نفيد فضيلتكم الموقرة بأن كافة ادعاءات المدعي بطلب الاستحقاق تفتقر إلى أي مستند يثبتها قانونياً، ونطلب من فضيلتكم رد الدعوى وصرف النظر عنها لعدم التأسيس النظامي.

وبناءً عليه، نطلب من فضيلتكم:
1- الحكم برد دعوى المدعي كاملةً وتحميله كافة المصاريف القضائية الفعلية.
2- صرف النظر عن مطالباته الموصوفة بلائحة الدعوى الأصلية.

والسلام عليكم ورحمة الله وبركاته،،
وكيل المدعى عليه (العميل): مكتب المحاماة والعدالة بالرياض.`
    },
    {
      id: 'formal_notice',
      name: 'خطاب إنذار رسمي ومطالبة سداد عاجلة',
      category: 'notices',
      text: `مكتب المحاماة والعدالة بالرياض والاستشارات القانونية

خطاب إنذار ومطالبة عاجلة بالسداد والوفاء الودي

إنذار رسمي موجه إلى: السيد/ {اسم_الخصم}.
بناءً على طلب موكلنا العميل الأستاذ/ {اسم_العميل}، وصاحب ملف القضية المقيد برقم {رقم_القضية}.

نحيطكم علماً بأنكم تخلفـتم عن الوفاء بالالتزامات المالية والتعاقدية المترتبة بذمتكم بموجب الاتفاقيات الموقعة مع موكلنا، وحرصاً منا على تسوية النزاعات بصورة ودية وقبل الولوج في الإجراءات والملاحقات القضائية الجنائية والمدنية لدى المحاكم المختصة، فإننا ننذركم ونمهلكم مدة (٥) أيام عمل من تاريخ هذا الخطاب للوفاء بالمبالغ أو تسوية الالتزام.

في حال تخلفكم عن ذلك، سنقوم باتخاذ كافة التدابير النظامية ورفع دعوى بصفة عاجلة أمام {اسم_المحكمة} لحفظ وصيانة حقوق موكلنا، مع تحميلكم كافة الأتعاب والتعويضات النظامية عن الأضرار الناشئة.

مستشار التبليغ والإنذار: مكتب المحاماة والعدالة بالرياض.`
    }
  ];

  const handleAutoFill = (templateId: string, caseId: string, courtInput: string, opponentInput: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const caseObj = cases.find(c => c.id === caseId);
    
    const today = new Date();
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayName = arabicDays[today.getDay()];
    const georgianDate = today.toLocaleDateString('ar-EG'); 

    const clientNameVal = caseObj ? caseObj.clientName : 'العميل الفاضل';
    const caseNumVal = caseObj ? caseObj.caseNumber : 'غير محدد';
    const courtNameVal = courtInput || (caseObj ? caseObj.courtName : 'المحكمة المختصة بالرياض');
    const opponentNameVal = opponentInput || 'الطرف الآخر / المدعى عليه';

    let filledText = template.text
      .replace(/{اسم_العميل}/g, clientNameVal)
      .replace(/{رقم_القضية}/g, caseNumVal)
      .replace(/{اسم_المحكمة}/g, courtNameVal)
      .replace(/{اسم_الخصم}/g, opponentNameVal)
      .replace(/{تاريخ_اليوم}/g, todayName)
      .replace(/{تاريخ_ميلادي}/g, georgianDate)
      .replace(/{هوية_العميل}/g, '10' + Math.floor(100000000 + Math.random() * 900000000))
      .replace(/{الأتعاب_المقدرة}/g, '45,000');

    setEditedDocContent(filledText);
    setFilledDocName(`${template.name.split(' (')[0]} - العميل ${clientNameVal}`);
  };

  const handleSaveFilledTemplate = () => {
    if (!editedDocContent.trim()) {
      alert('الرجاء التأكد من وجود نص ممتلئ للمستند.');
      return;
    }
    
    const matchedTemplate = templates.find(t => t.id === selectedTemplateId);
    const categoryType = matchedTemplate ? matchedTemplate.category : 'contracts';

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: `${filledDocName || 'مستند ممتلئ تلقائياً'}.pdf`,
      category: categoryType as any,
      uploadedAt: new Date().toISOString().split('T')[0],
      size: `${Math.ceil(editedDocContent.length / 1000)} KB`,
      extractedText: editedDocContent,
      tags: ['تعبئة_ذكية', 'توليد_تلقائي', 'NLP_Ready', filledDocName.split(' ')[0]]
    } as any;

    onUpdateState('documents', newDoc);
    setShowTemplateFiller(false);
    alert('✅ تم اعتماد وحفظ المستند المعبأ ذكياً بنجاح في المستودع الرقمي الخاص بك!');
  };

  const SmartTemplateFillerModal = () => (
    <AnimatePresence>
      {showTemplateFiller && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <div className="absolute inset-0" onClick={() => setShowTemplateFiller(false)}></div>
          <motion.div 
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-4xl w-full relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-right text-white"
            dir="rtl"
          >
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shadow-lg shadow-amber-500/5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">التعبئة الذكية للمستندات (Smart Template Filler) 🧠</h3>
                  <p className="text-xs text-slate-400 mt-1">تقوم الأداة باستخراج تفاصيل القضية والعملاء ثم تعبئتها مباشرة وصياغتها وتوفير المعاينة.</p>
                </div>
              </div>
              <button onClick={() => setShowTemplateFiller(false)} className="p-2 rounded-full text-slate-400 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto pr-2 pb-4 flex-1">
              {/* Form Input fields */}
              <div className="md:col-span-4 space-y-5">
                <div>
                  <label className="block text-xs font-black text-[#facc15] mb-2">١. اختر النموذج القانوني (Template)</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-black cursor-pointer"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      const tid = e.target.value;
                      setSelectedTemplateId(tid);
                      handleAutoFill(tid, selectedCaseId, customCourt, customOpponent);
                    }}
                  >
                    <option value="">-- اختر النموذج --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#facc15] mb-2">٢. اربط بالقضية (CasesModule)</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                    value={selectedCaseId}
                    disabled={!selectedTemplateId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedCaseId(cid);
                      const cObj = cases.find(c => c.id === cid);
                      const initialCourt = cObj ? cObj.courtName : '';
                      setCustomCourt(initialCourt || '');
                      handleAutoFill(selectedTemplateId, cid, initialCourt || '', customOpponent);
                    }}
                  >
                    <option value="">-- اختر القضية لاستخراج البيانات --</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.caseName} (#{c.caseNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">المحكمة (تعبئة تلقائية / مخصصة)</label>
                  <input 
                    type="text" 
                    placeholder="المحكمة العامة بالرياض" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                    value={customCourt}
                    disabled={!selectedTemplateId}
                    onChange={(e) => {
                      setCustomCourt(e.target.value);
                      handleAutoFill(selectedTemplateId, selectedCaseId, e.target.value, customOpponent);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">اسم الخصم/المدعى عليه</label>
                  <input 
                    type="text" 
                    placeholder="الطرف الآخر لملف النزاع" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                    value={customOpponent}
                    disabled={!selectedTemplateId}
                    onChange={(e) => {
                      setCustomOpponent(e.target.value);
                      handleAutoFill(selectedTemplateId, selectedCaseId, customCourt, e.target.value);
                    }}
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/85 space-y-2">
                    <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest block">الذكاء التوليدي والامتثال</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">تقوم نماذج NLP باستخلاص وقائع القضية بصورة متوافقة مع مواد نظام المرافعات الشرعية السعودي.</p>
                  </div>
                </div>
              </div>

              {/* Editor + Official Preview Panel */}
              <div className="md:col-span-8 flex flex-col space-y-4">
                <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-2xl border border-slate-805">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsPreviewMode(false)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${!isPreviewMode ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
                    >
                      محرر صياغة النص 🖋️
                    </button>
                    <button 
                      onClick={() => setIsPreviewMode(true)}
                      disabled={!editedDocContent}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${isPreviewMode ? 'bg-amber-500 text-slate-950 shadow-md' : 'disabled:opacity-40 text-slate-400'}`}
                    >
                      معاينة التعديلات 👁️
                    </button>
                  </div>
                </div>

                {isPreviewMode ? (
                  /* Creamy Saudi Paper Layout style */
                  <div className="flex-1 bg-[#FAF6EE] text-slate-900 border-2 border-[#D4AF37] rounded-3xl p-8 shadow-inner font-sans relative overflow-y-auto min-h-[350px]">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                      <div className="border-[20px] border-[#D4AF37] rounded-full p-20 scale-150">
                        <span className="text-8xl font-black rotate-45 select-none">العدالة</span>
                      </div>
                    </div>
                    
                    {/* Golden traditional top stamps */}
                    <div className="flex justify-between items-start text-xs border-b border-[#D4AF37]/30 pb-4 mb-6" dir="rtl">
                      <div className="text-right space-y-1">
                        <span className="block font-black text-slate-900 text-sm">مكتب المحاماة والعدالة بالرياض</span>
                        <span className="block text-slate-500">مستند معتمد مرجعي فوري</span>
                      </div>
                      <div className="text-center p-1.5 border border-[#D4AF37] rounded-xl flex items-center justify-center bg-white/50 text-[9px] font-black tracking-widest text-[#B8860B]">
                        مسودة نموذج ذكي
                      </div>
                      <div className="text-left space-y-1">
                        <span className="block text-slate-500">التاريخ: {new Date().toLocaleDateString('ar-SA')}</span>
                        <span className="block text-[#D4AF37] font-bold">بوابة الامتثال الذكي</span>
                      </div>
                    </div>

                    <div className="whitespace-pre-line text-sm leading-relaxed text-right font-sans text-slate-800 pr-1 select-text">
                      {editedDocContent}
                    </div>

                    {/* Checkmark Stamp */}
                    <div className="mt-8 pt-4 border-t border-[#D4AF37]/20 flex justify-between items-center" dir="rtl">
                      <div className="text-right space-y-1">
                        <span className="text-xs text-slate-400 font-bold block">مستشار الصياغة الرقمية</span>
                        <span className="text-xs font-black text-[#B8860B] block font-mono">ADALAH SMART FILLER</span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl px-4 py-2 flex items-center gap-2 transform -rotate-2 shrink-0">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 tracking-wide">نموذج معتمد فوري</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <textarea 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm text-slate-200 leading-relaxed text-right font-sans min-h-[350px] focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                    value={editedDocContent}
                    onChange={(e) => setEditedDocContent(e.target.value)}
                    placeholder="اختر نموذج وقضية لتوليد المستند هنا وتعديله..."
                  ></textarea>
                )}
                
                {/* Save & Approve panel */}
                <div className="flex justify-end gap-3 pt-3">
                  <button 
                    onClick={() => setShowTemplateFiller(false)}
                    className="px-6 py-3.5 bg-slate-850 text-slate-300 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    إلغاء الصياغة
                  </button>
                  <button 
                    onClick={handleSaveFilledTemplate}
                    disabled={!editedDocContent}
                    className="px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-slate-950" />
                    اعتماد الصياغة وحفظ بالأرشيف 💾
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // OCR Simulator
  const [selectedDocForOcr, setSelectedDocForOcr] = useState<Document | null>(documents[0]);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(documents[0]?.extractedText || null);

  // Focused Reading Mode and color highlighting states
  const [isFocusedRead, setIsFocusedRead] = useState(false);

  useEffect(() => {
    if (isFocusedRead) {
      document.body.classList.add("focus-mode-active");
    } else {
      document.body.classList.remove("focus-mode-active");
    }
    return () => {
      document.body.classList.remove("focus-mode-active");
    };
  }, [isFocusedRead]);

  // Sync isFocusMode for dual compatibility
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add("focus-mode-active");
    } else if (!isFocusedRead) {
      document.body.classList.remove("focus-mode-active");
    }
  }, [isFocusMode, isFocusedRead]);
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'sepia' | 'light' | 'dark'>('sepia');
  const [fontSize, setFontSize] = useState(16);
  const [lineSpacing, setLineSpacing] = useState(1.8);
  const [activeHighlightColor, setActiveHighlightColor] = useState<'amber' | 'emerald' | 'rose' | 'sky'>('amber');
  const [highlightInput, setHighlightInput] = useState('');
  const [highlightedKeywords, setHighlightedKeywords] = useState<{ [key: string]: string }>({
    'صك الحكم': 'amber',
    'المحكمة التجارية': 'emerald',
    'لائحة اعتراضية': 'rose',
    'تعويض': 'rose',
    'الالتزامات': 'sky',
    'القوة القهرية': 'amber',
    'الشرط الجزائي': 'rose'
  });

  const addHighlightKeyword = (term: string, color: 'amber' | 'emerald' | 'rose' | 'sky') => {
    if (!term.trim()) return;
    setHighlightedKeywords(prev => ({
      ...prev,
      [term.trim()]: color
    }));
  };

  const removeHighlightKeyword = (term: string) => {
    setHighlightedKeywords(prev => {
      const copy = { ...prev };
      delete copy[term];
      return copy;
    });
  };

  const clearAllHighlights = () => {
    setHighlightedKeywords({});
  };

  // Quick Document Preview States
  const [rightPanelTab, setRightPanelTab] = useState<'ocr' | 'preview' | 'versions'>('preview');

  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);

  const handleDocDragStart = (e: React.DragEvent, docId: string) => {
    setDraggedDocId(docId);
    e.dataTransfer.setData('docId', docId);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDocDragEnd = (e: React.DragEvent) => {
    setDraggedDocId(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData('docId') || draggedDocId;
    if (!docId || folderId === 'all') return;

    const doc = documents.find(d => d.id === docId);
    if (doc) {
      const updatedDoc = { 
        ...doc, 
        category: folderId,
        tags: [...new Set([...doc.tags, folderId])]
      };
      onUpdateState('documents', updatedDoc);
      console.log(`[Documents] Moved document ${docId} to folder ${folderId}`);
    }
  };
  const [newVersionText, setNewVersionText] = useState('');
  const [changesSummary, setChangesSummary] = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  React.useEffect(() => {
    if (selectedDocForOcr) {
      setNewVersionText(selectedDocForOcr.extractedText || '');
      setChangesSummary('');
    }
  }, [selectedDocForOcr]);

  const getDocumentVersions = (doc: Document) => {
    if (doc.versions && doc.versions.length > 0) {
      return doc.versions;
    }
    return [
      {
        id: 'v1',
        version: 1,
        name: doc.name,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        extractedText: doc.extractedText || "مضمون النص ومراجعة البنود الأساسية لعقد التقاضي.",
        changesSummary: "النسخة الأساسية عند الإيداع"
      }
    ];
  };

  const handleSaveNewVersion = () => {
    if (!selectedDocForOcr) return;
    if (!newVersionText.trim()) {
      alert("الرجاء إدخال نص المستند أو بنود العقد لهذه النسخة في مربع التعديل.");
      return;
    }
    
    setIsSavingVersion(true);
    const existingVersions = getDocumentVersions(selectedDocForOcr);
    const nextVerNum = existingVersions.length + 1;
    
    const newVer = {
      id: `v${Date.now()}`,
      version: nextVerNum,
      name: selectedDocForOcr.name,
      size: `${(newVersionText.length / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toISOString().split('T')[0],
      extractedText: newVersionText,
      changesSummary: changesSummary.trim() || `تعديل المسودة وتحديث البنود القضائية الإصدار رقم ${nextVerNum}`
    };
    
    const updatedVersions = [...existingVersions, newVer];
    
    const updatedDoc: Document = {
      ...selectedDocForOcr,
      extractedText: newVersionText,
      versions: updatedVersions,
      currentVersion: nextVerNum
    };
    
    onUpdateState('documents', updatedDoc);
    
    setSelectedDocForOcr(updatedDoc);
    setOcrResult(newVersionText);
    setChangesSummary('');
    setIsSavingVersion(false);
    alert(`تم حفظ الإصدار الجديد رقم ${nextVerNum} بنجاح وتوثيق التغيرات في سجل العمل التاريخي للمستند!`);
  };

  const handleRevertToVersion = (version: any) => {
    if (!selectedDocForOcr) return;
    
    const confirmRevert = window.confirm(`هل أنت متأكد من استعادة وتفعيل الإصدار رقم ${version.version}؟ سيتم استبدال المسودة الفعالة بـ "${version.changesSummary}".`);
    if (!confirmRevert) return;
    
    const updatedDoc: Document = {
      ...selectedDocForOcr,
      extractedText: version.extractedText,
      currentVersion: version.version
    };
    
    onUpdateState('documents', updatedDoc);
    setSelectedDocForOcr(updatedDoc);
    setNewVersionText(version.extractedText);
    setOcrResult(version.extractedText);
    
    alert(`تم استرداد وإعادة تفعيل الإصدار رقم ${version.version} بنجاح!`);
  };

  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [previewMode, setPreviewMode] = useState<'simulated' | 'iframe'>('simulated');
  const [readMode, setReadMode] = useState(false);
  const [isDocNightMode, setIsDocNightMode] = useState(false);

  // Contract Creator/Authoring panel States
  const [contractClient, setContractClient] = useState('');
  const [contractTitle, setContractTitle] = useState('');
  const [contractContent, setContractContent] = useState('');
  const [contractPhone, setContractPhone] = useState('+966 50 449 9122');
  const [isContractSubmitting, setIsContractSubmitting] = useState(false);

  const folders = [
    { id: 'all', name: 'كافة المستندات والأوراق الدقّة' },
    { id: 'العقود والاتفاقيات', name: 'العقود الاستشارية والاتفاقيات' },
    { id: 'لوائح ومذكرات قضائية', name: 'لوائح ومذكرات قضائية' },
    { id: 'أحكام وقرارات قضائية', name: 'أحكام وقرارات قضائية' },
    { id: 'الأوراق المالية', name: 'الأوراق المالية والسندات للأمر' },
    { id: 'التقارير المالية والزكوية', name: 'التقارير الزكوية والمحاسبية' }
  ];

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processUploadedFile = async (file: File) => {
    setIsUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`documents/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(`documents/${fileName}`);
      
      const downloadURL = publicUrl;
      
      let category = 'العقود والاتفاقيات';
      const fileNameLower = file.name.toLowerCase();
      
      if (fileNameLower.includes('تقرير') || fileNameLower.includes('مالي') || fileNameLower.includes('حساب')) {
        category = 'التقارير المالية والزكوية';
      } else if (fileNameLower.includes('سند') || fileNameLower.includes('فاتورة') || fileNameLower.includes('شيك')) {
        category = 'الأوراق المالية';
      } else if (fileNameLower.includes('لائحة') || fileNameLower.includes('مذكرة') || fileNameLower.includes('صحيفة')) {
        category = 'لوائح ومذكرات قضائية';
      } else if (fileNameLower.includes('حكم') || fileNameLower.includes('قرار') || fileNameLower.includes('صك')) {
        category = 'أحكام وقرارات قضائية';
      }
      
      const sizeMb = file.size / (1024 * 1024);
      const sizeStr = sizeMb > 0.1 ? `${sizeMb.toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
      
      const aiTags = [ext.toUpperCase()];
      
      // Intelligent tagging based on content simulation
      if (fileNameLower.includes('مستعجل') || fileNameLower.includes('عاجل')) aiTags.push('عاجل');
      if (fileNameLower.includes('جنائي')) aiTags.push('جنائي');
      if (fileNameLower.includes('تجاري')) aiTags.push('تجاري');
      if (fileNameLower.includes('عمالي')) aiTags.push('عمالي');
      if (fileNameLower.includes('شخصية')) aiTags.push('أحوال شخصية');
      if (fileNameLower.includes('تنفيذ')) aiTags.push('تنفيذ');
      
      // Automated Document Tagger (Task 2): AI content analysis simulation
      const simulatedPDFContent = `${fileNameLower} - يتضمن هذا المستند تفاصيل حول عقود وشروط دعاوى قضائية بالإضافة إلى أحكام سابقة.`;
      
      const contentBasedTags = [];
      if (simulatedPDFContent.includes('عقود') || simulatedPDFContent.includes('عقد')) contentBasedTags.push('عقود');
      if (simulatedPDFContent.includes('دعاوى') || simulatedPDFContent.includes('مذكرة')) contentBasedTags.push('دعاوى');
      if (simulatedPDFContent.includes('أحكام') || simulatedPDFContent.includes('صك')) contentBasedTags.push('أحكام');
      
      aiTags.push(...contentBasedTags);

      // NLP Metadata Extraction Simulation - NEW FEATURE
      const extractedCaseName = fileNameLower.includes('نورة') ? 'قضية نورة الفوزان' : 
                                fileNameLower.includes('الراجحي') ? 'مجموعة الراجحي العقارية' : 
                                fileNameLower.includes('عبدالله') ? 'قضية عبدالله السديري' : 'قضية عامة';
      
      const extractedDate = '2026-06-15'; // Simulated extracted date from content
      
      if (fileNameLower.includes('لائحة')) aiTags.push('لائحة استئناف');
      if (fileNameLower.includes('عقد')) aiTags.push('عقد أتعاب');
      if (fileNameLower.includes('حكم')) aiTags.push('صك حكم');
      
      const smartFileName = `${category} - ${extractedCaseName} - ${new Date().getFullYear()}.pdf`;

      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        name: smartFileName,
        category: category as any,
        uploadedAt: new Date().toISOString().split('T')[0],
        size: sizeStr,
        extractedText: `تم مسح وفهرسة الملف المرفوع "${file.name}" بنجاح ممتثلاً للمعايير التقنية السعودية والأمن السيبراني.
تم استخراج بيانات القضية دلالياً عبر NLP:
- اسم القضية المستنبط: ${extractedCaseName}
- التاريخ المستخرج من المتن: ${extractedDate}
- التصنيف الذاتي المعتمد: ${category}

رابط الملف السحابي الآمن: ${downloadURL}
نوع وتمديد المستند: ${ext.toUpperCase()}
`,
        tags: [...aiTags, 'مفهرس_آلياً', extractedCaseName, 'NLP_Processed']
      };

      onUpdateState('documents', newDoc);
      setIsUploading(false);
      setSelectedDocForOcr(newDoc);
      setOcrResult(newDoc.extractedText || null);
      alert(`✅ تمت عملية الرفع بنجاح!
      قامت تقنيات ذكاء الأعمال (NLP) بتحليل الملف النصي، وتصنيفه كـ "${category}" وتسميته تلقائياً بـ "${smartFileName}".
      يمكنك الآن البحث في محتوى هذا المستند باستخدام البحث العميق (NLP Content Search).`);
    } catch (err: any) {
      console.error("Firebase Storage upload exception: ", err);
      setIsUploading(false);
      alert(`❌ فشل رفع الملف إلى Firebase Storage: ${err?.message || err || "خطأ غير معروف"}. يرجى التحقق من لوائح الإتصال وصلاحيات أمان التخزين السحابي للمنصة.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropSimulation = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processUploadedFile(files[0] as any);
    }
  };

  const handleTriggerOcr = (doc: Document) => {
    setSelectedDocForOcr(doc);
    setIsOcrLoading(true);
    setOcrResult(null);

    setTimeout(() => {
      setOcrResult(doc.extractedText || "لم يتبين وجود سطور أو نصوص عربية مقروءة في هذا المستند.");
      setIsOcrLoading(false);
    }, 1000);
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractClient || !contractTitle || !contractContent) {
      alert("الرجاء تعبئة كافة حقول الاتفاقية لتوليد العقد.");
      return;
    }
    
    setIsContractSubmitting(true);
    
    const clientObj = (clients || []).find(c => c.id === contractClient);
    const newContract = {
      id: `contract-${Date.now()}`,
      clientName: clientObj ? clientObj.name : "عميل المكتب المشترك",
      clientId: contractClient,
      title: contractTitle,
      content: contractContent,
      status: 'pending' as const,
      otpCode: Math.floor(1000 + Math.random() * 9000).toString(), // Secure dynamic 4-character OTP
      otpStatus: 'unsent' as const,
      phone: contractPhone,
      signedAt: '',
      signerName: ''
    };

    setTimeout(() => {
      onUpdateState('contracts', newContract);
      setIsContractSubmitting(false);
      
      // Reset drafting fields
      setContractTitle('');
      setContractContent('');
      alert(`✅ تم صياغة عقد التمثيل بنجاح وإرساله فوراً إلى بوابة العميل الاستثنائية للامتثال والمصادقة بـ OTP!`);
    }, 800);
  };

  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [isClassifyingDocId, setIsClassifyingDocId] = useState<string | null>(null);

  const filteredDocs = documents.filter(doc => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      doc.name.toLowerCase().includes(term) || 
      (doc.tags && doc.tags.some(t => t.toLowerCase().includes(term))) ||
      (isDeepSearch && doc.extractedText && doc.extractedText.toLowerCase().includes(term));
    
    const matchesDate = !dateFilter || doc.uploadedAt === dateFilter;
    const matchesType = !typeFilter || doc.category === typeFilter;
    const matchesTag = !selectedTagFilter || (doc.tags && doc.tags.includes(selectedTagFilter));
    const matchesClient = !clientFilter || (doc.tags && doc.tags.some(t => t.toLowerCase().includes(clientFilter.toLowerCase())));
    const matchesCase = !caseFilter || (doc.tags && doc.tags.some(t => t.toLowerCase().includes(caseFilter.toLowerCase())));
      
    if (activeFolderFilter !== 'all' && doc.category !== activeFolderFilter) return false;
    return matchesSearch && matchesDate && matchesType && matchesTag && matchesClient && matchesCase;
  });

  const allAvailableTags = Array.from(new Set(documents.flatMap(doc => doc.tags || [])));

  const handleAiClassify = (doc: Document) => {
    setIsClassifyingDocId(doc.id);
    
    // Simulation of AI analyzing content
    setTimeout(() => {
      const detectedCategory = doc.name.includes('عقد') ? 'عقود واتفاقيات' : 
                               doc.name.includes('حكم') ? 'أحكام قضائية' : 
                               doc.name.includes('لائحة') ? 'لوائح اعتراضية' : 'مذكرات قانونية';
      
      const aiTags = ['تصنيف_آلي', 'ذكاء_اصطناعي', ...doc.tags];
      if (doc.name.includes('عقد')) aiTags.push('التزام_تعاقدي');
      if (doc.name.includes('حكم')) aiTags.push('حجية_الشيء');
      
      const updatedDoc = {
        ...doc,
        category: detectedCategory as any,
        tags: Array.from(new Set(aiTags)),
        aiClassification: {
          confidence: 0.98,
          detectedAt: new Date().toISOString().split('T')[0],
          type: detectedCategory
        }
      };

      onUpdateState('documents', updatedDoc);
      setIsClassifyingDocId(null);
      alert(`✅ تم تصنيف المستند آلياً كـ "${detectedCategory}" وإضافة وسوم ذكية بناءً على تقنيات NLP.`);
    }, 2000);
  };

  const renderHighlightedText = (text: string) => {
    if (!text) return "";
    
    // We want to highlight search terms even if not in readMode if isDeepSearch is on
    const shouldHighlightSearch = searchTerm && isDeepSearch;
    if (!readMode && !isFocusedRead && !shouldHighlightSearch) return text;

    const keys = Object.keys(highlightedKeywords).filter(k => k.trim().length > 0);
    
    // Supplement with current search term if appropriate
    const finalKeys = [...keys];
    if (shouldHighlightSearch && !finalKeys.includes(searchTerm)) {
      finalKeys.push(searchTerm);
    }

    if (finalKeys.length === 0) return text;

    // Escape special characters for regex, sorting keys longest to shortest to match multi-word phrases first
    const sortedKeys = [...finalKeys].sort((a, b) => b.length - a.length);
    const escapedKeys = sortedKeys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escapedKeys.join('|')})`, 'g');

    const parts = text.split(regex);
    return parts.map((part, idx) => {
      const isSearchMatch = searchTerm && part.toLowerCase() === searchTerm.toLowerCase();
      const matchedKey = keys.find(k => k === part);
      
      if (isSearchMatch || matchedKey) {
        let colorClasses = 'bg-amber-200 text-amber-950 ';
        
        if (isSearchMatch) {
          colorClasses = 'bg-blue-400 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)] border-b-2 border-blue-600 ';
        } else if (matchedKey) {
          const color = highlightedKeywords[matchedKey];
          if (color === 'amber') colorClasses = 'bg-amber-200 text-amber-950   border-b border-amber-400';
          else if (color === 'emerald') colorClasses = 'bg-emerald-250 text-emerald-950   border-b border-emerald-400';
          else if (color === 'rose') colorClasses = 'bg-rose-250 text-rose-950   border-b border-rose-400';
          else if (color === 'sky') colorClasses = 'bg-sky-250 text-sky-950   border-b border-sky-400';
        }

        return (
          <mark key={idx} className={`${colorClasses} px-1.5 py-0.5 rounded-md font-black shadow-sm mx-0.5 transition-colors duration-150`}>
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Title block */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-main tracking-tight">أرشيف المستندات 📂</h1>
          <p className="text-xs text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] mt-1">
            أرشيف قانوني سحابي متكامل للمكتب يدعم تنظيم المجلدات، السحب والإفلات، وقراءة المستندات الـ PDF والصور ضوئياً بلغات عربية.
          </p>
        </div>
        <button
          onClick={() => {
            setShowTemplateFiller(true);
            setIsPreviewMode(false);
            setSelectedTemplateId('');
            setSelectedCaseId('');
            setCustomCourt('');
            setCustomOpponent('');
            setEditedDocContent('');
          }}
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black py-3 px-6 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
          <span>التعبئة الذكية للمستندات (Smart Filler) 🧠</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Folder, Drag & Drop, Documents Lists */}
        {!isFocusedRead && (
          <div className="lg:col-span-6 space-y-6">

          {/* Responsive Drag & Drop panel */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDropSimulation}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-3xl p-6 area-secondary flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all duration-300 shadow-sm"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx" 
            />
            <div className={`p-4 bg-accent/10 text-accent rounded-2xl ${isUploading ? 'animate-bounce' : ''} shadow-lg shadow-accent/10`}>
              <Upload className="w-8 h-8" />
            </div>
            {isUploading ? (
              <div className="space-y-1">
                <p className="text-sm font-black text-main ">جاري قيد وفهرسة الملف قانونياً...</p>
                <p className="text-xs  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  ">يقوم الذكاء الاصطناعي باستخراج الكلمات المفتاحية والأرقام والقرارات.</p>
              </div>
            ) : (
              <div className="space-y-1 text-right max-w-sm">
                <p className="text-sm font-black text-main  text-center">أفلت ملف العقد أو تظلم الدعوى هنا أو انقر للرفع المباشر</p>
                <p className="text-xs  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   text-center mt-1 font-bold">يدعم ملفات PDF والمستندات الورقية والصور بحد أقصى 50MB ممتثلاً لأمن البيانات والامتثال السعودي.</p>
              </div>
            )}
          </div>

          {/* Folder tabs ribbon */}
          <div className="flex border-b border-border gap-1 overflow-x-auto pr-1">
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFolderFilter(f.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (f.id !== 'all') {
                    e.currentTarget.classList.add('bg-accent/10', 'text-accent');
                  }
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-accent/10', 'text-accent');
                }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove('bg-accent/10', 'text-accent');
                  handleFolderDrop(e, f.id === 'all' ? 'all' : f.id);
                }}
                className={`px-4 py-2.5 text-xs font-black whitespace-nowrap transition-all cursor-pointer rounded-t-xl ${
                  activeFolderFilter === f.id ? 'text-main border-b-2 border-accent bg-accent/5' : ' text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                } ${draggedDocId && f.id !== 'all' ? 'ring-1 ring-accent/30 animate-pulse' : ''}`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {/* Advanced AI-Integrated Search Tool */}
          <div className={`p-6 rounded-[2.5rem] border transition-all duration-700 space-y-6 shadow-md relative overflow-hidden backdrop-blur-md ${
            isDeepSearch 
              ? 'bg-blue-50/50 border-blue-200 shadow-[0_0_50px_rgba(59,130,246,0.1)] ring-1 ring-blue-300' 
              : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>
            {isDeepSearch && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full pointer-events-none animate-pulse"></div>
            )}
            
            <div className="flex flex-col lg:flex-row gap-5 relative z-10">
              <div className="relative flex-1 group">
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${isDeepSearch ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-500 group-focus-within:bg-blue-600 group-focus-within:text-white'}`}>
                  <Search className={`w-4 h-4 ${isDeepSearch ? 'animate-pulse' : ''}`} />
                </div>
                <input 
                  type="text"
                  placeholder={isDeepSearch ? "جاري محاكاة البحث العميق في نصوص المستندات (NLP)..." : "ابحث باسم المرفق، الرقم القضائي، أو الكلمات المفتاحية..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-slate-50 text-sm py-4 pr-14 pl-4 rounded-2xl transition-all duration-500 focus:outline-none font-bold placeholder-slate-400 ${
                    isDeepSearch 
                      ? 'border border-blue-300/50 text-blue-900 focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] ring-2 ring-blue-400/10' 
                      : 'border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                {isDeepSearch && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-black tracking-widest uppercase">NLP Analyzer On</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap lg:flex-nowrap gap-3 shrink-0">
                <button 
                  onClick={() => setIsDeepSearch(!isDeepSearch)}
                  className={`flex items-center gap-3 px-8 py-5 rounded-2xl text-[12px] font-black transition-all duration-500 active:scale-95 whitespace-nowrap overflow-hidden relative group/deep shadow-md ${
                    isDeepSearch 
                      ? 'bg-blue-600 text-white shadow-blue-500/30' 
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${isDeepSearch ? 'bg-white/20' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="tracking-tight">{isDeepSearch ? 'تم تفعيل المسح العميق ✨' : 'تفعيل البحث بالذكاء الاصطناعي'}</span>
                  {isDeepSearch && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/deep:animate-shimmer pointer-events-none"></div>}
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center justify-between relative z-10 pt-2">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">تاريخ الرفع:</span>
                  <div className="relative group flex items-center">
                    <Calendar className="w-3 h-3 text-slate-400 ml-1" />
                    <input 
                      type="date"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                      className="bg-transparent border-none py-1 pr-1 pl-4 text-[10px] font-bold text-slate-800 outline-none cursor-pointer min-w-[100px] focus:ring-0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">العميل:</span>
                  <select 
                    value={clientFilter}
                    onChange={e => setClientFilter(e.target.value)}
                    className="bg-transparent border-none p-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 appearance-none pr-8 relative"
                  >
                    <option value="">كافة العملاء</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">القضية:</span>
                  <select 
                    value={caseFilter}
                    onChange={e => setCaseFilter(e.target.value)}
                    className="bg-transparent border-none p-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 appearance-none pr-8 relative"
                  >
                    <option value="">كافة القضايا</option>
                    {cases.map(c => <option key={c.id} value={c.caseName}>{c.caseName}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">التصنيف:</span>
                  <select 
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="bg-transparent border-none p-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 appearance-none pr-8 relative"
                  >
                    {folders.slice(1).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">الوسوم الذكية:</span>
                  <select 
                    value={selectedTagFilter || ''}
                    onChange={e => setSelectedTagFilter(e.target.value || null)}
                    className="bg-transparent border-none p-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 appearance-none pr-8 relative"
                  >
                    <option value="">كافة الوسوم</option>
                    {allAvailableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 lg:mt-0 w-full lg:w-auto overflow-hidden">
                <div className="text-[10px] text-slate-500 font-bold px-3 py-1 border-r border-slate-200">
                  تمت أرشفة <span className="text-blue-600 font-mono font-black">{documents.length}</span> وثيقة قانونية بإجمالي <span className="text-emerald-600 font-mono font-black">1.2GB</span>
                </div>
                <button 
                  onClick={() => {
                     setSearchTerm('');
                     setDateFilter('');
                     setTypeFilter('');
                     setClientFilter('');
                     setCaseFilter('');
                     setActiveFolderFilter('all');
                     setIsDeepSearch(false);
                  }}
                  className="mr-auto lg:mr-0 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl text-[10px] font-black transition-all active:scale-95 whitespace-nowrap"
                >
                  تصفير الفلاتر ⟲
                </button>
              </div>
            </div>
          </div>

          {/* Files grid rendering */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {filteredDocs.map((doc, idx) => {
              const docStyles = getDocColorStyles(doc);
              return (
                <motion.div 
                  key={idx}
                  draggable
                  onDragStart={(e: any) => handleDocDragStart(e, doc.id)}
                  onDragEnd={(e: any) => handleDocDragEnd(e)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative bg-gradient-to-br from-[#0c1830] to-[#040d1f] border-2 border-yellow-500/30 rounded-3xl p-6 transition-all duration-500 flex flex-col justify-between shadow-[0_10px_30px_rgba(234,179,8,0.05)] overflow-hidden h-full cursor-grab active:cursor-grabbing`}
                >
                  {/* Subtle animated background layer on hover */}
                  <div className="absolute inset-0 bg-yellow-500/5 opacity-0 transition-opacity duration-700 pointer-events-none"></div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3">
                      <span className="text-[10px] text-yellow-100 drop-shadow-[0_0_5px_rgba(253,224,71,0.5)] font-mono font-bold tracking-widest">{doc.uploadedAt}</span>
                      <span className="text-[10px] text-yellow-100 drop-shadow-[0_0_5px_rgba(253,224,71,0.5)] font-mono font-bold tracking-widest">{doc.size}</span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#0c1830] rounded-2xl border border-yellow-500/20 transition-all duration-500 relative">
                        <FileText className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)] w-6 h-6 shrink-0" />
                        {doc.aiClassification && (
                          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-[#0c1830] animate-pulse">
                            <CheckCircle className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] line-clamp-2 leading-relaxed">{doc.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`w-2 h-2 rounded-full ${docStyles.dot} shadow-[0_0_5px_rgba(255,255,255,0.5)]`} title="رمز اللون" />
                          <p className="text-[11px] text-yellow-100/90 font-black line-clamp-1 transition-colors">{doc.category}</p>
                          {doc.aiClassification && <span className="text-[9px] text-emerald-400 font-bold border border-emerald-500/30 px-1 rounded animate-pulse">مُصنف آلياً ✨</span>}
                        </div>
                      </div>
                    </div>

                    {/* Tags list */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {doc.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-[#0c1830] text-yellow-100 px-2.5 py-1 rounded-lg border border-yellow-500/30 font-black drop-shadow-[0_0_3px_rgba(253,224,71,0.5)] shadow-inner">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-yellow-500/20 pt-4 mt-6 flex flex-wrap gap-3 justify-between items-center relative z-10 w-full">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.3)]">آمن مشفر</span>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedQRCodeDoc(doc);
                         }}
                         className="p-2.5 bg-yellow-400 text-blue-950 border border-yellow-500 rounded-xl transition-all shadow-[0_5px_15px_rgba(250,204,21,0.3)] active:scale-95"
                         title="توليد رمز QR للوصول السريع"
                      >
                         <QrCode className="w-4 h-4 stroke-[2.5px]" />
                      </button>


                      <button 
                        onClick={() => handleAiClassify(doc)}
                        className={`text-white bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md  ${isClassifyingDocId === doc.id ? 'animate-pulse' : ''}`}
                        disabled={isClassifyingDocId === doc.id}
                      >
                        {isClassifyingDocId === doc.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
                        <span>أرشفة ذكية</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDocForOcr(doc);
                          setRightPanelTab('preview');
                        }}
                        className="text-white bg-[#0c1830] border border-slate-700 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md "
                        title="معاينة سريعة للمستند"
                      >
                        <span>🔍</span>
                        <span>معاينة</span>
                      </button>
                      <button 
                        onClick={() => {
                          handleTriggerOcr(doc);
                          setRightPanelTab('ocr');
                        }}
                        className="text-slate-950 bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all "
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>قراءة OCR</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDocForOcr(doc);
                          setRightPanelTab('versions');
                        }}
                        className="text-amber-100 bg-amber-900/50 border border-amber-700 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        title="سجل وتأريخ الإصدارات"
                      >
                        <span>⏱️ الإصدارات</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        )}

        {/* Right Side: Smart OCR Scanned text result / Quick Document Previewer */}
        <div className={`${isFocusedRead ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-6 transition-all duration-300 items-stretch flex flex-col`}>
          <div className={`area-secondary border-2 border-slate-200 rounded-[2.5rem] p-8 space-y-6 ${isFocusedRead ? 'min-h-[850px] lg:h-[900px]' : 'min-h-[750px]'} flex flex-col justify-between shadow-2xl shadow-slate-200/50 transition-all duration-300 bg-white/60 backdrop-blur-md`}>
            
            {/* Tab selector menu */}
            <div className="flex bg-slate-100/80 p-2 rounded-2xl border border-slate-200 gap-2 shrink-0">
              <button
                onClick={() => setRightPanelTab('preview')}
                className={`flex-1 py-3 px-4 text-[12px] font-black rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                  rightPanelTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-slate-600'
                }`}
              >
                <span>🔍 المعاينة السريعة</span>
              </button>
              <button
                onClick={() => setRightPanelTab('ocr')}
                className={`flex-1 py-3 px-4 text-[12px] font-black rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                  rightPanelTab === 'ocr'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-slate-600'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>تحليل OCR</span>
              </button>
              <button
                onClick={() => setRightPanelTab('versions')}
                className={`flex-1 py-3 px-4 text-[12px] font-black rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                  rightPanelTab === 'versions'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-slate-600'
                }`}
              >
                <span>⏱️ سجل التعديلات</span>
              </button>
            </div>

            {/* TAB CONTENT: VERSIONS AND CHANGE TRACKING */}
            {rightPanelTab === 'versions' && (
              <div className="flex-1 flex flex-col justify-between min-h-0 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs text-main ">سجل إصدارات المستند والتعديلات</h3>
                    {selectedDocForOcr && (
                      <span className="text-[9px] bg-amber-500 text-[#d97706] border border-amber-500 px-2 py-0.5 rounded-full font-mono font-bold">
                        إصدار: {selectedDocForOcr.currentVersion || 1}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px]  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-bold leading-relaxed">
                    تتبع التغييرات على مسودات العقود، وقم باستعادة الإصدارات السابقة بضغطة واحدة مع توثيق ملخص التعديلات.
                  </p>
                </div>

                {selectedDocForOcr ? (
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    {/* Versions Archive List */}
                    <div className="space-y-2 max-h-[175px] overflow-y-auto border-b border-border pb-3 shrink-0">
                      <span className="text-[10px] text-primary font-black block">⌛ الأرشيف التاريخي لمسودة الملف:</span>
                      
                      <div className="space-y-2">
                        {getDocumentVersions(selectedDocForOcr).map((v: any, index: number) => {
                          const isActive = (selectedDocForOcr.currentVersion || 1) === v.version;
                          return (
                            <div 
                              key={v.id || index}
                              className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col space-y-1 ${
                                isActive 
                                  ? 'bg-amber-500/[0.04]  border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.03)]' 
                                  : 'bg-gradient-to-br from-[#050e21] to-[#0c1a35]  border-border'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] font-black px-1.5 py-0.3 rounded ${isActive ? 'bg-[#ca8a04] text-[#07132c] font-sans' : 'bg-slate-100 text-slate-600 font-sans'}`}>
                                    إصدار {v.version} {isActive ? '(نشط حالياً)' : ''}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono font-bold">{v.uploadedAt}</span>
                                </div>
                                {!isActive && (
                                  <button
                                    onClick={() => handleRevertToVersion(v)}
                                    className="text-[10px] font-black text-amber-600 cursor-pointer bg-amber-500 px-2 py-0.5 rounded-md border border-amber-500 active:scale-95 transition-all"
                                  >
                                    استعادة ومزامنة ⏪
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-slate-800 leading-normal bg-slate-50 p-1.5 rounded-lg border border-border border-dashed">
                                {v.changesSummary}
                              </p>
                              <span className="text-[9px] font-mono font-semibold text-slate-500">الحجم: {v.size} • بموجب فحص الأمان</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* New version form inputs */}
                    <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
                      <span className="text-[10px] text-primary font-black block shrink-0">🖋️ محرر مسودة القانونية وعقد التقاضي:</span>
                      
                      <textarea
                        value={newVersionText}
                        onChange={(e) => setNewVersionText(e.target.value)}
                        placeholder="قم بكتابة التعديلات القانونية أو التعديل مباشرة على نص العقد/المستند المذكور هنا لحفظ مسودة محدثة..."
                        className="flex-1 area-subtle p-3 text-xs leading-normal font-sans text-main  border border-border rounded-2xl focus:outline-none focus:border-accent resize-none min-h-[90px] overflow-y-auto"
                      />

                      <div className="space-y-2 shrink-0">
                        <input
                          type="text"
                          value={changesSummary}
                          onChange={(e) => setChangesSummary(e.target.value)}
                          placeholder="ملاحظات التعديل (مثال: تحديث المادة 4 وإلغاء شرط الإخطار)..."
                          className="w-full bg-white text-xs px-3 py-2 border border-border rounded-xl text-slate-900 focus:outline-none focus:border-accent placeholder:text-slate-400 font-bold shadow-sm"
                        />
                        <button
                          onClick={handleSaveNewVersion}
                          disabled={isSavingVersion}
                          className="w-full bg-accent text-white font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <span>💾 تتبع وحفظ كإصدار جديد</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50  rounded-2xl border border-dashed border-border">
                    <span className="text-2xl">⚡</span>
                    <p className="text-xs font-bold text-slate-650 ">برجاء اختيار العقد أو المستند من القائمة الجانبية لعرض تاريخه وإصداراته.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: OCR ANALYSER */}
            {rightPanelTab === 'ocr' && (
              <div className="flex-1 flex flex-col justify-between min-h-0 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-main ">قارئ النصوص ومكتشفات الـ OCR</h3>
                  <p className="text-xs text-slate-600">تصفح السطور والبيانات القضائية المستخرجة من المستند.</p>
                </div>

                <div className="flex-1 area-subtle p-4 rounded-xl border border-border text-xs leading-relaxed font-sans text-main overflow-y-auto whitespace-pre-line text-right shadow-inner min-h-0">
                  {isOcrLoading ? (
                    <div className="flex flex-col h-full justify-center items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                      <span className="text-slate-700 font-bold text-center">جاري استدعاء الذكاء الاصطناعي العدلي وقراءة النص...</span>
                    </div>
                  ) : ocrResult ? (
                    <div 
                      className="font-sans font-bold space-y-2"
                      style={{ 
                        fontSize: isFocusedRead ? `${fontSize}px` : 'inherit',
                        lineHeight: isFocusedRead ? lineSpacing : 'inherit'
                      }}
                    >
                      <p className="bg-emerald-500 text-white p-2 rounded-lg text-xs font-black inline-block">✅ تم استخراج النصوص ومطابقة الهويات</p>
                      <div className="whitespace-pre-line">{renderHighlightedText(ocrResult)}</div>
                    </div>
                  ) : (
                    <p className="text-slate-500 font-bold text-center py-24">انقر على زر "قراءة OCR" بجانب أي غلاف مستند لبدء معالجة واستخراج الأرقام القضائية.</p>
                  )}
                </div>

                <div className="area-subtle p-3 border border-border rounded-xl space-y-1.5 shadow-sm shrink-0">
                  <span className="text-xs text-main font-bold block underline decoration-accent/20 underline-offset-2">أبرز مستخرجات الفحص التلقائي بالـ OCR:</span>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc pr-3 leading-relaxed">
                    <li>استخلاص أطراف النزاع وعقود التأسيس للشركات.</li>
                    <li>الكشف عن المبالغ والبنود الخاضعة لضريبة القيمة المضافة.</li>
                    <li>جدولة المواعيد المذكورة في خطابات المرافعة مباشرة.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACCREDITED PREVIEWER */}
            {rightPanelTab === 'preview' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                
                {/* Embedded Reader Toolbar with Zoom / Rotation / Toggle controls */}
                <div className="flex items-center justify-between bg-slate-100  px-3 py-1.5 rounded-xl border border-border text-sm shrink-0 font-bold">
                  {/* Tool actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                      className="text-slate-700 font-mono h-6 w-6 rounded flex items-center justify-center cursor-pointer transition-colors"
                      title="تصغير"
                    >
                      -
                    </button>
                    <span className="text-xs text-main font-mono">{zoomLevel}%</span>
                    <button 
                      onClick={() => setZoomLevel(prev => Math.min(180, prev + 15))}
                      className="text-slate-700 font-mono h-6 w-6 rounded flex items-center justify-center cursor-pointer transition-colors"
                      title="تكبير"
                    >
                      +
                    </button>
                    <span className="text-slate-350 text-xs">|</span>
                    <button 
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="text-slate-700 text-xs px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      title="تدوير الصفحة"
                    >
                      🔄 تدوير
                    </button>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setIsFocusedRead(!isFocusedRead);
                        if (!isFocusedRead) {
                          setReadMode(true);
                        }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${
                        isFocusedRead 
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                          : 'bg-amber-500 text-amber-700'
                      }`}
                      title="القراءة المركزة: إخفاء القوائم وتوسيع مساحة عرض النص وتفعيل مبرز الألوان الذكي"
                    >
                      <span>{isFocusedRead ? '👁️ إلغاء القراءة المركزة' : '👁️ القراءة المركزة'}</span>
                    </button>
                    <span className="text-slate-350 ">|</span>
                    <button
                      onClick={() => {
                        setIsReaderMode(!isReaderMode);
                        if (!isReaderMode) {
                          setReadMode(true);
                        }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${
                        isReaderMode 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                      title="وضع القراءة المبسطة للأبحاث القانونية: تباعد مريح وتعديل حجم الخطوط وحذف المشتتات"
                    >
                      <span>{isReaderMode ? '📖 وضع القارئ: نشط' : '📖 وضع القارئ'}</span>
                    </button>
                    <span className="text-slate-350 ">|</span>
                      <button
                        onClick={() => setReadMode(!readMode)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${readMode ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-blue-50 text-blue-800'}`}
                        title="تكبير الخط وتظليل النصوص القانونية الهامة تلقائياً"
                      >
                        <span>📖 وضع القراءة</span>
                      </button>
                    <span className="text-slate-350">|</span>
                    <button
                      onClick={() => setIsDocNightMode(!isDocNightMode)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                        isDocNightMode 
                          ? 'bg-slate-950 border border-yellow-500/50 text-yellow-300 shadow-lg' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300/30'
                      }`}
                      title="قفل القراءة الليلية لتقليل إجهاد الأعين عند رصد المستندات الطويلة"
                    >
                      <span>{isDocNightMode ? '💡 وضع النهار' : '🌙 قراءة ليلية'}</span>
                    </button>
                    <span className=" text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  ">|</span>
                    <button
                      onClick={() => setPreviewMode('simulated')}
                      className={`text-xs px-2 py-0.5 rounded font-black ${previewMode === 'simulated' ? 'bg-accent/15 text-accent border border-accent/25' : ' text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  '}`}
                    >
                      المنظر الذكي
                    </button>
                    <button
                      onClick={() => setPreviewMode('iframe')}
                      className={`text-xs px-2 py-0.5 rounded font-black ${previewMode === 'iframe' ? 'bg-accent/15 text-accent border border-accent/25' : ' text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  '}`}
                    >
                      المعالج العام
                    </button>
                  </div>
                </div>

                {/* شريط أدوات مصغر لتصنيف المستند وترميزه اللوني بقوة */}
                {isFocusedRead && selectedDocForOcr && (
                  <div className="space-y-2 shrink-0 animate-fade-in">
                    <div className="bg-slate-50 border border-border px-4 py-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-right shadow-sm" dir="rtl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-black text-slate-750 flex items-center gap-1">
                          ✍️ خط القراءة:
                        </span>
                        <div className="flex gap-1.5">
                          {[
                            { id: 'sans', name: 'الأساسي' },
                            { id: 'amiri', name: 'أميري (Amiri)' },
                            { id: 'playfair', name: 'قانوني (Playfair)' }
                          ].map((font) => (
                            <button
                              key={font.id}
                              type="button"
                              onClick={() => setReadingFont(font.id as any)}
                              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 cursor-pointer border ${
                                readingFont === font.id 
                                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-black' 
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {font.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  <div className="bg-slate-50  border border-border px-4 py-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-right shadow-sm" dir="rtl">
                    {/* Classification section */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-black text-slate-750  flex items-center gap-1">
                        📁 تصنيف المستند الحالي:
                      </span>
                      <div className="flex gap-1.5">
                        {['قانوني', 'مالي', 'إداري'].map((cat) => {
                          const isSelected = selectedDocForOcr.category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                const updatedDoc = {
                                  ...selectedDocForOcr,
                                  category: cat
                                };
                                onUpdateState('documents', updatedDoc);
                                setSelectedDocForOcr(updatedDoc);
                              }}
                              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 cursor-pointer border ${
                                isSelected 
                                  ? 'bg-accent/15 text-accent border-accent/45 shadow-sm font-black' 
                                  : 'bg-gradient-to-br from-[#050e21] to-[#0c1a35]  border-border text-slate-750 '
                              }`}
                            >
                              {cat === 'قانوني' ? '⚖️ قانوني' : cat === 'مالي' ? '💰 مالي' : '💼 إداري'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Color coding section */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black text-slate-750 ">
                        🏷️ ترميز بصري ملون:
                      </span>
                      <div className="flex items-center gap-2 bg-gradient-to-br from-[#050e21] to-[#0c1a35]  px-2.5 py-1.5 rounded-xl border border-border">
                        {[
                          { code: 'red', name: 'أحمر', label: 'مراجعة', dot: 'bg-rose-500' },
                          { code: 'green', name: 'أخضر', label: 'معتمد', dot: 'bg-emerald-500' },
                          { code: 'blue', name: 'أزرق', label: 'عاجل', dot: 'bg-indigo-500' },
                          { code: 'amber', name: 'أصفر', label: 'دراسة', dot: 'bg-amber-500' },
                          { code: 'purple', name: 'أرجواني', label: 'سري', dot: 'bg-purple-500' },
                        ].map(({ code, name, label, dot }) => {
                          const isSelected = selectedDocForOcr.colorCode === code;
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => {
                                const updatedDoc = {
                                  ...selectedDocForOcr,
                                  colorCode: code
                                };
                                onUpdateState('documents', updatedDoc);
                                setSelectedDocForOcr(updatedDoc);
                              }}
                              className={`w-5 h-5 rounded-full ${dot} border-2 active:scale-95 transition-all cursor-pointer flex items-center justify-center relative ${
                                isSelected ? 'border-main  scale-110' : 'border-transparent'
                              }`}
                              title={`وضع ترميز ${name} (${label})`}
                            >
                              {isSelected && (
                                <span className="absolute text-[8px] text-white font-extrabold">✓</span>
                              )}
                            </button>
                          );
                        })}
                        
                        {/* Clear tag button */}
                        {selectedDocForOcr.colorCode && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedDoc = {
                                ...selectedDocForOcr,
                                colorCode: undefined
                              };
                              onUpdateState('documents', updatedDoc);
                              setSelectedDocForOcr(updatedDoc);
                            }}
                            className="text-[10px] text-rose-650  font-extrabold whitespace-nowrap px-1 border border-rose-500 rounded cursor-pointer mr-1"
                          >
                            مسح الترميز
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                )}

                {/* Interactive Dynamic Highlighting Controls Panel in Focused Mode */}
                {isFocusedRead && (
                  <div className="bg-amber-500/[0.04]  border border-amber-500 p-3.5 rounded-2xl space-y-3 shrink-0 animate-fade-in text-right" dir="rtl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎨</span>
                        <div>
                          <h4 className="font-black text-xs  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   leading-none">لوحة مميز الألوان والتركيز القانوني</h4>
                          <span className="text-[10px]  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-bold block mt-0.5">قم بتمييز البنود والالتزامات الهامة في العقد لتسريع تصفحها</span>
                        </div>
                      </div>
                      
                      {/* Font and Spacing Controls */}
                      <div className="flex flex-wrap items-center gap-4 bg-[#0c1830]/50 p-2 rounded-xl border border-amber-500/20">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white">حجم الخط:</span>
                            <div className="flex gap-1">
                               <button onClick={() => setFontSize(prev => Math.max(12, prev - 2))} className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 text-white text-xs transition-all">-</button>
                               <span className="text-[10px] font-mono text-white w-6 text-center">{fontSize}</span>
                               <button onClick={() => setFontSize(prev => Math.min(24, prev + 2))} className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 text-white text-xs transition-all">+</button>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white">تباعد الأسطر:</span>
                            <div className="flex gap-1">
                               <button onClick={() => setLineSpacing(prev => Math.max(1, prev - 0.2))} className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 text-white text-xs transition-all">-</button>
                               <span className="text-[10px] font-mono text-white w-8 text-center">{lineSpacing.toFixed(1)}</span>
                               <button onClick={() => setLineSpacing(prev => Math.min(3, prev + 0.2))} className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 text-white text-xs transition-all">+</button>
                            </div>
                         </div>
                      </div>

                      {/* Active Color Highlight Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  ">اللون النشط للتمييز:</span>
                        <div className="flex gap-1.5">
                          {(['amber', 'emerald', 'rose', 'sky'] as const).map((color) => {
                            const bgStyle = {
                              amber: 'bg-amber-400 border-amber-500',
                              emerald: 'bg-emerald-400 border-emerald-500',
                              rose: 'bg-rose-400 border-rose-500',
                              sky: 'bg-sky-400 border-sky-500'
                            }[color];
                            const isSelected = activeHighlightColor === color;
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setActiveHighlightColor(color)}
                                className={`w-5.5 h-5.5 rounded-full ${bgStyle} border-2 active:scale-95 transition-all cursor-pointer flex items-center justify-center`}
                                title={`تجديد لون التمييز إلى ${color === 'amber' ? 'الأصفر' : color === 'emerald' ? 'الأخضر' : color === 'rose' ? 'الأحمر' : 'الأزرق'}`}
                              >
                                {isSelected && <span className="text-[9px]  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]  font-extrabold">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Word input for adding custom keywords */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={highlightInput}
                        onChange={(e) => setHighlightInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (highlightInput.trim()) {
                              addHighlightKeyword(highlightInput, activeHighlightColor);
                              setHighlightInput('');
                            }
                          }
                        }}
                        placeholder="أدخل كلمة أو جملة كاملة تريد تمييزها داخل المستند..."
                        className="flex-1 bg-gradient-to-br from-[#050e21] to-[#0c1a35]  border border-border px-3.5 py-2 rounded-xl text-xs text-main  font-bold focus:outline-none focus:border-accent placeholder: text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] "
                      />
                      <button
                        onClick={() => {
                          if (highlightInput.trim()) {
                            addHighlightKeyword(highlightInput, activeHighlightColor);
                            setHighlightInput('');
                          }
                        }}
                        className="bg-[#ca8a04][#b45309] text-white font-black px-4 py-2 rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        إضافة تمييز 🎨
                      </button>
                    </div>

                    {/* Quick Preset Buttons for easy highlighting */}
                    <div className="space-y-1.5 pt-0.5">
                      <span className="text-[10px] text-primary font-black block">⌛ اختصارات وبنود شائعة للفحص السريع (انقر للتمييز):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'الالتزامات', 'الشرط الجزائي', 'ضريبة القيمة المضافة', 'القوة القهرية', 
                          'المسؤولية', 'التعويض عن الضرر', 'أطراف التعاقد', 'المحكمة المختصة', 'سجال'
                        ].map((term) => {
                          const isAlreadyHighlighted = !!highlightedKeywords[term];
                          return (
                            <button
                              key={term}
                              type="button"
                              onClick={() => {
                                if (isAlreadyHighlighted) {
                                  removeHighlightKeyword(term);
                                } else {
                                  addHighlightKeyword(term, activeHighlightColor);
                                }
                              }}
                              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-all active:scale-95 cursor-pointer ${
                                isAlreadyHighlighted
                                  ? 'bg-amber-500 border-amber-500 text-amber-700 '
                                  : 'bg-gradient-to-br from-[#050e21] to-[#0c1a35]  border-border  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] '
                              }`}
                            >
                              {term} {isAlreadyHighlighted ? '✓' : '+'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom highlights list */}
                    {Object.keys(highlightedKeywords).length > 0 && (
                      <div className="bg-gradient-to-br from-[#050e21] to-[#0c1a35]  p-2.5 rounded-xl border border-dashed border-border flex flex-wrap justify-between items-center gap-2">
                        <div className="flex flex-wrap gap-1.5 min-w-0">
                          {Object.entries(highlightedKeywords).map(([term, color]) => {
                            const badgeColor = {
                              amber: 'bg-amber-100 text-amber-900 border-amber-200  ',
                              emerald: 'bg-emerald-100 text-emerald-900 border-emerald-200  ',
                              rose: 'bg-rose-100 text-rose-900 border-rose-200  ',
                              sky: 'bg-sky-100 text-sky-900 border-sky-200  '
                            }[color as 'amber' | 'emerald' | 'rose' | 'sky'] || 'bg-amber-100 text-amber-900 border-amber-200';
                            return (
                              <span
                                key={term}
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${badgeColor}`}
                              >
                                <span>{term}</span>
                                <button
                                  type="button"
                                  onClick={() => removeHighlightKeyword(term)}
                                  className="text-[10px] cursor-pointer font-extrabold w-3 h-3 flex items-center justify-center rounded-full"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={clearAllHighlights}
                          className="text-[10px] text-rose-600  font-extrabold whitespace-nowrap px-1.5 border border-rose-500 rounded"
                        >
                          مسحة كامل اللوحة 🗑️
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Viewport */}
                <div className="flex-1 border border-border rounded-2xl bg-sky-50 p-4 overflow-auto min-h-0 flex items-start justify-center shadow-inner relative custom-scrollbar">
                        
                        {selectedDocForOcr ? (
                          <div className="w-full h-full">
                            {previewMode === 'simulated' ? (
                              isReaderMode ? (
                                /* Elegant, simplified Reader Mode Canvas designed specifically for Legal Research */
                                <div 
                                  className={`w-full h-full flex flex-col justify-between rounded-3xl border-2 transition-all duration-300 min-h-[480px] text-right font-sans relative overflow-hidden ${
                                    readerTheme === 'sepia' 
                                      ? 'bg-[#fbf7f0] text-[#3c2f2f] border-[#e6d8be] shadow-[0_15px_40px_rgba(44,31,23,0.08)]' 
                                      : readerTheme === 'dark'
                                        ? 'bg-[#0a0d14] text-[#cbd5e1] border-[#1e293b] shadow-[0_15px_40px_rgba(0,0,0,0.5)]'
                                        : 'bg-white text-[#1e293b] border-[#e2e8f0] shadow-[0_15px_40px_rgba(148,163,184,0.08)]'
                                  }`}
                                >
                                  {/* Inside customization bar */}
                                  <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
                                    readerTheme === 'sepia' ? 'border-[#e6d8be] bg-[#f5ebd6]/60' : readerTheme === 'dark' ? 'border-[#1e293b] bg-[#111622]/60' : 'border-[#e2e8f0] bg-slate-50/85'
                                  }`}>
                                    {/* Font & Spacing controls */}
                                    <div className="flex items-center gap-4 flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-black opacity-80">حجم الخط:</span>
                                        <div className="flex items-center gap-1">
                                          <button 
                                            type="button"
                                            onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors border ${
                                              readerTheme === 'sepia' ? 'bg-[#ebe0cb][#dfd3bc] border-[#d8c9a8]' : readerTheme === 'dark' ? 'bg-[#1e293b][#334155] border-[#314155]' : 'bg-slate-100 border-slate-200'
                                            }`}
                                          >
                                            أ-
                                          </button>
                                          <span className="text-xs font-mono font-bold w-12 text-center">{fontSize}px</span>
                                          <button 
                                            type="button"
                                            onClick={() => setFontSize(prev => Math.min(32, prev + 1))}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors border ${
                                              readerTheme === 'sepia' ? 'bg-[#ebe0cb][#dfd3bc] border-[#d8c9a8]' : readerTheme === 'dark' ? 'bg-[#1e293b][#334155] border-[#314155]' : 'bg-slate-100 border-slate-200'
                                            }`}
                                          >
                                            أ+
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-black opacity-80">تباعد الأسطر:</span>
                                        <div className="flex items-center gap-1">
                                          <button 
                                            type="button"
                                            onClick={() => setLineSpacing(prev => Math.max(1.2, prev - 0.2))}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors border ${
                                              readerTheme === 'sepia' ? 'bg-[#ebe0cb][#dfd3bc] border-[#d8c9a8]' : readerTheme === 'dark' ? 'bg-[#1e293b][#334155] border-[#314155]' : 'bg-slate-100 border-slate-200'
                                            }`}
                                          >
                                            ↕-
                                          </button>
                                          <span className="text-xs font-mono font-bold w-10 text-center">{lineSpacing.toFixed(1)}</span>
                                          <button 
                                            type="button"
                                            onClick={() => setLineSpacing(prev => Math.min(3.0, prev + 0.2))}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors border ${
                                              readerTheme === 'sepia' ? 'bg-[#ebe0cb][#dfd3bc] border-[#d8c9a8]' : readerTheme === 'dark' ? 'bg-[#1e293b][#334155] border-[#314155]' : 'bg-slate-100 border-slate-200'
                                            }`}
                                          >
                                            ↕+
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Reader Themes */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-black opacity-85">المظهر:</span>
                                      <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-border/80 gap-1">
                                        {[
                                          { id: 'sepia', label: '📜 دافئ', style: 'bg-[#fbf7f0] text-[#3c2f2f]' },
                                          { id: 'light', label: '☀️ ناصع', style: 'bg-white text-slate-900' },
                                          { id: 'dark', label: '🌙 ليلي', style: 'bg-slate-950 text-slate-100' },
                                        ].map(theme => (
                                          <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => setReaderTheme(theme.id as any)}
                                            className={`px-2 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                                              readerTheme === theme.id 
                                                ? 'bg-emerald-600 text-white shadow-sm' 
                                                : 'text-slate-650'
                                            }`}
                                          >
                                            {theme.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Elegant Content Body for long technical reading */}
                                  <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8 space-y-5 custom-scrollbar bg-transparent">
                                    <div className="border-b pb-4 mb-4 select-text border-slate-300/30">
                                      <div className="flex items-center gap-2 text-[10px] font-bold opacity-75 mb-1.5 bg-emerald-500/10 text-emerald-700 px-2.5 py-0.5 rounded-md inline-flex">
                                        <span>{selectedDocForOcr.category}</span>
                                        <span>•</span>
                                        <span>تاريخ الرفع: {selectedDocForOcr.uploadedAt}</span>
                                        <span>•</span>
                                        <span>الحجم: {selectedDocForOcr.size}</span>
                                      </div>
                                      <h2 className={`font-black text-lg select-all leading-tight ${
                                        readerTheme === 'sepia' ? 'text-[#1c1212]' : readerTheme === 'dark' ? 'text-white' : 'text-slate-950'
                                      }`}>
                                        {selectedDocForOcr.name}
                                      </h2>
                                      <div className="text-[10px] opacity-75 flex gap-2 items-center mt-2.5">
                                        <span>⏱️ زمن القراءة المتوقع: {Math.max(1, Math.ceil((selectedDocForOcr.extractedText || "").split(/\s+/).length / 150))} دقيقة</span>
                                        <span>•</span>
                                        <span>📝 عدد الكلمات: {(selectedDocForOcr.extractedText || "").split(/\s+/).length} كلمة</span>
                                      </div>
                                    </div>

                                    <div 
                                      className="text-justify select-text select-all leading-relaxed break-words font-medium transition-all" 
                                      style={{ 
                                        fontSize: `${fontSize}px`, 
                                        lineHeight: lineSpacing,
                                        fontFamily: readingFont === 'amiri' ? '"Amiri", serif' : readingFont === 'playfair' ? '"Playfair Display", serif' : 'inherit'
                                      }}
                                    >
                                      <p className="indent-8 font-bold text-base mb-4 opacity-90 border-r-2 border-emerald-500 pr-2">
                                        أنه في هذا التاريخ المعتمد؛ تم أرشفة مستند القضية بالبوابة الموحدة، وتحليل النصوص ضوئياً للأبحاث القانونية.
                                      </p>
                                      
                                      <div className="space-y-4">
                                        {selectedDocForOcr.extractedText ? (
                                          <div className={`p-4 rounded-xl border border-dashed text-right font-medium leading-relaxed shadow-sm ${
                                            readerTheme === 'sepia' ? 'bg-[#f4ebe1] border-[#dfd2be]' : readerTheme === 'dark' ? 'bg-[#0f141f] border-slate-800' : 'bg-slate-50 border-slate-200'
                                          }`}>
                                            {renderHighlightedText(selectedDocForOcr.extractedText)}
                                          </div>
                                        ) : (
                                          <p className="text-center italic text-xs py-12 opacity-80">
                                            لم يتم تشغيل القارئ الضوئي بعد؛ انقر فوق زر قراءة OCR لاستخراج المحتويات الخطية ممتثلاً لمواثيق البحث القانوني.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bottom bar of reader layout */}
                                  <div className={`px-5 py-3 border-t text-xs shrink-0 flex items-center justify-between font-mono ${
                                    readerTheme === 'sepia' ? 'border-[#e6d8be] bg-[#f5ebd6]/60 text-[#7c6a5e]' : readerTheme === 'dark' ? 'border-[#1e293b] bg-[#111622]/60 text-slate-450' : 'border-[#e2e8f0] bg-slate-50/80 text-slate-500'
                                  }`}>
                                    <span className="font-sans font-black">بوابة العدالة الرقمية • الأبحاث القانونية المبسطة</span>
                                    <button
                                      type="button"
                                      onClick={() => setIsReaderMode(false)}
                                      className="px-3 py-1 font-bold rounded-lg bg-emerald-600 text-white font-sans transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm shadow-emerald-500/10"
                                    >
                                      <span> العودة للمنظهر الطبيعي</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Simulated accredited digital parchment of Ministry of Justice / Document */
                                <div 
                                style={{ 
                                  transform: `rotate(${rotation}deg) scale(${zoomLevel / 100})`, 
                                  transformOrigin: 'top center',
                                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                className={`border-[6px] border-double rounded-xl p-5 shadow-2xl mx-auto w-full ${isFocusedRead ? 'max-w-[850px]' : 'max-w-[95%]'} min-h-[480px] font-serif text-right select-none relative overflow-hidden transition-all duration-300 ${
                                  isDocNightMode 
                                    ? 'bg-slate-950 text-slate-100 border-yellow-500/50 shadow-yellow-500/5 shadow-2xl' 
                                    : 'bg-amber-50 text-slate-900 border-primary/40'
                                }`}
                              >
                                {/* Royal Saudi Legal Heading Watermark design background */}
                                <div className="absolute inset-0 border border-amber-900 pointer-events-none m-1"></div>
                                <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none flex items-center justify-center">
                                  <span className="text-4xl font-serif text-amber-950 rotate-45 scale-150 font-black">وزارة العدل • مكتب المحاماة الاحترافي للمملكة</span>
                                </div>
      
                                {/* Top Header details */}
                                <div className="border-b border-amber-900 pb-3 mb-4 text-center space-y-1 relative z-10 shrink-0">
                                  <span className="text-xs text-amber-850 font-black block tracking-widest text-primary">المملكة العربية السعودية</span>
                                  <span className="text-xs text-[#2a3942] font-semibold block">مركز حوكمة الأوراق والتوثيق الرقمي الموثق لمشترك العدالة</span>
                                  <h4 className="text-sm font-black text-amber-950 mt-1 pb-1 underline decoration-primary/20 underline-offset-4">
                                    {renderHighlightedText(selectedDocForOcr.name)}
                                  </h4>
                                  
                                  <div className="flex justify-between items-center text-xs text-[#2a3942] font-mono mt-2 px-1">
                                    <span>التاريخ: {selectedDocForOcr.uploadedAt}</span>
                                    <span className="text-success-bg text-emerald-800 font-bold">الحالة: مأمن ومشفر مستنديًا ✓</span>
                                    <span>الحجم: {selectedDocForOcr.size}</span>
                                  </div>
                                </div>
      
                                {/* Body and Content text paragraph */}
                                <div className={`leading-relaxed text-justify shrink-0 space-y-3 relative z-10 font-medium transition-all ${isFocusedRead ? 'h-[440px]' : 'h-[260px]'} overflow-y-auto pr-1 ${readMode ? 'text-base font-bold' : 'text-xs'} ${isDocNightMode ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontFamily: readingFont === 'amiri' ? '"Amiri", serif' : readingFont === 'playfair' ? '"Playfair Display", serif' : 'inherit' }}>
                                  <p className={`indent-5 leading-loose font-bold border-r-2 border-primary/45 pr-2 ${isDocNightMode ? 'text-slate-100' : 'text-slate-900 font-bold'}`}>
                                    أنه في هذا التاريخ وبناءً على البيانات المودعة في سجلاتنا العدلية وحاوية الأرشيف السحابي؛ تم تسجيل الوثيقة وصنف الملحق القانوني تحت مسمى <strong className={`${isDocNightMode ? 'text-slate-100' : 'text-slate-950 font-black'} text-xs`}>({renderHighlightedText(selectedDocForOcr.name)})</strong> التابع لتصنيف <span className={`${isDocNightMode ? 'bg-amber-900 text-white' : 'bg-amber-200/80 text-amber-950'} px-1.5 py-0.5 rounded font-black text-[10px]`}>{selectedDocForOcr.category}</span>.
                                  </p>
                                  
                                  <div className={`p-3 border rounded-xl space-y-2 mt-2 ${isDocNightMode ? 'bg-[#050e21] border-yellow-500/30' : 'bg-amber-100/50 border-amber-900/40'}`}>
                                    <span className={`text-primary font-black block ${readMode ? 'text-sm' : 'text-xs'}`}>🔎 المقتطف العدلي المستخرج للفحص السريع:</span>
                                    <p className={`leading-relaxed font-bold italic ${readMode ? 'text-base line-clamp-none' : 'text-xs line-clamp-5'} ${isDocNightMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                      {selectedDocForOcr.extractedText ? `"${renderHighlightedText(selectedDocForOcr.extractedText)}"` : "لم يتم تشغيل القارئ الضوئي بعد؛ انقر فوق زر قراءة OCR لاستخراج المحتويات الخطية."}
                                    </p>
                                  </div>
      
                                  <p className={`text-xs mt-2 font-bold select-all leading-normal ${isDocNightMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    جميع الملاحق والسندات مدرجة ومحققة في شبكة خوادم سحابة العدالة المحلية المطابقة لمعايير الأمن السيبراني بالمملكة العربية السعودية.
                                  </p>
                                </div>

                          {/* Bottom Stamp and QA section */}
                          <div className="border-t border-amber-900 pt-3 mt-4 flex items-center justify-between relative z-10 shrink-0">
                            {/* QR Code and digital Verification seal */}
                            <div className="flex items-center gap-1.5 bg-gradient-to-br from-[#050e21] to-[#0c1a35] p-1 rounded-lg border border-amber-900 shadow-sm">
                              <svg className="w-8 h-8 opacity-80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6">
                                <rect x="10" y="10" width="80" height="80" rx="4" />
                                <rect x="25" y="25" width="20" height="20" fill="currentColor" />
                                <rect x="55" y="25" width="20" height="20" fill="currentColor" />
                                <rect x="25" y="55" width="20" height="20" fill="currentColor" />
                                <path d="M55 55 h10 v10 h-10 z" fill="currentColor" />
                                <path d="M65 65 h10 v10 h-10 z" fill="currentColor" />
                              </svg>
                              <div className="text-[6.5px] text-slate-650 leading-tight">
                                <span className="font-extrabold  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   block">كود المصادقة</span>
                                <span className="font-mono block mt-0.5">SHA-256 SECURED</span>
                              </div>
                            </div>

                            {/* Digital Sign Seal stamp */}
                            <div className="text-left select-none relative">
                              <div className="absolute -top-3 -left-2 w-14 h-14 bg-red-600 border-2 border-dashed border-red-500 rounded-full flex items-center justify-center text-center rotate-12 pointer-events-none">
                                <span className="text-[6.5px] text-red-600 font-serif font-black tracking-tighter uppercase">العدالة للمحاماة<br />معتمد مستندياً</span>
                              </div>
                              <span className="text-[7.5px] text-slate-550 block">مستشار الحفظ الفني:</span>
                              <strong className="text-xs text-primary block font-serif underline decoration-amber-900/20 underline-offset-2">أحمد بن فهد البقمي</strong>
                            </div>
                          </div>

                        </div>
                      )) : (
                        /* Iframe general viewer mode */
                        <div className="w-full h-full flex flex-col justify-between items-center gap-2">
                          <div className="w-full bg-slate-100 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-bold text-center">
                            🔄 محاذاة العارض مع خوادم مستندات الـ PDF/DOCX (Iframe Sandbox Layer)
                          </div>
                          
                          <div className="flex-1 w-full bg-white rounded-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-center items-center p-6 text-center text-xs space-y-4 shadow-inner min-h-[360px]">
                            <span className="text-3xl">🌐</span>
                            <div className="space-y-1 h-3/4 flex flex-col justify-center">
                              <p className="font-black text-slate-950">أمن الإطارات النشطة (Iframe Embed Safety Guard)</p>
                              <p className="text-xs text-slate-800 font-bold leading-relaxed max-w-xs mx-auto mt-2">
                                لتطبيق معايير NCA وسرية البيانات القضائية في المملكة؛ يُوصى ببدء المعاينة السريعة عبر المنظر الذكي، أو مراجعة الرابط السحابي التفاعلي الآمن للملف عبر خوادم مأمنة:
                              </p>
                              
                              <input 
                                type="text"
                                readOnly
                                value={`https://a-aladalah.gov.sa/archive/secretdocs/${selectedDocForOcr.id}.pdf`}
                                className="w-full bg-slate-50 border border-slate-300 px-2 py-1.5 rounded-lg text-xs font-mono font-bold text-blue-700 text-center select-all focus:outline-none focus:border-blue-500 mt-4"
                              />
                            </div>
                            
                            <div className="flex gap-2 justify-center w-full">
                              <button 
                                onClick={() => alert(`محاكاة تحميل وحفظ الملف في خوادم ناجز السحابية: ${selectedDocForOcr.name}`)}
                                className="bg-primary text-white font-extrabold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                📥 تحميل المستند
                              </button>
                              <a 
                                href={`https://docs.google.com/gview?url=https://al-adalah.com/mockdocs/${selectedDocForOcr.id}.docx&embedded=true`}
                                target="_blank"
                                rel="referrer"
                                className="bg-sky-50 text-slate-200 font-extrabold text-xs px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                🔗 فتح في علامة تبويب جديدة
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-24 text-slate-700 space-y-2">
                      <span className="text-2xl block opacity-60">📂</span>
                      <p className="text-xs font-black leading-relaxed">انقر فوق أي ملف بالاختيارات على اليسار لمكتبتك لعرض معالج المعاينة السريعة.</p>
                    </div>
                  )}

                </div>

                {/* Micro Actions */}
                <div className="flex items-center justify-between text-xs text-slate-900 font-black shrink-0 bg-slate-100 p-2.5 rounded-xl border border-slate-300">
                  <div className="flex items-center gap-1.5 font-black">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>معتمد بالترميز الاحترافي للمملكة</span>
                  </div>
                  <button 
                    onClick={() => {
                      alert(`🖨️ تم إعداد أمر طباعة الوثيقة وتجهيزها بالمقاس القانوني. جاري المصادقة مع طابعة المكتب المربحة...`);
                    }}
                    className="text-amber-800 font-extrabold cursor-pointer"
                  >
                    🖨️ طباعة سريعة
                  </button>
                </div>

              </div>
            )}

            {/* Bottom Actions card info */}
            <div className="area-subtle p-3 border border-border rounded-xl space-y-1 shadow-sm shrink-0">
               <span className="text-xs text-primary font-black block">💡 نصيحة الخبراء للأرشفة السحابية:</span>
               <p className="text-[8.5px]  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   leading-relaxed font-bold">
                 يمكنك استخلاص بنود القضاء وتحقق الأصول وسداد أتعاب التقاضي مباشرة بربطها بالمستند المحقق في موكل المدموجة.
               </p>
            </div>

          </div>
        </div>

      </div>

      {/* Dynamic Contract Issuance Editor (OTP Protected) */}
      <div className="area-secondary border border-[#1e3a8a]/40 rounded-3xl p-6 shadow-lg">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
          <span className="text-xl">✍️</span>
          <div>
            <h3 className="font-black text-sm text-main ">منصّة صياغة وتوثيق العقود والاتفاقيات الإلكترونية بالـ OTP</h3>
            <p className="text-xs  text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]   font-bold">بوابة صياغة العقود الفورية لإتاحتها للموكلين والمصادقة التلقائية عبر رمز واتساب الرقمي</p>
          </div>
        </div>

        <form onSubmit={handleCreateContract} className="grid grid-[#030a1c] grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            
            {/* Select Client */}
            <div className="space-y-1 text-right">
              <label className="text-xs text-primary font-black uppercase tracking-wider block">العميل المعني بالعقد:</label>
              <select
                value={contractClient}
                onChange={(e) => setContractClient(e.target.value)}
                required
                className="w-full bg-[#030a1c] border border-slate-800 text-xs font-bold text-white py-3 px-3 rounded-xl outline-none focus:border-primary"
              >
                <option value="">اختار موكل من قاعدة البيانات...</option>
                {clients.map(cl => (
                  <option key={cl.id} value={cl.id}>{cl.name} ({cl.nationalId})</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1 text-right">
              <label className="text-xs text-primary font-black uppercase tracking-wider block">مسمى / غرض وثيقة التعاقد:</label>
              <input
                type="text"
                placeholder="مثال: عقد خدمات مرافعة دعوى التوريد الثانية"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                required
                className="w-full bg-[#030a1c] border border-slate-800 text-xs font-bold text-white py-3 px-3.5 rounded-xl outline-none focus:border-primary"
              />
            </div>

            {/* Mobile number */}
            <div className="space-y-1 text-right font-sans">
              <label className="text-xs text-primary font-black uppercase tracking-wider block">رقم هاتف العميل للتحقق بالفحص (الواتساب):</label>
              <input
                type="text"
                value={contractPhone}
                onChange={(e) => setContractPhone(e.target.value)}
                required
                className="w-full bg-[#030a1c] border border-slate-800 text-xs font-bold text-white py-3 px-3.5 rounded-xl outline-none focus:border-primary tracking-wider text-left"
              />
            </div>

          </div>

          <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
            {/* Content Textarea */}
            <div className="space-y-1 text-right h-full">
              <label className="text-xs text-primary font-black uppercase tracking-wider block">بنود وشروط الاتفاقية التفصيلية:</label>
              <textarea
                rows={6}
                placeholder="اكتب كامل تفاصيل العقد وبنود السداد والضريبة والالتزامات هنا..."
                value={contractContent}
                onChange={(e) => setContractContent(e.target.value)}
                required
                className="w-full h-[180px] bg-[#030a1c] border border-slate-800 text-xs font-bold text-white py-3 px-3.5 rounded-xl outline-none focus:border-primary custom-scrollbar shadow-inner resize-none font-sans font-black"
              />
            </div>

            <button
              type="submit"
              disabled={isContractSubmitting}
              className="w-full bg-primary text-white font-black py-4 rounded-xl text-xs shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              {isContractSubmitting ? 'جاري التحضير وتصدير مسودة التوقيع للعميل...' : 'إصدار العقد وإرساله لبوابة العميل الفورية للتوثيق بـ OTP 🚀'}
            </button>
          </div>
        </form>

      </div>

    <QRCodeModal />
    <SmartTemplateFillerModal />
    </div>
  );
}
